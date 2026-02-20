# API Reference

This folder documents the **public API surface** that consumers can import from:

- `@gulla0/cardano-error-normalizer`
- `@gulla0/cardano-error-normalizer/react`
- `@gulla0/cardano-error-normalizer/react/compat`

The references are split by entrypoint:

- [`root-api.md`](./root-api.md): core library exports (`"."`).
- [`react-api.md`](./react-api.md): React-first exports (`"./react"`).
- [`react-compat-api.md`](./react-compat-api.md): legacy/global React compatibility exports (`"./react/compat"`).

Scope notes:

- This is based on the package public exports map in `package.json` and the generated declaration surface in `dist/*.d.ts`.
- Internal module exports that are not reachable through those public entrypoints are intentionally excluded.
