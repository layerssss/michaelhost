import React from "react";
import uuid from "uuid";
import gql from "graphql-tag";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { graphql } from "react-apollo";
import serialize from "form-serialize";
import { Helmet } from "react-helmet";
import {
  Panel,
  FormGroup,
  FormControl,
  ControlLabel,
  Button,
} from "react-bootstrap";
import { compose } from "recompose";

import withRouter from "../helpers/withRouter.js";

export default compose(
  withRouter,
  graphql(
    gql`
      mutation($id: ID!, $repo: String!, $branch: String!, $path: String!) {
        composeCreateApplication(
          id: $id
          repo: $repo
          branch: $branch
          path: $path
        ) {
          id
          name
          repo
          branch
          path
        }
      }
    `,
    {
      name: "composeCreateApplication",
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
)(({ history, composeCreateApplication, composeApplicationPath }) => (
  <>
    <Helmet title="New Application" />
    <form
      onSubmit={async event => {
        event.preventDefault();
        const formData = serialize(event.target, {
          hash: true,
          empty: true,
        });

        const result = await composeCreateApplication({
          variables: {
            id: formData.id,
            repo: formData.repo,
            branch: formData.branch,
            path: formData.path,
          },
        });

        history.push(
          composeApplicationPath({
            composeApplicationId: result.data.composeCreateApplication.id,
          }),
        );
      }}
    >
      <Panel>
        <Panel.Heading>New Application</Panel.Heading>
        <Panel.Body>
          <FormGroup>
            <ControlLabel>ID</ControlLabel>
            <FormControl
              required
              name="id"
              defaultValue={uuid.v4().slice(0, 8)}
            />
          </FormGroup>
          <FormGroup>
            <ControlLabel>Repository</ControlLabel>
            <FormControl required name="repo" />
          </FormGroup>
          <FormGroup>
            <ControlLabel>Branch</ControlLabel>
            <FormControl required name="branch" defaultValue="master" />
          </FormGroup>
          <FormGroup>
            <ControlLabel>Path</ControlLabel>
            <FormControl name="path" />
          </FormGroup>
        </Panel.Body>
        <Panel.Footer>
          <Button bsStyle="primary" type="submit">
            <FontAwesomeIcon icon="save" />
            Create Application
          </Button>
        </Panel.Footer>
      </Panel>
    </form>
  </>
));
