const { gql } = require("apollo-server-express");

const typeDefs = gql`
  type Query {
    hostname: String!
    version: String!
    hosts: [Host!]!
    host(id: ID!): Host!
    terminals: [Terminal!]!
    terminal(id: ID!): Terminal!
    cronJobs: [CronJob!]!
    cronJob(id: ID!): CronJob!
    containers: [Container!]!
    container(id: ID!): Container!
    services: [Service!]!
    service(id: ID!): Service!
    volumes: [Volume!]!
    volume(id: ID!): Volume!
  }

  type Mutation {
    updateHost(
      id: ID!
      hostname: String!
      ssl: Boolean!
      plain: Boolean!
      upstream: String!
      enabled: Boolean!
      redirect: Boolean!
      changeOrigin: Boolean!
      oidcConfig: OidcConfigInput
      whitelistIps: String!
    ): Host!
    deleteHost(id: ID!): Host!

    runCommand(command: String!, name: String, cwd: String): Terminal!

    createCronJob(
      command: String!
      name: String
      cron: String!
      singleInstance: Boolean
    ): CronJob!
    updateCronJob(
      id: ID!
      name: String
      command: String
      cron: String
      singleInstance: Boolean
    ): CronJob!
    deleteCronJob(id: ID!): CronJob!
    triggerCronJob(id: ID!): CronJob!

    containerExec(id: ID!, command: String!): Terminal!
    containerLogs(id: ID!): Terminal!
    containerRm(id: ID!): Boolean!
    containerStop(id: ID!): Boolean!
    containerStart(id: ID!): Boolean!
    containersPrune: Boolean!

    serviceLogs(id: ID!): Terminal!
    servicePull(id: ID!): Boolean!
    serviceRm(id: ID!): Boolean!

    volumeRm(id: ID!): Boolean!
    volumesPrune: Boolean!
  }

  input OidcConfigInput {
    discoveryUrl: String!
    clientId: String!
    clientSecret: String!
    allowEmails: [String!]!
  }

  type Terminal {
    id: ID!
    name: String!
    file: String!
    args: [String!]!
  }

  type Host {
    id: ID!
    hostname: String!
    enabled: Boolean!
    redirect: Boolean!
    ssl: Boolean!
    plain: Boolean!
    upstream: String!
    changeOrigin: Boolean!
    oidcConfig: OidcConfig
    origin: String!
    whitelistIps: String!
  }

  type CronJob {
    id: ID!
    name: String!
    command: String!
    cron: String!
    singleInstance: Boolean!
  }

  type OidcConfig {
    id: ID!
    discoveryUrl: String!
    clientId: String!
    clientSecret: String!
    allowEmails: [String!]!
  }

  type Container {
    id: ID!
    name: String!
    image: String!
    command: [String!]
    entrypoint: [String!]
    createdAt: String!
    startedAt: String!
    finishedAt: String!
    running: Boolean!
    status: String!
    mounts: [Mount!]
  }

  type Mount {
    id: ID!
    source: String!
    destination: String!
    driver: String!
    mode: String!
    rw: Boolean!
  }

  type Service {
    id: ID!
    name: String!
    image: String!
    replicas: Int
    ports: [ServicePort!]!
    tasks: [Task!]!
    runningTaskCount: Int!
  }

  type ServicePort {
    protocol: String!
    targetPort: Int!
    publishedPort: Int!
  }

  type Volume {
    id: ID!
    name: String!
    driver: String!
  }

  type Task {
    id: ID!
    createdAt: String!
    status: String!
    message: String!
  }
`;

module.exports = typeDefs;
