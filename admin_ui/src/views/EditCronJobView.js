import React from "react";
import gql from "graphql-tag";
import { useNavigate } from "react-router";

import useData from "../hooks/useData";
import useAction from "../hooks/useAction";
import Widget from "../controls/Widget";
import Form from "../controls/Form";

export default React.memo(EditCronJobView);
function EditCronJobView({ cronJobId, useTitle }) {
  const [data] = useData(
    gql`
      query EditCronJobView($cronJobId: ID!) {
        cronJob(id: $cronJobId) {
          id
          name
          command
          cron
          singleInstance
        }
      }
    `,
    { cronJobId },
  );
  const title = `edit`;
  useTitle(title);
  const navigate = useNavigate();

  const updateCronJob = useAction(
    gql`
      mutation(
        $id: ID!
        $name: String!
        $command: String!
        $cron: String!
        $singleInstance: Boolean!
      ) {
        updateCronJob(
          id: $id
          name: $name
          command: $command
          cron: $cron
          singleInstance: $singleInstance
        ) {
          id
          name
          command
          cron
          singleInstance
        }
      }
    `,
  );

  return (
    <Widget title={title}>
      {data && (
        <Form
          onSubmit={async ({ ...formData }) => {
            await updateCronJob({
              id: cronJobId,
              ...formData,
            });
            navigate(`/cron_jobs/${cronJobId}`);
          }}
          fields={[
            ["String", "name", data.cronJob.name],
            ["String", "command", data.cronJob.command, { required: true }],
            ["String", "cron", data.cronJob.cron, { required: true }],
            ["Boolean", "singleInstance", data.cronJob.singleInstance],
          ]}
        />
      )}
    </Widget>
  );
}
