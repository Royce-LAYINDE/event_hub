# EventHub

Plateforme de gestion des evenements academiques et culturels du Dakar Institute of
Technology : creation d'evenements, inscription des participants, suivi de la capacite et
statistiques.

L'application suit une architecture microservices : trois services backend exposant des
API REST, un frontend React et une base PostgreSQL, le tout conteneurise.

## Architecture

```
                         navigateur
                             |
                     frontend (nginx :8080)
                             |
        +--------------------+--------------------+
        |                    |                    |
  events-service     participants-service   registrations-service
      :3001                :3002                  :3003
        |                    |                    |
        +--------------------+--------------------+
                             |
                     PostgreSQL :5432
      eventhub_events | eventhub_participants | eventhub_registrations
```

Le frontend ne connait que nginx, qui proxifie `/api/events`, `/api/participants` et
`/api/registrations` vers le service correspondant. `registrations-service` interroge
`events-service` et `participants-service` en HTTP avant de confirmer une inscription :
existence du participant et places disponibles.

Chaque service possede sa propre base de donnees : aucun service ne lit les tables d'un
autre.

## Microservices

### events-service (port 3001)

| Methode | Endpoint | Role |
|---|---|---|
| GET | `/api/events` | liste les evenements, filtres `date` et `location` |
| POST | `/api/events` | cree un evenement |
| GET | `/api/events/:id` | details d'un evenement |
| PATCH | `/api/events/:id` | modifie un evenement |
| DELETE | `/api/events/:id` | supprime un evenement |
| GET | `/api/events/:id/availability` | places restantes |
| GET | `/health` | etat du service |

Table `events` : id, title, description, starts_at, location, capacity,
registered_count. Table `event_reservations` : reservation de place liee a une inscription.

### participants-service (port 3002)

| Methode | Endpoint | Role |
|---|---|---|
| GET | `/api/participants` | liste les participants, parametre `search` sur nom ou email |
| POST | `/api/participants` | cree un participant |
| GET | `/api/participants/:id` | details d'un participant |
| PATCH | `/api/participants/:id` | modifie un participant |
| DELETE | `/api/participants/:id` | supprime un participant |
| GET | `/health` | etat du service |

Table `participants` : id, name, email, phone, type parmi `STUDENT`, `PROFESSOR`,
`EXTERNAL`.

### registrations-service (port 3003)

| Methode | Endpoint | Role |
|---|---|---|
| GET | `/api/registrations` | liste les inscriptions |
| POST | `/api/registrations` | inscrit un participant a un evenement |
| DELETE | `/api/registrations/:id` | annule une inscription |
| GET | `/api/registrations/event/:eventId` | inscriptions d'un evenement |
| GET | `/api/registrations/participant/:participantId` | evenements d'un participant |
| GET | `/api/registrations/statistics` | statistiques d'inscription |
| GET | `/health` | etat du service |

Table `registrations` : id, event_id, participant_id, status parmi `CONFIRMED`,
`CANCELLED`.

## Prerequis

- Node.js 22 ou plus
- Docker et Docker Compose
- PostgreSQL 17, uniquement pour un lancement manuel sans Docker

## Lancement avec Docker Compose

```bash
cp .env.example .env
docker compose up -d --build
```

| Service | URL |
|---|---|
| Frontend | http://localhost:8080 |
| events-service | http://localhost:3001/api/events |
| participants-service | http://localhost:3002/api/participants |
| registrations-service | http://localhost:3003/api/registrations |

Verifier que la stack repond :

```bash
npm run smoke
```

Arreter la stack, `-v` supprimant aussi les donnees :

```bash
docker compose down -v
```

## Lancement d'un service seul avec Docker

Le contexte de build est la racine du depot, car les images installent leurs dependances
depuis les workspaces npm :

```bash
docker build -f services/events-service/Dockerfile -t eventhub-events-service .
```

```bash
docker run --rm -p 3001:3001 -e DATABASE_URL=postgresql://eventhub:eventhub@host.docker.internal:5432/eventhub_events eventhub-events-service
```

## Lancement manuel sans Docker

```bash
npm install
cp .env.example .env
```

Creer les trois bases dans PostgreSQL, puis appliquer les schemas :

```bash
npm run db:migrate
```

Demarrer chaque service dans un terminal distinct :

```bash
npm run dev --workspace=@eventhub/events-service
```

```bash
npm run dev --workspace=@eventhub/participants-service
```

```bash
npm run dev --workspace=@eventhub/registrations-service
```

```bash
npm run dev --workspace=@eventhub/frontend
```

Le frontend de developpement tourne sur http://localhost:5173 et proxifie les appels API
vers les trois services.

## Scripts npm

| Commande | Effet |
|---|---|
| `npm test` | tests unitaires des quatre workspaces |
| `npm run build` | compilation TypeScript et build Vite |
| `npm run typecheck` | verification des types sans emission |
| `npm run db:migrate` | applique les schemas SQL |
| `npm run db:seed` | insere des donnees de demonstration |
| `npm run smoke` | verifie une stack demarree |

## Dockerisation

Chaque service a son propre Dockerfile multi-stage :

- une etape `build` sur `node:22-alpine` installe les dependances du workspace concerne
  et compile le TypeScript ;
- une etape `runtime` reinstalle uniquement les dependances de production avec
  `--omit=dev` et ne recoit que le dossier `dist` compile.

Choix retenus :

- images de base Alpine, et `nginx:1.29-alpine` pour servir le frontend statique ;
- conteneurs backend executes avec l'utilisateur non privilegie `node` ;
- configuration entierement par variables d'environnement, aucune valeur en dur ;
- volume nomme `postgres-data` pour la persistance de la base ;
- `healthcheck` sur chaque service, ce qui permet a Compose de respecter l'ordre de
  demarrage grace a `depends_on` avec `condition: service_healthy`.

## Pipeline CI/CD

Deux workflows GitHub Actions.

`.github/workflows/ci.yml`, sur `develop`, sur les branches `feature/**` et sur chaque
Pull Request vers `develop` ou `main` :

1. checkout du code
2. installation de Node.js 22 avec cache npm
3. `npm ci`
4. `npm run typecheck`
5. `npm test`
6. `npm run build`
7. build des quatre images Docker, sans publication

`.github/workflows/cd.yml`, sur `main` uniquement :

1. les memes tests et builds
2. connexion a GitHub Container Registry avec le `GITHUB_TOKEN` integre
3. build et push des quatre images, taguees `latest` et avec le SHA du commit
4. deploiement : recuperation des images publiees, demarrage de la stack complete avec
   Docker Compose, puis smoke test des quatre services et du proxy nginx
5. arret de la stack, avec affichage des logs en cas d'echec

Les images sont publiees sous `ghcr.io/royce-layinde/eventhub-<service>`.

## Strategie de branches

| Branche | Role |
|---|---|
| `main` | production, declenche le workflow CD |
| `develop` | integration continue |
| `feature/*` | developpement des fonctionnalites |

Les branches de fonctionnalite sont fusionnees dans `develop` par Pull Request, puis
`develop` est fusionnee dans `main` pour livrer.

## Structure du projet

```
.
├── .github/workflows/        ci.yml et cd.yml
├── db/init/                  creation des trois bases au premier demarrage
├── frontend/                 application React, Dockerfile et configuration nginx
├── scripts/smoke-test.sh     verification d'une stack demarree
├── services/
│   ├── events-service/
│   ├── participants-service/
│   └── registrations-service/
├── docker-compose.yml
├── package.json              workspaces npm
└── tsconfig.base.json        configuration TypeScript commune aux services
```

Chaque service backend suit la meme organisation : `routes/` pour les endpoints,
`repositories/` pour l'acces aux donnees, `db/` pour le schema et les migrations,
`tests/` pour les tests unitaires.

## Technologies

| Domaine | Choix |
|---|---|
| Backend | Node.js 22, Express 5, TypeScript, Zod, pino |
| Frontend | React 19, Vite 7, Tailwind CSS 4, daisyUI |
| Base de donnees | PostgreSQL 17 |
| Tests | Vitest, Supertest |
| Conteneurisation | Docker multi-stage, Docker Compose, nginx |
| CI/CD | GitHub Actions, GitHub Container Registry |


