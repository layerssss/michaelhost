import React from "react";
import gql from "graphql-tag";
import { Plus } from "mdi-material-ui";

import useData from "../hooks/useData";
import Widget from "../controls/Widget";
import Table from "../controls/Table";
import Actions from "../controls/Actions";

export default React.memo(ApplicationsView);
function ApplicationsView({ useTitle }) {
  const title = "applications";
  useTitle(title);
  const [data] = useData(gql`
    query ApplicationsView {
      composeApplications {
        id
        repo
        branch
        path
        portMappings {
          id
          loopback
          publicPort
        }
        containers {
          id
        }
      }
    }
  `);

  return (
    <>
      <Widget title={title}>
        <Table
          columns={["id", "repo", "public ports", "containers"]}
          rows={data?.composeApplications.map(application => ({
            values: [
              application.id,
              `${application.repo}#${application.branch}/${application.path}`,
              application.portMappings
                .map(
                  ({ loopback, publicPort }) =>
                    `${loopback ? "localhost" : "0.0.0.0"}:${publicPort}`,
                )
                .join(", "),
              application.containers === null
                ? "-"
                : application.containers.length,
            ],
            actions: [
              { title: "view", href: `/applications/${application.id}` },
            ],
          }))}
        />
      </Widget>
      <Actions
        actions={[
          {
            icon: <Plus />,
            title: "new application",
            href: "/applications/new",
          },
        ]}
      />
    </>
  );
}
