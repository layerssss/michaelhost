const { gql } = require("apollo-server-express");

const typeDefs = gql`
  type Query {
    hosts: [Host!]!
    host(id: ID!): Host!
  }

  type Mutation {
    createHost(
      hostname: String!
      ssl: Boolean
      upstream: String!
      oidcConfig: OidcConfigInput
    ): Host!
    updateHost(
      id: ID!
      hostname: String!
      ssl: Boolean
      upstream: String!
      oidcConfig: OidcConfigInput
    ): Host!
    deleteHost(id: ID!): Host!
  }

  input OidcConfigInput {
    discoveryUrl: String!
    clientId: String!
    clientSecret: String!
    allowEmails: [String!]!
  }

  type Host {
    id: ID!
    hostname: String!
    ssl: Boolean!
    upstream: String!
    oidcConfig: OidcConfig
    origin: String!
  }

  type OidcConfig {
    id: ID!
    discoveryUrl: String!
    clientId: String!
    clientSecret: String!
    allowEmails: [String!]!
  }
`;

module.exports = typeDefs;
