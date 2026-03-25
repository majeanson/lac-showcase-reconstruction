# LAC Reconstruction Experiment — Findings

**Date:** 2026-03-22
**Source:** `https://github.com/majeanson/lac-showcase` (cloned, stripped, rebuilt)
**Method:** Clone → copy only `feature.json` files → scaffold fresh Vite/React/TS → rebuild entire app from feature.json intent

---

## What Worked — Intent Faithfully Communicated

These things reconstructed accurately and completely from feature.json alone:

### Design System (feat-2026-003)

**Fully reconstructable.** The feature.json contained exact hex values (`#F2EDE3`, `#7C3217`, `#1C1714`), exact font names (`Playfair Display`, `Lora`, `JetBrains Mono`), the CSS architecture decision (`:root` custom properties), and even the decision rationale for each choice. This was the best-documented feature in the set.

### Core Architecture Decisions

- "Vite over Next.js/CRA" — rationale, alternatives, all there
- "`import.meta.glob` for JSON loading" — pattern, strategy, and why it works for a static site
- "URL sync via `history.replaceState` not `pushState`" — decision recorded with the exact reasoning
- "ephemeral collapse state (not URL)" — the opt-out from URL persistence was explicitly recorded
- "`clearFilters()` does not reset `sortBy`/`graphColorBy`" — precision-level detail in a **revision** entry, captured after a reopen

### Feature Lifecycle

The `statusHistory`, `annotations`, and `revisions` arrays told a richer story than the fields themselves. The fact that feat-2026-028 (FilterBar) reopened twice and each revision corrected a specific implementation inaccuracy gave more confidence about the final state than the `implementation` field alone.

### Component Decomposition

Every component name was mentioned explicitly in the `implementation` fields: `FeatureCard`, `FeatureGraph`, `FilterBar`, `Breadcrumb`, `About.tsx`. The file/component split was derivable.

### Business Logic

- `completenessOf(f)` — the exact 7 fields it checks are listed
- Priority sort: "ASC NULLS LAST, featureKey as tiebreaker" — implementable directly
- `treeFilterKeys` includes ancestors — intent clearly stated in feat-2026-028
- Tag sort: frequency descending; domain sort: alphabetical — stated in a revision

---

## What Was Lost or Ambiguous

### 1. Visual micro-details — the gap between "tokens" and "components"

The feature.json documents **what** the design system is but not **how it applies**. The card layout — flex vs grid, exact padding values, border-radius, how badges sit next to each other — all had to be invented.

**Example:** feat-2026-003 says "CSS custom properties on :root" but not that `.feature-card` uses `padding: var(--space-md)` or that `.card-header` is a flex row with `justify-content: space-between`. Every spacing decision was guessed.

**Improvement:** A `designTokenUsage` or `layoutNotes` field, or even CSS snippet examples in `implementation`, would close this gap. Alternatively: a companion `design-spec.json` with annotated wireframes.

---

### 2. Prop interfaces — the seam between components

The feature.json describes components in isolation. It says "FilterBar receives all filter state and callbacks from App" but doesn't describe:

- The exact prop names (`onToggleTag` vs `onTagChange` vs `onFilterTag`)
- What types they accept
- Which props are optional

This meant every component interface was guessed. The reconstruction is **semantically correct** but the prop names differ from the original.

**Improvement:** A `publicInterface` field (or `props` sub-field) describing the component's external contract would make reconstruction deterministic. E.g.:

```json
"publicInterface": {
  "searchQuery": "string",
  "onSearch": "(q: string) => void",
  "activeTags": "Set<string>"
}
```

---

### 3. CSS class naming — entirely lost

Class names like `.card-gutter`, `.about-label`, `.about-body`, `.feature-entry`, `.spawn-chain-step` are mentioned occasionally in `implementation` fields but inconsistently. The reconstruction invented its own class names that match the semantics but will differ from the original.

**Improvement:** CSS class names in `implementation` fields should be treated as a contract. Either mention all of them or none — the current mix creates partial maps that are worse than no map (the reader assumes the mentioned ones are exhaustive).

---

### 4. The `features.ts` / `types.ts` split

feat-2026-002 describes `buildTree()` and `import.meta.glob` thoroughly. But the exact shape of `FeatureNode` (which extends `Feature` with `depth` and `descendantCount`) had to be inferred from how it's used in other features. The `types.ts` file was never mentioned as a separate concern — it was bundled into feat-2026-002's implementation prose.

**Improvement:** For any file that defines types/interfaces shared across components, an explicit `sharedTypes` or `exports` field would help. This is especially critical for schema-adjacent code.

---

### 5. State initialization from URL — the detail about `init` pattern

feat-2026-028 says "all initialised from URLSearchParams on mount" but doesn't describe whether this is in a `useEffect`, on first render, or via a `getURLParams()` helper called at module scope. The timing matters — calling `URLSearchParams` inside `useState()` initializer vs. `useEffect` has different hydration semantics.

**Improvement:** For stateful components, an `initializationStrategy` sub-field would help. Something like: "read from URLSearchParams synchronously in useState initializer, sync back via replaceState in a consolidated useEffect."

---

### 6. The `lac.config.json` file — no feature for it

The cloned repo had a `lac.config.json` at the root that configures the LAC CLI. There is no `feature.json` anywhere that describes the LAC configuration itself. This is a **meta-gap** — the tooling configuration is invisible in the feature tree.

**Improvement:** Either `lac.config.json` should be documented (a feature describing the workspace configuration), or the root feature.json should reference it. Currently, a reconstruction from feature.json alone won't know the workspace glob patterns, ignore rules, or schema version pinning.

---

### 7. The `spec.md` file — prose spec invisible

The repo contained a `spec.md` file at the root (a full prose specification). This was never referenced in any feature.json. It pre-dated the LAC workflow and represents the "before" state — but there's no link from features to it.

**Improvement:** A `precedingArtifacts` or `externalSpec` field (like a reference) on the root feature would surface this. Or the spec.md content could be the `analysis` of the root feature rather than a separate file.

---

### 8. Lifecycle annotations carry more signal than main fields

The most accurate description of what `FilterBar` does came from the `revisions` array, not the `implementation` field. The revisions explicitly corrected two inaccuracies — making them more trustworthy than the original prose. However, there's no indication in the schema which is authoritative when `implementation` and `revisions` describe the same thing differently.

**Improvement:** When a revision updates a field, the field should be the canonical source (the revision is a log). The current schema allows both to be read, creating ambiguity. A `lastVerifiedDate` on `implementation` or marking revised fields with a `[revised YYYY-MM-DD]` inline marker would establish recency.

---

### 9. `features.ts` glob pattern — not deterministic from feature.json

The reconstruction had to figure out that `import.meta.glob('./**/feature.json')` from inside `src/` would find all nested `feature.json` files. The feature.json describes this as "uses `import.meta.glob('../**/feature.json')`" — but the path prefix `../` vs `./` depends on where `features.ts` lives, which isn't stated. A small detail, but it caused a bug (wrong relative path) that had to be debugged.

**Improvement:** Quote the exact glob string in `implementation`, including the `../` vs `./` prefix. Or add a `codeSnippets` field for critical one-liners whose exact form matters.

---

### 10. D3 simulation parameters — half-documented

feat-2026-021 mentions `alphaDecay=0.08`, `forceX/Y strength=0.18`, and cluster radius `28% of canvas`. These are precise enough to reconstruct. But the `forceLink().distance(60)`, `forceManyBody().strength(-120)`, and `forceCollide().radius(r+4)` defaults are not mentioned — they had to be tuned by feel during reconstruction.

**Improvement:** For any numeric tuning parameter that affects UX (simulation forces, animation durations, thresholds), record the value explicitly. These are decisions — they should be in `decisions` or at minimum in `implementation` as literal values.

---

## Structural Gaps in the LAC Schema

### Missing: `componentFile` or `outputFile`

Every feature documents **what** to build but not which file it lives in. For a multi-file codebase, knowing that feat-2026-028 maps to `FilterBar.tsx` required reading the `implementation` field carefully. A `componentFile` field (like `src/FilterBar.tsx`) would make extraction tooling possible: you could auto-jump from a feature to its implementation.

### Missing: `dependencies` (feature-level)

The lineage tree expresses parent/child relationships, but not "feature A's implementation requires feature B's types." For example, `FilterBar` depends on `completenessOf` from `features.ts` (feat-2026-029) — but feat-2026-028 doesn't reference feat-2026-029. Cross-feature implementation dependencies are invisible.

### Missing: `storyPoints` or effort signal

All 29 features are frozen but there's no signal for how large each implementation was. A `linesChanged` or `estimatedHours` field (even approximate) would enable reconstruction planning: "start with the small features, validate the pattern, then tackle the large ones."

### Missing: `externalDependencies`

feat-2026-021 uses D3. The feature.json mentions "D3 force simulation" but `d3` as an npm package name is never stated explicitly. A reconstruction from feature.json alone must infer the package name from the prose description. A `npmPackages` field (e.g. `["d3", "@types/d3"]`) would make `package.json` reconstructable.

feat-2026-002 (App Shell) lists Vite and React implicitly through the `decisions` field, but again not as installable package names with versions.

### `successCriteria` used as acceptance test (feat-2026-015 decision) — but not machine-readable

The integration sprint explicitly says "use each feature's successCriteria as the acceptance test." But `successCriteria` is freeform prose — it can't be executed. A structured `acceptanceCriteria` array (like Gherkin Given/When/Then) alongside the prose would bridge the gap between documentation intent and automated testing.

---

## What the Reconstruction Experiment Proved

1. **Intent survives.** The "what" and "why" of every feature was reconstructible. The problem statements, design decisions, and rationale produced a functionally equivalent app.

2. **Implementation detail decays.** The exact CSS, prop names, class names, and state initialization patterns were lost. The reconstructed app matches the spec but not the source.

3. **Revisions are the most reliable field.** The `revisions` and `annotations` arrays are more trustworthy than `implementation` because they record corrections. The schema should lean into this — make revisions first-class, not an afterthought.

4. **The gap grows with UI complexity.** Core logic (buildTree, completenessOf, URL sync strategy) was fully reconstructable. Visual micro-layout was not. LAC is better suited for documenting logic decisions than CSS decisions.

5. **The self-documenting loop works, but is fragile.** The app's recursive proof — "the feature.json files describe the app that renders them" — held up. But one missing field (e.g., `externalDependencies`) would break the reconstruction entirely at setup time.

---

## Recommended Schema Additions (Priority Order)

| Field                  | Scope                | Why                                                       |
| ---------------------- | -------------------- | --------------------------------------------------------- |
| `componentFile`        | Feature              | Maps feature → source file, enables tooling               |
| `npmPackages`          | Feature              | Makes package.json reconstructable                        |
| `publicInterface`      | Feature              | Makes prop interfaces deterministic across reconstruction |
| `externalDependencies` | Feature              | Cross-feature impl deps (not just lineage)                |
| `lastVerifiedDate`     | Implementation field | Tells readers which revision is authoritative             |
| `codeSnippets`         | Feature              | Critical one-liners (glob patterns, exact API calls)      |
| `layoutNotes`          | Feature (UI)         | Bridges "what tokens" and "how they compose"              |
