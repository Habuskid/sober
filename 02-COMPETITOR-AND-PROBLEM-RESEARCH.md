# 02-COMPETITOR-AND-PROBLEM-RESEARCH.md

**Last checked**: 2026-10-17

## PayBox Existing Capabilities
- Non-custodial vault for wallets, cards, and secrets.
- Scoped revocable grants with human or autonomous approval modes and passkeys.
- Native MCP tools for payments, swaps, portfolio, virtual cards, and x402 (`discover_services`, `pay_x402`, `use_service`).
- Plugin discovery and invocation.
- Live examples include Aave, Jupiter, Kamino, Hyperliquid, prediction markets, and Resy bookings.
- Plugins only propose; PayBox handles execution and approval.

## Strongest Documented Problems
- Multiple 2026 papers on x402 (arXiv:2605.30998, arXiv:2605.11781, arXiv:2607.19545) document free-riding, cross-resource substitution, duplicate settlement, wrong goods, malicious endpoints, and gas abuse. All tested facilitators violated rules.
- Coinbase x402 GitHub issue #1817 explicitly requests counterparty risk checking before agents pay.
- External tools exist (x402check.xyz, verify-before-pay, Fizzl) but are not native PayBox plugins that return both a verdict and a valid `io.paybox/transactionProposal`.
- Broader agent pain: permanent credentials are risky; prompt-only controls fail.

## Observed Hackathon Submissions (public X posts)
- StayPay (hotel search + USDC)
- SikaBox / PayBot (local fiat ramps)
- Xona Creative Studio (pay-per-use generation)
- CryptoMemo (paid signals)
- Stature (portfolio)
- settle (invoice tracking)

## Saturation
Generic “agent pays for X” or thin x402 wrappers overlap heavily with PayBox’s native tools. Hotel, local ramp, creative, and basic invoice ideas already have submissions or existing MCPs.

## Gap Filled by Sober
A narrow, demonstrable pre-payment safety check that produces a PayBox-compatible x402 proposal only when the check passes. Supported by public research and not covered by core PayBox or observed submissions.
