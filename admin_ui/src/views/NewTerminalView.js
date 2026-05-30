import React from "react";
import gql from "graphql-tag";
import { useNavigate } from "react-router";

import useAction from "../hooks/useAction";
import Widget from "../controls/Widget";
import Form from "../controls/Form";

export default NewTerminalView;
function NewTerminalView({ useTitle }) {
  const title = "run command";
  useTitle(title);
  const navigate = useNavigate();

  const runCommand = useAction(
    gql`
      mutation ($command: String!, $name: String!, $cwd: String!) {
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
            navigate(`/terminals/${result.runCommand.id}`);
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
