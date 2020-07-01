import React from "react";
import gql from "graphql-tag";
import { Broom } from "mdi-material-ui";

import useAction from "../hooks/useAction";
import useData from "../hooks/useData";
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
          columns={["name", "image", "status"]}
          rows={data?.containers.map((container) => ({
            values: [container.name, container.image, container.status],
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
