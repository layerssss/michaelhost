import React from "react";
import gql from "graphql-tag";
import { graphql } from "react-apollo";
import {
  Modal,
  FormGroup,
  FormControl,
  ControlLabel,
  Checkbox,
  Button,
} from "react-bootstrap";
import { compose, branch, renderNothing } from "recompose";
import serialize from "form-serialize";

import withRouter from "./withRouter.js";

export default compose(
  withRouter,
  graphql(
    gql`
      query($hostId: ID!) {
        host(id: $hostId) {
          id
          hostname
          upstream
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
      options: ({ params }) => ({
        variables: {
          hostId: params.hostId,
        },
      }),
    },
  ),
  branch(({ data }) => data.loading || data.error, renderNothing),
  graphql(
    gql`
      mutation(
        $id: ID!
        $hostname: String!
        $ssl: Boolean!
        $upstream: String!
        $oidcConfig: OidcConfigInput
      ) {
        updateHost(
          id: $id
          hostname: $hostname
          ssl: $ssl
          upstream: $upstream
          oidcConfig: $oidcConfig
        ) {
          id
          hostname
          upstream
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
      const { history, data, updateHost } = this.props;

      return (
        <Modal show onHide={() => history.goBack()}>
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

              history.goBack();
            }}
          >
            <Modal.Header closeButton>
              <Modal.Title>Host: {data.host.hostname}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <FormGroup>
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
              <Checkbox name="ssl" defaultChecked={data.host.ssl}>
                SSL
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
                Update Host
              </Button>
            </Modal.Footer>
          </form>
        </Modal>
      );
    }
  },
);
