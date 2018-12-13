import React from "react";
import { Helmet } from "react-helmet";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import gql from "graphql-tag";
import EventListener from "react-event-listener";
import { graphql } from "react-apollo";
import { Terminal as XTerm } from "xterm";
import * as fit from "xterm/lib/addons/fit/fit";
import "xterm/lib/xterm.css";
import { compose, withProps } from "recompose";
import ShellQuote from "shell-quote";
import {
  Panel,
  Button,
  ButtonToolbar,
  FormGroup,
  FormControl,
  ControlLabel,
} from "react-bootstrap";

import withData from "./withData.js";
import withWebSocket from "./withWebSocket.js";
import withRouter from "./withRouter.js";
import ViewportPanel from "./ViewportPanel.js";

XTerm.applyAddon(fit);

export default compose(
  withRouter,
  withData(
    gql`
      query($terminalId: ID!) {
        terminal(id: $terminalId) {
          id
          name
          file
          args
        }
      }
    `,
    ({ params }) => ({
      terminalId: params.terminalId,
    }),
  ),
  graphql(
    gql`
      mutation($id: ID!) {
        deleteTerminal(id: $id) {
          id
        }
      }
    `,
    {
      name: "deleteTerminal",
      options: {
        refetchQueries: [
          {
            query: gql`
              {
                terminals {
                  id
                }
              }
            `,
          },
        ],
      },
    },
  ),
  withProps(({ data }) => ({
    webSocketPath: `/api/terminals/${data.terminal.id}`,
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
      if (output) this.xterm.write(output);
    }

    render() {
      const {
        data,
        webSocket,
        history,
        terminalsPath,
        deleteTerminal,
      } = this.props;

      return (
        <>
          <Helmet title={data.terminal.name} />
          <EventListener target="window" onResize={() => this.xterm.fit()} />
          <Panel>
            <Panel.Body>
              <FormGroup>
                <ControlLabel>file:</ControlLabel>
                <FormControl.Static>{data.terminal.file}</FormControl.Static>
              </FormGroup>
              <FormGroup>
                <ControlLabel>args:</ControlLabel>
                <FormControl.Static>
                  {ShellQuote.quote(data.terminal.args)}
                </FormControl.Static>
              </FormGroup>
              <ButtonToolbar>
                <Button
                  disabled={!this.state.alive}
                  bsStyle="danger"
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
                <Button
                  disabled={this.state.alive}
                  bsStyle="info"
                  onClick={async () => {
                    await deleteTerminal({
                      variables: { id: data.terminal.id },
                    });
                    history.push(terminalsPath());
                  }}
                >
                  <FontAwesomeIcon icon="trash" />
                  Delete
                </Button>
              </ButtonToolbar>
            </Panel.Body>
          </Panel>
          <ViewportPanel title={data.terminal.name}>
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
