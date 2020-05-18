import React from "react";
import gql from "graphql-tag";
import { useHistory } from "react-router";

import useAction from "../hooks/useAction";
import useData from "../hooks/useData";
import Widget from "../controls/Widget";
import Form from "../controls/Form";

export default React.memo(ApplicationExecView);
function ApplicationExecView({ useTitle, applicationId }) {
  const title = "logs";
  useTitle(title);
  const history = useHistory();

  const [data] = useData(
    gql`
      query ApplicationExecView($applicationId: ID!) {
        composeApplication(id: $applicationId) {
          id
          containers {
            id
          }
        }
      }
    `,
    { applicationId },
  );

  const composeExec = useAction(
    gql`
      mutation(
        $applicationId: ID!
        $composeContainerId: ID!
        $command: String!
      ) {
        composeExec(
          id: $applicationId
          composeContainerId: $composeContainerId
          command: $command
        ) {
          id
        }
      }
    `,
  );

  return (
    <>
      <Widget title={title}>
        <Form
          onSubmit={async ({ ...formData }) => {
            await composeExec({
              applicationId,
              ...formData,
            });
            history.push(`/applications/${applicationId}`);
          }}
          fields={[
            //
            [
              "Select",
              "composeContainerId",
              "",
              {
                required: true,
                options: data?.composeApplication.containers.map(c => c.id),
              },
            ],
            [
              "String",
              "command",
              "",
              {
                required: true,
              },
            ],
          ]}
        />
      </Widget>
    </>
  );
}
