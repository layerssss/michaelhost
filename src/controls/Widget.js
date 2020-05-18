import React from "react";
import { Card, CardHeader, Avatar } from "@material-ui/core";

export default React.memo(Widget);

function Widget({ icon, title, subtitle, children, size = "small" }) {
  return (
    <Card
      style={{
        flex: "1 1 auto",
        margin: 5,
        width:
          {
            small: 300,
            medium: 500,
            large: 700,
          }[size] || 300,
        display: "flex",
        flexFlow: "column nowrap",
        justifyContent: "stretch",
      }}
    >
      <CardHeader
        avatar={icon && <Avatar style={{ overflow: "visible" }}>{icon}</Avatar>}
        title={title}
        subtitle={subtitle}
      />
      {children}
    </Card>
  );
}
