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
   - Start Docker Desktop (or your Docker Engine service) and ensure it is running in **Linux container** mode.
   - From the project root, run:
     ```bash
     docker compose up --build
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
- **API cannot connect to MySQL?** Confirm the database container is healthy with `docker compose ps` and check credentials in `backend/.env`.
- **Frontend cannot reach API?** Update `VITE_API_BASE_URL` to the reachable API hostname.
- **Docker Desktop reports `dockerDesktopLinuxEngine` missing?** Switch Docker Desktop to *Use Linux containers* and confirm the engine is running before re-running `docker compose up --build`.

## CI/CD with Jenkins

The repository ships with a Jenkins Pipeline that builds the React frontend, validates dependencies, and deploys the Docker Compose stack onto an AWS EC2 host whenever `main` is updated.

1. **Install prerequisites on your Jenkins controller/agent**
   - Node.js 18+ and npm on the agent (the pipeline checks `node -v` and `npm -v`).
   - Docker Engine with permission to run `docker compose`.
   - Jenkins plugins: *Pipeline*, *GitHub*, *GitHub Branch Source*, and *SSH Agent*.

2. **Create Jenkins credentials**
   - Add an SSH private key credential with ID `aws-ec2-ssh-key` that can log into your target EC2 instance.
   - (Optional) Store AWS credentials or an instance profile on the EC2 host so `awslogs`/CloudWatch agents can ship container logs.

3. **Create the pipeline job**
   - Point the Jenkins job at this repo and choose “Pipeline script from SCM” so the root `Jenkinsfile` is used.
   - Configure a GitHub webhook to `https://<jenkins-url>/github-webhook/` so pushes to `main` trigger the pipeline automatically.

4. **Configure EC2 for deployment**
   - Launch an EC2 instance with Docker Engine installed (`amazon-linux-extras install docker` or `apt install docker.io`).
   - Add a security group rule exposing ports `80/443` (or the Compose-exposed ports `4000` and `5173`) to the internet. Use an Application Load Balancer if you want HTTPS offloading.
   - Ensure the Jenkins SSH key is added to `~/.ssh/authorized_keys` for the user you set in `EC2_USER` (default `ec2-user`).

5. **Pipeline stages & logging**
   - **Checkout** → **Node version check** → **Backend dependencies** → **Frontend build** (archives `frontend/dist`) → **Container build & deploy (main only)**.
   - Each stage uses `echo` logs so you can follow progress in the Jenkins console (and forward Jenkins logs to CloudWatch using the CloudWatch Agent if desired).
   - The deploy stage SSHes to EC2, clones/updates the repo in `/opt/simer-node-demo`, and runs `docker compose up -d --build` so the app is reachable at the EC2 public DNS.

6. **Lightweight mode after two successful runs**
   - The pipeline exposes a `LIGHTWEIGHT_MODE` boolean parameter. After confirming two green runs, set this to **true** to reduce resource usage by reusing cached npm artifacts (`npm ci --prefer-offline --no-audit`) while still building and deploying images.
   - You can also cap Docker cleanup to avoid disk pressure: the pipeline prunes resources older than 72 hours on each deploy.

7. **CloudWatch and CloudFront observability**
   - Enable the CloudWatch Agent on your EC2 instance to ship `/var/log/jenkins/jenkins.log` and container logs to CloudWatch Logs groups for centralized viewing.
   - If you serve the frontend behind CloudFront, point the distribution origin to the EC2 public DNS/ALB and forward path `/*`. CloudFront access logs can be enabled in the console to audit public traffic.

8. **Public access validation**
   - After deployment completes, browse to `http://<ec2-public-dns>:5173` (or your ALB/CloudFront URL). The API should be reachable at `http://<ec2-public-dns>:4000`.

9. **Protect the main branch**
   - In GitHub, enable branch protection so pull requests require a passing Jenkins build before merging. Deployments only occur on `main`.

### Detailed AWS CI/CD setup (using the provided Jenkinsfile)

Follow these step-by-step bullets to stand up the pipeline on AWS with minimal resource usage:

1. **Provision the EC2 host**
   - Launch an Amazon Linux 2 (or Ubuntu) t3.small instance with a security group that allows ports `22`, `4000`, and `5173` (or `80/443` if fronted by ALB/CloudFront).
   - Install Docker and add your deploy user to the `docker` group. Enable Docker on boot: `sudo systemctl enable --now docker`.

2. **Prepare the Jenkins controller/agent**
   - Install Jenkins (or use a managed controller). Add a Linux agent with Node.js 18+, npm, Git, and Docker/`docker compose` CLI available.
   - Configure the agent with enough disk for Docker layers (20–30 GB free) and enable workspace cleanup post-build to conserve space.

3. **Add credentials and environment**
   - In Jenkins → *Manage Credentials*, create an SSH private key credential with ID **`aws-ec2-ssh-key`** that can log in to the EC2 user (default `ec2-user`).
   - Optional: configure a global Node.js tool install so `node -v` and `npm -v` succeed on the agent.

4. **Create the multibranch or pipeline job**
   - Choose *Pipeline script from SCM*, point to your GitHub repo, and set the branch to `main` so the root **`Jenkinsfile`** is used.
   - Add the GitHub webhook (`https://<jenkins-url>/github-webhook/`) to trigger builds automatically on push.

5. **First two full runs**
   - Run the pipeline twice with the default parameter values. This pulls dependencies fresh, builds images, and deploys via SSH to `/opt/simer-node-demo` on EC2 using `docker compose up -d --build`.
   - Verify the public URLs respond before enabling optimizations.

6. **Enable lightweight mode to save resources**
   - After two green runs, edit the next build and set **`LIGHTWEIGHT_MODE=true`**. This reuses cached npm packages (`npm install --prefer-offline --no-audit`) while still rebuilding images.
   - Keep Docker cleanup enabled in the pipeline (72h prune) and set Jenkins workspace cleanup after build to minimize disk usage.

7. **Observe logs in AWS**
   - Install and configure the CloudWatch Agent on EC2 to ship Docker container logs and `/var/log/jenkins/jenkins.log` to CloudWatch Logs.
   - If you front the site with CloudFront, enable access logging to S3; use it alongside CloudWatch for full request/response visibility.

8. **Validate public access**
   - After each deploy, browse `http://<ec2-public-dns>:5173` (or your ALB/CloudFront URL). The API should be reachable at `http://<ec2-public-dns>:4000`. Confirm security group rules allow inbound traffic.


## License

Released under the MIT license. Feel free to adapt for your own cafe experience.
