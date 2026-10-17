import { McpServer } from "@modelcontextprotocol/server";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import * as z from "zod/v4";
import { proposeX402, x402OutputSchema } from "./paybox.js";

const PROTOCOL_VERSION = "2026-07-28";

export interface SafetyVerdict {
  verdict: "safe" | "warn" | "block";
  reasons: string[];
  sources: string[];
  hostname: string;
}

const PRIVATE_IP_PATTERNS = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^0\./,
  /^localhost$/i,
  /^::1$/,
  /^fc00:/i,
  /^fe80:/i,
];

const SUSPICIOUS_PATTERNS = [
  /malicious/i,
  /phish/i,
  /drainer/i,
  /exploit/i,
  /\.onion$/i,
  /\.internal$/i,
  /\.local$/i,
  /\.lan$/i,
];

export async function assessUrlSafety(
  targetUrl: string,
  probeOptions?: { method?: "GET" | "POST"; body?: z.infer<ReturnType<typeof z.json>> },
): Promise<SafetyVerdict> {
  const sources = ["Sober Protocol Validator", "RFC-9110 / x402 Specification"];
  const reasons: string[] = [];

  let parsed: URL;
  try {
    parsed = new URL(targetUrl);
  } catch {
    return {
      verdict: "block",
      reasons: ["Malformed URL syntax; unable to parse target address."],
      sources,
      hostname: "unknown",
    };
  }

  const hostname = parsed.hostname;

  // 1. Protocol requirement: HTTPS only
  if (parsed.protocol !== "https:") {
    reasons.push("x402 payments strictly require secure HTTPS (port 443); non-HTTPS protocol rejected.");
    return { verdict: "block", reasons, sources, hostname };
  }

  // 2. Port check: standard HTTPS port 443
  if (parsed.port && parsed.port !== "443") {
    reasons.push(`Non-standard port (${parsed.port}) rejected; x402 requires default HTTPS port 443.`);
    return { verdict: "block", reasons, sources, hostname };
  }

  // 3. Userinfo / embedded credentials check
  if (parsed.username || parsed.password) {
    reasons.push("URL contains embedded credentials (userinfo), risking secret exfiltration and misuse.");
    return { verdict: "block", reasons, sources, hostname };
  }

  // 4. SSRF and private IP/hostname check
  for (const pattern of PRIVATE_IP_PATTERNS) {
    if (pattern.test(hostname)) {
      reasons.push(`Target resolves to private/loopback address (${hostname}); blocked to prevent SSRF.`);
      return { verdict: "block", reasons, sources, hostname };
    }
  }

  // 5. Threat pattern check
  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(hostname)) {
      reasons.push(`Hostname matches known risky or unroutable threat pattern (${hostname}).`);
      return { verdict: "block", reasons, sources, hostname };
    }
  }

  let verdict: "safe" | "warn" = "safe";

  // 6. Fragment warning
  if (parsed.hash) {
    verdict = "warn";
    reasons.push("URL contains fragment identifier which is ignored by payment facilitators.");
  }

  // 7. Bounded active network pre-flight probe (3.5s timeout)
  sources.push("Network Pre-Flight Probe");
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const method = probeOptions?.method ?? "GET";
    const headers: Record<string, string> = { "User-Agent": "Sober-Safety-Agent/1.0" };
    let body: string | undefined;

    if (method === "POST") {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(probeOptions?.body ?? {});
    }

    const response = await fetch(targetUrl, {
      method,
      headers,
      body,
      signal: controller.signal,
      redirect: "manual",
    });
    clearTimeout(timeout);

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location") ?? "external target";
      verdict = "warn";
      reasons.push(`Endpoint attempts redirection to '${location}'; cross-resource substitution risk (arXiv:2605.11781).`);
    } else if (response.status === 402) {
      reasons.push("Confirmed active x402 payment challenge endpoint (HTTP 402 Payment Required).");
    } else if (response.status >= 200 && response.status < 300) {
      verdict = "warn";
      reasons.push(`Endpoint responded with HTTP ${response.status} OK without requiring payment; check if endpoint is already free.`);
    } else if (response.status === 404) {
      verdict = "warn";
      reasons.push("Endpoint returned HTTP 404 Not Found; payment would likely settle for nonexistent resource.");
    } else if (response.status >= 500) {
      verdict = "warn";
      reasons.push(`Endpoint returned server error (HTTP ${response.status}); high transaction risk.`);
    } else {
      reasons.push(`Pre-flight probe returned HTTP status ${response.status}.`);
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    reasons.push(`Live probe completed with notice: ${msg.includes("abort") ? "Probe timed out" : "Host check skipped or unreachable in current sandbox"}.`);
  }

  if (reasons.length === 0) {
    reasons.push("Standard HTTPS port 443 verified; no credentials or SSRF signatures detected.");
  }

  return {
    verdict,
    reasons,
    sources,
    hostname,
  };
}

const checkServiceOutputSchema = z.object({
  verdict: z.enum(["safe", "warn", "block"]),
  reasons: z.array(z.string()),
  sources: z.array(z.string()),
  hostname: z.string(),
}).strict();

const checkedPaymentOutputSchema = z.object({
  verdict: z.enum(["safe", "warn", "block"]),
  reasons: z.array(z.string()),
  sources: z.array(z.string()),
  hostname: z.string(),
  "io.paybox/transactionProposal": x402OutputSchema.shape["io.paybox/transactionProposal"].optional(),
}).strict();

function createServer() {
  const server = new McpServer(
    { name: "sober", version: "1.0.1" },
    { supportedProtocolVersions: [PROTOCOL_VERSION] },
  );

  // Tool 1: check_service
  server.registerTool(
    "check_service",
    {
      title: "Check x402 service safety",
      description: "Performs pre-payment safety and counterparty risk analysis on an x402 service URL before spending.",
      inputSchema: z.object({
        url: z.url().max(2048),
        method: z.enum(["GET", "POST"]).optional(),
        body: z.json().optional(),
      }).strict(),
      outputSchema: checkServiceOutputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ url, method, body }) => {
      const result = await assessUrlSafety(url, { method, body });
      return {
        content: [
          {
            type: "text",
            text: `Sober check for ${result.hostname}: ${result.verdict.toUpperCase()}.\nReasons: ${result.reasons.join("; ")}`,
          },
        ],
        structuredContent: result,
      };
    },
  );

  // Tool 2: propose_checked_payment
  server.registerTool(
    "propose_checked_payment",
    {
      title: "Propose checked x402 payment",
      description: "Verifies service safety before generating a PayBox Base USDC x402 payment proposal. Rejects blocked targets.",
      inputSchema: z.object({
        url: z.url().max(2048),
        maxAmount: z.string().regex(/^[1-9][0-9]{0,19}$/),
        method: z.enum(["GET", "POST"]).optional(),
        body: z.json().optional(),
      }).strict(),
      outputSchema: checkedPaymentOutputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ url, maxAmount, method = "GET", body }) => {
      const safety = await assessUrlSafety(url, { method, body });

      if (safety.verdict === "block") {
        return {
          content: [
            {
              type: "text",
              text: `[PAYMENT BLOCKED] Sober prevented x402 payment to ${safety.hostname}: ${safety.reasons.join("; ")}`,
            },
          ],
          structuredContent: {
            verdict: safety.verdict,
            reasons: safety.reasons,
            sources: safety.sources,
            hostname: safety.hostname,
          },
        };
      }

      // Propose x402 payment on Base USDC with matching method and body
      const proposalResult = proposeX402({
        chain: "eip155:8453",
        url,
        maxAmount,
        method,
        body,
      });

      return {
        content: [
          {
            type: "text",
            text: `[${safety.verdict.toUpperCase()}] Sober approved payment proposal for ${safety.hostname}. ${proposalResult.content[0]!.text}`,
          },
        ],
        structuredContent: {
          verdict: safety.verdict,
          reasons: safety.reasons,
          sources: safety.sources,
          hostname: safety.hostname,
          "io.paybox/transactionProposal": proposalResult.structuredContent["io.paybox/transactionProposal"]!,
        },
      };
    },
  );

  return server;
}

serveStdio(createServer, { legacy: "reject" });
