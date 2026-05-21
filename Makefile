# Kiddo — Commandes de développement
.PHONY: help dev api mobile test test-api test-mobile test-e2e db db-stop

help:
	@echo ""
	@echo "  Kiddo — Commandes disponibles"
	@echo ""
	@echo "  Dev"
	@echo "    make db          Démarrer PostgreSQL (Docker)"
	@echo "    make api         Démarrer l'API NestJS (dev mode)"
	@echo "    make mobile      Démarrer Expo (Android)"
	@echo ""
	@echo "  Tests"
	@echo "    make test        Tous les tests (unit + e2e)"
	@echo "    make test-api    Tests backend (unit + e2e)"
	@echo "    make test-mobile Tests frontend (unit)"
	@echo "    make test-e2e    Tests E2E API seulement"
	@echo ""

db:
	docker-compose up -d
	@echo "✅ PostgreSQL démarré sur localhost:5432"

db-stop:
	docker-compose down

api:
	cd apps/api && npm run start:dev

mobile:
	cd apps/mobile && npx expo start --android

test-api:
	cd apps/api && npm run test:all

test-mobile:
	cd apps/mobile && npx jest --passWithNoTests

test-e2e:
	cd apps/api && npm run test:e2e

test: test-api test-mobile
	@echo ""
	@echo "✅ Tous les tests passés"
