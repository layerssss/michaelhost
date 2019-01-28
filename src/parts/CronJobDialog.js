import React from "react";
import gql from "graphql-tag";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { graphql } from "react-apollo";
import serialize from "form-serialize";
import { Modal, Button } from "react-bootstrap";
import { compose } from "recompose";

import CronJobForm from "../components/CronJobForm.js";
import withRouter from "../helpers/withRouter.js";
import withData from "../helpers/withData.js";

export default compose(
  withRouter,
  withData(
    gql`
      query($cronJobId: ID!) {
        cronJob(id: $cronJobId) {
          id
          command
          cron
        }
      }
    `,
    ({ params }) => ({ cronJobId: params.cronJobId }),
  ),
  graphql(
    gql`
      mutation($id: ID!, $command: String!, $cron: String!) {
        updateCronJob(id: $id, command: $command, cron: $cron) {
          id
          command
          cron
        }
      }
    `,
    {
      name: "updateCronJob",
    },
  ),
)(({ data, history, updateCronJob, cronJobsPath }) => (
  <>
    <Modal show onHide={() => history.push(cronJobsPath())}>
      <form
        onSubmit={async event => {
          event.preventDefault();
          const formData = serialize(event.target, {
            hash: true,
            empty: true,
          });

          await updateCronJob({
            variables: {
              id: data.cronJob.id,
              command: formData.command,
              cron: formData.cron,
            },
          });

          history.push(cronJobsPath());
        }}
      >
        <Modal.Header closeButton>
          <Modal.Title>Edit Cron Job</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <CronJobForm cronJob={data.cronJob} />
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
