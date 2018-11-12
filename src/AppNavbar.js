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
      } = this.props;

      return (
        <Navbar>
          <Nav activeHref={location.pathname}>
            <NavItem href={rootPath()} onClick={this.handleNavClick}>
              Dashboard
            </NavItem>
            <NavItem href={hostsPath()} onClick={this.handleNavClick}>
              Hosts
            </NavItem>
            <NavDropdown title="Terminals" id="navbar-terminals-dropdown">
              {!data.terminals.length && (
                <MenuItem disabled>No terminals</MenuItem>
              )}
              {data.terminals.map(terminal => (
                <MenuItem
                  key={terminal.id}
                  href={terminalPath({ terminalId: terminal.id })}
                  onClick={this.handleNavClick}
                >
                  {terminal.name}
                </MenuItem>
              ))}
              <MenuItem divider />
              <MenuItem href={terminalsPath()} onClick={this.handleNavClick}>
                Run Command
              </MenuItem>
            </NavDropdown>
          </Nav>
        </Navbar>
      );
    }
  },
);
