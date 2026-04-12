#!/bin/bash
VERSIONS=("v1.28.2-superadmin-panel-restore-apply" \
          "v1.28.2-superadmin-panel-restore-final" \
          "v1.28.2-superadmin-panel-restore-connect-frontend" \
          "v1.28.3-superadmin-panel-descriptions-modules")

for TAG in "${VERSIONS[@]}"; do
  if git ls-remote --tags origin | grep -q "$TAG"; then
    echo "✅ Tag $TAG subido correctamente a main."
  else
    echo "❌ Tag $TAG no se encuentra en remoto."
    exit 1
  fi
done
