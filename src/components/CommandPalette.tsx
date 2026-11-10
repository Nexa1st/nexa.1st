import { useEffect, useRef, useState } from 'react';
import { loadIndex, searchItems, Highlight, type IndexItem } from './GlobalSearch';

const PAGES: IndexItem[] = [
  { title: 'Home', description: 'NEXA homepage', url: '/', type: 'Page', category: '', tags: [], keywords: 'home start' },
  { title: 'Blog', description: 'All articles', url: '/blog/', type: 'Page', category: '', tags: [], keywords: 'articles stories' },
  { title: 'AI Tools Directory', description: 'Browse AI and creator tools', url: '/tools/', type: 'Page', category: '', tags: [], keywords: 'tools directory' },
  { title: 'Products & Reviews', description: 'Editorial product picks', url: '/products/', type: 'Page', category: '', tags: [], keywords: 'products reviews affiliate' },
  { title: 'About NEXA', description: 'What NEXA is', url: '/about/', type: 'Page', category: '', tags: [], keywords: 'about' },
  { title: 'Contact', description: 'Get in touch', url: '/contact/', type: 'Page', category: '', tags: [], keywords: 'contact email' },
  { title: 'Privacy Policy', description: 'Privacy policy', url: '/privacy/', type: 'Page', category: '', tags: [], keywords: 'privacy' },
  { title: 'Terms of Use', description: 'Terms of use', url: '/terms/', type: 'Page', category: '', tags: [], keywords: 'terms' },
];
/** Command palette — opens on Ctrl/Cmd+K or the custom `nexa:palette` event. Keyboard navigable. */
export default function CommandPalette() {
  const [open, setOpen] = useState(false); const [q, setQ] = useState('');
  const [items, setItems] = useState<IndexItem[]>(PAGES); const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const openFn = () => { setOpen(true); loadIndex().then(idx => setItems([...PAGES, ...idx])).catch(() => {}); };
    const key = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openFn(); } };
    window.addEventListener('keydown', key); window.addEventListener('nexa:palette', openFn);
    return () => { window.removeEventListener('keydown', key); window.removeEventListener('nexa:palette', openFn); };
  }, []);
  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 30); }, [open ]);
  if (!open) return null;
  const res = q.trim() ? searchItems(items, q) : items.slice(0, 8);
  return (
    <div role="dialog" aria-modal="true" aria-label="Command palette" style={{ position: 'fixed', inset: 0, zIndex: 220, background: 'rgba(0,0,0,.45)', backdropFilter: 'blur(6px)' }}
      onClick={() => setOpen(false)}>
      <div className="glass" style={{ maxWidth: 620, margin: '10vh auto 0', padding: 14, width: 'calc(100% - 2rem)' }} onClick={e => e.stopPropagation()}>
        <label className="sr-only" htmlFor="palette-input">Command palette search</label>
        <input id="palette-input" ref={inputRef} value={q} onChange={e => { setQ(e.target.value); setSel(0); }} placeholder="Type to jump to a page, article or tool…"
          role="combobox" aria-expanded="true" aria-controls="palette-results" aria-activedescendant={res[sel] ? `pal-${sel}` : undefined}
          onKeyDown={e => {
            if (e.key === 'ArrowDown') { e.preventDefault(); setSel(s => Math.min(s + 1, res.length - 1)); }
            else if (e.key === 'ArrowUp') { e.preventDefault(); setSel(s => Math.max(s - 1, 0)); }
            else if (e.key === 'Enter' && res[sel]) window.location.href = res[sel].url;
            else if (e.key === 'Escape') setOpen(false);
          }}
          className="glass-soft" style={{ width: '100%', minHeight: 52, padding: '0 1rem', fontSize: '1rem' }} />
        <ul id="palette-results" role="listbox" style={{ marginTop: 10, maxHeight: 340, overflow: 'auto' }}>
          {res.length === 0 && <li className="text-dim" style={{ padding: '1rem', textAlign: 'center' }}>No matches — try another word.</li>}
          {res.map((r, i) => (
            <li key={r.url} id={`pal-${i}`} role="option" aria-selected={i === sel}>
              <a href={r.url} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '.65rem .7rem', borderRadius: 12, background: i === sel ? 'var(--glass2)' : 'transparent' }}>
                <span className="chip">{r.type}</span><strong><Highlight text={r.title} q={q} /></strong>
                <span className="text-faint" style={{ marginLeft: 'auto', fontSize: '.8rem' }}>{r.category}</span>
              </a>
            </li>
          ))}
        </ul>
        <p className="text-faint" style={{ fontSize: '.75rem', marginTop: 8 }}>↑ ↓ navigate · Enter open · Esc close</p>
      </div>
    </div>
  );
}
