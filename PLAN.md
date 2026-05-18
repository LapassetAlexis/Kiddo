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
- L'enfant marque une tâche comme "faite"
- Le parent valide (ou rejette avec feedback) → les points sont crédités à la validation

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
