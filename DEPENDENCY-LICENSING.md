# Dependency Licensing Audit

This document tracks the licensing posture of the direct runtime dependencies
used by `astro-viewer`.

AstroViewer itself is distributed under a dual-license model:

- GNU Affero General Public License v3.0 (`AGPL-3.0`)
- a separate commercial license

See:

- `LICENSE.md`
- `LICENSE-AGPL.md`
- `LICENSE-COMMERCIAL.md`

## Current direct dependencies

### `astrospatial-core`

- Package: `astrospatial-core`
- Required version: `^0.4.1`
- Repository owner: Fabrizio Giordano
- Package registry: npmjs.com
- Licensing model: AGPL-3.0 + Commercial
- Purpose in AstroViewer:
  - HEALPix implementation
  - shared scientific/spatial primitives
- Status: aligned with the AstroViewer licensing model

AstroViewer imports the HEALPix implementation through:

```text
astrospatial-core/healpix
```

The former direct dependency on `healpixjs` has been removed.

### `wcslight`

- Package: `wcslight`
- Required version: `^3.1.1`
- Repository owner: Fabrizio Giordano
- Package registry: npmjs.com
- Licensing model: AGPL-3.0 + Commercial
- Purpose in AstroViewer:
  - astronomical WCS support
  - FITS/HiPS coordinate handling
  - projection utilities
- Status: aligned with the AstroViewer licensing model

`wcslight` also depends on `astrospatial-core`, which npm deduplicates with
AstroViewer's direct dependency when compatible versions are installed.

### `jsfitsio`

- Package: `jsfitsio`
- Required version: `^2.1.2`
- Repository owner: Fabrizio Giordano
- Package registry: npmjs.com
- License: Apache-2.0
- Purpose in AstroViewer:
  - FITS parsing and handling
- Status: compatible with both the AGPL and commercial AstroViewer distribution
  tracks

`wcslight` also depends on `jsfitsio`, and compatible versions are deduplicated
by npm.

### `gl-matrix`

- Package: `gl-matrix`
- Required version: `^3.4.4`
- License: MIT
- Purpose in AstroViewer:
  - matrix and vector mathematics
  - WebGL transformations
- Status: compatible

### `cross-fetch`

- Package: `cross-fetch`
- Required version: `^3.2.0`
- License: MIT
- Purpose in AstroViewer:
  - cross-environment Fetch API support
- Status: compatible

## Dependency tree

The expected runtime dependency alignment is:

```text
astro-viewer
├── astrospatial-core@^0.4.1
├── jsfitsio@^2.1.2
├── wcslight@^3.1.1
│   ├── astrospatial-core@^0.4.1
│   └── jsfitsio@^2.1.2
├── gl-matrix@^3.4.4
└── cross-fetch@^3.2.0
```

With compatible resolved versions npm should normally deduplicate the shared
first-party dependencies.

## Licensing model

AstroViewer follows a dual-license strategy.

### AGPL-3.0 track

Users may use, modify, redistribute, and commercially operate AstroViewer under
the terms of the GNU Affero General Public License version 3.

The AGPL is an OSI-approved open-source license and does not prohibit
commercial use.

Users choosing this track are responsible for complying with all applicable
AGPL requirements, including source-code obligations related to modified
versions and network-accessible deployments.

### Commercial track

A separate commercial license is available for organizations that do not want
to adopt the AGPL obligations for their AstroViewer-based software or service.

Commercial licensing may therefore be appropriate for:

- proprietary applications
- closed-source products
- SaaS products where AGPL source-disclosure obligations are undesirable
- OEM or embedded products
- commercial redistribution under terms incompatible with AGPL-3.0

See `LICENSE-COMMERCIAL.md`.

## First-party package alignment

The reusable first-party packages forming the current AstroViewer stack are:

```text
astro-viewer
astrospatial-core
wcslight
jsfitsio
```

`astrospatial-core`, `wcslight`, and AstroViewer are aligned around the
AGPL + Commercial strategy where applicable.

`jsfitsio` is distributed under Apache-2.0 and remains compatible with the
AstroViewer licensing model.

`healpixjs` is no longer a direct AstroViewer dependency. Its relevant HEALPix
functionality is consumed through the `astrospatial-core` dependency path used
by AstroViewer.

## Release checks

Before publishing an AstroViewer release, verify the dependency tree and
security posture:

```bash
npm ls astrospatial-core wcslight jsfitsio gl-matrix cross-fetch
npm audit
npm audit --omit=dev
npm test
npm run build
npm pack --dry-run
```

The dependency tree should contain the expected released versions and should
not unexpectedly resolve development snapshots.

## Maintenance policy

For every release:

1. Review direct dependency versions in `package.json`.
2. Verify the resolved versions in `package-lock.json`.
3. Run `npm audit` and `npm audit --omit=dev`.
4. Verify dependency license metadata when upgrading dependency versions.
5. Update this document whenever the first-party dependency structure or
   licensing strategy changes.