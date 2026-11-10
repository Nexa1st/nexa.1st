import { useMemo, useState } from 'react';
import { Highlight } from './GlobalSearch';

export type Card = { title: string; description: string; url: string; category: string; tags: string[]; date: string; gradient: string; emoji: string; meta: string };
function Explorer({ items, kind }: { items: Card[]; kind: string }) {
  const cats = useMemo(() => ['All', ...Array.from(new Set(items.map(i => i.category)))], [items]);
  const [cat, setCat] = useState('All'); const [q, setQ] = useState('');
  const shown = items.filter(i => (cat === 'All' || i.category === cat) &&
    (`${i.title} ${i.description} ${i.tags.join(' ')}`.toLowerCase().includes(q.toLowerCase())));
  return (
    <div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14 }}>
        <label className="sr-only" htmlFor={`exp-${kind}`}>Filter {kind}</label>
        <input id={`exp-${kind}`} type="search" value={q} onChange={e => setQ(e.target.value)} placeholder={`Filter ${kind}…`}
          className="glass-soft" style={{ minHeight: 44, padding: '0 1rem', borderRadius: 999, flex: '1 1 200px' }} />
        {cats.map(c => (
          <button key={c} onClick={() => setCat(c)} aria-pressed={cat === c} className="chip magnetic" style={{ minHeight: 40, background: cat === c ? 'var(--accent)' : undefined, color: cat === c ? '#fff' : undefined }}>{c}</button>
        ))}
      </div>
      {shown.length === 0 && <p className="text-dim glass-soft" style={{ padding: '1.2rem', textAlign: 'center' }}>No {kind} match that filter yet.</p>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(100%,300px),1fr))', gap: '1rem' }}>
        {shown.map(i => (
          <a key={i.url} href={i.url} className="glass tilt" style={{ padding: 18, display: 'block' }}>
            <div aria-hidden style={{ height: 110, borderRadius: 16, background: i.gradient, display: 'grid', placeItems: 'center', fontSize: '2.4rem', marginBottom: 12 }}>{i.emoji}</div>
            <span className="chip">{i.category}</span>
            <h3 style={{ fontWeight: 750, margin: '0.55rem 0 0.35rem', fontSize: '1.05rem' }}><Highlight text={i.title} q={q} /></h3>
            <p className="text-dim" style={{ fontSize: '.9rem' }}>{i.description}</p>
            <p className="text-faint" style={{ fontSize: '.78rem', marginTop: 8 }}>{i.meta}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
export function BlogExplorer({ items }: { items: Card[] }) { return <Explorer items={items} kind="articles" />; }
export function ToolsExplorer({ items }: { items: Card[] }) { return <Explorer items={items} kind="tools" />; }
