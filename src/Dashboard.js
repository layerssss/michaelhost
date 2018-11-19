import React from "react";
import { Helmet } from "react-helmet";
import gql from "graphql-tag";
import { compose, branch, renderNothing } from "recompose";
import { graphql } from "react-apollo";

export default compose(
  graphql(gql`
    query {
      hostname
    }
  `),
  branch(({ data }) => data.loading || data.error, renderNothing),
)(({ data }) => (
  <>
    <Helmet title={data.hostname} />
    TODO
  </>
));
