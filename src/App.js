import React from "react";
import { compose } from "recompose";
import { Route, Switch, Redirect } from "react-router";
import { Grid } from "react-bootstrap";

import AppNavbar from "./AppNavbar.js";
import withRouter from "./withRouter.js";
import Hosts from "./Hosts.js";
import Terminals from "./Terminals.js";
import paths from "./paths.js";
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
          <Grid>
            <Switch>
              <Route
                path={paths.rootPath.matcher}
                exact
                render={() => "TODO: Dashboard"}
              />
              <Route path={paths.hostsPath.matcher} component={Hosts} />
              <Route path={paths.terminalsPath.matcher} component={Terminals} />
              <Redirect to={rootPath()} />
            </Switch>
          </Grid>
        </>
      );
    }
  },
);
