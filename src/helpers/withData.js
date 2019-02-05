import { compose, branch, renderNothing } from "recompose";
import { graphql } from "react-apollo";

const withData = (query, getVariables = () => ({})) =>
  compose(
    graphql(query, {
      options: props => ({
        partialRefetch: true,
        errorPolicy: "all",
        variables: getVariables(props),
      }),
    }),
    branch(({ data }) => data.loading || data.error, renderNothing),
  );

export default withData;
