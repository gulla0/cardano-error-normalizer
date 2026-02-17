export function createErrorFingerprint(input: string): string {
  // FNV-1a 64-bit style hash using bigint for deterministic, dependency-free output.
  let hash = 0xcbf29ce484222325n;
  const prime = 0x100000001b3n;
  const mask = 0xffffffffffffffffn;

  for (let i = 0; i < input.length; i += 1) {
    hash ^= BigInt(input.charCodeAt(i));
    hash = (hash * prime) & mask;
  }

  return hash.toString(16).padStart(16, "0").slice(0, 16);
}
