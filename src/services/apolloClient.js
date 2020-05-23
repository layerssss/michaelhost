import { InMemoryCache } from "apollo-cache-inmemory";
import { ApolloLink } from "apollo-link";
import { HttpLink } from "apollo-link-http";
import { ApolloClient } from "@apollo/client";

const apolloClient = new ApolloClient({
  link: ApolloLink.from([
    //
    new HttpLink(),
  ]),
  cache: new InMemoryCache({
    dataIdFromObject: (node) => node.id,
  }),
});

export default apolloClient;
