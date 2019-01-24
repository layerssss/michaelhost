import React from "react";
import gql from "graphql-tag";
import { graphql } from "react-apollo";
import serialize from "form-serialize";
import {
  FormGroup,
  FormControl,
  ControlLabel,
  Button,
  ButtonToolbar,
} from "react-bootstrap";
import { compose } from "recompose";

import withRouter from "../helpers/withRouter.js";
import withData from "../helpers/withData.js";

export default compose(
  withRouter,
  withData(
    gql`
      query($composeApplicationId: ID!) {
        composeApplication(id: $composeApplicationId) {
          id
          serviceNames
        }
      }
    `,
    ({ params }) => ({
      composeApplicationId: params.composeApplicationId,
    }),
  ),
  graphql(
    gql`
      mutation($id: ID!, $serviceName: String!, $command: String!) {
        composeRun(id: $id, serviceName: $serviceName, command: $command) {
          id
        }
      }
    `,
    {
      name: "composeRun",
    },
  ),
)(({ composeRun, data, onClose }) => (
  <>
    <form
      onSubmit={async event => {
        event.preventDefault();
        const formData = serialize(event.target, {
          hash: true,
          empty: true,
        });

        await composeRun({
          variables: {
            id: data.composeApplication.id,
            serviceName: formData.serviceName,
            command: formData.command,
          },
        });

        onClose();
      }}
    >
      <FormGroup>
        <ControlLabel>Service:</ControlLabel>
        <FormControl required name="serviceName" componentClass="select">
          {data.composeApplication.serviceNames &&
            data.composeApplication.serviceNames.map(serviceName => (
              <option key={serviceName} value={serviceName}>
                {serviceName}
              </option>
            ))}
        </FormControl>
      </FormGroup>
      <FormGroup>
        <ControlLabel>Command:</ControlLabel>
        <FormControl required name="command" />
      </FormGroup>
      <ButtonToolbar>
        <Button bsStyle="primary" type="submit">
          Run
        </Button>
        <Button onClick={() => onClose()}>Cancel</Button>
      </ButtonToolbar>
    </form>
  </>
));
