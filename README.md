# KidPoints

Application mobile gamifiée pour aider les parents à gérer les tâches de leurs enfants (6-14 ans) via un système de points et de récompenses.

## Structure

```
kidpoints/
├── apps/
│   ├── mobile/     # Expo React Native (iOS + Android)
│   └── api/        # NestJS + PostgreSQL
├── design/         # Maquettes HTML de référence
├── PLAN.md         # Plan de développement complet
└── TODOS.md        # Tâches prioritisées P1/P2/P3
```

## Lancer le projet

### Prérequis

- Node 18+
- Bun
- Docker (pour PostgreSQL)
- Expo Go sur votre téléphone (pour tester le mobile)

### 1. Base de données

```bash
docker-compose up -d
```

### 2. API

```bash
cd apps/api
cp .env.example .env   # renseigner les variables
npm run start:dev
```

### 3. Mobile

```bash
cd apps/mobile
npx expo start
# Scanner le QR code avec Expo Go
```

## Fonctionnalités

### Côté enfant
- Écran home : solde de points, streak, tâches du jour
- Marquer une tâche comme faite (+ photo optionnelle)
- Catalogue de récompenses (débloquées/verrouillées)
- Historique des transactions

### Côté parent
- Dashboard : validation des tâches, vue des enfants
- Création de tâches avec points et fréquence
- Création de récompenses
- Approbation des récompenses réclamées

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Mobile | React Native (Expo) |
| Backend | NestJS |
| Base de données | PostgreSQL (TypeORM) |
| Auth | JWT (parent) + PIN 4 chiffres (enfant) |
| Notifications | Firebase Cloud Messaging |
| Hébergement | Railway |

## Design

Le dossier `design/` contient les maquettes HTML interactives des 4 écrans principaux (thème dark gray `#18181e`, accents or `#FFB800`).

```
design/
├── child-home.html       # Écran home enfant
├── child-rewards.html    # Catalogue récompenses
├── child-history.html    # Historique
└── parent-dashboard.html # Dashboard parent
```
