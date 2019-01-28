import React from "react";
import { Helmet } from "react-helmet";
import { graphql } from "react-apollo";
import gql from "graphql-tag";
import { Table, Button, ButtonToolbar } from "react-bootstrap";
import { compose } from "recompose";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Route } from "react-router";

import withData from "../helpers/withData.js";
import withRouter from "../helpers/withRouter.js";
import paths from "../helpers/paths.js";

import NewCronJobDialog from "./NewCronJobDialog.js";
import CronJobDialog from "./CronJobDialog.js";

export default compose(
  withRouter,
  withData(
    gql`
      query {
        cronJobs {
          id
          command
          cron
        }
      }
    `,
  ),
  graphql(
    gql`
      mutation($id: ID!) {
        deleteCronJob(id: $id) {
          id
        }
      }
    `,
    {
      name: "deleteCronJob",
      options: {
        refetchQueries: [
          {
            query: gql`
              {
                cronJobs {
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
        triggerCronJob(id: $id) {
          id
        }
      }
    `,
    {
      name: "triggerCronJob",
    },
  ),
)(
  ({
    data,
    cronJobPath,
    newCronJobPath,
    history,
    deleteCronJob,
    triggerCronJob,
  }) => (
    <>
      <Helmet title="Cron Jobs" />
      <Table responsive>
        <thead>
          <tr>
            <th>Command</th>
            <th>Cron</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {data.cronJobs.map(cronJob => (
            <tr key={cronJob.id}>
              <td>{cronJob.command}</td>
              <td>{cronJob.cron}</td>
              <td>
                <ButtonToolbar>
                  <Button
                    bsSize="xs"
                    bsStyle="info"
                    onClick={async () =>
                      await triggerCronJob({
                        variables: {
                          id: cronJob.id,
                        },
                      })
                    }
                  >
                    Trigger
                  </Button>
                  <Button
                    bsSize="xs"
                    href={cronJobPath({ cronJobId: cronJob.id })}
                    onClick={event => {
                      event.preventDefault();
                      history.push(cronJobPath({ cronJobId: cronJob.id }));
                    }}
                  >
                    <FontAwesomeIcon icon="pen" />
                    Edit
                  </Button>
                  <Button
                    bsSize="xs"
                    bsStyle="danger"
                    onClick={async () => {
                      await deleteCronJob({
                        variables: {
                          id: cronJob.id,
                        },
                      });
                    }}
                  >
                    <FontAwesomeIcon icon="trash" />
                    Delete
                  </Button>
                </ButtonToolbar>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      <ButtonToolbar>
        <Button
          href={newCronJobPath()}
          onClick={event => {
            event.preventDefault();
            history.push(newCronJobPath());
          }}
        >
          <FontAwesomeIcon icon="plus" />
          New Cron Job
        </Button>
      </ButtonToolbar>
      <Route path={paths.newCronJobPath.matcher} component={NewCronJobDialog} />
      <Route path={paths.cronJobPath.matcher} component={CronJobDialog} />
    </>
  ),
);
