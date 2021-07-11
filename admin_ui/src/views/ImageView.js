import React from "react";
import gql from "graphql-tag";
import { useHistory } from "react-router-dom";
import { Delete, Database } from "mdi-material-ui";

import useData from "../hooks/useData";
import useAction from "../hooks/useAction";
import Widget from "../controls/Widget";
import Actions from "../controls/Actions";
import StaticForm from "../controls/StaticForm";
import formatTimestamp from "../services/formatTimestamp";

export default React.memo(ImageView);
function ImageView({ useTitle, imageId }) {
  const [data] = useData(
    gql`
      query ImageView($imageId: ID!) {
        image(id: $imageId) {
          id
          tags
          digests
          createdAt
        }
      }
    `,
    { imageId },
  );
  const imageRm = useAction(
    gql`
      mutation ImageView($imageId: ID!) {
        imageRm(id: $imageId)
      }
    `,
    {
      refetchQueries: [
        {
          query: gql`
            query ImageView {
              images {
                id
              }
            }
          `,
        },
      ],
    },
  );

  const history = useHistory();
  const title = `image: ${data?.image.id}`;
  useTitle(title);
  return (
    <>
      <Actions
        actions={[
          {
            icon: <Delete />,
            title: "rm",
            onClick: async () => {
              if (!window.confirm("Are you sure?")) return;
              await imageRm({
                imageId,
              });
              history.push(`/images`);
            },
          },
        ]}
      />
      <Widget title={title} icon={<Database />}>
        <StaticForm
          fields={[
            ["id", data?.image.id],
            ["digests", data?.image.digests.join()],
            ["tags", data?.image.tags?.join()],
            ["created at", formatTimestamp(data?.image.createdAt)],
          ]}
        />
      </Widget>
    </>
  );
}
