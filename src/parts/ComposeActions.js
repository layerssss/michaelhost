import React from "react";
import { graphql } from "react-apollo";
import { compose, withState } from "recompose";
import gql from "graphql-tag";
import { Panel, ButtonToolbar, Button } from "react-bootstrap";

import withData from "../helpers/withData.js";
import withRouter from "../helpers/withRouter.js";
import TerminalPanel from "../components/TerminalPanel.js";
import ComposeNewPortMappingForm from "./ComposeNewPortMappingForm.js";
import ComposeExecForm from "./ComposeExecForm.js";
import ComposeRunForm from "./ComposeRunForm.js";

export default compose(
  withRouter,
  withData(
    gql`
      query($composeApplicationId: ID!) {
        composeApplication(id: $composeApplicationId) {
          id
          task {
            id
            name
            terminal {
              id
            }
          }
        }
      }
    `,
    ({ params }) => ({
      composeApplicationId: params.composeApplicationId,
    }),
  ),
  graphql(
    gql`
      mutation($id: ID!) {
        composeDeleteApplication(id: $id) {
          id
        }
      }
    `,
    {
      name: "composeDeleteApplication",
      options: {
        refetchQueries: [
          {
            query: gql`
              {
                composeApplications {
                  id
                }
              }
            `,
          },
        ],
      },
    },
  ),
  graphql(
    gql`
      mutation($id: ID!) {
        composePS(id: $id) {
          id
        }
      }
    `,
    {
      name: "composePS",
    },
  ),
  graphql(
    gql`
      mutation($id: ID!) {
        composeUp(id: $id) {
          id
        }
      }
    `,
    {
      name: "composeUp",
    },
  ),
  graphql(
    gql`
      mutation($id: ID!) {
        composeDown(id: $id) {
          id
        }
      }
    `,
    {
      name: "composeDown",
    },
  ),
  withState("FormComponent", "setFormComponent", null),
)(
  ({
    data,
    composeDeleteApplication,
    composePS,
    composeUp,
    composeDown,
    history,
    rootPath,
    FormComponent,
    setFormComponent,
  }) => (
    <>
      <Panel>
        <Panel.Heading>Actions</Panel.Heading>
        <Panel.Body>
          {!FormComponent && (
            <ButtonToolbar>
              <Button
                bsStyle="info"
                onClick={async () =>
                  await composeUp({
                    variables: { id: data.composeApplication.id },
                  })
                }
              >
                Up
              </Button>
              <Button
                bsStyle="info"
                onClick={async () =>
                  await composeDown({
                    variables: { id: data.composeApplication.id },
                  })
                }
              >
                Down
              </Button>
              <Button
                bsStyle="info"
                onClick={async () =>
                  await composePS({
                    variables: { id: data.composeApplication.id },
                  })
                }
              >
                Status
              </Button>
              <Button
                bsStyle="danger"
                onClick={async () => {
                  await composeDeleteApplication({
                    variables: {
                      id: data.composeApplication.id,
                    },
                  });
                  history.push(rootPath());
                }}
              >
                Delete
              </Button>
              <Button
                onClick={() =>
                  setFormComponent(() => ComposeNewPortMappingForm)
                }
              >
                Map Port
              </Button>
              <Button onClick={() => setFormComponent(() => ComposeExecForm)}>
                Exec
              </Button>
              <Button onClick={() => setFormComponent(() => ComposeRunForm)}>
                Run
              </Button>
            </ButtonToolbar>
          )}
          {FormComponent && (
            <FormComponent onClose={() => setFormComponent(() => null)} />
          )}
        </Panel.Body>
      </Panel>
      {data.composeApplication.task &&
        data.composeApplication.task.terminal && (
          <TerminalPanel
            title={data.composeApplication.task.name}
            terminalId={data.composeApplication.task.terminal.id}
          />
        )}
    </>
  ),
);
