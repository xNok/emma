# BUILT_IN_PROVIDERS Moved to Shared Package

## Summary

Successfully moved the `BUILT_IN_PROVIDERS` constant from the form-builder package to the shared package to improve architectural consistency and make provider information accessible across the entire Emma system.

## Changes Made

### Shared Package Updates

- **Added `BUILT_IN_PROVIDERS` constant** to `shared/types/index.ts` with comprehensive documentation
- **Updated `shared/index.ts`** to export the `BUILT_IN_PROVIDERS` constant
- **Built shared package** to make the constant available in the distribution

### Form-Builder Package Updates

- **Removed local `BUILT_IN_PROVIDERS` definition** from `packages/form-builder/src/deployment/index.ts`
- **Added import** of `BUILT_IN_PROVIDERS` from `@xnok/emma-shared`
- **Updated test imports** in `providers.test.ts` to import from shared package
- **Applied code formatting** to maintain consistent style

## Benefits

- **Better Architecture**: Provider constants are now in a shared location accessible to all packages
- **Consistency**: Any part of the system can now reference built-in providers without depending on form-builder
- **Maintainability**: Single source of truth for built-in provider definitions
- **Extensibility**: Easier to add new built-in providers from any package

## Validation

- All provider tests pass (7/7)
- No breaking changes to existing functionality
- Code formatting applied and linting issues resolved
