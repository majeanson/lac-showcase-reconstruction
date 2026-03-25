// feat-2026-014: Story Navigation — breadcrumb trail + spawn chain strip (feat-2026-029)
import type { Feature } from './types';

interface Props {
  focusKey: string | null;
  features: Feature[];
  onFocus: (key: string | null) => void;
}

export function Breadcrumb({ focusKey, features, onFocus }: Props) {
  if (!focusKey) return null;

  const byKey = new Map(features.map((f) => [f.featureKey, f]));

  // Build ancestor chain from root to focusKey
  const chain: Feature[] = [];
  let current = byKey.get(focusKey);
  while (current) {
    chain.unshift(current);
    current = current.lineage?.parent ? byKey.get(current.lineage.parent) : undefined;
  }

  return (
    <div className="breadcrumb-container">
      {/* Breadcrumb trail (feat-2026-014) */}
      <nav className="breadcrumb">
        <button className="breadcrumb-back" onClick={() => onFocus(null)}>
          ← all
        </button>
        {chain.map((f, i) => (
          <span key={f.featureKey} className="breadcrumb-segment">
            {i > 0 && <span className="breadcrumb-sep"> / </span>}
            <button
              className={`breadcrumb-crumb${f.featureKey === focusKey ? ' breadcrumb-crumb--active' : ''}`}
              onClick={() => onFocus(f.featureKey)}
            >
              {f.title}
            </button>
          </span>
        ))}
      </nav>

      {/* Spawn chain strip (feat-2026-029) */}
      {chain.length > 1 && (
        <div className="spawn-chain">
          {chain.slice(1).map((f) =>
            f.lineage?.spawnReason ? (
              <div key={f.featureKey} className="spawn-chain-step">
                <span className="spawn-chain-parent">
                  {byKey.get(f.lineage.parent!)?.title ?? f.lineage.parent}
                </span>
                <span className="spawn-chain-arrow"> → </span>
                <span className="spawn-chain-child">{f.title}</span>
                <span className="spawn-chain-reason">: {f.lineage.spawnReason}</span>
              </div>
            ) : null
          )}
        </div>
      )}
    </div>
  );
}
