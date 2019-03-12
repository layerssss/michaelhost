import React from "react";
import { compose } from "recompose";
import { graphql } from "react-apollo";
import gql from "graphql-tag";
import { Panel, Table, Button, ButtonToolbar } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import withData from "../helpers/withData.js";
import withRouter from "../helpers/withRouter.js";

export default compose(
  withRouter,
  withData(
    gql`
      query($composeApplicationId: ID!) {
        composeApplication(id: $composeApplicationId) {
          id
          portMappings {
            id
            protocol
            serviceName
            servicePort
            publicPort
            connections {
              id
              remoteAddress
              remotePort
              bytesSent
              bytesReceived
              sending
              receiving
              errorMessage
            }
            status
            loopback
          }
        }
      }
    `,
    ({ params }) => ({
      composeApplicationId: params.composeApplicationId,
    }),
  ),
  graphql(
    gql`
      mutation($id: ID!, $composePortMappingId: ID!) {
        composeRemovePortMapping(
          id: $id
          composePortMappingId: $composePortMappingId
        ) {
          id
          portMappings {
            id
          }
        }
      }
    `,
    {
      name: "composeRemovePortMapping",
    },
  ),
)(({ data, composeRemovePortMapping }) => (
  <>
    <Panel>
      <Panel.Heading>Port Mappings</Panel.Heading>
      <Panel.Body>
        <Table responsive>
          <thead>
            <tr>
              <th />
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {data.composeApplication.portMappings.map(composePortMapping => (
              <React.Fragment key={composePortMapping.id}>
                <tr>
                  <td>
                    <FontAwesomeIcon icon="network-wired" />
                    {`${composePortMapping.serviceName}/${
                      composePortMapping.protocol
                    }/${composePortMapping.servicePort} => ${
                      composePortMapping.protocol
                    }/${
                      composePortMapping.loopback ? "127.0.0.1" : "0.0.0.0"
                    }:${composePortMapping.publicPort}`}
                  </td>
                  <td>{composePortMapping.status}</td>
                  <td>
                    <ButtonToolbar>
                      <Button
                        bsStyle="danger"
                        bsSize="xs"
                        onClick={() =>
                          composeRemovePortMapping({
                            variables: {
                              id: data.composeApplication.id,
                              composePortMappingId: composePortMapping.id,
                            },
                          })
                        }
                      >
                        <FontAwesomeIcon icon="trash" />
                        Remove
                      </Button>
                    </ButtonToolbar>
                  </td>
                </tr>
                {!!composePortMapping.connections.length && (
                  <tr>
                    <td>Remote</td>
                    <td>Receiving</td>
                    <td>Bytes Received</td>
                    <td>Sending</td>
                    <td>Bytes Sent</td>
                    <td>Error Message</td>
                  </tr>
                )}
                {composePortMapping.connections.map(connection => (
                  <tr key={connection.id}>
                    <td>
                      {connection.remoteAddress}:{connection.remotePort}
                    </td>
                    <td>{String(connection.receiving)}</td>
                    <td>{connection.bytesReceived}</td>
                    <td>{String(connection.sending)}</td>
                    <td>{connection.bytesSent}</td>
                    <td>{connection.errorMessage}</td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </Table>
      </Panel.Body>
    </Panel>
  </>
));
