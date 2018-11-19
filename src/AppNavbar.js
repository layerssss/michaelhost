import React from "react";
import gql from "graphql-tag";
import { compose, branch, renderNothing } from "recompose";
import { Navbar, Nav, NavItem, NavDropdown, MenuItem } from "react-bootstrap";
import { graphql } from "react-apollo";

import withRouter from "./withRouter.js";
import "./App.css";

export default compose(
  // wrap
  withRouter,
  graphql(gql`
    query {
      terminals {
        id
        name
      }
      mountedApps {
        id
        name
      }
    }
  `),
  branch(({ data }) => data.loading || data.error, renderNothing),
)(
  class App extends React.Component {
    handleNavClick = event => {
      const { history } = this.props;
      event.preventDefault();
      history.push(event.currentTarget.getAttribute("href"));
    };

    render() {
      const {
        data,
        location,
        rootPath,
        hostsPath,
        terminalPath,
        terminalsPath,
        mountedAppsPath,
        mountedAppPath,
      } = this.props;

      return (
        <Navbar staticTop>
          <Nav activeHref={location.pathname}>
            <NavItem href={rootPath()} onClick={this.handleNavClick}>
              Dashboard
            </NavItem>
            {data.mountedApps.map(mountedApp => (
              <NavItem
                key={mountedApp.id}
                href={mountedAppPath({
                  mountedAppName: encodeURIComponent(
                    mountedApp.name.toLowerCase(),
                  ),
                })}
                onClick={this.handleNavClick}
              >
                {mountedApp.name}
              </NavItem>
            ))}
            {data.terminals.map(terminal => (
              <NavItem
                key={terminal.id}
                href={terminalPath({ terminalId: terminal.id })}
                onClick={this.handleNavClick}
              >
                {terminal.name}
              </NavItem>
            ))}
          </Nav>
          <Nav pullRight>
            <NavItem href={terminalsPath()} onClick={this.handleNavClick}>
              Create Terminal
            </NavItem>
            <NavDropdown
              title="Configuration"
              id="navbar-configuration-dropdown"
            >
              <MenuItem href={hostsPath()} onClick={this.handleNavClick}>
                Hosts
              </MenuItem>
              <MenuItem href={mountedAppsPath()} onClick={this.handleNavClick}>
                Mounted Apps
              </MenuItem>
            </NavDropdown>
          </Nav>
        </Navbar>
      );
    }
  },
);
