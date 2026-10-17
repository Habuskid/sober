# 16-IDE-HANDOFF.md

**Product**: Sober  
**Mode**: SPRINT – ship before 8 pm EDT today.  
**Rule**: Follow official docs only. Do not invent APIs or methods.

## Start Here
1. Read https://developer.paybox.sh/requirements.md and https://developer.paybox.sh/skill.md completely.
2. Create the project from starter v1.0.2 (copy files without .txt). Use Node.js 24 and pnpm 11.11.0 (WSL2 if needed).
3. Replace the echo tool. Update `paybox-plugin.json` with a working sample.
4. Never put secrets in the bundle. Log to stderr only. Keep every call under 10 seconds.

## Tools to Build
### 1. `check_service`
- Input: `{ url: string }` (strict Zod).
- Behavior: Bounded fetch of public information about the URL (hostname, simple status, or reliable public signals). Return structured verdict.
- Output shape:
  ```json
  {
    "verdict": "safe" | "warn" | "block",
    "reasons": ["string"],
    "sources": ["string"],
    "hostname": "string"
  }
  ```
- Handle errors cleanly. Use readOnlyHint and openWorldHint.

### 2. `propose_checked_payment`
- Input: `{ url: string, maxAmount: string }` (atomic units).
- Behavior: Run the same check. If blocked, return warning only. Otherwise return structured content containing a valid `io.paybox/transactionProposal` of kind `x402` using the official helper from `src/paybox.ts` and the x402 example.
- Use Base USDC (`eip155:8453`, asset `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`) or Solana mainnet USDC.
- Set expiresAt within 5 minutes. Request must be HTTPS GET or small POST JSON with no custom headers or secrets.

## Required Commands (run and report actual output)
```bash
pnpm install --frozen-lockfile
pnpm test
pnpm build
```
Confirm deterministic build and that conformance passes on the sample.

## Hosted & Submission
- Configure only the exact hostnames the plugin calls.
- Upload `dist/plugin.mjs`, pass hosted checks, test privately in PayBox.
- Accept terms and click **Submit Project**.
- Post a short demo video to X showing a clear check, a risky check, and PayBox approval of a proposal.

## Verification (report separately)
- Local conformance result.
- Hosted checks result.
- Whether a real proposal was simulated and approved.

## Do Not
- Treat example.com as a real endpoint.
- Claim guaranteed safety.
- Exceed size or time limits.
- Add unrelated features.

**Success**: A working Sober plugin that returns a clear verdict and (when allowed) a valid PayBox x402 proposal, demonstrated on X, and submitted before the deadline.

Start building now. Report real command output and blockers immediately.
