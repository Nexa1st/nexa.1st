import { useEffect, useState } from 'react';
import { loadAdsWhenConsented } from '../config/ads';

/** Cookie consent banner. Stores choice in localStorage ('nexa-consent').
 *  Does not block content. The ad loader stub checks this choice before any
 *  future ad load — and while ads are disabled it loads nothing at all. */
export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    try {
      const v = localStorage.getItem('nexa-consent');
      if (!v) setVisible(true);
      else if (v === 'accepted') loadAdsWhenConsented(); // no-op while ads disabled
    } catch { setVisible(true); }
  }, []);
  if (!visible) return null;
  const choose = (v: 'accepted' | 'declined') => {
    try { localStorage.setItem('nexa-consent', v); } catch {}
    if (v === 'accepted') loadAdsWhenConsented();
    setVisible(false);
  };
  return (
    <div role="region" aria-label="Cookie consent" className="glass"
      style={{ position: 'fixed', left: '50%', transform: 'translateX(-50%)', bottom: 92, zIndex: 180, width: 'calc(100% - 2rem)', maxWidth: 560, padding: 16 }}>
      <p style={{ fontWeight: 700 }}>Cookies on NEXA</p>
      <p className="text-dim" style={{ fontSize: '.88rem', margin: '.35rem 0 .8rem' }}>
        We store your theme and search preferences on your device. This site shows advertising from Adsterra.
        Ad scripts load <strong>only if you accept</strong> — decline and no advertising scripts will load, and you can still read everything.
        See our <a href="/privacy/" style={{ textDecoration: 'underline' }}>Privacy Policy</a>.
      </p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button className="btn" style={{ minHeight: 44 }} onClick={() => choose('accepted')}>Accept</button>
        <button className="btn btn-ghost" style={{ minHeight: 44 }} onClick={() => choose('declined')}>Decline</button>
      </div>
    </div>
  );
}
