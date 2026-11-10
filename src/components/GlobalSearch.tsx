import { useEffect, useRef, useState } from 'react';

export type IndexItem = { title: string; description: string; url: string; type: string; category: string; tags: string[]; keywords: string };
let cache: IndexItem[] | null = null;
export async function loadIndex(): Promise<IndexItem[]> {
  if (cache) return cache;
  const r = await fetch('/search-index.json');
  cache = await r.json();
  return cache!;
}
export function searchItems(items: IndexItem[], q: string): IndexItem[] {
  const s = q.trim().toLowerCase(); if (!s) return [];
  const terms = s.split(/\s+/);
  return items.map(it => {
    const hay = `${it.title} ${it.category} ${it.tags.join(' ')} ${it.description} ${it.keywords}`.toLowerCase();
    let score = 0; for (const t of terms) { if (it.title.toLowerCase().includes(t)) score += 5; if (hay.includes(t)) score += 2; }
    return { it, score };
  }).filter(x => x.score >= terms.length * 2).sort((a, b) => b.score - a.score).slice(0, 8).map(x => x.it);
}
export function Highlight({ text, q }: { text: string; q: string }) {
  const t = q.trim(); if (!t) return <>{text}</>;
  const i = text.toLowerCase().indexOf(t.toLowerCase()); if (i < 0) return <>{text}</>;
  return <>{text.slice(0, i)}<mark>{text.slice(i, i + t.length)}</mark>{text.slice(i + t.length)}</>;
}
function getRecents(): string[] { try { return JSON.parse(localStorage.getItem('nexa-recents') || '[]'); } catch { return []; } }
function saveRecent(q: string) { try { const r = [q, ...getRecents().filter(x => x !== q)].slice(0, 5); localStorage.setItem('nexa-recents', JSON.stringify(r)); } catch {} }

/** Hero / inline instant search with suggestions dropdown, highlighting, recents, keyboard nav. */
export default function GlobalSearch({ autoFocus = false, placeholder = 'Search articles, tools, products…' }: { autoFocus?: boolean; placeholder?: string }) {
  const [q, setQ] = useState(''); const [items, setItems] = useState<IndexItem[]>([]); const [res, setRes] = useState<IndexItem[]>([]);
  const [sel, setSel] = useState(0); const [open, setOpen] = useState(false); const [recents, setRecents] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { loadIndex().then(setItems).catch(() => {}); setRecents(getRecents()); if (autoFocus) inputRef.current?.focus(); }, []);
  useEffect(() => { setRes(searchItems(items, q)); setSel(0); }, [q, items]);
  const go = (url: string) => { if (q.trim()) saveRecent(q.trim()); window.location.href = url; };
  return (
    <div style={{ position: 'relative', width: '100%' }} role="search">
      <label className="sr-only" htmlFor="nexa-search">Search NEXA</label>
      <input ref={inputRef} id="nexa-search" type="search" value={q} autoComplete="off" placeholder={placeholder}
        aria-expanded={open} aria-controls="search-results" role="combobox" aria-autocomplete="list" aria-activedescendant={res[sel] ? `sr-${sel}` : undefined}
        onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 150)}
        onChange={e => { setQ(e.target.value); setOpen(true); }}
        onKeyDown={e => {
          if (e.key === 'ArrowDown') { e.preventDefault(); setSel(s => Math.min(s + 1, res.length - 1)); }
          else if (e.key === 'ArrowUp') { e.preventDefault(); setSel(s => Math.max(s - 1, 0)); }
          else if (e.key === 'Enter' && res[sel]) { go(res[sel].url); }
          else if (e.key === 'Escape') { setOpen(false); }
        }}
        className="glass-soft" style={{ width: '100%', minHeight: 54, padding: '0 1.2rem', fontSize: '1rem', borderRadius: 999 }} />
      {open && q.trim() && (
        <ul id="search-results" role="listbox" className="glass" style={{ position: 'absolute', left: 0, right: 0, top: 'calc(100% + 8px)', padding: 8, zIndex: 80, textAlign: 'left', maxHeight: 380, overflow: 'auto' }}>
          {res.length === 0 && (
            <li style={{ padding: '1rem', textAlign: 'center' }} className="text-dim">
              <span aria-hidden style={{ display: 'block', fontSize: '1.8rem', animation: 'spin 3s linear infinite' }}>✦</span>
              Nothing found for “{q}”. Try “AI tools”, “gaming” or “CapCut”.
            </li>
          )}
          {res.map((r, i) => (
            <li key={r.url} id={`sr-${i}`} role="option" aria-selected={i === sel}>
              <a href={r.url} onClick={() => q.trim() && saveRecent(q.trim())} style={{ display: 'block', padding: '.6rem .7rem', borderRadius: 12, background: i === sel ? 'var(--glass2)' : 'transparent' }}>
                <span className="chip" style={{ marginRight: 8 }}>{r.type}</span>
                <strong><Highlight text={r.title} q={q} /></strong>
                <span className="text-dim" style={{ display: 'block', fontSize: '.85rem', marginTop: 2 }}><Highlight text={r.description} q={q} /></span>
              </a>
            </li>
          ))}
        </ul>
      )}
      {open && !q.trim() && recents.length > 0 && (
        <div className="glass" style={{ position: 'absolute', left: 0, right: 0, top: 'calc(100% + 8px)', padding: 12, zIndex: 80, textAlign: 'left' }}>
          <p className="text-faint" style={{ fontSize: '.72rem', fontWeight: 700, letterSpacing: '.1em' }}>RECENT SEARCHES</p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
            {recents.map(r => <button key={r} className="chip" style={{ minHeight: 36 }} onMouseDown={() => setQ(r)}>↺ {r}</button>)}
          </div>
        </div>
      )}
    </div>
  );
}
