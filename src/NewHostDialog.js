import React from "react";
import gql from "graphql-tag";
import { graphql } from "react-apollo";
import serialize from "form-serialize";
import {
  Modal,
  FormGroup,
  FormControl,
  ControlLabel,
  Checkbox,
  Button
} from "react-bootstrap";
import { compose } from "recompose";

import withRouter from "./withRouter.js";

export default compose(
  withRouter,
  graphql(
    gql`
      mutation($hostname: String!, $ssl: Boolean!, $upstream: String!) {
        createHost(hostname: $hostname, ssl: $ssl, upstream: $upstream) {
          id
          hostname
          upstream
          ssl
        }
      }
    `,
    {
      name: "createHost",
      options: {
        refetchQueries: [
          {
            query: gql`
              {
                hosts {
                  id
                }
              }
            `
          }
        ]
      }
    }
  )
)(
  class NewHostDialog extends React.Component {
    render() {
      const { history, createHost } = this.props;

      return (
        <Modal show onHide={() => history.goBack()}>
          <form
            onSubmit={async event => {
              event.preventDefault();
              const formData = serialize(event.target, {
                hash: true,
                empty: true
              });

              await createHost({
                variables: {
                  hostname: formData.hostname,
                  upstream: formData.upstream,
                  ssl: Boolean(formData.ssl)
                }
              });

              history.goBack();
            }}
          >
            <Modal.Header closeButton>
              <Modal.Title>New Host</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <FormGroup>
                <ControlLabel>Hostname</ControlLabel>
                <FormControl name="hostname" />
              </FormGroup>
              <FormGroup>
                <ControlLabel>Upstream</ControlLabel>
                <FormControl name="upstream" />
              </FormGroup>
              <Checkbox name="ssl">SSL</Checkbox>
            </Modal.Body>
            <Modal.Footer>
              <Button bsStyle="primary" type="submit">
                Create Host
              </Button>
            </Modal.Footer>
          </form>
        </Modal>
      );
    }
  }
);
