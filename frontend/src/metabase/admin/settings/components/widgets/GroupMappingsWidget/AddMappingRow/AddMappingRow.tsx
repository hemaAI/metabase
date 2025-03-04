import type * as React from "react";
import { useState } from "react";
import { t } from "ttag";

import type { MappingsType } from "metabase/admin/types";
import Button from "metabase/core/components/Button";

type AddMappingRowProps = {
  mappings: MappingsType;
  placeholder: string;
  onCancel: () => void;
  onAdd: (value: string) => void | Promise<void>;
};

function AddMappingRow({
  mappings,
  placeholder,
  onCancel,
  onAdd,
}: AddMappingRowProps) {
  const [value, setValue] = useState("");

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Enter key
    if (e.keyCode === 13) {
      handleSubmit();
    }
  };

  const handleSubmit = async (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    await onAdd(value);
    setValue("");
  };

  const handleCancelClick = () => {
    onCancel();
    setValue("");
  };

  const isMappingNameUnique = value && mappings[value] === undefined;

  return (
    <tr>
      <td colSpan={3} style={{ padding: 0 }}>
        <div className="m2 p1 bordered border-brand justify-between rounded relative flex align-center">
          <input
            aria-label="new-group-mapping-name-input"
            className="input--borderless h3 ml1 flex-full"
            type="text"
            value={value}
            placeholder={placeholder}
            autoFocus
            onChange={e => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <div>
            <Button borderless onClick={handleCancelClick}>{t`Cancel`}</Button>
            <Button
              className="ml2"
              type="submit"
              primary={!!isMappingNameUnique}
              disabled={!isMappingNameUnique}
              onClick={() => (isMappingNameUnique ? handleSubmit() : undefined)}
            >{t`Add`}</Button>
          </div>
        </div>
      </td>
    </tr>
  );
}

// eslint-disable-next-line import/no-default-export -- deprecated usage
export default AddMappingRow;
