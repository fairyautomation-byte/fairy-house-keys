(function () {
  'use strict';

  if (typeof location === 'undefined') return;
  const FB_ALLOWED_HOSTS = new Set(['facebook.com', 'www.facebook.com', 'web.facebook.com']);
  if (!FB_ALLOWED_HOSTS.has(String(location.hostname || '').toLowerCase())) return;

  function isMessengerThreadPath(p) {
    return /^\/messages\/(?:e2ee\/)?t\/\d+/i.test(String(p || ''));
  }

  /** Chỉ `/messages/e2ee/t/…` — DOM khác; neo sidebar cần heuristic riêng (không áp dụng cho `/messages/t/`). */
  function isMessengerE2eePath() {
    return /\/messages\/e2ee\/t\//i.test(String(location.pathname || ''));
  }

  const LINK_ID = 'zt-biz-inbox-phone-css';
  const ROOT_ID = 'zt-fb-messenger-phone-root';
  const DEBOUNCE_MS = 450;
  const HTML_SCAN_MAX = 9000000;

  const LABEL_ENCRYPTED_VI = 'Được mã hóa đầu cuối';
  const LABEL_ENCRYPTED_EN = 'End-to-end encrypted';

  const ICON_PHONE =
    '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true">' +
    '<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />' +
    '</svg>';

  const ICON_CHAT =
    '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true">' +
    '<path stroke-linecap="round" stroke-linejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337L5.05 21l1.395-3.72C5.512 15.042 5 13.574 5 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />' +
    '</svg>';

  let mobTimer = null;
  let scheduleTimer = null;
  /** Thread đã xử lý — đổi hội thoại SPA (không reload) thì reset cache / inflight. */
  let lastHandledThreadId = '';
  let pathPollTimer = null;
  let lastPolledPath = '';
  /** @type {{ threadId: string, uid: string, raw: string|null }|null} */
  let phoneLookupCache = null;
  let inflightKey = '';

  function digitsOnly(s) {
    return String(s || '').replace(/\D/g, '');
  }

  function formatPhone84to09(raw) {
    if (!raw) return '';
    const d = digitsOnly(raw);
    if (d.startsWith('84') && d.length >= 10) return '0' + d.slice(2);
    return String(raw).trim();
  }

  function hrefTelFromDigits(digits) {
    const d = digitsOnly(digits);
    if (!d) return '#';
    if (d.startsWith('84') && d.length >= 10) return 'tel:+' + d;
    if (d.startsWith('0')) return 'tel:' + d;
    return 'tel:' + d;
  }

  function hrefZaloFromDigits(digits) {
    const d = digitsOnly(digits);
    if (!d) return '#';
    let n = d;
    if (n.startsWith('0')) n = '84' + n.slice(1);
    else if (!n.startsWith('84')) n = '84' + n;
    return 'https://zalo.me/' + n;
  }

  function escHtml(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

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

  function getThreadIdFromPath() {
    const p = String(location.pathname || '');
    const m = p.match(/\/messages\/(?:e2ee\/)?t\/(\d{5,24})\/?$/i);
    return m && m[1] ? m[1] : '';
  }

  function getPageHtmlSlice() {
    try {
      const root = document.documentElement;
      const h = root && root.outerHTML ? root.outerHTML : '';
      if (h.length > HTML_SCAN_MAX) return h.slice(0, HTML_SCAN_MAX);
      return h;
    } catch (_) {
      return '';
    }
  }

  /**
   * Cắt đoạn HTML quanh thread hiện tại — Messenger thường `/messages/t/{id}` không có chuỗi `thread_id` JSON.
   */
  function buildThreadContextSlice(threadId, html) {
    const tid = String(threadId);
    if (!tid || !html) return '';
    const needles = [
      '"thread_id":"' + tid + '"',
      '"threadId":"' + tid + '"',
      '"message_thread_id":"' + tid + '"',
      '"open_thread_id":"' + tid + '"',
      'thread_id":"' + tid,
      '/messages/e2ee/t/' + tid,
      '/messages/t/' + tid,
      'messages%2Ft%2F' + tid,
      'messages%252Ft%252F' + tid
    ];
    let best = '';
    let bestScore = 0;
    for (let n = 0; n < needles.length; n++) {
      const needle = needles[n];
      const idx = html.indexOf(needle);
      if (idx < 0) continue;
      const slice = html.slice(Math.max(0, idx - 1800), Math.min(html.length, idx + 20000));
      const score = slice.length + (n < 4 ? 1000 : 0);
      if (score > bestScore) {
        bestScore = score;
        best = slice;
      }
    }
    if (best) return best;
    if (tid.length < 14 || tid.length > 22) return '';
    let pos = 0;
    while (pos < html.length) {
      const idx = html.indexOf(tid, pos);
      if (idx < 0) break;
      const before = idx > 0 ? html.charAt(idx - 1) : '';
      const after = html.charAt(idx + tid.length);
      if (!/\d/.test(before) && !/\d/.test(after)) {
        return html.slice(Math.max(0, idx - 2200), Math.min(html.length, idx + 20000));
      }
      pos = idx + 1;
    }
    return '';
  }

  /**
   * Bóc UID đối phương từ JSON nhúng: participant_id / ent_id trong slice của thread này.
   * Loại trừ c_user (người xem).
   */
  function extractOtherParticipantUid(threadId, html) {
    if (!threadId || !html) return '';
    const viewer = getViewerUserId();
    const tid = String(threadId);

    const slice = buildThreadContextSlice(tid, html);
    if (!slice) {
      return '';
    }

    const collect = function (re, text) {
      const out = [];
      let m;
      const r = new RegExp(re.source, 'g');
      while ((m = r.exec(text)) !== null) {
        if (m[1] && /^\d{10,20}$/.test(m[1])) out.push(m[1]);
      }
      return out;
    };

    const candidates = collect(/"participant_id"\s*:\s*"(\d{10,20})"/g, slice);

    const uniq = [];
    const seen = new Set();
    for (let i = 0; i < candidates.length; i++) {
      const id = candidates[i];
      if (!seen.has(id)) {
        seen.add(id);
        uniq.push(id);
      }
    }

    const nonSelf = uniq.filter(function (id) {
      return id !== viewer;
    });
    if (nonSelf.length === 1) return nonSelf[0];
    if (nonSelf.length > 1) {
      return nonSelf[0];
    }

    const ent = collect(/"ent_id"\s*:\s*"(\d{10,20})"/g, slice);
    for (let j = 0; j < ent.length; j++) {
      if (ent[j] && ent[j] !== viewer) return ent[j];
    }

    if (uniq.length === 1 && uniq[0] !== viewer) return uniq[0];
    return '';
  }

  /**
   * Ưu tiên UID từ JSON trong trang; nếu không bóc được — dùng **số trên URL** (`/messages/t/` hoặc `/messages/e2ee/t/`) để tra SĐT (cùng luồng, kể cả e2ee).
   */
  function resolveUidForThread(threadId, html) {
    const extracted = extractOtherParticipantUid(threadId, html);
    if (extracted) return extracted;
    const tid = String(threadId || '').trim();
    if (/^\d{10,20}$/.test(tid)) {
      return tid;
    }
    return '';
  }

  function ensureStyles() {
    if (document.getElementById(LINK_ID)) return;
    const link = document.createElement('link');
    link.id = LINK_ID;
    link.rel = 'stylesheet';
    link.href = chrome.runtime.getURL('src/ui/business-inbox-phone.css');
    (document.head || document.documentElement).appendChild(link);
  }

  /**
   * Cột chi tiết bên phải. Với **e2ee** dùng thêm mép phải viewport (tránh neo nhầm header cột giữa).
   * Với **`/messages/t/`** giữ heuristic % — đã ổn định, không trộn với e2ee.
   */
  function isInMessengerDetailsStrip(el) {
    try {
      const r = el.getBoundingClientRect();
      const vw = window.innerWidth || 800;
      const vh = window.innerHeight || 600;
      if (r.width < 1 && r.height < 1) return false;
      if (r.top > vh - 2) return false;
      if (isMessengerE2eePath()) {
        if (r.width > vw * 0.52) return false;
        const pad = Math.max(240, Math.min(460, Math.round(vw * 0.26)));
        return r.left >= vw - pad;
      }
      if (vw >= 1200) return r.left >= vw * 0.56;
      if (vw >= 1000) return r.left >= vw * 0.52;
      if (vw >= 800) return r.left >= vw * 0.48;
      if (vw >= 600) return r.left >= vw * 0.42;
      return r.left >= vw * 0.38;
    } catch (_) {
      return false;
    }
  }

  /**
   * Hàng nút Profile / Mute / Search — `/messages/t/` chỉ nhận khớp cũ (2–4 con).
   * **e2ee**: thêm hàng chỉ có Tìm kiếm / Quyền riêng tư…
   */
  function findIconButtonRowFromProfileLabel(labelEl, e2ee) {
    if (!labelEl) return null;
    let cur = labelEl;
    for (let d = 0; d < 14; d++) {
      const par = cur.parentElement;
      if (!par) break;
      const n = par.children.length;
      if (e2ee) {
        if (n < 1 || n > 6) {
          cur = par;
          continue;
        }
      } else if (n < 2 || n > 4) {
        cur = par;
        continue;
      }
      let snippets = [];
      let tooLong = false;
      for (let i = 0; i < n; i++) {
        const s = (par.children[i].textContent || '').replace(/\s+/g, ' ').trim();
        snippets.push(s);
        if (s.length > 160) tooLong = true;
      }
      if (tooLong) {
        cur = par;
        continue;
      }
      const joined = snippets.join('\n');
      if (!e2ee) {
        if (
          /Trang cá nhân|Profile/i.test(joined) &&
          /Tìm kiếm|Search|Tắt thông báo|Mute|Chủ đề|Theme/i.test(joined)
        ) {
          return par;
        }
        cur = par;
        continue;
      }
      const hasProfile = /Trang cá nhân|Profile/i.test(joined);
      const hasSearch = /Tìm kiếm|Search/i.test(joined);
      const hasMuteTheme = /Tắt thông báo|Mute|Chủ đề|Theme/i.test(joined);
      const hasPrivacyEtc = /Quyền riêng|Privacy|hỗ trợ|Support/i.test(joined);
      if (hasProfile && hasSearch && (hasMuteTheme || n <= 4)) {
        return par;
      }
      if (hasSearch && (hasMuteTheme || hasPrivacyEtc) && n >= 2 && n <= 6) {
        return par;
      }
      if (hasSearch && n >= 2 && n <= 5 && joined.length < 260) {
        return par;
      }
      cur = par;
    }
    return null;
  }

  /** `/messages/t/` — ưu tiên phần tử trên cùng trong tier (hành vi đã ổn định). */
  function sortMountCandidatesClassic(a, b) {
    if (a.tier !== b.tier) return a.tier - b.tier;
    if (a.top !== b.top) return a.top - b.top;
    return b.left - a.left;
  }

  /**
   * Đưa điểm chèn lên cấp cha **đủ rộng** (e2ee hay DOM lồng flex — tránh khối bị siết ~vài px, chữ xếp dọc).
   * Giống hành vi mong muối khi neo trước **hàng nút** trong cột dọc sidebar.
   */
  function hoistMessengerRootInsert(anchorEl) {
    if (!anchorEl) return { parent: null, before: null };
    let cur = anchorEl;
    for (let d = 0; d < 26; d++) {
      const p = cur.parentElement;
      if (!p) break;
      try {
        const pw = p.getBoundingClientRect().width;
        if (pw >= 210) {
          return { parent: p, before: cur };
        }
      } catch (_) {
        break;
      }
      cur = p;
    }
    return { parent: anchorEl.parentElement, before: anchorEl };
  }

  /**
   * Neo trong cột phải: **cả hàng nút** (flex) — insertBefore(row) → [Zoo Target][hàng nút].
   * **e2ee** thêm tier «Tìm kiếm»; sort **cùng** `/messages/t/` (classic).
   */
  function findMountAnchor() {
    const e2ee = isMessengerE2eePath();
    const sortFn = sortMountCandidatesClassic;
    const nodes = document.querySelectorAll('span,div');
    const scored = [];
    for (let i = 0; i < nodes.length; i++) {
      const el = nodes[i];
      if (!isInMessengerDetailsStrip(el)) continue;
      const t = (el.textContent || '').trim();
      let tier = 99;
      if (t === 'Trang cá nhân' || t === 'Profile') tier = 1;
      else if (e2ee && (t === 'Tìm kiếm' || t === 'Search')) tier = 1;
      else if (t === LABEL_ENCRYPTED_VI || t === LABEL_ENCRYPTED_EN) tier = 2;
      else if (/mã\s*hóa\s*đầu\s*cuối/i.test(t) && t.length < 80) tier = 2;
      else if (t.indexOf('Thông tin về đoạn chat') === 0 && t.length < 72) tier = 3;
      if (tier >= 99) continue;
      const r = el.getBoundingClientRect();
      scored.push({ el, tier, top: r.top, left: r.left });
    }
    if (!scored.length) return null;
    const tier1 = scored.filter(function (s) {
      return s.tier === 1;
    });
    if (tier1.length) {
      tier1.sort(sortFn);
      const profilePick = tier1.filter(function (s) {
        const tx = (s.el.textContent || '').trim();
        return tx === 'Trang cá nhân' || tx === 'Profile';
      });
      const pick = profilePick.length ? profilePick[0] : tier1[0];
      const row = findIconButtonRowFromProfileLabel(pick.el, e2ee);
      return row || pick.el;
    }
    scored.sort(sortFn);
    return scored[0].el;
  }

  function mountRootBefore(anchorEl) {
    let root = document.getElementById(ROOT_ID);
    if (!root) {
      root = document.createElement('div');
      root.id = ROOT_ID;
    }
    const hoisted = hoistMessengerRootInsert(anchorEl);
    const parent = hoisted.parent;
    const before = hoisted.before;
    if (!parent || !before) return null;
    if (root.parentNode !== parent || root.nextElementSibling !== before) {
      if (root.parentNode) root.parentNode.removeChild(root);
      parent.insertBefore(root, before);
    }
    return root;
  }

  function setLoading(root, sub) {
    root.innerHTML =
      '<div class="zt-biz-card zt-biz-card--muted">' +
      '<p class="zt-biz-card-label">Fairy House AutoData</p>' +
      '<p class="zt-biz-muted-text">' +
      escHtml(sub || 'Đang tra SĐT…') +
      '</p>' +
      '</div>';
  }

  function setError(root, msg) {
    root.innerHTML =
      '<div class="zt-biz-card zt-biz-card--err">' +
      '<p class="zt-biz-card-label">Số điện thoại</p>' +
      '<p class="zt-biz-err-text">' +
      escHtml(msg || 'không tìm thấy số') +
      '</p>' +
      '</div>';
  }

  function setOk(root, phoneDisplay, digits) {
    const masked =
      !!window.__ztPhoneMask &&
      window.ZTPhoneDisplay &&
      typeof window.ZTPhoneDisplay.maskDisplay === 'function';
    const disp = masked ? window.ZTPhoneDisplay.maskDisplay(phoneDisplay) : phoneDisplay;
    const esc = escHtml(disp);
    if (masked) {
      root.innerHTML =
        '<div class="zt-biz-card zt-biz-card--ok">' +
        '<p class="zt-biz-card-label">Số điện thoại</p>' +
        '<p class="zt-biz-phone-number">' +
        esc +
        '</p>' +
        '</div>';
      return;
    }
    const tel = hrefTelFromDigits(digits);
    const zalo = hrefZaloFromDigits(digits);
    root.innerHTML =
      '<div class="zt-biz-card zt-biz-card--ok">' +
      '<p class="zt-biz-card-label">Số điện thoại</p>' +
      '<p class="zt-biz-phone-number">' +
      esc +
      '</p>' +
      '<div class="zt-biz-actions">' +
      '<a class="zt-biz-btn zt-biz-btn--call" href="' +
      escHtml(tel) +
      '" rel="noopener noreferrer">' +
      ICON_PHONE +
      '<span>Gọi</span></a>' +
      '<a class="zt-biz-btn zt-biz-btn--zalo" href="' +
      escHtml(zalo) +
      '" target="_blank" rel="noopener noreferrer">' +
      ICON_CHAT +
      '<span>Zalo</span></a>' +
      '</div>' +
      '</div>';
  }

  function fetchPhoneMap(uid) {
    return new Promise(function (resolve, reject) {
      try {
        chrome.runtime.sendMessage(
          { action: 'getPhoneMapOnly', uids: [uid] },
          function (resp) {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
              return;
            }
            if (resp && resp.ok && resp.phoneMap) resolve(resp.phoneMap);
            else reject(new Error((resp && resp.error) || 'Tra SĐT thất bại'));
          }
        );
      } catch (e) {
        reject(e);
      }
    });
  }

  function applyThread() {
    if (!isMessengerThreadPath(location.pathname)) {
      const old = document.getElementById(ROOT_ID);
      if (old && old.parentNode) old.parentNode.removeChild(old);
      phoneLookupCache = null;
      lastHandledThreadId = '';
      return;
    }

    ensureStyles();
    const threadId = getThreadIdFromPath();
    if (!threadId) {
      const old = document.getElementById(ROOT_ID);
      if (old) old.innerHTML = '';
      phoneLookupCache = null;
      lastHandledThreadId = '';
      return;
    }

    const prevThreadId = lastHandledThreadId;
    const switchedThread = threadId !== prevThreadId;
    if (switchedThread) {
      phoneLookupCache = null;
      inflightKey = '';
    }
    lastHandledThreadId = threadId;

    const anchor = findMountAnchor();
    if (!anchor) {
      return;
    }
    const root = mountRootBefore(anchor);
    if (!root) return;

    if (switchedThread) {
      setLoading(root, 'Đang tra cho cuộc trò chuyện này…');
    }

    const html = getPageHtmlSlice();
    const uid = resolveUidForThread(threadId, html);

    if (!uid) {
      setError(root, 'Không lấy được UID từ URL. Mở lại cuộc trò chuyện.');
      inflightKey = '';
      return;
    }

    const cacheKey = threadId + ':' + uid;
    if (phoneLookupCache && phoneLookupCache.threadId === threadId && phoneLookupCache.uid === uid) {
      const raw = phoneLookupCache.raw;
      if (raw) {
        const disp = formatPhone84to09(raw);
        const dig = digitsOnly(raw);
        setOk(root, disp, dig);
      } else {
        setError(root, 'không tìm thấy số');
      }
      return;
    }

    if (inflightKey === cacheKey) return;
    inflightKey = cacheKey;
    setLoading(root, 'Đang tra SĐT…');

    fetchPhoneMap(uid)
      .then(function (map) {
        if (getThreadIdFromPath() !== threadId || resolveUidForThread(threadId, getPageHtmlSlice()) !== uid) {
          inflightKey = '';
          return;
        }
        inflightKey = '';
        const raw = map && map[uid] ? String(map[uid]) : '';
        phoneLookupCache = { threadId: threadId, uid: uid, raw: raw || null };
        if (raw) {
          const disp = formatPhone84to09(raw);
          const dig = digitsOnly(raw);
          setOk(root, disp, dig);
        } else {
          setError(root, 'không tìm thấy số');
        }
      })
      .catch(function (err) {
        inflightKey = '';
        if (getThreadIdFromPath() !== threadId) return;
        console.warn('[ZT] Messenger tra SĐT', err && err.message ? err.message : err);
        phoneLookupCache = { threadId: threadId, uid: uid, raw: null };
        setError(root, 'không tìm thấy số');
      });
  }

  function schedule() {
    if (scheduleTimer) clearTimeout(scheduleTimer);
    scheduleTimer = setTimeout(function () {
      scheduleTimer = null;
      applyThread();
    }, 90);
  }

  function onMutations() {
    if (mobTimer) clearTimeout(mobTimer);
    mobTimer = setTimeout(function () {
      mobTimer = null;
      schedule();
    }, DEBOUNCE_MS);
  }

  const origPushHist1 = history.pushState;
  const origReplaceHist1 = history.replaceState;
  let messengerObs = null;

  function ztStartMessengerPhone() {
    history.pushState = function () {
      const r = origPushHist1.apply(this, arguments);
      queueMicrotask(schedule);
      return r;
    };
    history.replaceState = function () {
      const r = origReplaceHist1.apply(this, arguments);
      queueMicrotask(schedule);
      return r;
    };
    window.addEventListener('popstate', schedule);

    messengerObs = new MutationObserver(onMutations);
    if (document.body) {
      messengerObs.observe(document.body, { childList: true, subtree: true });
    } else {
      document.addEventListener(
        'DOMContentLoaded',
        function () {
          if (document.body) messengerObs.observe(document.body, { childList: true, subtree: true });
          schedule();
        },
        { once: true }
      );
    }

    schedule();

    lastPolledPath = String(location.pathname || '');
    if (pathPollTimer) clearInterval(pathPollTimer);
    pathPollTimer = setInterval(function () {
      try {
        const p = String(location.pathname || '');
        if (p !== lastPolledPath) {
          lastPolledPath = p;
          schedule();
        }
      } catch (_) {
        /* ignore */
      }
    }, 500);
  }

  function ztStopMessengerPhone() {
    history.pushState = origPushHist1;
    history.replaceState = origReplaceHist1;
    window.removeEventListener('popstate', schedule);
    if (pathPollTimer) {
      clearInterval(pathPollTimer);
      pathPollTimer = null;
    }
    if (messengerObs) {
      try {
        messengerObs.disconnect();
      } catch (_) {
        /* ignore */
      }
      messengerObs = null;
    }
    if (scheduleTimer) {
      clearTimeout(scheduleTimer);
      scheduleTimer = null;
    }
    if (mobTimer) {
      clearTimeout(mobTimer);
      mobTimer = null;
    }
    try {
      const r = document.getElementById(ROOT_ID);
      if (r && r.parentNode) r.parentNode.removeChild(r);
    } catch (_) {
      /* ignore */
    }
  }

  if (window.ZTServerSession && typeof window.ZTServerSession.whenAuthed === 'function') {
    window.ZTServerSession.whenAuthed(ztStartMessengerPhone, ztStopMessengerPhone);
  } else {
    ztStartMessengerPhone();
  }
})();
