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
          containers {
            id
            serviceName
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
      mutation($id: ID!, $composeContainerId: ID!, $command: String!) {
        composeExec(
          id: $id
          composeContainerId: $composeContainerId
          command: $command
        ) {
          id
        }
      }
    `,
    {
      name: "composeExec",
    },
  ),
)(({ composeExec, data, onClose }) => (
  <>
    <form
      onSubmit={async event => {
        event.preventDefault();
        const formData = serialize(event.target, {
          hash: true,
          empty: true,
        });

        await composeExec({
          variables: {
            id: data.composeApplication.id,
            composeContainerId: formData.composeContainerId,
            command: formData.command,
          },
        });

        onClose();
      }}
    >
      <FormGroup>
        <ControlLabel>Service:</ControlLabel>
        <FormControl required name="composeContainerId" componentClass="select">
          {data.composeApplication.containers &&
            data.composeApplication.containers.map(composeContainer => (
              <option key={composeContainer.id} value={composeContainer.id}>
                {composeContainer.id} ({composeContainer.serviceName})
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
          Exec
        </Button>
        <Button onClick={() => onClose()}>Cancel</Button>
      </ButtonToolbar>
    </form>
  </>
));
