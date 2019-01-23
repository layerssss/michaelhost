import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import gql from "graphql-tag";
import { graphql } from "react-apollo";
import serialize from "form-serialize";
import {
  Modal,
  FormGroup,
  FormControl,
  ControlLabel,
  Button,
} from "react-bootstrap";
import { compose } from "recompose";

import withRouter from "../helpers/withRouter.js";

export default compose(
  withRouter,
  graphql(
    gql`
      mutation($name: String!, $upstream: String!) {
        createMountedApp(name: $name, upstream: $upstream) {
          id
          name
          upstream
        }
      }
    `,
    {
      name: "createMountedApp",
      options: {
        refetchQueries: [
          {
            query: gql`
              {
                mountedApps {
                  id
                }
              }
            `,
          },
        ],
      },
    },
  ),
)(
  class NewMountedAppDialog extends React.Component {
    render() {
      const { history, createMountedApp, mountedAppsPath } = this.props;

      return (
        <Modal show onHide={() => history.push(mountedAppsPath())}>
          <form
            onSubmit={async event => {
              event.preventDefault();
              const formData = serialize(event.target, {
                hash: true,
                empty: true,
              });

              await createMountedApp({
                variables: {
                  name: formData.name,
                  upstream: formData.upstream,
                },
              });

              history.push(mountedAppsPath());
            }}
          >
            <Modal.Header closeButton>
              <Modal.Title>New Mounted App</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <FormGroup>
                <ControlLabel>Name</ControlLabel>
                <FormControl name="name" />
              </FormGroup>
              <FormGroup>
                <ControlLabel>Upstream</ControlLabel>
                <FormControl name="upstream" />
              </FormGroup>
            </Modal.Body>
            <Modal.Footer>
              <Button bsStyle="primary" type="submit">
                <FontAwesomeIcon icon="plus" />
                Create Mounted App
              </Button>
            </Modal.Footer>
          </form>
        </Modal>
      );
    }
  },
);
