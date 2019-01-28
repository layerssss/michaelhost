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
            connectionsCount
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
              <th>Connections</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {data.composeApplication.portMappings.map(composePortMapping => (
              <tr key={composePortMapping.id}>
                <td>
                  <FontAwesomeIcon icon="network-wired" />
                  {`${composePortMapping.serviceName}/${
                    composePortMapping.protocol
                  }/${composePortMapping.servicePort} => ${
                    composePortMapping.protocol
                  }/${composePortMapping.loopback ? "127.0.0.1" : "0.0.0.0"}:${
                    composePortMapping.publicPort
                  }`}
                </td>
                <td>{composePortMapping.connectionsCount}</td>
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
            ))}
          </tbody>
        </Table>
      </Panel.Body>
    </Panel>
  </>
));
