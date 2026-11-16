#!/usr/bin/env bash
# Restauración: almacenamiento -> age -> mongorestore (--drop: reemplaza lo existente). Imprime el tiempo total.
# Env: MONGO_URI (destino), AGE_IDENTITY_FILE (llave privada), BACKUP_DEST. Arg opcional: objeto (por defecto el último diario).
set -euo pipefail
source "$(dirname "$0")/lib.sh"
alert_on_failure restore
need MONGO_URI AGE_IDENTITY_FILE BACKUP_DEST

obj="${1:-daily/$(rclone lsf "$BACKUP_DEST/daily" | sort | tail -n 1)}"
[ "$obj" != "daily/" ] || { echo "No hay respaldos en $BACKUP_DEST/daily" >&2; exit 1; }

SECONDS=0
rclone cat "$BACKUP_DEST/$obj" \
  | age -d -i "$AGE_IDENTITY_FILE" \
  | mongorestore --uri="$(without_db "$MONGO_URI")" --archive --gzip --drop --quiet
echo "Restaurado $obj en ${SECONDS}s"
