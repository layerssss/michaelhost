import React from "react";
import gql from "graphql-tag";
import { graphql } from "react-apollo";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  Modal,
  FormGroup,
  FormControl,
  ControlLabel,
  Checkbox,
  Button,
} from "react-bootstrap";
import { compose } from "recompose";
import serialize from "form-serialize";

import withRouter from "../helpers/withRouter.js";
import withData from "../helpers/withData.js";

export default compose(
  withRouter,
  withData(
    gql`
      query($hostId: ID!) {
        host(id: $hostId) {
          id
          enabled
          hostname
          upstream
          ssl
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
    ({ params }) => ({
      hostId: params.hostId,
    }),
  ),
  graphql(
    gql`
      mutation(
        $id: ID!
        $hostname: String!
        $ssl: Boolean!
        $enabled: Boolean!
        $redirect: Boolean!
        $changeOrigin: Boolean!
        $upstream: String!
        $oidcConfig: OidcConfigInput
      ) {
        updateHost(
          id: $id
          hostname: $hostname
          ssl: $ssl
          enabled: $enabled
          redirect: $redirect
          upstream: $upstream
          changeOrigin: $changeOrigin
          oidcConfig: $oidcConfig
        ) {
          id
          hostname
          upstream
          enabled
          redirect
          changeOrigin
          ssl
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
    },
  ),
)(
  class HostDialog extends React.Component {
    state = {
      oidcEnabled: !!this.props.data.host.oidcConfig,
    };

    render() {
      const { history, data, updateHost, hostsPath } = this.props;

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
                  id: data.host.id,
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
              <Modal.Title>Host: {data.host.hostname}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <FormGroup>
                <Checkbox name="enabled" defaultChecked={data.host.enabled}>
                  Enabble
                </Checkbox>
                <ControlLabel>Hostname</ControlLabel>
                <FormControl
                  name="hostname"
                  defaultValue={data.host.hostname}
                />
              </FormGroup>
              <FormGroup>
                <ControlLabel>Upstream</ControlLabel>
                <FormControl
                  name="upstream"
                  defaultValue={data.host.upstream}
                />
              </FormGroup>
              <Checkbox name="redirect" defaultChecked={data.host.redirect}>
                Redirect
              </Checkbox>
              <Checkbox name="ssl" defaultChecked={data.host.ssl}>
                SSL
              </Checkbox>
              <Checkbox
                name="changeOrigin"
                defaultChecked={data.host.changeOrigin}
              >
                Change Origin
              </Checkbox>
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
                    <FormControl
                      name="discoveryUrl"
                      defaultValue={
                        data.host.oidcConfig &&
                        data.host.oidcConfig.discoveryUrl
                      }
                    />
                  </FormGroup>
                  <FormGroup>
                    <ControlLabel>Client ID</ControlLabel>
                    <FormControl
                      name="clientId"
                      defaultValue={
                        data.host.oidcConfig && data.host.oidcConfig.clientId
                      }
                    />
                  </FormGroup>
                  <FormGroup>
                    <ControlLabel>Client Secret</ControlLabel>
                    <FormControl
                      name="clientSecret"
                      defaultValue={
                        data.host.oidcConfig &&
                        data.host.oidcConfig.clientSecret
                      }
                    />
                  </FormGroup>
                  <FormGroup>
                    <ControlLabel>Allow Emails</ControlLabel>
                    <FormControl
                      name="allowEmailsString"
                      defaultValue={
                        data.host.oidcConfig &&
                        data.host.oidcConfig.allowEmails.join(", ")
                      }
                    />
                  </FormGroup>
                </>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button bsStyle="primary" type="submit">
                <FontAwesomeIcon icon="save" />
                Update Host
              </Button>
            </Modal.Footer>
          </form>
        </Modal>
      );
    }
  },
);
