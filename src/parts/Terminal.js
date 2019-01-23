import React from "react";
import { Helmet } from "react-helmet";
import gql from "graphql-tag";
import { Terminal as XTerm } from "xterm";
import * as fit from "xterm/lib/addons/fit/fit";
import "xterm/lib/xterm.css";
import { compose } from "recompose";

import withData from "../helpers/withData.js";
import withRouter from "../helpers/withRouter.js";
import TerminalPanel from "../components/TerminalPanel.js";

XTerm.applyAddon(fit);

export default compose(
  withRouter,
  withData(
    gql`
      query($terminalId: ID!) {
        terminal(id: $terminalId) {
          id
          name
        }
      }
    `,
    ({ params }) => ({
      terminalId: params.terminalId,
    }),
  ),
)(({ data }) => (
  <>
    <Helmet title={data.terminal.name} />
    <TerminalPanel title={data.terminal.name} terminalId={data.terminal.id} />
  </>
));
