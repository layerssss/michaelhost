const rootPath = {
  matcher: "/",
  generate: () => `/`,
};

const hostsPath = {
  matcher: `${rootPath.matcher}h`,
  generate: p => `${rootPath.generate(p)}h`,
};

const hostPath = {
  matcher: `${hostsPath.matcher}/:hostId(\\w{8})`,
  generate: p => `${hostsPath.generate(p)}/${p.hostId}`,
};

const newHostPath = {
  matcher: `${hostsPath.matcher}/new`,
  generate: p => `${hostsPath.generate(p)}/new`,
};

const terminalsPath = {
  matcher: `${rootPath.matcher}t`,
  generate: p => `${rootPath.generate(p)}t`,
};

const terminalPath = {
  matcher: `${terminalsPath.matcher}/:terminalId(\\w{8})`,
  generate: p => `${terminalsPath.generate(p)}/${p.terminalId}`,
};

const mountedAppsPath = {
  matcher: `${rootPath.matcher}a`,
  generate: p => `${rootPath.generate(p)}a`,
};

const newMountedAppPath = {
  matcher: `${mountedAppsPath.matcher}/new`,
  generate: p => `${mountedAppsPath.generate(p)}/new`,
};

const mountedAppPath = {
  matcher: `${mountedAppsPath.matcher}/:mountedAppName`,
  generate: p => `${mountedAppsPath.generate(p)}/${p.mountedAppName}`,
};

const mountedAppProxyPath = {
  matcher: `${rootPath.matcher}api/mounted_apps/:mountedAppId(\\w{8})/`,
  generate: p => `${rootPath.generate(p)}api/mounted_apps/${p.mountedAppId}/`,
};

const paths = {
  rootPath,
  hostsPath,
  newHostPath,
  hostPath,
  terminalsPath,
  terminalPath,
  mountedAppsPath,
  newMountedAppPath,
  mountedAppPath,
  mountedAppProxyPath,
};

export default paths;
