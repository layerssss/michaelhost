import React from "react";
import gql from "graphql-tag";
import { useHistory } from "react-router";

import useAction from "../hooks/useAction";
import Widget from "../controls/Widget";
import Form from "../controls/Form";

export default React.memo(NewTerminalView);
function NewTerminalView({ useTitle }) {
  const title = "run command";
  useTitle(title);
  const history = useHistory();

  const runCommand = useAction(
    gql`
      mutation($command: String!, $name: String!, $cwd: String!) {
        runCommand(command: $command, name: $name, cwd: $cwd) {
          id
          name
          file
          args
        }
      }
    `,
    {
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
  );

  return (
    <>
      <Widget title={title}>
        <Form
          onSubmit={async ({ ...formData }) => {
            const result = await runCommand({
              ...formData,
            });
            history.push(`/terminals/${result.runCommand.id}`);
          }}
          fields={[
            ["String", "name", ""],
            ["String", "command", "", { required: true }],
            ["String", "cwd", ""],
          ]}
        />
      </Widget>
    </>
  );
}
