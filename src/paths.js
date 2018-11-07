const rootPath = {
  matcher: "",
  generate: () => ``
};

const rootTabPath = {
  matcher: `${rootPath.matcher}/:rootTab`,
  generate: p => `${rootPath.generate(p)}/${p.rootTab}`
};

const hostsPath = {
  matcher: `${rootPath.matcher}/hosts`,
  generate: p => `${rootPath.generate(p)}/hosts`
};

const hostPath = {
  matcher: `${hostsPath.matcher}/:hostId(\\w{8})`,
  generate: p => `${hostsPath.generate(p)}/${p.hostId}`
};

const newHostPath = {
  matcher: `${hostsPath.matcher}/new`,
  generate: p => `${hostsPath.generate(p)}/new`
};

const paths = {
  rootPath,
  rootTabPath,
  hostsPath,
  newHostPath,
  hostPath
};

export default paths;
