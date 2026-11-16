# Utilidades comunes. Se carga con `source`.

# Variable obligatoria: falla con un mensaje claro en vez de un error críptico más adelante.
need() { for v in "$@"; do [ -n "${!v:-}" ] || { echo "Falta la variable $v" >&2; exit 2; }; done; }

# Cualquier salida con error avisa al owner. El webhook es opcional y recibe {"text": ...}
# (compatible con Slack, Mattermost y Discord vía /slack); el Job de Kubernetes queda en error igualmente.
alert_on_failure() {
  local name="$1"
  trap 'rc=$?; [ $rc -eq 0 ] || notify "SEA: falló '"$name"' (código $rc)"' EXIT
}
notify() {
  echo "$1" >&2
  [ -z "${ALERT_WEBHOOK_URL:-}" ] || curl -fsS -m 10 -X POST -H 'Content-Type: application/json' \
    -d "{\"text\":\"$1\"}" "$ALERT_WEBHOOK_URL" >/dev/null || true
}

# Conteo "colección=n" ordenado, para comparar dos bases.
counts() {
  mongosh "$1" --quiet --eval 'db.getCollectionNames().sort().forEach(c => print(c + "=" + db.getCollection(c).countDocuments()))'
}

# mongorestore con --archive rechaza una base en la URI: el archivo ya trae los namespaces completos.
without_db() { sed -E 's#^(mongodb(\+srv)?://[^/?]+)/[^?]*#\1/#' <<<"$1"; }
