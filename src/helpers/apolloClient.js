import { InMemoryCache } from "apollo-cache-inmemory";
import { ApolloLink } from "apollo-link";
import { HttpLink } from "apollo-link-http";
import { onError } from "apollo-link-error";
import ApolloClient from "apollo-client";

const apolloClient = new ApolloClient({
  link: ApolloLink.from([
    onError(({ graphQLErrors, networkError }) => {
      if (graphQLErrors)
        // eslint-disable-next-line no-console
        console.error(
          ["Error:", ...graphQLErrors.map(({ message }) => message)].join("\n"),
        );

      if (networkError)
        // eslint-disable-next-line no-console
        console.error(`[Network error]: ${networkError}`);
    }),
    new HttpLink(),
  ]),
  cache: new InMemoryCache({
    dataIdFromObject: node => node.id,
  }),
  defaultOptions: {
    mutation: {
      errorPolicy: "all",
      awaitRefetchQueries: true,
    },
  },
});

export default apolloClient;
