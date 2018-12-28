import React from "react";
import gql from "graphql-tag";
import { compose } from "recompose";
import { Navbar, Nav, NavItem, NavDropdown, MenuItem } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import withRouter from "../helpers/withRouter.js";
import withData from "../helpers/withData.js";

import "./App.css";

export default compose(
  // wrap
  withRouter,
  withData(
    gql`
      query {
        terminals {
          id
          name
        }
        mountedApps {
          id
          name
        }
        hostname
      }
    `,
  ),
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
        logPath,
        terminalPath,
        terminalsPath,
        mountedAppsPath,
        mountedAppPath,
      } = this.props;

      return (
        <Navbar fluid staticTop>
          <Nav activeHref={location.pathname}>
            <NavItem href={rootPath()} onClick={this.handleNavClick}>
              {data.hostname}
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
                <FontAwesomeIcon icon="archive" />
                {mountedApp.name}
              </NavItem>
            ))}
            {data.terminals.map(terminal => (
              <NavItem
                key={terminal.id}
                href={terminalPath({ terminalId: terminal.id })}
                onClick={this.handleNavClick}
              >
                <FontAwesomeIcon icon="terminal" />
                {terminal.name}
              </NavItem>
            ))}
          </Nav>
          <Nav pullRight>
            <NavItem href={logPath()} onClick={this.handleNavClick}>
              <FontAwesomeIcon icon="terminal" />
              Logs
            </NavItem>
            <NavItem href={terminalsPath()} onClick={this.handleNavClick}>
              <FontAwesomeIcon icon="plus" />
              Create Terminal
            </NavItem>
            <NavDropdown
              title={
                <>
                  <FontAwesomeIcon icon="cogs" />
                  Configuration
                </>
              }
              id="navbar-configuration-dropdown"
            >
              <MenuItem href={hostsPath()} onClick={this.handleNavClick}>
                <FontAwesomeIcon icon="globe-asia" />
                Hosts
              </MenuItem>
              <MenuItem href={mountedAppsPath()} onClick={this.handleNavClick}>
                <FontAwesomeIcon icon="archive" />
                Mounted Apps
              </MenuItem>
            </NavDropdown>
          </Nav>
        </Navbar>
      );
    }
  },
);
