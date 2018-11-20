import React from "react";
import { Helmet } from "react-helmet";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { graphql } from "react-apollo";
import gql from "graphql-tag";
import { Table, Button, ButtonToolbar } from "react-bootstrap";
import { compose  } from "recompose";
import { Route, Switch } from "react-router";

import MountedApp from "./MountedApp.js";
import NewMountedAppDialog from "./NewMountedAppDialog.js";
import withRouter from "./withRouter.js";
import paths from "./paths.js";
import withData from './withData.js';


export default compose(
  withData(gql`
    query {
      mountedApps {
        id
        name
        upstream
      }
    }
  `),
  withRouter,
  graphql(
    gql`
      mutation($id: ID!) {
        deleteMountedApp(id: $id) {
          id
        }
      }
    `,
    {
      name: "deleteMountedApp",
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
  class MountedApps extends React.Component {
    render() {
      const { data, newMountedAppPath, history, deleteMountedApp } = this.props;
      return (
        <>
          <Helmet title="Mounted Apps" />
          <Table responsive>
            <thead>
              <tr>
                <th>Name</th>
                <th>Upstearm</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.mountedApps.map(mountedApp => (
                <tr key={mountedApp.id}>
                  <td>{mountedApp.name}</td>
                  <td>{mountedApp.upstream}</td>
                  <td>
                    <ButtonToolbar>
                      <Button
                        bsSize="xs"
                        bsStyle="danger"
                        onClick={async () => {
                          await deleteMountedApp({
                            variables: {
                              id: mountedApp.id,
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
              href={newMountedAppPath()}
              onClick={event => {
                event.preventDefault();
                history.push(newMountedAppPath());
              }}
            >
              <FontAwesomeIcon icon="plus" />
              New Mounted App
            </Button>
          </ButtonToolbar>
          <Switch>
            <Route
              path={paths.newMountedAppPath.matcher}
              component={NewMountedAppDialog}
            />
            <Route path={paths.mountedAppPath.matcher} component={MountedApp} />
          </Switch>
        </>
      );
    }
  },
);
