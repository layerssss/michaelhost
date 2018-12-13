import { compose, branch, renderNothing } from "recompose";
import { graphql } from "react-apollo";

const withData = (query, getVariables = () => ({})) =>
  compose(
    graphql(query, {
      options: props => ({
        fetchPolicy: "cache-and-network",
        partialRefetch: true,
        errorPolicy: "all",
        variables: getVariables(props),
      }),
    }),
    branch(({ data }) => data.loading || data.error, renderNothing),
  );

export default withData;
