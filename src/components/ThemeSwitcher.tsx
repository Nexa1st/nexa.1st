import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const THEMES = [
  { id: 'midnight', name: 'Midnight Black', sw: 'linear-gradient(135deg,#05060a,#3b5af6)' },
  { id: 'silver', name: 'Liquid Silver', sw: 'linear-gradient(135deg,#9aa3b2,#e5e7eb)' },
  { id: 'arctic', name: 'Arctic Blue', sw: 'linear-gradient(135deg,#0369a1,#4cc9ff)' },
  { id: 'nebula', name: 'Purple Nebula', sw: 'linear-gradient(135deg,#7c3aed,#db2777)' },
  { id: 'light', name: 'Pure Light', sw: 'linear-gradient(135deg,#ffffff,#bfdbfe)' },
];
export function applyTheme(id: string) {
  document.documentElement.dataset.theme = id;
  try { localStorage.setItem('nexa-theme', id); } catch {}
  window.dispatchEvent(new CustomEvent('nexa-theme', { detail: id }));
}
export default function ThemeSwitcher() {
  const [open, setOpen] = useState(false);
  const [cur, setCur] = useState('midnight');
  const [lite, setLite] = useState(false);
  const [cursor, setCursor] = useState(false);
  useEffect(() => {
    setCur(document.documentElement.dataset.theme || 'midnight');
    setLite(document.documentElement.classList.contains('lite'));
    const on = (e: any) => setCur(e.detail);
    window.addEventListener('nexa-theme', on);
    return () => window.removeEventListener('nexa-theme', on);
  }, []);
  const pick = (id: string) => { applyTheme(id); setCur(id); };
  const toggleLite = () => {
    const v = !lite; setLite(v);
    document.documentElement.classList.toggle('lite', v);
    try { localStorage.setItem('nexa-lite', v ? '1' : '0'); } catch {}
  };
  const toggleCursor = () => {
    const v = !cursor; setCursor(v);
    document.documentElement.classList.toggle('cursor-on', v);
    try { localStorage.setItem('nexa-cursor', v ? '1' : '0'); } catch {}
  };
  return (
    <div style={{ position: 'relative' }}>
      <button aria-haspopup="menu" aria-expanded={open} aria-label="Theme and display settings" onClick={() => setOpen(!open)}
        className="glass-soft magnetic" style={{ minHeight: 44, minWidth: 44, padding: '.5rem .9rem', fontWeight: 650 }}>
        🎨 <span className="hidden sm:inline">{THEMES.find(t => t.id === cur)?.name}</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div role="menu" aria-label="Themes" initial={{ opacity: 0, y: 8, scale: .97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 6, scale: .97 }} transition={{ duration: .18 }}
            className="glass" style={{ position: 'absolute', right: 0, top: 'calc(100% + 10px)', width: 280, padding: 14, zIndex: 90 }}>
            <p style={{ fontSize: '.72rem', fontWeight: 700, letterSpacing: '.12em' }} className="text-faint">THEME — SAVED ON THIS DEVICE</p>
            <div style={{ display: 'grid', gap: 6, marginTop: 10 }}>
              {THEMES.map(t => (
                <button key={t.id} role="menuitemradio" aria-checked={cur === t.id} onClick={() => pick(t.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 44, padding: '.45rem .6rem', borderRadius: 12, textAlign: 'left', background: cur === t.id ? 'var(--glass2)' : 'transparent' }}>
                  <span aria-hidden style={{ width: 26, height: 26, borderRadius: '50%', background: t.sw, border: '1px solid var(--stroke)' }} />
                  <span style={{ fontWeight: 600, fontSize: '.92rem' }}>{t.name}</span>{cur === t.id && <span aria-hidden style={{ marginLeft: 'auto' }}>✓</span>}
                </button>
              ))}
            </div>
            <hr style={{ borderColor: 'var(--stroke)', margin: '12px 0' }} />
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: 44, fontSize: '.9rem', fontWeight: 600 }}>
              Lite effects (low-end devices) <input type="checkbox" checked={lite} onChange={toggleLite} aria-label="Toggle lite effects mode" style={{ width: 20, height: 20 }} />
            </label>
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: 44, fontSize: '.9rem', fontWeight: 600 }}>
              Custom cursor (desktop) <input type="checkbox" checked={cursor} onChange={toggleCursor} aria-label="Toggle custom cursor" style={{ width: 20, height: 20 }} />
            </label>
            <button className="btn-ghost glass-soft" style={{ width: '100%', minHeight: 40, marginTop: 8 }} onClick={() => setOpen(false)}>Done</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
