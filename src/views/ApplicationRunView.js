import React from "react";
import gql from "graphql-tag";
import { useHistory } from "react-router";

import useAction from "../hooks/useAction";
import useData from "../hooks/useData";
import Widget from "../controls/Widget";
import Form from "../controls/Form";

export default React.memo(ApplicationRunView);
function ApplicationRunView({ useTitle, applicationId }) {
  const title = "logs";
  useTitle(title);
  const history = useHistory();

  const [data] = useData(
    gql`
      query ApplicationRunView($applicationId: ID!) {
        composeApplication(id: $applicationId) {
          id
          serviceNames
        }
      }
    `,
    { applicationId },
  );

  const composeRun = useAction(
    gql`
      mutation($applicationId: ID!, $serviceName: String!, $command: String!) {
        composeRun(
          id: $applicationId
          serviceName: $serviceName
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
            await composeRun({
              applicationId,
              ...formData,
            });
            history.push(`/applications/${applicationId}`);
          }}
          fields={[
            //
            [
              "Select",
              "serviceName",
              "",
              {
                required: true,
                options: data?.composeApplication.serviceNames,
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
