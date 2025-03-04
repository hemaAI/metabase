import cx from "classnames";
import PropTypes from "prop-types";
import { t } from "ttag";
import _ from "underscore";

import SendTestPulse from "metabase/components/SendTestPulse";
import SchedulePicker from "metabase/containers/SchedulePicker";
import Toggle from "metabase/core/components/Toggle";
import CS from "metabase/css/core/index.css";
import { Sidebar } from "metabase/dashboard/components/Sidebar";
import { dashboardPulseIsValid } from "metabase/lib/pulse";
import { PLUGIN_DASHBOARD_SUBSCRIPTION_PARAMETERS_SECTION_OVERRIDE } from "metabase/plugins";
import { Icon } from "metabase/ui";

import SlackChannelField from "../SlackChannelField";

import { CaveatMessage } from "./CaveatMessage";
import DefaultParametersSection from "./DefaultParametersSection";
import DeleteSubscriptionAction from "./DeleteSubscriptionAction";
import Heading from "./Heading";
import { CHANNEL_NOUN_PLURAL } from "./constants";

function _AddEditSlackSidebar({
  pulse,
  formInput,
  channel,
  channelSpec,
  parameters,
  dashboard,
  // form callbacks
  handleSave,
  onCancel,
  onChannelPropertyChange,
  onChannelScheduleChange,
  testPulse,
  toggleSkipIfEmpty,
  handleArchive,
  setPulseParameters,
}) {
  const isValid = dashboardPulseIsValid(pulse, formInput.channels);

  return (
    <Sidebar
      isCloseDisabled={!isValid}
      onClose={handleSave}
      onCancel={onCancel}
    >
      <div className="pt4 flex align-center px4">
        <Icon name="slack" className="mr1" size={21} />
        <Heading>{t`Send this dashboard to Slack`}</Heading>
      </div>
      <CaveatMessage />
      <div className="my2 px4 full-height flex flex-column">
        {channelSpec.fields && (
          <SlackChannelField
            channel={channel}
            channelSpec={channelSpec}
            onChannelPropertyChange={onChannelPropertyChange}
          />
        )}
        <SchedulePicker
          schedule={_.pick(
            channel,
            "schedule_day",
            "schedule_frame",
            "schedule_hour",
            "schedule_type",
          )}
          scheduleOptions={channelSpec.schedules}
          textBeforeInterval={t`Sent`}
          textBeforeSendTime={t`${
            CHANNEL_NOUN_PLURAL[channelSpec && channelSpec.type] || t`Messages`
          } will be sent at`}
          onScheduleChange={(newSchedule, changedProp) =>
            onChannelScheduleChange(newSchedule, changedProp)
          }
        />
        <div className="pt2 pb1">
          <SendTestPulse
            channel={channel}
            channelSpecs={formInput.channels}
            pulse={pulse}
            testPulse={testPulse}
            normalText={t`Send to Slack now`}
            successText={t`Slack sent`}
            disabled={!isValid}
          />
        </div>

        {PLUGIN_DASHBOARD_SUBSCRIPTION_PARAMETERS_SECTION_OVERRIDE.Component ? (
          <PLUGIN_DASHBOARD_SUBSCRIPTION_PARAMETERS_SECTION_OVERRIDE.Component
            className={cx(CS.py3, CS.mt2, CS.borderTop)}
            parameters={parameters}
            dashboard={dashboard}
            pulse={pulse}
            setPulseParameters={setPulseParameters}
          />
        ) : (
          <DefaultParametersSection
            className={cx(CS.py3, CS.mt2, CS.borderTop)}
            parameters={parameters}
          />
        )}
        <div
          className={cx(
            CS.textBold,
            CS.py2,
            CS.flex,
            "justify-between",
            CS.alignCenter,
            CS.borderTop,
          )}
        >
          <Heading>{t`Don't send if there aren't results`}</Heading>
          <Toggle
            value={pulse.skip_if_empty || false}
            onChange={toggleSkipIfEmpty}
          />
        </div>
        {pulse.id != null && (
          <DeleteSubscriptionAction
            pulse={pulse}
            handleArchive={handleArchive}
          />
        )}
        <div className="p2 mt-auto text-small text-medium">
          {t`Charts in subscriptions may look slightly different from charts in dashboards.`}
        </div>
      </div>
    </Sidebar>
  );
}

_AddEditSlackSidebar.propTypes = {
  pulse: PropTypes.object,
  formInput: PropTypes.object.isRequired,
  channel: PropTypes.object.isRequired,
  channelSpec: PropTypes.object.isRequired,
  users: PropTypes.array,
  parameters: PropTypes.array.isRequired,
  dashboard: PropTypes.object.isRequired,
  handleSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  onChannelPropertyChange: PropTypes.func.isRequired,
  onChannelScheduleChange: PropTypes.func.isRequired,
  testPulse: PropTypes.func.isRequired,
  toggleSkipIfEmpty: PropTypes.func.isRequired,
  handleArchive: PropTypes.func.isRequired,
  setPulseParameters: PropTypes.func.isRequired,
};

export default _AddEditSlackSidebar;
