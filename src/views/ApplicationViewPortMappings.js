import React from "react";
import gql from "graphql-tag";
import { Delete } from "mdi-material-ui";

import useData from "../hooks/useData";
import useAction from "../hooks/useAction";
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
            status
            protocol
            serviceName
            servicePort
            publicPort
            loopback
            connections {
              id
            }
          }
        }
      }
    `,
    { applicationId },
  );
  const composeRemovePortMapping = useAction(gql`
    mutation($applicationId: ID!, $composePortMappingId: ID!) {
      composeRemovePortMapping(
        id: $applicationId
        composePortMappingId: $composePortMappingId
      ) {
        id
        portMappings {
          id
        }
      }
    }
  `);

  return (
    <>
      <Widget title="port mappings" size="medium">
        <Table
          columns={["mapping", "status"]}
          rows={data?.composeApplication.portMappings.map(
            ({
              id,
              serviceName,
              protocol,
              servicePort,
              loopback,
              publicPort,
              status,
            }) => ({
              values: [
                `${serviceName}/${protocol}/${servicePort} => ${protocol}/${
                  loopback ? "127.0.0.1" : "0.0.0.0"
                }:${publicPort}`,
                status,
              ],
              actions: [
                {
                  icon: <Delete />,
                  title: "delete",
                  onClick: () => {
                    if (!window.confirm("Are you sure?")) return;
                    composeRemovePortMapping({
                      applicationId,
                      composePortMappingId: id,
                    });
                  },
                },
              ],
            }),
          )}
        />
      </Widget>
    </>
  );
}
