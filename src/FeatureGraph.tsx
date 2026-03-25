// feat-2026-021: Obsidian-style Graph View
// D3 force simulation, nodes sized by completeness, colorBy status|domain
// Hover tooltip, click pins info panel, Ctrl+click jumps to tree view
import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import type { Feature } from './types';
import { completenessOf } from './features';

type ColorBy = 'status' | 'domain';

interface Props {
  features: Feature[];
  focusKey: string | null;
  colorBy: ColorBy;
  onFocus: (key: string | null) => void;
  onNodeJump: (key: string) => void; // Ctrl+click: switch to tree view
}

// Status node colors — warm palette (feat-2026-021 decision: dark warm bg #1C1714)
const STATUS_NODE_COLOR: Record<string, string> = {
  draft: '#F5C842',
  active: '#4CAF6A',
  frozen: '#5B8DD9',
  deprecated: '#C97A7A',
};

// 14 known domains → evenly-spaced HSL hues
const KNOWN_DOMAINS = [
  'portfolio', 'frontend', 'design-system', 'ux', 'content', 'documentation',
  'editor-integration', 'cli', 'server', 'ai-integration', 'schema', 'tooling',
  'web-app', 'concept', 'personal',
];

function domainColor(domain: string | undefined): string {
  const idx = domain ? KNOWN_DOMAINS.indexOf(domain) : -1;
  if (idx === -1) return '#888888';
  const hue = Math.round((idx / KNOWN_DOMAINS.length) * 360);
  return `hsl(${hue}, 65%, 60%)`;
}

interface SimNode extends d3.SimulationNodeDatum {
  featureKey: string;
  title: string;
  status: string;
  domain?: string;
  completeness: number;
}

interface SimLink extends d3.SimulationLinkDatum<SimNode> {
  source: string | SimNode;
  target: string | SimNode;
}

export function FeatureGraph({ features, focusKey, colorBy, onFocus, onNodeJump }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth || 800;
    const height = containerRef.current.clientHeight || 600;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr('width', width).attr('height', height);

    // Dark warm background (feat-2026-021 decision)
    svg.append('rect').attr('width', width).attr('height', height).attr('fill', '#1C1714');

    const nodes: SimNode[] = features.map((f) => ({
      featureKey: f.featureKey,
      title: f.title,
      status: f.status,
      domain: f.domain,
      completeness: completenessOf(f),
    }));

    const links: SimLink[] = [];
    for (const f of features) {
      if (f.lineage?.parent) {
        links.push({ source: f.lineage.parent, target: f.featureKey });
      }
    }

    // Node size encodes completeness (5–14px) — feat-2026-021
    const nodeRadius = (n: SimNode) => 5 + Math.round((n.completeness / 100) * 9);
    const nodeColor = (n: SimNode) =>
      colorBy === 'domain' ? domainColor(n.domain) : (STATUS_NODE_COLOR[n.status] ?? '#888');

    const simulation = d3
      .forceSimulation<SimNode>(nodes)
      .force('link', d3.forceLink<SimNode, SimLink>(links).id((d) => d.featureKey).distance(60))
      .force('charge', d3.forceManyBody().strength(-120))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collide', d3.forceCollide<SimNode>((d) => nodeRadius(d) + 4))
      .alphaDecay(0.08); // faster simulation (feat-2026-021 revision)

    // Domain cluster forces (feat-2026-021, colorBy=domain)
    if (colorBy === 'domain') {
      const domainCenters: Record<string, { x: number; y: number }> = {};
      KNOWN_DOMAINS.forEach((d, i) => {
        const angle = (i / KNOWN_DOMAINS.length) * 2 * Math.PI;
        const r = Math.min(width, height) * 0.28;
        domainCenters[d] = {
          x: width / 2 + r * Math.cos(angle),
          y: height / 2 + r * Math.sin(angle),
        };
      });
      simulation
        .force('x', d3.forceX<SimNode>((d) => domainCenters[d.domain ?? '']?.x ?? width / 2).strength(0.18))
        .force('y', d3.forceY<SimNode>((d) => domainCenters[d.domain ?? '']?.y ?? height / 2).strength(0.18));
    }

    const g = svg.append('g').attr('class', 'graph-layer');

    // Zoom behaviour
    const zoom = d3.zoom<SVGSVGElement, unknown>().scaleExtent([0.3, 4]).on('zoom', (event) => {
      g.attr('transform', event.transform);
    });
    svg.call(zoom);

    // Links
    const linkSel = g
      .append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', '#4A3A2E')
      .attr('stroke-width', 1.5)
      .attr('opacity', 0.7);

    // Nodes
    const nodeSel = g
      .append('g')
      .selectAll<SVGCircleElement, SimNode>('circle')
      .data(nodes)
      .join('circle')
      .attr('r', nodeRadius)
      .attr('fill', nodeColor)
      .attr('stroke', (d) => d.featureKey === focusKey ? '#F2EDE3' : 'transparent')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .call(
        d3.drag<SVGCircleElement, SimNode>()
          .on('start', (event, d) => { if (!event.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
          .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y; })
          .on('end', (event, d) => { if (!event.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; })
      );

    // Tooltip
    const tooltip = d3.select(containerRef.current)
      .append('div')
      .attr('class', 'graph-tooltip')
      .style('display', 'none');

    nodeSel
      .on('mouseover', (event, d) => {
        tooltip
          .style('display', 'block')
          .style('left', `${event.offsetX + 12}px`)
          .style('top', `${event.offsetY - 8}px`)
          .html(`<strong>${d.title}</strong><br/><span>${d.featureKey}</span>`);
        linkSel.attr('opacity', (l) => {
          const s = (l.source as SimNode).featureKey;
          const t = (l.target as SimNode).featureKey;
          return s === d.featureKey || t === d.featureKey ? 1 : 0.2;
        });
      })
      .on('mousemove', (event) => {
        tooltip.style('left', `${event.offsetX + 12}px`).style('top', `${event.offsetY - 8}px`);
      })
      .on('mouseout', () => {
        tooltip.style('display', 'none');
        linkSel.attr('opacity', 0.7);
      })
      .on('click', (event, d) => {
        if (event.ctrlKey || event.metaKey) {
          // Ctrl+click: jump to tree view (feat-2026-021)
          onNodeJump(d.featureKey);
        } else {
          onFocus(d.featureKey === focusKey ? null : d.featureKey);
        }
      });

    // Domain cluster labels (feat-2026-021, colorBy=domain)
    if (colorBy === 'domain') {
      const labelLayer = g.append('g').attr('class', 'domain-labels');
      KNOWN_DOMAINS.forEach((domain, i) => {
        const hasFeatures = features.some((f) => f.domain === domain);
        if (!hasFeatures) return;
        const angle = (i / KNOWN_DOMAINS.length) * 2 * Math.PI;
        const r = Math.min(width, height) * 0.45;
        const x = width / 2 + r * Math.cos(angle);
        const y = height / 2 + r * Math.sin(angle);
        labelLayer
          .append('text')
          .attr('x', x)
          .attr('y', y)
          .attr('fill', domainColor(domain))
          .attr('opacity', 0.6)
          .attr('font-size', '10px')
          .attr('font-family', 'JetBrains Mono, monospace')
          .attr('text-anchor', 'middle')
          .text(domain);
      });
    }

    simulation.on('tick', () => {
      linkSel
        .attr('x1', (d) => (d.source as SimNode).x ?? 0)
        .attr('y1', (d) => (d.source as SimNode).y ?? 0)
        .attr('x2', (d) => (d.target as SimNode).x ?? 0)
        .attr('y2', (d) => (d.target as SimNode).y ?? 0);
      nodeSel
        .attr('cx', (d) => d.x ?? 0)
        .attr('cy', (d) => d.y ?? 0);
    });

    return () => {
      simulation.stop();
      tooltip.remove();
    };
  }, [features, focusKey, colorBy]);

  return (
    <div ref={containerRef} className="graph-container">
      <svg ref={svgRef} className="graph-svg" />
      <div className="graph-hint">Drag to pan · Scroll to zoom · Ctrl+click to open in tree</div>
    </div>
  );
}
