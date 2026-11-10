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
  enabled: true,
  showDevOutlines: false,

  adsterra: {
    enabled: true,
    codes: {
      bannerDesktop: '<script>atOptions={\'key\':\'a218e5964a1209df7e6e5346b5e24c8e\',\'format\':\'iframe\',\'height\':90,\'width\':728,\'params\':{}};</script><script src="https://bauval.org/22/a218e5964a1209df7e6e5346b5e24c8e"></script>',
      bannerMobile: '<script>atOptions={\'key\':\'f67d660cd4c17a2c54f08acbdc4dc668\',\'format\':\'iframe\',\'height\':50,\'width\':320,\'params\':{}};</script><script src="https://bauval.org/22/f67d660cd4c17a2c54f08acbdc4dc668"></script>',
      native: '<script async="async" data-cfasync="false" src="https://bauval.org/21/974d01a39860bcd233c5e2a9404154b1"></script><div id="container-974d01a39860bcd233c5e2a9404154b1"></div>',
      nativeBanner: '<script async="async" data-cfasync="false" src="https://bauval.org/21/974d01a39860bcd233c5e2a9404154b1"></script><div id="container-974d01a39860bcd233c5e2a9404154b1"></div>', // native banner format — empty until owner creates it in Adsterra
      inArticle: '<script>atOptions={\'key\':\'28b7ecd66baa8eafc889099c5e07509d\',\'format\':\'iframe\',\'height\':250,\'width\':300,\'params\':{}};</script><script src="https://bauval.org/22/28b7ecd66baa8eafc889099c5e07509d"></script>',
      sidebar: '<script>atOptions={\'key\':\'28b7ecd66baa8eafc889099c5e07509d\',\'format\':\'iframe\',\'height\':250,\'width\':300,\'params\':{}};</script><script src="https://bauval.org/22/28b7ecd66baa8eafc889099c5e07509d"></script>',
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
    bannerDesktop: { network: 'adsterra' },
    bannerMobile: { network: 'adsterra' },
    native: { network: 'adsterra' },
    nativeBanner: { network: 'adsterra' },
    inArticle: { network: 'adsterra' },
    sidebar: { network: 'adsterra' },
    responsive: { network: 'none' },
    socialBar: { network: 'none' },
    popunder: { network: 'none' },
    header: { network: 'none' },
    footer: { network: 'none' },
  } as Record<string, { network: 'none' | 'adsense' | 'adsterra' }>,

  /** Per page-type toggles (still require everything above). */
  pages: { home: true, article: true, tools: true, products: true },
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

/** Parse a stored Adsterra snippet into the values the consent-gated loader
 *  needs. Banner snippets carry an atOptions key + invoke script URL; the
 *  native snippet carries a script URL + a container element id. */
export interface ParsedAdCode { type: 'banner' | 'native'; key: string; src: string; width: number; height: number; containerId: string }
export function parseAdCode(code: string): ParsedAdCode | null {
  const src = /src="(https:[^"]+)"/.exec(code)?.[1] ?? '';
  const containerId = /id="(container-[a-z0-9]+)"/.exec(code)?.[1] ?? '';
  if (containerId) {
    const key = containerId.replace('container-', '');
    return src ? { type: 'native', key, src, width: 0, height: 0, containerId } : null;
  }
  const key = /'key'\s*:\s*'([a-z0-9]+)'/.exec(code)?.[1] ?? '';
  const width = Number(/'width'\s*:\s*(\d+)/.exec(code)?.[1] ?? 0);
  const height = Number(/'height'\s*:\s*(\d+)/.exec(code)?.[1] ?? 0);
  return key && src ? { type: 'banner', key, src, width, height, containerId: '' } : null;
}

let adsLoadStarted = false;

/** Consent-gated ad loader. HARD RULES: does nothing unless the master
 *  switch is on AND localStorage 'nexa-consent' === 'accepted'. Ad scripts
 *  are created dynamically ONLY at that moment — the built HTML contains
 *  no ad-network script tags, so a visitor who declines (or has not chosen)
 *  loads zero advertising scripts. Slots hidden by responsive CSS (e.g. the
 *  desktop banner on a phone) are skipped. Banner units are injected one at
 *  a time because each relies on the shared global `atOptions`. */
export function loadAdsWhenConsented(): void {
  if (!adsConfig.enabled || adsLoadStarted) return;
  try { if (localStorage.getItem('nexa-consent') !== 'accepted') return; } catch { return; }
  adsLoadStarted = true;
  const slots = Array.from(document.querySelectorAll<HTMLElement>('[data-ad-slot]'))
    .filter((el) => el.getClientRects().length > 0);
  void (async () => { for (const el of slots) { await injectAd(el); } })();
}

function injectAd(el: HTMLElement): Promise<void> {
  return new Promise((resolve) => {
    const type = el.dataset.adType; const src = el.dataset.adSrc ?? '';
    if (!src) { resolve(); return; }
    if (type === 'native') {
      const box = document.createElement('div');
      box.id = el.dataset.adContainer ?? '';
      el.appendChild(box);
      const sc = document.createElement('script');
      sc.async = true; sc.src = src; sc.setAttribute('data-cfasync', 'false');
      sc.onload = () => resolve(); sc.onerror = () => resolve();
      el.appendChild(sc);
      return;
    }
    (window as unknown as Record<string, unknown>)['atOptions'] = {
      key: el.dataset.adKey ?? '', format: 'iframe',
      height: Number(el.dataset.adHeight ?? 0), width: Number(el.dataset.adWidth ?? 0), params: {},
    };
    const sc = document.createElement('script');
    sc.src = src;
    sc.onload = () => resolve(); sc.onerror = () => resolve();
    el.appendChild(sc);
  });
}
