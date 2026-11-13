# SEA: reglas de desarrollo

Monorepo: `backend/` (Express 5 + Prisma + MongoDB), `frontend/` (Next.js 16 + React 19).
Detalle de flujo, tests y seguridad: wiki del repo.

## Estilo de redacción
- Corto y directo. Sin relleno, sin cortesías, sin repetir lo obvio.
- Aplica a issues, PRs, commits, comentarios de código y wiki.
- Código, comandos y errores: exactos, nunca resumidos.

## Principios de código
- Escribe solo el código que la tarea necesita.
- Antes de crear algo: reusa código existente, luego stdlib/APIs nativas, luego dependencia ya instalada. Dependencia nueva solo con justificación en la PR.
- Sin abstracciones especulativas: una interfaz, helper o capa nace con su segundo uso real.
- Sin código muerto ni comentado. Si sobra, se borra.
- Comentarios explican el porqué, no el qué. Al cambiar código, actualiza o borra su comentario.
- TypeScript estricto. Sin `any` salvo en fronteras externas, tipado de inmediato.

## Repositorio
- Solo código. Permitidos como texto: `README.md` (lo mínimo para arrancar), `CLAUDE.md`, `.github/`.
- Documentación del desarrollo: wiki, issues y PRs. Nunca archivos de docs en el repo.

## Flujo
1. Issue primero, con plantilla completa: contexto, objetivo, alcance (incluye/excluye), criterios de aceptación verificables, criticidad, riesgos.
   Solo para problemas o cambios del repositorio. Configuración en plataformas externas (Settings de GitHub, cloud, cuentas) no lleva issue.
2. Rama desde `master`: `tipo/descripcion-corta` (`feat/`, `fix/`, `chore/`, `refactor/`, `docs/`, `ci/`).
3. Commits en Conventional Commits, en inglés, sin trailers.
4. PR con la plantilla. Título `tipo(scope): resumen`. Cuerpo con `Closes #N`.
5. Merge: squash, solo con pipeline verde y autorización explícita del owner. Nunca merge propio sin esa autorización.

## Límites de PR
- Máximo 550 líneas cambiadas (adiciones + borrados, sin lockfiles). Lo valida `PR guard`.
- Una issue por PR. Si no cabe, divide la issue en sub-issues.
- PR que no pasa toda la pipeline no se acepta. Nunca se salta, desactiva ni silencia un check o test para ponerla en verde.

## Tests
Se escriben según criticidad, no por cobertura.

| Criticidad | Ejemplos | Exigido |
|---|---|---|
| Baja | estilos, textos, config | nada |
| Media | CRUD simple, UI con estado | integración si cambia contrato de endpoint |
| Alta | lógica de negocio, cálculos, validación | unit + integración del endpoint |
| Crítica | dinero, stock, auth, permisos, datos personales | unit + integración + E2E si toca un flujo crítico |

- Unit: lógica pura y servicios con reglas. No CRUD pass-through ni getters.
- Integración: HTTP real contra `app` (Supertest): validación, auth, códigos de estado, contrato.
- E2E (Playwright): solo flujos críticos: login, registrar venta, alta de producto.
- Bug con criticidad Media o superior: test de regresión que falla antes del fix.
- Prueba comportamiento, no implementación. Sin snapshots. No mockees lo que pruebas.

Ubicación y scripts (la CI los ejecuta si existen):
- `backend/src/**/*.test.ts` → `npm run test:unit` (Vitest)
- `backend/test/integration/**/*.test.ts` → `npm run test:integration` (Vitest + Supertest)
- `frontend/e2e/**/*.spec.ts` → `npm run test:e2e` (Playwright)

## Endpoints
Toda ruta nueva o modificada cumple:
- `authMiddleware` salvo ruta pública justificada en la PR.
- Body, params y query validados con Zod. IDs validados como ObjectId.
- Códigos: 400 validación, 401 sin sesión, 403 sin permiso, 404 no existe, 409 conflicto, 500 inesperado.
- Errores al cliente sin mensajes internos (Prisma, stack). Detalle solo en logs.
- Respuestas con DTO explícito. Nunca `password` ni hashes.
- Listados paginados con `pageSize` máximo.
- Operaciones de dinero o stock: transacción y actualización atómica.
- Secretos solo por variables de entorno. Sin valores por defecto para secretos.

## Pipeline
`CI` en cada PR y push a `master`: PR guard, backend (build, tests, audit), frontend (lint, build, tests, audit), Docker build, E2E, gitleaks, dependency review. `CodeQL` aparte.
Release: tag `vX.Y.Z` → CI completa → imágenes en GHCR → GitHub Release.

## Comandos
```bash
cd backend && npm ci && npm run dev     # API en :4000
cd frontend && npm ci && npm run dev    # web en :3000
cd frontend && npm run lint && npm run build
cd backend && npm run build
```
