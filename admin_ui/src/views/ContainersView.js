import React from "react";
import gql from "graphql-tag";
import { Broom } from "mdi-material-ui";

import useAction from "../hooks/useAction";
import useData from "../hooks/useData";
import formatTimestamp from "../services/formatTimestamp";
import Widget from "../controls/Widget";
import Actions from "../controls/Actions";
import Table from "../controls/Table";
import { ContainersIcon } from "../controls/icons";

export default React.memo(ContainersView);
function ContainersView({ useTitle }) {
  const title = "containers";
  useTitle(title);
  const [data, { refetch }] = useData(gql`
    query ContainersView {
      containers {
        id
        name
        image
        status
        startedAt
        running
      }
    }
  `);

  const containersPrune = useAction(gql`
    mutation {
      containersPrune
    }
  `);

  return (
    <>
      <Widget title={title} icon={<ContainersIcon />}>
        <Table
          columns={["name", "image", "status", "started at"]}
          rows={data?.containers.map((container) => ({
            values: [
              container.name,
              container.image,
              container.status,
              container.running ? formatTimestamp(container.startedAt) : "-",
            ],
            actions: [{ title: "view", href: `/containers/${container.id}` }],
          }))}
        />
        <Actions
          actions={[
            {
              icon: <Broom />,
              title: "prune",
              onClick: async () => {
                if (!window.confirm("Are you sure?")) return;
                await containersPrune();
                await refetch();
              },
            },
          ]}
        />
      </Widget>
    </>
  );
}
