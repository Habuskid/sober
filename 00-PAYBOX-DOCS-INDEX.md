# 00-PAYBOX-DOCS-INDEX.md

**Last checked**: 2026-10-17  
**Purpose**: Authoritative official sources for the Sober plugin. Coding agent must use these. Do not invent methods or endpoints.

## Hackathon & Plugin Requirements (primary)
- https://developer.paybox.sh/ — Chapter 1 overview, mission, prizes, categories.
- https://developer.paybox.sh/terms — Eligibility, original work rules, judging, prizes (KYC required for payout).
- https://developer.paybox.sh/requirements.md — **Main technical guide**. Starter v1.0.2, limits, capabilities, submission, failure codes, working examples.
- https://developer.paybox.sh/skill.md — Agent guide (read requirements.md first).

## Starter Files (v1.0.2)
Copy from the links in requirements.md (remove .txt suffix):
- src/paybox.ts — Transaction proposal helpers and schemas.
- src/plugin.ts — Replace the echo example.
- package.json, tsconfig.json, pnpm-lock.yaml, pnpm-workspace.yaml, .gitignore
- paybox-plugin.json — Sample tool + arguments.
- scripts/conformance.mjs, process.mjs, report.mjs, schema.mjs, test.mjs
- starter-version.json

Working examples in requirements.md:
- Echo
- Public API (repository-info)
- Base ETH transfer
- x402 proposal

## Product & Integration Docs
- https://docs.paybox.sh/
- https://docs.paybox.sh/getting-started
- https://docs.paybox.sh/sdk-cli
- https://api.paybox.sh/mcp (reference only)
- https://github.com/moonpay/paybox-plugin (existing capabilities)

## Critical Constraints
- TypeScript MCP server bundled to single `dist/plugin.mjs` (UTF-8, ≤10 MiB).
- Node.js 24 (CI uses 24.21.0), pnpm 11.11.0. macOS/Linux or WSL2.
- Fresh sandbox per call. No persistent state or disk.
- Operation timeout 10 seconds. Max 16 exact hostnames. Brokered headers for any secrets.
- Can propose EVM, Solana, or x402. PayBox handles wallet selection, simulation, approval, signing.
- x402 limited to USDC on Base (`eip155:8453`, asset `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`) or Solana mainnet. 5-minute expiry. GET or small POST JSON only.
- Local `pnpm test` ≠ hosted checks ≠ real agent journey with user approval.
- Submit only `dist/plugin.mjs`. Configure hosts in portal. Accept terms. Submit Project. Post short demo video to X.

**Coding agent action**: Read requirements.md and skill.md completely before writing any code. Copy starter v1.0.2 exactly.
