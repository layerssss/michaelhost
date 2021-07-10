import React, { useState } from "react";
import { Fab, Tooltip } from "@material-ui/core";
import { SpeedDial, SpeedDialAction } from "@material-ui/lab";
import { RadioboxBlank, DotsVertical } from "mdi-material-ui";

export default React.memo(Actions);

function Actions({ actions = [] }) {
  const [open, openSet] = useState(false);
  return (
    <>
      {actions.length === 1 && (
        <Tooltip title={actions[0].title} placement="left">
          <Fab
            style={{
              zIndex: 1000,
              position: "fixed",
              right: 10,
              bottom: 10,
            }}
            href={actions[0].href}
            onClick={actions[0].onClick}
            disabled={actions[0].disabled}
            color="secondary"
          >
            {actions[0].icon || <RadioboxBlank />}
          </Fab>
        </Tooltip>
      )}
      {actions.length > 1 && (
        <SpeedDial
          style={{
            zIndex: 1000,
            position: "fixed",
            right: 10,
            bottom: 10,
          }}
          ariaLabel="SpeedDial"
          icon={<DotsVertical />}
          onClose={() => openSet(false)}
          onOpen={() => openSet(true)}
          open={open}
        >
          {actions.map(
            ({ title, disabled, onClick, href, icon = <RadioboxBlank /> }) => (
              <SpeedDialAction
                key={title}
                tooltipTitle={title}
                icon={icon}
                disabled={disabled}
                onClick={() => {
                  if (onClick) onClick();
                  openSet(false);
                }}
                href={href}
              />
            ),
          )}
        </SpeedDial>
      )}
    </>
  );
}
