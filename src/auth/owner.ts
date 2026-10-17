/** The only user. The consent page signs the owner in with the API_KEY secret. */
export const OWNER_ID = 'owner';

/** The only scope this server grants. */
export const MCP_SCOPE = 'mcp:read';

/** Data stored with every grant and handed to the MCP endpoint with each token. */
export interface OwnerProps {
  userId: string;
  /** Fingerprint of the API_KEY that approved the grant. */
  keyId: string;
}

const sha256 = async (value: string): Promise<Uint8Array> =>
  new Uint8Array(
    await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)),
  );

/**
 * Compare two secrets in constant time by comparing their SHA-256 digests.
 */
export const secretsMatch = async (
  given: string,
  expected: string,
): Promise<boolean> => {
  const [left, right] = await Promise.all([sha256(given), sha256(expected)]);

  let diff = 0;
  for (let i = 0; i < left.length; i++) {
    diff |= left[i]! ^ right[i]!;
  }
  return diff === 0;
};

/**
 * Short, non-reversible ID for an API key. Grants store it so that changing
 * API_KEY signs out every connected MCP client.
 */
export const keyFingerprint = async (apiKey: string): Promise<string> =>
  Array.from((await sha256(apiKey)).slice(0, 8), byte =>
    byte.toString(16).padStart(2, '0'),
  ).join('');

/**
 * Whether grant props were approved with the current API key.
 */
export const isCurrentKey = async (
  props: unknown,
  apiKey: string | undefined,
): Promise<boolean> => {
  if (!apiKey || typeof props !== 'object' || props === null) return false;
  const { keyId } = props as Partial<OwnerProps>;
  return keyId === (await keyFingerprint(apiKey));
};
