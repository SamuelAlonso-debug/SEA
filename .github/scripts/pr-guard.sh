#!/usr/bin/env bash
# Reglas de compliance para PRs. Requiere: BASE_SHA, HEAD_SHA, PR_TITLE, PR_BODY, PR_AUTHOR.
set -euo pipefail

MAX_LINES=550
fail=0
err() { echo "::error::$1"; fail=1; }

# 1. Tamaño: adiciones + borrados, sin lockfiles ni binarios.
lines=$(git diff --numstat "$BASE_SHA...$HEAD_SHA" -- . ':(exclude)**/package-lock.json' \
  | awk '$1 != "-" { total += $1 + $2 } END { print total + 0 }')
echo "Líneas cambiadas: $lines / $MAX_LINES"
[ "$lines" -le "$MAX_LINES" ] || err "PR de $lines líneas. Máximo $MAX_LINES: divide el trabajo."

# Dependabot: solo aplica el límite de tamaño (título, issue y commits los genera el bot).
if [ "$PR_AUTHOR" = "dependabot[bot]" ]; then exit "$fail"; fi

# 2. Título en Conventional Commits.
title_re='^(feat|fix|refactor|perf|test|docs|build|ci|chore|revert)(\([a-z0-9-]+\))?!?: .{3,72}$'
[[ "$PR_TITLE" =~ $title_re ]] || err "Título inválido. Formato: tipo(scope): resumen"

# 3. Toda PR enlaza una issue.
grep -qiE '(closes|fixes|resolves|refs) #[0-9]+' <<<"$PR_BODY" || err "Falta 'Closes #N' en la descripción."

# 4. La PR responde a su issue: todos los criterios cumplidos y dudas/hallazgos declarados.
# Sin comentarios HTML ni CR: la ayuda de la plantilla no cuenta como contenido.
body=$(tr -d '\r' <<<"$PR_BODY" | perl -0pe 's/<!--.*?-->//gs')
section() { awk -v h="## $1" '$0 == h { f = 1; next } /^## / { f = 0 } f' <<<"$body"; }

if ! grep -qx '## Criterios de aceptación' <<<"$body"; then
  err "Falta la sección '## Criterios de aceptación'."
else
  criteria=$(section "Criterios de aceptación")
  total=$(grep -cE '^\s*- \[[ xX]\]' <<<"$criteria" || true)
  pending=$(grep -cE '^\s*- \[ \]' <<<"$criteria" || true)
  [ "$total" -gt 0 ] || err "'Criterios de aceptación' sin casillas: copia los criterios de la issue."
  [ "$pending" -eq 0 ] || err "Criterios sin cumplir: $pending. Marca cada uno con su evidencia o deja la PR en borrador."
fi

# Las líneas guía de la plantilla sin rellenar cuentan como vacío.
answers=$(section "Dudas y hallazgos" | { grep -vxE -e '- (Duda: → Resolución:|Hallazgo: → #)' || true; } | tr -d '[:space:]')
[ -n "$answers" ] || err "'Dudas y hallazgos' vacío: responde las dudas de la issue o escribe 'Ninguno'."

# 5. Commits sin trailers.
if [ -n "$(git log --format='%(trailers:only)' "$BASE_SHA..$HEAD_SHA" | tr -d '[:space:]')" ]; then
  err "Hay commits con trailers. Reescribe los mensajes sin ellos."
fi

# 6. Solo código en el repo: la documentación vive en la wiki.
docs=$(git diff --name-only --diff-filter=A "$BASE_SHA...$HEAD_SHA" \
  | grep -iE '\.(md|mdx|pdf|docx?|pptx?|xlsx?|odt)$' \
  | grep -vE '^(README\.md|\.github/.*)$' || true)
[ -z "$docs" ] || err "Documentos no permitidos (van a la wiki): $docs"

exit "$fail"
