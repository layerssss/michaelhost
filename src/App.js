import React from "react";
import { compose } from "recompose";
import { Route } from "react-router";
import { Navbar, Nav, NavItem, Grid } from "react-bootstrap";

import withRouter from "./withRouter.js";
import Host from "./Hosts.js";
import paths from "./paths.js";
import "./App.css";

export default compose(
  // wrap
  withRouter
)(
  class App extends React.Component {
    render() {
      const { params, history, rootTabPath, rootPath, hostsPath } = this.props;

      return (
        <>
          <Navbar>
            <Nav
              activeKey={params.rootTab || ""}
              onSelect={(value, event) => {
                event.preventDefault();
                history.push(rootTabPath({ rootTab: value }));
              }}
            >
              <NavItem eventKey="" href={rootPath()}>
                Dashboard
              </NavItem>
              <NavItem eventKey="hosts" href={hostsPath()}>
                Hosts
              </NavItem>
            </Nav>
          </Navbar>
          <Grid>
            <Route path={paths.hostsPath.matcher} component={Host} />
          </Grid>
        </>
      );
    }
  }
);
