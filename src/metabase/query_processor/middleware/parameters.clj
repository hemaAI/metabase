(ns metabase.query-processor.middleware.parameters
  "Middleware for substituting parameters in queries."
  (:require
   [clojure.data :as data]
   [clojure.set :as set]
   [medley.core :as m]
   [metabase.mbql.normalize :as mbql.normalize]
   [metabase.mbql.schema :as mbql.s]
   [metabase.mbql.util :as mbql.u]
   [metabase.query-processor.middleware.parameters.mbql :as qp.mbql]
   [metabase.query-processor.middleware.parameters.native :as qp.native]
   [metabase.util :as u]
   [metabase.util.log :as log]
   [metabase.util.malli :as mu]))

(defn- join? [m]
  (:condition m))

(mu/defn ^:private move-join-condition-to-source-query :- mbql.s/Join
  "Joins aren't allowed to have `:filter` clauses, generated by the `expand-mbql-params` function below. Move the filter
  clause into the `:source-query`, converting `:source-table` to a source query if needed."
  [{:keys [source-table], filter-clause :filter, :as join}]
  (if-not filter-clause
    join
    (if source-table
      (-> (assoc join :source-query {:source-table source-table, :filter filter-clause})
          (dissoc :source-table :filter))
      ;; putting parameters in a join that has a `:source-query` is a little wacky (just add them to `:parameters` in
      ;; the source query itself), but we'll allow it for now
      (-> (update-in join [:source-query :filter] mbql.u/combine-filter-clauses filter-clause)
          (dissoc :filter)))))

(defn- expand-mbql-params [outer-query {:keys [parameters], :as m}]
  ;; HACK `qp.mbql/expand` assumes it's operating on an outer query so wrap `m` to look like an outer query. TODO
  ;; - fix `qp.mbql` to operate on abitrary maps instead of only on top-level queries.
  (let [wrapped           (assoc outer-query :query m)
        {expanded :query} (qp.mbql/expand (dissoc wrapped :parameters) parameters)]
    (cond-> expanded
      (join? m) move-join-condition-to-source-query)))

(defn- expand-one
  "Expand `:parameters` in one inner-query-style map that contains them."
  [outer-query {:keys [source-table source-query parameters], :as m}]
  ;; HACK - normalization does not yet operate on `:parameters` that aren't at the top level, so double-check that
  ;; they're normalized properly before proceeding.
  (let [m        (cond-> m
                   (seq parameters) (update :parameters (partial mbql.normalize/normalize-fragment [:parameters])))
        expanded (if (or source-table source-query)
                   (expand-mbql-params outer-query m)
                   (qp.native/expand-inner m))]
    (dissoc expanded :parameters :template-tags)))

(defn- expand-all
  "Expand all `:parameters` anywhere in the query."
  ([outer-query]
   (expand-all outer-query outer-query))

  ([outer-query m]
   (mbql.u/replace m
     (_ :guard (every-pred map? (some-fn :parameters :template-tags)))
     (let [expanded (expand-one outer-query &match)]
       ;; now recursively expand any remaining maps that contain `:parameters`
       (expand-all outer-query expanded)))))

(mu/defn ^:private move-top-level-params-to-inner-query
  "Move any top-level parameters to the same level (i.e., 'inner query') as the query they affect."
  [{:keys [info parameters], query-type :type, :as outer-query} :- [:map [:type [:enum :query :native]]]]
  (cond-> (set/rename-keys outer-query {:parameters :user-parameters})
    ;; TODO: Native models should be within scope of dashboard filters, by applying the filter on an outer stage.
    ;; That doesn't work, so the logic below requires MBQL queries only to fix the regression.
    ;; Native models don't actual get filtered even when linked to dashboard filters, but that's not a regression.
    ;; This can be fixed properly once this middleware is powered by MLv2. See #40011.
    (and (seq parameters)
         (:metadata/model-metadata info)
         (= query-type :query))          (update query-type (fn [inner-query] {:source-query inner-query}))
    (seq parameters)                     (assoc-in [query-type :parameters] parameters)))

(defn- expand-parameters
  "Expand parameters in the `outer-query`, and if the query is using a native source query, expand params in that as
  well."
  [outer-query]
  (-> outer-query move-top-level-params-to-inner-query expand-all))

(mu/defn ^:private substitute-parameters* :- :map
  "If any parameters were supplied then substitute them into the query."
  [query]
  (u/prog1 (expand-parameters query)
    (when (not= <> query)
      (when-let [diff (second (data/diff query <>))]
        (log/tracef "\n\nSubstituted params:\n%s\n" (u/pprint-to-str 'cyan diff))))))

(defn- assoc-db-in-snippet-tag
  [db template-tags]
  (->> template-tags
       (m/map-vals
        (fn [v]
          (cond-> v
            (= (:type v) :snippet) (assoc :database db))))
       (into {})))

(defn- hoist-database-for-snippet-tags
  "Assocs the `:database` ID from `query` in all snippet template tags."
  [query]
  (u/update-in-if-exists query [:native :template-tags] (partial assoc-db-in-snippet-tag (:database query))))

(defn substitute-parameters
  "Substitute Dashboard or Card-supplied parameters in a query, replacing the param placeholers with appropriate values
  and/or modifiying the query as appropriate. This looks for maps that have the key `:parameters` and/or
  `:template-tags` and removes those keys, splicing appropriate conditions into the queries they affect.

  A SQL query with a param like `{{param}}` will have that part of the query replaced with an appropriate snippet as
  well as any prepared statement args needed. MBQL queries will have additional filter clauses added."
  [query]
  (-> query
      hoist-database-for-snippet-tags
      substitute-parameters*))
