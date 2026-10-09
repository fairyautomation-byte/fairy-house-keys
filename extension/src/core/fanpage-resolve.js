/**
 * Resolve Page Object ID từ HTML (hai khái niệm ID — tham khảo zpage/page_co_2_id.md).
 * Rút gọn từ zpage/extension/src/background/index.js (Page Cloner).
 */
(function () {
  'use strict';

  const CACHE_PREFIX = 'zt_fp_resolve:';
  const CACHE_TTL_MS = 30 * 60 * 1000;
  const QUICK_SCAN_MAX = 2500000;

  function getPreferredFacebookOrigin() {
    try {
      const host = String(location?.hostname || '').toLowerCase();
      if (host === 'facebook.com' || host === 'www.facebook.com' || host === 'web.facebook.com') {
        return String(location.origin || 'https://www.facebook.com').replace(/\/+$/, '');
      }
    } catch (_) {
      /* ignore */
    }
    return 'https://www.facebook.com';
  }

  function pcDeprioritizeIdFromSourceUrl(sourceUrl, identifier) {
    try {
      if (sourceUrl && String(sourceUrl).trim()) {
        const u = new URL(String(sourceUrl).trim());
        const idq = u.searchParams.get('id');
        if (idq && /^\d+$/.test(String(idq).trim())) {
          return String(idq).trim();
        }
      }
    } catch (_) {}
    const id = String(identifier || '').trim();
    return /^\d+$/.test(id) ? id : '';
  }

  function pcNormalizeFacebookWebPageUrl(sourceUrl, identifier) {
    const id = String(identifier || '').trim();
    try {
      if (sourceUrl && String(sourceUrl).trim()) {
        const u = new URL(String(sourceUrl).trim());
        const host = u.hostname.replace(/^www\./i, '').toLowerCase();
        if (host === 'facebook.com' || host.endsWith('.facebook.com')) {
          u.protocol = 'https:';
          u.hostname = new URL(getPreferredFacebookOrigin()).hostname;
          u.hash = '';
          return u.toString();
        }
      }
    } catch (_) {}
    if (!id) return null;
    if (/^\d+$/.test(id)) {
      return getPreferredFacebookOrigin() + '/' + encodeURIComponent(id);
    }
    return getPreferredFacebookOrigin() + '/' + encodeURIComponent(id);
  }

  function pcCountPageIdsInHtmlChunk(chunk, counts) {
    if (!chunk) return;
    const patterns = [
      /"page_id"\s*:\s*"(\d{6,24})"/gi,
      /"page_id"\s*:\s*(\d{6,24})\b/gi,
      /\\"page_id\\"\s*:\s*\\"(\d{6,24})\\"/gi,
      /'page_id'\s*:\s*'(\d{6,24})'/gi
    ];
    for (let p = 0; p < patterns.length; p++) {
      const re = patterns[p];
      let m;
      while ((m = re.exec(chunk)) !== null) {
        const pid = m[1];
        if (pid) counts[pid] = (counts[pid] || 0) + 1;
      }
    }
  }

  /**
   * @param {string} html
   * @param {string} deprioritizeId
   * @returns {string[]}
   */
  function pcExtractPageObjectIdsFromFacebookHtml(html, deprioritizeId) {
    if (!html || typeof html !== 'string') return [];
    const counts = Object.create(null);
    const headLen = 12000000;
    const head = html.length > headLen ? html.slice(0, headLen) : html;
    pcCountPageIdsInHtmlChunk(head, counts);
    if (html.length > headLen) {
      const tail = html.slice(-Math.min(5000000, html.length - headLen));
      pcCountPageIdsInHtmlChunk(tail, counts);
    }
    const keys = Object.keys(counts);
    if (!keys.length) return [];
    const dep = String(deprioritizeId || '').trim();
    let ordered;
    if (dep && keys.indexOf(dep) >= 0 && keys.length > 1) {
      const others = keys.filter(function (k) {
        return k !== dep;
      });
      others.sort(function (a, b) {
        return counts[b] - counts[a];
      });
      ordered = others.concat([dep]);
    } else {
      ordered = keys.sort(function (a, b) {
        return counts[b] - counts[a];
      });
    }
    return ordered;
  }

  function pcFacebookHtmlUrlsToTry(sourceUrl, identifier) {
    const id = String(identifier || '').trim();
    const urls = [];
    const u0 = pcNormalizeFacebookWebPageUrl(sourceUrl, id);
    if (u0) urls.push(u0);
    if (/^\d+$/.test(id)) {
      const prof = getPreferredFacebookOrigin() + '/profile.php?id=' + encodeURIComponent(id);
      if (urls.indexOf(prof) < 0) urls.push(prof);
      const pathNum = getPreferredFacebookOrigin() + '/' + encodeURIComponent(id);
      if (urls.indexOf(pathNum) < 0) urls.push(pathNum);
    }
    return urls;
  }

  async function pcFetchFacebookPageHtmlForPageId(webUrl) {
    const w = String(webUrl || '').trim();
    if (!w) return null;
    try {
      const r = await fetch(w, {
        method: 'GET',
        redirect: 'follow',
        credentials: 'include',
        cache: 'no-store',
        headers: {
          Accept: 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8',
          'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
          'Upgrade-Insecure-Requests': '1',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
          'Sec-Ch-Ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
          'Sec-Ch-Ua-Mobile': '?0',
          'Sec-Ch-Ua-Platform': '"Windows"'
        }
      });
      if (!r.ok) return null;
      const text = await r.text();
      return text && text.length > 500 ? text : null;
    } catch (_) {
      return null;
    }
  }

  async function pcFetchMergedFacebookHtmlForPageCloner(sourceUrl, identifier) {
    const urls = pcFacebookHtmlUrlsToTry(sourceUrl, identifier);
    const parts = [];
    for (let i = 0; i < urls.length; i++) {
      const h = await pcFetchFacebookPageHtmlForPageId(urls[i]);
      if (h) parts.push(h);
      if (i < urls.length - 1) await new Promise((r) => setTimeout(r, 100));
    }
    return parts.length ? parts.join('\n') : null;
  }

  function pcLeechNormalizeCandidates(pageId, pageIdCandidates) {
    const out = [];
    const seen = Object.create(null);
    function add(x) {
      const s = String(x || '').trim();
      if (!s || seen[s]) return;
      seen[s] = true;
      out.push(s);
    }
    if (Array.isArray(pageIdCandidates)) {
      for (let i = 0; i < pageIdCandidates.length; i++) {
        add(pageIdCandidates[i]);
      }
    }
    add(pageId);
    return out.length ? out : [];
  }

  function getOgMeta(name) {
    const el = document.querySelector('meta[property="og:' + name + '"]');
    return el && el.getAttribute('content') ? String(el.getAttribute('content')).trim() : '';
  }

  function countRegexMatches(input, regex) {
    if (!input || !regex) return 0;
    let n = 0;
    let m;
    regex.lastIndex = 0;
    while ((m = regex.exec(input)) !== null) {
      n += 1;
      if (n >= 30) break;
    }
    return n;
  }

  /**
   * Fanpage thật thường có cụm tín hiệu "Page" dày hơn profile cá nhân.
   * Ngược lại, profile cá nhân có các marker User/Profile owner rất rõ.
   */
  function classifyPageLikeFromHtml(html) {
    const h = String(html || '');
    if (!h) return { isFanpage: false, pageScore: 0, profileScore: 0 };
    const slice = h.length > QUICK_SCAN_MAX ? h.slice(0, QUICK_SCAN_MAX) : h;

    const pageScore =
      countRegexMatches(slice, /"page_id"\s*:\s*"?(\d{6,24})/gi) * 2 +
      countRegexMatches(slice, /\\"page_id\\"\s*:\s*\\"(\d{6,24})\\"/gi) * 2 +
      countRegexMatches(slice, /"__typename"\s*:\s*"Page"/gi) * 4 +
      countRegexMatches(slice, /"delegate_page_id"\s*:\s*"(\d{6,24})"/gi) * 4 +
      countRegexMatches(slice, /"page_name"\s*:\s*"/gi) +
      countRegexMatches(slice, /"is_page"\s*:\s*true/gi) * 2;

    const profileScore =
      countRegexMatches(slice, /"__typename"\s*:\s*"User"/gi) * 4 +
      countRegexMatches(slice, /"profile_id"\s*:\s*"(\d{5,20})"/gi) * 2 +
      countRegexMatches(slice, /"profile_owner"\s*:\s*\{/gi) * 3 +
      countRegexMatches(slice, /"userID"\s*:\s*"(\d{5,20})"/gi) +
      countRegexMatches(slice, /"viewer_actor_id"\s*:\s*"(\d{5,20})"/gi);

    const isFanpage = pageScore >= 6 && pageScore >= profileScore + 2;
    return { isFanpage, pageScore, profileScore };
  }

  function cacheKeyForPage() {
    try {
      return CACHE_PREFIX + String(location.pathname || '') + '|' + String(location.search || '');
    } catch (_) {
      return CACHE_PREFIX + 'default';
    }
  }

  const FanpageResolver = {
    /**
     * Quét nhanh DOM (không fetch) — có khả năng là Fanpage nếu có chuỗi page_id trong HTML nhúng.
     * @param {number} [maxBytes]
     */
    isLikelyFanpageHtml(html, maxBytes) {
      const h = String(html || '');
      const n = Math.min(maxBytes != null ? maxBytes : 2000000, h.length);
      const slice = n > 0 ? h.slice(0, n) : '';
      return classifyPageLikeFromHtml(slice).isFanpage;
    },

    detectFromDocument() {
      try {
        const el = document.documentElement;
        const h = el && el.innerHTML ? el.innerHTML : '';
        const signal = classifyPageLikeFromHtml(h);
        return signal.isFanpage;
      } catch (_) {
        return false;
      }
    },

    /**
     * @returns {Promise<{ pageIdCandidates: string[], name: string, picture: string, sourceUrl: string }>}
     */
    async getPageIdCandidatesFromCurrentPage() {
      const sourceUrl = String(location.href || '').split('#')[0];
      const ck = cacheKeyForPage();
      try {
        if (typeof chrome !== 'undefined' && chrome.storage?.local) {
          const got = await new Promise((resolve) => {
            chrome.storage.local.get([ck], resolve);
          });
          const row = got[ck];
          if (row && row.expires > Date.now() && Array.isArray(row.pageIdCandidates) && row.pageIdCandidates.length) {
            return {
              pageIdCandidates: row.pageIdCandidates,
              name: row.name || getOgMeta('title'),
              picture: row.picture || getOgMeta('image'),
              sourceUrl
            };
          }
        }
      } catch (_) {}

      let idRaw = '';
      try {
        const u = new URL(location.href);
        if (u.pathname.includes('profile.php')) {
          idRaw = String(u.searchParams.get('id') || '').trim();
        } else {
          const parts = u.pathname.replace(/\/+$/, '').split('/').filter(Boolean);
          if (parts.length === 1 && /^\d{5,20}$/.test(parts[0])) idRaw = parts[0];
        }
      } catch (_) {}

      const merged = await pcFetchMergedFacebookHtmlForPageCloner(sourceUrl, idRaw || '');
      const dep = pcDeprioritizeIdFromSourceUrl(sourceUrl, idRaw);
      let ordered = merged ? pcExtractPageObjectIdsFromFacebookHtml(merged, dep) : [];
      if (!ordered.length && idRaw) {
        ordered = pcLeechNormalizeCandidates(idRaw, []);
      }

      const name = getOgMeta('title');
      const picture = getOgMeta('image');
      const result = {
        pageIdCandidates: ordered,
        name,
        picture,
        sourceUrl
      };

      try {
        if (typeof chrome !== 'undefined' && chrome.storage?.local) {
          const payload = {};
          payload[ck] = {
            pageIdCandidates: ordered,
            name,
            picture,
            expires: Date.now() + CACHE_TTL_MS
          };
          chrome.storage.local.set(payload);
        }
      } catch (_) {}

      return result;
    }
  };

  window.FanpageResolver = FanpageResolver;
})();
