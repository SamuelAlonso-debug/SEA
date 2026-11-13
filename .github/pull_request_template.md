## Issue
Closes #

## Qué cambia y por qué
<!-- 1-3 líneas. Sin relleno. -->

## Criticidad
<!-- Baja | Media | Alta | Crítica (igual que la issue) -->

## Tests
<!-- Exigidos por criticidad: wiki → Testing-Strategy. Marca solo los que aplican. -->
- [ ] Unit
- [ ] Integración
- [ ] E2E
- [ ] No aplica. Motivo:

## Sanidad del código
- [ ] Una issue, un propósito. ≤ 550 líneas (sin lockfiles)
- [ ] Sin código muerto, comentado ni abstracciones sin segundo uso
- [ ] Reusa código existente, stdlib o nativo antes de añadir dependencias
- [ ] Comentarios explican el porqué y siguen vigentes
- [ ] Sin secretos ni datos reales

## Seguridad
<!-- Borra la sección si no toca endpoints, auth, datos ni dependencias. -->
- [ ] Ruta protegida o pública justificada
- [ ] Body, params y query validados con Zod
- [ ] Errores sin detalles internos
- [ ] Respuesta sin campos sensibles

## Evidencias
<!-- Obligatorio si cambia UI o comportamiento visible: capturas o GIF antes/después. Borra si no aplica. -->

## Notas de despliegue
<!-- Variables nuevas, migraciones, pasos manuales. Borra si no aplica. -->
