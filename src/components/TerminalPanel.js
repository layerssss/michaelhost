import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import EventListener from "react-event-listener";
import { Terminal as XTerm } from "xterm";
import * as fit from "xterm/lib/addons/fit/fit";
import "xterm/lib/xterm.css";
import { compose, withProps } from "recompose";
import { Button } from "react-bootstrap";

import withWebSocket from "../helpers/withWebSocket.js";
import ViewportPanel from "./ViewportPanel.js";

XTerm.applyAddon(fit);

export default compose(
  withProps(({ terminalId }) => ({
    webSocketPath: `/api/terminals/${terminalId}`,
  })),
  withWebSocket,
)(
  class Terminal extends React.Component {
    state = { alive: false };

    componentDidMount() {
      const { webSocket } = this.props;
      webSocket.addEventListener("message", event =>
        this.handleData(JSON.parse(event.data)),
      );

      this.xterm = new XTerm({
        cursorBlink: true,
      });
      this.xterm.open(this.refs.container);
      this.xterm.on("data", input => webSocket.send(JSON.stringify({ input })));
      this.xterm.on("resize", size => webSocket.send(JSON.stringify({ size })));
      this.xterm.fit();
    }

    handleData(data) {
      const { output, alive } = data;
      if (this.state.alive !== alive) this.setState({ alive });
      this.xterm.setOption("cursorBlink", alive);
      if (output) this.xterm.write(output);
    }

    render() {
      const { title, webSocket } = this.props;

      return (
        <>
          <EventListener target="window" onResize={() => this.xterm.fit()} />
          <ViewportPanel
            title={title}
            buttons={
              <>
                <Button
                  disabled={!this.state.alive}
                  bsStyle="danger"
                  bsSize="xs"
                  onClick={() =>
                    webSocket.send(
                      JSON.stringify({
                        kill: "yes",
                      }),
                    )
                  }
                >
                  <FontAwesomeIcon icon="power-off" />
                  Kill
                </Button>
              </>
            }
          >
            <div
              ref="container"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
              }}
            />
          </ViewportPanel>
        </>
      );
    }
  },
);
