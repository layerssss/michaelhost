const { gql } = require("apollo-server-express");

const typeDefs = gql`
  type Query {
    hostname: String!
    hosts: [Host!]!
    host(id: ID!): Host!
    terminals: [Terminal!]!
    mountedApps: [MountedApp!]!
    mountedApp(id: ID!): MountedApp!
    terminal(id: ID!): Terminal!
    composeApplications: [ComposeAppication!]!
    composeApplication(id: ID!): ComposeAppication!
    cronJobs: [CronJob!]!
    cronJob(id: ID!): CronJob!
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
      ssl: Boolean!
      upstream: String!
      enabled: Boolean!
      redirect: Boolean!
      changeOrigin: Boolean!
      oidcConfig: OidcConfigInput
    ): Host!
    composeCreateApplication(
      repo: String!
      branch: String!
      path: String!
    ): ComposeAppication!
    composeDeleteApplication(id: ID!): ComposeAppication!
    composePS(id: ID!): ComposeAppication!
    composeUp(id: ID!): ComposeAppication!
    composeDown(id: ID!): ComposeAppication!
    composeExec(
      id: ID!
      composeContainerId: ID!
      command: String!
    ): ComposeAppication!
    composeRun(
      id: ID!
      serviceName: String!
      command: String!
    ): ComposeAppication!
    composeLogs(id: ID!, serviceName: String!): ComposeAppication!
    composeAddPortMapping(
      id: ID!
      protocol: String
      serviceName: String!
      servicePort: Int!
      publicPort: Int!
      loopback: Boolean
    ): ComposeAppication!
    composeRemovePortMapping(
      id: ID!
      composePortMappingId: ID!
    ): ComposeAppication!
    deleteHost(id: ID!): Host!
    runCommand(command: String!, name: String, cwd: String): Terminal!
    createMountedApp(name: String!, upstream: String!): MountedApp!
    deleteMountedApp(id: ID!): MountedApp!
    createCronJob(command: String!, cron: String!): CronJob!
    updateCronJob(id: ID!, command: String, cron: String): CronJob!
    deleteCronJob(id: ID!): CronJob!
    triggerCronJob(id: ID!): CronJob!
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
    upstream: String!
    changeOrigin: Boolean!
    oidcConfig: OidcConfig
    origin: String!
  }

  type MountedApp {
    id: ID!
    name: String!
    upstream: String!
  }

  type ComposeAppication {
    id: ID!
    name: String!
    repo: String!
    branch: String!
    path: String!
    portMappings: [ComposePortMapping!]!
    containers: [ComposeContainer!]
    serviceNames: [String!]
    task: ComposeTask
  }

  type ComposeTask {
    id: ID!
    name: String!
    terminal: Terminal
  }

  type ComposeContainer {
    id: ID!
    serviceName: String!
    runningFor: String!
    ports: [ComposeContainerPort!]!
  }

  type ComposeContainerPort {
    id: ID!
    protocol: String!
    port: Int!
    hostPort: Int!
  }

  type ComposePortMapping {
    id: ID!
    protocol: String!
    serviceName: String!
    servicePort: Int!
    publicPort: Int!
    loopback: Boolean
    connectionsCount: Int!
    status: String!
  }

  type CronJob {
    id: ID!
    command: String!
    cron: String!
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
