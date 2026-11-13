#!/usr/bin/env bash
# Labels y milestones se cambian por PR en .github/project.json, nunca a mano en la UI.
set -euo pipefail

f=.github/project.json
repo="$GITHUB_REPOSITORY"

jq -c '.labels[]' "$f" | while read -r l; do
  gh label create "$(jq -r .name <<<"$l")" -R "$repo" --force \
    --color "$(jq -r .color <<<"$l")" --description "$(jq -r .description <<<"$l")"
done

# Una label fuera del archivo se borra: el archivo es la única fuente.
gh label list -R "$repo" --limit 500 --json name --jq '.[].name' | while read -r name; do
  if ! jq -e --arg n "$name" 'any(.labels[]; .name == $n)' "$f" >/dev/null; then
    gh label delete "$name" -R "$repo" --yes
  fi
done

# Milestones se identifican por título: renombrar crea uno nuevo.
existing=$(gh api "repos/$repo/milestones?state=all&per_page=100")
jq -c '.milestones[]' "$f" | while read -r m; do
  title=$(jq -r .title <<<"$m")
  desc=$(jq -r .description <<<"$m")
  num=$(jq -r --arg t "$title" '.[] | select(.title == $t) | .number' <<<"$existing")
  if [[ -n "$num" ]]; then
    gh api -X PATCH "repos/$repo/milestones/$num" -f description="$desc" >/dev/null
  else
    gh api -X POST "repos/$repo/milestones" -f title="$title" -f description="$desc" >/dev/null
  fi
done
