import React from "react";
import _ from "lodash";
import gql from "graphql-tag";

import useData from "../hooks/useData";
import Widget from "../controls/Widget";
import Table from "../controls/Table";

export default React.memo(ApplicationViewPortMappings);
function ApplicationViewPortMappings({ applicationId }) {
  const [data] = useData(
    gql`
      query ApplicationViewPortMappings($applicationId: ID!) {
        composeApplication(id: $applicationId) {
          id
          portMappings {
            id
            publicPort
            connections {
              id
              remoteAddress
              remotePort
              sending
              receiving
              bytesReceived
              bytesSent
              errorMessage
            }
          }
        }
      }
    `,
    { applicationId },
  );

  return (
    <>
      <Widget title="connections" size="large">
        <Table
          columns={["public port", "remote", "rx", "tx", "error"]}
          rows={_.flatten(
            data?.composeApplication.portMappings.map((portMapping) =>
              portMapping.connections.map(
                ({
                  remoteAddress,
                  remotePort,
                  receiving,
                  bytesReceived,
                  sending,
                  bytesSent,
                  errorMessage,
                }) => ({
                  values: [
                    portMapping.publicPort,
                    `${remoteAddress}:${remotePort}`,
                    `${receiving}/${bytesReceived}`,
                    `${sending}/${bytesSent}`,
                    errorMessage || "",
                  ],
                }),
              ),
            ),
          )}
        />
      </Widget>
    </>
  );
}
