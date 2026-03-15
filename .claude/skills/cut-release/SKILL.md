---
name: cut-release
description: >
  Cut a new release: bump version in package.json, commit, tag, and push to GitHub with a release. Trigger this skill whenever the user says "cut a release", "cut release", or uses /cut-release.
---

# Cut Release

A structured workflow for publishing a new versioned release.

## Trigger phrases

- `/cut-release`
- `cut a release`
- `cut release`

---

## Workflow

1. Read `package.json` to get the current version.
2. Ask the user which version bump to apply: **patch** (0.1.0 → 0.1.1), **minor** (0.1.0 → 0.2.0), or **major** (0.1.0 → 1.0.0). If the user already specified the bump type or exact version in their message, skip asking.
3. Compute the new version string.
4. Edit `package.json`, updating only the `"version"` field to the new version.
5. Run `npm run build` to confirm no TypeScript errors before tagging.
6. Commit the change:
   ```
   chore: release vX.X.X
   ```
   No "Co-Authored-By" line for release commits.
7. Create an annotated git tag: `git tag -a vX.X.X -m "Release vX.X.X"`
8. Push the commit and the tag: `git push && git push --tags`
9. Report to the user that the GitHub Actions release workflow has been triggered and will build and attach the tarball. Provide the Actions URL: `https://github.com/$(gh repo view --json nameWithOwner -q .nameWithOwner)/actions`
