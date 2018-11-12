import ApolloClient from "apollo-boost";

const apolloClient = new ApolloClient({
  onError: ({ graphQLErrors, networkError }) => {
    if (graphQLErrors)
      alert(
        ["Error:", ...graphQLErrors.map(({ message }) => message)].join("\n"),
      );

    if (networkError) alert(`[Network error]: ${networkError}`);
  },
});

export default apolloClient;
