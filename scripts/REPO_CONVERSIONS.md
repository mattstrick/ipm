# repo-conversions.json

Maps monorepos to their build targets and designates a default/source repo for change detection.

## Format

```json
{
  "owner/monorepo": {
    "defaultRepo": "owner/source-repo",
    "defaultLanguage": "javascript",
    "languages": ["javascript", "typescript", "python", ...]
  }
}
```

### Fields

- **defaultRepo** (optional): Canonical source repo to watch for changes. When it changes, other build targets can be updated. If omitted, the monorepo itself is the source.
- **defaultLanguage** (optional): Language of the default repo (e.g. `"javascript"`). Used for subpath when default is inside the monorepo. Default: `"javascript"`.
- **languages** (required): List of build target languages. Each maps to `packages/<lang>` in the monorepo.

### Legacy format (still supported)

```json
{
  "owner/monorepo": ["javascript", "typescript", "python"]
}
```

Treated as `{ languages: [...] }` with no defaultRepo.

## Example

For `mattstrick/array-first`, the original upstream is `jonschlinkert/array-first` (JavaScript). When that repo changes, we can sync updates to the other language ports in the monorepo.

```json
{
  "mattstrick/array-first": {
    "defaultRepo": "jonschlinkert/array-first",
    "defaultLanguage": "javascript",
    "languages": ["assemblyscript", "clojure", "csharp", "elixir", "go", "haskell", "java", "javascript", "kotlin", "php", "python", "ruby", "rust", "swift", "typescript"]
  }
}
```

## Change detection

Use `getDefaultRepo(monorepoName)` to get `{ defaultRepo, defaultLanguage, monorepo }`. Poll or webhook the default repo (e.g. `GET /repos/{owner}/{repo}/commits`) to detect changes, then trigger sync/update of build targets.
