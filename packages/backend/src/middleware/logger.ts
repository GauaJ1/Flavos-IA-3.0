// ===================================================
// Flavos IA 3.0 — Audit Logger
// Structured security event logging for production.
//
// Outputs JSON to stdout — Cloud Run / Railway / Render
// redirect stdout to Cloud Logging automatically.
//
// NEVER logs: full token, full prompt, full AI response,
//             email, display name, or any personal data.
// ===================================================

export interface AuditDetails {
  uid?: string | null;
  route?: string;
  status?: number;
  ip?: string;
  detail?: string;
  [key: string]: unknown;
}

/**
 * Log a structured security/audit event.
 * Safe to call from any middleware or route handler.
 */
export function audit(event: string, details: AuditDetails = {}): void {
  const { uid = null, route = null, status = null, ip = '', detail, ...rest } = details;

  const entry = {
    ts:     new Date().toISOString(),
    event,
    route,
    status,
    uid,
    ip:     maskIp(String(ip)),
    ...(detail !== undefined && { detail }),
    ...rest,
  };

  // Write as single-line JSON — easy to parse with Cloud Logging / jq
  process.stderr.write(JSON.stringify(entry) + '\n');
}

/**
 * Mask last octet of IPv4 or last 4 chars of IPv6 for privacy.
 * "192.168.1.42" → "192.168.1.*"
 * "2001:db8::1"  → "2001:db8:****"
 */
function maskIp(ip: string): string {
  if (!ip) return '';
  const ipv4 = ip.match(/^(\d+\.\d+\.\d+)\.\d+$/);
  if (ipv4) return `${ipv4[1]}.*`;
  if (ip.includes(':')) return ip.slice(0, -4) + '****';
  return ip;
}
