import React from "react";
import { Chip, CardActions, Button } from "@material-ui/core";

export default React.memo(Table);

function Table({ items = [], href }) {
  return (
    <>
      <div style={{ flex: "1 0 auto" }}>
        {items.map(([title, href]) => (
          <Chip
            key={href}
            style={{ margin: 5 }}
            component="a"
            clickable
            href={href}
            label={title}
          />
        ))}
      </div>
      {href && (
        <CardActions style={{ justifyContent: "flex-end" }}>
          <Button href={href}>more...</Button>
        </CardActions>
      )}
    </>
  );
}
