import React from "react";
import { compose } from "recompose";
import gql from "graphql-tag";
import { Panel, Table } from "react-bootstrap";
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
    ({ params }) => ({
      composeApplicationId: params.composeApplicationId,
    }),
  ),
)(({ data }) => (
  <>
    {data.composeApplication.containers && (
      <Panel>
        <Panel.Heading>Containers</Panel.Heading>
        <Panel.Body>
          <Table responsive>
            <thead>
              <tr>
                <th>ID</th>
                <th>Service Name</th>
                <th>Image</th>
                <th>Running for</th>
                <th>Ports</th>
              </tr>
            </thead>
            <tbody>
              {data.composeApplication.containers.map(composeContainer => (
                <tr key={composeContainer.id}>
                  <td>
                    <FontAwesomeIcon icon="docker" />
                    {composeContainer.id}
                  </td>
                  <td>{composeContainer.serviceName}</td>
                  <td>{composeContainer.image}</td>
                  <td>{composeContainer.runningFor}</td>
                  <td>
                    <FontAwesomeIcon icon="network-wired" />
                    {composeContainer.ports
                      .map(
                        composeContainerPort =>
                          `${composeContainerPort.port}/${
                            composeContainerPort.protocol
                          }`,
                      )
                      .join(", ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Panel.Body>
      </Panel>
    )}
  </>
));
