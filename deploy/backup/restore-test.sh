#!/usr/bin/env bash
# Prueba de restauración: restaura el último respaldo en una Mongo aislada y compara conteos con el origen.
# Env: MONGO_URI (origen, solo lectura), RESTORE_URI (Mongo efímera, se sobrescribe), AGE_IDENTITY_FILE, BACKUP_DEST.
set -euo pipefail
source "$(dirname "$0")/lib.sh"
alert_on_failure restore-test
need MONGO_URI RESTORE_URI AGE_IDENTITY_FILE BACKUP_DEST

MONGO_URI="$RESTORE_URI" "$(dirname "$0")/restore.sh"
diff <(counts "$MONGO_URI") <(counts "$RESTORE_URI") \
  || { echo "Conteos distintos entre origen y restauración" >&2; exit 1; }
echo "Conteos iguales:"; counts "$RESTORE_URI"
