// feat-2026-028: Filter Bar — Search, Tag, Status, Domain, Sort, URL Sync
// Collapsible panel: always-visible search + active-count badge (feat-2026-028 decision)
import { useState } from 'react';

type SortBy = 'default' | 'priority';
type GraphColorBy = 'status' | 'domain';

interface Props {
  searchQuery: string;
  activeTags: Set<string>;
  activeStatuses: Set<string>;
  activeDomains: Set<string>;
  sortBy: SortBy;
  graphColorBy: GraphColorBy;
  allTags: string[];
  allDomains: string[];
  filteredCount: number;
  totalCount: number;
  currentView: 'tree' | 'graph';
  onSearch: (q: string) => void;
  onToggleTag: (tag: string) => void;
  onToggleStatus: (status: string) => void;
  onToggleDomain: (domain: string) => void;
  onSortBy: (s: SortBy) => void;
  onColorBy: (c: GraphColorBy) => void;
  onClearFilters: () => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
}

const ALL_STATUSES = ['draft', 'active', 'frozen', 'deprecated'];

export function FilterBar({
  searchQuery,
  activeTags,
  activeStatuses,
  activeDomains,
  sortBy,
  graphColorBy,
  allTags,
  allDomains,
  filteredCount,
  totalCount,
  currentView,
  onSearch,
  onToggleTag,
  onToggleStatus,
  onToggleDomain,
  onSortBy,
  onColorBy,
  onClearFilters,
  onExpandAll,
  onCollapseAll,
}: Props) {
  const [panelOpen, setPanelOpen] = useState(false);

  const activeFilterCount =
    (searchQuery ? 1 : 0) + activeTags.size + activeStatuses.size + activeDomains.size;

  const hasActiveFilters = activeFilterCount > 0;

  return (
    <div className="filter-bar">
      {/* Always-visible row: search + toggle button */}
      <div className="filter-bar-top">
        <input
          type="search"
          className="filter-search"
          placeholder="Search features…"
          value={searchQuery}
          onChange={(e) => onSearch(e.target.value)}
        />
        <button
          className={`filter-toggle-btn${panelOpen ? ' filter-toggle-btn--open' : ''}`}
          onClick={() => setPanelOpen(!panelOpen)}
        >
          Filters{activeFilterCount > 0 && <span className="filter-active-badge">{activeFilterCount}</span>}
        </button>

        {/* Match pill (feat-2026-028) */}
        {hasActiveFilters && (
          <span className="filter-match-pill">{filteredCount} / {totalCount}</span>
        )}

        {/* Tree-only controls (feat-2026-028) */}
        {currentView === 'tree' && (
          <div className="tree-toolbar">
            <button className="tree-btn" onClick={onExpandAll}>expand all</button>
            <button className="tree-btn" onClick={onCollapseAll}>collapse all</button>
          </div>
        )}
      </div>

      {/* Collapsible panel */}
      {panelOpen && (
        <div className="filter-panel">
          {/* Status chips */}
          <div className="filter-section">
            <span className="filter-section-label">Status</span>
            <div className="filter-chips">
              {ALL_STATUSES.map((s) => (
                <button
                  key={s}
                  className={`filter-chip${activeStatuses.has(s) ? ' filter-chip--active' : ''}`}
                  onClick={() => onToggleStatus(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Domain chips */}
          <div className="filter-section">
            <span className="filter-section-label">Domain</span>
            <div className="filter-chips">
              {allDomains.map((d) => (
                <button
                  key={d}
                  className={`filter-chip${activeDomains.has(d) ? ' filter-chip--active' : ''}`}
                  onClick={() => onToggleDomain(d)}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Tag chips */}
          <div className="filter-section">
            <span className="filter-section-label">Tags</span>
            <div className="filter-chips">
              {allTags.map((t) => (
                <button
                  key={t}
                  className={`filter-chip${activeTags.has(t) ? ' filter-chip--active' : ''}`}
                  onClick={() => onToggleTag(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Sort (feat-2026-028) */}
          <div className="filter-section filter-section--row">
            <span className="filter-section-label">Sort</span>
            <div className="filter-chips">
              <button
                className={`filter-chip${sortBy === 'default' ? ' filter-chip--active' : ''}`}
                onClick={() => onSortBy('default')}
              >
                tree order
              </button>
              <button
                className={`filter-chip${sortBy === 'priority' ? ' filter-chip--active' : ''}`}
                onClick={() => onSortBy('priority')}
              >
                priority
              </button>
            </div>
          </div>

          {/* Graph colorBy (feat-2026-028) */}
          <div className="filter-section filter-section--row">
            <span className="filter-section-label">Graph color</span>
            <div className="filter-chips">
              <button
                className={`filter-chip${graphColorBy === 'status' ? ' filter-chip--active' : ''}`}
                onClick={() => onColorBy('status')}
              >
                status
              </button>
              <button
                className={`filter-chip${graphColorBy === 'domain' ? ' filter-chip--active' : ''}`}
                onClick={() => onColorBy('domain')}
              >
                domain
              </button>
            </div>
          </div>

          {/* Clear filters — does NOT reset sortBy or graphColorBy (feat-2026-028 decision) */}
          {hasActiveFilters && (
            <button className="filter-clear-btn" onClick={onClearFilters}>
              ✕ Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
