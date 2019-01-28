const rootPath = {
  matcher: "/",
  generate: () => `/`,
};

const logPath = {
  matcher: `${rootPath.matcher}log`,
  generate: p => `${rootPath.generate(p)}log`,
};

const hostsPath = {
  matcher: `${rootPath.matcher}hosts`,
  generate: p => `${rootPath.generate(p)}hosts`,
};

const hostPath = {
  matcher: `${hostsPath.matcher}/:hostId(\\w{8})`,
  generate: p => `${hostsPath.generate(p)}/${p.hostId}`,
};

const newHostPath = {
  matcher: `${hostsPath.matcher}/new`,
  generate: p => `${hostsPath.generate(p)}/new`,
};

const cronJobsPath = {
  matcher: `${rootPath.matcher}cron_jobs`,
  generate: p => `${rootPath.generate(p)}cron_jobs`,
};

const cronJobPath = {
  matcher: `${cronJobsPath.matcher}/:cronJobId(\\w{8})`,
  generate: p => `${cronJobsPath.generate(p)}/${p.cronJobId}`,
};

const newCronJobPath = {
  matcher: `${cronJobsPath.matcher}/new`,
  generate: p => `${cronJobsPath.generate(p)}/new`,
};

const terminalsPath = {
  matcher: `${rootPath.matcher}terminals`,
  generate: p => `${rootPath.generate(p)}terminals`,
};

const terminalPath = {
  matcher: `${terminalsPath.matcher}/:terminalId(\\w{8})`,
  generate: p => `${terminalsPath.generate(p)}/${p.terminalId}`,
};

const mountedAppsPath = {
  matcher: `${rootPath.matcher}apps`,
  generate: p => `${rootPath.generate(p)}apps`,
};

const newMountedAppPath = {
  matcher: `${mountedAppsPath.matcher}/new`,
  generate: p => `${mountedAppsPath.generate(p)}/new`,
};

const mountedAppPath = {
  matcher: `${mountedAppsPath.matcher}/:mountedAppId(\\w{8})`,
  generate: p => `${mountedAppsPath.generate(p)}/${p.mountedAppId}`,
};

const mountedAppProxyPath = {
  matcher: `${rootPath.matcher}api/mounted_apps/:mountedAppId(\\w{8})/`,
  generate: p => `${rootPath.generate(p)}api/mounted_apps/${p.mountedAppId}/`,
};

const composeApplicationsPath = {
  matcher: `${rootPath.matcher}compose`,
  generate: p => `${rootPath.generate(p)}compose`,
};

const composeApplicationPath = {
  matcher: `${composeApplicationsPath.matcher}/:composeApplicationId(\\w{8})`,
  generate: p =>
    `${composeApplicationsPath.generate(p)}/${p.composeApplicationId}`,
};

const composeNewApplicationPath = {
  matcher: `${composeApplicationsPath.matcher}/new`,
  generate: p => `${composeApplicationsPath.generate(p)}/new`,
};

const paths = {
  rootPath,
  logPath,
  hostsPath,
  newHostPath,
  hostPath,
  terminalsPath,
  terminalPath,
  mountedAppsPath,
  newMountedAppPath,
  mountedAppPath,
  mountedAppProxyPath,
  composeApplicationsPath,
  composeApplicationPath,
  composeNewApplicationPath,
  cronJobsPath,
  cronJobPath,
  newCronJobPath,
};

export default paths;
