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

# 4. Commits sin trailers.
if [ -n "$(git log --format='%(trailers:only)' "$BASE_SHA..$HEAD_SHA" | tr -d '[:space:]')" ]; then
  err "Hay commits con trailers. Reescribe los mensajes sin ellos."
fi

# 5. Solo código en el repo: la documentación vive en la wiki.
docs=$(git diff --name-only --diff-filter=A "$BASE_SHA...$HEAD_SHA" \
  | grep -iE '\.(md|mdx|pdf|docx?|pptx?|xlsx?|odt)$' \
  | grep -vE '^(README\.md|\.github/.*)$' || true)
[ -z "$docs" ] || err "Documentos no permitidos (van a la wiki): $docs"

exit "$fail"
