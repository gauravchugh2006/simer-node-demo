# Cafe Coffee Day — Node.js API + React App

Project README: a minimal, practical guide to run and develop the Cafe Coffee Day application locally.

## Overview
Small full-stack app:
- Backend: Node.js (Express) API as middleware
- Database: MySQL in Docker (docker-compose) with user/admin, auth, orders, order tracking tables
- Frontend: React (mobile + desktop friendly, responsive)

## Tech stack
- Node.js (LTS)
- Express
- MySQL (Docker)
- React (create-react-app / Vite)
- Sequelize / TypeORM / Knex (choose one for ORM)
- Docker & Docker Compose
- Optional: pm2, dotenv

## Repo layout (suggested)
- /backend — Node API
    - /src
    - .env
    - package.json
- /frontend — React app
    - src/
    - package.json
- /docker
    - docker-compose.yml
    - init-db/ (SQL schema + seed files)
- README.md

## Prerequisites
- Node.js (16+)
- npm or yarn
- Docker & Docker Compose
- Git

## Environment variables (example .env files)
Backend (.env):
```
PORT=4000
DB_HOST=mysql
DB_PORT=3306
DB_USER=ccd_user
DB_PASSWORD=ccd_password
DB_NAME=ccd_db
JWT_SECRET=change_this
```
Frontend (.env.local):
```
REACT_APP_API_URL=http://localhost:4000/api
```

## Docker Compose (high level)
- Provide a `docker/docker-compose.yml` with at least:
    - mysql service (image: mysql:8), environment for MYSQL_ROOT_PASSWORD, MYSQL_DATABASE, MYSQL_USER, MYSQL_PASSWORD
    - volumes for persistence
    - optional adminer for DB UI
- Place SQL schema and seed scripts in `docker/init-db` and mount to `/docker-entrypoint-initdb.d/`.

## Database schema (core tables)
- users: id, name, email, password_hash, role (user/admin), created_at
- sessions / tokens (optional)
- products / menu: id, name, price, category, description, image_url, available
- orders: id, user_id, total_amount, status, created_at, updated_at
- order_items: id, order_id, product_id, quantity, price
- order_tracking: order_id, status, changed_at, note

Provide SQL files to create tables and seed an admin user.

## Backend — quick start
1. cd backend
2. copy `.env.example` -> `.env` and update values
3. install deps: `npm install`
4. run DB (docker-compose): `cd docker && docker-compose up -d`
5. run migrations / seed (or let init DB scripts run)
6. start server:
     - dev: `npm run dev` (nodemon)
     - prod: `npm start`
7. API base: `http://localhost:4000/api`

Recommended scripts in package.json: start, dev, migrate, seed, test.

## Frontend — quick start
1. cd frontend
2. copy `.env.local` and set `REACT_APP_API_URL`
3. install: `npm install`
4. start dev server: `npm start` (or `npm run dev` for Vite)
5. open `http://localhost:3000`

Design notes:
- Use responsive layout (CSS Grid/Flexbox, media queries)
- Mobile-first and breakpoints for desktop
- Provide friendly forms for login/register and order tracking UI

## API endpoints (suggested)
- POST /api/auth/register — register user
- POST /api/auth/login — login -> returns JWT
- GET /api/users/me — current user (auth)
- GET /api/products — menu items
- POST /api/orders — create order (auth)
- GET /api/orders/:id — order details (auth + owner or admin)
- GET /api/orders — list orders (admin or user)
- PATCH /api/orders/:id/status — update order status (admin)
- GET /api/orders/:id/tracking — order tracking history

Use JWT in Authorization header: `Authorization: Bearer <token>`

## Development workflow
- Use feature branches
- Run backend and frontend concurrently (concurrently / npm-run-all)
- Use linting and Prettier
- Add unit & integration tests for key flows (auth, orders)

## Seeding & Admin account
- Provide seed SQL or scripts to create an admin user:
    - email: admin@example.com
    - password: choose secure pass (hashed in DB)

## Troubleshooting
- DB not ready? Check container logs: `docker-compose logs mysql`
- Migration errors: ensure DB env variables match docker-compose service names
- CORS: enable CORS in backend for frontend origin during development

## Next steps / Enhancements
- Add role-based RBAC for admin operations
- Add payments integration
- Add CI pipeline and Dockerfile for backend and frontend
- Add E2E tests (Cypress / Playwright)

## License
Add a license file (e.g., MIT) as appropriate.

Contact / contributions
- Open an issue or create a PR with a clear description.
