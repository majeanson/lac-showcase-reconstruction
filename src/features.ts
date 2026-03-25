// feat-2026-002: Vite import.meta.glob — all feature.json files loaded at build time
// feat-2026-029: completenessOf exported for use in FeatureCard and FeatureGraph
import type { Feature, FeatureNode } from './types';

// Load all feature.json files at build time (no server required)
// Pattern covers root feature.json + all src/**/feature.json
const rawModules = import.meta.glob<Feature>(['./**/feature.json', '../feature.json'], { eager: true });

// Collect and flatten into Feature array
export const allFeatures: Feature[] = Object.values(rawModules).filter(
  (f): f is Feature => !!f && typeof f === 'object' && 'featureKey' in f
);

// completenessOf: checks 7 optional fields (feat-2026-029)
// Score = count of non-empty optional fields / 7
export function completenessOf(f: Feature): number {
  let score = 0;
  if (f.analysis && f.analysis.length > 0) score++;
  if (f.implementation && f.implementation.length > 0) score++;
  if (f.decisions && f.decisions.length > 0) score++;
  if (f.successCriteria && f.successCriteria.length > 0) score++;
  if (f.knownLimitations && f.knownLimitations.length > 0) score++;
  if (f.tags && f.tags.length > 0) score++;
  if (f.domain && f.domain.length > 0) score++;
  return Math.round((score / 7) * 100);
}

// Build depth-first tree with depth values for visual indentation
// feat-2026-002: buildTree sorts features into a tree via lineage.parent keys
export function buildTree(
  features: Feature[],
  sortBy: 'default' | 'priority' = 'default'
): FeatureNode[] {
  // Count descendants recursively
  function countDescendants(key: string): number {
    const children = features.filter((f) => f.lineage?.parent === key);
    return children.reduce((sum, c) => sum + 1 + countDescendants(c.featureKey), 0);
  }

  // Sort children by priority ASC NULLS LAST, then featureKey as tiebreaker
  function sortChildren(children: Feature[]): Feature[] {
    if (sortBy === 'priority') {
      return [...children].sort((a, b) => {
        const pa = a.priority ?? 9999;
        const pb = b.priority ?? 9999;
        if (pa !== pb) return pa - pb;
        return a.featureKey.localeCompare(b.featureKey);
      });
    }
    return children;
  }

  // Walk tree depth-first
  function walk(parentKey: string | undefined, depth: number): FeatureNode[] {
    const children = features.filter(
      (f) => (f.lineage?.parent ?? undefined) === parentKey
    );
    const sorted = sortChildren(children);
    return sorted.flatMap((f) => [
      { ...f, depth, descendantCount: countDescendants(f.featureKey) },
      ...walk(f.featureKey, depth + 1),
    ]);
  }

  // Root features: those with no lineage.parent
  return walk(undefined, 0);
}

// All unique tags sorted by frequency (feat-2026-028)
export function getAllTags(features: Feature[]): string[] {
  const counts = new Map<string, number>();
  for (const f of features) {
    for (const tag of f.tags ?? []) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([tag]) => tag);
}

// All unique domains sorted alphabetically (feat-2026-028)
export function getAllDomains(features: Feature[]): string[] {
  const domains = new Set(features.map((f) => f.domain).filter(Boolean) as string[]);
  return [...domains].sort();
}

// Get all ancestors of a feature key
export function getAncestors(
  key: string,
  features: Feature[]
): string[] {
  const byKey = new Map(features.map((f) => [f.featureKey, f]));
  const ancestors: string[] = [];
  let current = byKey.get(key);
  while (current?.lineage?.parent) {
    ancestors.push(current.lineage.parent);
    current = byKey.get(current.lineage.parent);
  }
  return ancestors;
}

// Unused variable cleanup: byKey is used in buildTree only
// (No byKey or rooted vars exposed — feat-2026-002 decision: dead code removed)
