# Kiddo TODOs

## Système RPG (Habitica-inspired)

### ✅ Fait
- [x] Migration DB prod + infrastructure TypeORM CLI (`migration:run`, `data-source.ts`)
- [x] Entités : `goldReward` / `bonusGold` / `difficulty` sur Task, `xp` / `class` sur Child, `currency` sur Transaction
- [x] Backend : XP attribué à l'approbation selon difficulté (`easy→10` … `legendary→200`)
- [x] Backend : balance gold-only (filtre `currency = 'gold'`), stats `tasksCompleted` corrigées
- [x] Courbe XP non-linéaire infinie : `floor(50 × N^1.6)`, niveau calculé dynamiquement
- [x] Titres par palier (Apprenti / Aventurier / Héros / Champion / Légende)
- [x] 5 classes (guerrier, archer, mage, voleur, paladin) — emoji set par classe et palier
- [x] `lib/rpg.ts` — utilitaires frontend (getLevelFromXp, getXpProgress, labels, emojis)
- [x] `create-child` — sélecteur de classe (étape 2 du flow 4 étapes)
- [x] `create-task` — sélecteur de difficulté (5 niveaux, affiche XP gagné), or manuel
- [x] `home.tsx` enfant — hero XP bar, badges `+X🪙 +Y⭐`, balance or
- [x] `profile.tsx` enfant — carte niveau/classe/XP, badges pièces, stats "quêtes"
- [x] `rewards.tsx` — pts → pièces 🪙 partout
- [x] `dashboard.tsx` parent — cards enfants avec `levelEmoji + Niv. X`, or crédité en 🪙
- [x] `edit-child.tsx` — carte read-only niveau / classe / XP total
- [x] **Level-up** : détection franchissement niveau à l'approbation → modal animé (reanimated v4) + endpoint `POST /children/:id/ack-levelup` — PR #13
- [x] Équipement LPC par couches : HeroSprite layers, progression par archétype (guerrier/archer/mage), badge classe avatar — PR #13

### 🔲 À faire — RPG
- [ ] **Historique XP** : l'enfant peut voir ses transactions XP (quelle quête → combien d'XP)
- [ ] **Objectifs de niveau** : parent peut associer une récompense automatique à un niveau cible
- [ ] **Shop cosmétique** : acheter des items visuels avec les pièces (avatar frames, badges) — v2
- [ ] **Narration par classe** : quête principale différente selon classe (guerrier/mage/…) — v3

---

## P1 — Bloquant pour le ship

_Tout résolu._

## P2 — Même branche idéalement
- [ ] Photo storage: choisir S3 (ou DigitalOcean Spaces) pour photo proof. Railway n'a pas de persistent file storage.
- [ ] Polling client fallback FCM (30s interval quand app en foreground) — si FCM delivery fail après validation parent, enfant ne voit pas ses points sans refresh.

## P3 — Follow-up
- [ ] Admin tooling (reset streak, voir historique famille) — nécessaire pour le support
- [ ] Analytics parentaux (taux completion, heures pics, progression semaine) — Phase 2
- [ ] Financial rails exploration (Greenlight/BusyKid competitive risk) — évaluer si allowance + virtual wallet est la prochaine expansion naturelle
- [ ] Crédit provisoire + clawback parent A/B test (v1.2) — tester en production
- [ ] Leaderboard entre frères/sœurs — scope expansion v2
- [ ] Admin dashboard familles (outil de support)
- [ ] Task marketplace (catalogue de tâches prédéfinies par âge et type)
- [ ] API publique — intégrations tierces potentielles

## Ajouts post-revue Eng (P1 critiques)

- [x] Outbox pattern pour FCM : table `notification_intents` + worker async — déjà en place
- [x] PIN lockout en PostgreSQL (pas en mémoire) : table `pin_attempts` — déjà en place
- [x] Streak timezone : `families.timezone` field + `AT TIME ZONE :tz` dans getStreak — déjà en place
- [x] Index PostgreSQL sur tasks/transactions/rewards/notification_intents — migration 1780300000000
- [x] QR code : table `qr_tokens(token_hash, child_id, expires_at, used_at)` TTL 30s one-time — PR #17
- [x] Notification JWT scoped task (24h, approve/reject seul) : pour deep-link depuis push notif — PR #17
- [ ] Ledger checkpoint : table `ledger_snapshots` + cron minuit

## ✅ Fait récemment (post-v1)

- [x] IDOR guards tasks + uploads : vérification `familyId`/`childId` sur create/complete/approve/reject — PR #11
- [x] Empty states parent/enfant, CTA "créer quête" — PR #12
- [x] Notification FCM rejet vers enfant — PR #12
- [x] Migrations colonnes manquantes prod (`pendingLevelUp`, colonnes RPG) — PR #14
- [x] Child IDOR endpoints child-auth : `resolvedId = child ? user.sub : param` sur transactions + children routes — PR #15
