import React from "react";
import gql from "graphql-tag";
import { useHistory } from "react-router-dom";
import { Stop, Delete, ConsoleLine, Docker, Play } from "mdi-material-ui";
import moment from "moment";

import useFormDialogs from "../hooks/useFormDialogs";
import useData from "../hooks/useData";
import useAction from "../hooks/useAction";
import Widget from "../controls/Widget";
import Actions from "../controls/Actions";
import StaticForm from "../controls/StaticForm";

export default React.memo(ContainerView);
function ContainerView({ useTitle, containerId }) {
  const { showFormDialog } = useFormDialogs();
  const [data, { refetch }] = useData(
    gql`
      query ContainerView($containerId: ID!) {
        container(id: $containerId) {
          id
          name
          image
          command
          entrypoint

          running
          status
          createdAt
          startedAt
          finishedAt

          mounts {
            id
            source
            destination
            driver
            mode
            rw
          }
        }
      }
    `,
    { containerId },
  );
  const containerExec = useAction(
    gql`
      mutation ContainerView($command: String!, $containerId: ID!) {
        containerExec(id: $containerId, command: $command) {
          id
        }
      }
    `,
  );
  const containerLogs = useAction(
    gql`
      mutation ContainerView($containerId: ID!) {
        containerLogs(id: $containerId) {
          id
        }
      }
    `,
  );
  const containerStart = useAction(
    gql`
      mutation ContainerView($containerId: ID!) {
        containerStart(id: $containerId)
      }
    `,
  );
  const containerStop = useAction(
    gql`
      mutation ContainerView($containerId: ID!) {
        containerStop(id: $containerId)
      }
    `,
  );
  const containerRm = useAction(
    gql`
      mutation ContainerView($containerId: ID!) {
        containerRm(id: $containerId)
      }
    `,
    {
      refetchQueries: [
        {
          query: gql`
            query ContainerView {
              containers {
                id
              }
            }
          `,
        },
      ],
    },
  );

  const history = useHistory();
  const title = `container: ${data?.container.name}`;
  useTitle(title);
  return (
    <>
      <Actions
        actions={[
          {
            icon: <ConsoleLine />,
            title: "exec",
            disabled: !data?.container.running,
            onClick: async () => {
              const result = await containerExec({
                containerId,
                ...(await showFormDialog({
                  title: "container exec",
                  fields: [
                    //
                    ["String", "command"],
                  ],
                })),
              });
              const terminalId = result.containerExec.id;
              history.push(`/terminals/${terminalId}`);
            },
          },
          {
            icon: <ConsoleLine />,
            title: "logs",
            onClick: async () => {
              const result = await containerLogs({
                containerId,
              });
              const terminalId = result.containerLogs.id;
              history.push(`/terminals/${terminalId}`);
            },
          },
          {
            icon: <Play />,
            title: "start",
            disabled: data?.container.running,
            onClick: async () => {
              await containerStart({
                containerId,
              });
              await refetch();
            },
          },
          {
            icon: <Stop />,
            title: "stop",
            disabled: !data?.container.running,
            onClick: async () => {
              await containerStop({
                containerId,
              });
              await refetch();
            },
          },
          {
            icon: <Delete />,
            title: "rm",
            disabled: data?.container.running,
            onClick: async () => {
              if (!window.confirm("Are you sure?")) return;
              await containerRm({
                containerId,
              });
              history.push(`/containers`);
            },
          },
        ]}
      />
      <Widget title={title} icon={<Docker />}>
        <StaticForm
          fields={[
            ["id", containerId],
            ["name", data?.container.name],
            ["image", data?.container.image],
            ["command", JSON.stringify(data?.container.command)],
            ["entrypoint", JSON.stringify(data?.container.entrypoint)],
          ]}
        />
      </Widget>
      <Widget title="State">
        <StaticForm
          fields={[
            ["status", data?.container.status],
            ["createdAt", moment(data?.container.createdAt).format("LLL")],
            ["startedAt", moment(data?.container.startedAt).format("LLL")],
            ["finishedAt", moment(data?.container.finishedAt).format("LLL")],
          ]}
        />
      </Widget>
    </>
  );
}
