#!/bin/sh
# Build and deploy projects to their GCS buckets, then invalidate the shared
# CDN cache once at the end. Bucket names and url-map come from
# terraform/gcp.tf. With no arguments, deploys everything; otherwise deploys
# only the named projects.
#
# usage: scripts/deploy.sh [project ...]
set -eu

root="$(cd "$(dirname "$0")/.." && pwd)"

deploy_boobtree() {
  cd "$root/boobtree"
  pnpm build
  gcloud storage cp -r dist-boobtree/* gs://boobtree-com
  gcloud storage cp -r dist-passthepic/* gs://passthepic-com
}

deploy_combinators() {
  cd "$root/combinators"
  pnpm build
  gcloud storage cp -r dist/* gs://combinators-joeym-org
}

deploy_crosswords() {
  cd "$root/crosswords"
  pnpm build
  gcloud storage cp -r dist/* gs://crosswords-joeym-org
}

deploy_knight_spiral() {
  cd "$root/knight-spiral"
  pnpm build
  gcloud storage cp -r dist/* gs://knight-spiral-joeym-org
}

deploy_lok_solver() {
  cd "$root/lok-solver"
  pnpm build
  gcloud storage cp -r dist/* gs://lok-solver-joeym-org
}

deploy_quickerpass() {
  cd "$root/quickerpass"
  pnpm build
  gcloud storage cp -r dist/* gs://quickerpass-joeym-org
}

deploy_wordsearch() {
  cd "$root/wordsearch"
  pnpm build
  gcloud storage cp -r dist/* gs://wordsearch-joeym-org
}

deploy_website() {
  cd "$root/website"
  bundle exec jekyll build
  gcloud storage cp -r _site/* gs://joeym-org
}

all_projects="boobtree combinators crosswords knight-spiral lok-solver quickerpass wordsearch website"

if [ $# -eq 0 ]; then
  # shellcheck disable=SC2086
  set -- $all_projects
fi

for project in "$@"; do
  case "$project" in
    boobtree) deploy_boobtree ;;
    combinators) deploy_combinators ;;
    crosswords) deploy_crosswords ;;
    knight-spiral) deploy_knight_spiral ;;
    lok-solver) deploy_lok_solver ;;
    quickerpass) deploy_quickerpass ;;
    wordsearch) deploy_wordsearch ;;
    website) deploy_website ;;
    *)
      echo "unknown project: $project" >&2
      exit 1
      ;;
  esac
done

gcloud compute url-maps invalidate-cdn-cache url-map --path "/*" --async
