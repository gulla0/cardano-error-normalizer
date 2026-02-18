# Test Fixtures

Fixtures are canonical inputs for adapter tests.

Wallet fixtures correspond to CIP-30/CIP-95 numeric codes. Blockfrost fixtures correspond to documented HTTP semantics. Node fixtures validate regex extraction under `ApplyTxError` wrappers.

Use these files with the mapping tables in `mvp.md`:
- `test/fixtures/wallet-errors.json`
- `test/fixtures/blockfrost-errors.json`
- `test/fixtures/node-errors.txt`
- `test/fixtures/real-world-errors.json`
- `test/fixtures/verification/*.json`
