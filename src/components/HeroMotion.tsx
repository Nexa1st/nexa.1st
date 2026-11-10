import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';

/** Hero island: Framer Motion entrance + GSAP floating glass orbs (transform/opacity only).
 *  Orbs pause when off-screen via IntersectionObserver; disabled in lite/reduced-motion. */
export default function HeroMotion() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    if (document.documentElement.classList.contains('lite')) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = gsap.context(() => {
      gsap.to('.orb', { y: -22, duration: 3.2, ease: 'sine.inOut', yoyo: true, repeat: -1, stagger: 0.45 });
    }, ref);
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) gsap.globalTimeline.resume(); else gsap.globalTimeline.pause(); }, { threshold: 0.05 });
    io.observe(ref.current);
    return () => { io.disconnect(); ctx.revert(); };
  }, []);
  return (
    <div ref={ref} aria-hidden style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      <motion.div className="orb glass" initial={{ opacity: 0, scale: .8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: .8 }}
        style={{ position: 'absolute', top: '12%', left: '6%', width: 92, height: 92, borderRadius: 28, display: 'grid', placeItems: 'center', fontSize: '2rem' }}>🤖</motion.div>
      <motion.div className="orb glass" initial={{ opacity: 0, scale: .8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: .8, delay: .15 }}
        style={{ position: 'absolute', top: '20%', right: '8%', width: 76, height: 76, borderRadius: 24, display: 'grid', placeItems: 'center', fontSize: '1.7rem' }}>🎮</motion.div>
      <motion.div className="orb glass" initial={{ opacity: 0, scale: .8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: .8, delay: .3 }}
        style={{ position: 'absolute', bottom: '14%', right: '16%', width: 64, height: 64, borderRadius: 20, display: 'grid', placeItems: 'center', fontSize: '1.5rem' }}>💡</motion.div>
    </div>
  );
}
