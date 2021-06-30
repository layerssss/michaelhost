const { gql } = require("apollo-server-express");

const typeDefs = gql`
  type Query {
    hostname: String!
    version: String!
    hosts: [Host!]!
    host(id: ID!): Host!
    terminals: [Terminal!]!
    terminal(id: ID!): Terminal!
    composeApplications: [ComposeApplication!]!
    composeApplication(id: ID!): ComposeApplication!
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
    composeCreateApplication(
      id: ID!
      repo: String!
      branch: String!
      path: String!
    ): ComposeApplication!
    composePruneContainers: [String!]!
    composeDeleteApplication(id: ID!): ComposeApplication!
    composePS(id: ID!): ComposeApplication!
    composeUp(id: ID!): ComposeApplication!
    composeDown(id: ID!): ComposeApplication!
    composePull(id: ID!): ComposeApplication!
    composeGitFetch(id: ID!): ComposeApplication!
    composeExec(
      id: ID!
      composeContainerId: ID!
      command: String!
    ): ComposeApplication!
    composeRun(
      id: ID!
      serviceName: String!
      command: String!
    ): ComposeApplication!
    composeLogs(id: ID!, serviceName: String!): ComposeApplication!
    composeAddPortMapping(
      id: ID!
      protocol: String
      serviceName: String!
      servicePort: Int!
      publicPort: Int!
      loopback: Boolean
    ): ComposeApplication!
    composeRemovePortMapping(
      id: ID!
      composePortMappingId: ID!
    ): ComposeApplication!
    deleteHost(id: ID!): Host!
    runCommand(command: String!, name: String, cwd: String): Terminal!

    createCronJob(
      command: String!
      cron: String!
      singleInstance: Boolean
    ): CronJob!
    updateCronJob(
      id: ID!
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

  type ComposeApplication {
    id: ID!
    name: String!
    repo: String!
    branch: String!
    headRevision: String
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
    image: String!
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
    connections: [ComposeConnection!]!
    status: String!
  }

  type ComposeConnection {
    id: ID!
    remoteAddress: String!
    remotePort: Int!
    bytesSent: Int!
    bytesReceived: Int!
    sending: Boolean!
    receiving: Boolean!
    errorMessage: String
  }

  type CronJob {
    id: ID!
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
