import React from "react";
import gql from "graphql-tag";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { graphql } from "react-apollo";
import serialize from "form-serialize";
import { Modal, Button } from "react-bootstrap";
import { compose } from "recompose";

import CronJobForm from "../components/CronJobForm.js";
import withRouter from "../helpers/withRouter.js";

export default compose(
  withRouter,
  graphql(
    gql`
      mutation($command: String!, $cron: String!) {
        createCronJob(command: $command, cron: $cron) {
          id
          command
          cron
        }
      }
    `,
    {
      name: "createCronJob",
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
)(({ history, createCronJob, cronJobsPath }) => (
  <>
    <Modal show onHide={() => history.push(cronJobsPath())}>
      <form
        onSubmit={async event => {
          event.preventDefault();
          const formData = serialize(event.target, {
            hash: true,
            empty: true,
          });

          await createCronJob({
            variables: {
              command: formData.command,
              cron: formData.cron,
            },
          });

          history.push(cronJobsPath());
        }}
      >
        <Modal.Header closeButton>
          <Modal.Title>New Cron Job</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <CronJobForm cronJob={{ command: "", cron: "0 8 * * *" }} />
        </Modal.Body>
        <Modal.Footer>
          <Button bsStyle="primary" type="submit">
            <FontAwesomeIcon icon="save" />
            Create Cron Job
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  </>
));
