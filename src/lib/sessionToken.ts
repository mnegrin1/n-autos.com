/**
 * Cryptographic session token utility for Edge & Node runtimes using Web Crypto API.
 * Delegates directly to the hardened IAM Session subsystem.
 */

export {
  createSignedToken,
  verifySignedToken,
  getWorkspaceCode,
  applySessionCookies,
  removeSessionCookies,
} from "./iam/session";

export type { SessionUser, SessionPayload } from "./iam/session";
