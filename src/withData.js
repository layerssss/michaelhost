import { compose, branch, renderNothing } from "recompose";
import { graphql } from "react-apollo";

const withData = (query, config = {}) =>
  compose(
    graphql(query, {
      ...config,
    }),
    branch(({ data }) => data.loading || data.error, renderNothing),
  );

export default withData;
