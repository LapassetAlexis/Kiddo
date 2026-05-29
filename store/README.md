# Kiddo — Store Assets

Dossier contenant tous les éléments nécessaires au déploiement sur Google Play Store et Apple App Store.

## Structure

```
store/
├── README.md               ← ce fichier
├── listing/
│   ├── description.md      ← textes (nom, descriptions, mots-clés)
│   └── privacy-policy.md   ← politique de confidentialité
├── graphics/
│   ├── icon-512.png        ← icône Play Store 512×512 (à générer)
│   ├── feature-graphic.png ← bannière Play Store 1024×500 (à créer)
│   └── screenshots/        ← captures d'écran (à ajouter)
│       ├── 01-login.png
│       ├── 02-dashboard-parent.png
│       ├── 03-tasks.png
│       ├── 04-child-home.png
│       └── 05-avatar.png
└── release/
    └── checklist.md        ← checklist avant chaque release
```

## Commandes utiles

```bash
# Build production AAB (Android)
cd apps/mobile && eas build --platform android --profile production

# Build production IPA (iOS)
cd apps/mobile && eas build --platform ios --profile production

# Submit vers Play Store
eas submit --platform android

# Submit vers App Store
eas submit --platform ios
```
