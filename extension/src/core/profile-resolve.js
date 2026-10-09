(function () {
  'use strict';

  /** Đường dẫn một segment — không phải profile (trang hệ thống / công cụ). */
  const RESERVED_FIRST_SEG = new Set([
    'stories',
    'reel',
    'watch',
    'marketplace',
    'gaming',
    'groups',
    'events',
    'ads',
    'pages',
    'settings',
    'messages',
    'notifications',
    'friends',
    'saved',
    'login',
    'recover',
    'checkpoint',
    'help',
    'legal',
    'privacy',
    'me',
    'home.php',
    'search',
    'bookmarks',
    'commerce',
    'shop',
    'pay',
    'reg',
    'campaign',
    'business',
    'adsmanager',
    'ads',
    'policies',
    'lite',
    'pg',
    'photo',
    'photos',
    'videos',
    'people',
    'hashtag',
    'pfbid',
    'permalink.php',
    'story.php',
    'share',
    'dialog',
    'plugins',
    'dialog'
  ]);

  const CACHE_PREFIX = 'zt-profile-id-v5:';
  const CACHE_TTL_MS = 30 * 60 * 1000;

  function isLikelyProfilePath(pathname) {
    const p = String(pathname || '').replace(/\/+$/, '') || '/';
    if (p === '/' || p === '') return false;
    if (p.includes('/groups/')) return false;
    if (p.startsWith('/profile.php')) return true;
    const parts = p.split('/').filter(Boolean);
    if (parts.length !== 1) return false;
    const seg = parts[0].toLowerCase();
    if (RESERVED_FIRST_SEG.has(seg)) return false;
    if (/^pfbid/i.test(seg)) return false;
    return true;
  }

  /** UID tài khoản đang đăng nhập (cookie) — không dùng làm UID profile đang xem khi có ứng viên khác. */
  function getViewerUserId() {
    try {
      const parts = String(document.cookie || '').split(';');
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i].trim();
        if (p.startsWith('c_user=')) {
          return String(p.split('=')[1] || '')
            .trim()
            .replace(/\D/g, '');
        }
      }
    } catch (_) {
      /* ignore */
    }
    return '';
  }

  /**
   * Chỉ quét ~180KB đầu — UID nằm trong JSON đầu trang.
   * Tránh `while (re.exec)` trên hàng MB HTML (đơ main thread, Chrome báo Page Unresponsive).
   * @param {string} excludeUserId — thường là UID người xem; nếu có ≥2 UID khác nhau thì bỏ UID này khỏi vote (tránh nhầm nick đang quét).
   */
  function extractIdFromHtml(html, excludeUserId) {
    if (!html || typeof html !== 'string') return '';
    const maxScan = 420000;
    const chunk = html.length > maxScan ? html.slice(0, maxScan) : html;
    const patterns = [
      /profile\.php\?[^"'<>]*\bid=(\d{5,20})\b/i,
      /\/profile\.php\?id=(\d{5,20})\b/,
      /"userID"\s*:\s*"(\d{5,20})"/,
      /"user_id"\s*:\s*"(\d{5,20})"/,
      /"USER_ID"\s*:\s*"(\d{5,20})"/,
      /"entity_id"\s*:\s*"(\d{5,20})"/,
      /"profile_id"\s*:\s*"(\d{5,20})"/,
      /"actorID"\s*:\s*"(\d{5,20})"/,
      /"target_id"\s*:\s*"(\d{5,20})"/,
      /"owner"\s*:\s*\{\s*"id"\s*:\s*"(\d{5,20})"/,
      /"profile_owner"\s*:\s*\{[^}]*"id"\s*:\s*"(\d{5,20})"/,
      /"user"\s*:\s*\{\s*"__typename"\s*:\s*"User"\s*,\s*"id"\s*:\s*"(\d{5,20})"/,
      /"timeline_list_feed_units"[\s\S]{0,1200}?"id"\s*:\s*"(\d{5,20})"/
    ];
    const counts = new Map();
    for (const re of patterns) {
      try {
        re.lastIndex = 0;
        const m = re.exec(chunk);
        if (m && m[1]) {
          const id = m[1];
          counts.set(id, (counts.get(id) || 0) + 1);
        }
      } catch (_) {
        /* ignore */
      }
    }
    if (counts.size === 0) return '';
    const ex = String(excludeUserId || '')
      .trim()
      .replace(/\D/g, '');
    if (ex && counts.has(ex) && counts.size >= 2) {
      counts.delete(ex);
    }
    if (counts.size === 0) return '';
    return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
  }

  function escapeRegexPart(s) {
    return String(s || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Cặp chuẩn trong view-source Facebook: "profile_id":"1000…","vanity":"duythai6368"
   * (và đảo thứ tự) — ưu tiên tuyệt đối, không nhầm với c_user.
   */
  function extractByProfileIdVanityPair(html, vanitySeg) {
    if (!html || !vanitySeg) return '';
    const ev = escapeRegexPart(String(vanitySeg).trim());
    if (!ev) return '';
    const max = html.length > 8000000 ? html.slice(0, 8000000) : html;
    const patterns = [
      new RegExp('"profile_id"\\s*:\\s*"(\\d{5,20})"\\s*,\\s*"vanity"\\s*:\\s*"' + ev + '"'),
      new RegExp('"vanity"\\s*:\\s*"' + ev + '"\\s*,\\s*"profile_id"\\s*:\\s*"(\\d{5,20})"'),
      new RegExp('"profile_id":"(\\d{5,20})","vanity":"' + ev + '"'),
      new RegExp('"vanity":"' + ev + '","profile_id":"(\\d{5,20})"')
    ];
    for (let i = 0; i < patterns.length; i++) {
      try {
        patterns[i].lastIndex = 0;
        const m = patterns[i].exec(max);
        if (m && m[1] && /^\d{5,20}$/.test(m[1])) return m[1];
      } catch (_) {
        /* ignore */
      }
    }
    return '';
  }

  /**
   * Giống view-source: tìm chuỗi "vanity":"username" rồi lấy profile_id/userID trong cửa sổ JSON lân cận
   * (Facebook đôi khi không đặt hai key liền nhau đủ để regex cặp bắt một lần).
   */
  function extractProfileIdNearVanityLabel(html, vanitySeg) {
    if (!html || !vanitySeg) return '';
    const v = String(vanitySeg).trim();
    if (!v) return '';
    const needles = [
      '"vanity":"' + v + '"',
      '"vanity" : "' + v + '"',
      '"vanity": "' + v + '"',
      '"userVanity":"' + v + '"',
      '"username":"' + v + '"'
    ];
    const maxLen = html.length > 8000000 ? 8000000 : html.length;
    const hay = maxLen < html.length ? html.slice(0, maxLen) : html;
    const radius = 4500;
    for (let n = 0; n < needles.length; n++) {
      const needle = needles[n];
      let pos = 0;
      while (pos < hay.length) {
        const i = hay.indexOf(needle, pos);
        if (i < 0) break;
        const start = Math.max(0, i - radius);
        const end = Math.min(hay.length, i + needle.length + radius);
        const win = hay.slice(start, end);
        const tryRe = [
          /"profile_id"\s*:\s*"(\d{5,20})"/,
          /"owning_profile_id"\s*:\s*"(\d{5,20})"/,
          /"userID"\s*:\s*"(\d{5,20})"/,
          /"entity_id"\s*:\s*"(\d{5,20})"/
        ];
        for (let r = 0; r < tryRe.length; r++) {
          const m = win.match(tryRe[r]);
          if (m && m[1] && /^\d{5,20}$/.test(m[1])) return m[1];
        }
        pos = i + 1;
      }
    }
    return '';
  }

  /**
   * UID chủ profile trong HTML của đúng URL /vanity/ — tìm cặp username|vanity với id (không vote theo tần suất như extractIdFromHtml).
   */
  function extractOwnerIdNearVanity(html, vanitySeg, excludeUserId) {
    if (!html || !vanitySeg) return '';
    const v = String(vanitySeg).trim();
    if (!v) return '';
    const ex = String(excludeUserId || '').replace(/\D/g, '');
    const slice = html.length > 900000 ? html.slice(0, 900000) : html;
    const ev = escapeRegexPart(v);

    const tryPatterns = [
      new RegExp('"username"\\s*:\\s*"' + ev + '"[\\s\\S]{0,4000}?"id"\\s*:\\s*"(\\d{5,20})"', 'i'),
      new RegExp('"vanity"\\s*:\\s*"' + ev + '"[\\s\\S]{0,4000}?"id"\\s*:\\s*"(\\d{5,20})"', 'i'),
      new RegExp('"userVanity"\\s*:\\s*"' + ev + '"[\\s\\S]{0,4000}?"id"\\s*:\\s*"(\\d{5,20})"', 'i'),
      new RegExp('"id"\\s*:\\s*"(\\d{5,20})"[\\s\\S]{0,2000}?"username"\\s*:\\s*"' + ev + '"', 'i'),
      new RegExp('"profile_id"\\s*:\\s*"(\\d{5,20})"[\\s\\S]{0,3000}?"username"\\s*:\\s*"' + ev + '"', 'i'),
      new RegExp('facebook\\.com\\/' + ev + '\\/?[^"\\s]*"[\\s\\S]{0,2500}?"user_id"\\s*:\\s*"(\\d{5,20})"', 'i'),
      new RegExp('"' + ev + '"[\\s\\S]{0,3500}?"profile_id"\\s*:\\s*"(\\d{5,20})"', 'i')
    ];

    for (let i = 0; i < tryPatterns.length; i++) {
      try {
        const m = slice.match(tryPatterns[i]);
        if (m && m[1] && /^\d{5,20}$/.test(m[1])) {
          if (ex && m[1] === ex) continue;
          return m[1];
        }
      } catch (_) {
        /* ignore */
      }
    }
    return '';
  }

  /**
   * Trang /vanity/: 1) profile_id+vanity 2) JSON gần username 3) đếm — không trả c_user làm UID profile người khác.
   */
  function extractUidFromVanityPageHtml(html, vanity, viewer) {
    const pair = extractByProfileIdVanityPair(html, vanity);
    if (pair) {
      console.info('[ZT] UID từ cặp profile_id + vanity (giống view-source):', pair, '| vanity:', vanity);
      return pair;
    }
    const nearLabel = extractProfileIdNearVanityLabel(html, vanity);
    if (nearLabel) {
      console.info('[ZT] UID từ cửa sổ JSON quanh nhãn vanity (view-source):', nearLabel, '| vanity:', vanity);
      return nearLabel;
    }
    const near = extractOwnerIdNearVanity(html, vanity, viewer);
    if (near) {
      console.info('[ZT] UID từ JSON gần username/vanity:', near, '| vanity:', vanity);
      return near;
    }
    const ex = String(viewer || '').replace(/\D/g, '');
    const fb = extractIdFromHtml(html, viewer);
    if (fb && ex && fb === ex) {
      console.warn(
        '[ZT] Bỏ fallback đếm HTML — trùng c_user, không dùng làm UID profile vanity:',
        vanity
      );
      return '';
    }
    if (fb) console.info('[ZT] UID từ fallback đếm HTML (trang /' + vanity + '/):', fb);
    return fb;
  }

  /**
   * DOM trang đang mở — giống «Xem nguồn trang»: quét từng script đầy đủ + outerHTML,
   * không cắt 900KB đầu (dễ lỡ block JSON chứa profile_id + vanity).
   */
  function extractIdFromCurrentDocumentForVanity(vanitySeg) {
    try {
      const viewer = getViewerUserId();
      const og = document.querySelector('meta[property="og:url"]');
      if (og?.content) {
        const um = String(og.content).match(/[?&]id=(\d{5,20})\b/i);
        if (um && um[1]) return um[1];
      }
      const scripts = document.querySelectorAll('script:not([src])');
      for (let i = 0; i < scripts.length; i++) {
        const t = scripts[i].textContent || '';
        if (t.length < 40) continue;
        const id = extractUidFromVanityPageHtml(t, vanitySeg, viewer);
        if (id && /^\d{5,20}$/.test(id)) return id;
      }
      const root = document.documentElement;
      if (root) {
        const html = root.outerHTML || '';
        if (html.length > 0) {
          const id = extractUidFromVanityPageHtml(
            html.length > 8000000 ? html.slice(0, 8000000) : html,
            vanitySeg,
            viewer
          );
          if (id && /^\d{5,20}$/.test(id)) return id;
        }
      }
      let buf = '';
      for (let j = 0; j < scripts.length; j++) {
        buf += scripts[j].textContent || '';
        if (buf.length > 480000) break;
      }
      return extractUidFromVanityPageHtml(buf, vanitySeg, viewer);
    } catch (_) {
      return '';
    }
  }

  async function readCache(key) {
    try {
      const r = await chrome.storage.local.get(key);
      const row = r[key];
      if (!row || typeof row !== 'object') return null;
      if (Date.now() > (row.exp || 0)) return null;
      return row.id || null;
    } catch (_) {
      return null;
    }
  }

  async function writeCache(key, id) {
    try {
      await chrome.storage.local.set({
        [key]: { id: String(id), exp: Date.now() + CACHE_TTL_MS }
      });
    } catch (_) {
      /* ignore */
    }
  }

  /** Tránh gọi fetch song song nhiều lần cho cùng vanity (observer + interval). */
  const vanityInflight = new Map();

  async function fetchVanityProfileId(vanity) {
    let task = vanityInflight.get(vanity);
    if (!task) {
      task = (async function () {
        const key = CACHE_PREFIX + vanity.toLowerCase();
        const cached = await readCache(key);
        if (cached) return cached;

        const currentHost = String(location?.hostname || '').toLowerCase();
        const isFacebookHost =
          currentHost === 'facebook.com' || currentHost === 'www.facebook.com' || currentHost === 'web.facebook.com';
        const fbOrigin = isFacebookHost ? String(location.origin || 'https://www.facebook.com').replace(/\/+$/, '') : 'https://www.facebook.com';
        const url = fbOrigin + '/' + encodeURIComponent(vanity) + '/';
        const resp = await fetch(url, {
          method: 'GET',
          credentials: 'include',
          redirect: 'follow',
          headers: {
            Accept: 'text/html,application/xhtml+xml',
            'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate'
          }
        });
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        const html = await resp.text();
        let viewer = '';
        try {
          const parts = String(document.cookie || '').split(';');
          for (let i = 0; i < parts.length; i++) {
            const p = parts[i].trim();
            if (p.startsWith('c_user=')) {
              viewer = String(p.split('=')[1] || '')
                .trim()
                .replace(/\D/g, '');
              break;
            }
          }
        } catch (_) {
          /* ignore */
        }
        const id = extractUidFromVanityPageHtml(html, vanity, viewer);
        if (!id) throw new Error('Không trích được UID từ trang profile');
        await writeCache(key, id);
        return id;
      })();
      vanityInflight.set(vanity, task);
      task.finally(function () {
        if (vanityInflight.get(vanity) === task) vanityInflight.delete(vanity);
      });
    }
    return task;
  }

  /** Đã resolve UID cho path hiện tại (tránh lặp khi inject-button chạy lại liên tục). */
  let sessionPathKey = '';
  let sessionResolvedId = null;

  function currentPathKey() {
    return String(location.pathname || '') + '|' + String(location.search || '');
  }

  const ProfileResolver = {
    RESERVED_FIRST_SEG,

    isLikelyProfilePath,

    /**
     * UID profile từ URL hiện tại (profile.php, /1000…/, hoặc vanity).
     * @returns {Promise<string|null>}
     */
    async getProfileIdFromCurrentPage() {
      const pk = currentPathKey();
      const viewerLog = getViewerUserId();
      if (sessionPathKey === pk && sessionResolvedId) {
        console.info(
          '[ZT] UID profile (cache phiên):',
          sessionResolvedId,
          '| URL:',
          location.href.split('?')[0],
          '| c_user (nick đang đăng nhập):',
          viewerLog || '(không đọc được)'
        );
        return sessionResolvedId;
      }

      const path = location.pathname || '';
      const search = location.search || '';

      if (/profile\.php/i.test(path)) {
        try {
          const id = new URLSearchParams(search).get('id');
          if (id && /^\d{5,20}$/.test(id)) {
            sessionPathKey = pk;
            sessionResolvedId = id;
            console.info('[ZT] UID từ profile.php?id=', id, '| c_user:', viewerLog);
            return id;
          }
        } catch (_) {
          /* ignore */
        }
        sessionPathKey = pk;
        sessionResolvedId = null;
        return null;
      }

      const numPath = path.match(/^\/(\d{5,20})\/?$/);
      if (numPath) {
        sessionPathKey = pk;
        sessionResolvedId = numPath[1];
        console.info('[ZT] UID từ đường dẫn /số/', numPath[1], '| c_user:', viewerLog);
        return numPath[1];
      }

      if (!isLikelyProfilePath(path)) {
        sessionPathKey = pk;
        sessionResolvedId = null;
        return null;
      }

      const seg = path.split('/').filter(Boolean)[0];
      if (!seg) {
        sessionPathKey = pk;
        sessionResolvedId = null;
        return null;
      }

      const fromDomFirst = extractIdFromCurrentDocumentForVanity(seg);
      if (fromDomFirst && /^\d{5,20}$/.test(fromDomFirst)) {
        sessionPathKey = pk;
        sessionResolvedId = fromDomFirst;
        if (viewerLog && fromDomFirst === viewerLog) {
          console.warn(
            '[ZT] UID từ DOM (giống view-source) trùng c_user — có thể đúng nếu đây là profile bạn | vanity:',
            seg
          );
        } else {
          console.info(
            '[ZT] UID chủ profile từ DOM trang đang mở (view-source / script):',
            fromDomFirst,
            '| vanity:',
            seg,
            '| c_user:',
            viewerLog
          );
        }
        return fromDomFirst;
      }

      try {
        console.info(
          '[ZT] DOM chưa bóc được UID — thử GET /' + seg + '/ (fetch) | c_user:',
          viewerLog
        );
        const id = await fetchVanityProfileId(seg);
        if (id && /^\d{5,20}$/.test(String(id))) {
          sessionPathKey = pk;
          sessionResolvedId = id;
          if (viewerLog && String(id) === viewerLog) {
            console.info('[ZT] UID = c_user — có thể bạn đang xem chính profile của bạn (vanity khớp).', seg);
          } else {
            console.info('[ZT] UID chủ profile (từ fetch HTML):', id, '| vanity:', seg, '| c_user:', viewerLog);
          }
          return id;
        }
      } catch (e) {
        console.warn('[ZT] Fetch vanity thất bại:', e?.message || e);
      }

      sessionPathKey = pk;
      sessionResolvedId = null;
      console.warn('[ZT] Không resolve được UID cho vanity:', seg);
      return null;
    },

    /**
     * Resolve UID từ vanity (gọi từ modal qua bridge khi cần).
     * @param {string} vanity
     * @returns {Promise<string|null>}
     */
    async resolveVanity(vanity) {
      const v = String(vanity || '')
        .replace(/\/+$/, '')
        .trim();
      if (!v || !/^[a-zA-Z0-9._-]{2,80}$/.test(v) || /^pfbid/i.test(v)) return null;
      try {
        const id = await fetchVanityProfileId(v);
        return id || null;
      } catch (e) {
        console.warn('[ZT ProfileResolver] resolveVanity', e?.message || e);
        return null;
      }
    }
  };

  window.ProfileResolver = ProfileResolver;
})();
