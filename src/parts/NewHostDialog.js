import React from "react";
import uuid from "uuid";
import gql from "graphql-tag";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { graphql } from "react-apollo";
import serialize from "form-serialize";
import {
  Modal,
  FormGroup,
  FormControl,
  ControlLabel,
  Checkbox,
  Button,
} from "react-bootstrap";
import { compose } from "recompose";

import withRouter from "../helpers/withRouter.js";

export default compose(
  withRouter,
  graphql(
    gql`
      mutation(
        $id: ID!
        $hostname: String!
        $ssl: Boolean!
        $upstream: String!
        $enabled: Boolean!
        $redirect: Boolean!
        $changeOrigin: Boolean!
        $oidcConfig: OidcConfigInput
      ) {
        updateHost(
          id: $id
          hostname: $hostname
          ssl: $ssl
          upstream: $upstream
          enabled: $enabled
          redirect: $redirect
          changeOrigin: $changeOrigin
          oidcConfig: $oidcConfig
        ) {
          id
          hostname
          upstream
          ssl
          enabled
          redirect
          changeOrigin
          oidcConfig {
            id
            discoveryUrl
            clientId
            clientSecret
            allowEmails
          }
        }
      }
    `,
    {
      name: "updateHost",
      options: {
        refetchQueries: [
          {
            query: gql`
              {
                hosts {
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
  class NewHostDialog extends React.Component {
    state = {
      oidcEnabled: false,
    };

    render() {
      const { history, updateHost, hostsPath } = this.props;

      return (
        <Modal show onHide={() => history.push(hostsPath())}>
          <form
            onSubmit={async event => {
              event.preventDefault();
              const formData = serialize(event.target, {
                hash: true,
                empty: true,
              });

              await updateHost({
                variables: {
                  id: formData.id,
                  hostname: formData.hostname,
                  upstream: formData.upstream,
                  ssl: Boolean(formData.ssl),
                  enabled: Boolean(formData.enabled),
                  redirect: Boolean(formData.redirect),
                  changeOrigin: Boolean(formData.changeOrigin),
                  oidcConfig: !this.state.oidcEnabled
                    ? null
                    : {
                        discoveryUrl: formData.discoveryUrl,
                        clientId: formData.clientId,
                        clientSecret: formData.clientSecret,
                        allowEmails: formData.allowEmailsString
                          .split(",")
                          .map(s => s.trim()),
                      },
                },
              });

              history.push(hostsPath());
            }}
          >
            <Modal.Header closeButton>
              <Modal.Title>New Host</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <FormGroup>
                <ControlLabel>ID</ControlLabel>
                <FormControl name="id" defaultValue={uuid.v4().slice(0, 8)} />
              </FormGroup>
              <FormGroup>
                <Checkbox name="enabled">Enabble</Checkbox>
                <ControlLabel>Hostname</ControlLabel>
                <FormControl name="hostname" />
              </FormGroup>
              <FormGroup>
                <ControlLabel>Upstream</ControlLabel>
                <FormControl name="upstream" />
              </FormGroup>
              <Checkbox name="redirect">Redirect</Checkbox>
              <Checkbox name="ssl">SSL</Checkbox>
              <Checkbox name="changeOrigin">Change Origin</Checkbox>
              <Checkbox
                checked={this.state.oidcEnabled}
                onChange={event =>
                  this.setState({ oidcEnabled: event.currentTarget.checked })
                }
              >
                Enabble OIDC auth
              </Checkbox>
              {this.state.oidcEnabled && (
                <>
                  <FormGroup>
                    <ControlLabel>Discovery URL</ControlLabel>
                    <FormControl name="discoveryUrl" />
                  </FormGroup>
                  <FormGroup>
                    <ControlLabel>Client ID</ControlLabel>
                    <FormControl name="clientId" />
                  </FormGroup>
                  <FormGroup>
                    <ControlLabel>Client Secret</ControlLabel>
                    <FormControl name="clientSecret" />
                  </FormGroup>
                  <FormGroup>
                    <ControlLabel>Allow Emails</ControlLabel>
                    <FormControl name="allowEmailsString" />
                  </FormGroup>
                </>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button bsStyle="primary" type="submit">
                <FontAwesomeIcon icon="save" />
                Create Host
              </Button>
            </Modal.Footer>
          </form>
        </Modal>
      );
    }
  },
);
