import React from "react";
import gql from "graphql-tag";
import { useHistory } from "react-router-dom";
import { Delete, Docker } from "mdi-material-ui";

import useData from "../hooks/useData";
import useAction from "../hooks/useAction";
import Widget from "../controls/Widget";
import Actions from "../controls/Actions";
import StaticForm from "../controls/StaticForm";

export default React.memo(VolumeView);
function VolumeView({ useTitle, volumeId }) {
  const [data] = useData(
    gql`
      query VolumeView($volumeId: ID!) {
        volume(id: $volumeId) {
          id
          name
          driver
        }
      }
    `,
    { volumeId },
  );
  const volumeRm = useAction(
    gql`
      mutation VolumeView($volumeId: ID!) {
        volumeRm(id: $volumeId)
      }
    `,
    {
      refetchQueries: [
        {
          query: gql`
            query VolumeView {
              volumes {
                id
              }
            }
          `,
        },
      ],
    },
  );

  const history = useHistory();
  const title = `volume: ${data?.volume.name}`;
  useTitle(title);
  return (
    <>
      <Actions
        actions={[
          {
            icon: <Delete />,
            title: "rm",
            onClick: async () => {
              await volumeRm({
                volumeId,
              });
              history.push(`/volumes`);
            },
          },
        ]}
      />
      <Widget title={title} icon={<Docker />}>
        <StaticForm
          fields={[
            ["name", data?.volume.name],
            ["driver", data?.volume.driver],
          ]}
        />
      </Widget>
    </>
  );
}
