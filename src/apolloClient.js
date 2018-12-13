import { InMemoryCache } from "apollo-cache-inmemory";
import { ApolloLink } from "apollo-link";
import { HttpLink } from "apollo-link-http";
import { onError } from "apollo-link-error";
import ApolloClient from "apollo-client";

const apolloClient = new ApolloClient({
  link: ApolloLink.from([
    onError(({ graphQLErrors, networkError }) => {
      if (graphQLErrors)
        alert(
          ["Error:", ...graphQLErrors.map(({ message }) => message)].join("\n"),
        );

      if (networkError) alert(`[Network error]: ${networkError}`);
    }),
    new HttpLink(),
  ]),
  cache: new InMemoryCache({
    dataIdFromObject: node => node.id,
  }),
  defaultOptions: {
    query: {
      fetchPolicy: "cache-and-network",
      errorPolicy: "all",
    },
    mutation: {
      errorPolicy: "all",
    },
  },
});

export default apolloClient;
