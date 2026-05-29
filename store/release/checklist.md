# Checklist release Kiddo

## Avant chaque build

- [ ] Incrémenter `versionCode` dans `app.config.js` (android)
- [ ] Incrémenter `version` si changement visible utilisateur
- [ ] `cd apps/api && npx tsc --noEmit` → 0 erreurs
- [ ] Tests passent : `cd apps/api && npm test`
- [ ] Variables d'environnement production configurées sur EAS

## Build

```bash
# Android AAB (Play Store)
cd apps/mobile && eas build --platform android --profile production

# iOS IPA (App Store) — nécessite compte Apple Developer
cd apps/mobile && eas build --platform ios --profile production
```

## Avant de soumettre

- [ ] AAB testé sur un vrai device Android
- [ ] Aucun crash sur le flux principal (créer famille → créer enfant → valider tâche)
- [ ] Screenshots à jour dans `store/graphics/screenshots/`
- [ ] Politique de confidentialité hébergée et URL à jour dans la fiche store

## Soumission

```bash
# Play Store
eas submit --platform android --latest

# App Store
eas submit --platform ios --latest
```

## Après soumission

- [ ] Vérifier statut review dans Play Console / App Store Connect
- [ ] Tagger le commit : `git tag v0.x.x && git push --tags`
- [ ] Mettre à jour `CHANGELOG.md` si existant
