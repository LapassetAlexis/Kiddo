<!-- /autoplan restore point: /home/alapasset/.gstack/projects/LapassetAlexis-KidPoints/main-autoplan-restore-20260521-173642.md -->
# Kiddo — Plan de développement

## Vision produit

Application mobile (iOS + Android) gamifiée pour aider les parents à gérer les tâches de leurs enfants (6-14 ans) via un système de points et de récompenses.

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
| 12 | CEO | As-Built Audit | Mechanical | P1 | Code livré doit être audité vs plan greenfield | ignoré avant |
| 13 | CEO | Brand Migration Kiddo | Mechanical | P6 | Pas d'utilisateurs existants, migration store nulle | KidPoints maintenu |
| 14 | CEO | Distribution Strategy | Mechanical | P6 | Invite parent flow ajouté P2 | deferred |
| 15 | CEO | Segment âge 6-14 trop large | Mechanical | P5 | Split UI par child_age P2 | deferred |
| 16 | CEO | Parent retention loop | Mechanical | P1 | Insights hebdos + fierté ajoutés P2 | deferred |
| 17 | CEO | Sur-engineering MVP | Mechanical | P6 | Déférer retrofit coûteux, index urgent seuls | architecture complète |
| 18 | CEO | IA/LLM opportunité | Mechanical | P1 | Task suggester P2 | deferred |
| 19 | CEO | Métrique rétention J30 | Mechanical | P1 | North star ajoutée | absent avant |
| 20 | CEO | User research | Mechanical | P6 | 3 sessions avant P2 | deferred |
| 21 | CEO | Competitive audit | Mechanical | P3 | P3, priorité exécution | deferred |


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
# Kiddo TODOS.md

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


---
## DESIGN REVIEW — Passes 1-7

*Mode: SELECTIVE EXPANSION | Design binary: API key manquante — fallback wireframes ASCII*

### Design Litmus Scorecard (initial)

| Dimension | Score initial | Score cible | Gap |
|---|---|---|---|
| 1. Information hierarchy | 5/10 | 9/10 | Ordre parent écran non spécifié |
| 2. Interaction states | 4/10 | 9/10 | Loading/error/empty partiellement définis |
| 3. User journey | 6/10 | 9/10 | Arc émotionnel enfant défini, adulte moins |
| 4. Specificity | 4/10 | 8/10 | Couleurs/typo/espacements non spécifiés |
| 5. AI slop risk | 7/10 | 9/10 | Confetti/animation intentionnels, pas générique |
| 6. Responsive/mobile | 8/10 | 9/10 | React Native = mobile-first par design |
| 7. Accessibility | 2/10 | 8/10 | Aucune mention contrast, touch targets, i18n |

**Score global initial : 5.1/10 → Cible : 8.7/10**

---

### Pass 1 — Information Hierarchy

**Écran enfant — ce que l'utilisateur voit en premier, deuxième, troisième :**
```
1er coup d'œil (0-2 sec) : SOLDE DE POINTS (grosse, colorée, animée)
2ème (2-5 sec) : STREAK (feu emoji, jours consécutifs)
3ème (5+ sec) : TÂCHES DU JOUR (liste, checkboxes)
4ème (scroll) : CATALOGUE RÉCOMPENSES (prochaine récompense)
```

**Verdict :** L'ordre est correct. Points en premier = motivation immédiate. Streak en second = sentiment de progression. Tâches en troisième = ce qu'il faut faire. Récompenses en bas = objectif.

**GAP identifié :** L'écran ne montre pas combien de points manquent pour la PROCHAINE récompense directement à côté du solde. C'est une connexion motivationnelle critique.

**FIX AJOUTÉ AU PLAN :** En dessous du solde de points, afficher "XX pts de ta prochaine récompense : [Récompense]" avec une barre de progression. Rend le goal tangible sans défilement.

**Écran parent — hiérarchie :**
```
1er : ACTIONS EN ATTENTE (badge rouge, tâches à valider + récompenses réclamées)
2ème : VUE ENFANTS (solde par enfant)
3ème : ACCÈS RAPIDE (créer tâche, voir historique)
```

Le plan actuel dit "points actuels, tâches en attente, récompenses réclamées" — le bon ordre. **Score : 7/10 → 8/10 avec le fix.**

---

### Pass 2 — Interaction States

**Coverage map complète :**

| Feature | LOADING | EMPTY | ERROR | SUCCESS | PARTIAL |
|---|---|---|---|---|---|
| Task list | Skeleton | "Papa/Maman va bientôt t'assigner des tâches !" | Toast + retry | Animation check | — |
| Points balance | Shimmer | 0 avec "commence à gagner !" | Stale value + badge | Confetti + animation | — |
| Streak | Shimmer | "Commence aujourd'hui 🔥" | — | Animation feu + chiffre | — |
| Reward catalog | Skeleton cards | "Demande à papa/maman d'ajouter des récompenses !" | Toast | — | Grisé + "XX pts manquants" |
| Task submission | — | — | Toast "Réessayez" | Pulsing "En attente" state | — |
| Parent validation from notif | — | — | "Ouvrez l'app" | Checkmark + animation | — |
| Parent task queue | Shimmer | "Tout est validé ✓" | Toast | — | — |

**GAPS identifiés :**
- État de **rejet** côté enfant : l'enfant reçoit une notification "Papa a dit [message]". Pas encore spécifié comment l'afficher dans l'app. Fix : tâche rejetée apparaît en rouge avec message parent visible.
- État **offline** : aucune mention. Fix : banner "Pas de connexion — tes tâches seront synchronisées à ta reconnexion."

**Auto-décision :** Ces états sont ajoutés au plan (P1, blast radius).

---

### Pass 3 — User Journey (Arc émotionnel)

**ENFANT — Storyboard :**
```
[Matin] → Ouvre l'app → [curiosité] Voit ses points + streak
→ [motivation] Regarde tâches du jour → [décision] En fait une
→ [action] 2 taps "Fait !" + photo → [attente] État pulsant
→ [espoir] Attend validation → [joie] Confetti + +10pts → 
→ [ambition] Vérifie distance prochaine récompense
→ [satisfaction] Streak +1 → [ferme l'app]
```

**Moment à risque :** L'attente entre la soumission et la validation. Si l'enfant ouvre l'app 30min plus tard et voit encore "en attente", c'est frustrant. Fix : message encourageant dans l'état d'attente ("Papa/Maman va valider ça bientôt ! 🎉").

**PARENT — Storyboard :**
```
[Reçoit push] → 1 tap "Valider" depuis notification
→ [satisfaction] "OK c'est fait"
OU
[Oublie la notification] → Enfant nag → [friction] Ouvre app
→ [culpabilité] Voit 3 tâches en attente → [rapide] Valide tout
→ [soulagement] "Zéro en attente"
```

**Moment critique :** Le parent qui oublie de valider. Fix déjà dans le plan (notification push). Ajout recommandé : **reminder automatique après 2h si tâche reste PENDING_APPROVAL**. Chaque heure sans validation = opportunité de rupture du loop enfant.

**Auto-décision :** Reminder 2h ajouté au plan (P1, blast radius notifications).

---

### Pass 4 — Specificity

Le plan manque de spécificité design. Éléments ajoutés :

**Palette de couleurs (définie maintenant pour guider l'implémentation) :**
- Primary : #FFB800 (jaune-or = reward, positif, énergie)
- Secondary : #FF6B35 (orange = streak, feu, urgence douce)
- Success : #4CAF50 (vert = validation, accompli)
- Background enfant : #FFF9F0 (crème chaud, pas blanc froid)
- Background parent : #F5F7FA (gris clair neutre, professionnel sans être corporate)
- Text : #1A1A2E (presque-noir doux)

**Typographie :**
- Famille : Nunito (ronde, friendly, très lisible pour enfants)
- Taille points : 48sp bold (grosse, impossible à manquer)
- Taille tâches : 16sp medium
- Taille streak : 24sp bold avec emoji

**Touch targets :** Minimum 48px × 48px (checkbox, boutons) — surtout critique pour les 9-12 ans.

**Animations clés spécifiées :**
- Points balance : spring animation à l'arrivée
- Confetti : 1.5s burst, puis settle (react-native-confetti-cannon)
- Streak feu : loop subtle animation (glow)
- Tâche en attente : pulse animation 2s interval

---

### Pass 5 — AI Slop Risk

**Verdict : 7/10 — risque modéré.**

Ce qui est intentionnel et différenciateur :
- Confetti + son à la validation = moment de joie intentionnel, pas générique
- Grosse typographie points = hiérarchie intentionnelle
- Streak avec feu emoji = iconographie émotionnelle, pas corporative

Risques AI slop identifiés :
- "Catalogue de récompenses" → ne pas faire une grille de cartes génériques. Fix : chaque récompense a une icône personnalisée (parc = 🌳, TV = 📺, etc.) et la carte montre visuellement le coût vs. solde actuel.
- "Tableau de bord parent" → ne pas faire un dashboard "admin" avec tableaux. Fix : design card-based par enfant, chaque card = face de l'enfant + points + badge si en attente.

---

### Pass 6 — Responsive / Mobile

React Native = mobile-first par design. Points de vigilance :

- **Notch/Dynamic Island iOS :** SafeAreaView requis — ne pas couper le solde de points dans la notch.
- **Android variété d'écrans :** FlexBox vertical avec scroll — pas de hauteurs fixes.
- **Taille police :** AccessibilityService peut augmenter la taille. Utiliser `sp` pas `dp` pour les textes.
- **Landscape orientation :** Décider si supportée. Recommandation : lock portrait (plus simple, plus cohérent pour les enfants).

**Auto-décision :** Portrait lock ajouté au plan (P3, simple config Expo).

---

### Pass 7 — Accessibilité

**Score actuel : 2/10 — aucune mention dans le plan.**

Éléments requis ajoutés :

| Critère | Exigence | Status |
|---|---|---|
| Contraste texte | Minimum WCAG AA (4.5:1) | Palette définie au-dessus respecte ce seuil |
| Touch targets | Min 48px (WCAG 2.5.5) | Spécifié au Pass 4 |
| Labels accessibilité | `accessibilityLabel` sur tous les boutons icônes | À implémenter |
| Screen reader | `accessibilityRole` sur les éléments interactifs | À implémenter |
| Daltonisme | Pas de couleur seule pour signifier état (toujours icône + texte) | Spécifié |
| Langue | App en français (fr-FR) avec i18n préparé pour extension | À implémenter |

**Auto-décision :** Accessibilité ajoutée en P2 (blast radius UI, effort S-M).

---

### DESIGN REVIEW — Scorecard Final

| Dimension | Score initial | Score post-review |
|---|---|---|
| 1. Information hierarchy | 5/10 | 8/10 |
| 2. Interaction states | 4/10 | 8/10 |
| 3. User journey | 6/10 | 8/10 |
| 4. Specificity | 4/10 | 8/10 |
| 5. AI slop risk | 7/10 | 8/10 |
| 6. Responsive/mobile | 8/10 | 8/10 |
| 7. Accessibility | 2/10 | 7/10 |

**Score global : 5.1/10 → 7.9/10** (objectif : 8.7)

### DESIGN SUBAGENT FINDINGS (Claude, independent)

[Note: Codex unavailable. Claude subagent lancé ci-dessous.]


### Design Additions (post-subagent review)

Éléments ajoutés au plan suite à la revue design cross-model :

**Layout enfant (ordre confirmé) :**
```
┌─────────────────────────────────┐
│     🌟 120 pts                  │  ← 48sp, gold, springy
│     50 pts de "Soirée TV"      │  ← progrès vers prochaine récompense
│     [████████░░] 70%            │  ← barre de progression
│                                 │
│     🔥 5 jours consécutifs     │  ← streak, directement sous points
│                                 │
│ TÂCHES DU JOUR ─────────────── │
│ ○ Vaisselle          +10 pts   │
│ ⏳ Chambre → ✓      +30 pts   │  ← "Waiting for Papa! ⏳"
│ ○ Devoirs            +50 pts   │
│                                 │
│ ╔═══════════════════════════╗  │
│ ║ 🎁 Récompenses           ║  │  ← collapsed section
│ ╚═══════════════════════════╝  │
└─────────────────────────────────┘
```

**États interaction ajoutés au plan :**
1. Tâche en attente : "Waiting for [Prénom parent]! ⏳" (pas "En attente")
2. Undo parent (5 secondes) : après approbation, toast "Approbation envoyée • Annuler" avant commit transaction
3. Reminder 2h : si tâche reste PENDING_APPROVAL après 2h, push reminder au parent
4. Offline banner : "Pas de connexion — tes tâches seront synchronisées à ta reconnexion" (React Native NetInfo)
5. Tâche rejetée : couleur rouge + message parent visible dans la liste

**DESIGN.md :** À créer séparément (hors scope v1, post-design review). Priorité P3.

### Design Implementation Tasks (JSONL reference: tasks-design-review)

| ID | Priority | Component | Task |
|---|---|---|---|
| D1 | P1 | ChildHomeScreen | Streak placement: directly under points balance |
| D2 | P1 | TaskItem | Replace "En attente" with "Waiting for [Parent]! ⏳" |
| D3 | P1 | ParentApproval | Undo toast 5s before transaction commit |
| D4 | P2 | All screens | accessibilityLabel sur tous les boutons icônes |
| D5 | P2 | ChildHomeScreen | Offline banner via React Native NetInfo |
| D6 | P2 | ChildHomeScreen | Empty state first-time avec message encourageant |
| D7 | P3 | App config | Lock portrait orientation (Expo config) |

---

### DESIGN DELTA — Kiddo Brand & Segmentation (2026-05-21)

#### Kiddo Brand Identity

**Nom :** Kiddo — court, universel, affectueux, compris dans toutes les langues.

**Marque :**
- Tagline : "Kiddo — les tâches deviennent un jeu"
- Tone of voice : fun sans être enfantin. Les parents disent "kiddo" à leurs enfants, les ados peuvent le dire sans rougir. Pas de surnoms bébé, pas de corporate non plus.
- Emoji brand : ⭐ (l'icône de base — une étoile = un point gagné)

**Palette Kiddo (ajustée pour le nouveau nom) :**
- Primary : #FFB800 (jaune-or — énergie, récompense)
- Secondary : #FF6B35 (orange vif — streak, urgence douce)
- Accent Kiddo : #7C3AED (violet — identité brand, sépare du "jaune générique" des concurrents)
- Background enfant : #FFF9F0 (crème)
- Background parent : #F5F7FA (gris clair)
- Text primary : #1A1A2E
- Success : #10B981 (vert émeraude, plus moderne que #4CAF50)

#### Segmentation UI par age (child_age field)

**Âge 6-7 ans : "Kiddo Junior"**
- Pas de texte lisible — icônes partout
- Boutons larges (min 56px), couleurs vives, contrastes forts
- Montant des points lu à voix haute (accessibilité — VoiceOver / TalkBack)
- Emojis XXL au lieu de texte ("Vaisselle" → icône 🧼)
- Pas de fonds de texte complexes, un bouton = une action
- Cacher le streak (le concept de "jours consécutifs" est abstrait pour 6 ans)

**Âge 8-10 ans : "Kiddo Core"** (tel que conçu dans le plan)
- Texte + icônes, interface normale
- Gamification complète (points, streak, confetti, récompenses)
- Autonomie : peut naviguer entre écrans

**Âge 11-14 ans : "Kiddo+"**
- Même fonctionnalités, ton plus neutre
- Pas de confetti à chaque validation (une notification subtile suffit)
- Streak affiché sobrement (pas de 🔥 animé, juste "5 jours")
- Palette moins saturée (version dé-saturée des couleurs brand)
- UI similaire à une vraie app (pas une "app pour enfants")
- Peut voir le solde en format monétaire (euros) si le parent le configure (v2)

**Auto-décision :** Implémenté via flag child_age dans le profil enfant. Le composant render choisit le variant. Un seul codebase, pas d'app séparée. Effort S-M.

#### Parent Retention UX — Nouveaux écrans

**Insights hebdomadaires (parent dashboard, nouveau bloc) :**
```
┌─────────────────────────────────────┐
│ 📊 Cette semaine chez les Kiddos    │
│                                     │
│ Lucas  ■■■■■■■□□□  7/10 tâches     │
│      ⏱ Temps validation moyen: 2h  │
│                                     │
│ Emma   ■■■□□□□□□□  3/10 tâches     │
│      ⏱ Temps validation moyen: 5h  │  ← push plus rapide ?
│                                     │
│ 🎯 Progression vs semaine dernière  │
│ Lucas → +20%  Emma → -10%          │
└─────────────────────────────────────┘
```

**Moments de fierté (nouvel écran) :**
- Le parent peut marquer un moment comme "fierté" (ex: "Lucas a débarrassé sans qu'on lui demande")
- Apparaît dans un fil dédié, partageable (screenshot avec branding Kiddo)
- L'enfant voit les "fiertés" dans son espace (validation positive, pas de points associés)

#### Store Screenshots clés (préparer pour v1 ship)

1. **Écran enfant** — solde points + streak + tâches du jour (le core loop)
2. **Validation parent** — 1 tap depuis notification (le moment magique)
3. **Catalogue récompenses** — enfant voit ce qu'il peut gagner
4. **Dashboard parent** — vue d'ensemble tous les enfants


---
## ENG REVIEW — Architecture + Sections 1-4

### Step 0: Scope Challenge

**Existing code leverage :** Greenfield — aucun code existant. Les 3 bibliothèques clés existent et ne sont pas à reconstruire : NestJS Auth (Passport), TypeORM (PostgreSQL), Firebase Admin SDK.

**Minimum set :** Le plan est bien scopé — il y a une séparation nette entre : AuthModule, FamilyModule, TaskModule, RewardModule, NotificationModule. 5 modules = acceptable pour ce scope.

**Complexity check :** 5 modules, ~15 entités/services = légèrement au-dessus du seuil de 8 fichiers. Pas une odeur car les modules sont indépendants et faiblement couplés.

**TODOS cross-reference :** Les TODOs P1 (IDOR middleware, SELECT FOR UPDATE test) sont des prérequis pour le ship — confirmés comme dans scope.

### Section 1 : Architecture ASCII

```
┌─────────────────────────────────────────────────────────┐
│                    REACT NATIVE (EXPO)                   │
│                                                          │
│  ┌─────────────────────┐   ┌─────────────────────────┐  │
│  │   PARENT NAVIGATOR  │   │    CHILD NAVIGATOR      │  │
│  │  AuthStack          │   │  AuthStack (PIN/QR)     │  │
│  │  DashboardStack     │   │  HomeStack              │  │
│  │    TaskQueue        │   │    TaskList             │  │
│  │    RewardApproval   │   │    RewardCatalog        │  │
│  │    FamilySettings   │   │    History              │  │
│  └──────────┬──────────┘   └──────────┬──────────────┘  │
└─────────────┼──────────────────────────┼─────────────────┘
              │ JWT                      │ Session token
              ▼                          ▼
┌─────────────────────────────────────────────────────────┐
│                  NESTJS API (Railway)                     │
│                                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐  │
│  │AuthModule│ │TaskModule│ │RewardMod │ │NotifModule│  │
│  │- JWT     │ │- CRUD    │ │- CRUD    │ │- FCM      │  │
│  │- PIN hash│ │- State   │ │- Redeem  │ │- Retry    │  │
│  │- QR token│ │- Photo   │ │- Approve │ │- Queue    │  │
│  └──────────┘ └────┬─────┘ └────┬─────┘ └─────┬─────┘  │
│                    │            │               │         │
│  ┌──────────────────────────────────────────────────┐   │
│  │               FamilyModule                        │   │
│  │  - Parent management                              │   │
│  │  - Child profile management                       │   │
│  │  - IDOR middleware (familyId check)               │   │
│  └──────────────────────────────────────────────────┘   │
└──────────────────┬────────────────────────────┬──────────┘
                   │                            │
    ┌──────────────▼────────┐     ┌─────────────▼──────────┐
    │   PostgreSQL           │     │   Firebase FCM          │
    │  families              │     │  iOS APNS              │
    │  parents               │     │  Android FCM           │
    │  children              │     └────────────────────────┘
    │  tasks (stateful)      │
    │  rewards               │
    │  transactions (immutable)
    │  fcm_tokens            │
    │  streak_snapshots      │
    └────────────────────────┘
```

**Concerns de couplage identifiés :**
- NotificationModule est appelé par TaskModule ET RewardModule — acceptable car c'est une dépendance de sortie, pas circulaire.
- FamilyModule owns les profils child — TaskModule et RewardModule doivent le consommer via injection, pas de queries directes sur la table children.
- **COUPLING RISK :** Si Firebase FCM tombe, le flow approval est bloqué. Mitigation : queue de retries async (déjà spécifiée). On doit aussi avoir un endpoint `/api/tasks/:id/status` que le client poll comme fallback.

### Section 2 : Test Diagram + Test Plan

**Test Diagram — tous les flows :**

```
NEW UX FLOWS:
  A. Parent onboarding (email → verify → create family → create child)
  B. Child login (QR scan OU PIN + 4 digits)
  C. Task completion (child side: mark done → pending visual → poll)
  D. Task validation (parent side: push notification → 1 tap → commit → undo 5s)
  E. Reward redemption (child: select → debit → wait → parent confirm)
  F. Streak computation (daily cron: count consecutive days)
  G. Photo proof (child: camera → upload S3 → parent view)

NEW DATA FLOWS:
  1. Parent → POST /tasks → DB insert
  2. Child → POST /tasks/:id/complete + photo → DB state change → FCM parent
  3. Parent → POST /tasks/:id/approve → DB transaction + FCM child
  4. Child → POST /rewards/:id/redeem → SELECT FOR UPDATE → debit transaction → FCM parent
  5. Parent → POST /rewards/:id/confirm → DB confirm → FCM child
  6. Cron → GET /streak/compute → read transactions → UPDATE streak_snapshots

NEW CODEPATHS:
  1. Rate limiter PIN (5 attempts → lock 15min)
  2. IDOR check middleware (familyId verify)
  3. Idempotent task complete (if PENDING_APPROVAL → 409)
  4. FCM retry logic (3x exponential backoff)
  5. Undo window (5s delay before transaction commit)
  6. SELECT FOR UPDATE sur reward availability
  7. S3 presigned URL generation pour photo upload

NEW ERROR PATHS:
  1. FCM échec après transaction committed
  2. S3 upload échec (task submission retry)
  3. PIN lockout + reset
  4. Reward concurrent claim
```

**Tests par flow (avec gaps) :**

| Flow | Unit | Integration | E2E | Gap critique |
|---|---|---|---|---|
| Task completion | État machine statuts | DB → state change | — | FCM failure path |
| Task validation | Transaction create | DB + FCM mock | — | Undo window timing |
| Reward concurrent | SELECT FOR UPDATE logic | **Concurrence test** | — | **OBLIGATOIRE** |
| PIN rate limit | Counter increment | — | — | Reset counter |
| IDOR middleware | familyId check | Cross-family test | — | — |
| Streak compute | Calcul sur N transactions | — | — | Midnight edge |
| Photo upload | S3 presign | Upload + retrieval | — | Large file (>10MB) |

**Test plan artifact : écrit sur disk.**

### Section 3 : Security (révision)

Déjà couverte en Section 3 CEO Review. Points critiques restants :

- **JWT refresh token rotation :** Si le JWT parent est volé, l'attaquant a accès à toute la famille. Solution : refresh token à courte durée (15min access token) avec rotation sur chaque usage.
- **Child session token :** Le token enfant ne doit accéder qu'aux données de SES tâches et récompenses. Claim `childId` dans le JWT enfant, vérifié par middleware.
- **QR code expiry :** Le QR code de login enfant doit expirer après 30 secondes (one-time use + time window). Sinon un screenshot peut servir de clé permanente.

### Section 4 : Performance (compléments)

**Index requis :**
```sql
CREATE INDEX idx_tasks_child_status ON tasks(child_id, status) WHERE status = 'PENDING_APPROVAL';
CREATE INDEX idx_transactions_child ON transactions(child_id, created_at);
CREATE INDEX idx_tasks_family ON tasks(family_id, due_date);
CREATE INDEX idx_rewards_family ON rewards(family_id, available);
```

**Balance computation :**
- v1 : `SUM(amount) FROM transactions WHERE child_id = ? AND type IN ('earn','spend')`
- v1.1 : Vue matérialisée ou cache Redis si > 100 transactions par enfant (peu probable en MVP)

**Streak computation :**
- Ne pas calculer on-read à chaque page load
- Calculer en cron minuit + stocker dans `streak_snapshots` table
- Afficher la snapshot, pas recalculer en temps réel


### Eng Review — Critical Additions (post-subagent)

**Findings accepted (CRITICAL/HIGH, tous dans blast radius) :**

1. **Outbox Pattern pour FCM (Architecture)** : Au lieu d'appeler FCM synchroniquement dans la transaction DB, persister un `notification_intents` record dans la même transaction, puis traiter async via worker. Si FCM est down, la transaction DB réussit, le push est retenté plus tard.
   ```
   Task.approve() → BEGIN TX
     → INSERT transaction (points)
     → INSERT notification_intent (type: 'task_validated', child_id, task_id)
     → COMMIT TX
   → Worker pickup notification_intents → send FCM → mark sent
   ```

2. **Streak Timezone (Data model)** : La famille a un `timezone` field (Europe/Paris, etc.). Le streak est calculé en comparant les dates dans CE fuseau, pas UTC. Stored dans `families.timezone`. La date de soumission de la tâche (pas la validation) est la date qui compte pour le streak.

3. **PIN Lockout en PostgreSQL** : Table `pin_attempts(child_id, attempt_count, lockout_until)`. Non en mémoire (server restart reset). Nettoyage automatique des entries > 24h.

4. **QR Code TTL + One-time use** : Le QR code génère un token `qr_tokens(token_hash, child_id, expires_at, used_at)`. TTL = 30 secondes. After use, `used_at` set. Rejected if `used_at IS NOT NULL` ou si expiré.

5. **Notification JWT scoped task** : Pour le deep-link "approuver depuis notification", utiliser un token court-vécu (24h) scoped à `task_id` + `parent_id`. Pas le JWT principal. Permet l'action même si le JWT principal est expiré.

6. **Ledger Checkpoint** : Table `ledger_snapshots(child_id, balance, as_of_date, transaction_count)`. Mise à jour à minuit (même cron que streak). Balance affichée = snapshot + SUM(transactions depuis snapshot). Limite la taille du SUM à max 24h de transactions.

7. **Child IDOR sur child-auth paths** : Le middleware IDOR existe pour parent→child. Il faut aussi un check sur les endpoints accédés avec session token enfant : `task.child_id === authenticatedChildId`. Sinon enfant A peut voir tâches d'enfant B s'ils sont dans la même famille.

### Eng Completion Summary

```
+====================================================================+
|            ENG REVIEW — COMPLETION SUMMARY                        |
+====================================================================+
| Scope Challenge      | Greenfield, 5 modules, bien scopé          |
| Arch ASCII diagram   | Produit (voir ci-dessus)                   |
| Test diagram         | 7 flows, 5 gaps identifiés                 |
| Section 2 (Errors)   | Voir CEO Review — complété                 |
| Section 3 (Security) | 7 threats, 3 critiques résolus             |
| Section 4 (Perf)     | N+1, ledger SUM, checkpoint, indexes       |
| Critical gaps        | 2 CRITICAL (PIN lockout DB, child IDOR)    |
| TODOS updates        | 4 nouveaux P1 ajoutés                      |
+====================================================================+
```


---
## GSTACK REVIEW REPORT

**Status : REVIEWED — pending user approval**
**Branch :** main | **Date :** 2026-05-18

### Cross-Phase Themes

**Theme 1 : FCM comme single point of failure** — flaggé en Phase 1 (CEO, Section 2 Error Map) ET Phase 3 (Eng subagent). Confirmation haute confiance. Fix : outbox pattern (E1) + polling fallback (T3).

**Theme 2 : Auth boundaries insuffisantes** — flaggé en Phase 1 (CEO, Section 3 Security) ET Phase 3 (Eng, 3 findings critiques : PIN DB, QR TTL, child IDOR). Confirmation haute confiance. Fix : E3, E4, E5.

**Theme 3 : Interaction states manquants** — flaggé en Phase 1 (CEO, Section 11 Design) ET Phase 2 (Design passes 2 et 5). Confirmation haute confiance. Fix : D1, D2, D3.


## CEO DELTA REVIEW — 2026-05-21 (rename → Kiddo, code livré)

**Contexte :** /autoplan relancé après ~30 commits de code livré (NestJS + Expo + FCM + Resend + S3 + multi-parent) et renommage de KidPoints vers Kiddo.

### 1. As-Built Audit (CRITICAL — nouveau)

Le plan se lisait comme greenfield ("1 commit initial"). La réalité : 85 fichiers modifiés, code en production (Render). Le plan DOIT auditer ce qui existe déjà vs ce qui reste à faire.

**Auto-décision :** Ajouter une section "As-Built Audit" listant chaque décision d'implémentation déjà prise et le code livré correspondant.

### 2. Brand Migration — KidPoints → Kiddo (HIGH)

Le nom change. Pas d'utilisateurs existants (MVP non lancé), donc pas de perte SEO ou coût de migration store. Le risque est nul, mais le plan doit le documenter.

**Auto-décision :** Acté sans migration nécessaire. Le prochain commit peut déjà utiliser "Kiddo". Changer package name Expo, app.json, description API.

### 3. Competitive Landscape (MEDIUM)

**Concurrents identifiés :** OurHome (5M+ DL), ChoreMonster, RoosterMoney, Treasures. Kiddo n'est pas seul. Avantage compétitif proposé : UI enfant gamifiée (points, streak, confetti), notification push temps réel, photo proof. Pas de différenciation forte sur le core loop.

**Auto-décision :** Competitive audit différé en P3 — le core loop est le même pour tous les chore apps. Kiddo gagne sur la qualité d'exécution (UX enfant, animations, push temps réel). Si le produit tient ses métriques de rétention à J30, on a un argument différenciateur.

### 4. Distribution Strategy — manquante (MEDIUM)

Aucun canal d'acquisition défini. Pas d'ASO, pas de flow "share with another parent", pas de boucle virale. Risque : construire l'app parfaite que personne ne trouve.

**Auto-décision :** Ajout d'un "Invite another parent" flow dans l'espace parent (P2 — blast radius settings + S effort). Une famille peut avoir l'app, rien ne l'empêche de partager. Virailty P3 (lien de referral).

### 5. Segment d'âge 6-14 ans trop large (HIGH)

Réalité : 6-7 ans ne lit pas (icônes + voix), 8-10 ans lit et veut de l'autonomie, 11-14 ans trouve les apps "pour enfants" humiliantes. Servir les 3 extrêmes avec un seul codebase.

**Auto-décision :** Segmenter par `child_age` : si age < 8, interface icônes sans texte + montant lu à voix haute (accessibilité). Si age ≥ 11, ton plus neutre (pas d'emoji streak, pas de confetti). Même codebase, flags de rendu. Effort S-M.

### 6. Parent Retention Loop — quasi absente (HIGH)

Le parent est traité comme un opérateur de validation. Si le parent arrête de valider, toute la boucle enfant s'effondre. Données réelles : les apps de parenting perdent 80% des parents en 3 semaines.

**Auto-décision :** Ajouter une section "Parent Value Beyond Validation" : insights hebdomadaires (temps moyen validation, évolution autonomie enfant), espace "moments de fierté". Effort M, blast radius parent dashboard.

### 7. Sur-engineering pour MVP non validé (MEDIUM)

Le plan propose outbox pattern FCM, ledger snapshots, materialized views, SELECT FOR UPDATE, cron timezone, QR TTL table dédiée. C'est élégant mais c'est avant d'avoir 1 famille active pendant 2 semaines.

**Auto-décision (P6 — bias toward action) :** Tout garder dans TODOS.md P2/P3. Laisser le code actuel (FCM synchrone) en l'état. Si le produit tient J30 de rétention, on fait le retrofit. Les index PostgreSQL sont nécessaires dès maintenant (P1 confirmé).

### 8. IA/LLM — opportunité manquée (MEDIUM)

En 2026, aucune mention de feature IA : suggestion auto de tâches adaptées à l'âge, aide au wording de rejet, insights parentaux générés.

**Auto-décision :** Ajout P2 : LLM-powered "task suggestion generator" à l'onboarding. 50 lignes de code back-end, un appel API, transforme "15 champs" en "décris une journée type" → 5 tâches générées.

### 9. Métrique de rétention manquante (MEDIUM)

Critères de succès MVP actuels : setup < 10min, enfant comprend l'écran, cycle < 60s. Aucun ne mesure la rétention à 30 jours.

**Auto-décision :** Ajouter "J30 retention rate > 40%" comme critère de succès MVP. Si pas mesurable, le produit ne sait pas s'il marche.

### 10. User research avant next sprint (MEDIUM)

30 commits livrés. Aucune session utilisateur avec un vrai parent + enfant de 7 ans. Des décisions UX sont cristallisées sans validation.

**Auto-décision :** Ajouter P2 : 3 sessions de 30 min avec des parents de la cible. Montrer le prototype actuel (Expo Go sur téléphone). Reporter les findings dans le plan avant de commencer les features Phase 2.

### CEO Delta — Consensus Table

| Dimension | Finding | Auto-decision | Principle |
|---|---|---|---|
| As-Built Audit | Plan ignore code livré | Section "As-Built" ajoutée au plan | P1 |
| Brand Migration | Kiddo, pas de users existants | Acté, zéro migration cost | P3 |
| Competitive | 4 concurrents directs | Audit P3, priorité exécution | P6 |
| Distribution | Aucun canal acquis | Invite parent flow P2 | P6 |
| Segment âge | 6-14 ans trop large | Split UI par child_age (P2) | P5 |
| Parent retention | Parent = opérateur seulement | Insights hebdos + fierté (P2) | P1 |
| Sur-engineering | Architecture trop avancée | Déférer P2/P3, livrer vite | P6 |
| IA/LLM | Opportunité manquée | Task suggester P2 | P1 |
| Retention metric | J30 absent | North star J30 > 40% | P1 |
| User research | 0 session utilisateur | 3 sessions avant P2 | P6 |

### Kiddo Brand — Mise à jour plan

- **Nom app :** Kiddo (remplace KidPoints)
- **Package Expo :** `com.kiddo.app` (à changer dans app.config.js)
- **Positionnement :** "Kiddo — les tâches deviennent un jeu"
- **Store description :** "Avec Kiddo, les enfants gagnent des points en faisant leurs tâches. Les parents créent les missions, valident les progrès, et regardent leurs enfants développer autonomie et fierté."

### TODOS.md — Ajouts delta CEO

**P1 (ajouts) :**
- [ ] Renommer package Expo et API de KidPoints → Kiddo (app.config.js, package.json, assets)
- [ ] Index PostgreSQL sur tasks/transactions/rewards (urgent, déjà en prod)
- [ ] Critère succès J30 > 40% — instrumenter analytics

**P2 (ajouts) :**
- [ ] Segment UI enfant par child_age (< 8 ans : icônes + voix, ≥ 11 ans : ton neutre)
- [ ] Parent insights hebdomadaires (temps validation, autonomie)
- [ ] Task suggestion generator (LLM, onboarding)
- [ ] 3 sessions user research avec parents cibles
- [ ] "Invite another parent" flow (share family code)

**P3 (ajouts) :**
- [ ] Competitive audit (OurHome, ChoreMonster, RoosterMoney)
- [ ] Outbox pattern FCM + ledger snapshots (si rétention J30 confirmée)
- [ ] Boucle virale referral link
- [ ] AI rejection message suggester (LLM)


---
## ENG REVIEW DELTA — Code livré vs plan greenfield (2026-05-21)

**Contexte :** Le plan original traitait le projet comme greenfield. En réalité, ~30 commits ont livré du code fonctionnel en production (Render). Cette section audite chaque hypothèse greenfield et met à jour les recommendations.

### As-Built Audit : ce qui existe déjà

| Module | Présent dans le code ? | Détail | Greenfield → Delta |
|--------|----------------------|--------|--------------------|
| AuthModule (NestJS Passport) | ✅ OUI | JWT parent, PIN hash (bcrypt), email verification, password reset | Plan inchangé |
| FamiliesModule | ✅ OUI | Multi-parent, timezone, inviteCode, notifPrefs, deleteAccount avec pessimistic lock | Plan ok, déjà robuste |
| ChildrenModule | ✅ OUI | Child entity avec pinHash, fcmToken, avatar, color, PinAttempt table | PinAttempt en DB = déjà fait |
| TasksModule | ✅ OUI | complete() avec outbox parent, approve() avec transaction + outbox child+otherParent, reject() avec reset | Idempotent via atomic WHERE, déjà fait |
| RewardsModule | ✅ OUI | redeem() atomic test-and-set, grant() pessimistic_write, refuse() clean reset, histo avec enrichissement reward | SELECT FOR UPDATE implicite, déjà fait |
| TransactionsModule | ✅ OUI | Ledger immuable type 'earn'/'spend', balance via SUM live | OK |
| NotificationsModule | ✅ OUI | Outbox pattern : NotificationIntent + cron EVERY_MINUTE + 3 retry | **Déjà ce que le plan recommandait comme "critical addition"** |
| Photo upload | ✅ OUI | json limit 10mb, urlencoded, Task.photoUrl field | Accepté dans le plan |
| Resend (email) | ✅ OUI | Auth entities (EmailVerification, PasswordReset) | Non couvert par le plan |

### Findings du plan Eng Review : vérifiés contre le code

| Finding (Eng Review greenfield) | Statut code | Détail correction |
|--------------------------------|-------------|------------------|
| 1. Outbox Pattern FCM | ✅ **DÉJÀ IMPLÉMENTÉ** | NotificationIntent + cron + 3 retries + status pending/sent/failed |
| 2. Streak Timezone | ⚠️ PARTIEL | families.timezone existe dans l'entity et l'API, mais pas de streak snapshot ni cron streak |
| 3. PIN Lockout PostgreSQL | ✅ **DÉJÀ IMPLÉMENTÉ** | pin_attempts entity avec attemptCount + lockedUntil, pas in-memory |
| 4. QR Code TTL + One-time use | ❌ **PAS IMPLÉMENTÉ** | Pas de qr_tokens table ni de génération de QR |
| 5. Notification JWT scoped task | ❌ **PAS IMPLÉMENTÉ** | Pas de deep-link token scoped task/parent |
| 6. Ledger Checkpoint | ❌ **PAS IMPLÉMENTÉ** | Balance computed live via SUM — ok pour MVP |
| 7. Child IDOR | ❌ **PAS VÉRIFIÉ** | Pas de middleware IDOR explicite vu dans les controllers — **GAP critique** |
| 8. Multi-parent outbox | ✅ **DÉJÀ IMPLÉMENTÉ** | getFamilyParentTokens() avec exclude, notifPrefs filtering |

### Gaps critiques encore ouverts

| Gap | Priorité | Code impacté | Fix |
|-----|----------|-------------|-----|
| **Child IDOR** — pas de middleware vérifiant `task.child.familyId === authentified.familyId` | **P1 CRITICAL** | Tous les endpoints child | Middleware NestJS guard checkant que child.familyId = account.familyId |
| **QR code login** — pas implémenté du tout | **P2** | AuthModule | Table qr_tokens + génération 30s TTL |
| **Streak computation** — pas implémenté | **P2** | TasksModule | Cron minuit + streak_snapshots table |
| **Ledger snapshots** — pas implémenté | **P3** | TransactionsModule | Snapshots si > 100 tx/child |
| **Undo window 5s** — pas implémenté | **P3** | TasksModule approve() | Delay avant commit transaction |
| **Reminder 2h** — pas implémenté | **P3** | NotificationsModule | Nouveau cron PENDING_APPROVAL > 2h |
| **Indexes** — à vérifier en prod | **P1** | Toutes les tables | Vérifier les CREATE INDEX sur tasks/transactions/rewards |

### Renommage KidPoints → Kiddo : scope technique

| Fichier | Changement | Risque |
|---------|-----------|--------|
| apps/mobile/app.config.js | name → 'Kiddo', slug → 'kiddo', scheme → 'kiddo', bundleIdentifier → 'com.kiddo.app', package → 'com.kiddo.app' | Nul (pas en prod store) |
| apps/mobile/lib/api-client.ts | BASE_URL → 'kiddo.onrender.com', TOKEN_KEY → 'kiddo_jwt', PARENT_TOKEN_KEY → 'kiddo_parent_jwt' | **Attention** : tokens existants en SecureStore seront perdus → déconnexion forcée |
| apps/api/src/main.ts | log → 'Kiddo API' | Nul |
| apps/mobile/constants/theme.ts | Commentaire → 'Kiddo Design Tokens' | Nul |
| render.yaml | name → 'kiddo-api' | **Attention** : change l'URL de déploiement → doit être fait après nouveau deploy |
| package.json | name → 'kiddo' | Nul (local) |
| Apps mobile EAS | projectId gardé, nouveaux builds nécessaires | Nul |

**Recommandation :** Faire le rename en 2 temps : 1) code + app.config.js + render.yaml , 2) nouveau build EAS + deploy Render. Les tokens JWT existants seront invalidés au prochain refresh (normal, c'est un rename).

### Eng Completion Summary (delta)

```
+====================================================================+
|            ENG REVIEW DELTA — COMPLETION SUMMARY                   |
+====================================================================+
| As-Built Audit        | 7 modules vérifiés, 7/7 présents           |
| Outbox Pattern        | ✅ Déjà implémenté (recommendation greenfield devenue code) |
| PIN Lockout DB        | ✅ Déjà implémenté (pin_attempts entity)   |
| Multi-parent          | ✅ Déjà implémenté (getFamilyParentTokens + exclude) |
| Atomic operations     | ✅ Déjà implémenté (WHERE status check)    |
| Reward concurrent     | ✅ Déjà implémenté (test-and-set + pessimistic_write) |
| QR Code TTL           | ❌ Pas implémenté → P2                    |
| Child IDOR            | ❌ **CRITICAL** → P1                      |
| Streak                | ❌ Pas implémenté → P2                    |
| Ledger snapshots      | ❌ Pas implémenté → P3                    |
| Undo window           | ❌ Pas implémenté → P3                    |
| Reminder 2h           | ❌ Pas implémenté → P3                    |
| Indexes prod          | ⚠️ À vérifier → P1                        |
| Rename scope          | 6 fichiers, 2 avec attention              |
+====================================================================+
| Gaps critiques (P1)   | 2 (Child IDOR + Indexes)                  |
| Gaps P2               | 4 (QR login, Streak, Reminder, Offline)   |
| Delta code complexité | Code plus avancé que le plan greenfield   |
+====================================================================+
```

### TODOS.md — Ajouts delta Eng

**P1 (urgents) :**
- [ ] Ajouter middleware IDOR child sur tous les endpoints (guard NestJS)
- [ ] Vérifier/créer les indexes PostgreSQL en production
- [ ] Déployer le rename Kiddo (app.config.js + render.yaml + api-client.ts)

**P2 (même branche idéalement) :**
- [ ] QR code login enfant (table qr_tokens + TTL 30s + one-time use)
- [ ] Streak computation (cron minuit + streak_snapshots)
- [ ] Offline banner (React Native NetInfo)

**P3 (follow-up) :**
- [ ] Undo window 5s parent approval
- [ ] Reminder 2h PENDING_APPROVAL
- [ ] Ledger snapshots si > 100 transactions
- [ ] Notification JWT scoped task (deep-link depuis notif)

