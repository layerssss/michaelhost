import { InMemoryCache } from "apollo-cache-inmemory";
import { ApolloLink } from "apollo-link";
import { ApolloClient } from "@apollo/client";
import { BatchHttpLink } from "apollo-link-batch-http";

const apolloClient = new ApolloClient({
  link: ApolloLink.from([
    //
    new BatchHttpLink(),
  ]),
  cache: new InMemoryCache({
    dataIdFromObject: (node) => node.id,
  }),
});

export default apolloClient;
