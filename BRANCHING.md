# Branching Strategy

## Branch Roles

- `main`
  - Baseline branch.
  - Keep it stable and close to the default remote state.
  - Do not use it as the daily integration branch.

- `develop`
  - Active development integration branch.
  - Feature work merges here first.
  - Development and pre-release validation happen here.

- `production`
  - Release branch for deployable code only.
  - Only merge approved release code here.
  - Keep it clean and easy to compare against the live environment.

## Daily Workflow

1. Start new work from `develop`
   - `git checkout develop`
   - `git pull`
   - `git checkout -b feature/<name>`

2. Build and verify on the feature branch

3. Merge feature work back into `develop`

4. Promote a tested release from `develop` to `production`

## Hotfix Workflow

If production needs a direct fix:

1. Branch from `production`
   - `git checkout production`
   - `git checkout -b hotfix/<name>`

2. Fix and validate

3. Merge the hotfix into both:
   - `production`
   - `develop`

This avoids losing production-only fixes in later releases.

## Environment Mapping

- `develop`
  - Local development
  - Integration testing
  - Pre-release verification

- `production`
  - Server deployment
  - Production configuration

## Guardrails

- Do not commit secrets.
- Keep local-only tooling and generated files in `.gitignore`.
- Do not do feature development directly on `production`.
- Keep deployment and environment changes validated on `develop` before promoting.
