# Mentionpilot — concise PRD

Status: initial workflow implemented locally, 2026-09-13. Deployment and production migration are separate release steps; requirements below are not claims of shipped integrations.

## Purpose and audience

Help founders and marketing teams understand where their brand is discussed, how it compares with competitors, and which conversations or evidence gaps deserve action.

## Core workflow

Define a brand, competitors, and relevant keywords → review a prioritized signal inbox → inspect original evidence → respond or create a task → track changes over time.

## Initial requirements

- Brand profiles with keywords, competitors, target customer, and monitoring topics.
- A unified inbox that deduplicates source records and ranks relevance, buying intent, complaints, and requests; every finding links to its source and observation time.
- Reddit Insights as the intended Reddit data supplier. F5Bot alerts and Google Trends are planned additional inputs; ingestion methods and access must be validated before promising integration.
- Brand and competitor perception summaries, with attributable examples and transparent coverage limits.
- AI visibility checks that retain actual provider responses, prompts, citations, and check times; unavailable providers remain explicit.
- Evidence-readiness audits that suggest concrete positioning, pricing, proof, comparison, and documentation improvements. Heuristic scores are labeled as such.
- Review, dismiss, and resolve actions, plus a history of findings and changes.

## Boundaries

Mentionpilot owns brand-specific interpretation and action. Reddit Insights owns Reddit collection and history. Highsignal owns editorial publishing. Bulk Reddit collection, general news publishing, generic idea generation, and automatic public replies are outside scope. Any reply draft requires human review.

## Acceptance and success

A user can configure one brand, receive real relevant findings, inspect the evidence, take an action, and revisit its history. Repeated imports create no duplicate inbox items. Track useful-finding rate, actionable findings per active brand, resolution rate, repeat usage, and source freshness; numerical targets remain TBD until a real-use baseline exists.

## Implementation checkpoint

- Brand profiles retain keywords, competitors, target customer, monitoring topics, and up to five explicit Reddit Insights communities.
- The signal inbox persists ranked Hacker News and Reddit Insights findings, deduplicates by source record, links the original evidence, and records first/last observation times.
- Users can review, dismiss, resolve, reopen, and create or complete private follow-up tasks. Every ingestion and workflow change is retained in finding history.
- Perception clusters and evidence-readiness audits are deterministic. Audit scores are labeled as homepage heuristics and do not claim factual verification.
- AI checks snapshot prompts, responses, citations, provider attribution, check times, and provider errors. Failed provider calls are excluded from mention-rate analytics rather than counted as negative mentions.
- Source receipts expose records inspected/matched, refresh count, source date, and coverage limits. The Reddit Insights adapter consumes its public `reddit-insights.display.v1` static archive; it does not claim live or complete Reddit coverage.
- F5Bot and Google Trends remain visibly planned and unavailable until their ingestion contracts and access are validated.
- Database migration `0009_brand_intelligence.sql` is required before the new workflow can run against D1.

## Sequence and open decisions

First restore and verify the existing brand workflow and connect Reddit Insights. Add validated F5Bot/Trends inputs next. Expand reporting only after signal quality is demonstrated. Pricing, alert channels, and provider coverage remain TBD.
