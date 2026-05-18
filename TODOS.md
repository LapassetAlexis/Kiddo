# KidPoints TODOS.md

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
