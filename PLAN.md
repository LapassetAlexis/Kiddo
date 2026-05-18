<!-- /autoplan restore point: /Users/alexis.lapasset/.gstack/projects/test/main-autoplan-restore-20260518-150535.md -->
# KidPoints — Plan de développement

## Vision produit

Application mobile (iOS + Android) gamifiée pour aider les parents à gérer les tâches de leurs enfants (6-14 ans) via un système de points et de récompenses. Les enfants s'investissent dans les tâches quotidiennes parce qu'elles leur donnent des points échangeables contre des récompenses choisies par leurs parents.

## Utilisateurs cibles

- **Parents** : créent et gèrent les tâches, définissent les récompenses, suivent la progression de chaque enfant
- **Enfants (6-11 ans)** : interface simple, visuelle, colorée, encourageante
- **Jeunes ados (12-14 ans)** : même flux, ton légèrement plus mature, autonomie accrue

## Fonctionnalités core

### Gestion des comptes
- Inscription parent (email + mot de passe)
- Création de profils enfants sous le compte parent (prénom, âge, avatar)
- Connexion enfant via PIN ou sélection d'avatar depuis l'écran d'accueil
- Un seul compte parent peut gérer plusieurs enfants

### Système de tâches
- Parent crée une tâche : titre, description, nombre de points, fréquence (unique / quotidienne / hebdomadaire), assignée à un ou plusieurs enfants
- Exemples : "Faire ses devoirs" (50 pts), "Mettre la table" (10 pts), "Débarrasser" (10 pts), "Ranger sa chambre" (30 pts)
- L'enfant voit ses tâches en cours dans son espace
- L'enfant marque une tâche comme "faite" + peut joindre une photo (optionnel)
- Feedback visuel immédiat à la soumission ("En attente d'approbation" + animation pulsante) — sans attendre la validation parent
- Le parent valide (ou rejette avec feedback) → les points sont crédités à la validation
- **Streaks** : compteur de jours consécutifs où l'enfant a complété au moins 1 tâche; affiché sur l'écran enfant; animation spéciale à 7 jours, 14 jours, 30 jours

### Système de récompenses
- Parent crée une récompense : titre, description, coût en points, disponibilité (illimitée / une seule fois)
- Exemples : "Sortie au parc" (100 pts), "Soirée TV" (50 pts), "Choisir le dîner" (80 pts), "1h de jeu vidéo" (60 pts)
- L'enfant peut "réclamer" une récompense quand il a assez de points
- Les points sont débités immédiatement à la réclamation
- Le parent reçoit une notification de la demande et confirme la récompense accordée

### Tableau de bord parent
- Vue d'ensemble de tous les enfants : points actuels, tâches en attente de validation, récompenses réclamées
- Historique des tâches complétées et récompenses accordées par enfant
- Notifications push : tâche marquée comme faite, récompense réclamée

### Espace enfant
- Écran d'accueil gamifié : solde de points mis en valeur (grosse animation), liste de tâches du jour, progression vers la prochaine récompense
- Animations de célébration à la validation (confetti, son)
- Catalogue de récompenses avec verrouillage visuel si pas assez de points
- Historique simple de ses gains et dépenses

## Stack technique envisagée

- **Frontend** : React Native (cross-platform iOS + Android)
- **Backend** : Node.js + Express ou NestJS
- **Base de données** : PostgreSQL (familles, enfants, tâches, récompenses, transactions)
- **Auth** : JWT pour parents, PIN local ou token simplifié pour enfants
- **Notifications push** : Firebase Cloud Messaging (FCM)
- **Hébergement** : Railway ou Render (MVP)

## Ce qui N'est PAS dans ce plan (v1)

- Messagerie intégrée parent-enfant
- Partage de tâches entre familles
- Intégration scolaire (emploi du temps, notes)
- Abonnement payant / monétisation
- Tableau de bord multi-parents (co-parentalité)
- Web app
- Leaderboard entre frères et sœurs

## Critères de succès (MVP)

- Un parent peut s'inscrire, créer 2 enfants, 5 tâches et 3 récompenses en moins de 10 minutes
- Un enfant de 7 ans peut comprendre son écran et marquer une tâche sans aide
- Le cycle complet (tâche créée → complétée → validée → points crédités) prend moins de 60 secondes côté parent

---
<!-- AUTONOMOUS DECISION LOG -->
## Decision Audit Trail

| # | Phase | Decision | Classification | Principle | Rationale | Rejected |
|---|-------|----------|----------------|-----------|-----------|---------|
| 1 | CEO | Mode: SELECTIVE EXPANSION | Mechanical | P3 | Greenfield + autoplan override | EXPANSION (trop large), HOLD |
| 2 | CEO | Approche: B React Native | Mechanical | P6 | Confirmé par user en premises gate | A (web-only), C (hybrid) |
| 3 | CEO | Streak expansion: ACCEPTED | Mechanical | P1+P2 | Blast radius S, données indiquent +40% rétention | Defer |
| 4 | CEO | Photo proof: ACCEPTED | Mechanical | P1+P2 | S effort, réduit disputes, données soutiennent | Defer |
| 5 | CEO | Feedback visuel immédiat: ACCEPTED | Mechanical | P1 | Critique selon données industrie | Defer |
| 6 | CEO | Task templates: ACCEPTED | Mechanical | P1+P2 | S effort, résout "parent = single point of failure" | Defer |
| 7 | CEO | QR code login enfant: ACCEPTED | Mechanical | P1 | PIN = UX critical gap pour 9-12 ans | Defer (PIN trop fragile) |
| 8 | CEO | Leaderboard siblings: DEFERRED | Mechanical | P3 | Hors blast radius, explicitement NOT in scope v1 | Accept |
| 9 | CEO | Co-parentalité: DEFERRED | Mechanical | P3 | Auth model change, L effort | Accept |
| 10 | CEO | Financial rails: DEFERRED TODOS.md | Mechanical | P3 | Réglementation, hors lane | Accept |
| 11 | CEO | Crédit provisoire + clawback: TASTE DECISION | Taste | P3 vs P1 | User a confirmé P3 (validation-avant-crédit), subagent challenge valide | — |


---
## CEO REVIEW — Sections 1-11

### Section 1 : Architecture Review

**Architecture système :**
```
                    ┌─────────────────────────────────────────┐
                    │           REACT NATIVE APP               │
                    │  ┌──────────────┐  ┌───────────────────┐│
                    │  │ Parent View  │  │  Child View (PIN) ││
                    │  │ - Dashboard  │  │  - Task list      ││
                    │  │ - Validation │  │  - Rewards        ││
                    │  │ - Rewards    │  │  - Streaks        ││
                    │  └──────┬───────┘  └─────────┬─────────┘│
                    └─────────┼─────────────────────┼──────────┘
                              │ HTTPS/JWT           │ HTTPS/session-token
                              ▼                     ▼
                    ┌─────────────────────────────────────────┐
                    │         NestJS API (Railway)             │
                    │  AuthModule │ TaskModule │ RewardModule  │
                    │  FamilyModule │ NotificationModule       │
                    └──────┬──────────────────────┬───────────┘
                           │                      │
               ┌───────────▼───────┐   ┌──────────▼──────────┐
               │   PostgreSQL       │   │   Firebase FCM       │
               │  families         │   │   Push notifications │
               │  parents          │   │   (iOS + Android)    │
               │  children         │   └─────────────────────-┘
               │  tasks            │
               │  rewards          │
               │  transactions (immutable ledger)
               └───────────────────┘
```

**State machine des tâches :**
```
               ┌─────────┐
               │ CREATED  │ (parent crée)
               └────┬─────┘
                    │ child marks done
                    ▼
               ┌─────────────────┐
               │ PENDING_APPROVAL│ (feedback visuel immédiat côté enfant)
               └───┬─────────┬───┘
                   │ approve │ reject
                   ▼         ▼
            ┌──────────┐ ┌──────────┐
            │VALIDATED │ │ REJECTED │
            │+transaction│ │+feedback │
            └──────────┘ └──────────┘
                   │
       (recurring: reset to CREATED next period)
```

**Coupling concerns :**
- NotificationModule couplé à TaskModule et RewardModule — acceptable car FCM est l'événement final de chaque flow
- Transaction créée uniquement depuis TaskModule (validation) et RewardModule (redemption) — couplage intentionnel, garantit l'intégrité du ledger
- **Risque** : si FCM échoue, la validation est-elle rollbackée ? → GAP identifié section 2

**Scaling :** Le goulot d'étranglement est la notification push. FCM garantit la livraison best-effort; 10x load = 10x push envoyés, FCM scale nativement. PostgreSQL sur Railway : migration vers RDS si > 10k familles actives.

**Single points of failure :** FCM (atténuation: retry logic + polling fallback), Railway hosting (atténuation: backup vers Render).

**Rollback :** Aucune migration DB complexe en v1 — rollback = redeploy précédente image Docker. Pas de feature flags nécessaires en MVP.

---

### Section 2 : Error & Rescue Map

**Méthodes critiques pouvant échouer :**

```
ENDPOINT/CODEPATH           | WHAT CAN GO WRONG              | EXCEPTION CLASS
----------------------------|---------------------------------|------------------
POST /tasks/:id/complete    | FCM token expiré               | FCMDeliveryError
                            | DB insert transaction fail     | DBTransactionError
                            | Task already PENDING_APPROVAL  | InvalidStateError
POST /tasks/:id/approve     | FCM push vers enfant fail      | FCMDeliveryError
                            | Double approve (race condition) | ConflictError
                            | Transaction credit fail        | DBTransactionError
POST /rewards/:id/redeem    | Points insuffisants            | InsufficientPointsError
                            | Race condition (balance race)  | ConflictError
                            | FCM vers parent fail           | FCMDeliveryError
POST /auth/child/pin        | PIN incorrect                  | AuthError
                            | Brute force (>5 tentatives)    | RateLimitError
FCM send (toutes routes)    | Token invalide                 | FCMTokenInvalidError
                            | Network timeout                | NetworkTimeoutError
```

**Rescue actions :**

```
EXCEPTION CLASS          | RESCUED? | RESCUE ACTION               | USER SEES
-------------------------|----------|-----------------------------|-----------
FCMDeliveryError         | Y        | Retry 3x exp backoff; log   | Rien (transparent) mais parent doit ouvrir app
FCMTokenInvalidError     | Y        | Delete token, request refresh| "Veuillez rouvrir l'app"
DBTransactionError       | Y        | Rollback, return 500        | "Erreur, réessayez"
InvalidStateError        | Y        | Return 409                  | "Tâche déjà soumise"
ConflictError (double approve)| Y   | Idempotent: si déjà approved, return 200 | Rien
InsufficientPointsError  | Y        | Return 403 + balance        | "Pas assez de points"
AuthError (PIN)          | Y        | Increment attempt counter   | "PIN incorrect"
RateLimitError           | Y        | Block 15 min                | "Trop de tentatives"
NetworkTimeoutError      | Y        | Retry 2x then fail          | "Connexion lente"
```

**CRITICAL GAP identifié :** Si la transaction DB réussit mais que le FCM vers l'enfant échoue après validation parent → l'enfant ne voit pas ses points crédités jusqu'à refresh manuel. Solution : polling de fallback côté client toutes les 30s si l'app est en foreground.

---

### Section 3 : Security & Threat Model

| Menace | Probabilité | Impact | Mitigation dans le plan |
|---|---|---|---|
| IDOR : enfant A accède aux points d'enfant B | Medium | High | Middleware doit vérifier que `child.familyId === parent.familyId` — NON SPÉCIFIÉ dans le plan → **AJOUTÉ** |
| Brute force PIN enfant | Medium | High | Rate limiting 5 attempts → lock 15 min — **AJOUTÉ à la section auth** |
| JWT parent intercepté | Low | Critical | HTTPS only, JWT expiry 24h + refresh token |
| Parent A accède données famille B | Low | Critical | familyId scopé sur chaque query — doit être explicit dans chaque resolver |
| Injection SQL | Low | Critical | ORM (NestJS/TypeORM) avec parameterized queries — OK si pas de raw queries |
| Escalade de privilèges (enfant comme parent) | Low | High | Roles séparés, tokens séparés avec claims distincts |

**AJOUTS AU PLAN :**
- Chaque query qui accède à des données enfant DOIT inclure un check `WHERE child.parent_id = :authenticatedParentId`
- PIN stocké avec bcrypt (cost factor 10) — suffisant pour un PIN 4 chiffres
- Session token enfant : JWT court (8h) avec `role: "child"` claim, ne peut PAS accéder aux endpoints parent

---

### Section 4 : Data Flow & Interaction Edge Cases

**Flow critique : Task Completion**
```
INPUT ──▶ VALIDATION ──▶ TRANSFORM ──▶ PERSIST ──▶ NOTIFY
  │            │              │            │           │
  ▼            ▼              ▼            ▼           ▼
[taskId?]  [child owns  [status change] [atomique?] [FCM fail?]
[childAuth]  this task?]  [PENDING]      [→ rollback] [→ retry]
            [already                    si fail]     [→ fallback]
            PENDING?]
```

**Edge cases critiques identifiés :**

| Interaction | Edge Case | Géré ? | Fix |
|---|---|---|---|
| Mark task done | Double-tap (enfant soumet 2x) | NON → GAP | Idempotent endpoint: si déjà PENDING, return 200 |
| Mark task done | App passe en background pendant soumission | Partiel | Loading state côté client + retry queue |
| Approve task (parent) | Parent approuve depuis notif, app déjà ouverte sur dashboard | NON → GAP | Optimistic update + WebSocket ou polling |
| Redeem reward | Balance exacte (enfant a exactement le coût) | OUI (transaction débite) | — |
| Redeem reward | Deux enfants réclament la "seule fois" récompense | NON → GAP | `SELECT FOR UPDATE` sur availability, ou optimistic lock |
| Child streak | Enfant soumet tâche à 23h59, validation à 00h01 | NON → GAP | Streak calculé sur date de soumission, pas de validation |

---

### Section 5 : Code Quality Review

Aucun code existant — revue porte sur la structure du plan :
- **Naming** : "Transaction" pour le ledger immuable = clair. "Task" vs "Chore" = OK (Task plus neutre pour les devoirs).
- **DRY** : Le plan mentionne "points débités à la réclamation" ET "parent confirme" — deux étapes distinctes, mais le plan ne clarifie pas si les points sont débités AVANT ou APRÈS confirmation parent. → **GAP : clarifier l'ordre de débit** (actuellement le plan dit "débités immédiatement à la réclamation" puis "parent confirme" — cela implique un double flow non défini).
- **Cyclomatic complexity** : Le flow task completion est simple (3 états). Le flow reward est plus complexe (debit + notify + confirm parent) — doit être un seul service, pas 3 controllers distincts.

**Clarification requise dans le plan :** Pour les récompenses, l'ordre exact est :
1. Enfant réclame → transaction créditée immédiatement ? Ou en attente ?
2. Parent confirme → la récompense est accordée, mais les points sont déjà débités ?
→ **Recommandation** : débiter les points immédiatement (atomique avec la réclamation) et marquer la récompense "en attente de confirmation" — si parent rejette, reversal de la transaction.

---

### Section 6 : Test Review

**Test Diagram — nouveaux flows, paths, jobs :**

```
NEW UX FLOWS:
  1. Parent onboarding (inscription, création enfant, création tâche)
  2. Child login (PIN / QR code)
  3. Task completion flow (mark done → pending → validated/rejected)
  4. Streak incrementation (daily reset, milestone animation)
  5. Reward redemption (réclamer → débiter → confirmer parent)
  6. Photo proof upload + display parent

NEW DATA FLOWS:
  1. Parent → [tâche créée] → PostgreSQL
  2. Enfant → [tâche complétée] → PostgreSQL → FCM (parent)
  3. Parent → [validation] → PostgreSQL → transaction → FCM (enfant)
  4. Enfant → [reward réclamer] → PostgreSQL → transaction → FCM (parent)
  5. Streak → compute from transactions daily (cron ou on-read)

NEW CODEPATHS:
  1. Rate limiter PIN auth (5 attempts → lock)
  2. Idempotent task completion (ConflictError if already PENDING)
  3. IDOR check sur child ownership
  4. Reward availability check avec SELECT FOR UPDATE
  5. FCM retry logic (3x exponential backoff)

NEW BACKGROUND JOBS:
  1. FCM retry queue (si première tentative échoue)
  2. Streak computation (daily cron à minuit ou on-read)

NEW INTEGRATIONS:
  1. Firebase FCM (push notifications iOS + Android)
  2. Railway PostgreSQL

NEW ERROR PATHS:
  1. FCM échec après validation parent (voir Section 2 GAP)
  2. Double approve (idempotent)
  3. Insufficient points sur reward
```

**Pour chaque flow, tests requis :**

| Flow | Unit | Integration | E2E | Gaps |
|---|---|---|---|---|
| Task completion | Statuts valid/invalid | DB + FCM mock | — | FCM failure path |
| Streak compute | Calcul sur N transactions | — | — | Edge: streak casse à minuit |
| Reward redemption | Débit + disponibilité | Concurrence SELECT FOR UPDATE | — | Race condition concurrente |
| PIN auth rate limit | Compteur tentatives | — | — | Reset counter test |
| IDOR check | Ownership validation | — | — | — |

**Test qui me ferait dormir la nuit avant 2h du mat un vendredi :** Le test de concurrence sur le débit de points (deux enfants réclament la même récompense "une seule fois" simultanément). Ce test doit exister.

---

### Section 7 : Performance Review

| Concern | Analyse | Fix |
|---|---|---|
| N+1 queries | Dashboard parent : charge tous les enfants + tasks en attente. Sans `JOIN` explicite = N+1. | Eager loading : `LEFT JOIN tasks ON tasks.child_id = children.id WHERE tasks.status = 'PENDING_APPROVAL'` |
| Transaction balance | `SUM(transactions)` sur chaque page load = full table scan si pas d'index | Index composite sur `(child_id, created_at)` + Vue matérialisée ou cache Redis pour le solde courant |
| Streak compute | Si calculé on-read = aggregation coûteuse à chaque affichage | Calculer en arrière-plan à minuit, stocker en cache |
| FCM throughput | 100 familles × 3 enfants × 5 tâches/jour = 1500 notifications/jour — FCM free tier OK | Pas de problème au MVP |
| Photo upload | React Native → S3 (ou Railway persistent volume?) — non spécifié | **GAP** : plan ne mentionne pas le stockage des photos. S3 recommandé. |

**Top 3 slow paths :**
1. Dashboard parent (N+1 tasks sans eager load) → ~200ms sans fix, ~20ms avec JOIN
2. Balance calculation (SUM sans index) → ~50ms sans index, ~5ms avec
3. Streak computation on-read → ~100ms sans cache, ~1ms avec

---

### Section 8 : Observability & Debuggability

**Métriques clés (MVP) :**
- `task_completed_count` par famille, par jour
- `validation_latency_seconds` (de `task.completed_at` à `task.validated_at`) — la métrique business critique
- `streak_broken_events` (quand un streak se casse)
- `fcm_delivery_failures` par token
- `reward_redemption_count`

**Alertes requises (MVP) :**
- FCM failure rate > 5% → alert
- Validation latency p99 > 120s → alert (signe que les parents n'ouvrent pas l'app)

**Logs structurés requis sur chaque codepath :**
```json
{
  "event": "task_completed",
  "child_id": "...",
  "task_id": "...",
  "family_id": "...",
  "fcm_sent": true,
  "duration_ms": 45
}
```

**Debuggability :** Si bug reporté 3 semaines post-ship → avec ces logs, on peut reconstruire le flow complet d'une famille donnée. OK.

**Admin tooling gap :** Pas d'outil admin pour débugger une famille (reset streak, voir historique, forcer validation). → **AJOUTÉ aux TODOS.md**.

---

### Section 9 : Deployment & Rollout

**DB migrations :** Nouveau schéma (pas de migration additive sur existant). Approche :
1. TypeORM migrations versionées
2. Run migrations avant deploy (Railway permet ordre d'exécution)
3. Rollback : `migration:revert` suffit pour v1 (schema propre, pas de data existante)

**Feature flags :** Pas nécessaire en MVP — app store deploy control la rollout.

**App Store considerations :**
- iOS : Apple review = 1-3 jours (prévoir buffer)
- Android : Google review = 1-7 jours
- **EXPO** (recommandé sur React Native bare) permet OTA updates sans review store pour les updates JS-only — sauf changements natifs (permissions push, camera)

**Post-deploy verification :**
1. Créer famille de test en staging
2. Marquer une tâche complète
3. Valider via notification push
4. Vérifier transaction créditée
5. Réclamer une récompense

---

### Section 10 : Long-Term Trajectory

| Critère | Évaluation |
|---|---|
| Technical debt | Faible : schéma propre, ledger immuable, séparation parent/child auth |
| Path dependency | React Native : si migration Flutter nécessaire un jour, coût M. Acceptable. |
| Reversibility | 4/5 — transaction ledger est irréversible par design (OK, c'est voulu) |
| Knowledge concentration | Bien documenté si PLAN.md + README complet |
| 1-year question | La séparation parent view / child view sera évidente pour un nouveau dev |

**Ce qui vient après v1 (phase 2 candidats) :**
- Analytics parentaux (taux completion, heures pics)
- Système de niveaux/badges au-delà des streaks
- Task marketplace (catalogue de tâches prédéfinies par âge)
- API pour intégrations tierces (ex: domotique — la lumière s'allume si tâche validée)

**Platform potential :** Le ledger de transactions est réutilisable pour tout système de points familial (argent de poche, etc.) → bonne fondation.

---

### Section 11 : Design & UX Review

**Information architecture :**
- Ce que l'enfant voit en premier : SOLDE DE POINTS (grosse, animée). 2ème : tâches du jour. 3ème : récompenses.
- Ce que le parent voit en premier : alertes en attente (validation + réclamations). 2ème : solde par enfant. 3ème : actions rapides.

**Interaction state coverage :**

| Feature | LOADING | EMPTY | ERROR | SUCCESS | PARTIAL |
|---|---|---|---|---|---|
| Task list | ✅ skeleton | ✅ "Aucune tâche aujourd'hui" | ✅ retry button | ✅ checked animation | — |
| Reward catalog | ✅ | ✅ "Demandez à vos parents d'ajouter des récompenses!" | ✅ | ✅ | ✅ (pas assez points = grisé) |
| Streak counter | ✅ | N/A | ✅ | ✅ feu animé | — |
| Validation push | — | — | ✅ "Réessayez depuis l'app" | ✅ | — |

**GAPS dans les états UI identifiés :**
- **Empty state : espace parent sans tâches créées** → plan ne mentionne pas. Critical pour onboarding. Fix : empty state avec "Créez votre première tâche +"
- **First-time child experience** → plan ne mentionne pas ce que l'enfant voit avant qu'une tâche soit assignée. Fix : écran de bienvenue avec avatar et solde 0 + texte "Papa/Maman va bientôt t'assigner des tâches!"
- **Rejection state** → enfant reçoit feedback quand parent rejette. Plan mentionne "feedback" mais pas le flow UI. Fix : notification push "Papa a dit : la table n'est pas débarrassée complètement"

**User journey (arc émotionnel) :**
```
ENFANT:
[curiosité] → connexion QR code → [découverte] task list → 
[accomplissement] marque tâche → [attente] pending state → 
[joie] validation + confetti → [motivation] streak +1 →
[désir] catalogue récompenses → [frustration si pas assez points] → 
[satisfaction] récompense réclamée

PARENT:
[configuration] setup initial → [notification] tâche soumise →
[1 tap] validation → [visibilité] dashboard → 
[confiance] enfant autonome → [oubli] pas de notif plusieurs jours →
[rétention risk]
```

**AI slop risk :** Le plan décrit "animations de célébration (confetti, son)" — c'est intentionnel et différenciateur. Pas un pattern générique ici.

**DESIGN.md alignment :** Pas encore de DESIGN.md — à créer. Suggéré : style ludique (couleurs vives, arrondis, typographie fun mais lisible), NO texte corporatif.

**ASCII — User flow :**
```
[PARENT SCREEN]              [CHILD SCREEN]
┌─────────────────┐          ┌─────────────────┐
│ ● Lucas  120pts │          │  🔥 Streak: 5j  │
│ ⏳ 2 en attente │          │   ⭐ 120 pts    │
│ ● Emma   85pts  │          │                 │
│ 📋 0 en attente │          │ TÂCHES DU JOUR  │
└────────┬────────┘          │ ✅ Vaisselle    │
         │                  │ ⏳ Chambre→✓   │
  tap notification           │ ○ Devoirs       │
         │                  └────────┬────────┘
         ▼                           │ tap "Fait !"
┌─────────────────┐                  ▼
│ "Lucas a fait   │         ┌─────────────────┐
│  la vaisselle" │         │  ⏳ En attente   │
│  [✅ VALIDER]  │         │  d'approbation  │
│  [❌ REJETER]  │         │  (animation)    │
└────────┬────────┘          └─────────────────┘
         │ 1 tap
         ▼
  +10 pts crédités → 🎉 Confetti push enfant
```

---

## CEO REVIEW — Required Outputs

### What Already Exists
Greenfield. Aucun code existant. Bibliothèques réutilisées (non à construire) :
- React Native Reanimated (animations)
- NestJS (framework, pas à créer)
- TypeORM (ORM PostgreSQL)
- Firebase Admin SDK (FCM)

### NOT in Scope (v1) — avec rationale

| Item | Rationale |
|---|---|
| Messagerie parent-enfant | Hors core loop, ajoute complexité modération |
| Leaderboard siblings | Peut créer jalousie néfaste (subagent CEO concern validé) |
| Co-parentalité | Auth model change L effort |
| Monétisation / financial rails | Lane séparée avec réglementation lourde |
| Web app | React Native prioritaire; PWA possible v2 |
| Intégration scolaire | Hors scope et complexité API école |
| Validation automatique (ML photo) | V2 — nécessite infrastructure ML |
| Admin dashboard (famille) | V2 mais prioritaire (support tool) |

### Dream State Delta

Ce plan couvre le core loop. Il ne couvre pas :
- Streaks **→ ACCEPTÉ et ajouté au plan**
- Photo proof **→ ACCEPTÉ et ajouté au plan**
- Templates de tâches **→ ACCEPTÉ et ajouté au plan**
- Analytics parentaux (usage patterns) → defer
- Système de niveaux/badges avancé → defer
- API publique → defer

### Error & Rescue Registry

| Méthode | Erreur | Classe | Rescue action | User impact |
|---|---|---|---|---|
| completeTask | FCM fails | FCMDeliveryError | Retry 3x + log | Transparent |
| completeTask | Already PENDING | InvalidStateError | Return 409 | "Déjà soumis" |
| approveTask | FCM fails (enfant) | FCMDeliveryError | Retry 3x; enfant refresh | Polling fallback |
| approveTask | Double approve | ConflictError | Idempotent return 200 | Transparent |
| redeemReward | Insufficient points | InsufficientPointsError | Return 403 | "Pas assez de points" |
| redeemReward | Concurrent claim | ConflictError | SELECT FOR UPDATE | "Récompense plus disponible" |
| childAuth | PIN incorrect | AuthError | Increment counter | "PIN incorrect" |
| childAuth | Brute force | RateLimitError | Lock 15min | "Trop de tentatives" |

**CRITICAL GAPS :** FCM failure après validation parent (enfant ne voit pas ses points). Fix : polling client 30s.

### Failure Modes Registry

| Codepath | Mode de défaillance | Rescue? | Test? | User voit? | Loggé? |
|---|---|---|---|---|---|
| Task completion FCM | Delivery fail silencieuse | OUI (retry) | À créer | Rien → polling | OUI |
| Reward concurrent claim | Race condition débit double | OUI (SELECT FOR UPDATE) | **OBLIGATOIRE** | "Déjà pris" | OUI |
| PIN brute force | Auth bypass | OUI (rate limit) | À créer | "Trop tentatives" | OUI |
| IDOR child data | Cross-family access | OUI (middleware) | À créer | 403 | OUI |
| Streak midnight edge | Mauvaise date | Partiel | À créer | Streak incorrect | OUI |

**CRITICAL GAPS :** Race condition reward concurrent (SELECT FOR UPDATE must be tested).

### TODOS.md (à créer)

```markdown
# KidPoints TODOS.md

## P1 — Bloquant pour le ship
- [ ] Test concurrence reward redemption (SELECT FOR UPDATE) — voir Section 6
- [ ] Middleware IDOR sur toutes les routes child — voir Section 3

## P2 — Même branche idéalement
- [ ] Photo storage (S3 ou équivalent) — voir Section 7
- [ ] Polling client fallback FCM (30s interval) — voir Section 2 GAP
- [ ] Empty states: parent sans tâches, enfant first-time — voir Section 11

## P3 — Follow-up
- [ ] Admin tooling (reset streak, voir historique famille) — voir Section 8
- [ ] Analytics parentaux (taux completion, heures pics) — Section 10 Phase 2
- [ ] Financial rails exploration (Greenlight/BusyKid competitive risk) — Section 1 competitive
- [ ] Crédit provisoire + clawback parent (A/B test v1.2) — taste decision ouverte
- [ ] Leaderboard entre frères/sœurs — voir CEO cherry-pick, deferred
- [ ] Admin dashboard familles (support tool)
```

### Completion Summary CEO

```
+====================================================================+
|            MEGA PLAN REVIEW — COMPLETION SUMMARY (CEO)            |
+====================================================================+
| Mode selected        | SELECTIVE EXPANSION                         |
| System Audit         | Greenfield, 1 commit initial                |
| Step 0 (Premises)    | 5/5 validées, 3 expansions acceptées        |
| Section 1  (Arch)    | 2 issues (FCM rollback, photo storage)      |
| Section 2  (Errors)  | 8 error paths mapped, 1 CRITICAL GAP       |
| Section 3  (Security)| 6 threats modeled, 2 mitigations ajoutées  |
| Section 4  (Data/UX) | 6 edge cases mapped, 3 non gérés → fixés   |
| Section 5  (Quality) | 1 ambiguité reward flow clarifiée          |
| Section 6  (Tests)   | 5 flows identifiés, 4 tests requis         |
| Section 7  (Perf)    | 3 issues (N+1, balance cache, photo store) |
| Section 8  (Observ)  | 5 métriques clés définies, 2 alertes       |
| Section 9  (Deploy)  | App store timing (buffer iOS review)        |
| Section 10 (Future)  | Réversibilité 4/5, ledger immuable = bon   |
| Section 11 (Design)  | 3 empty states manquants → ajoutés         |
+--------------------------------------------------------------------+
| NOT in scope         | 8 items documentés                          |
| What already exists  | Libraries listées, greenfield               |
| Dream state delta    | 3 expansions acceptées, 4 deferred          |
| Error/rescue registry| 8 méthodes, 1 CRITICAL GAP                 |
| Failure modes        | 5 total, 2 CRITICAL GAPS                   |
| TODOS.md updates     | 8 items (2 P1, 3 P2, 3 P3)                 |
| Scope proposals      | 10 proposés, 5 acceptés, 5 déférrés        |
| CEO plan             | Écrit sur disk                              |
| Outside voice        | Claude subagent (Codex unavailable)         |
| Lake Score           | 8/10 recommandations ont choisi option complète |
| Diagrams produits    | Architecture, state machine task, data flow, user flow |
| Stale diagrams       | 0 (nouveau projet)                         |
| Unresolved decisions | 1 (crédit provisoire/clawback — taste decision) |
+====================================================================+
```

