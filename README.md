<div align="center">
  <img src="store/graphics/icon-1024.png" width="120" alt="Kiddo" />
  <h1>Kiddo</h1>
  <p><strong>Application mobile gamifiée pour responsabiliser les enfants (6–14 ans)</strong><br/>
  Les parents créent des quêtes, les enfants gagnent de l'or et débloquent des récompenses.</p>

  [![CI](https://github.com/LapassetAlexis/Kiddo/actions/workflows/ci.yml/badge.svg)](https://github.com/LapassetAlexis/Kiddo/actions/workflows/ci.yml)
  ![React Native](https://img.shields.io/badge/React_Native-0.81-61DAFB?logo=react)
  ![Expo](https://img.shields.io/badge/Expo-SDK_54-000020?logo=expo)
  ![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs)
</div>

---

## Aperçu

<div align="center">
  <img src="store/graphics/screenshots/dashboard-parent.png" width="18%" />
  <img src="store/graphics/screenshots/quest.png" width="18%" />
  <img src="store/graphics/screenshots/dashboard-enfant.png" width="18%" />
  <img src="store/graphics/screenshots/reward.png" width="18%" />
  <img src="store/graphics/screenshots/avatar.png" width="18%" />
</div>

---

## Fonctionnalités

### 👨‍👩‍👧 Côté parent
- Dashboard avec validation des quêtes soumises (photo optionnelle)
- Création de quêtes avec difficulté, fréquence et récompense en or
- Gestion des enfants (profil, avatar, classe RPG, objectif de niveau)
- Catalogue de récompenses personnalisables
- Code famille pour inviter un co-parent
- Notifications push (FCM) à chaque soumission/réclamation

### 🧒 Côté enfant
- Connexion par PIN 4 chiffres (pas de compte email)
- Accueil : solde d'or, streak quotidien, quêtes du jour
- Soumettre une quête avec note et photo
- Magasin de récompenses (débloquées par niveau)
- Historique des transactions
- Profil RPG avec avatar pixel-art, classe et progression de niveau

---

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Mobile | React Native 0.81, Expo SDK 54, Expo Router |
| Backend | NestJS 11, TypeORM 0.3, PostgreSQL 16 |
| Auth | JWT (parent) + PIN bcrypt (enfant) + QR session |
| Notifications | Firebase Cloud Messaging |
| Stockage fichiers | Supabase Storage |
| Déploiement API | Render.com |
| Déploiement mobile | EAS Build + Google Play |

---

## Lancer en local

### Prérequis

- Node 20+
- Docker (PostgreSQL)
- Android Studio + émulateur (API 35) **ou** téléphone Android avec Expo Go 54

### 1. Cloner et installer

```bash
git clone https://github.com/LapassetAlexis/Kiddo.git
cd Kiddo

# API
cd apps/api && npm install && cd ../..

# Mobile (hors workspace npm pour éviter le double-React)
cd apps/mobile && npm install && cd ../..
```

### 2. Configurer l'API

```bash
cd apps/api
cp .env.example .env
# Renseigner JWT_SECRET, FIREBASE_*, SUPABASE_*
```

### 3. Démarrer

```bash
# PostgreSQL
make db

# API NestJS (port 3000)
make api

# App mobile (émulateur Android)
make mobile
```

> **`make help`** — liste toutes les commandes disponibles

---

## Commandes

### Développement

| Commande | Description |
|----------|-------------|
| `make db` | Démarrer PostgreSQL via Docker |
| `make api` | Démarrer l'API en mode watch |
| `make mobile` | Démarrer Expo sur Android |

### Base de données

```bash
cd apps/api
npm run migration:run      # Appliquer les migrations
npm run migration:revert   # Annuler la dernière migration
npm run seed               # Insérer des données de test
```

### Tests

| Commande | Description |
|----------|-------------|
| `make test-api` | Tests unitaires + E2E API |
| `make test-mobile` | Tests unitaires mobile (Jest) |
| `make test-e2e` | E2E API uniquement (requiert PostgreSQL) |
| `cd apps/mobile && npm run test:e2e` | E2E mobile (Maestro, requiert émulateur) |

### Build production

```bash
# API
cd apps/api && npm run build && npm run start:prod

# Mobile Android (EAS)
cd apps/mobile && npm run build:prod
```

---

## Variables d'environnement

Fichier `apps/api/.env` (copier depuis `.env.example`) :

```env
# Base de données
DATABASE_URL=postgresql://kiddo:password@localhost:5432/kiddo_dev

# JWT
JWT_SECRET=change-me-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=change-me-refresh
JWT_REFRESH_EXPIRES_IN=30d

# Firebase (FCM — notifications push)
FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY=
FIREBASE_CLIENT_EMAIL=

# Supabase (stockage photos)
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
SUPABASE_BUCKET=task-photos

# App
PORT=3000
NODE_ENV=development
```

Fichier `apps/mobile/.env` :

```env
EXPO_PUBLIC_API_URL=http://192.168.x.x:3000/api   # IP locale en dev
```

---

## Structure du projet

```
kiddo/
├── apps/
│   ├── api/                 # NestJS — auth, families, children, tasks, rewards
│   │   ├── src/
│   │   │   ├── auth/        # JWT, refresh, QR tokens, reset password
│   │   │   ├── families/    # Comptes parent, famille, invitations
│   │   │   ├── children/    # Profils enfant, PIN, niveaux
│   │   │   ├── tasks/       # Quêtes, soumission, validation
│   │   │   ├── rewards/     # Catalogue, réclamation
│   │   │   ├── transactions/# Ledger d'or
│   │   │   ├── uploads/     # Photos (Supabase Storage)
│   │   │   └── notifications/ # FCM push
│   │   └── test/            # E2E supertest (42 scénarios)
│   └── mobile/              # Expo — iOS + Android
│       ├── app/
│       │   ├── (auth)/      # Login, inscription, PIN enfant, QR
│       │   ├── (parent)/    # Dashboard, quêtes, magasin, paramètres
│       │   └── (child)/     # Accueil, magasin, historique, profil
│       ├── components/      # SpotlightTour, OnboardingChecklist, modals
│       ├── lib/             # API client, hooks (useTour, useApiData)
│       └── .maestro/        # Flows E2E Maestro (6 scénarios)
└── store/
    └── graphics/            # Icône, screenshots Play Store
```

---

## CI/CD

GitHub Actions sur chaque push/PR vers `main` :

| Job | Ce qu'il vérifie |
|-----|-----------------|
| **Backend tests** | 180+ tests unitaires + 42 E2E (PostgreSQL 16) |
| **Frontend tests** | Tests unitaires mobile (Jest) |
| **Build API** | TypeScript `--noEmit` |

Déploiement API : Render.com (auto-deploy sur `main`)  
Déploiement mobile : EAS Build → Google Play (manuel via `npm run build:prod`)
