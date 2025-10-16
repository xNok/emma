# Publishing Pipeline with Changesets

This document summarizes the work done to implement a publishing pipeline using Changesets.

## Changes Made

- **Initialized Changesets:** Added the `@changesets/cli` package and ran `yarn changeset init` to create the `.changeset` directory and initial configuration.
- **Configured for GitHub Packages:** Modified `.changeset/config.json` to set the `access` to `public` for publishing to GitHub Packages.
- **Updated Package Names:** Renamed all packages to be scoped under `@xnok` (e.g., `@xnok/emma-form-builder`).
- **Added Publish Configuration:** Added the `publishConfig` to each package's `package.json` to point to the GitHub Packages registry.
- **Added Release Scripts:** Added `version` and `release` scripts to the root `package.json` to streamline the versioning and publishing process.

## Next Steps

The project is now set up to use Changesets for versioning and publishing to GitHub Packages. When a new release is needed, the following steps should be followed:

1. Run `yarn changeset` to create a new changeset file.
2. Commit the changeset file.
3. Run `yarn version` to bump the versions of the packages and create a new git tag.
4. Run `yarn release` to publish the packages to GitHub Packages.