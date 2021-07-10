import React from "react";
import gql from "graphql-tag";
import { Broom } from "mdi-material-ui";

import useAction from "../hooks/useAction";
import useData from "../hooks/useData";
import Widget from "../controls/Widget";
import Actions from "../controls/Actions";
import Table from "../controls/Table";
import { VolumesIcon } from "../controls/icons";

export default React.memo(VolumesView);
function VolumesView({ useTitle }) {
  const title = "volumes";
  useTitle(title);
  const [data, { refetch }] = useData(gql`
    query VolumesView {
      volumes {
        id
        name
        driver
      }
    }
  `);

  const volumesPrune = useAction(gql`
    mutation {
      volumesPrune
    }
  `);

  return (
    <>
      <Widget title={title} icon={<VolumesIcon />}>
        <Table
          columns={["name", "driver"]}
          rows={data?.volumes.map((volume) => ({
            values: [volume.name, volume.driver],
            actions: [{ title: "view", href: `/volumes/${volume.id}` }],
          }))}
        />
        <Actions
          actions={[
            {
              icon: <Broom />,
              title: "prune",
              onClick: async () => {
                if (!window.confirm("Are you sure?")) return;
                await volumesPrune();
                await refetch();
              },
            },
          ]}
        />
      </Widget>
    </>
  );
}
