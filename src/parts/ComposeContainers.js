import React from "react";
import { compose } from "recompose";
import gql from "graphql-tag";
import { Panel, Table } from "react-bootstrap";

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
                <th>Running for</th>
                <th>Ports</th>
              </tr>
            </thead>
            <tbody>
              {data.composeApplication.containers.map(composeContainer => (
                <tr key={composeContainer.id}>
                  <td>{composeContainer.id}</td>
                  <td>{composeContainer.serviceName}</td>
                  <td>{composeContainer.runningFor}</td>
                  <td>
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
