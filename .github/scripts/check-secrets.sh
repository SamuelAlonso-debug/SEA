#!/usr/bin/env bash
# Un secreto que llega a git queda en el historial: se bloquea antes del merge.
# gitleaks detecta llaves age, pero no valores en claro en un .env.
set -euo pipefail

fail=0
err() { echo "::error file=$1::$2"; fail=1; }

while IFS= read -r f; do
  if [[ "$f" != secrets/* ]]; then
    err "$f" ".env versionado fuera de secrets/"
    continue
  fi
  if [[ ! "$f" =~ ^secrets/(dev|staging|prod)\.env$ ]]; then
    err "$f" "solo se permiten secrets/{dev,staging,prod}.env"
    continue
  fi
  if ! grep -q '^sops_mac=ENC\[AES256_GCM,' "$f"; then
    err "$f" "no está cifrado con SOPS"
    continue
  fi
  # sops_* es metadata de SOPS; toda otra variable debe ir cifrada.
  if grep -vE '^(#.*|sops_[a-z0-9_]+=.*|[A-Za-z_][A-Za-z0-9_]*=ENC\[AES256_GCM,.*)?$' "$f" | grep -q .; then
    err "$f" "contiene valores en claro"
  fi
done < <(git ls-files | grep -E '(^|/)\.env(\.[^/]*)?$|\.env$|^secrets/' || true)

exit "$fail"
