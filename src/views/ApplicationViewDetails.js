import React from "react";
import gql from "graphql-tag";

import useData from "../hooks/useData";
import StaticForm from "../controls/StaticForm";

export default React.memo(ApplicationViewDetails);
function ApplicationViewDetails({ applicationId }) {
  const [data] = useData(
    gql`
      query ApplicationViewContainers($applicationId: ID!) {
        composeApplication(id: $applicationId) {
          id
          repo
          branch
          path
        }
      }
    `,
    { applicationId },
  );

  return (
    <>
      <StaticForm
        fields={[
          ["id", applicationId],
          ["repo", data?.composeApplication.repo],
          ["branch", data?.composeApplication.branch],
          ["path", data?.composeApplication.path],
        ]}
      />
    </>
  );
}
