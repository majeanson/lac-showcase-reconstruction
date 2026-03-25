// feat-2026-002: React App Shell
// feat-2026-014: Focus mode — URL-synced ?focus= query param
// feat-2026-005: Lineage collapse — ephemeral Set<string> state
// feat-2026-028: Filter bar — URL-synced filter state
// feat-2026-020: Focus mode: children inherit focused state
import { useState, useMemo, useEffect } from 'react';
import { About } from './About';
import { Breadcrumb } from './Breadcrumb';
import { FeatureCard } from './FeatureCard';
import { FeatureGraph } from './FeatureGraph';
import { FilterBar } from './FilterBar';
import {
  allFeatures,
  buildTree,
  getAllTags,
  getAllDomains,
  getAncestors,
} from './features';
import './index.css';
import './App.css';

type View = 'tree' | 'graph';
type SortBy = 'default' | 'priority';
type GraphColorBy = 'status' | 'domain';

// --- URL param helpers (feat-2026-014, feat-2026-028) ---
function getURLParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    focus: params.get('focus') ?? null,
    search: params.get('q') ?? '',
    tags: params.get('tags') ? params.get('tags')!.split(',').filter(Boolean) : [],
    statuses: params.get('statuses') ? params.get('statuses')!.split(',').filter(Boolean) : [],
    domains: params.get('domains') ? params.get('domains')!.split(',').filter(Boolean) : [],
    sortBy: (params.get('sort') as SortBy) ?? 'default',
    colorBy: (params.get('colorBy') as GraphColorBy) ?? 'status',
  };
}

function syncURL(state: {
  focusKey: string | null;
  searchQuery: string;
  activeTags: Set<string>;
  activeStatuses: Set<string>;
  activeDomains: Set<string>;
  sortBy: SortBy;
  graphColorBy: GraphColorBy;
}) {
  const params = new URLSearchParams();
  if (state.focusKey) params.set('focus', state.focusKey);
  if (state.searchQuery) params.set('q', state.searchQuery);
  if (state.activeTags.size) params.set('tags', [...state.activeTags].join(','));
  if (state.activeStatuses.size) params.set('statuses', [...state.activeStatuses].join(','));
  if (state.activeDomains.size) params.set('domains', [...state.activeDomains].join(','));
  if (state.sortBy !== 'default') params.set('sort', state.sortBy);
  if (state.graphColorBy !== 'status') params.set('colorBy', state.graphColorBy);
  const qs = params.toString();
  // history.replaceState — not pushState, focus is same-view navigation (feat-2026-014 decision)
  history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname);
}

export default function App() {
  const init = getURLParams();

  const [view, setView] = useState<View>('tree');
  const [focusKey, setFocusKey] = useState<string | null>(init.focus);
  const [searchQuery, setSearchQuery] = useState(init.search);
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set(init.tags));
  const [activeStatuses, setActiveStatuses] = useState<Set<string>>(new Set(init.statuses));
  const [activeDomains, setActiveDomains] = useState<Set<string>>(new Set(init.domains));
  const [sortBy, setSortBy] = useState<SortBy>(init.sortBy);
  const [graphColorBy, setGraphColorBy] = useState<GraphColorBy>(init.colorBy);

  // Collapse state — ephemeral, not URL-synced (feat-2026-005 decision)
  // Start fully expanded (feat-2026-016 revised: collapsed state was confusing)
  const [collapsedKeys, setCollapsedKeys] = useState<Set<string>>(new Set());

  // Sync URL on state changes (feat-2026-028)
  useEffect(() => {
    syncURL({ focusKey, searchQuery, activeTags, activeStatuses, activeDomains, sortBy, graphColorBy });
  }, [focusKey, searchQuery, activeTags, activeStatuses, activeDomains, sortBy, graphColorBy]);

  // --- Filter logic (feat-2026-028) ---
  const allTags = useMemo(() => getAllTags(allFeatures), []);
  const allDomains = useMemo(() => getAllDomains(allFeatures), []);

  const filteredFeatures = useMemo(() => {
    return allFeatures.filter((f) => {
      // Full-text search across key fields
      if (searchQuery) {
        const hay = [
          f.featureKey, f.title, f.problem, f.analysis, f.implementation,
          f.successCriteria, ...(f.tags ?? []),
          ...(f.decisions?.map((d) => d.decision + ' ' + d.rationale) ?? []),
        ].join(' ').toLowerCase();
        if (!hay.includes(searchQuery.toLowerCase())) return false;
      }
      if (activeTags.size && !f.tags?.some((t) => activeTags.has(t))) return false;
      if (activeStatuses.size && !activeStatuses.has(f.status)) return false;
      if (activeDomains.size && !(f.domain && activeDomains.has(f.domain))) return false;
      return true;
    });
  }, [searchQuery, activeTags, activeStatuses, activeDomains]);

  // treeFilterKeys: matched features + all their ancestors (feat-2026-028)
  const treeFilterKeys = useMemo<Set<string> | null>(() => {
    const hasFilter =
      searchQuery || activeTags.size || activeStatuses.size || activeDomains.size;
    if (!hasFilter) return null; // null = show all
    const keys = new Set<string>();
    for (const f of filteredFeatures) {
      keys.add(f.featureKey);
      for (const ancestorKey of getAncestors(f.featureKey, allFeatures)) {
        keys.add(ancestorKey);
      }
    }
    return keys;
  }, [filteredFeatures, searchQuery, activeTags, activeStatuses, activeDomains]);

  // Auto-expand matched keys when filter activates (feat-2026-028)
  useEffect(() => {
    if (treeFilterKeys) {
      setCollapsedKeys((prev) => {
        const next = new Set(prev);
        for (const key of treeFilterKeys) next.delete(key);
        return next;
      });
    }
  }, [treeFilterKeys]);

  // Build tree (feat-2026-002)
  const fullTree = useMemo(() => buildTree(allFeatures, sortBy), [sortBy]);

  // Visible tree: filter + collapse (feat-2026-005)
  const visibleTree = useMemo(() => {
    return fullTree.filter((node) => {
      // Filter: apply treeFilterKeys if active
      if (treeFilterKeys && !treeFilterKeys.has(node.featureKey)) return false;
      // Collapse: hide nodes whose ancestor is collapsed
      let current = node.lineage?.parent;
      while (current) {
        if (collapsedKeys.has(current)) return false;
        const parent = allFeatures.find((f) => f.featureKey === current);
        current = parent?.lineage?.parent;
      }
      return true;
    });
  }, [fullTree, collapsedKeys, treeFilterKeys]);

  // Focus context keys (feat-2026-014, feat-2026-020)
  const focusContextKeys = useMemo<Set<string> | null>(() => {
    if (!focusKey) return null;
    const ancestors = getAncestors(focusKey, allFeatures);
    const focused = allFeatures.find((f) => f.featureKey === focusKey);
    const directChildren = focused?.lineage?.children ?? [];
    return new Set([focusKey, ...ancestors, ...directChildren]);
  }, [focusKey]);

  // Per-card focus state (feat-2026-014)
  function getFocusState(key: string): 'focused' | 'context' | 'dimmed' | 'normal' {
    if (!focusContextKeys) return 'normal';
    if (key === focusKey) return 'focused';
    if (focusContextKeys.has(key)) return 'context';
    return 'dimmed';
  }

  // Toggle collapse (feat-2026-005)
  function handleToggleCollapse(key: string) {
    setCollapsedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  // Tag click → activate tag filter (feat-2026-029)
  function handleTagClick(tag: string) {
    setActiveTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  }

  // Jump to graph (feat-2026-029)
  function handleJumpToGraph(key: string) {
    setFocusKey(key);
    setView('graph');
  }

  // Jump to tree (feat-2026-021 Ctrl+click)
  function handleNodeJump(key: string) {
    setFocusKey(key);
    setView('tree');
  }

  // Clear filters — does NOT reset sortBy or graphColorBy (feat-2026-028 decision)
  function handleClearFilters() {
    setSearchQuery('');
    setActiveTags(new Set());
    setActiveStatuses(new Set());
    setActiveDomains(new Set());
  }

  // Global stats (feat-2026-029)
  const globalStats = useMemo(() => {
    const source = treeFilterKeys ? filteredFeatures : allFeatures;
    const decisions = source.reduce((sum, f) => sum + (f.decisions?.length ?? 0), 0);
    const domains = new Set(source.map((f) => f.domain).filter(Boolean)).size;
    return { features: source.length, decisions, domains };
  }, [treeFilterKeys, filteredFeatures]);

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">lac-showcase</h1>
        <p className="app-subtitle">A self-documenting portfolio — every card describes how it was built and why.</p>
        <div className="view-toggle">
          <button
            className={`view-btn${view === 'tree' ? ' view-btn--active' : ''}`}
            onClick={() => setView('tree')}
          >
            tree
          </button>
          <button
            className={`view-btn${view === 'graph' ? ' view-btn--active' : ''}`}
            onClick={() => setView('graph')}
          >
            graph
          </button>
        </div>
      </header>

      <main className="app-main">
        <About />

        <section className="features-section">
          <FilterBar
            searchQuery={searchQuery}
            activeTags={activeTags}
            activeStatuses={activeStatuses}
            activeDomains={activeDomains}
            sortBy={sortBy}
            graphColorBy={graphColorBy}
            allTags={allTags}
            allDomains={allDomains}
            filteredCount={filteredFeatures.length}
            totalCount={allFeatures.length}
            currentView={view}
            onSearch={setSearchQuery}
            onToggleTag={handleTagClick}
            onToggleStatus={(s) =>
              setActiveStatuses((prev) => { const n = new Set(prev); n.has(s) ? n.delete(s) : n.add(s); return n; })
            }
            onToggleDomain={(d) =>
              setActiveDomains((prev) => { const n = new Set(prev); n.has(d) ? n.delete(d) : n.add(d); return n; })
            }
            onSortBy={setSortBy}
            onColorBy={setGraphColorBy}
            onClearFilters={handleClearFilters}
            onExpandAll={() => setCollapsedKeys(new Set())}
            onCollapseAll={() => {
              const parentKeys = new Set(
                allFeatures.filter((f) => (f.lineage?.children ?? []).length > 0).map((f) => f.featureKey)
              );
              setCollapsedKeys(parentKeys);
            }}
          />

          {/* Stats bar (feat-2026-029) */}
          <div className="stats-bar">
            <span>{globalStats.features} features</span>
            <span>{globalStats.decisions} decisions</span>
            <span>{globalStats.domains} domains</span>
          </div>

          {view === 'tree' && (
            <>
              <Breadcrumb
                focusKey={focusKey}
                features={allFeatures}
                onFocus={setFocusKey}
              />
              <div className="feature-list">
                {visibleTree.map((node) => (
                  <FeatureCard
                    key={node.featureKey}
                    node={node}
                    isCollapsed={collapsedKeys.has(node.featureKey)}
                    focusState={getFocusState(node.featureKey)}
                    activeTags={activeTags}
                    onToggleCollapse={handleToggleCollapse}
                    onFocus={setFocusKey}
                    onTagClick={handleTagClick}
                    onJumpToGraph={handleJumpToGraph}
                  />
                ))}
              </div>
            </>
          )}

          {view === 'graph' && (
            <FeatureGraph
              features={treeFilterKeys ? filteredFeatures : allFeatures}
              focusKey={focusKey}
              colorBy={graphColorBy}
              onFocus={setFocusKey}
              onNodeJump={handleNodeJump}
            />
          )}
        </section>
      </main>
    </div>
  );
}
