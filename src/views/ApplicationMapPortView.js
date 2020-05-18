import React from "react";
import _ from "lodash";
import gql from "graphql-tag";
import { useHistory } from "react-router";

import useAction from "../hooks/useAction";
import useData from "../hooks/useData";
import Widget from "../controls/Widget";
import Form from "../controls/Form";

export default React.memo(ApplicationMapPortView);
function ApplicationMapPortView({ useTitle, applicationId }) {
  const title = "logs";
  useTitle(title);
  const history = useHistory();

  const [data] = useData(
    gql`
      query ApplicationMapPortView($applicationId: ID!) {
        composeApplication(id: $applicationId) {
          id
          containers {
            id
            serviceName
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

  const composeAddPortMapping = useAction(
    gql`
      mutation(
        $applicationId: ID!
        $protocol: String
        $serviceName: String!
        $servicePort: Int!
        $publicPort: Int!
        $loopback: Boolean
      ) {
        composeAddPortMapping(
          id: $applicationId
          serviceName: $serviceName
          protocol: $protocol
          servicePort: $servicePort
          publicPort: $publicPort
          loopback: $loopback
        ) {
          id
        }
      }
    `,
  );

  return (
    <>
      <Widget title={title}>
        <Form
          onSubmit={async ({ port, publicPort, ...formData }) => {
            const [serviceName, protocol, servicePort] = port.split("/");
            await composeAddPortMapping({
              applicationId,
              ...formData,
              serviceName,
              protocol,
              servicePort: Number(servicePort),
              publicPort: Number(publicPort),
            });
            history.push(`/applications/${applicationId}`);
          }}
          fields={[
            //
            [
              "Select",
              "port",
              "",
              {
                required: true,
                options: _.flatten(
                  data?.composeApplication.containers.map(container =>
                    container.ports.map(({ protocol, port }) =>
                      [container.serviceName, protocol, port].join("/"),
                    ),
                  ),
                ),
              },
            ],
            [
              "String",
              "publicPort",
              "",
              {
                required: true,
                type: "number",
              },
            ],
            ["Boolean", "loopback", true],
          ]}
        />
      </Widget>
    </>
  );
}
