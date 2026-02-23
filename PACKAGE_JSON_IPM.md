# package.json `ipm` config

The ipm CLI reads optional `ipm` fields from `package.json` to choose language variants when installing.

- **`ipm.language`** – Default language for all dependencies (e.g. `"typescript"`, `"python"`). The registry is asked for that variant (e.g. `GET /registry/array-first?language=typescript`).
- **`ipm.languages`** – Per-package overrides: `{ "package-name": "language" }`. Overrides `ipm.language` for that package.

Example:

```json
{
  "name": "my-app",
  "dependencies": {
    "array-first": "^1.0.0"
  },
  "ipm": {
    "language": "typescript",
    "languages": {
      "array-first": "python"
    }
  }
}
```

Here `array-first` is resolved with `?language=python`; any other dependency would use `typescript`.
