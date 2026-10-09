/* eslint-disable no-unused-vars */
const PushGroupAuth = {
  _getFacebookOrigin(contextWindow) {
    const win = contextWindow || window;
    try {
      const host = String(win?.location?.hostname || '').toLowerCase();
      if (host === 'facebook.com' || host === 'www.facebook.com' || host === 'web.facebook.com') {
        return String(win.location.origin || 'https://www.facebook.com').replace(/\/+$/, '');
      }
    } catch (_) {
      /* ignore */
    }
    return 'https://www.facebook.com';
  },

  /** Cache lsd vài phút — tránh fetch lặp cho từng UID. */
  _lsdCache: { value: '', until: 0 },

  invalidateLsdCache() {
    this._lsdCache = { value: '', until: 0 };
  },

  getAuth() {
    let fbDtsg = null;
    let userId = null;
    let iUser = null;
    let cUser = null;
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const c = cookie.trim();
      if (c.startsWith('c_user=')) {
        const v = c.split('=')[1].trim();
        if (v && v.length >= 5) cUser = v;
      }
      if (c.startsWith('i_user=')) {
        const v = c.split('=')[1].trim();
        if (v && v.length >= 5) iUser = v;
      }
    }

    // Xác định user ID cho GraphQL:
    // - Nếu có c_user (tài khoản cá nhân): dùng c_user
    // - Nếu chỉ có i_user (đang dùng Page): dùng i_user
    const isPageProfile = !cUser && !!iUser;
    userId = cUser || iUser || null;

    if (!userId) {
      try {
        if (window.Env && window.Env.user) userId = String(window.Env.user);
        if (!userId && window.require) {
          const c = window.require('CurrentUserInitialData');
          if (c && c.USER_ID) userId = String(c.USER_ID);
        }
      } catch (_) { /* ignore */ }
    }

    // Khi đang dùng Page, thử tìm real user ID từ HTML/scripts
    if (isPageProfile && userId === iUser) {
      try {
        const html = document.documentElement?.innerHTML || '';
        // Facebook thường nhúng USER_ID cá nhân trong scripts
        const patterns = [
          /"USER_ID"\s*:\s*"(\d{8,20})"/,
          /"actorID"\s*:\s*"(\d{8,20})"/,
          /"viewer_actor"\s*:\s*\{\s*"id"\s*:\s*"(\d{8,20})"/
        ];
        for (const p of patterns) {
          const m = html.match(p);
          if (m && m[1] && m[1] !== iUser) {
            console.log('[TienHouse] Tìm thấy real USER_ID từ HTML:', m[1], '(Page ID:', iUser, ')');
            userId = m[1];
            break;
          }
        }
      } catch (_) { /* ignore */ }
    }

    console.log('[TienHouse] getAuth cookies → c_user:', cUser || 'null', '| i_user:', iUser || 'null', '| final userId:', userId, '| isPage:', isPageProfile);

    if (!userId) return { fbDtsg: null, userId: null };

    fbDtsg = document.querySelector('input[name="fb_dtsg"]')?.value
      || document.querySelector('[name="fb_dtsg"]')?.value;

    if (!fbDtsg && window.__dtsg) {
      fbDtsg = window.__dtsg.token || window.__dtsg;
    }

    if (!fbDtsg) {
      try {
        const m = window.require('DTSGInitialData');
        if (m?.token) fbDtsg = m.token;
      } catch (_) { /* ignore */ }
    }

    if (!fbDtsg) fbDtsg = this._scanScripts();
    if (!fbDtsg) fbDtsg = this._scanPerformance();

    return { fbDtsg, userId };
  },

  _scanScripts() {
    const patterns = [
      /DTSGInitialData["\s]*:["\s]*\{[^}]*"token"["\s]*:["\s]*"([^"]+)"/,
      /"DTSGInitialData":\{[^}]*"token":"([^"]+)"/,
      /fb_dtsg["\s]*:["\s]*"([^"]+)"/,
      /"fb_dtsg":"([^"]+)"/,
      /"token":"([A-Za-z0-9_-]+:[0-9]+:[0-9]+)"/
    ];
    const scripts = document.querySelectorAll('script');
    for (const script of scripts) {
      const txt = script.textContent || '';
      if (txt.length < 10) continue;
      for (const p of patterns) {
        const m = txt.match(p);
        if (m?.[1]?.includes(':')) return m[1];
      }
    }
    return null;
  },

  _scanPerformance() {
    if (!window.performance?.getEntriesByType) return null;
    try {
      const entries = window.performance.getEntriesByType('resource');
      for (const entry of entries) {
        if (!entry.name?.includes('graphql')) continue;
        try {
          const url = new URL(entry.name);
          const v = url.searchParams.get('fb_dtsg');
          if (v) return v;
          const m = entry.name.match(/fb_dtsg=([^&]+)/);
          if (m) return decodeURIComponent(m[1]);
        } catch (_) { /* ignore */ }
      }
    } catch (_) { /* ignore */ }
    return null;
  },

  _getLsdFromPage(win) {
    const w = win || window;
    const doc = w.document;
    if (!doc) return '';
    const patterns = [
      /"lsd"\s*:\s*"([A-Za-z0-9_.-]+)"/,
      /'lsd'\s*:\s*'([A-Za-z0-9_.-]+)'/,
      /[\\]u0022lsd[\\]u0022\s*:\s*[\\]u0022([A-Za-z0-9_.-]+)[\\]u0022/,
      /LSDPayload\s*[=:,]\s*["']([A-Za-z0-9_.-]+)["']/,
      /\["lsd"\][^"]*"([A-Za-z0-9_.-]+)"/,
      /lsd["']?\s*:\s*["']([A-Za-z0-9_.-]{15,50})["']/
    ];
    const scripts = doc.querySelectorAll('script');
    for (const script of scripts) {
      const txt = script.textContent || '';
      if (txt.length < 30) continue;
      for (const p of patterns) {
        const m = txt.match(p);
        if (m?.[1]) return m[1];
      }
    }
    try {
      const html = doc.documentElement?.innerHTML || '';
      if (html.length > 100) {
        const m = html.match(/"lsd"\s*:\s*"([A-Za-z0-9_.-]+)"/);
        if (m?.[1]) return m[1];
      }
    } catch (_) { /* ignore */ }
    try {
      if (w.__lsd && typeof w.__lsd === 'string') return w.__lsd;
      if (w.require && typeof w.require === 'function') {
        const L = w.require('LSDPayload');
        if (L && L.getPayload && typeof L.getPayload === 'function') return L.getPayload() || '';
      }
    } catch (_) { /* ignore */ }
    try {
      const zt = doc.body?.getAttribute?.('data-zt-lsd');
      if (zt && zt.length > 5) return zt;
    } catch (_) { /* ignore */ }
    try {
      const captured = doc.body?.getAttribute?.('data-pg-lsd');
      if (captured && captured.length > 5) return captured;
    } catch (_) { /* ignore */ }
    return '';
  },

  async fetchLsdFromPageAsync(win) {
    const w = win || (typeof window !== 'undefined' ? window : null);
    if (!w?.location?.origin) return '';
    const url = w.location.href || (w.location.origin + w.location.pathname + (w.location.search || ''));
    try {
      const resp = await fetch(url, { method: 'GET', credentials: 'include', cache: 'no-store' });
      const text = await resp.text();
      return this._extractLsdFromHtmlString(text);
    } catch (_) {
      return '';
    }
  },

  /** Bóc token lsd từ chuỗi HTML (View Source / response fetch / JSON escape). */
  _extractLsdFromHtmlString(html) {
    if (!html || typeof html !== 'string') return '';
    const slice = html.length > 900000 ? html.slice(0, 900000) : html;
    const patterns = [
      /"lsd"\s*:\s*"([A-Za-z0-9_.-]{8,120})"/,
      /\\"lsd\\":\\"([A-Za-z0-9_.-]{8,120})\\"/,
      /name=["']lsd["']\s+value=["']([A-Za-z0-9_.-]{8,120})["']/i,
      /name=["']lsd["']\s+[^>]*value=["']([A-Za-z0-9_.-]{8,120})["']/i,
      /"LSD"\s*,\s*"([A-Za-z0-9_.-]{8,120})"/i,
      /\["LSD"\]\s*,\s*"([A-Za-z0-9_.-]{8,120})"/,
      /LSD["']?\s*[:=]\s*["']([A-Za-z0-9_.-]{8,120})["']/i
    ];
    for (const p of patterns) {
      const m = slice.match(p);
      if (m?.[1] && m[1].length >= 8) return m[1];
    }
    return '';
  },

  /**
   * Lấy chắc chắn token `lsd` cho GraphQL.
   * POST graphql không có query trên URL → Performance API thường không có lsd; cần DOM + fetch HTML.
   */
  async ensureLsdAsync(contextWindow) {
    const w = contextWindow || (typeof window !== 'undefined' ? window : null);
    if (!w) return '';

    if (this._lsdCache.until > Date.now() && this._lsdCache.value && this._lsdCache.value.length >= 8) {
      return this._lsdCache.value;
    }

    const tryDom = () => {
      try {
        const cap = w.document?.body?.getAttribute?.('data-zt-lsd');
        if (cap && cap.length >= 8) return cap;
      } catch (_) { /* ignore */ }
      try {
        const inp = w.document?.querySelector?.('input[name="lsd"]');
        if (inp?.value && inp.value.length >= 8) return inp.value;
      } catch (_) { /* ignore */ }
      const fromPage = this._getLsdFromPage(w);
      if (fromPage && fromPage.length >= 8) return fromPage;
      const rp = this.getRequestParams(w);
      if (rp.lsd && String(rp.lsd).length >= 8) return String(rp.lsd);
      return '';
    };

    let lsd = tryDom();
    if (lsd) {
      this._lsdCache = { value: lsd, until: Date.now() + 4 * 60 * 1000 };
      return lsd;
    }

    try {
      const html = w.document?.documentElement?.innerHTML;
      if (html && html.length > 500) {
        lsd = this._extractLsdFromHtmlString(html);
        if (lsd && lsd.length >= 8) {
          this._lsdCache = { value: lsd, until: Date.now() + 4 * 60 * 1000 };
          return lsd;
        }
      }
    } catch (_) { /* ignore */ }

    const urls = [];
    try {
      if (w.location?.href) urls.push(w.location.href);
    } catch (_) { /* ignore */ }
    const fbOrigin = this._getFacebookOrigin(w);
    urls.push(fbOrigin + '/', fbOrigin + '/home.php');
    const seen = new Set();
    for (const url of urls) {
      if (!url || seen.has(url)) continue;
      seen.add(url);
      try {
        const resp = await fetch(url, {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
          headers: { Accept: 'text/html,application/xhtml+xml' }
        });
        const text = await resp.text();
        lsd = this._extractLsdFromHtmlString(text);
        if (lsd) {
          this._lsdCache = { value: lsd, until: Date.now() + 4 * 60 * 1000 };
          return lsd;
        }
      } catch (_) { /* ignore */ }
    }

    lsd = await this.fetchLsdFromPageAsync(w);
    if (lsd && lsd.length >= 8) {
      this._lsdCache = { value: lsd, until: Date.now() + 4 * 60 * 1000 };
      return lsd;
    }

    return '';
  },

  getRequestParams(contextWindow) {
    const win = contextWindow || window;
    const params = {};
    if (!win?.performance?.getEntriesByType) return params;
    try {
      const entries = Array.from(win.performance.getEntriesByType('resource'))
        .filter(e => e.name && (e.name.includes('graphql') || e.name.includes('bnzai') || e.name.includes('bootloader-endpoint')))
        .sort((a, b) => (b.responseEnd || 0) - (a.responseEnd || 0));
      for (const ent of entries) {
        try {
          const url = new URL(ent.name, win.location?.origin || this._getFacebookOrigin(win));
          if (url.searchParams.has('__dyn') || url.searchParams.has('fb_dtsg')) {
            url.searchParams.forEach((val, key) => { if (!params[key]) params[key] = val; });
            if (params.__dyn && params.__csr && params.__hsdp) break;
          }
        } catch (_) { /* ignore */ }
      }
    } catch (_) { /* ignore */ }
    if (!params.lsd) params.lsd = this._getLsdFromPage(win);
    return params;
  },

  generateJazoest(dtsg) {
    let sum = 0;
    for (let i = 0; i < dtsg.length; i++) sum += dtsg.charCodeAt(i);
    return '2' + sum;
  }
};
