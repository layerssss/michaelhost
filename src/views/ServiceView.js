import React from "react";
import gql from "graphql-tag";
import { useHistory } from "react-router-dom";
import { Delete, ConsoleLine, Docker, Refresh } from "mdi-material-ui";

import useData from "../hooks/useData";
import useAction from "../hooks/useAction";
import Widget from "../controls/Widget";
import Table from "../controls/Table";
import Actions from "../controls/Actions";
import StaticForm from "../controls/StaticForm";

export default React.memo(ServiceView);
function ServiceView({ useTitle, serviceId }) {
  const [data, { refetch }] = useData(
    gql`
      query ServiceView($serviceId: ID!) {
        service(id: $serviceId) {
          id
          name
          image
          replicas

          ports {
            protocol
            targetPort
            publishedPort
          }
        }
      }
    `,
    { serviceId },
  );
  const serviceLogs = useAction(
    gql`
      mutation ServiceView($serviceId: ID!) {
        serviceLogs(id: $serviceId) {
          id
        }
      }
    `,
  );
  const servicePull = useAction(
    gql`
      mutation ServiceView($serviceId: ID!) {
        servicePull(id: $serviceId)
      }
    `,
  );
  const serviceRm = useAction(
    gql`
      mutation ServiceView($serviceId: ID!) {
        serviceRm(id: $serviceId)
      }
    `,
    {
      refetchQueries: [
        {
          query: gql`
            query ServiceView {
              services {
                id
              }
            }
          `,
        },
      ],
    },
  );

  const history = useHistory();
  const title = `service: ${data?.service.name}`;
  useTitle(title);
  return (
    <>
      <Actions
        actions={[
          {
            icon: <ConsoleLine />,
            title: "logs",
            onClick: async () => {
              const result = await serviceLogs({
                serviceId,
              });
              const terminalId = result.serviceLogs.id;
              history.push(`/terminals/${terminalId}`);
            },
          },
          {
            icon: <Refresh />,
            title: "pull",
            onClick: async () => {
              await servicePull({
                serviceId,
              });
              await refetch();
            },
          },
          {
            icon: <Delete />,
            title: "rm",
            onClick: async () => {
              await serviceRm({
                serviceId,
              });
              history.push(`/services`);
            },
          },
        ]}
      />
      <Widget title={title} icon={<Docker />}>
        <StaticForm
          fields={[
            ["id", serviceId],
            ["name", data?.service.name],
            ["image", data?.service.image],
            ["replicas", data?.service.replicas],
          ]}
        />
      </Widget>
      <Widget title="ports">
        <Table
          columns={["protocol", "targetPort", "publishedPort"]}
          rows={data?.service.ports.map((port) => ({
            values: [port.protocol, port.targetPort, port.publishedPort],
          }))}
        />
      </Widget>
    </>
  );
}
