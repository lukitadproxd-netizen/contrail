# Common Use Cases

Contrail's first release is for explicit project instructions that a coding
agent must follow and that may later change.

## Testing conventions

`project.testing.framework` can evolve from Node's test runner to Vitest. The
agent follows Vitest and can show the correction that replaced the former rule.

## Package-manager decisions

`project.dependencies.package_manager` can move from npm to pnpm after a
maintainer decision. An agent can explain why it should not add a lockfile for
the former package manager.

## API conventions

`project.api.error_format` can change from ad hoc error responses to RFC 9457
problem details. The newer instruction remains current while the earlier
convention stays reviewable.

## Deployment policy

`project.deployment.preview_environment` can change from manual previews to a
particular CI workflow. An agent can distinguish a current release policy from
an old runbook entry.

## Architecture corrections

`project.architecture.data_access` can change after a design review. The coding
agent can apply the newer decision while exposing the previous approach and its
replacement time.

These are not generic notes or inferred user preferences. They are scoped,
explicit project decisions with a linear correction history. Contrail does not
yet reconcile competing active policies; keep each first-release trajectory to
one clear current head.
