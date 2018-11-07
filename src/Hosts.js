import React from "react";
import { graphql } from "react-apollo";
import gql from "graphql-tag";
import { Table, Button, ButtonToolbar } from "react-bootstrap";
import { compose, branch, renderNothing } from "recompose";
import { Route } from "react-router";

import HostDialog from "./HostDialog.js";
import NewHostDialog from "./NewHostDialog.js";
import withRouter from "./withRouter.js";
import paths from "./paths.js";

export default compose(
  graphql(gql`
    query {
      hosts {
        id
        hostname
        upstream
        ssl
      }
    }
  `),
  branch(({ data }) => data.loading, renderNothing),
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
            `
          }
        ]
      }
    }
  )
)(
  class Hosts extends React.Component {
    render() {
      const { data, hostPath, newHostPath, history, deleteHost } = this.props;
      return (
        <>
          <Table>
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
                        Edit
                      </Button>
                      <Button
                        bsSize="xs"
                        bsStyle="danger"
                        onClick={async () => {
                          await deleteHost({
                            variables: {
                              id: host.id
                            }
                          });
                        }}
                      >
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
              New Host
            </Button>
          </ButtonToolbar>
          <Route path={paths.hostPath.matcher} component={HostDialog} />
          <Route path={paths.newHostPath.matcher} component={NewHostDialog} />
        </>
      );
    }
  }
);
