import React from "react";
import gql from "graphql-tag";
import { Broom, Download } from "mdi-material-ui";

import useAction from "../hooks/useAction";
import useData from "../hooks/useData";
import Widget from "../controls/Widget";
import Actions from "../controls/Actions";
import Table from "../controls/Table";
import { ImagesIcon } from "../controls/icons";
import formatTimestamp from "../services/formatTimestamp";

export default React.memo(ImagesView);
function ImagesView({ useTitle }) {
  const title = "images";
  useTitle(title);
  const [data, { refetch }] = useData(gql`
    query ImagesView {
      images {
        id
        digests
        tags
        createdAt
      }
    }
  `);

  const imagesPrune = useAction(gql`
    mutation {
      imagesPrune
    }
  `);

  return (
    <>
      <Widget title={title} icon={<ImagesIcon />}>
        <Table
          columns={["digests", "tags", "created at"]}
          rows={data?.images.map((image) => ({
            values: [
              //
              image.digests.join(),
              image.tags?.join(),
              formatTimestamp(image.createdAt),
            ],
            actions: [{ title: "view", href: `/images/${image.id}` }],
          }))}
        />
        <Actions
          actions={[
            {
              icon: <Broom />,
              title: "prune",
              onClick: async () => {
                if (!window.confirm("Are you sure?")) return;
                await imagesPrune();
                await refetch();
              },
            },
            {
              icon: <Download />,
              title: "pull image",
              href: "/images/pull",
            },
          ]}
        />
      </Widget>
    </>
  );
}
