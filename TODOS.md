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

### 🔲 À faire — RPG
- [ ] **Level-up** : détecter le franchissement de niveau à l'approbation → modal/animation côté enfant
- [ ] **Historique XP** : l'enfant peut voir ses transactions XP (quelle quête → combien d'XP)
- [ ] **Objectifs de niveau** : parent peut associer une récompense automatique à un niveau cible
- [ ] **Shop cosmétique** : acheter des items visuels avec les pièces (avatar frames, badges) — v2
- [ ] **Narration par classe** : quête principale différente selon classe (guerrier/mage/…) — v3

---

## Avatars & UI

### ✅ Fait
- [x] Système de sprites LPC — `HeroSprite` animé (walk strip 832×256px, 13 cols × 4 rows)
- [x] 8 personnages avec walkStrip + sprite LPC complet (Aldric, Rajan, Zéphyr, Kwame, Lyra, Saoirse, Amara, Nadia)
- [x] `create-child` — sélecteur d'avatar avec `HeroSprite` + `item.walkStrip` (fix rendu)
- [x] PIN screen — preview avatar avec `selectedChar.walkStrip` (fix rendu)
- [x] Suppression profil enfant — `childrenApi.delete()` réellement appelé (était no-op)
- [x] `edit-child` — suppression sélecteur emoji/couleur (piloté par le sprite choisi à la création)
- [x] Logo Kiddo réel dans l'app (login + header dashboard) — remplace placeholder Expo

---

## Store & Release

### ✅ Fait
- [x] Fiche Play Store : description courte/longue, mots-clés ASO (`store/listing/description.md`)
- [x] Politique de confidentialité RGPD/COPPA (`store/listing/privacy-policy.md`)
- [x] GitHub Pages activé sur `LapassetAlexis/Kiddo` — privacy policy URL publique
- [x] Icônes générées depuis SVG : 512 opaque, 1024 opaque, 1024 transparent
- [x] Screenshots capturés et intégrés (`store/graphics/screenshots/`)
- [x] Package ID migré `com.kiddo.app` → `io.kiddo.app`
- [x] Scripts npm : `build:dev` (APK dev EAS) + `build:prod` (AAB + submit auto)
- [x] `scripts/bump-version.js` — incrémente `version` (patch) + `versionCode` avant chaque build prod
- [x] Checklist release (`store/release/checklist.md`)

### 🔲 À faire — Store
- [ ] **Feature Graphic** Play Store (1024×500px) — à créer
- [ ] Soumettre la fiche complète sur Play Console (catégorie, rating, privacy policy URL)
- [ ] Tagger le premier release : `git tag v0.1.3 && git push --tags`

---

## Sécurité & Isolation

### ✅ Fait
- [x] `GET /tasks` + `GET /tasks/history` + `GET /tasks/child/:id` filtrés par `familyId` JWT — isolation cross-famille
- [x] `UpdateChildDto` whitelist `name` + `sprite` uniquement
- [x] expo-clipboard — import propre (suppression `@ts-ignore` + `require` dynamique)

### 🔲 À faire — Sécurité
- [ ] **IDOR complet** : vérifier toutes les routes parent/child (rewards, transactions, notifications) — P1
- [ ] Test concurrence reward redemption (`SELECT FOR UPDATE`) — double-debit silencieux possible — P1
- [ ] PIN lockout en PostgreSQL (`pin_attempts` table, pas en mémoire) — P1
- [ ] Child IDOR sur endpoints child-auth : `task.child_id === authenticatedChildId` — P1

---

## Infrastructure & DevX

### ✅ Fait
- [x] `GET /api/health` endpoint — utilisé pour le wake-up screen
- [x] Wake-up screen : logo animé (pulse + dots) pendant réveil serveur Render — timeout 5s par ping, retry 2.5s
- [x] Scripts build EAS dans `package.json`

### 🔲 À faire
- [ ] Outbox pattern FCM : table `notification_intents` + worker async
- [ ] Streak timezone : `families.timezone` + calcul date en timezone famille
- [ ] QR code : `qr_tokens(token_hash, child_id, expires_at, used_at)` TTL 30s one-time
- [ ] Ledger checkpoint : `ledger_snapshots` + cron minuit
- [ ] Index PostgreSQL sur tasks/transactions/rewards
- [ ] Polling client fallback FCM (30s interval foreground)

---

## P3 — Backlog
- [ ] Admin tooling (reset streak, historique famille)
- [ ] Analytics parentaux (taux completion, heures pics, progression semaine)
- [ ] Empty states UX : parent sans tâches → CTA, enfant first-time → écran bienvenue
- [ ] Réjection state UI : push notif enfant avec message rejection parent
- [ ] Leaderboard frères/sœurs
- [ ] Task marketplace (catalogue prédéfini par âge)
- [ ] API publique — intégrations tierces
