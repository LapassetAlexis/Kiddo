# Kiddo

Application mobile gamifiée pour aider les parents à gérer les tâches de leurs enfants (6-14 ans) via un système de points et de récompenses.

## Structure

```
kiddo/
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
- Android Studio + émulateur Pixel 8 (API 35) **ou** Expo Go sur téléphone
- Docker (pour PostgreSQL)

---

### Mobile (Android émulateur)

> **Important** : lancer depuis `apps/mobile` uniquement, pas depuis la racine.
> Le dossier `apps/mobile` est volontairement **hors workspace npm** pour éviter
> le problème de double instance React qui fait crasher l'app.

```bash
# 1. Installer les dépendances (première fois seulement)
cd apps/mobile
npm install

# 2. Lancer Metro + ouvrir sur l'émulateur Android
npx expo start --android

# Si l'app ne s'ouvre pas automatiquement, forcer via adb :
adb shell am start -a android.intent.action.VIEW \
  -d "exp://192.168.1.221:8081" host.exp.exponent
```

**Comptes de test (données en dur) :**
- Parent : n'importe quel email + mot de passe
- Enfant : choisir Lucas ou Emma → PIN `1234`

---

### API (backend)

```bash
# 1. Lancer PostgreSQL
docker-compose up -d

# 2. Configurer l'environnement
cd apps/api
cp .env.example .env   # renseigner DATABASE_URL, JWT_SECRET, etc.

# 3. Démarrer
npm run start:dev
```

---

### Points importants à retenir

| Problème | Cause | Solution |
|----------|-------|----------|
| `Invalid hook call` / `useState of null` | Double React (workspace npm) | Toujours `cd apps/mobile && npm install` depuis le dossier mobile, jamais `npm install` à la racine |
| `Cannot find module 'babel-preset-expo'` | Paquet manquant | `cd apps/mobile && npm install babel-preset-expo` |
| `Cannot find module '@/constants/theme'` | Alias TypeScript | Configuré dans `tsconfig.json` + `babel.config.js`, ne pas toucher |
| App ne s'affiche pas dans Expo Go | Mauvaise version Expo Go | La version 54.x est requise (SDK 54), installée automatiquement par `expo start` |

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
