import React, { useState } from "react";
import {
  InputLabel,
  MenuItem,
  TextField,
  Checkbox,
  FormControl,
  FormControlLabel,
  CardActions,
  Select,
  Button,
} from "@material-ui/core";
import serialize from "form-serialize";

export default React.memo(Form);

function Form({ fields = [], onSubmit }) {
  const [loading, loadingSet] = useState(false);
  return (
    <form
      style={{
        padding: 5,
      }}
      onSubmit={async event => {
        event.preventDefault();
        const formData = serialize(event.target, {
          hash: true,
          empty: true,
        });
        for (const [fieldType, name] of fields) {
          if (fieldType === "Boolean") formData[name] = Boolean(formData[name]);
        }

        loadingSet(true);
        try {
          onSubmit(formData);
        } finally {
          loadingSet(false);
        }
      }}
    >
      {fields.map(
        ([fieldType, name, defaultValue, { label, ...options } = {}]) => {
          const Field = {
            String: TextField,
            Boolean: BooleanField,
            Select: SelectField,
          }[fieldType];
          if (!Field) throw new Error(`Invalid fieldType: ${fieldType}!`);

          return (
            <div style={{ margin: 5 }} key={name}>
              <Field
                name={name}
                label={
                  label ||
                  name.replace(
                    /[A-Z]/g,
                    (char, index) =>
                      (index !== 0 ? " " : "") + char.toLowerCase(),
                  )
                }
                fullWidth
                defaultValue={defaultValue}
                disabled={loading}
                {...options}
              />
            </div>
          );
        },
      )}
      <CardActions>
        <Button type="submit" color="primary" variant="contained">
          submit
        </Button>
      </CardActions>
    </form>
  );
}

const BooleanField = React.memo(function BooleanField({
  name,
  defaultValue,
  label,
  disabled,
}) {
  return (
    <FormControl fullWidth disabled={disabled}>
      <FormControlLabel
        style={{ marginLeft: 0 }}
        label={label}
        control={
          <Checkbox
            size="small"
            name={name}
            defaultChecked={defaultValue}
            value="yes"
          />
        }
      />
    </FormControl>
  );
});

const SelectField = React.memo(function SelectField({
  name,
  defaultValue,
  label,
  disabled,
  options = [],
  ...others
}) {
  return (
    <FormControl fullWidth disabled={disabled} {...others}>
      <InputLabel>{label}</InputLabel>
      <Select name={name} disabled={disabled} defaultValue={defaultValue}>
        {options.map(option => (
          <MenuItem key={option} value={option}>
            {option}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
});
