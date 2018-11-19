import React from "react";
import gql from "graphql-tag";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { graphql } from "react-apollo";
import serialize from "form-serialize";
import { Route, Switch, Redirect } from "react-router";
import { FormGroup, FormControl, ControlLabel, Button } from "react-bootstrap";
import { compose } from "recompose";

import paths from "./paths.js";
import Terminal from "./Terminal.js";
import withRouter from "./withRouter.js";

export default compose(
  withRouter,
  graphql(
    gql`
      mutation($command: String!, $cwd: String, $name: String) {
        runCommand(command: $command, cwd: $cwd, name: $name) {
          id
          name
        }
      }
    `,
    {
      name: "runCommand",
      options: {
        refetchQueries: [
          {
            query: gql`
              {
                terminals {
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
  class Terminals extends React.Component {
    render() {
      const { history, runCommand, terminalsPath, terminalPath } = this.props;

      return (
        <Switch>
          <Route path={paths.terminalsPath.matcher} exact>
            <form
              onSubmit={async event => {
                event.preventDefault();
                const formData = serialize(event.target, {
                  hash: true,
                  empty: true,
                });

                const {
                  data: {
                    runCommand: { id: terminalId },
                  },
                } = await runCommand({
                  variables: {
                    name: formData.name || undefined,
                    command: formData.command,
                    cwd: formData.cwd || undefined,
                  },
                });

                history.push(terminalPath({ terminalId }));
              }}
            >
              <FormGroup>
                <ControlLabel>Name</ControlLabel>
                <FormControl name="name" />
              </FormGroup>
              <FormGroup>
                <ControlLabel>Command</ControlLabel>
                <FormControl name="command" />
              </FormGroup>
              <FormGroup>
                <ControlLabel>Working Directory</ControlLabel>
                <FormControl name="cwd" />
              </FormGroup>
              <Button bsStyle="primary" type="submit">
                <FontAwesomeIcon icon="save" />
                Create Terminal
              </Button>
            </form>
          </Route>
          <Route path={paths.terminalPath.matcher}>
            <Terminal />
          </Route>
          <Redirect to={terminalsPath()} />
        </Switch>
      );
    }
  },
);
