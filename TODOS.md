# Kiddo TODOs

## P1 — Bloquant pour le ship
- [ ] Test concurrence reward redemption (SELECT FOR UPDATE) — deux enfants réclament même récompense "une seule fois" simultanément. Failure ici = double-debit silencieux.
- [ ] Middleware IDOR sur toutes les routes child — vérifier que child.familyId === parent.familyId sur chaque request. Failure ici = fuite données cross-famille.

## P2 — Même branche idéalement
- [ ] Photo storage: choisir S3 (ou DigitalOcean Spaces) pour photo proof. Plan ne le spécifie pas. Railway n'a pas de persistent file storage.
- [ ] Polling client fallback FCM (30s interval quand app en foreground) — si FCM delivery fail après validation parent, enfant ne voit pas ses points sans refresh.
- [ ] Empty states UX: (a) parent sans tâches créées → CTA "Créez votre première tâche", (b) enfant first-time → écran de bienvenue avec avatar.
- [ ] Réjection state UI: push notification vers enfant avec message de rejection personnalisé du parent.

## P3 — Follow-up
- [ ] Admin tooling (reset streak, voir historique famille) — nécessaire pour le support
- [ ] Analytics parentaux (taux completion, heures pics, progression semaine) — Phase 2
- [ ] Financial rails exploration (Greenlight/BusyKid competitive risk) — évaluer si allowance + virtual wallet est la prochaine expansion naturelle
- [ ] Crédit provisoire + clawback parent A/B test (v1.2) — le subagent a fait un argument valide, tester en production
- [ ] Leaderboard entre frères/sœurs — scope expansion v2
- [ ] Admin dashboard familles (outil de support)
- [ ] Task marketplace (catalogue de tâches prédéfinies par âge et type)
- [ ] API publique — intégrations tierces potentielles

## Ajouts post-revue Eng (P1 critiques)

- [ ] Outbox pattern pour FCM : table `notification_intents` + worker async — voir Section Eng Architecture
- [ ] Streak timezone : families.timezone field + calcul de date en timezone famille — voir Eng edge cases
- [ ] PIN lockout en PostgreSQL (pas en mémoire) : table pin_attempts — voir Eng Security
- [ ] QR code : table qr_tokens(token_hash, child_id, expires_at, used_at) TTL 30s one-time — voir Eng Security
- [ ] Notification JWT scoped task (24h, approve/reject seul) : pour deep-link depuis push notif — voir Eng Security
- [ ] Ledger checkpoint : table ledger_snapshots + cron minuit — voir Eng Performance
- [ ] Child IDOR sur endpoints child-auth : task.child_id === authenticatedChildId — voir Eng Security critique
- [ ] Index PostgreSQL sur tasks/transactions/rewards — voir Eng Performance
