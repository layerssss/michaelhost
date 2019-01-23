import { Panel, ButtonToolbar, Button } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { compose, withState } from "recompose";
import React from "react";
import _ from "lodash";

export default compose(
  // wrap
  withState("fullscreen", "setFullscreen", ({ fullscreen }) => !!fullscreen),
)(({ title, children, fullscreen, setFullscreen, buttons = null }) => (
  <Panel
    style={{
      display: "flex",
      justifyContent: "stretch",
      flexFlow: "column nowrap",
      ...(fullscreen
        ? {
            position: "fixed",
            left: 0,
            top: 50,
            right: 0,
            bottom: 0,
            margin: 0,
            zIndex: 1,
          }
        : {
            height: 640,
          }),
    }}
  >
    <Panel.Heading
      className="clearfix"
      style={{
        flex: "0 0 auto",
      }}
    >
      {title}
      <ButtonToolbar className="pull-right">
        {buttons}
        <Button
          bsSize="xs"
          onClick={() => {
            setFullscreen(!fullscreen);
            _.defer(() => window.dispatchEvent(new Event("resize")));
          }}
        >
          <FontAwesomeIcon icon="expand" />
          Toggle Full Screen
        </Button>
      </ButtonToolbar>
    </Panel.Heading>
    <div
      style={{
        position: "relative",
        flex: "1 1 auto",
      }}
    >
      {children}
    </div>
  </Panel>
));