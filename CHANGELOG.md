# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2026-05-30

### Removed
- Reverse proxy stack: `ReverseProxy`, `ProxyCore`, `LEClient`, `Host`, `OidcClient`, `OidcConfig`, `tunnelBootstrap`.
- Master/slave coordination: role flags, state-file mtime polling, and the `master`/`slave` subcommands.
- GraphQL `Host` / `OidcConfig` / `OidcConfigInput` types and `hosts` / `host` / `updateHost` / `deleteHost` fields.
- Admin UI `Hosts*` views, `HostsIcon`, and their routes / nav / dashboard entries.
- State persistence of `hosts` and `pems`.
- Single-binary distribution: `build_dist`, `distapp/`, `dist/`, the `pkg` devDep, and the `pkg.assets` config.
- Obsolete `build` GitHub Actions workflow (its only output was the pkg binary).
- Dependencies: `@root/acme`, `@root/csr`, `@root/keypairs`, `@root/pem`, `acme-http-01-webroot`, `cookie`, `global-agent`, `global-tunnel-ng`, `ip`, `jsonwebtoken`, `node-forge`, `openid-client`, `pkg`.

### Changed
- `service` now auto-initializes the state file if missing; a separate `init` call is no longer required.
- `release.yml` collapsed into a single `publish_to_npm` job; `actions/setup-node` bumped to v4 with `node-version-file: .nvmrc`.
- `yarn build` now just builds the admin UI.

### Kept
- Web terminals (`node-pty`), cron jobs (`node-cron`), webhook server (DockerHub / GitHub), and Docker management (containers / services / volumes / images).
- npm package and Docker image as the two distribution formats.

## [1.1.8] - 2022-10-03

### Changed
- Upgrade runtime to Node 16.

### Fixed
- `ProxyCore`: handle destroyed sockets with undefined `remoteAddress`.
- GitHub release-asset upload workflow.

## [1.1.7] - 2022-09-19

### Fixed
- `ProxyCore`: keep connection-specific headers on Upgrade requests.

## [1.1.6] - 2022-08-08

### Fixed
- `Host#allowIp`: tolerate requests with no remote IP.
- Dockerfile: update Alpine package name for python3.

## [1.1.5] - 2021-10-09

### Changed
- `apolloClient`: stop using `BatchHttpLink`.

## [1.1.4] - 2021-09-17

### Fixed
- `ProxyCore`: hide connection-specific headers from upstream.

## [1.1.3] - 2021-07-15

### Fixed
- `LEClient`: correct `skipChallengeTest` parameter.

## [1.1.2] - 2021-07-15

### Changed
- `LEClient`: set `skipChallengeTests` and `skipDryRun`, add `maintainerEmail`.

## [1.1.1] - 2021-07-11

### Fixed
- `Service#pull`: preserve image tag.

## [1.1.0] - 2021-07-11

### Added
- Docker images management.

## [1.0.2] - 2021-07-11

### Removed
- `build_dist`: dropped nodegit.

## [1.0.1] - 2021-07-11

### Fixed
- GitHub Actions build.

## [1.0.0] - 2021-07-11

### Changed
- Moved `admin_ui` into its own subfolder.

### Removed
- Compose feature (both server- and client-side).

## 0.x

See `git log` for the full history prior to 1.0.0 — major themes included:

- Initial implementation of reverse proxy, Let's Encrypt SSL, OIDC guard, web terminals, cron jobs, webhooks, and Docker management.
- Master/slave coordination ([v0.20.0](https://github.com/layerssss/michaelhost/releases/tag/v0.20.0)).
- JWT-based stateless auth on the reverse proxy ([v0.15.0](https://github.com/layerssss/michaelhost/releases/tag/v0.15.0)).
- Cron job `singleInstance` ([v0.18.0](https://github.com/layerssss/michaelhost/releases/tag/v0.18.0)), `name` ([v0.19.0](https://github.com/layerssss/michaelhost/releases/tag/v0.19.0)), and TZ env pickup ([v0.19.1](https://github.com/layerssss/michaelhost/releases/tag/v0.19.1)).
- Host `plain` option ([v0.17.0](https://github.com/layerssss/michaelhost/releases/tag/v0.17.0)) and `whitelistIps` ([v0.13.0](https://github.com/layerssss/michaelhost/releases/tag/v0.13.0)).
- Multi-stage Docker build ([v0.20.0](https://github.com/layerssss/michaelhost/releases/tag/v0.20.0) era).

[1.2.0]: https://github.com/layerssss/michaelhost/releases/tag/v1.2.0
[1.1.8]: https://github.com/layerssss/michaelhost/releases/tag/v1.1.8
[1.1.7]: https://github.com/layerssss/michaelhost/releases/tag/v1.1.7
[1.1.6]: https://github.com/layerssss/michaelhost/releases/tag/v1.1.6
[1.1.5]: https://github.com/layerssss/michaelhost/releases/tag/v1.1.5
[1.1.4]: https://github.com/layerssss/michaelhost/releases/tag/v1.1.4
[1.1.3]: https://github.com/layerssss/michaelhost/releases/tag/v1.1.3
[1.1.2]: https://github.com/layerssss/michaelhost/releases/tag/v1.1.2
[1.1.1]: https://github.com/layerssss/michaelhost/releases/tag/v1.1.1
[1.1.0]: https://github.com/layerssss/michaelhost/releases/tag/v1.1.0
[1.0.2]: https://github.com/layerssss/michaelhost/releases/tag/v1.0.2
[1.0.1]: https://github.com/layerssss/michaelhost/releases/tag/v1.0.1
[1.0.0]: https://github.com/layerssss/michaelhost/releases/tag/v1.0.0
