import React from "react";
import { Helmet } from "react-helmet";
import { graphql } from "react-apollo";
import { compose, withProps, lifecycle } from "recompose";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import gql from "graphql-tag";
import {
  Panel,
  FormGroup,
  FormControl,
  ControlLabel,
  Row,
  Col,
} from "react-bootstrap";

import withWebSocket from "../helpers/withWebSocket.js";
import apolloClient from "../helpers/apolloClient.js";
import withData from "../helpers/withData.js";
import withRouter from "../helpers/withRouter.js";
import ComposeActions from "./ComposeActions.js";
import ComposeContainers from "./ComposeContainers.js";
import ComposePortMappings from "./ComposePortMappings.js";

export default compose(
  withRouter,
  withData(
    gql`
      query($composeApplicationId: ID!) {
        composeApplication(id: $composeApplicationId) {
          id
          name
          task {
            id
            name
          }
        }
      }
    `,
    ({ params }) => ({
      composeApplicationId: params.composeApplicationId,
    }),
  ),
  withProps(({ data }) => ({
    webSocketPath: `/api/compose_applications/${data.composeApplication.id}`,
  })),
  withWebSocket,
  lifecycle({
    componentDidMount() {
      const { webSocket, data } = this.props;
      webSocket.addEventListener("message", event => {
        const message = JSON.parse(event.data);
        if (!message.composeApplication) return;
        apolloClient.writeQuery({
          variables: {
            composeApplicationId: data.composeApplication.id,
          },
          query: gql`
            query($composeApplicationId: ID!) {
              composeApplication(id: $composeApplicationId) {
                id
                task {
                  id
                  name
                  terminal {
                    id
                  }
                }
                serviceNames
                containers {
                  id
                  runningFor
                  ports {
                    id
                    hostPort
                  }
                }
                portMappings {
                  id
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
                }
              }
            }
          `,
          data: message,
        });
      });
    },
  }),
  graphql(
    gql`
      mutation($id: ID!) {
        composeDeleteApplication(id: $id) {
          id
        }
      }
    `,
    {
      name: "composeDeleteApplication",
      options: {
        refetchQueries: [
          {
            query: gql`
              {
                composeApplications {
                  id
                }
              }
            `,
          },
        ],
      },
    },
  ),
  graphql(
    gql`
      mutation($id: ID!) {
        composePS(id: $id) {
          id
        }
      }
    `,
    {
      name: "composePS",
    },
  ),
  graphql(
    gql`
      mutation($id: ID!) {
        composeUp(id: $id) {
          id
        }
      }
    `,
    {
      name: "composeUp",
    },
  ),
)(({ data }) => (
  <>
    <Helmet title={data.composeApplication.name} />
    <Row>
      <Col lg={8}>
        <Panel>
          <Panel.Heading>Application</Panel.Heading>
          <Panel.Body>
            <FormGroup>
              <ControlLabel>repo:</ControlLabel>
              <FormControl.Static>
                <FontAwesomeIcon icon="git" />
                {data.composeApplication.name}
              </FormControl.Static>
            </FormGroup>
            <FormGroup>
              <ControlLabel>containers:</ControlLabel>
              <FormControl.Static>
                <FontAwesomeIcon icon="docker" />
                {data.composeApplication.containers ? (
                  <>{data.composeApplication.containers.length} containers</>
                ) : (
                  <>unknown</>
                )}
              </FormControl.Static>
            </FormGroup>
            <FormGroup>
              <ControlLabel>current task:</ControlLabel>
              <FormControl.Static>
                <FontAwesomeIcon icon="terminal" />
                {data.composeApplication.task ? (
                  <>{data.composeApplication.task.name} </>
                ) : (
                  <>none</>
                )}
              </FormControl.Static>
            </FormGroup>
          </Panel.Body>
        </Panel>
        <ComposeContainers />
        <ComposePortMappings />
      </Col>
      <Col lg={4}>
        <ComposeActions />
      </Col>
    </Row>
  </>
));
