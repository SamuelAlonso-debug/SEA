## Issue
Closes #

## Qué cambia y por qué
<!-- 1-3 líneas. Sin relleno. -->

## Criterios de aceptación
<!-- Copia TODOS los criterios de la issue. Marca cada uno y añade su evidencia: test, comando con salida o captura.
     Un criterio sin marcar hace fallar PR guard: cúmplelo o deja la PR en borrador. -->
- [ ] criterio → evidencia

## Contrato y errores
<!-- Códigos, `path` y `message` reales, verificados contra la tabla de la issue. Diferencias, explicadas.
     "No aplica" si la issue no tiene contrato. -->

## Alcance
- [ ] Solo cambia lo listado en **Toca** de la issue. Desvíos y motivo:
- [ ] Nada de **Excluye** entra en esta PR.

## Dudas y hallazgos
<!-- Obligatorio. Cada duda abierta de la issue con su resolución y quién decidió.
     Hallazgos nuevos al implementar → issue nueva enlazada, no se arreglan aquí.
     "Ninguno" si no hay. -->
- Duda: → Resolución:
- Hallazgo: → #

## Criticidad
<!-- Baja | Media | Alta | Crítica (igual que la issue) -->

## Tests
<!-- Exigidos por criticidad: wiki → Testing-Strategy. Marca solo los que aplican. -->
- [ ] Unit:
- [ ] Integración:
- [ ] E2E:
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
