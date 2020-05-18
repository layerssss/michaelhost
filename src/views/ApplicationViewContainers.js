import React from "react";
import gql from "graphql-tag";

import useData from "../hooks/useData";
import Widget from "../controls/Widget";
import Table from "../controls/Table";

export default React.memo(ApplicationViewContainers);
function ApplicationViewContainers({ applicationId }) {
  const [data] = useData(
    gql`
      query ApplicationViewContainers($applicationId: ID!) {
        composeApplication(id: $applicationId) {
          id
          containers {
            id
            serviceName
            runningFor
            image
            ports {
              id
              protocol
              port
            }
          }
        }
      }
    `,
    { applicationId },
  );

  return (
    <>
      <Widget title="containers" size="large">
        <Table
          columns={["id", "service name", "image", "runningFor", "ports"]}
          rows={data?.composeApplication.containers?.map(container => ({
            values: [
              container.id,
              container.serviceName,
              container.image,
              container.runningFor,
              container.ports.map(port => `${port.port}/${port.protocol}`),
            ],
          }))}
        />
      </Widget>
    </>
  );
}
