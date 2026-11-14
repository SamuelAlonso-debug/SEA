# SEA

Sistema administrativo web: inventario, ventas, gastos, clientes y KPIs.

- `apps/api/`: API REST. Node.js, Express, TypeScript, Prisma, MongoDB.
- `apps/web/`: Next.js, React, Tailwind.

## Requisitos
- Node.js 22 (`.nvmrc`)
- MongoDB en replica set (Prisma lo exige para transacciones). Atlas sirve.

## Arranque local

```bash
# apps/api/.env
DATABASE_URL="mongodb+srv://usuario:password@cluster.mongodb.net/sea"
JWT_SECRET="cadena-larga-aleatoria"
PORT=4000
CORS_ORIGIN="http://localhost:3000"
BUSINESS_TIMEZONE="America/Mexico_City"  # IANA; día y mes de los KPIs
```

```bash
# apps/web/.env.local
NEXT_PUBLIC_API_URL="http://localhost:4000/api"
```

```bash
cd apps/api && npm ci && npx prisma db push && npm run dev  # http://localhost:4000
cd apps/web && npm ci && npm run dev                       # http://localhost:3000
```

## Docker

```bash
docker build -t sea-api apps/api
docker build -t sea-web --build-arg NEXT_PUBLIC_API_URL=http://localhost:4000/api apps/web
```

Imágenes publicadas por release: `ghcr.io/samuelalonso-debug/sea-api`, `ghcr.io/samuelalonso-debug/sea-web`.

## Contribuir
Issue primero, PR después. Reglas, plantillas, estrategia de tests y seguridad: [wiki](https://github.com/SamuelAlonso-debug/SEA/wiki/How-to-Contribute).
