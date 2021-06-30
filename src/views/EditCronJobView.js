import React from "react";
import gql from "graphql-tag";
import { useHistory } from "react-router";

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
  const history = useHistory();

  const updateCronJob = useAction(
    gql`
      mutation(
        $id: ID!
        $command: String!
        $cron: String!
        $singleInstance: Boolean!
      ) {
        updateCronJob(
          id: $id
          command: $command
          cron: $cron
          singleInstance: $singleInstance
        ) {
          id
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
            history.push(`/cron_jobs/${cronJobId}`);
          }}
          fields={[
            ["String", "command", data.cronJob.command, { required: true }],
            ["String", "cron", data.cronJob.cron, { required: true }],
            [
              "Boolean",
              "singleInstance",
              data.cronJob.singleInstance,
              { required: true },
            ],
          ]}
        />
      )}
    </Widget>
  );
}
