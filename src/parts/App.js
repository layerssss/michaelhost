import React from "react";
import { compose, withProps, lifecycle } from "recompose";
import { Route, Switch } from "react-router";
import { Grid } from "react-bootstrap";
import gql from "graphql-tag";

import paths from "../helpers/paths.js";

import AppNavbar from "./AppNavbar.js";
import Hosts from "./Hosts.js";
import Terminals from "./Terminals.js";
import MountedApps from "./MountedApps.js";
import MountedApp from "./MountedApp.js";
import Dashboard from "./Dashboard.js";
import Log from "./Log.js";
import ConfirmDialog from "./ConfirmDialog.js";
import ComposeApplication from "./ComposeApplication.js";
import ComposeNewApplication from "./ComposeNewApplication.js";
import CronJobs from "./CronJobs.js";
import withWebSocket from "../helpers/withWebSocket.js";
import apolloClient from "../helpers/apolloClient.js";
import "./App.css";

export default compose(
  withProps(() => ({
    webSocketPath: `/api/state`,
  })),
  withWebSocket,
  lifecycle({
    componentDidMount() {
      const { webSocket } = this.props;
      webSocket.addEventListener("message", event => {
        const message = JSON.parse(event.data);
        if (!message.terminals || !message.composeApplications) return;
        apolloClient.writeQuery({
          query: gql`
            query {
              terminals {
                id
                name
              }
            }
          `,
          data: message,
        });
      });
    },
  }),
)(() => (
  // wrap
  <>
    <AppNavbar />
    <Grid fluid>
      <Switch>
        <Route path={paths.rootPath.matcher} exact component={Dashboard} />
        <Route path={paths.logPath.matcher} component={Log} />
        <Route path={paths.hostsPath.matcher} component={Hosts} />
        <Route path={paths.terminalsPath.matcher} component={Terminals} />
        <Route path={paths.mountedAppPath.matcher} component={MountedApp} />
        <Route path={paths.mountedAppsPath.matcher} component={MountedApps} />
        <Route
          path={paths.composeApplicationPath.matcher}
          component={ComposeApplication}
        />
        <Route
          path={paths.composeNewApplicationPath.matcher}
          component={ComposeNewApplication}
        />
        <Route path={paths.cronJobsPath.matcher} component={CronJobs} />
        <Route render={() => <>Page Not Found</>} />
      </Switch>
    </Grid>
    <ConfirmDialog />
  </>
));
