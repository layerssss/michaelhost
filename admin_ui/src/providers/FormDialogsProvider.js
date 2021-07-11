import React, { useState } from "react";
import serialize from "form-serialize";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  FormControlLabel,
  InputLabel,
  Checkbox,
  MenuItem,
  Select,
} from "@material-ui/core";

export const formDialogsContext = React.createContext();
export default React.memo(FormDialogsProvider);

function FormDialogsProvider({ children }) {
  const [formDialogs, formDialogsSet] = useState([]);
  const formDialog = formDialogs[0];
  const formDialogClose = () =>
    formDialogsSet((formDialogs) =>
      formDialogs.map((f) =>
        f.id !== formDialog.id ? f : { ...f, open: false },
      ),
    );

  return (
    <formDialogsContext.Provider value={{ formDialogsSet }}>
      <Dialog
        fullWidth
        open={!!formDialog?.open}
        onClose={() => {
          formDialogClose();
          formDialog.cancel();
        }}
        TransitionProps={{
          onExited: () =>
            formDialogsSet((formDialogs) =>
              formDialogs.filter((f) => f.id !== formDialog.id),
            ),
        }}
        PaperProps={{
          component: "form",
          onSubmit: async (event) => {
            event.preventDefault();
            const formData = serialize(event.target, {
              hash: true,
              empty: true,
            });
            for (const [fieldType, name] of formDialog.fields) {
              if (fieldType === "Boolean")
                formData[name] = Boolean(formData[name]);
            }

            formDialogClose();
            formDialog.done(formData);
          },
        }}
      >
        <DialogTitle>{formDialog?.title}</DialogTitle>
        <DialogContent>
          {formDialog?.fields.map(
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
                    {...options}
                  />
                </div>
              );
            },
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              formDialogClose();
              formDialog.cancel();
            }}
            color="primary"
          >
            Cancel
          </Button>
          <Button type="submit" color="primary">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
      {children}
    </formDialogsContext.Provider>
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
        {options.map((option) => (
          <MenuItem key={option} value={option}>
            {option}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
});
