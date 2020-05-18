import React from "react";
import uuid from "uuid";
import gql from "graphql-tag";
import { useHistory } from "react-router";

import useAction from "../hooks/useAction";
import Widget from "../controls/Widget";
import Form from "../controls/Form";

export default React.memo(NewApplicationView);
function NewApplicationView({ useTitle }) {
  useTitle("new application");
  const history = useHistory();

  const composeCreateApplication = useAction(
    gql`
      mutation($id: ID!, $repo: String!, $branch: String!, $path: String!) {
        composeCreateApplication(
          id: $id
          repo: $repo
          branch: $branch
          path: $path
        ) {
          id
          repo
          branch
          path
        }
      }
    `,
    {
      refetchQueries: [
        {
          query: gql`
            {
              composeApplications {
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
      <Widget title="new application">
        <Form
          onSubmit={async ({ ...formData }) => {
            const result = await composeCreateApplication({
              ...formData,
            });
            history.push(`/applications/${result.composeCreateApplication.id}`);
          }}
          fields={[
            ["String", "id", uuid.v4().slice(0, 8), { required: true }],
            ["String", "repo", "", { required: true }],
            ["String", "branch", "master", { required: true }],
            ["String", "path", ""],
          ]}
        />
      </Widget>
    </>
  );
}
