import React from "react";
import gql from "graphql-tag";
import { useHistory } from "react-router";

import useAction from "../hooks/useAction";
import useData from "../hooks/useData";
import Widget from "../controls/Widget";
import Form from "../controls/Form";

export default React.memo(ApplicationLogsView);
function ApplicationLogsView({ useTitle, applicationId }) {
  const title = "logs";
  useTitle(title);
  const history = useHistory();

  const [data] = useData(
    gql`
      query ApplicationLogsView($applicationId: ID!) {
        composeApplication(id: $applicationId) {
          id
          serviceNames
        }
      }
    `,
    { applicationId },
  );

  const composeLogs = useAction(
    gql`
      mutation($applicationId: ID!, $serviceName: String!) {
        composeLogs(id: $applicationId, serviceName: $serviceName) {
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
            await composeLogs({
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
          ]}
        />
      </Widget>
    </>
  );
}
