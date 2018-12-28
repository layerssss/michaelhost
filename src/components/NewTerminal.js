import React from "react";
import { Helmet } from "react-helmet";
import gql from "graphql-tag";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { graphql } from "react-apollo";
import serialize from "form-serialize";
import { FormGroup, FormControl, ControlLabel, Button } from "react-bootstrap";
import { compose } from "recompose";

import withRouter from "../helpers/withRouter.js";

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
  class NewTerminal extends React.Component {
    render() {
      const { history, runCommand, terminalPath } = this.props;

      return (
        <>
          <Helmet title="New Terminal" />
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
        </>
      );
    }
  },
);
