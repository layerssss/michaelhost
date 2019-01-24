import React from "react";
import gql from "graphql-tag";
import _ from "lodash";
import { graphql } from "react-apollo";
import serialize from "form-serialize";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  FormGroup,
  FormControl,
  Checkbox,
  ControlLabel,
  Button,
  ButtonToolbar,
} from "react-bootstrap";
import { compose, withState } from "recompose";

import withRouter from "../helpers/withRouter.js";
import withData from "../helpers/withData.js";

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
  withState(
    "selectedContainer",
    "setSelectedContainer",
    ({ data }) =>
      data.composeApplication.containers &&
      (data.composeApplication.containers[0] || null),
  ),
  graphql(
    gql`
      mutation(
        $id: ID!
        $protocol: String!
        $loopback: Boolean!
        $serviceName: String!
        $servicePort: Int!
        $publicPort: Int!
      ) {
        composeAddPortMapping(
          id: $id
          protocol: $protocol
          serviceName: $serviceName
          servicePort: $servicePort
          publicPort: $publicPort
          loopback: $loopback
        ) {
          id
          portMappings {
            id
            protocol
            serviceName
            servicePort
            publicPort
            loopback
            connectionsCount
          }
        }
      }
    `,
    {
      name: "composeAddPortMapping",
    },
  ),
)(
  ({
    composeAddPortMapping,
    data,
    onClose,
    setSelectedContainer,
    selectedContainer,
  }) => (
    <>
      <form
        onSubmit={async event => {
          event.preventDefault();
          const formData = serialize(event.target, {
            hash: true,
            empty: true,
          });

          await composeAddPortMapping({
            variables: {
              id: data.composeApplication.id,
              protocol: formData.servicePortSpec.split("/")[0],
              serviceName: selectedContainer.serviceName,
              servicePort: Number(formData.servicePortSpec.split("/")[1]),
              publicPort: Number(formData.publicPort),
              loopback: Boolean(formData.loopback),
            },
          });

          onClose();
        }}
      >
        <FormGroup>
          <ControlLabel>Service:</ControlLabel>
          <FormControl
            required
            value={(selectedContainer && selectedContainer.serviceName) || ""}
            onChange={event =>
              setSelectedContainer(
                data.composeApplication.containers &&
                  data.composeApplication.containers.find(
                    c => c.serviceName === event.currentTarget.value,
                  ),
              )
            }
            componentClass="select"
          >
            {_.uniq(
              (data.composeApplication.containers || []).map(
                c => c.serviceName,
              ),
            ).map(serviceName => (
              <option key={serviceName} value={serviceName}>
                {serviceName}
              </option>
            ))}
          </FormControl>
        </FormGroup>
        <FormGroup>
          <ControlLabel>Service Port:</ControlLabel>
          <FormControl required name="servicePortSpec" componentClass="select">
            {selectedContainer &&
              selectedContainer.ports
                .map(p => `${p.protocol}/${p.port}`)
                .map(portSpec => (
                  <option key={portSpec} value={portSpec}>
                    {portSpec}
                  </option>
                ))}
          </FormControl>
        </FormGroup>
        <FormGroup>
          <ControlLabel>Public Port</ControlLabel>
          <FormControl
            required
            name="publicPort"
            type="number"
            min="1"
            max="65535"
          />
        </FormGroup>
        <Checkbox name="loopback" defaultChecked>
          Loopback?
        </Checkbox>
        <ButtonToolbar>
          <Button bsStyle="primary" type="submit">
            <FontAwesomeIcon icon="plus" />
            Add Port Mapping
          </Button>
          <Button onClick={() => onClose()}>Cancel</Button>
        </ButtonToolbar>
      </form>
    </>
  ),
);
