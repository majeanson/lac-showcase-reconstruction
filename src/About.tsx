// feat-2026-004: What is Life-as-Code
// Purely presentational, no props, rendered above feature list
// Inline section — no separate route (feat-2026-004 decision)

const ECOSYSTEM_ITEMS = [
  {
    name: '@majeanson/lac',
    description: 'CLI for creating, searching, validating and managing feature.json files.',
    href: 'https://www.npmjs.com/package/@majeanson/lac',
  },
  {
    name: 'lac-lens',
    description: 'VS Code extension — CodeLens annotations on source files with feature context.',
    href: 'https://marketplace.visualstudio.com/items?itemName=majeanson.lac-lens',
  },
  {
    name: 'lac-mcp',
    description: '18-tool MCP server that drives the full feature lifecycle inside Claude.',
    href: 'https://github.com/majeanson/lac-showcase',
  },
  {
    name: 'lifeascode',
    description: 'Next.js web app — shared dashboard for teams to browse features and lineage.',
    href: 'https://lifeascode.vercel.app',
  },
  {
    name: 'feature-schema',
    description: 'Canonical Zod schema and TypeScript types shared across all ecosystem packages.',
    href: 'https://github.com/majeanson/lac-showcase',
  },
  {
    name: 'lac-lsp',
    description: 'Language server — HTTP indexer with SSE for real-time editor integration.',
    href: 'https://github.com/majeanson/lac-showcase',
  },
];

export function About() {
  return (
    <section className="about-section">
      <div className="about-label">What is Life-as-Code?</div>
      <div className="about-body">
        <p className="about-lead">
          Every decision you make while building software carries context that evaporates the moment
          you close the tab. Life-as-Code is a workflow for capturing that context — problems,
          decisions, rationale — as structured data that lives alongside the code it describes.
        </p>
        <p>
          A <code>feature.json</code> file sits next to the code it documents. It records the
          problem that triggered the work, the decisions made and alternatives rejected, and the
          success criteria that defined done. The reasoning becomes a permanent, searchable record —
          not a wiki page that drifts, not a commit message that gets skipped.
        </p>
        <p>
          This portfolio is self-documenting: the feature.json files in this repo are the data
          source for the app you're reading right now. Every card describes how it was built and why.
        </p>
        <p>
          The LAC toolchain spans six packages — a CLI, a VS Code extension, an MCP server for
          Claude, a language server, a shared schema, and a web dashboard — all built around the
          same feature.json contract.
        </p>

        <div className="about-cta">
          <code className="about-cta-cmd">npx @majeanson/lac init</code>
          <a
            href="https://github.com/majeanson/lac-showcase"
            target="_blank"
            rel="noreferrer"
            className="about-link"
          >
            view on GitHub →
          </a>
        </div>
      </div>

      <div className="ecosystem-grid">
        {ECOSYSTEM_ITEMS.map((item) => (
          <a
            key={item.name}
            href={item.href}
            target="_blank"
            rel="noreferrer"
            className="ecosystem-card"
          >
            <span className="ecosystem-name">{item.name}</span>
            <span className="ecosystem-desc">{item.description}</span>
          </a>
        ))}
      </div>
    </section>
  );
}
