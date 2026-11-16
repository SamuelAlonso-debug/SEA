#!/usr/bin/env bash
# Respaldo: mongodump -> age -> almacenamiento (rclone). Nada se escribe en disco local.
# Env: MONGO_URI, AGE_RECIPIENT (llave pública), BACKUP_DEST (remoto rclone o ruta), ALERT_WEBHOOK_URL (opcional),
#      BACKUP_DATE (AAAAMMDD, solo para pruebas).
set -euo pipefail
source "$(dirname "$0")/lib.sh"
need MONGO_URI AGE_RECIPIENT BACKUP_DEST

day="${BACKUP_DATE:-$(date -u +%Y%m%d)}"
name="sea-$day.archive.gz.age"

# Si algo falla a mitad de subida no queda un objeto parcial que parezca válido.
trap 'rc=$?; [ $rc -eq 0 ] || { rclone deletefile "$BACKUP_DEST/daily/$name" 2>/dev/null || true; notify "SEA: falló backup (código $rc)"; }' EXIT

recipients=(); for r in $AGE_RECIPIENT; do recipients+=(-r "$r"); done  # varias llaves públicas separadas por espacio
mongodump --uri="$MONGO_URI" --archive --gzip --quiet \
  | age "${recipients[@]}" \
  | rclone rcat "$BACKUP_DEST/daily/$name"

# Semanal los domingos y mensual el día 1: copias en el propio almacenamiento.
[ "$(date -u -d "$day" +%u)" != 7 ] || rclone copyto "$BACKUP_DEST/daily/$name" "$BACKUP_DEST/weekly/$name"
[ "${day:6:2}" != 01 ] || rclone copyto "$BACKUP_DEST/daily/$name" "$BACKUP_DEST/monthly/$name"

# Retención: 7 diarios, 4 semanales, 12 mensuales (los nombres ordenan por fecha).
prune() {
  rclone lsf "$BACKUP_DEST/$1" 2>/dev/null | sort | head -n "-$2" \
    | while read -r f; do rclone deletefile "$BACKUP_DEST/$1/$f"; done
}
prune daily 7; prune weekly 4; prune monthly 12
echo "Respaldo $name subido a $BACKUP_DEST/daily"
