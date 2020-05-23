import React from "react";
import gql from "graphql-tag";
import { Plus } from "mdi-material-ui";

import useData from "../hooks/useData";
import useAction from "../hooks/useAction";
import Widget from "../controls/Widget";
import Table from "../controls/Table";
import Actions from "../controls/Actions";
import { CronJobsIcon } from "../controls/icons";

export default React.memo(CronJobsView);
function CronJobsView({ useTitle }) {
  const title = "cron jobs";
  useTitle(title);
  const [data] = useData(gql`
    query CronJobsView {
      cronJobs {
        id
        command
        cron
      }
    }
  `);

  const deleteCronJob = useAction(
    gql`
      mutation CronJobsView($cronJobId: ID!) {
        deleteCronJob(id: $cronJobId) {
          id
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
  const triggerCronJob = useAction(gql`
    mutation($cronJobId: ID!) {
      triggerCronJob(id: $cronJobId) {
        id
      }
    }
  `);

  return (
    <>
      <Widget title={title} icon={<CronJobsIcon />}>
        <Table
          columns={["command", "cron"]}
          rows={data?.cronJobs.map((cronJob) => ({
            values: [cronJob.command, cronJob.cron],
            actions: [
              { title: "view", href: `/cron_jobs/${cronJob.id}` },
              {
                title: "trigger",
                onClick: () => triggerCronJob({ cronJobId: cronJob.id }),
              },
              {
                title: "delete",
                onClick: () => {
                  if (!window.confirm("Are you sure?")) return;
                  deleteCronJob({
                    cronJobId: cronJob.id,
                  });
                },
              },
            ],
          }))}
        />
      </Widget>
      <Actions
        actions={[
          {
            icon: <Plus />,
            title: "new cron job",
            href: "/cron_jobs/new",
          },
        ]}
      />
    </>
  );
}
