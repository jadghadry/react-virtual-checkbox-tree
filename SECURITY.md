# Security

## Reporting a vulnerability

Report privately through
[GitHub Security Advisories](https://github.com/jadghadry/react-virtual-checkbox-tree/security/advisories/new).
Please don't open a public issue for a vulnerability.

You should get an acknowledgement within a few days. This is a solo-maintained project, so response
times are best-effort rather than contractual.

## Supported versions

The latest `0.x` minor receives fixes. Older minors do not — while the library is pre-1.0, please
upgrade.

## Scope

This package renders data you give it and holds selection state. It performs no network requests,
reads no storage, and evaluates no strings. The realistic attack surface is:

- **Untrusted `label` values.** The default renderer sets labels as text, so they are escaped. If your
  `renderItem` injects HTML (`dangerouslySetInnerHTML`), you own that risk.
- **Untrusted structure.** Cyclic `children` are detected and throw rather than hanging. Extremely
  deep or wide trees are handled iteratively, but building an engine is linear in node count — treat
  attacker-controlled tree size as a denial-of-service input and bound it.

Published releases are signed with [npm provenance](https://docs.npmjs.com/generating-provenance-statements).
