import React from "react";
import { Helmet } from "react-helmet";
import gql from "graphql-tag";
import { compose, withProps } from "recompose";
import EventListener from "react-event-listener";
import { Terminal as XTerm } from "xterm";
import * as fit from "xterm/lib/addons/fit/fit";
import "xterm/lib/xterm.css";

import ViewportPanel from "./ViewportPanel.js";
import withWebSocket from "./withWebSocket.js";
import withData from "./withData.js";

XTerm.applyAddon(fit);

export default compose(
  withData(gql`
    query {
      hostname
    }
  `),
  withProps(({ data }) => ({
    webSocketPath: `/api/info`,
  })),
  withWebSocket,
)(
  class Log extends React.Component {
    componentDidMount() {
      const { webSocket } = this.props;
      webSocket.addEventListener("message", event =>
        this.xterm.write(event.data),
      );

      this.xterm = new XTerm();
      this.xterm.open(this.refs.container);
      this.xterm.fit();
    }

    render() {
      const { data } = this.props;
      return (
        <>
          <Helmet title={data.hostname} />
          <EventListener target="window" onResize={() => this.xterm.fit()} />
          <ViewportPanel title={data.hostname}>
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
