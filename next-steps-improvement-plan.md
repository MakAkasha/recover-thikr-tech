# Recover SaaS — Next Steps & Improvement Plan

This document replaces the previous planning notes and focuses on execution priorities after the latest hardening release.

## 1) Immediate Stability & Verification (Now)

- [ ] Validate webhook flows end-to-end with **real signed payloads**:
  - [ ] Salla webhook valid signature path (`201` + queued job)
  - [ ] Moyasar webhook valid signature path (`200` + subscription/store activation)
- [ ] Add lightweight integration test scripts for critical endpoints:
  - [ ] `/api/webhook/salla/:storeId`
  - [ ] `/api/payments/moyasar/webhook`
  - [ ] `/api/health`, `/api/whatsapp/health`, `/api/admin/sessions`
- [ ] Verify worker behavior in all branches:
  - [ ] successful send
  - [ ] cancelled (cart converted)
  - [ ] delayed during salah
  - [ ] failed status update on message/send/API errors

## 2) Security & Compliance Hardening

- [ ] Add persistent/richer rate limiting (Redis-backed) for webhook routes.
- [ ] Add request size guards and explicit content-type checks on sensitive routes.
- [ ] Add structured audit logs for:
  - [ ] auth callback events
  - [ ] payment activation events
  - [ ] recovery lifecycle transitions
- [ ] Expand privacy controls:
  - [ ] mask PII consistently across all logs
  - [ ] define log retention policy in README + infra notes

## 3) Product & UX Improvements (Dashboard)

- [ ] Add onboarding checklist card in `/dashboard`:
  - [ ] Connect Salla
  - [ ] Connect WhatsApp
  - [ ] Configure delay and discount
  - [ ] Send test recovery
- [ ] Add recovery logs table filters/search (status/date/store).
- [ ] Add analytics cards for recovery performance:
  - [ ] recovered carts count
  - [ ] recovery conversion rate
  - [ ] discount usage rate
- [ ] Improve mobile responsiveness and spacing polish for Arabic RTL views.

## 4) Billing & Subscription Completion

- [ ] Finalize Moyasar production mapping of customer identifiers.
- [ ] Add subscription lifecycle handling:
  - [ ] renewal success/failure
  - [ ] grace period
  - [ ] downgrade/disable automation
- [ ] Add billing history endpoint + UI page section.

## 5) Operations, Deployment & Observability

- [ ] Complete VPS deployment runbook (single-command reproducible steps).
- [ ] Add reverse proxy + TLS setup docs (Nginx/Caddy) with secure headers.
- [ ] Align Docker networking with production topology (internal/external network split).
- [ ] Add uptime/monitoring hooks:
  - [ ] process health alarms
  - [ ] queue depth alerts
  - [ ] webhook failure alerting

## 6) Quality & Developer Experience

- [ ] Add CI pipeline (GitHub Actions):
  - [ ] API build + typecheck
  - [ ] Dashboard build + typecheck
  - [ ] optional lint/test stage
- [ ] Add seed/dev fixtures for local testing (sample store/cart/subscription).
- [ ] Add basic end-to-end smoke script for post-deploy verification.

## Suggested Execution Order

1. End-to-end signed webhook validation
2. Worker branch verification and fixes
3. Billing lifecycle completion
4. Dashboard analytics + logs UX
5. Deployment/monitoring hardening
6. CI + automated smoke tests

---

## Definition of Done for Next Milestone

- Signed Salla and Moyasar webhooks verified in a realistic environment.
- Recovery pipeline stable with observable statuses and alerts.
- Billing activation/renewal behavior proven.
- Deployment steps documented and repeatable.
- Dashboard includes actionable recovery insights.
