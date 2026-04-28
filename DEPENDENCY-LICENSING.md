# Dependency Licensing Audit

This document tracks the licensing posture of the first-party libraries used by
`astro-viewer` and defines the prerequisites for a commercial release channel.

## Current direct dependencies

### `wcslight`

- Repository owner: Fabrizio Giordano
- Current package name: `wcslight`
- Current package license metadata: `SEE LICENSE IN LICENSE.md`
- Current repository licensing state: dual-license documents added
- Current status for commercial `astro-viewer`: repository aligned, release
  channel still pending

### `jsfitsio`

- Repository owner: Fabrizio Giordano
- Current package name: `jsfitsio`
- Current package license metadata: `SEE LICENSE IN LICENSE.md`
- Current repository licensing state: dual-license documents added
- Current status for commercial `astro-viewer`: repository aligned, release
  channel still pending

### `healpixjs`

- Repository owner: Fabrizio Giordano
- Current package name: `healpixjs`
- Current package license metadata: `SEE LICENSE IN LICENSE.md`
- Current repository licensing state: dual-license documents added
- Current status for commercial `astro-viewer`: repository aligned, release
  channel still pending

## Assessment

`astro-viewer` cannot be treated as a commercially clean package family until
the first-party dependency chain is relicensed consistently.

At the time of writing:

- `astro-viewer` has dual-license repository metadata and documentation
- `wcslight` has dual-license repository metadata and documentation
- `jsfitsio` has dual-license repository metadata and documentation
- `healpixjs` has dual-license repository metadata and documentation

That means the dependency family should be handled as one coordinated
relicensing and release effort rather than as isolated repository changes.

## Recommended target model

For all first-party reusable libraries in the AstroViewer stack:

- commercial distribution track
- non-commercial source-available track

Suggested family:

- `astro-viewer`
- `wcslight`
- `jsfitsio`
- `healpixjs`

## Preconditions for relicensing

Before changing license terms, confirm:

1. Fabrizio Giordano is the sole copyright holder for each repository, or all
   material third-party contributions are already covered by a contributor
   agreement or explicit relicensing permission.
2. No copied third-party code imposes stronger copyleft obligations than the
   intended dual-license model allows.
3. The final legal text for both commercial and non-commercial tracks is
   reviewed and approved before public release.

## Release policy until commercialization is complete

- do not market the commercial package family as finalized
- do not publish commercial package names for dependent libraries yet
- keep dependency names and versions stable until the legal model is finalized
- finalize the legal text and package-channel strategy before switching
  application repositories to a commercial package channel
