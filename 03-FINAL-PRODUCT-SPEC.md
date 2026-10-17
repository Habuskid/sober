# 03-FINAL-PRODUCT-SPEC.md

**Product**: Sober  
**Tagline**: Clear-headed checks before your agent pays.  
**Category**: Consumer finance / safety.

## Target User
People and builders who want AI agents to use paid x402 services without blindly spending on risky or low-quality endpoints.

## Problem
x402 agents can pay the wrong party, receive garbage, or hit free-riding and settlement failures. PayBox provides secure rails but no built-in pre-payment risk verdict. External checkers are not integrated as PayBox plugins.

## Core Workflow
1. Agent supplies a service URL.
2. Sober performs a bounded public check and returns a clear verdict (`safe` / `warn` / `block`) with reasons.
3. If not blocked, Sober can return a valid PayBox `x402` transaction proposal so the user approves in the PayBox UI.
4. Agent continues with the result after approval.

## Differentiation
Chains a safety verdict directly to an official PayBox x402 proposal. Avoids being a generic research gateway or thin wrapper. Addresses documented x402 risks with a shippable MVP.

## MVP (must ship tonight)
Two tools only:
1. `check_service` — input URL → structured verdict.
2. `propose_checked_payment` — input URL + maxAmount → verdict + optional x402 proposal (only if not blocked).

Use official starter helpers. No custom UI. No secrets in the bundle. No persistent state.

## Out of Scope
Full production risk engine, automatic retries, multi-chain beyond Base/Solana USDC, any claim of guaranteed safety.

## Acceptance Criteria
- Passes local `pnpm test`.
- Uploaded bundle passes hosted checks.
- Demo video on X shows real checks and a PayBox approval.
- Submitted before 8 pm EDT.
