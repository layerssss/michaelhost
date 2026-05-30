import React from "react";
import { TextField } from "@mui/material";

export default React.memo(Form);

function Form({ fields = [] }) {
  return (
    <div
      style={{
        padding: 5,
      }}
    >
      {fields.map(([label, value]) => (
        <div style={{ margin: 5 }} key={label}>
          <TextField
            fullWidth
            disabled
            label={label}
            value={value === undefined ? "-" : String(value)}
          />
        </div>
      ))}
    </div>
  );
}
