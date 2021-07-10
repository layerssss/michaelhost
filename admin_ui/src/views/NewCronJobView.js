import React from "react";
import gql from "graphql-tag";
import { useHistory } from "react-router";

import useAction from "../hooks/useAction";
import Widget from "../controls/Widget";
import Form from "../controls/Form";

export default React.memo(NewCronJobView);
function NewCronJobView({ useTitle }) {
  useTitle("new host");
  const history = useHistory();

  const createCronJob = useAction(
    gql`
      mutation(
        $name: String!
        $command: String!
        $cron: String!
        $singleInstance: Boolean!
      ) {
        createCronJob(
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
    {
      refetchQueries: [
        {
          query: gql`
            {
              cronJobs {
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
      <Widget title="new cron job">
        <Form
          onSubmit={async ({ ...formData }) => {
            await createCronJob({
              ...formData,
            });
            history.push("/cron_jobs");
          }}
          fields={[
            ["String", "name", ""],
            ["String", "command", "", { required: true }],
            ["String", "cron", "0 8 * * *", { required: true }],
            ["Boolean", "singleInstance", false, { required: true }],
          ]}
        />
      </Widget>
    </>
  );
}
