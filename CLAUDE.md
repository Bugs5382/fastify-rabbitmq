# CLAUDE.md - fastify-rabbitmq

Working agreement for this repository. It was scaffolded from `Bugs5382/project-template`;
the governance below is shared across all repos created that way.

## Enforced by hooks (run `bash .claude/hooks/install.sh` once per clone)

- Conventional Commits on commits, issue titles, and PR titles.
- No AI tells in commits/issues/PRs/comments/source; no emoji in source or commit messages (emoji
  are allowed in Markdown docs and CI workflow files).
- Pre-push: the ecosystem's format/lint/test gate must pass (Go: gofmt/vet/golangci-lint/test;
  npm: lint/test scripts; Python: ruff/pytest).

## Conventions

- Branching: never commit to `main`. Work on a feature/working branch; open a PR.
- Commits: Conventional Commits (`type(scope): description`). The operator (@Bugs5382) is the
  author of record on every commit.
- Voice: human-authored. No attribution trailers (`Co-Authored-By`, `Generated with`), no robot
  glyphs/emoji, no session framing.
- Local design notes live in a non-tracked `plan/` folder; delete a note when its work is done.

## CI and Actions minutes

GitHub bills every job for at least one full minute, and a private org's included minutes run out
fast during a wave of PRs. The shipped workflows are shaped around that:

- **Drafts run nothing.** PR workflows skip draft PRs and run on `ready_for_review`, `opened`,
  `synchronize` and `reopened`. Open a PR as a draft, run the full checks locally, push once they
  pass, and mark it ready when the work is finished. That starts one CI run. After it is ready,
  push only real fixes, batched into one push.
- **One job for the small checks.** PR Title, PR Body, PR Hygiene and the gitleaks secret scan are
  steps of one `✅ PR Checks` job (`job-pr-checks.yaml`). Every step runs even when an earlier one
  fails, so the log shows every failure. This job and the label checker are the only workflows
  that react to `edited`: a title or body fix reruns them, not the build.
- **Pull requests only.** Test (lint, tests, build, package check), GoLic and the licence check
  run on pull requests, not on push to `main`. The squash merge lands the tree the PR run already
  tested. Only the release workflows run on `main` or a release: Release Manager
  (`job-version-bump.yaml`, on push to `main`), and Release and Publish (`action-deploy.yaml`, on a
  published release), which reruns Test, publishes to npm and calls Publish Docs
  (`action-docs.yaml`).
- **Keep the PR run honest:** the PR run covers the merged code only when the branch is up to date
  with `main` before it merges. In the branch ruleset, add **Require status checks to pass** with
  the repo's check names and turn on **Require branches to be up to date before merging** (API:
  the `required_status_checks` rule with `strict_required_status_checks_policy: true`; classic
  branch protection: `required_status_checks.strict: true`). The setting only exists alongside
  required checks. Use GitHub's "Update branch" when a PR falls behind.
- **No no-op jobs.** The licence check ships per ecosystem. This repo has a root `package.json` and
  no `go.mod`, so it carries only `job-license-check-npm.yaml`.
- **Every job has a `timeout-minutes`** (10 for small checks, 15 to 30 for builds, scans and
  releases), so a hung job stops long before GitHub's 360-minute default. Jobs that call a reusable
  workflow (`uses:`) cannot take one; the called workflow's jobs carry it.
- **Required checks:** if the ruleset or branch protection lists required checks, use the job
  names: `✅ PR Checks` replaces `PR Title`, `PR Body`, `PR Hygiene` and `Gitleaks (secret scan)`.


## Workflow

Issue (from a template; free-form issues are disabled) -> for sequential / multi-step work, a parent
issue with ordered **sub-issues** -> put it on the active **milestone** -> branch
`<type>/<issue#>-<slug>` -> code (comments cite the issue) -> PR with a Conventional Commit title
(the autolabeler sets the category label from the title), the template body, and a **closing
summary** before merge -> **squash** merge. The operator (@Bugs5382) is the assignee.

On merge, release-drafter drafts the next notes by label and `CHANGELOG.md` updates on `main` via the
changelog action -- **nothing tags automatically**. When the first push to main resolves the version,
rename the milestone to that version. The maintainer then **manually publishes the GitHub Release**,
which creates the tag with the finalized changelog (and triggers the publish where the repo ships a
package).

Keep public artifacts (issues, PRs, commit messages) free of references to local-only design notes.

## Releasing

On every push to `main` the **Release Manager** workflow (`.github/workflows/job-version-bump.yaml`)
runs: release-drafter anticipates the next version, the manifest version is bumped (package
ecosystems only), `CHANGELOG.md` is updated via the changelog action, and a
`chore(pre-release): vX [skip ci]` commit is pushed back to `main`. **Nothing tags automatically.**
The maintainer then publishes the GitHub Release by hand, which creates the `vX.Y.Z` tag with the
finalized changelog and triggers the publish workflow where the repo ships a package.

The Release Manager pushes to `main` through the release GitHub App, which the branch ruleset
(`governance/rulesets/branch-default.json`) lists as a bypass actor — without that bypass the
`[skip ci]` commit would be rejected by the PR-required rule.

**GitHub Action repos release differently** — a composite/JS action has no package manifest and is
**not** published to a registry. The maintainer manually tags `vX.Y.Z`, publishes the GitHub
Release, and repoints the floating major tag `@vN` (e.g. `git tag -fa v1 -m "v1 -> v1.2.3" v1.2.3 &&
git push origin v1 --force`) so consumers pinned to `owner/repo@vN` pick up the release; publishing
to the GitHub Marketplace is an optional manual step. The **first release is `v1.0.0` by hand** —
release-drafter would otherwise draft `v0.1.0` on the first run. See `ecosystems/action/README.md`
for the full action-release sequence.
