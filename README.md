# SEA

Sistema administrativo web: inventario, ventas, gastos, clientes y KPIs.

- `backend/`: API REST. Node.js, Express, TypeScript, Prisma, MongoDB.
- `frontend/`: Next.js, React, Tailwind.

## Requisitos
- Node.js 22 (`.nvmrc`)
- MongoDB en replica set (Prisma lo exige para transacciones). Atlas sirve.

## Arranque local

```bash
# backend/.env
DATABASE_URL="mongodb+srv://usuario:password@cluster.mongodb.net/sea"
JWT_SECRET="cadena-larga-aleatoria"
PORT=4000
CORS_ORIGIN="http://localhost:3000"
```

```bash
# frontend/.env.local
NEXT_PUBLIC_API_URL="http://localhost:4000/api"
```

```bash
cd backend && npm ci && npx prisma db push && npm run dev   # http://localhost:4000
cd frontend && npm ci && npm run dev                        # http://localhost:3000
```

## Docker

```bash
docker build -t sea-backend backend
docker build -t sea-frontend --build-arg NEXT_PUBLIC_API_URL=http://localhost:4000/api frontend
```

Imágenes publicadas por release: `ghcr.io/samuelalonso-debug/sea-backend`, `ghcr.io/samuelalonso-debug/sea-frontend`.

## Contribuir
Issue primero, PR después. Reglas, plantillas, estrategia de tests y seguridad: [wiki](https://github.com/SamuelAlonso-debug/SEA/wiki/How-to-Contribute).
