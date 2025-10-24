# Cafe Coffee Day full-stack demo

A responsive cafe ordering experience powered by a Node.js middleware API, a MySQL database, and a React front end. The project is optimised for both mobile and desktop users and ships with Docker tooling for local development.

## Features

- **Express API** with JWT authentication, customer registration, admin-ready login, and order management endpoints.
- **MySQL schema** bootstrapped via Docker entrypoint scripts providing customer/admin accounts and order tracking tables.
- **React interface** built with Vite, Tailwind CSS utility classes, and a modern responsive layout (hero landing, menu highlights, customer dashboards, and admin controls).
- **Order workflows** for customers to place orders and monitor statuses, plus admin tools to update progress in real time.

## Repository structure

```
.
├── backend/              # Express API source code
│   ├── Dockerfile
│   ├── package.json
│   ├── .env.example
│   └── src/
├── frontend/             # React single-page application
│   ├── Dockerfile
│   ├── package.json
│   ├── .env.example
│   └── src/
├── docker-compose.yml    # Orchestrates MySQL, API, and frontend
└── README.md
```

## Getting started

> **Prerequisites:** Docker Desktop (or Docker Engine + Compose), Node.js 18+, npm.

1. **Clone & install dependencies**
   ```bash
   git clone <repo-url>
   cd simer-node-demo
   npm install --prefix backend
   npm install --prefix frontend
   ```

2. **Configure environment variables**
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```
   Adjust the `.env` files if you need to customise ports or credentials.

3. **Launch with Docker Compose**
   ```bash
   docker-compose up --build
   ```
   - API available at `http://localhost:4000`
   - Frontend served at `http://localhost:5173`
   - MySQL exposed on `localhost:3306` (user: `ccd_user`, password: `ccd_password`)

4. **Seeded accounts**
   The SQL bootstrap script creates an administrator account:
   - Email: `admin@cafecoffeeday.com`
   - Password: `admin123`

5. **Direct script usage (without Docker)**
   ```bash
   # Backend
   cd backend
   npm install
   npm run dev

   # Frontend
   cd ../frontend
   npm install
   npm run dev
   ```

## API overview

| Method | Endpoint                     | Description                               |
| ------ | ---------------------------- | ----------------------------------------- |
| POST   | `/api/auth/register`         | Register a new customer account           |
| POST   | `/api/auth/login`            | Login and receive a JWT token             |
| GET    | `/api/orders`                | List orders (customer scoped / admin all) |
| POST   | `/api/orders`                | Create a new order for the signed-in user |
| GET    | `/api/orders/:orderId`       | View a single order                       |
| PATCH  | `/api/orders/:orderId/status`| Update order status (admin only)          |

Authentication is handled via a Bearer token (`Authorization: Bearer <token>`).

## Frontend highlights

- Mobile-first navigation with collapsible menus and quick access CTA buttons.
- Dedicated login/registration forms with validation feedback.
- Customer dashboard for order placement and status tracking.
- Admin dashboard for updating order progress through predefined states.

## Database schema summary

- `users`: stores customer and admin accounts with hashed passwords and roles.
- `orders`: keeps JSON-encoded order items, pricing, and status timestamps.

The schema is created automatically when the MySQL container starts for the first time.

## Testing & linting

This starter does not include automated tests. Feel free to integrate your preferred testing framework (Vitest/Jest for frontend, Jest/Supertest for backend) and linting (ESLint/Prettier) as enhancements.

## Troubleshooting

- **Dependencies fail to install?** Ensure you have network access or configure npm mirrors as needed.
- **API cannot connect to MySQL?** Confirm the database container is healthy with `docker-compose ps` and check credentials in `backend/.env`.
- **Frontend cannot reach API?** Update `VITE_API_BASE_URL` to the reachable API hostname.

## License

Released under the MIT license. Feel free to adapt for your own cafe experience.
