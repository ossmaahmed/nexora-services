# NEXORA Service Request Portal

NEXORA is a service-request application with a React/Vite frontend, an Express/Prisma backend, and a MySQL database.

## Workflow

- Users create requests and track their status.
- Admins review pending requests and either reject them or set them to **In Progress**.
- Technicians see and claim in-progress requests only for services assigned to them by an admin.
- Technicians return finished work for admin review. Admins mark it **Completed** for the user.
- Rejected requests stay out of the technician queue.

Assign technician service skills in the app under **Admin → Users → Services**. These assignments are stored in MySQL, not in the Docker images.

## Requirements

- Node.js 20 or later
- MySQL 8
- npm

## Run Locally

Create the backend environment file and configure the database connection and JWT secret:

```bash
cp backend/.env.example backend/.env
```

Then install dependencies and start the backend:

```bash
cd backend
npm install
npx prisma migrate deploy
npm run seed
npm run dev
```

The backend runs on port `5001` when `PORT=5001` is set in `backend/.env`.

In another terminal, install and start the frontend:

```bash
cd frontend
npm install
npm run dev
```

Open <http://localhost:5173>. Vite proxies API and upload requests to `http://localhost:5001`.

The seed script creates these demo accounts on a fresh database:

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@nexora.io` | `Admin@123` |
| Technician | `tech@nexora.io` | `Tech@123` |
| User | `user@nexora.io` | `User@123` |

The seed uses upserts that do not overwrite existing accounts, so these passwords may not apply if they were previously changed.

## Checks

```bash
cd frontend
npm run typecheck
npm run build

cd ../backend
npx prisma validate
```

## Build and Push Docker Images

Log in to Docker Hub, then build and push both images. These commands use the current `v2` tags:

```bash
docker login

docker build -t osamaahmed123456/nexora-back:v2 ./backend
docker build -t osamaahmed123456/nexora-front:v2 ./frontend

docker push osamaahmed123456/nexora-back:v2
docker push osamaahmed123456/nexora-front:v2
```

The backend container runs Prisma schema synchronization and the seed script at startup. Keep database credentials in Kubernetes Secrets; do not put secrets in this README or container image.

## Update Kubernetes Deployments

Ensure `kubectl` is configured for the intended cluster and the `nexora` namespace and supporting database, services, secrets, and ConfigMap are already set up. Then update the app deployments:

```bash
kubectl set image deployment/mydeploy-back \
  my-image=osamaahmed123456/nexora-back:v2 -n nexora

kubectl set image deployment/mydeploy-front \
  my-image=osamaahmed123456/nexora-front:v2 -n nexora

kubectl rollout status deployment/mydeploy-back -n nexora
kubectl rollout status deployment/mydeploy-front -n nexora
kubectl get pods -n nexora
```

Changing or pushing an image does not deploy it automatically. Apply the `v2` service images by running the rollout commands above.
