#!/usr/bin/env bash
# Prueba extremo a extremo con dos Mongo efímeras y un almacenamiento local. Corre dentro de la imagen de respaldo.
# Env: SOURCE_URI (Mongo a sembrar), RESTORE_URI (Mongo vacía), ALERT_URL (webhook de prueba), ALERT_FILE (donde se guarda la alerta).
set -euo pipefail
source "$(dirname "$0")/lib.sh"
need SOURCE_URI RESTORE_URI ALERT_FILE ALERT_URL

work=$(mktemp -d); trap 'rm -rf "$work"' EXIT
age-keygen -o "$work/key.txt" 2>/dev/null
age-keygen -o "$work/other.txt" 2>/dev/null
export AGE_RECIPIENT; AGE_RECIPIENT=$(age-keygen -y "$work/key.txt")
export AGE_IDENTITY_FILE="$work/key.txt" BACKUP_DEST="$work/store" MONGO_URI="$SOURCE_URI"
dir=$(dirname "$0")

mongosh "$SOURCE_URI" --quiet --eval '
  db.Sale.insertMany(Array.from({length: 500}, (_, i) => ({ n: i, total: i * 10 })));
  db.Client.insertMany(Array.from({length: 50}, (_, i) => ({ name: "c" + i })));' >/dev/null

echo "== Retención: 8 días seguidos dejan 7 diarios"
for d in 01 02 03 04 05 06 07 08; do BACKUP_DATE=202611$d "$dir/backup.sh" >/dev/null; done
[ "$(ls "$BACKUP_DEST/daily" | wc -l)" = 7 ] || { echo "Se esperaban 7 diarios"; exit 1; }
ls "$BACKUP_DEST/daily" | grep -q 20261101 && { echo "El diario más antiguo no se borró"; exit 1; }
ls "$BACKUP_DEST/weekly" "$BACKUP_DEST/monthly" >/dev/null

echo "== Cifrado: sin la llave privada no se lee"
f="$BACKUP_DEST/daily/$(ls "$BACKUP_DEST/daily" | tail -n 1)"
! age -d -i "$work/other.txt" "$f" >/dev/null 2>&1 || { echo "Se descifró con otra llave"; exit 1; }
! gzip -t "$f" 2>/dev/null || { echo "El archivo no está cifrado"; exit 1; }

echo "== Borrar Sale y restaurar: el conteo vuelve"
before=$(counts "$SOURCE_URI")
mongosh "$SOURCE_URI" --quiet --eval 'db.Sale.drop()' >/dev/null
"$dir/restore.sh"
[ "$before" = "$(counts "$SOURCE_URI")" ] || { echo "Conteos distintos tras restaurar"; exit 1; }

echo "== Prueba de restauración en Mongo aislada"
RESTORE_URI="$RESTORE_URI" "$dir/restore-test.sh"

echo "== Falla forzada: la alerta llega"
ALERT_WEBHOOK_URL="$ALERT_URL" MONGO_URI="mongodb://127.0.0.1:1/sea?serverSelectionTimeoutMS=1000" \
  "$dir/backup.sh" >/dev/null 2>&1 && { echo "El respaldo debió fallar"; exit 1; }
sleep 1; grep -q "falló backup" "$ALERT_FILE" || { echo "No llegó la alerta"; exit 1; }
echo "OK"
