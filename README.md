# lac-showcase-reconstruction

**[lac-showcase](https://github.com/majeanson/lac-showcase) rebuilt entirely from its own `feature.json` files.**

No source code was used as input. The only artifacts were the `feature.json` files produced by Life-as-Code during the original build — carrying problem statements, decisions, implementation notes, code snippets, and public interfaces.

Live demo: **https://lac-showcase-reconstruction.vercel.app/**

---

## What this demonstrates

LAC's `feature.json` files carry enough structured context to reconstruct a working application from scratch. This is the end-to-end proof:

1. **EXTRACT** — `lac extract-all` on `FirstProjectExample/src/` produces `feature.json` files for every feature
2. **EXPORT** — `lac export --prompt` generates a structured `spec.md` from those files
3. **STRIP** — `src/` is deleted; only `feature.json` files and the spec remain
4. **REBUILD** — AI reconstructs the full application from `spec.md` alone

See [RECONSTRUCTION-FINDINGS.md](./RECONSTRUCTION-FINDINGS.md) for a detailed breakdown of what transferred faithfully, what was lost, and what schema improvements the experiment motivated.

---

## Original project

Source: [lac-showcase](https://github.com/majeanson/lac-showcase) — the original 29-feature self-documenting portfolio
Live: https://lacexample.vercel.app/

---

## Run it locally

```bash
bun install
bun run dev
```

Build a static bundle:

```bash
bun run build
bun run preview
```

---

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/majeanson/lac-showcase-reconstruction)

No environment variables required — fully static, feature data embedded at build time.

---

## The toolchain

| package          | what it is                                                                   | link                                                                                    |
| ---------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `@majeanson/lac` | CLI — scaffold features, fill with AI, inspect lineage. Runs via `npx`.      | [npm →](https://www.npmjs.com/package/@majeanson/lac)                                   |
| `lac-lens`       | VS Code extension — CodeLens annotations, hover cards, sidebar explorer.     | [marketplace →](https://marketplace.visualstudio.com/items?itemName=majeanson.lac-lens) |
| `lac-mcp`        | MCP server — exposes your feature workspace to Claude, Cursor, any MCP host. | bundled with CLI                                                                        |
| `lifeascode`     | Web app — browse features, visualise lineage trees, timeline of decisions.   | [live demo →](https://lifeascode-ruddy.vercel.app/)                                     |
| `feature-schema` | Canonical schema — single Zod source of truth across CLI, LSP, MCP, web app. | bundled                                                                                 |
