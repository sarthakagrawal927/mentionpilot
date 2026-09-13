# Mentionpilot — concise PRD

Status: target product direction, 2026-09-13. Requirements below are not claims of shipped integrations.

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

## Sequence and open decisions

First restore and verify the existing brand workflow and connect Reddit Insights. Add validated F5Bot/Trends inputs next. Expand reporting only after signal quality is demonstrated. Pricing, alert channels, and provider coverage remain TBD.
