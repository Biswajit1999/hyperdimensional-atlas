# Research Quality Upgrade

This repository has been upgraded with a compact research-quality layer: reference anchors, validation checks, and explicit scientific/software boundaries.

## Scope

Interactive high-dimensional geometry atlas for hypercubes, projections, cross-sections and dimensional scaling laws.

## Equations And Models

- Hypercube vertices = 2^n
- Edges = n 2^(n-1)
- Hypersphere volume V_n = pi^(n/2) R^n / Gamma(n/2+1)

## Reference Anchors

The file `data/research-reference.json` stores benchmark anchors used by `scripts/validate_repository.mjs`. These are intentionally small and auditable so the repository can be checked without network access.

## Browser Upgrade

If this repository contains a browser interface, `research-overlay.js` adds a non-invasive mission-control quality panel with validation status and benchmark telemetry.

## References

- Coxeter, H.S.M., 1973. Regular Polytopes. Dover Publications.
