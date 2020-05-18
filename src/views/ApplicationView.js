import React from "react";
import gql from "graphql-tag";
import { useApolloClient } from "@apollo/react-common";
import { Docker } from "mdi-material-ui";

import useData from "../hooks/useData";
import useWebSocket from "../hooks/useWebSocket";
import Widget from "../controls/Widget";

import Terminal from "./Terminal";
import ApplicationViewDetails from "./ApplicationViewDetails";
import ApplicationViewContainers from "./ApplicationViewContainers";
import ApplicationViewPortMappings from "./ApplicationViewPortMappings";
import ApplicationViewActions from "./ApplicationViewActions";
import ApplicationViewConnections from "./ApplicationViewConnections";

export default React.memo(ApplicationView);
function ApplicationView({ useTitle, applicationId }) {
  const apolloClient = useApolloClient();
  useWebSocket(
    `/api/compose_applications/${applicationId}`,
    ({ composeApplication }) => {
      if (composeApplication)
        apolloClient.writeQuery({
          variables: {
            composeApplicationId: applicationId,
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
          data: { composeApplication },
        });
    },
  );
  const [data] = useData(
    gql`
      query ApplicationView($applicationId: ID!) {
        composeApplication(id: $applicationId) {
          id
          task {
            id
            name
            terminal {
              id
            }
          }
        }
      }
    `,
    { applicationId },
  );
  const title = `application: ${data?.composeApplication.id}`;
  useTitle(title);

  return (
    <>
      <ApplicationViewActions applicationId={applicationId} />
      <Widget title={title} icon={<Docker />}>
        <ApplicationViewDetails applicationId={applicationId} />
      </Widget>
      <ApplicationViewContainers applicationId={applicationId} />
      <ApplicationViewPortMappings applicationId={applicationId} />
      <ApplicationViewConnections applicationId={applicationId} />
      {data?.composeApplication.task && (
        <Widget
          title={`task: ${data.composeApplication.task.name}`}
          size="large"
        >
          {data.composeApplication.task.terminal && (
            <Terminal terminalId={data.composeApplication.task.terminal.id} />
          )}
        </Widget>
      )}
    </>
  );
}
