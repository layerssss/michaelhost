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
        composeApplications {
          id
          name
        }
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
        composeApplicationPath,
        composeNewApplicationPath,
        cronJobsPath,
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
                  mountedAppId: mountedApp.id,
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
                  <FontAwesomeIcon icon="docker" />
                  Compose Applications
                </>
              }
              id="navbar-configuration-dropdown"
            >
              {data.composeApplications.map(composeApplication => (
                <MenuItem
                  key={composeApplication.id}
                  href={composeApplicationPath({
                    composeApplicationId: composeApplication.id,
                  })}
                  onClick={this.handleNavClick}
                >
                  <FontAwesomeIcon icon="docker" />
                  {composeApplication.name}
                </MenuItem>
              ))}
              <MenuItem
                href={composeNewApplicationPath()}
                onClick={this.handleNavClick}
              >
                <FontAwesomeIcon icon="plus" />
                Create Application
              </MenuItem>
            </NavDropdown>
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
              <MenuItem href={cronJobsPath()} onClick={this.handleNavClick}>
                <FontAwesomeIcon icon="clock" />
                Cron Jobs
              </MenuItem>
            </NavDropdown>
          </Nav>
        </Navbar>
      );
    }
  },
);
