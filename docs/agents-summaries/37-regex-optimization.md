# Regex Optimization in Validators

**Date:** 2024-05-23
**Agent:** Jules
**Task:** Optimize regex recompilation in validation loop

## Accomplishments

*   **Identified Performance Bottleneck:** Confirmed that `shared/schema/validators.ts` was recompiling `RegExp` objects on every validation call for custom patterns.
*   **Established Baseline:** Created a benchmark that showed 1,000,000 iterations took ~1386ms.
*   **Implemented Optimization:** Added a module-level `REGEX_CACHE` to cache compiled regexes.
*   **Verified Improvement:** Reduced execution time to ~1033ms (25% faster) for the same workload.
*   **Ensured Correctness:** Added `shared/schema/validators.test.ts` to verify that caching does not affect validation logic.

## Technical Details

### Optimization
The `validateFieldValue` function now checks a `REGEX_CACHE` object before creating a new `RegExp`.

```typescript
const REGEX_CACHE: Record<string, RegExp> = {};

// ...

if (rules.pattern in REGEX_CACHE) {
  regex = REGEX_CACHE[rules.pattern];
} else {
  regex = new RegExp(rules.pattern);
  REGEX_CACHE[rules.pattern] = regex;
}
```

### Testing
*   Added `shared/schema/validators.test.ts` using `vitest`.
*   Verified that `yarn vitest run shared/schema/validators.test.ts` passes.
