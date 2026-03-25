// feat-2026-029: Card Enhancements — Completeness Badge, Priority Badge, Counts, Spawn Chain, etc.
// feat-2026-014: Focus mode — focus/context/dimmed states
// feat-2026-027: Feature JSON Viewer — inline toggle
import { useState } from 'react';
import type { FeatureNode } from './types';
import { completenessOf } from './features';

interface Props {
  node: FeatureNode;
  isCollapsed: boolean;
  focusState: 'focused' | 'context' | 'dimmed' | 'normal';
  activeTags: Set<string>;
  onToggleCollapse: (key: string) => void;
  onFocus: (key: string | null) => void;
  onTagClick: (tag: string) => void;
  onJumpToGraph: (key: string) => void;
}

export function FeatureCard({
  node,
  isCollapsed,
  focusState,
  activeTags,
  onToggleCollapse,
  onFocus,
  onTagClick,
  onJumpToGraph,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const [showJson, setShowJson] = useState(false);

  const completeness = completenessOf(node);
  const completenessTier = completeness >= 80 ? 'high' : completeness >= 50 ? 'mid' : 'low';

  const hasChildren = node.descendantCount > 0;
  const hasExpandable =
    node.analysis ||
    node.implementation ||
    (node.decisions && node.decisions.length > 0) ||
    node.successCriteria ||
    (node.knownLimitations && node.knownLimitations.length > 0);

  const statusLabel = node.status.charAt(0).toUpperCase() + node.status.slice(1);

  const classes = [
    'feature-card',
    `status-${node.status}`,
    focusState === 'dimmed' ? 'is-dimmed' : '',
    node.status === 'deprecated' ? 'is-deprecated' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className="feature-entry"
      style={{ paddingLeft: `${node.depth * 28}px` }}
    >
      {/* Collapse toggle in gutter (feat-2026-005) */}
      {hasChildren && (
        <button
          className="collapse-toggle"
          onClick={() => onToggleCollapse(node.featureKey)}
          title={isCollapsed ? `Expand ${node.descendantCount} children` : 'Collapse subtree'}
        >
          {isCollapsed ? `▸ ${node.descendantCount}` : '▾'}
        </button>
      )}

      <div className={classes}>
        {/* Card header */}
        <div className="card-header">
          <div className="card-title-row">
            <span className="feature-key mono">{node.featureKey}</span>
            <h3 className="feature-title">{node.title}</h3>
          </div>
          <div className="card-badges">
            <span className={`status-badge status-badge--${node.status}`}>{statusLabel}</span>
            <span className={`completeness-badge completeness-badge--${completenessTier}`}>
              {completeness}%
            </span>
            {node.priority != null && (
              <span className="priority-badge">P{node.priority}</span>
            )}
          </div>
        </div>

        {/* Problem statement */}
        <p className="card-problem">{node.problem}</p>

        {/* Spawn reason inline (feat-2026-029) */}
        {node.lineage?.spawnReason && (
          <p className="spawn-reason">↳ {node.lineage.spawnReason}</p>
        )}

        {/* Count pills (feat-2026-029) */}
        <div className="card-counts">
          {node.decisions && node.decisions.length > 0 && (
            <span className="count-pill">{node.decisions.length} decision{node.decisions.length !== 1 ? 's' : ''}</span>
          )}
          {node.knownLimitations && node.knownLimitations.length > 0 && (
            <span className="count-pill">{node.knownLimitations.length} limitation{node.knownLimitations.length !== 1 ? 's' : ''}</span>
          )}
        </div>

        {/* Tags as filter-activating buttons (feat-2026-029) */}
        {node.tags && node.tags.length > 0 && (
          <div className="card-tags">
            {node.tags.map((tag) => (
              <button
                key={tag}
                className={`tag tag--clickable${activeTags.has(tag) ? ' tag--active' : ''}`}
                onClick={() => onTagClick(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        {/* Expanded section */}
        {expanded && (
          <div className="card-expanded">
            {/* successCriteria at top (feat-2026-029 decision) */}
            {node.successCriteria && (
              <div className="expanded-block">
                <h4 className="expanded-label">Success Criteria</h4>
                <p>{node.successCriteria}</p>
              </div>
            )}

            {node.analysis && (
              <div className="expanded-block">
                <h4 className="expanded-label">Analysis</h4>
                <p>{node.analysis}</p>
              </div>
            )}

            {node.implementation && (
              <div className="expanded-block">
                <h4 className="expanded-label">Implementation</h4>
                <p>{node.implementation}</p>
              </div>
            )}

            {node.decisions && node.decisions.length > 0 && (
              <div className="expanded-block">
                <h4 className="expanded-label">Decisions</h4>
                <ul className="decisions-list">
                  {node.decisions.map((d, i) => (
                    <li key={i} className="decision-item">
                      <div className="decision-header">
                        <span className="decision-text">{d.decision}</span>
                        {/* Decision dates (feat-2026-029) */}
                        {d.date && <span className="decision-date">{d.date}</span>}
                      </div>
                      <p className="decision-rationale">{d.rationale}</p>
                      {d.alternativesConsidered && d.alternativesConsidered.length > 0 && (
                        <ul className="alternatives">
                          {d.alternativesConsidered.map((alt, j) => (
                            <li key={j} className="alternative">{alt}</li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {node.knownLimitations && node.knownLimitations.length > 0 && (
              <div className="expanded-block">
                <h4 className="expanded-label">Known Limitations</h4>
                <ul className="limitations-list">
                  {node.knownLimitations.map((lim, i) => (
                    <li key={i}>{lim}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* JSON viewer (feat-2026-027) */}
        {showJson && (
          <div className="json-viewer">
            <pre className="json-content">{JSON.stringify(node, null, 2)}</pre>
          </div>
        )}

        {/* Card footer actions */}
        <div className="card-footer">
          {hasExpandable && (
            <button className="card-action" onClick={() => setExpanded(!expanded)}>
              {expanded ? '− less' : '+ more context'}
            </button>
          )}
          {hasChildren && isCollapsed && (
            <button className="card-action" onClick={() => onToggleCollapse(node.featureKey)}>
              + show children
            </button>
          )}
          <button
            className={`card-action${focusState === 'focused' ? ' card-action--active' : ''}`}
            onClick={() => onFocus(focusState === 'focused' ? null : node.featureKey)}
          >
            ⊙ focus
          </button>
          <button
            className={`card-action${showJson ? ' card-action--active' : ''}`}
            onClick={() => setShowJson(!showJson)}
          >
            {'{ json }'}
          </button>
          <button
            className="card-action"
            onClick={() => onJumpToGraph(node.featureKey)}
          >
            ◎ graph
          </button>
        </div>
      </div>
    </div>
  );
}
