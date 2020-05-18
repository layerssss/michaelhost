import React from "react";
import gql from "graphql-tag";
import { Console } from "mdi-material-ui";

import useData from "../hooks/useData";
import Widget from "../controls/Widget";
import Terminal from "./Terminal";

export default React.memo(TerminalView);
function TerminalView({ terminalId, useTitle }) {
  const [data] = useData(
    gql`
      query TerminalView($terminalId: ID!) {
        terminal(id: $terminalId) {
          id
          name
        }
      }
    `,
    { terminalId },
  );
  const title = `terminal: ${data?.terminal.name}`;

  return (
    <>
      <Widget title={title} icon={<Console />}>
        <div style={{ height: "calc(100vh - 150px)" }}>
          <Terminal terminalId={terminalId} />
        </div>
      </Widget>
    </>
  );
}
