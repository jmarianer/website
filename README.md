# My websites and experimenting with a monorepo

Each subdirectory corresponds to a different website:

- `website` – [My website](https://joeym.org), including a [portfolio](https://joeym.org/portfolio/index.html) (Jekyll, not part of the pnpm workspace)
- `boobtree` – [Pass the Pic](https://passthepic.com) / [boobtree.com](https://boobtree.com)
- `combinators` – [Untitled combinators game](https://combinators.joeym.org)
- `crosswords` – [Crosswords app](https://crosswords.joeym.org)
- `knight-spiral` – [knight-spiral.joeym.org](https://knight-spiral.joeym.org)
- `lok-solver` – [lok-solver.joeym.org](https://lok-solver.joeym.org)
- `quickerpass` – [Something I'm trying for blood donations](https://quickerpass.joeym.org)
- `wordsearch` – [wordsearch.joeym.org](https://wordsearch.joeym.org)

## Install

From the repo root, `pnpm install` sets up every project except `website`, which
is a separate Ruby/Jekyll site:

    cd website
    gem install bundler
    bundle install

## Serve locally

| project       | command                          |
| ------------- | --------------------------------- |
| website       | `cd website && bundle exec jekyll serve` |
| boobtree      | `cd boobtree && pnpm dev`         |
| combinators   | `cd combinators && pnpm start`    |
| crosswords    | `cd crosswords && pnpm start`     |
| knight-spiral | `cd knight-spiral && pnpm start`  |
| lok-solver    | `cd lok-solver && pnpm start`     |
| quickerpass   | `cd quickerpass && pnpm dev`      |
| wordsearch    | `cd wordsearch && pnpm start`     |

boobtree builds two brands from one codebase and can serve them separately:
`pnpm dev-boobtree` / `pnpm dev-passthepic`. Add `-- --host 192.xxx.xxx.xxx` to
any dev/start command to serve on the local network.

## Other workspace commands

Run from the repo root, these fan out across every pnpm workspace project:

- `pnpm build` – build everything
- `pnpm lint` – lint everything
- `pnpm test` – run tests where defined
- `pnpm check` – run svelte-check where defined

## Deploy

`scripts/deploy.sh` builds and deploys to GCS, then invalidates the shared CDN
cache (see `terraform/gcp.tf`). With no arguments it deploys everything; pass
one or more project names to deploy only those:

    scripts/deploy.sh                        # deploy everything
    scripts/deploy.sh boobtree                # deploy just boobtree
    scripts/deploy.sh wordsearch lok-solver   # deploy a couple
