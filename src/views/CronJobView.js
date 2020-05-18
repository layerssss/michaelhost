import React from "react";
import gql from "graphql-tag";
import { Pencil, Web } from "mdi-material-ui";

import useData from "../hooks/useData";
import Widget from "../controls/Widget";
import Actions from "../controls/Actions";
import StaticForm from "../controls/StaticForm";

export default React.memo(CronJobView);
function CronJobView({ useTitle, cronJobId }) {
  const [data] = useData(
    gql`
      query CronJobView($cronJobId: ID!) {
        cronJob(id: $cronJobId) {
          id
          command
          cron
        }
      }
    `,
    { cronJobId },
  );
  const title = `cron job: ${data?.cronJob.command}(${data?.cronJob.cron})`;
  useTitle(title);
  return (
    <>
      <Actions
        actions={[
          {
            icon: <Pencil />,
            title: "edit",
            href: `/cron_jobs/${cronJobId}/edit`,
          },
        ]}
      />
      <Widget title={title} icon={<Web />}>
        <StaticForm
          fields={[
            ["command", data?.cronJob.command],
            ["cron", data?.cronJob.cron],
          ]}
        />
      </Widget>
    </>
  );
}
