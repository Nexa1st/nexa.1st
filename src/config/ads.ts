/**
 * NEXA — CENTRAL ADVERTISING CONFIG (AdSense + Adsterra, separate modules)
 * =========================================================================
 * HARD STATE (do not change without the site owner's genuine codes):
 * - ALL ads DISABLED: master `enabled:false` AND each network's own
 *   `enabled:false`. Every code field is an EMPTY STRING.
 * - Every position's network is 'none' — the conflict rule: ONE network per
 *   position, a slot renders at most one network, and 'none' renders nothing.
 * - No publisher IDs/codes invented, no ad-network script loaded anywhere
 *   while disabled, components render NOTHING in production in this state.
 * - The owner's Adsterra account currently holds ONLY a Direct Link
 *   (Smartlink) — NOT a banner/native code; never paste/ embed it as an ad.
 *
 * ACTIVATION (post-deploy, owner only): add+approve the domain in the chosen
 * network -> create real website placements -> paste genuine codes below ->
 * set that position's `network` -> set that network's `enabled:true` (and the
 * master switch) -> rebuild. The loader also checks cookie consent first.
 */
export const adsConfig = {
  enabled: false,
  showDevOutlines: false,

  adsterra: {
    enabled: false,
    codes: {
      bannerDesktop: '',
      bannerMobile: '',
      native: '',
      nativeBanner: '', // native banner format — empty until owner creates it in Adsterra
      inArticle: '',
      sidebar: '',
      responsive: '',
      socialBar: '',
      popunder: '',
    },
  },
  adsense: {
    enabled: false,
    codes: {
      client: '',
      slotHeader: '',
      slotInArticle: '',
      slotSidebar: '',
      slotFooter: '',
      slotResponsive: '',
    },
  },

  /** CONFLICT RULE: exactly one network per position. All 'none' by default. */
  positions: {
    bannerDesktop: { network: 'none' },
    bannerMobile: { network: 'none' },
    native: { network: 'none' },
    nativeBanner: { network: 'none' },
    inArticle: { network: 'none' },
    sidebar: { network: 'none' },
    responsive: { network: 'none' },
    socialBar: { network: 'none' },
    popunder: { network: 'none' },
    header: { network: 'none' },
    footer: { network: 'none' },
  } as Record<string, { network: 'none' | 'adsense' | 'adsterra' }>,

  /** Per page-type toggles (still require everything above). */
  pages: { home: false, article: false, tools: false, products: false },
} as const;

export type AdPlacement = keyof typeof adsConfig.positions;
export type AdPageType = keyof typeof adsConfig.pages;

export function resolveAdCode(placement: AdPlacement): { network: string; code: string } {
  const network = adsConfig.positions[placement]?.network ?? 'none';
  if (network === 'adsterra') {
    const c = (adsConfig.adsterra.codes as Record<string, string>)[placement] ?? '';
    return { network, code: c };
  }
  if (network === 'adsense') {
    const map: Record<string, string> = {
      bannerDesktop: adsConfig.adsense.codes.slotHeader, header: adsConfig.adsense.codes.slotHeader,
      inArticle: adsConfig.adsense.codes.slotInArticle, sidebar: adsConfig.adsense.codes.slotSidebar,
      footer: adsConfig.adsense.codes.slotFooter, responsive: adsConfig.adsense.codes.slotResponsive,
      native: adsConfig.adsense.codes.slotResponsive, nativeBanner: adsConfig.adsense.codes.slotResponsive,
      bannerMobile: adsConfig.adsense.codes.slotHeader,
    };
    return { network, code: map[placement] ?? '' };
  }
  return { network: 'none', code: '' };
}

/** A slot may render only when: master on + that network on + position network
 *  set + page-type on + a genuine non-empty code exists. */
export function adSlotActive(placement: AdPlacement, pageType: AdPageType): boolean {
  const { network, code } = resolveAdCode(placement);
  if (network === 'none' || !code.trim()) return false;
  const networkOn = network === 'adsterra' ? adsConfig.adsterra.enabled : adsConfig.adsense.enabled;
  return Boolean(adsConfig.enabled && networkOn && adsConfig.pages[pageType]);
}

/** Future ad loader stub: NO network call while disabled. When activated it
 *  must re-check `enabled` and cookie consent before injecting anything. */
export function loadAdsWhenConsented(): void {
  if (!adsConfig.enabled) return;
  try { if (localStorage.getItem('nexa-consent') !== 'accepted') return; } catch { return; }
  // Intentionally empty until genuine owner codes exist.
}
