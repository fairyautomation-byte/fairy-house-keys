(function () {
  'use strict';

  const BTN_ID = 'zoo-target-header-btn';
  const STYLE_ID = 'zt-header-btn-style';

  /** Nhóm: MutationObserver + debounce. Profile: không observer (chỉ idle/interval). */
  const DEBOUNCE_MS_GROUP = 450;

  let ztMutationObserver = null;
  /** Chỉ inject nút khi đã đăng nhập server (ZTServerSession). */
  let ztInjectEnabled = false;
  let ztInjectLifecycleStarted = false;
  let ztCurrentSession = null;
  let ztRefreshInFlight = false;
  let ztRouteBurstTimer = null;
  let ztRouteBurstStopTimer = null;
  let ztRouteBurstTimeouts = [];

  const ICON_SVG =
    '<svg class="zt-hbtn-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M3 7V5a2 2 0 0 1 2-2h2"/>' +
    '<path d="M17 3h2a2 2 0 0 1 2 2v2"/>' +
    '<path d="M21 17v2a2 2 0 0 1-2 2h-2"/>' +
    '<path d="M7 21H5a2 2 0 0 1-2-2v-2"/>' +
    '<circle cx="12" cy="12" r="3.5"/>' +
    '<path d="m15 15 2.5 2.5"/>' +
    '</svg>';

  const LOAD_SVG =
    '<svg class="zt-hbtn-load" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true">' +
    '<path d="M21 12a9 9 0 1 1-6.219-8.56"/>' +
    '</svg>';

  function getCurrentFacebookUid() {
    try {
      if (typeof PushGroupAuth !== 'undefined' && PushGroupAuth.getAuth) {
        const auth = PushGroupAuth.getAuth();
        const uid = auth && auth.userId ? String(auth.userId).replace(/\D/g, '') : '';
        return uid && uid.length >= 5 ? uid : '';
      }
    } catch (_) {
      /* ignore */
    }
    // Fallback cho SPA: nhiều lúc PushGroupAuth chưa sẵn, nhưng c_user đã có.
    try {
      const raw = String(document.cookie || '');
      const m = raw.match(/(?:^|;\s*)c_user=(\d{5,20})(?:;|$)/);
      const uid = m && m[1] ? String(m[1]).replace(/\D/g, '') : '';
      if (uid && uid.length >= 5) return uid;
    } catch (_) {
      /* ignore */
    }
    return '';
  }

  function isCurrentUidAllowed(session) {
    if (!session || !session.authed) return false;
    if (session.hasQuota === false) return false;
    return true;
  }

  function evaluateInjectPermission() {
    const allowed = isCurrentUidAllowed(ztCurrentSession);
    if (allowed) {
      ztRunInjectButton();
      setTimeout(ensureButton, 0);
    } else {
      ztTeardownInjectButton();
    }
  }

  function refreshServerSessionUser() {
    // Không tự động gửi validate từ content script để tránh xung đột quota,
    // race condition và tránh bị dính rate limit làm mất key bản quyền.
  }

  function bootstrapSessionSnapshot() {
    if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.sendMessage) return;
    try {
      chrome.runtime.sendMessage({ action: 'ZT_SERVER_SESSION_GET' }, function (resp) {
        if (chrome.runtime.lastError) return;
        if (!resp || !resp.ok) return;
        ztCurrentSession = {
          authed: !!resp.authed,
          hasQuota: resp.hasQuota !== false,
          user: resp.user || null
        };
        evaluateInjectPermission();
      });
    } catch (e) {
      /* context invalidated */
    }
  }

  function innerNormal() {
    return (
      '<span class="zt-hbtn-row">' +
      ICON_SVG +
      '<span class="zt-hbtn-txt">Bắt Đầu Quét</span>' +
      '</span>'
    );
  }

  function innerLoading() {
    return (
      '<span class="zt-hbtn-row">' +
      LOAD_SVG +
      '<span class="zt-hbtn-txt zt-hbtn-txt--sm">Đang mở…</span>' +
      '</span>'
    );
  }

  function ensureHeaderBtnStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent =
      '@keyframes zt-hbtn-spin{to{transform:rotate(360deg)}}' +
      '#' +
      BTN_ID +
      '{display:inline-flex;align-items:center;align-self:center;margin:0 0 0 8px;flex-shrink:0;' +
      'position:relative;z-index:4;pointer-events:auto;}' +
      '#' +
      BTN_ID +
      '[data-zt-ctx-kind="profile"]{margin-top:5px}' +
      '#' +
      BTN_ID +
      '[data-zt-ctx-kind="fanpage"]{margin-top:5px}' +
      '#' +
      BTN_ID +
      '[data-zt-ctx-kind="group"]{margin-top:-4px}' +
      '#' +
      BTN_ID +
      ' .zt-hbtn{' +
      'display:inline-flex;align-items:center;justify-content:center;min-height:36px;padding:0 14px 0 12px;' +
      'pointer-events:auto;position:relative;z-index:1;' +
      'border-radius:8px;cursor:pointer;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;' +
      'font-weight:600;font-size:13.5px;line-height:1.2;color:#ffffff;' +
      'background:linear-gradient(135deg,#0d9488 0%,#0f766e 100%);' +
      'border:1px solid rgba(255,255,255,0.18);' +
      'box-shadow:0 1px 2px rgba(0,0,0,0.08),0 2px 6px rgba(13,148,136,0.28),inset 0 1px 0 rgba(255,255,255,0.15);' +
      'white-space:nowrap;letter-spacing:0.01em;' +
      'transition:all .16s cubic-bezier(0.16,1,0.3,1);' +
      '}' +
      '#' +
      BTN_ID +
      ' .zt-hbtn:hover:not(.zt-hbtn--loading){' +
      'background:linear-gradient(135deg,#0f766e 0%,#115e59 100%);' +
      'box-shadow:0 4px 12px rgba(13,148,136,0.38),inset 0 1px 0 rgba(255,255,255,0.2);' +
      'transform:translateY(-1px);' +
      '}' +
      '#' +
      BTN_ID +
      ' .zt-hbtn:active:not(.zt-hbtn--loading){' +
      'transform:translateY(0px) scale(0.98);' +
      'box-shadow:0 1px 2px rgba(13,148,136,0.25);' +
      '}' +
      '#' +
      BTN_ID +
      ' .zt-hbtn.zt-hbtn--loading{cursor:wait;opacity:0.92;pointer-events:none;}' +
      '#' +
      BTN_ID +
      ' .zt-hbtn-row{display:inline-flex;align-items:center;gap:7px;}' +
      '#' +
      BTN_ID +
      ' .zt-hbtn-icon{flex-shrink:0;opacity:0.95;}' +
      '#' +
      BTN_ID +
      ' .zt-hbtn-txt{font-weight:600;letter-spacing:0.01em;}' +
      '#' +
      BTN_ID +
      ' .zt-hbtn-txt--sm{font-size:13px;font-weight:600;}' +
      '#' +
      BTN_ID +
      ' .zt-hbtn-load{animation:zt-hbtn-spin .65s linear infinite;}';
    (document.head || document.documentElement).appendChild(s);
  }

  /**
   * Slug nhóm (facebook.com/groups/ten-nhom) — không phải /groups/123.
   */
  function getGroupSlugFromPath() {
    const p = (location.pathname || '').replace(/\/+$/, '');
    const m = p.match(/^\/groups\/([^/]+)/);
    if (!m) return '';
    const seg = String(m[1] || '').trim();
    if (!seg || /^(feed|discover|browse|suggested|join|create|your_groups)$/i.test(seg)) return '';
    return seg;
  }

  /**
   * Đếm mọi href .../groups/<số>/... trong DOM (Graph thường dùng ID số dù URL slug).
   */
  function scrapeGroupIdFromLinks(scope) {
    const roots = [];
    if (scope && scope.querySelectorAll) roots.push(scope);
    try {
      roots.push(document);
    } catch (_) {
      /* ignore */
    }
    const counts = new Map();
    const add = (id) => {
      if (!id || !/^\d{8,20}$/.test(id)) return;
      counts.set(id, (counts.get(id) || 0) + 1);
    };
    for (let r = 0; r < roots.length; r++) {
      let nodes;
      try {
        nodes = roots[r].querySelectorAll('a[href*="/groups/"],[href*="/groups/"]');
      } catch (_) {
        continue;
      }
      for (let i = 0; i < nodes.length; i++) {
        const el = nodes[i];
        const h = (el.getAttribute && el.getAttribute('href')) || el.href || '';
        if (!h) continue;
        const mm = String(h).match(/\/groups\/(\d{8,20})(?:\/|$|[?#])/g);
        if (!mm) continue;
        for (let j = 0; j < mm.length; j++) {
          const m2 = mm[j].match(/(\d{8,20})/);
          if (m2) add(m2[1]);
        }
      }
    }
    let best = null;
    let bestN = 0;
    counts.forEach(function (n, id) {
      if (n > bestN) {
        bestN = n;
        best = id;
      }
    });
    return best;
  }

  /**
   * Lấy group ID số: URL /groups/123, query, meta canonical, link, JSON nhúng (slug).
   */
  function scrapeGroupIdFromDocument(slug) {
    let html = '';
    try {
      html = document.documentElement ? String(document.documentElement.innerHTML) : '';
    } catch (_) {
      return null;
    }
    if (!html) return null;

    if (slug && !/^\d+$/.test(slug)) {
      const idx = html.indexOf(slug);
      if (idx >= 0) {
        const win = html.slice(Math.max(0, idx - 12000), Math.min(html.length, idx + 12000));
        const patterns = [
          /"groupID"\s*:\s*"?(\d{8,20})"?/,
          /"groupID"\s*:\s*(\d{8,20})\b/,
          /"group_id"\s*:\s*"?(\d{8,20})"?/,
          /"target_group_id"\s*:\s*"?(\d{8,20})"?/,
          /"communityID"\s*:\s*"?(\d{8,20})"?/,
          /"for_sale_group_id"\s*:\s*"?(\d{8,20})"?/,
          /"__typename"\s*:\s*"Group"[^}]{0,200}"id"\s*:\s*"(\d{8,20})"/,
          /"id"\s*:\s*"(\d{8,20})"[^}]{0,200}"__typename"\s*:\s*"Group"/,
          /\{"__typename":"Group","id":"(\d{8,20})"/,
          /groupID\\":\\"(\d{8,20})/
        ];
        for (let p = 0; p < patterns.length; p++) {
          const near = win.match(patterns[p]);
          if (near) return near[1];
        }
      }
    }

    const seen = new Map();
    const add = (id) => {
      if (!id || !/^\d{8,20}$/.test(id)) return;
      seen.set(id, (seen.get(id) || 0) + 1);
    };
    try {
      const patterns = [
        /"groupID"\s*:\s*"?(\d{8,20})"?/g,
        /"groupID"\s*:\s*(\d{8,20})\b/g,
        /\\"groupID\\":\\"(\d{8,20})\\"/g
      ];
      for (let p = 0; p < patterns.length; p++) {
        const re = patterns[p];
        re.lastIndex = 0;
        let m;
        while ((m = re.exec(html)) !== null) add(m[1]);
      }
    } catch (_) {
      /* ignore */
    }
    if (seen.size === 1) return [...seen.keys()][0];
    let best = null;
    let bestN = 0;
    seen.forEach(function (n, id) {
      if (n > bestN) {
        bestN = n;
        best = id;
      }
    });
    return best;
  }

  function getGroupIdFromPage() {
    try {
      const qs = new URLSearchParams(location.search || '');
      const qg = qs.get('group_id') || qs.get('groupId');
      if (qg && /^\d{8,20}$/.test(String(qg).trim())) return String(qg).trim();
    } catch (_) {
      /* ignore */
    }

    const path = location.pathname || '';
    const m = path.match(/\/groups\/(\d{8,20})/);
    if (m) return m[1];

    const og = document.querySelector('meta[property="og:url"]');
    if (og?.content) {
      const mm = String(og.content).match(/\/groups\/(\d{8,20})(?:\/|$|[?#])/);
      if (mm) return mm[1];
    }
    const canon = document.querySelector('link[rel="canonical"]');
    if (canon?.href) {
      const mm = String(canon.href).match(/\/groups\/(\d{8,20})(?:\/|$|[?#])/);
      if (mm) return mm[1];
    }

    const scope = getPageScope();
    const fromLinks = scrapeGroupIdFromLinks(scope);
    if (fromLinks) return fromLinks;

    const slug = getGroupSlugFromPath();
    const scraped = scrapeGroupIdFromDocument(slug);
    if (scraped) return scraped;

    const a =
      document.querySelector('main a[href*="/groups/"]') ||
      document.querySelector('[role="main"] a[href*="/groups/"]');
    if (a?.href) {
      const mm = String(a.href).match(/\/groups\/(\d{8,20})(?:\/|$|[?#])/);
      if (mm) return mm[1];
    }
    return scrapeGroupIdFromLinks(null);
  }

  function isGroupPage() {
    const p = location.pathname || '';
    if (!/^\/groups\/[^/]+/.test(p)) return false;
    return !!getGroupSlugFromPath();
  }

  /** Segment vanity trên URL (facebook.com/username) — không phải profile.php?id= hay /1000…/. */
  function getProfileVanitySegment() {
    const path = (location.pathname || '').replace(/\/+$/, '') || '/';
    if (/profile\.php/i.test(location.pathname || '')) return '';
    const numOnly = path.match(/^\/(\d{5,20})$/);
    if (numOnly) return '';
    const parts = path.split('/').filter(Boolean);
    if (parts.length === 1) return parts[0];
    return '';
  }

  function isProfileLikePage() {
    if (isGroupPage()) return false;
    const p = (location.pathname || '').replace(/\/+$/, '') || '/';
    if (p === '/' || p === '') return false;
    if (
      /^\/(stories|reel|watch|marketplace|gaming|events|messages|notifications|settings|login|reg|recover|checkpoint|help|legal|privacy|search|bookmarks|ads|pages|adsmanager|business|commerce|shop|pay|dialog|plugins)\b/i.test(
        p
      )
    ) {
      return false;
    }
    if (p.includes('/groups/')) return false;
    if (p.includes('profile.php')) return true;
    const parts = p.split('/').filter(Boolean);
    if (parts.length !== 1) return false;
    const seg = parts[0];
    if (typeof ProfileResolver !== 'undefined' && ProfileResolver.isLikelyProfilePath) {
      return ProfileResolver.isLikelyProfilePath(location.pathname);
    }
    return /^[a-zA-Z0-9._-]{2,80}$/.test(seg) && !/^pfbid/i.test(seg);
  }

  /** Fanpage: URL vanity hoặc profile.php?id= — HTML có nhúng page_id (khác profile cá nhân). */
  function isFanpageLikePage() {
    if (isGroupPage()) return false;
    if (typeof FanpageResolver === 'undefined' || !FanpageResolver.detectFromDocument) return false;
    const p = (location.pathname || '').replace(/\/+$/, '') || '/';
    if (p === '/' || p === '') return false;
    if (
      /^\/(stories|reel|watch|marketplace|gaming|events|messages|notifications|settings|login|reg|recover|checkpoint|help|legal|privacy|search|bookmarks|ads|pages|adsmanager|business|commerce|shop|pay|dialog|plugins)\b/i.test(
        p
      )
    ) {
      return false;
    }
    if (p.includes('/groups/')) return false;
    if (p.includes('profile.php')) {
      try {
        const id = new URL(location.href).searchParams.get('id');
        if (!id || !/^\d+$/.test(String(id).trim())) return false;
      } catch (_) {
        return false;
      }
    } else {
      const parts = p.split('/').filter(Boolean);
      if (parts.length !== 1) return false;
      if (/^pfbid/i.test(parts[0])) return false;
    }
    return FanpageResolver.detectFromDocument();
  }

  function getPageScope() {
    const main = document.querySelector('main');
    if (main) return main;
    const rm = document.querySelector('[role="main"]');
    if (rm) return rm;
    return null;
  }

  function isTopGlobalChrome(el) {
    let p = el;
    for (let i = 0; i < 18 && p; i++) {
      const role = p.getAttribute && p.getAttribute('role');
      const id = (p.id || '').toLowerCase();
      const aria = (p.getAttribute && p.getAttribute('aria-label')) || '';
      if (role === 'navigation' && /search facebook|tìm kiếm trên facebook/i.test(aria)) return true;
      if (p.querySelector && p.querySelector('input[type="search"],[role="search"],[placeholder*="Search"],[placeholder*="Tìm kiếm"]')) {
        if (!p.querySelector('[href*="/groups/"]')) return true;
      }
      if (id.includes('globalheader') || id.includes('topnav')) return true;
      p = p.parentElement;
    }
    return false;
  }

  function normLabel(el) {
    if (!el || !el.getAttribute) return '';
    const a = (el.getAttribute('aria-label') || '').trim().toLowerCase();
    if (a) return a;
    try {
      const t = (el.innerText || el.textContent || '')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase()
        .slice(0, 120);
      return t;
    } catch (_) {
      return '';
    }
  }

  function labelMatchesShare(lab) {
    return /chia sẻ|^share$/i.test(lab);
  }

  function labelMatchesInvite(lab) {
    return /(^|\s|\b)mời\b|^invite(\s|$)|mời bạn|invite/i.test(lab);
  }

  function labelMatchesJoin(lab) {
    return /tham gia nhóm|join group|^join$|đã tham gia|joined|particip/i.test(lab);
  }

  function labelMatchesMessage(lab) {
    return (
      /nhắn tin|^message$|messenger|messag(e|ing)|send (a |the )?message|chat( on)? messenger/i.test(lab) ||
      /^msg$/i.test(lab)
    );
  }

  function labelMatchesAddFriend(lab) {
    return /thêm bạn|add friend|addfriend/i.test(lab);
  }

  function labelMatchesFollow(lab) {
    return /theo dõi|^follow$/i.test(lab);
  }

  function labelMatchesEditProfile(lab) {
    return (
      /chỉnh sửa|chinh sua|edit profile|edit public details|sua trang ca nhan|customize profile/i.test(
        lab
      )
    );
  }

  function isHorizontalFlex(cs) {
    const d = cs.display || '';
    if (!/flex/.test(d)) return false;
    const fd = cs.flexDirection || 'row';
    return fd !== 'column' && fd !== 'column-reverse';
  }

  function getFlexCellContaining(row, inner) {
    let cell = inner;
    while (cell && cell.parentElement !== row) cell = cell.parentElement;
    return cell && cell.parentElement === row ? cell : null;
  }

  function findHorizontalFlexSlot(anchor, scope) {
    const candidates = [];
    let node = anchor;
    for (let d = 0; d < 16; d++) {
      const row = node.parentElement;
      if (!row || !scope.contains(row)) break;
      const cs = window.getComputedStyle(row);
      if (isHorizontalFlex(cs)) {
        const cell = getFlexCellContaining(row, anchor);
        if (cell) candidates.push({ row, cell });
      }
      node = row;
    }
    for (let i = candidates.length - 1; i >= 0; i--) {
      const { row, cell } = candidates[i];
      if (row.children.length >= 2) return { row, cell };
    }
    return candidates.length ? candidates[candidates.length - 1] : null;
  }

  /** Bỏ qua wrapper #zoo-target-header-btn cũ khi lấy phần tử cuối hàng. */
  function lastToolbarChild(row) {
    let last = row.lastElementChild;
    while (last && last.id === BTN_ID) last = last.previousElementSibling;
    return last;
  }

  /**
   * Thanh nút profile Facebook: chèn sau ô cuối của hàng flex (thường là menu …),
   * tránh neo sau ô anchor trong hàng flex lồng nhau (nút rơi xuống dòng / lệch).
   */
  function findProfileToolbarSlot(anchor, scope) {
    const rowsMeta = [];
    let node = anchor;
    for (let d = 0; d < 18; d++) {
      const row = node.parentElement;
      if (!row || !scope.contains(row)) break;
      const cs = window.getComputedStyle(row);
      if (!isHorizontalFlex(cs)) {
        node = row;
        continue;
      }
      const cell = getFlexCellContaining(row, anchor);
      if (!cell) {
        node = row;
        continue;
      }
      const childCount = row.children.length;
      if (childCount >= 2) {
        rowsMeta.push({ row, cell, d, childCount });
      }
      node = row;
    }
    if (!rowsMeta.length) {
      const fallback = findHorizontalFlexSlot(anchor, scope);
      if (!fallback) return null;
      const last = lastToolbarChild(fallback.row);
      return { row: fallback.row, insertAfterEl: last || fallback.cell };
    }
    const prefer = rowsMeta.filter(function (r) {
      return r.childCount >= 3;
    });
    const pool = prefer.length ? prefer : rowsMeta;
    pool.sort(function (a, b) {
      if (a.d !== b.d) return a.d - b.d;
      return b.childCount - a.childCount;
    });
    const pick = pool[0];
    const last = lastToolbarChild(pick.row);
    return { row: pick.row, insertAfterEl: last || pick.cell };
  }

  function findAnchorInGroupHeader(scope) {
    const nodes = scope.querySelectorAll('[role="button"],a[role="link"]');
    const maxTop = Math.min(window.innerHeight * 0.72, 820);
    const candidates = [];

    for (const el of nodes) {
      if (el.getAttribute('role') !== 'button' && el.getAttribute('role') !== 'link') continue;
      const lab = normLabel(el);
      if (!lab) continue;
      if (!labelMatchesShare(lab) && !labelMatchesInvite(lab) && !labelMatchesJoin(lab)) continue;
      if (isTopGlobalChrome(el)) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 2 && r.height < 2) continue;
      if (r.top > maxTop) continue;
      candidates.push({ el, lab, top: r.top, left: r.left });
    }

    candidates.sort((a, b) => a.top - b.top || a.left - b.left);

    const pick = (fn) => candidates.find((x) => fn(x.lab))?.el;

    return pick(labelMatchesShare) || pick(labelMatchesInvite) || pick(labelMatchesJoin) || null;
  }

  /**
   * Thu hẹp vùng tìm nút Nhắn tin — tránh querySelectorAll trên toàn bộ main (hàng chục nghìn node).
   */
  function getProfileActionsSubscope(scope) {
    if (!scope) return scope;
    try {
      const msgA =
        scope.querySelector('a[href*="/messages/t/"]') ||
        scope.querySelector('a[href*="/messages/?"]') ||
        scope.querySelector('a[href*="facebook.com/messages"]');
      if (msgA && scope.contains(msgA)) {
        let n = msgA.parentElement;
        for (let i = 0; i < 12 && n && scope.contains(n); i++) {
          const subBtns = n.querySelectorAll('[role="button"],a[role="link"]');
          if (subBtns.length >= 2) {
            const br = n.getBoundingClientRect();
            if (br.top < window.innerHeight * 0.58 && br.height < 320) return n;
          }
          n = n.parentElement;
        }
      }
      const h = scope.querySelector('h1[dir="auto"]') || scope.querySelector('main h1') || scope.querySelector('h1');
      if (h && scope.contains(h)) {
        let n = h.parentElement;
        for (let d = 0; d < 14 && n && scope.contains(n); d++) {
          const subBtns = n.querySelectorAll('[role="button"]');
          if (subBtns.length >= 3) {
            const br = n.getBoundingClientRect();
            if (br.top < window.innerHeight * 0.58 && br.height < 280) return n;
          }
          n = n.parentElement;
        }
      }
    } catch (_) {
      /* ignore */
    }
    return scope;
  }

  function findAnchorInProfileHeader(scope) {
    const searchRoot = getProfileActionsSubscope(scope);
    const nodes = searchRoot.querySelectorAll('[role="button"],a[role="link"],a[href*="messages"]');
    const maxTop = Math.min(window.innerHeight * 0.52, 620);
    const candidates = [];

    for (const el of nodes) {
      if (el.getAttribute('role') !== 'button' && el.getAttribute('role') !== 'link' && el.tagName !== 'A')
        continue;
      const lab = normLabel(el);
      if (!lab) continue;
      if (
        !labelMatchesMessage(lab) &&
        !labelMatchesAddFriend(lab) &&
        !labelMatchesFollow(lab) &&
        !labelMatchesEditProfile(lab)
      ) {
        continue;
      }
      if (isTopGlobalChrome(el)) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 2 && r.height < 2) continue;
      if (r.top > maxTop) continue;
      candidates.push({ el, lab, top: r.top, left: r.left });
    }

    candidates.sort((a, b) => a.top - b.top || a.left - b.left);

    const pick = (fn) => candidates.find((x) => fn(x.lab))?.el;

    return (
      pick(labelMatchesMessage) ||
      pick(labelMatchesAddFriend) ||
      pick(labelMatchesFollow) ||
      pick(labelMatchesEditProfile) ||
      null
    );
  }

  function getObserveRoot() {
    return document.querySelector('main') || document.querySelector('[role="main"]') || document.body;
  }

  function removeMisplacedButton() {
    const el = document.getElementById(BTN_ID);
    if (!el) return;
    const scope = getPageScope();
    if (scope && !scope.contains(el)) el.remove();
  }

  function placementOk(wrapEl, anchor, slot, scope) {
    if (!wrapEl || !wrapEl.isConnected || !scope.contains(wrapEl)) return false;
    if (
      slot &&
      slot.insertAfterEl &&
      slot.row &&
      slot.row.contains(wrapEl) &&
      wrapEl.previousElementSibling === slot.insertAfterEl
    ) {
      return true;
    }
    if (slot && slot.cell && slot.row.contains(wrapEl) && wrapEl.previousElementSibling === slot.cell)
      return true;
    if (!slot && wrapEl.previousElementSibling === anchor) return true;
    return false;
  }

  function mountButton(wrap, anchor, slot, scope, onClick) {
    ensureHeaderBtnStyles();
    wrap.style.cssText = '';

    const btn = document.createElement('div');
    btn.className = 'zt-hbtn';
    btn.setAttribute('role', 'button');
    btn.setAttribute('tabindex', '0');
    btn.setAttribute('aria-label', 'Bắt Đầu Quét - Fairy House AutoData');
    btn.innerHTML = innerNormal();

    let failTimer = null;

    function resetBtnUi() {
      btn.classList.remove('zt-hbtn--loading');
      btn.innerHTML = innerNormal();
    }

    function onModalReady(ev) {
      const d = ev.detail || {};
      const wrapGid = String(wrap.getAttribute('data-zt-ctx-id') || '');
      const wrapPid = String(wrap.getAttribute('data-zt-ctx-id') || '');
      const wrapFpKey = String(wrap.getAttribute('data-zt-fanpage-key') || '');
      if (String(d.kind || '') === 'group' && String(d.groupId || '') !== wrapGid) return;
      if (String(d.kind || '') === 'profile' && String(d.profileId || '') !== wrapPid) return;
      if (String(d.kind || '') === 'fanpage' && String(d.fanpageKey || '') !== wrapFpKey) return;
      document.removeEventListener('zoo-target-modal-ready', onModalReady);
      if (failTimer) clearTimeout(failTimer);
      failTimer = null;
      resetBtnUi();
    }

    function onBtnActivate(e) {
      e.preventDefault();
      e.stopPropagation();
      if (btn.classList.contains('zt-hbtn--loading')) return;
      btn.classList.add('zt-hbtn--loading');
      btn.innerHTML = innerLoading();
      document.addEventListener('zoo-target-modal-ready', onModalReady);
      failTimer = setTimeout(() => {
        document.removeEventListener('zoo-target-modal-ready', onModalReady);
        failTimer = null;
        resetBtnUi();
      }, 15000);
      onClick();
    }
    /** Capture: một số layer Facebook bắt sự kiện trước bubble tới nút. */
    btn.addEventListener('click', onBtnActivate, true);
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        btn.click();
      }
    });

    wrap.appendChild(btn);

    if (slot && slot.insertAfterEl) {
      slot.insertAfterEl.insertAdjacentElement('afterend', wrap);
      try {
        slot.row.style.flexWrap = 'nowrap';
        slot.row.style.alignItems = 'center';
      } catch (err) {
        /* ignore */
      }
    } else if (slot && slot.cell) {
      slot.cell.insertAdjacentElement('afterend', wrap);
      try {
        slot.row.style.flexWrap = 'nowrap';
        slot.row.style.alignItems = 'center';
      } catch (err) {
        /* ignore */
      }
    } else {
      anchor.insertAdjacentElement('afterend', wrap);
    }
  }

  function ensureGroupButton() {
    const scope = getPageScope();
    if (!scope) return;

    let existing = document.getElementById(BTN_ID);
    if (existing && scope.contains(existing) && existing.getAttribute('data-zt-ctx-kind') === 'group') {
      const gidNow = getGroupIdFromPage() || '';
      if (gidNow && existing.getAttribute('data-zt-ctx-id') !== gidNow) {
        existing.setAttribute('data-zt-ctx-id', gidNow);
      }
      const anchorOk = findAnchorInGroupHeader(scope);
      if (!anchorOk) {
        try {
          existing.remove();
        } catch (_) {
          /* ignore */
        }
        return;
      }
      const slotOk = findHorizontalFlexSlot(anchorOk, scope);
      if (placementOk(existing, anchorOk, slotOk, scope)) {
        return;
      }
      try {
        existing.remove();
      } catch (_) {
        /* ignore */
      }
      existing = null;
    }

    const anchor = findAnchorInGroupHeader(scope);
    if (!anchor) return;

    const groupId = getGroupIdFromPage() || '';
    const slot = findHorizontalFlexSlot(anchor, scope);

    if (existing && placementOk(existing, anchor, slot, scope)) {
      if (!existing.querySelector('.zt-hbtn')) {
        existing.remove();
      } else {
        if (existing.getAttribute('data-zt-ctx-id') !== groupId || existing.getAttribute('data-zt-ctx-kind') !== 'group') {
          existing.setAttribute('data-zt-ctx-id', groupId);
          existing.setAttribute('data-zt-ctx-kind', 'group');
        }
        return;
      }
    } else if (existing) {
      existing.remove();
    }

    const wrap = document.createElement('div');
    wrap.id = BTN_ID;
    wrap.setAttribute('data-zt-ctx-kind', 'group');
    wrap.setAttribute('data-zt-ctx-id', groupId);

    mountButton(wrap, anchor, slot, scope, function () {
      const gid = String(getGroupIdFromPage() || '').trim();
      document.dispatchEvent(
        new CustomEvent('zoo-target-open', {
          detail: { kind: 'group', groupId: gid }
        })
      );
    });
  }

  function ensureProfileButton() {
    const scope = getPageScope();
    if (!scope) return;

    const existing = document.getElementById(BTN_ID);
    if (existing && scope.contains(existing) && existing.getAttribute('data-zt-ctx-kind') === 'profile') {
      return;
    }

    const anchor = findAnchorInProfileHeader(scope);
    if (!anchor) return;

    const slot = findProfileToolbarSlot(anchor, scope);

    if (existing && placementOk(existing, anchor, slot, scope)) {
      if (!existing.querySelector('.zt-hbtn')) {
        existing.remove();
      } else {
        if (existing.getAttribute('data-zt-ctx-kind') !== 'profile') {
          existing.setAttribute('data-zt-ctx-kind', 'profile');
        }
        return;
      }
    } else if (existing) {
      existing.remove();
    }

    const wrap = document.createElement('div');
    wrap.id = BTN_ID;
    wrap.setAttribute('data-zt-ctx-kind', 'profile');
    wrap.setAttribute('data-zt-ctx-id', '');

    mountButton(wrap, anchor, slot, scope, function () {
      (async function () {
        const vanity = getProfileVanitySegment();
        let pid = wrap.getAttribute('data-zt-ctx-id') || '';
        if (!pid && typeof ProfileResolver !== 'undefined' && ProfileResolver.getProfileIdFromCurrentPage) {
          try {
            pid = (await ProfileResolver.getProfileIdFromCurrentPage()) || '';
            if (pid) wrap.setAttribute('data-zt-ctx-id', pid);
          } catch (err) {
            console.warn('[ZT]', err);
          }
        }
        console.info(
          '[ZT] Bấm Zoo Target · UID gửi vào modal (profile đích)=',
          pid || '(rỗng — sẽ resolve trong modal)',
          '| vanity=',
          vanity || '(không)',
          '| trang=',
          String(location.href).split('?')[0]
        );
        document.dispatchEvent(
          new CustomEvent('zoo-target-open', {
            detail: { kind: 'profile', profileId: String(pid || ''), vanity: String(vanity || '') }
          })
        );
      })();
    });
  }

  function ensureFanpageButton() {
    const scope = getPageScope();
    if (!scope) return;

    const existing = document.getElementById(BTN_ID);
    if (existing && scope.contains(existing) && existing.getAttribute('data-zt-ctx-kind') === 'fanpage') {
      return;
    }

    const anchor = findAnchorInProfileHeader(scope);
    if (!anchor) return;

    const slot = findProfileToolbarSlot(anchor, scope);
    const fpKey = String(location.pathname || '') + '|' + String(location.search || '');

    if (existing && placementOk(existing, anchor, slot, scope)) {
      if (!existing.querySelector('.zt-hbtn')) {
        existing.remove();
      } else {
        if (existing.getAttribute('data-zt-ctx-kind') !== 'fanpage') {
          existing.setAttribute('data-zt-ctx-kind', 'fanpage');
          existing.setAttribute('data-zt-fanpage-key', fpKey);
        }
        return;
      }
    } else if (existing) {
      existing.remove();
    }

    const wrap = document.createElement('div');
    wrap.id = BTN_ID;
    wrap.setAttribute('data-zt-ctx-kind', 'fanpage');
    wrap.setAttribute('data-zt-ctx-id', '');
    wrap.setAttribute('data-zt-fanpage-key', fpKey);

    mountButton(wrap, anchor, slot, scope, function () {
      const vanity = getProfileVanitySegment();
      const url = String(location.href || '').split('#')[0];
      console.info('[ZT] Bấm Zoo Target · Fanpage | vanity=', vanity || '(không)', '|', url);
      document.dispatchEvent(
        new CustomEvent('zoo-target-open', {
          detail: {
            kind: 'fanpage',
            fanpageKey: fpKey,
            vanity: String(vanity || ''),
            fanpageUrl: url
          }
        })
      );
    });
  }

  let debounceTimer = null;
  let ztRouteWatcherInstalled = false;

  function installSpaRouteWatcher(onRouteChange) {
    if (ztRouteWatcherInstalled) return;
    ztRouteWatcherInstalled = true;
    let lastKey = location.pathname + '|' + location.search;

    function emitIfChanged() {
      const k = location.pathname + '|' + location.search;
      if (k === lastKey) return;
      lastKey = k;
      onRouteChange();
    }

    const push = history.pushState;
    const replace = history.replaceState;

    history.pushState = function () {
      const r = push.apply(this, arguments);
      queueMicrotask(emitIfChanged);
      return r;
    };
    history.replaceState = function () {
      const r = replace.apply(this, arguments);
      queueMicrotask(emitIfChanged);
      return r;
    };

    window.addEventListener('popstate', emitIfChanged);
    setInterval(emitIfChanged, 900);
  }

  function ensureButton() {
    if (!ztInjectEnabled) return;
    removeMisplacedButton();
    if (isGroupPage()) {
      ensureGroupButton();
    } else if (isFanpageLikePage()) {
      ensureFanpageButton();
    } else if (isProfileLikePage()) {
      ensureProfileButton();
    }
  }

  function scheduleEnsureButton() {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(function () {
      debounceTimer = null;
      ensureButton();
    }, DEBOUNCE_MS_GROUP);
  }

  function clearRouteEnsureBurst() {
    if (ztRouteBurstTimer) {
      clearInterval(ztRouteBurstTimer);
      ztRouteBurstTimer = null;
    }
    if (ztRouteBurstStopTimer) {
      clearTimeout(ztRouteBurstStopTimer);
      ztRouteBurstStopTimer = null;
    }
    if (ztRouteBurstTimeouts && ztRouteBurstTimeouts.length) {
      for (let i = 0; i < ztRouteBurstTimeouts.length; i++) {
        clearTimeout(ztRouteBurstTimeouts[i]);
      }
    }
    ztRouteBurstTimeouts = [];
  }

  function runRouteEnsureBurst() {
    clearRouteEnsureBurst();
    const ticks = [120, 320, 650, 1100, 1800, 2800, 4200, 6200, 8600];
    for (let i = 0; i < ticks.length; i++) {
      const t = setTimeout(ensureButton, ticks[i]);
      ztRouteBurstTimeouts.push(t);
    }
    // FB render header trễ theo SPA; quét dày một đoạn ngắn để khỏi cần F5.
    ztRouteBurstTimer = setInterval(ensureButton, 700);
    ztRouteBurstStopTimer = setTimeout(clearRouteEnsureBurst, 10000);
  }

  function start() {
    ztInjectEnabled = true;
    ensureButton();
    installSpaRouteWatcher(function () {
      if (ztMutationObserver) {
        try {
          ztMutationObserver.disconnect();
          ztMutationObserver.observe(getObserveRoot(), { childList: true, subtree: true });
        } catch (_) {
          /* ignore */
        }
      }
      // Route FB doi theo SPA => re-evaluate nút
      scheduleEnsureButton();
      runRouteEnsureBurst();
    });

    if ((isFanpageLikePage() || isProfileLikePage()) && !isGroupPage()) {
      function runProfileEnsure() {
        try {
          ensureButton();
        } catch (err) {
          /* ignore */
        }
      }
      if (typeof requestIdleCallback !== 'undefined') {
        requestIdleCallback(runProfileEnsure, { timeout: 2000 });
      } else {
        setTimeout(runProfileEnsure, 600);
      }
      setTimeout(runProfileEnsure, 1400);
      setTimeout(runProfileEnsure, 3800);
      setInterval(runProfileEnsure, 4500);
      return;
    }

    ztMutationObserver = new MutationObserver(function () {
      scheduleEnsureButton();
    });
    const root = getObserveRoot();
    try {
      ztMutationObserver.observe(root, { childList: true, subtree: true });
    } catch (err) {
      try {
        ztMutationObserver.observe(document.body, { childList: true, subtree: true });
      } catch (err2) {
        /* ignore */
      }
    }

    setInterval(ensureButton, 18000);

    if (isGroupPage()) {
      [80, 250, 600, 1400, 3200, 7000].forEach(function (ms) {
        setTimeout(ensureButton, ms);
      });
    }

  }

  function onZtInjectDomReady() {
    document.removeEventListener('DOMContentLoaded', onZtInjectDomReady);
    start();
  }

  function ztTeardownInjectButton() {
    document.removeEventListener('DOMContentLoaded', onZtInjectDomReady);
    ztInjectLifecycleStarted = false;
    ztInjectEnabled = false;
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
    clearRouteEnsureBurst();
    try {
      const el = document.getElementById(BTN_ID);
      if (el && el.parentNode) el.parentNode.removeChild(el);
    } catch (_) {
      /* ignore */
    }
    if (ztMutationObserver) {
      try {
        ztMutationObserver.disconnect();
      } catch (_) {
        /* ignore */
      }
      ztMutationObserver = null;
    }
  }

  function ztRunInjectButton() {
    if (ztInjectLifecycleStarted) return;
    ztInjectLifecycleStarted = true;
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', onZtInjectDomReady);
    } else {
      start();
    }
  }

  if (window.ZTServerSession && typeof window.ZTServerSession.subscribe === 'function') {
    bootstrapSessionSnapshot();
    window.ZTServerSession.subscribe(function (session) {
      ztCurrentSession = session || null;
      evaluateInjectPermission();
    });
    // Doi UID Facebook có thể không đổi token server, nên reevaluate định kỳ.
    setInterval(evaluateInjectPermission, 2000);
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible') {
        evaluateInjectPermission();
      }
    });
  } else {
    ztRunInjectButton();
  }

  try {
    window.__ztGetGroupIdFromPage = getGroupIdFromPage;
  } catch (_) {
    /* ignore */
  }
})();
