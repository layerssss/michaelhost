import React from "react";
import { compose } from "recompose";
import { Route, Switch, Redirect } from "react-router";
import { Grid } from "react-bootstrap";

import AppNavbar from "./AppNavbar.js";
import withRouter from "./withRouter.js";
import Hosts from "./Hosts.js";
import Terminals from "./Terminals.js";
import MountedApps from "./MountedApps.js";
import paths from "./paths.js";
import Dashboard from "./Dashboard.js";
import Log from "./Log.js";
import "./App.css";

export default compose(
  // wrap
  withRouter,
)(
  class App extends React.Component {
    render() {
      const { rootPath } = this.props;

      return (
        <>
          <AppNavbar />
          <Grid fluid>
            <Switch>
              <Route
                path={paths.rootPath.matcher}
                exact
                component={Dashboard}
              />
              <Route path={paths.logPath.matcher} exact component={Log} />
              <Route path={paths.hostsPath.matcher} component={Hosts} />
              <Route path={paths.terminalsPath.matcher} component={Terminals} />
              <Route
                path={paths.mountedAppsPath.matcher}
                component={MountedApps}
              />
              <Redirect to={rootPath()} />
            </Switch>
          </Grid>
        </>
      );
    }
  },
);
