import React from "react";
import { Helmet } from "react-helmet";
import { graphql } from "react-apollo";
import gql from "graphql-tag";
import { Table, Button, ButtonToolbar } from "react-bootstrap";
import { compose } from "recompose";
import { Route } from "react-router";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import withData from "./withData.js";
import HostDialog from "./HostDialog.js";
import NewHostDialog from "./NewHostDialog.js";
import withRouter from "./withRouter.js";
import paths from "./paths.js";

export default compose(
  withData(
    gql`
      query {
        hosts {
          id
          hostname
          upstream
          origin
          ssl
        }
      }
    `,
    { options: { partialRefetch: true } },
  ),
  withRouter,
  graphql(
    gql`
      mutation($id: ID!) {
        deleteHost(id: $id) {
          id
        }
      }
    `,
    {
      name: "deleteHost",
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
  class Hosts extends React.Component {
    render() {
      const { data, hostPath, newHostPath, history, deleteHost } = this.props;
      return (
        <>
          <Helmet title="Hosts" />
          <Table responsive>
            <thead>
              <tr>
                <th>Hostname</th>
                <th>SSL</th>
                <th>Upstearm</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.hosts.map(host => (
                <tr key={host.id}>
                  <td>{host.hostname}</td>
                  <td>{String(host.ssl)}</td>
                  <td>{host.upstream}</td>
                  <td>
                    <ButtonToolbar>
                      <Button
                        bsSize="xs"
                        href={hostPath({ hostId: host.id })}
                        onClick={event => {
                          event.preventDefault();
                          history.push(hostPath({ hostId: host.id }));
                        }}
                      >
                        <FontAwesomeIcon icon="pen" />
                        Edit
                      </Button>
                      <Button bsSize="xs" bsStyle="info" href={host.origin}>
                        <FontAwesomeIcon icon="external-link-alt" />
                        Open
                      </Button>
                      <Button
                        bsSize="xs"
                        bsStyle="danger"
                        onClick={async () => {
                          await deleteHost({
                            variables: {
                              id: host.id,
                            },
                          });
                        }}
                      >
                        <FontAwesomeIcon icon="trash" />
                        Delete
                      </Button>
                    </ButtonToolbar>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          <ButtonToolbar>
            <Button
              href={newHostPath()}
              onClick={event => {
                event.preventDefault();
                history.push(newHostPath());
              }}
            >
              <FontAwesomeIcon icon="plus" />
              New Host
            </Button>
          </ButtonToolbar>
          <Route path={paths.hostPath.matcher} component={HostDialog} />
          <Route path={paths.newHostPath.matcher} component={NewHostDialog} />
        </>
      );
    }
  },
);
