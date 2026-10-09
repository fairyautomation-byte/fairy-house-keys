(function () {
  'use strict';

  if (window.parent !== window) {
    queueMicrotask(function () {
      window.parent.postMessage({ source: 'zt-modal', type: 'PHASE', phase: 'config' }, '*');
    });
  }

  function ztRefreshPhoneMaskFromStorage() {
    window.__ztPhoneMask = false;
  }
  ztRefreshPhoneMaskFromStorage();
  try {
    chrome.storage.onChanged.addListener(function (changes, area) {
      if (area === 'local' && changes.ztServerUser) ztRefreshPhoneMaskFromStorage();
    });
  } catch (_) {
    /* ignore */
  }

  let groupId = '';
  /** `profile` | `fanpage` | `group` */
  let scanMode = 'group';
  /** `fast` | `deep` — fast: chỉ UID + SĐT; deep: thêm khu vực + tuổi */
  let scanDepth = 'fast';
  /** UID chủ profile khi scanMode === 'profile'. */
  let profileId = '';
  /** Vanity URL (vd. duythai.6368) khi chưa resolve được UID — dùng khi bấm «Bắt đầu quét». */
  let profileVanity = '';
  /** Ảnh đại diện profile đích (Graph REST picture) hoặc og:image Fanpage. */
  let profileTargetPictureUrl = '';
  /** Ứng viên Page Object ID (Graph REST /posts). */
  let pageIdCandidates = [];
  /** ID Fanpage đã chọn sau khi thử REST. */
  let pickedFanpageId = '';
  let fanpageUrlInit = '';
  /** Tên hiển thị (trang nhóm + Graph API). */
  let groupDisplayName = '';
  let accessToken = '';
  let scanning = false;
  let paused = false;
  let cancelled = false;
  /** Tab Facebook nguồn — khi mở Zoo Target ở tab riêng (không iframe). */
  let bridgeFbTabId = null;
  /** URL tab Facebook (parent) khi modal chạy trong iframe — dùng cho lịch sử tra cứu. */
  let ztSourceTabUrl = '';
  let uidDemoFlushTimer = null;
  /** uid -> { location, birth } chờ gửi thư viện server */
  const pendingUidDemoBatch = new Map();

  let phoneFoundCount = 0;
  let uidScannedCount = 0;
  let rowCounter = 0;
  /** Profile: bấm header Điểm — đảo chiều sắp xếp (lần đầu = giảm dần). */
  let lastScoreSortDesc = false;

  /** uid -> row record */
  const rows = new Map();
  /** uid đang được chọn để auto kết bạn */
  const selectedUids = new Set();
  let inviteJobState = 'idle';
  let invitePaused = false;
  let inviteStopRequested = false;
  let inviteDelayMinSec = 15;
  let inviteDelayMaxSec = 60;
  let inviteRunToken = 0;
  let lastInviteProfileUrl = '';
  const inviteStats = { total: 0, done: 0, success: 0, failed: 0 };

  let maleCount = 0;
  let femaleCount = 0;
  /** thành phố đã chuẩn hóa -> số người */
  const cityMap = new Map();
  /** Gộp theo đầu 02 số: 09* và 03* (di động / cố định máy bàn). */
  let prefixCount09 = 0;
  let prefixCount03 = 0;
  /** Quãng tuổi (18-24 … >64) → số người (tuổi 0–17 gộp vào quãng 18-24). */
  const ageBucketCounts = new Map();
  /** Đếm số dòng đã có cả khu vực + tuổi (để kích hoạt nghỉ chống rate limit). */
  let qualifiedRowsCount = 0;
  let nextCooldownQualifiedMark = 50;
  let safetyCooldownUntil = 0;
  let safetyCooldownAnnounced = false;
  let initContextResolving = false;
  const SAFETY_COOLDOWN_EVERY = 50;
  const SAFETY_COOLDOWN_MS = 2 * 60 * 1000;
  /** Giới hạn mục tiêu SĐT trên form «Số khách hàng muốn lấy». */
  const ZT_PHONE_LIMIT_MAX = 50000;
  const ZT_PHONE_LIMIT_DEFAULT = 100;
  /** Giá trị `<select>` lọc các dòng chưa có chuỗi khu vực (đang tra / «—»). */
  const ZT_REGION_FILTER_NONE = '__zt_no_region__';
  let filterSearchTimer = null;
  /** Chu kỳ số chấm: 1 → 2 → 3 → 2 → 1 (nháy kiểu loading). */
  let emptyDotsTimer = null;
  const EMPTY_TABLE_LOADING = 'Đang phân tích đối tượng…';
  const EMPTY_TABLE_SUBTITLE =
    'Dữ liệu trích xuất sẽ tự động xuất hiện bên dưới';
  const EMPTY_DOT_COUNTS = [1, 2, 3, 2, 1];

  /** Log hiển thị trên Console của tab Facebook (không chỉ iframe extension). */
  function ztDebug() {
    const line = Array.prototype.slice.call(arguments).join(' ');
    try {
      console.info(line);
    } catch (_) {}
    if (window.parent !== window) {
      try {
        window.parent.postMessage({ source: 'zt-modal', type: 'ZT_DEBUG', line: line }, '*');
      } catch (_) {}
    }
  }

  function clearEmptyDotsTimer() {
    if (emptyDotsTimer) {
      clearInterval(emptyDotsTimer);
      emptyDotsTimer = null;
    }
  }

  function startEmptyDotsTimer() {
    clearEmptyDotsTimer();
    let step = 0;
    function tick() {
      const el = $('zt-empty-dots');
      if (!el) return;
      const n = EMPTY_DOT_COUNTS[step % EMPTY_DOT_COUNTS.length];
      el.textContent = '.'.repeat(n);
      step += 1;
    }
    tick();
    emptyDotsTimer = setInterval(tick, 420);
  }

  /**
   * Mỗi mốc 50 SĐT: buộc tra xong khu vực/tuổi rồi mới quét tiếp.
   * Điều này giúp người dùng thấy dữ liệu enrich hiển thị ngay theo từng chặng.
   */
  const LOCATION_CHECKPOINT_SIZE = 50;
  /** Facebook rate-limit: nghỉ 5 phút rồi tự thử lại. */
  const LOCATION_RATE_LIMIT_COOLDOWN_MS = 5 * 60 * 1000;
  const LOCATION_GATE_UID = 0;
  const locationQueue = [];
  const deferredLocationQueue = [];
  let locationPumpRunning = false;
  /** Legacy flag cho thông báo cũ; không còn dùng để dừng hẳn pipeline. */
  let locationRateLimitedStop = false;
  let locationRateLimitedUntil = 0;
  let nextLocationEnrichCheckpoint = LOCATION_CHECKPOINT_SIZE;

  const FRIENDLY = {
    boot: ['Đang kết nối…', 'Đang chuẩn bị hệ thống…'],
    scanList: ['Đang tra cứu dữ liệu trên Google', 'Đang thu thập danh sách…', 'Đang tìm thành viên…'],
    enrich: ['Đang tra cứu dữ liệu sâu hơn', 'Đang phân tích kỹ', 'Đang xử lý thông tin…'],
    rate: ['Đang đợi một chút…', 'Hệ thống đang nghỉ ngắn…']
  };

  function pickFriendly(bucket, salt) {
    const arr = FRIENDLY[bucket] || FRIENDLY.enrich;
    return arr[Math.abs(salt) % arr.length];
  }

  function $(id) {
    return document.getElementById(id);
  }

  function applyAppVersion() {
    const verEl = $('zt-app-version');
    const logo = $('zt-header-logo');
    let version = '';
    try {
      if (typeof chrome !== 'undefined' && chrome.runtime?.getManifest) {
        const mf = chrome.runtime.getManifest();
        version = String((mf && mf.version) || '').trim();
      }
    } catch (_) {
      /* ignore */
    }
    const v = version || '--';
    if (verEl) {
      verEl.textContent = v;
    } else {
      const h = $('zt-app-heading');
      if (h) h.textContent = 'Fairy House AutoData';
    }
    if (logo && typeof chrome !== 'undefined' && chrome.runtime?.getURL) {
      try {
        logo.src = chrome.runtime.getURL('icons/logo.png');
        logo.alt = 'Fairy House AutoData V2.0';
      } catch (_) {
        /* ignore */
      }
    }
  }

  function readScanDepthFromUi() {
    const deep = $('zt-scan-depth-deep');
    if (deep && deep.checked) return 'deep';
    return 'fast';
  }

  function isDeepScan() {
    return scanDepth === 'deep';
  }

  function getFacebookOrigin() {
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

  function buildScanLogDisplayName() {
    let n = String(groupDisplayName || '').trim();
    if (!n) {
      const line = $('zt-scan-group-line');
      if (line && line.textContent) n = String(line.textContent).replace(/\s+/g, ' ').trim();
    }
    if (!n) {
      if (scanMode === 'profile') {
        n = profileVanity ? String(profileVanity) : profileId ? 'UID ' + profileId : 'Profile';
      } else if (scanMode === 'fanpage') {
        n = pickedFanpageId ? 'Fanpage · ' + pickedFanpageId : fanpageUrlInit ? 'Fanpage' : 'Fanpage';
      } else {
        n = groupId ? 'Nhóm · ' + groupId : 'Nhóm';
      }
    }
    if (n.length > 500) n = n.slice(0, 500);
    return n;
  }

  function buildScanLogSourceUrl() {
    let u = String(ztSourceTabUrl || '').trim();
    if (!u) u = String(fanpageUrlInit || '').trim();
    if (!u && scanMode === 'profile' && profileVanity) {
      u = getFacebookOrigin() + '/' + encodeURIComponent(profileVanity);
    }
    if (!u && scanMode === 'group' && groupId) {
      u = getFacebookOrigin() + '/groups/' + encodeURIComponent(String(groupId));
    }
    if (!u) u = getFacebookOrigin() + '/';
    if (u.length > 2048) u = u.slice(0, 2048);
    return u;
  }

  function postScanLogOnce() {
    // Cắt kết nối theo dõi lịch sử quét tới máy chủ
  }

  /** Năm sinh 4 chữ số gửi API thư viện (ưu tiên năm từ GraphQL). */
  function birthYearStringForLibrary(row) {
    if (row.birthYear != null && typeof row.birthYear === 'number') {
      const y = Math.floor(row.birthYear);
      const cy = new Date().getFullYear();
      if (y >= 1900 && y <= cy) return String(y);
    }
    if (typeof row.ageNum === 'number' && row.ageNum >= 0 && row.ageNum <= 120) {
      const y = new Date().getFullYear() - Math.floor(row.ageNum);
      if (y >= 1900 && y <= new Date().getFullYear()) return String(y);
    }
    return '';
  }

  function queueUidLibraryFromRow(uid) {
    if (!isDeepScan()) return;
    const u = String(uid || '').replace(/\D/g, '');
    if (!u || u.length < 5) return;
    const row = rows.get(u);
    if (!row) return;
    let loc = '';
    if (row.cityKey && String(row.cityKey).trim() && row.cityKey !== '—') {
      loc = String(row.cityKey).trim();
    }
    const birth = birthYearStringForLibrary(row);
    if (!loc && !birth) return;
    const prev = pendingUidDemoBatch.get(u) || { location: '', birth: '' };
    pendingUidDemoBatch.set(u, {
      location: loc || prev.location || '',
      birth: birth || prev.birth || '',
    });
    if (uidDemoFlushTimer) clearTimeout(uidDemoFlushTimer);
    uidDemoFlushTimer = setTimeout(flushUidDemoToServer, 2200);
  }

  function flushUidDemoToServer() {
    // Cắt kết nối gửi dữ liệu nhân khẩu học (vị trí, tuổi) tới máy chủ
  }

  function applyScanDepthLayout() {
    const deep = isDeepScan();
    const thR = $('zt-th-region');
    const thA = $('zt-th-age');
    if (thR) thR.classList.toggle('hidden', !deep);
    if (thA) thA.classList.toggle('hidden', !deep);
    const regWrap = $('zt-sidebar-region-wrap');
    const ageWrap = $('zt-sidebar-age-wrap');
    if (regWrap) regWrap.classList.toggle('hidden', !deep);
    if (ageWrap) ageWrap.classList.toggle('hidden', !deep);
    const frw = $('zt-filter-region-wrap');
    if (frw) frw.classList.toggle('hidden', !deep);
    const tbl = $('zt-results-table');
    if (tbl) tbl.style.minWidth = deep ? '1120px' : '880px';
    syncRegionFilterOptions();
  }

  function showToast(msg, type) {
    const el = $('zt-toast');
    if (!el) return;
    el.textContent = msg;
    el.className =
      'pointer-events-none fixed bottom-4 left-1/2 z-50 max-w-md -translate-x-1/2 rounded-lg border px-4 py-2 text-sm shadow-xl ';
    if (type === 'error') el.className += 'border-rose-600 bg-rose-950/95 text-rose-100';
    else if (type === 'success') el.className += 'border-emerald-600 bg-emerald-950/95 text-emerald-100';
    else el.className += 'border-slate-600 bg-slate-900/95 text-slate-100';
    el.classList.remove('hidden');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => el.classList.add('hidden'), 4200);
  }

  function showNoticeModal(msg, title) {
    const root = $('zt-notice-modal');
    const t = $('zt-notice-title');
    const m = $('zt-notice-message');
    if (!root || !m || !t) return;
    t.textContent = String(title || 'Thông báo');
    m.textContent = String(msg || '');
    root.classList.remove('hidden');
    root.classList.add('flex');
  }

  function hideNoticeModal() {
    const root = $('zt-notice-modal');
    if (!root) return;
    root.classList.add('hidden');
    root.classList.remove('flex');
  }

  function isTokenErrorMessage(msg) {
    const s = String(msg || '').toLowerCase();
    return (
      s.includes('access token') ||
      s.includes('invalid oauth') ||
      s.includes('oauth') ||
      s.includes('token') ||
      s.includes('ads_verify')
    );
  }

  function isFanpageObjectPermissionError(msg) {
    const s = String(msg || '');
    return /Unsupported get request|does not exist|missing permissions|does not support this operation/i.test(
      s
    );
  }

  function toFriendlyFanpageErrorMessage(rawMsg) {
    if (isFanpageObjectPermissionError(rawMsg)) {
      return 'Hiện tại Fanpage này chưa đủ quyền để quét tự động. Vui lòng quét lại sau hoặc sử dụng tài khoản khác để quét nhé.';
    }
    if (isTokenErrorMessage(rawMsg)) {
      return 'Chưa thể lấy phiên đăng nhập ổn định. Vui lòng thử lại sau ít phút hoặc đổi tài khoản khác để quét nhé.';
    }
    return 'Đã có lỗi trong lúc quét. Vui lòng quét lại sau hoặc sử dụng tài khoản khác để quét nhé.';
  }

  async function getTokenWithRetry(maxRetry) {
    const retries = Math.max(0, parseInt(maxRetry, 10) || 0);
    let lastErr = null;
    for (let i = 0; i <= retries; i++) {
      try {
        const tok = await ztRequest('getToken', {});
        const t = tok && tok.token ? String(tok.token).trim() : '';
        if (t) return t;
        throw new Error('Không có access token');
      } catch (e) {
        lastErr = e;
        const msg = e && e.message ? String(e.message) : String(e || '');
        if (!isTokenErrorMessage(msg)) throw e;
        if (i >= retries) break;
        setScanStatus('Đang thử lấy lại phiên', 'Phiên đăng nhập chưa ổn định, hệ thống đang thử lại…', {
          showSpinner: true
        });
        await sleep(1800);
      }
    }
    throw lastErr || new Error('Không thể lấy access token');
  }

  function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  function setConfigResolving(on, message) {
    initContextResolving = !!on;
    const box = $('zt-config-resolving');
    const txt = $('zt-config-resolving-text');
    const lw = $('zt-limit-wrap');
    const fd = $('zt-scan-depth-fieldset');
    const bs = $('zt-btn-start');
    if (txt && message) txt.textContent = String(message);
    if (box) box.classList.toggle('hidden', !on);
    if (lw) lw.classList.toggle('hidden', on);
    if (fd) fd.classList.toggle('hidden', on);
    if (bs) {
      bs.disabled = on || scanning;
      const span = bs.querySelector('span');
      if (span) span.textContent = on ? 'Đang nhận diện…' : 'Bắt đầu quét';
    }
  }

  function isRowQualifiedForCooldown(rec) {
    if (!rec) return false;
    const hasCity = !!(rec.cityKey && String(rec.cityKey).trim() && rec.cityKey !== '—');
    const hasAge = typeof rec.ageNum === 'number' && rec.ageNum >= 0;
    return hasCity && hasAge;
  }

  function maybeMarkRowQualified(rec) {
    if (!rec || !isDeepScan()) return;
    const ok = isRowQualifiedForCooldown(rec);
    if (ok && !rec.cooldownQualified) {
      rec.cooldownQualified = true;
      qualifiedRowsCount += 1;
      while (qualifiedRowsCount >= nextCooldownQualifiedMark) {
        safetyCooldownUntil = Date.now() + SAFETY_COOLDOWN_MS;
        nextCooldownQualifiedMark += SAFETY_COOLDOWN_EVERY;
      }
      return;
    }
    if (!ok && rec.cooldownQualified) {
      rec.cooldownQualified = false;
      qualifiedRowsCount = Math.max(0, qualifiedRowsCount - 1);
    }
  }

  function formatCountdownSec(leftSec) {
    const s = Math.max(0, leftSec);
    const mm = Math.floor(s / 60);
    const ss = s % 60;
    return String(mm).padStart(2, '0') + ':' + String(ss).padStart(2, '0');
  }

  async function waitSafetyCooldown() {
    while (!cancelled && !paused && Date.now() < safetyCooldownUntil) {
      const leftSec = Math.ceil((safetyCooldownUntil - Date.now()) / 1000);
      setScanStatus(
        'Nghỉ an toàn chống rate limit',
        'Đã đủ mốc ' +
          (nextCooldownQualifiedMark - SAFETY_COOLDOWN_EVERY) +
          ' số (đủ khu vực + tuổi). Tự quét lại sau ' +
          formatCountdownSec(leftSec) +
          '.',
        { showSpinner: true }
      );
      safetyCooldownAnnounced = true;
      await sleep(1000);
    }
    if (safetyCooldownAnnounced && !cancelled && !paused) {
      safetyCooldownAnnounced = false;
      setScanStatus('Tiếp tục', 'Hết thời gian nghỉ an toàn — tiếp tục quét.', { showSpinner: true });
      await sleep(260);
    }
  }

  function ztRequest(action, payload, timeoutMs) {
    const ms = timeoutMs || 120000;
    if (bridgeFbTabId != null && typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
      return new Promise((resolve, reject) => {
        const to = setTimeout(() => reject(new Error('Timeout')), ms);
        chrome.runtime.sendMessage(
          {
            action: 'ZT_BRIDGE',
            fbTabId: bridgeFbTabId,
            bridgeAction: action,
            payload: payload || {}
          },
          (r) => {
            clearTimeout(to);
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
              return;
            }
            if (r?.ok) resolve(r.data);
            else reject(new Error(r?.error || 'Lỗi'));
          }
        );
      });
    }
    return new Promise((resolve, reject) => {
      const requestId = crypto.randomUUID();
      const to = setTimeout(() => {
        window.removeEventListener('message', onMsg);
        reject(new Error('Timeout'));
      }, ms);
      function onMsg(e) {
        if (e.source !== window.parent || !/^https:\/\/([a-z0-9-]+\.)*facebook\.com$/i.test(e.origin) || e.data?.source !== 'zt-parent' || e.data?.requestId !== requestId) return;
        window.removeEventListener('message', onMsg);
        clearTimeout(to);
        if (e.data.ok) resolve(e.data.data);
        else reject(new Error(e.data.error || 'Lỗi'));
      }
      window.addEventListener('message', onMsg);
      window.parent.postMessage({ source: 'zt-modal', requestId, action, payload }, '*');
    });
  }

  function updateInviteButtonState() {
    const btn = $('zt-btn-auto-invite');
    if (!btn) return;
    const hasSelected = selectedUids.size > 0;
    const disabled = !hasSelected || scanning || inviteJobState === 'running' || inviteJobState === 'paused';
    btn.disabled = disabled;
    btn.title = hasSelected
      ? 'Gửi lời mời kết bạn cho ' + selectedUids.size + ' người đã chọn'
      : 'Hãy chọn ít nhất 1 dòng để gửi lời mời kết bạn';
  }

  function visibleRowRecords() {
    const list = [];
    rows.forEach(function (rec) {
      if (!rec || !rec.tr) return;
      if (rec.tr.style.display === 'none') return;
      list.push(rec);
    });
    return list;
  }

  /**
   * Chọn tập records để xuất file.
   * - Nếu user đã tick ít nhất 1 dòng: chỉ xuất các dòng đã tick (bất kể đang hiển thị hay đang bị filter ẩn — vì user chủ động tick).
   * - Nếu không tick dòng nào: xuất các dòng đang hiển thị sau filter/search.
   * @returns {{records: Array, source: 'selected'|'visible'}}
   */
  function pickExportRecords() {
    if (selectedUids && selectedUids.size > 0) {
      const list = [];
      rows.forEach(function (rec) {
        if (rec && selectedUids.has(String(rec.uid || ''))) list.push(rec);
      });
      return { records: list, source: 'selected' };
    }
    return { records: visibleRowRecords(), source: 'visible' };
  }

  function refreshSelectAllState() {
    const selectAll = $('zt-select-all');
    if (!selectAll) return;
    const visible = visibleRowRecords();
    if (!visible.length) {
      selectAll.checked = false;
      selectAll.indeterminate = false;
      return;
    }
    let selectedVisible = 0;
    for (let i = 0; i < visible.length; i++) {
      if (selectedUids.has(String(visible[i].uid || ''))) selectedVisible += 1;
    }
    if (selectedVisible <= 0) {
      selectAll.checked = false;
      selectAll.indeterminate = false;
    } else if (selectedVisible >= visible.length) {
      selectAll.checked = true;
      selectAll.indeterminate = false;
    } else {
      selectAll.checked = false;
      selectAll.indeterminate = true;
    }
  }

  function syncRowSelectionUi(uid) {
    const rec = rows.get(String(uid || ''));
    if (!rec || !rec.tr) return;
    const checked = selectedUids.has(String(uid || ''));
    const cb = rec.tr.querySelector('[data-zt-row-select="1"]');
    if (cb) cb.checked = checked;
    rec.tr.classList.toggle('bg-cyan-900/35', checked);
    rec.tr.classList.toggle('ring-1', checked);
    rec.tr.classList.toggle('ring-cyan-500/40', checked);
  }

  function selectRow(uid, checked) {
    const id = String(uid || '');
    if (!id || !rows.has(id)) return;
    if (checked) selectedUids.add(id);
    else selectedUids.delete(id);
    syncRowSelectionUi(id);
    refreshSelectAllState();
    updateInviteButtonState();
  }

  function clearSelectedRows() {
    const ids = Array.from(selectedUids);
    selectedUids.clear();
    for (let i = 0; i < ids.length; i++) syncRowSelectionUi(ids[i]);
    refreshSelectAllState();
    updateInviteButtonState();
  }

  function setInvitePhase(text, showSpinner) {
    const el = $('zt-invite-phase');
    const sp = $('zt-invite-spinner');
    if (el) el.textContent = String(text || '');
    if (sp) sp.classList.toggle('hidden', !showSpinner);
  }

  function setInviteCountdown(sec) {
    const el = $('zt-invite-countdown');
    if (!el) return;
    const n = Number(sec);
    if (!Number.isFinite(n) || n <= 0) {
      el.textContent = '';
      el.classList.add('hidden');
      return;
    }
    el.textContent = 'Chờ: ' + n + 's';
    el.classList.remove('hidden');
  }

  function pushInviteLog(text, kind) {
    const wrap = $('zt-invite-log-list');
    if (!wrap) return;
    const row = document.createElement('div');
    const tone =
      kind === 'error'
        ? 'text-rose-400 font-semibold'
        : kind === 'success'
          ? 'text-emerald-400 font-medium'
          : 'text-slate-300';
    row.className = 'leading-relaxed text-[11px] ' + tone;
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    const safeText = String(text || '').replace(/[&<>"']/g, function(m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
    });
    row.innerHTML = '<span class="text-slate-500 mr-1.5 font-mono text-[10px]">[' + hh + ':' + mm + ':' + ss + ']</span>' + safeText;
    wrap.appendChild(row);
    wrap.scrollTop = wrap.scrollHeight;
  }

  function updateInviteProgressUi() {
    const total = Math.max(0, inviteStats.total || 0);
    const done = Math.max(0, inviteStats.done || 0);
    const success = Math.max(0, inviteStats.success || 0);
    const failed = Math.max(0, inviteStats.failed || 0);
    const pct = total > 0 ? Math.min(100, Math.round((done * 100) / total)) : 0;
    const f = $('zt-invite-progress-fill');
    const p = $('zt-invite-progress-percent');
    const t = $('zt-invite-stat-total');
    const d = $('zt-invite-stat-done');
    const s = $('zt-invite-stat-success');
    const x = $('zt-invite-stat-failed');
    if (f) f.style.width = pct + '%';
    if (p) p.textContent = pct + '%';
    if (t) t.textContent = String(total);
    if (d) d.textContent = String(done);
    if (s) s.textContent = String(success);
    if (x) x.textContent = String(failed);
  }

  function showInviteProgressPanel(show) {
    const panel = $('zt-invite-progress-panel');
    if (!panel) return;
    panel.classList.toggle('hidden', !show);
    panel.classList.toggle('flex', !!show);
    panel.classList.toggle('flex-col', !!show);

    const dock = $('zt-floating-dock');
    if (dock) {
      if (show) {
        dock.classList.remove('dock-visible');
      } else if (selectedUids.size > 0) {
        dock.classList.add('dock-visible');
      }
    }
  }

  function resetInviteProgressState() {
    inviteJobState = 'idle';
    invitePaused = false;
    inviteStopRequested = false;
    inviteStats.total = 0;
    inviteStats.done = 0;
    inviteStats.success = 0;
    inviteStats.failed = 0;
    const log = $('zt-invite-log-list');
    if (log) log.textContent = '';
    setInviteCountdown(0);
    lastInviteProfileUrl = '';
    const openBtn = $('zt-invite-btn-open-last');
    if (openBtn) openBtn.disabled = true;
    updateInviteProgressUi();
    setInvitePhase('Đang chờ bắt đầu…', false);
    showInviteProgressPanel(false);
    const pauseLabel = $('zt-invite-btn-pause-label');
    if (pauseLabel) pauseLabel.textContent = 'Tạm dừng';
    const stopLabel = $('zt-invite-btn-stop-label');
    if (stopLabel) stopLabel.textContent = 'Kết thúc';
    updateInviteButtonState();
  }

  function formatPhone84to09(raw) {
    if (!raw) return '';
    const s = String(raw).replace(/\D/g, '');
    if (s.startsWith('84') && s.length >= 10) return '0' + s.slice(2);
    return String(raw);
  }

  function mapPhoneDispForUi(phoneDisp) {
    if (window.__ztPhoneMask && window.ZTPhoneDisplay && typeof window.ZTPhoneDisplay.maskDisplay === 'function') {
      return window.ZTPhoneDisplay.maskDisplay(phoneDisp);
    }
    return phoneDisp;
  }

  function formatGender(g) {
    if (g === 'male') return 'Nam';
    if (g === 'female') return 'Nữ';
    return '—';
  }

  function digitsOnly(s) {
    return String(s || '').replace(/\D/g, '');
  }

  /** `tel:` — ưu tiên dạng 0xxxxxxxxx / +84. */
  function hrefTelFromDigits(digits) {
    const d = digitsOnly(digits);
    if (!d) return '#';
    if (d.startsWith('84') && d.length >= 10) return 'tel:+' + d;
    if (d.startsWith('0')) return 'tel:' + d;
    return 'tel:' + d;
  }

  /** `https://zalo.me/<84xxxxxxxxx>` (chuẩn VN). */
  function hrefZaloFromDigits(digits) {
    const d = digitsOnly(digits);
    if (!d) return '#';
    let n = d;
    if (n.startsWith('0')) n = '84' + n.slice(1);
    else if (!n.startsWith('84')) n = '84' + n;
    return 'https://zalo.me/' + n;
  }

  function esc(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /** Cung tròn từ góc aStart → aEnd (radian), tính từ trục +x, chiều kim đồng hồ trong SVG (y xuống). */
  function pieSlicePath(cx, cy, r, aStart, aEnd) {
    if (aEnd - aStart < 1e-8) return '';
    const x1 = cx + r * Math.cos(aStart);
    const y1 = cy + r * Math.sin(aStart);
    const x2 = cx + r * Math.cos(aEnd);
    const y2 = cy + r * Math.sin(aEnd);
    const large = aEnd - aStart > Math.PI ? 1 : 0;
    return (
      'M ' +
      cx +
      ' ' +
      cy +
      ' L ' +
      x1 +
      ' ' +
      y1 +
      ' A ' +
      r +
      ' ' +
      r +
      ' 0 ' +
      large +
      ' 1 ' +
      x2 +
      ' ' +
      y2 +
      ' Z'
    );
  }

  function updateScanGroupHeading() {
    const line = $('zt-scan-group-line');
    const lab = $('zt-scan-context-label');
    if (lab) {
      lab.textContent =
        scanMode === 'profile'
          ? 'Profile đang quét'
          : scanMode === 'fanpage'
            ? 'Fanpage đang quét'
            : 'Nhóm đang quét';
    }
    if (!line) return;
    const name = (groupDisplayName || '').trim();
    const fallback =
      scanMode === 'profile'
        ? profileId
          ? 'UID ' + profileId
          : profileVanity
            ? '@' + profileVanity
            : '—'
        : scanMode === 'fanpage'
          ? pickedFanpageId
            ? 'Page #' + pickedFanpageId
            : profileVanity
              ? '@' + profileVanity
              : fanpageUrlInit || '—'
          : groupId
            ? 'Nhóm #' + groupId
            : '—';
    const show = name || fallback;
    line.textContent = show;
    line.setAttribute('title', show);
    const av = $('zt-scan-profile-avatar');
    if (av) {
      const u = (profileTargetPictureUrl || '').trim();
      if ((scanMode === 'profile' || scanMode === 'fanpage') && u) {
        av.src = u;
        av.classList.remove('hidden');
      } else {
        av.removeAttribute('src');
        av.classList.add('hidden');
      }
    }
  }

  function setProfileModeUi() {
    const lw = $('zt-limit-wrap');
    const th = $('zt-th-score');
    if (lw) lw.classList.remove('hidden');
    if (th) th.classList.toggle('hidden', scanMode !== 'profile');
  }

  function resetScoreColumnSortUi() {
    lastScoreSortDesc = false;
    const up = $('zt-th-score-up');
    const down = $('zt-th-score-down');
    if (up) up.setAttribute('class', 'h-2.5 w-2.5 text-fuchsia-400/55');
    if (down) down.setAttribute('class', '-mt-px h-2.5 w-2.5 text-fuchsia-400/55');
  }

  function renumberSttAfterSort() {
    const tbody = $('zt-tbody');
    if (!tbody) return;
    let i = 0;
    tbody.querySelectorAll('tr').forEach(function (tr) {
      const tdList = tr.querySelectorAll('td');
      const sttTd = tdList && tdList.length > 1 ? tdList[1] : null;
      if (sttTd) sttTd.textContent = String(++i);
      const uid = tr.dataset.uid;
      if (uid && rows.has(uid)) rows.get(uid).stt = i;
    });
  }

  function reorderRowsByScore(desc) {
    const tbody = $('zt-tbody');
    if (!tbody || scanMode !== 'profile') return;
    const list = [];
    rows.forEach(function (rec) {
      if (rec.tr) list.push(rec);
    });
    list.sort(function (a, b) {
      const na = typeof a.scoreNum === 'number' ? a.scoreNum : -1e9;
      const nb = typeof b.scoreNum === 'number' ? b.scoreNum : -1e9;
      const cmp = na - nb;
      return desc ? -cmp : cmp;
    });
    list.forEach(function (rec) {
      tbody.appendChild(rec.tr);
    });
    renumberSttAfterSort();
    const up = $('zt-th-score-up');
    const down = $('zt-th-score-down');
    if (up && down) {
      if (desc) {
        up.setAttribute('class', 'h-2.5 w-2.5 text-fuchsia-400/30');
        down.setAttribute('class', '-mt-px h-2.5 w-2.5 text-fuchsia-300');
      } else {
        up.setAttribute('class', 'h-2.5 w-2.5 text-fuchsia-300');
        down.setAttribute('class', '-mt-px h-2.5 w-2.5 text-fuchsia-400/30');
      }
    }
    applyTableFilters();
  }

  function onScoreHeaderClick() {
    if (scanMode !== 'profile') return;
    lastScoreSortDesc = !lastScoreSortDesc;
    reorderRowsByScore(lastScoreSortDesc);
  }

  function jitterMs() {
    return 300 + Math.floor(Math.random() * 400);
  }

  function showSuccessCelebrationModal() {
    const root = $('zt-success-modal');
    if (!root) return;
    const ctxLab = $('zt-success-context-label');
    if (ctxLab) {
      ctxLab.textContent =
        scanMode === 'profile' ? 'Profile' : scanMode === 'fanpage' ? 'Fanpage' : 'Nhóm';
    }
    const g = $('zt-success-group');
    const lab =
      (groupDisplayName || '').trim() ||
      (scanMode === 'fanpage' && pickedFanpageId
        ? 'Page #' + pickedFanpageId
        : groupId
          ? scanMode === 'profile'
            ? 'UID ' + groupId
            : 'Nhóm #' + groupId
          : '—');
    if (g) {
      g.textContent = lab;
      g.setAttribute('title', lab);
    }
    const rEl = $('zt-success-rows');
    const uEl = $('zt-success-uids');
    const mEl = $('zt-success-male');
    const fEl = $('zt-success-female');
    const p9 = $('zt-success-p09');
    const p3 = $('zt-success-p03');
    const ageRow = $('zt-success-age-row');
    const ageEl = $('zt-success-age');
    if (rEl) rEl.textContent = String(rows.size);
    if (uEl) uEl.textContent = String(uidScannedCount);
    if (mEl) mEl.textContent = String(maleCount);
    if (fEl) fEl.textContent = String(femaleCount);
    if (p9) p9.textContent = String(prefixCount09);
    if (p3) p3.textContent = String(prefixCount03);
    if (ageRow && ageEl) {
      if (!isDeepScan()) {
        ageEl.textContent = '';
        ageRow.classList.add('hidden');
        ageRow.classList.remove('flex');
      } else {
        const keys = ['18-24', '25-34', '35-44', '45-54', '55-64', '>64'];
        const parts = [];
        for (let i = 0; i < keys.length; i++) {
          const k = keys[i];
          const n = ageBucketCounts.get(k) || 0;
          if (n > 0) parts.push(k + ': ' + n);
        }
        if (parts.length) {
          ageEl.textContent = parts.join(' | ');
          ageRow.classList.remove('hidden');
          ageRow.classList.add('flex');
        } else {
          ageEl.textContent = '';
          ageRow.classList.add('hidden');
          ageRow.classList.remove('flex');
        }
      }
    }
    const sub = $('zt-success-subtitle');
    if (sub) {
      sub.textContent =
        scanMode === 'profile'
          ? 'Chúc mừng — đã đạt đủ số khách hàng (SĐT) theo mục tiêu.'
          : scanMode === 'fanpage'
            ? 'Chúc mừng — đã đạt đủ số khách hàng (SĐT) theo mục tiêu.'
            : 'Chúc mừng — đã đạt đủ số điện thoại theo giới hạn.';
    }
    root.classList.remove('hidden');
    root.classList.add('flex');
  }

  function hideSuccessCelebrationModal() {
    const root = $('zt-success-modal');
    if (!root) return;
    root.classList.add('hidden');
    root.classList.remove('flex');
  }

  function profileUrlForUid(uid, memberUrl) {
    const u = String(uid);
    if (memberUrl && /^https?:\/\//i.test(memberUrl)) return memberUrl;
    return getFacebookOrigin() + '/profile.php?id=' + encodeURIComponent(u);
  }

  /**
   * Cập nhật thanh trạng thái + vùng trống bảng (spinner đồng bộ).
   * @param {string} phase - Tiêu đề ngắn (VD: "Tải danh sách UID")
   * @param {string} detail - Mô tả chi tiết
   * @param {{ showSpinner?: boolean, done?: boolean }} opts
   */
  function setScanStatus(phase, detail, opts) {
    opts = opts || {};
    const spin =
      opts.showSpinner !== false &&
      scanning &&
      !paused &&
      !opts.done;

    const p1 = $('zt-status-phase');
    const d1 = $('zt-status-detail');
    const p2 = $('zt-empty-phase');
    const d2 = $('zt-empty-detail');
    const spBar = $('zt-status-spinner');
    const spEmpty = $('zt-empty-spinner');
    const emptyState = $('zt-empty-state');

    if (p1) p1.textContent = phase || '';
    if (d1) d1.textContent = detail || '';

    const showEmptySpin = spin && rows.size === 0;

    if (showEmptySpin) {
      clearEmptyDotsTimer();
      if (p2) {
        p2.classList.remove('hidden');
        p2.textContent = EMPTY_TABLE_LOADING;
      }
      if (d2) {
        d2.classList.remove('hidden', 'mt-2', 'text-slate-100');
        d2.textContent = EMPTY_TABLE_SUBTITLE;
      }
    } else {
      clearEmptyDotsTimer();
      if (p2) {
        p2.classList.toggle('hidden', !phase);
        p2.textContent = phase || '';
      }
      if (d2) {
        d2.classList.toggle('hidden', !detail);
        d2.classList.remove('text-slate-100');
        d2.textContent = detail || '';
      }
    }

    if (spBar) spBar.classList.toggle('hidden', !spin);
    if (spEmpty) {
      spEmpty.classList.toggle('hidden', !showEmptySpin);
    }
    if (emptyState) emptyState.classList.toggle('hidden', rows.size > 0);
  }

  let scrollTableScheduled = false;
  /** Cuộn vùng bảng xuống dòng mới nhất khi có thêm SĐT. */
  function scheduleScrollPhoneTable() {
    if (scrollTableScheduled) return;
    scrollTableScheduled = true;
    requestAnimationFrame(() => {
      scrollTableScheduled = false;
      const el = $('zt-table-scroll');
      if (el) el.scrollTop = el.scrollHeight;
    });
  }

  function updateEmptyHint() {
    const emptyState = $('zt-empty-state');
    const hint = $('zt-empty-hint');
    if (rows.size > 0) {
      if (emptyState) emptyState.classList.add('hidden');
      if (hint) hint.classList.add('hidden');
      return;
    }
    if (emptyState) emptyState.classList.remove('hidden');
    if (hint) hint.classList.add('hidden');

    const errPanel = $('zt-error-panel');
    const errVisible = errPanel && !errPanel.classList.contains('hidden');

    if (!scanning && !errVisible) {
      clearEmptyDotsTimer();
      const sp = $('zt-empty-spinner');
      if (sp) sp.classList.add('hidden');
      const p2 = $('zt-empty-phase');
      const d2 = $('zt-empty-detail');
      if (p2) {
        p2.classList.remove('hidden');
        p2.textContent = 'Sẵn sàng khởi chạy';
      }
      if (d2) {
        d2.classList.remove('hidden', 'text-slate-100');
        d2.classList.add('mt-1');
        d2.innerHTML =
          'Nhấn <strong class="text-teal-700 font-semibold">Bắt đầu chiến dịch</strong> để tiến hành phân tích đối tượng.';
      }
      const bar = $('zt-status-spinner');
      if (bar) bar.classList.add('hidden');
    }
  }

  function parsePhoneLimitDigitsOnly(trimmed) {
    const t = String(trimmed || '').trim();
    if (!t || !/^\d+$/.test(t)) return NaN;
    return parseInt(t, 10);
  }

  function effectivePhoneLimit() {
    const el = $('zt-input-limit');
    const raw = el ? parsePhoneLimitDigitsOnly(String(el.value).trim()) : NaN;
    const n = Number.isFinite(raw) ? raw : ZT_PHONE_LIMIT_DEFAULT;
    if (n < 1) return 1;
    if (n > ZT_PHONE_LIMIT_MAX) return ZT_PHONE_LIMIT_MAX;
    return n;
  }

  /** Đồng bộ giá trị ô nhập với [1, ZT_PHONE_LIMIT_MAX]; `toast` = báo khi đã chỉnh tay. */
  function normalizePhoneLimitInputField(toast) {
    const el = $('zt-input-limit');
    if (!el) return;
    const trimmed = String(el.value).trim();
    const raw = parsePhoneLimitDigitsOnly(trimmed);
    let next = ZT_PHONE_LIMIT_DEFAULT;
    let changed = false;
    if (!Number.isFinite(raw)) {
      next = ZT_PHONE_LIMIT_DEFAULT;
      changed = trimmed !== String(ZT_PHONE_LIMIT_DEFAULT);
    } else if (raw < 1) {
      next = 1;
      changed = true;
    } else if (raw > ZT_PHONE_LIMIT_MAX) {
      next = ZT_PHONE_LIMIT_MAX;
      changed = true;
    } else {
      next = raw;
      changed = String(el.value) !== String(next);
    }
    if (changed) el.value = String(next);
    if (toast && changed) {
      if (!Number.isFinite(raw) && trimmed === '') {
        showToast('Nhập số từ 1 đến 50.000 khách hàng.', 'info');
      } else if (!Number.isFinite(raw) && trimmed !== '') {
        showToast('Chỉ nhập số nguyên từ 1 đến 50.000.', 'info');
      } else if (Number.isFinite(raw) && raw < 1) {
        showToast('Số khách hàng phải lớn hơn 0 (tối thiểu 1).', 'info');
      } else if (Number.isFinite(raw) && raw > ZT_PHONE_LIMIT_MAX) {
        showToast('Tối đa 50.000 khách hàng mỗi lượt quét.', 'info');
      }
    }
  }

  function clampPhoneLimitInputWhileTyping() {
    const el = $('zt-input-limit');
    if (!el) return;
    const t = String(el.value).trim();
    if (!t) return;
    const raw = parsePhoneLimitDigitsOnly(t);
    if (!Number.isFinite(raw)) return;
    if (raw > ZT_PHONE_LIMIT_MAX) el.value = String(ZT_PHONE_LIMIT_MAX);
  }

  function updateStats() {
    $('zt-stat-uids').textContent = String(uidScannedCount);
    $('zt-stat-phones').textContent = String(phoneFoundCount);
    const limit = effectivePhoneLimit();
    const remainWrap = $('zt-stat-remain-wrap');
    if (remainWrap) remainWrap.classList.remove('hidden');
    $('zt-stat-remain').textContent = String(Math.max(0, limit - phoneFoundCount));
    updateTargetProgress();
    updateFanpageCsvExportButton();
  }

  /** Chỉ Fanpage + đã có dòng: hiện nút xuất CSV (không tự tải khi đóng modal). */
  function updateFanpageCsvExportButton() {
    const b = $('zt-btn-fanpage-csv');
    if (!b) return;
    const show = scanMode === 'fanpage' && rows.size > 0;
    b.classList.toggle('hidden', !show);
    if (show) b.removeAttribute('aria-hidden');
    else b.setAttribute('aria-hidden', 'true');
  }

  function updateTargetProgress() {
    const limit = effectivePhoneLimit();
    const pct = Math.min(100, Math.round(((phoneFoundCount / limit) * 1000)) / 10);
    const fill = $('zt-progress-fill');
    const lab = $('zt-progress-label');
    if (fill) fill.style.width = pct + '%';
    if (lab) lab.textContent = pct + '%';
    updatePauseButtonVisibility();
  }

  /** Đủ SĐT theo mục tiêu (100%) thì ẩn «Tạm dừng» — không còn ý nghĩa. */
  function updatePauseButtonVisibility() {
    const pauseBtn = $('zt-btn-pause');
    if (!pauseBtn) return;
    const limit = effectivePhoneLimit();
    const goalReached = phoneFoundCount >= limit;
    pauseBtn.classList.toggle('hidden', goalReached);
    if (goalReached) pauseBtn.setAttribute('aria-hidden', 'true');
    else pauseBtn.removeAttribute('aria-hidden');
    pauseBtn.disabled = goalReached;
  }

  /**
   * Thanh ngang tiến độ quét bài (profile): currentPost 1…total — ví dụ 20/200 → 10%.
   * @param {number} currentPost - Bài đang xử lý (1-based), hoặc 0 khi chưa vào bài nào.
   * @param {number} totalPosts
   */
  function updateProfilePostProgress(currentPost, totalPosts) {
    if (scanMode !== 'profile') return;
    const total = Math.max(1, totalPosts || 1);
    const cur = Math.max(0, Math.min(currentPost, total));
    const pct = cur <= 0 ? 0 : Math.min(100, Math.round((cur / total) * 100));
    const fill = $('zt-progress-post-fill');
    const lab = $('zt-progress-post-label');
    const cnt = $('zt-progress-post-count');
    if (fill) fill.style.width = pct + '%';
    if (lab) lab.textContent = pct + '%';
    if (cnt) cnt.textContent = cur + '/' + total;
  }

  function resetSidebarStats() {
    maleCount = 0;
    femaleCount = 0;
    cityMap.clear();
    prefixCount09 = 0;
    prefixCount03 = 0;
    ageBucketCounts.clear();
    const m = $('zt-sb-male');
    const f = $('zt-sb-female');
    if (m) m.textContent = '0';
    if (f) f.textContent = '0';
    renderGenderPie();
    renderCityPie();
    renderRegionTable();
    renderPrefixStats();
    renderAgeBars();
    syncRegionFilterOptions();
  }

  function ageToBucket(age) {
    if (typeof age !== 'number' || age < 0) return '';
    if (age <= 24) return '18-24';
    if (age <= 34) return '25-34';
    if (age <= 44) return '35-44';
    if (age <= 54) return '45-54';
    if (age <= 64) return '55-64';
    return '>64';
  }

  function incAgeBucket(key) {
    if (!key) return;
    ageBucketCounts.set(key, (ageBucketCounts.get(key) || 0) + 1);
  }

  function decAgeBucket(key) {
    if (!key) return;
    const n = (ageBucketCounts.get(key) || 0) - 1;
    if (n <= 0) ageBucketCounts.delete(key);
    else ageBucketCounts.set(key, n);
  }

  function renderAgeBars() {
    const el = $('zt-age-bars');
    if (!el) return;
    const title = $('zt-age-title');
    const keys = ['18-24', '25-34', '35-44', '45-54', '55-64', '>64'];
    const items = [];
    let max = 0;
    for (let i = 0; i < keys.length; i++) {
      const n = ageBucketCounts.get(keys[i]) || 0;
      if (n > 0) {
        items.push({ key: keys[i], count: n });
        max = Math.max(max, n);
      }
    }
    if (!items.length) {
      if (title) title.classList.add('hidden');
      el.classList.add('hidden');
      el.innerHTML = '';
      return;
    }
    if (title) title.classList.remove('hidden');
    el.classList.remove('hidden');
    let html = '';
    for (let i = 0; i < items.length; i++) {
      const k = items[i].key;
      const n = items[i].count;
      const pct = Math.round((n / max) * 100);
      html +=
        '<div class="space-y-0.5">' +
        '<div class="flex items-center justify-between gap-2">' +
        '<span class="truncate text-slate-400">' +
        esc(k) +
        '</span>' +
        '<strong class="shrink-0 font-mono text-indigo-200">' +
        n +
        '</strong>' +
        '</div>' +
        '<div class="h-2 overflow-hidden rounded-full bg-slate-700/90">' +
        '<div class="h-full rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 transition-[width] duration-300" style="width:' +
        pct +
        '%"></div>' +
        '</div>' +
        '</div>';
    }
    el.innerHTML = html;
  }

  /**
   * @param {string} uid
   * @param {number|null|undefined} age - null/undefined → «—», không đếm bucket
   */
  function applyRowAge(uid, age) {
    const row = rows.get(uid);
    if (!row || !row.tr) return;
    const td = row.tr.querySelector('[data-zt-col="age"]');
    if (td) {
      td.removeAttribute('data-zt-loc-pending');
      td.textContent = typeof age === 'number' && age >= 0 ? String(age) : '—';
    }

    const prev = row.ageBucket || '';
    const next = typeof age === 'number' && age >= 0 ? ageToBucket(age) : '';
    if (prev) decAgeBucket(prev);
    row.ageBucket = next || null;
    row.ageNum = typeof age === 'number' && age >= 0 ? age : null;
    row.ageText = typeof age === 'number' && age >= 0 ? String(age) : '';
    if (next) incAgeBucket(next);
    maybeMarkRowQualified(row);
    renderAgeBars();
    applyTableFilters();
    queueUidLibraryFromRow(uid);
  }

  function renderGenderPie() {
    const el = $('zt-pie-gender');
    if (!el) return;
    const cx = 56;
    const cy = 56;
    const r = 48;
    const t = maleCount + femaleCount;
    if (t === 0) {
      el.innerHTML =
        '<svg viewBox="0 0 112 112" class="h-28 w-28 shrink-0" aria-hidden="true">' +
        '<circle cx="56" cy="56" r="48" fill="#334155" stroke="#475569" stroke-width="1"/>' +
        '</svg>';
      return;
    }
    const pctM = (maleCount / t) * 100;
    const pctF = (femaleCount / t) * 100;
    let svg =
      '<svg viewBox="0 0 112 112" class="h-28 w-28 shrink-0 overflow-visible" aria-hidden="true">';
    if (femaleCount === 0) {
      svg +=
        '<circle cx="' +
        cx +
        '" cy="' +
        cy +
        '" r="' +
        r +
        '" fill="#38bdf8" class="zt-pie-seg transition-opacity hover:opacity-90">' +
        '<title>Nam: ' +
        maleCount +
        ' (' +
        pctM.toFixed(1) +
        '%)</title></circle>';
    } else if (maleCount === 0) {
      svg +=
        '<circle cx="' +
        cx +
        '" cy="' +
        cy +
        '" r="' +
        r +
        '" fill="#e879f9" class="zt-pie-seg transition-opacity hover:opacity-90">' +
        '<title>Nữ: ' +
        femaleCount +
        ' (' +
        pctF.toFixed(1) +
        '%)</title></circle>';
    } else {
      const a0 = -Math.PI / 2;
      const a1 = a0 + (maleCount / t) * 2 * Math.PI;
      const a2 = a0 + 2 * Math.PI;
      const dM = pieSlicePath(cx, cy, r, a0, a1);
      const dF = pieSlicePath(cx, cy, r, a1, a2);
      svg +=
        '<path fill="#38bdf8" class="zt-pie-seg transition-opacity hover:opacity-90" d="' +
        dM +
        '"><title>Nam: ' +
        maleCount +
        ' (' +
        pctM.toFixed(1) +
        '%)</title></path>';
      svg +=
        '<path fill="#e879f9" class="zt-pie-seg transition-opacity hover:opacity-90" d="' +
        dF +
        '"><title>Nữ: ' +
        femaleCount +
        ' (' +
        pctF.toFixed(1) +
        '%)</title></path>';
    }
    svg += '</svg>';
    el.innerHTML = svg;
  }

  function renderCityPie() {
    const el = $('zt-pie-city');
    if (!el) return;
    const entries = [...cityMap.entries()].sort((x, y) => y[1] - x[1]);
    const total = entries.reduce((s, e) => s + e[1], 0);
    const cx = 56;
    const cy = 56;
    const rad = 48;
    if (total === 0) {
      el.innerHTML =
        '<svg viewBox="0 0 112 112" class="h-28 w-28 shrink-0" aria-hidden="true">' +
        '<circle cx="56" cy="56" r="48" fill="#334155" stroke="#475569" stroke-width="1"/>' +
        '</svg>';
      return;
    }
    const colors = ['#6366f1', '#e879f9', '#22c55e', '#f59e0b', '#38bdf8', '#fb7185', '#a78bfa', '#94a3b8'];
    const maxSlices = 8;
    const top = entries.slice(0, maxSlices);
    const rest = entries.slice(maxSlices);
    const restSum = rest.reduce((s, e) => s + e[1], 0);
    const list = restSum > 0 ? [...top, ['Khác (' + rest.length + ' khu)', restSum]] : top;
    if (list.length === 1) {
      const label = list[0][0];
      const count = list[0][1];
      const pct = (count / total) * 100;
      el.innerHTML =
        '<svg viewBox="0 0 112 112" class="h-28 w-28 shrink-0 overflow-visible" aria-hidden="true">' +
        '<circle cx="' +
        cx +
        '" cy="' +
        cy +
        '" r="' +
        rad +
        '" fill="' +
        colors[0] +
        '" class="zt-pie-seg transition-opacity hover:opacity-90">' +
        '<title>' +
        esc(String(label)) +
        ': ' +
        count +
        ' (' +
        pct.toFixed(1) +
        '%)</title></circle></svg>';
      return;
    }
    let angle = -Math.PI / 2;
    let svg =
      '<svg viewBox="0 0 112 112" class="h-28 w-28 shrink-0 overflow-visible" aria-hidden="true">';
    for (let i = 0; i < list.length; i++) {
      const label = list[i][0];
      const count = list[i][1];
      const sweep = (count / total) * 2 * Math.PI;
      const a0 = angle;
      const a1 = angle + sweep;
      angle = a1;
      const pct = (count / total) * 100;
      const d = pieSlicePath(cx, cy, rad, a0, a1);
      if (!d) continue;
      svg +=
        '<path fill="' +
        colors[i % colors.length] +
        '" class="zt-pie-seg transition-opacity hover:opacity-90" d="' +
        d +
        '"><title>' +
        esc(String(label)) +
        ': ' +
        count +
        ' (' +
        pct.toFixed(1) +
        '%)</title></path>';
    }
    svg += '</svg>';
    el.innerHTML = svg;
  }

  function renderRegionTable() {
    const tb = $('zt-region-tbody');
    if (!tb) return;
    const entries = [...cityMap.entries()].sort((a, b) => b[1] - a[1]);
    tb.innerHTML = '';
    for (const [city, n] of entries) {
      const tr = document.createElement('tr');
      tr.className = 'border-b border-slate-700/40';
      tr.innerHTML =
        '<td class="max-w-[140px] truncate px-2 py-1" title="' +
        esc(city) +
        '">' +
        esc(city) +
        '</td>' +
        '<td class="px-1 py-1 text-right font-mono text-violet-200">' +
        n +
        '</td>';
      tb.appendChild(tr);
    }
  }

  function syncRegionFilterOptions() {
    const sel = $('zt-filter-region');
    if (!sel) return;
    if (!isDeepScan()) {
      sel.innerHTML = '<option value="">Tất cả</option>';
      sel.value = '';
      return;
    }
    const prev = sel.value;
    sel.textContent = '';
    const optAll = document.createElement('option');
    optAll.value = '';
    optAll.textContent = 'Tất cả';
    sel.appendChild(optAll);
    const entries = [...cityMap.entries()].sort((a, b) => b[1] - a[1]);
    for (let i = 0; i < entries.length; i++) {
      const city = entries[i][0];
      const o = document.createElement('option');
      o.value = city;
      o.textContent = city;
      sel.appendChild(o);
    }
    let hasUnassigned = false;
    rows.forEach(function (rec) {
      if (!rec || !rec.tr) return;
      const ck = rec.cityKey;
      if (ck && String(ck).trim()) return;
      hasUnassigned = true;
    });
    if (hasUnassigned) {
      const o = document.createElement('option');
      o.value = ZT_REGION_FILTER_NONE;
      o.textContent = 'Chưa có khu vực';
      sel.appendChild(o);
    }
    if (prev === ZT_REGION_FILTER_NONE) {
      sel.value = hasUnassigned ? ZT_REGION_FILTER_NONE : '';
    } else if (prev && cityMap.has(prev)) {
      sel.value = prev;
    } else {
      sel.value = '';
    }
  }

  function bumpGender(genderDisp) {
    if (genderDisp === 'Nam') maleCount += 1;
    else if (genderDisp === 'Nữ') femaleCount += 1;
    const m = $('zt-sb-male');
    const f = $('zt-sb-female');
    if (m) m.textContent = String(maleCount);
    if (f) f.textContent = String(femaleCount);
    renderGenderPie();
  }

  function bumpPrefix(phoneDisp) {
    const d = formatPhone84to09(digitsOnly(phoneDisp));
    if (d.startsWith('09')) prefixCount09 += 1;
    else if (d.startsWith('03')) prefixCount03 += 1;
    else return;
    renderPrefixStats();
  }

  function renderPrefixStats() {
    const a = $('zt-sb-prefix-09');
    const b = $('zt-sb-prefix-03');
    if (a) a.textContent = String(prefixCount09);
    if (b) b.textContent = String(prefixCount03);
  }

  function rowMatchesFilters(rec) {
    if (!rec) return false;
    const q = (($('zt-filter-search') && $('zt-filter-search').value) || '').trim().toLowerCase();
    if (q) {
      const hay = (
        rec.name +
        ' ' +
        rec.phone +
        ' ' +
        (rec.cityKey || '') +
        ' ' +
        (rec.ageText || '') +
        ' ' +
        (rec.scoreText || '')
      ).toLowerCase();
      if (!hay.includes(q)) return false;
    }
    const g = ($('zt-filter-gender') && $('zt-filter-gender').value) || '';
    if (g && rec.gender !== g) return false;
    const pf = ($('zt-filter-prefix') && $('zt-filter-prefix').value) || '';
    if (pf) {
      const d = formatPhone84to09(rec.phoneDigits || digitsOnly(rec.phone));
      if (!d.startsWith(pf)) return false;
    }
    const rg = ($('zt-filter-region') && $('zt-filter-region').value) || '';
    if (rg === ZT_REGION_FILTER_NONE) {
      if (rec.cityKey && String(rec.cityKey).trim()) return false;
    } else if (rg) {
      if ((rec.cityKey || '') !== rg) return false;
    }
    return true;
  }

  function isFilterActive() {
    const q = (($('zt-filter-search') && $('zt-filter-search').value) || '').trim();
    const g = ($('zt-filter-gender') && $('zt-filter-gender').value) || '';
    const pf = ($('zt-filter-prefix') && $('zt-filter-prefix').value) || '';
    const rg = ($('zt-filter-region') && $('zt-filter-region').value) || '';
    return !!(q || g || pf || rg);
  }

  function updateFilterIndicators(visibleCount, totalCount, isFiltering) {
    // 1. Badge kết quả trên thanh lọc
    const badgeWrap = $('zt-filter-badge-wrap');
    const badgeCount = $('zt-filter-badge-count');
    if (badgeWrap && badgeCount) {
      if (isFiltering) {
        badgeWrap.classList.remove('hidden');
        badgeWrap.classList.add('inline-flex');
        badgeCount.textContent = visibleCount + ' / ' + totalCount;
      } else {
        badgeWrap.classList.add('hidden');
        badgeWrap.classList.remove('inline-flex');
      }
    }

    // 2. Thẻ KPI số điện thoại trên đầu
    const statFiltered = $('zt-stat-phones-filtered');
    if (statFiltered) {
      if (isFiltering) {
        statFiltered.textContent = 'Lọc: ' + visibleCount;
        statFiltered.classList.remove('hidden');
      } else {
        statFiltered.classList.add('hidden');
      }
    }

    // 3. Badge menu trái
    const navLeads = $('zt-nav-count-leads');
    if (navLeads) {
      navLeads.textContent = isFiltering ? String(visibleCount) : String(totalCount);
      navLeads.title = isFiltering
        ? 'Đang lọc ' + visibleCount + ' / ' + totalCount + ' khách hàng'
        : totalCount + ' khách hàng';
    }

    // 4. Trạng thái không có kết quả lọc
    const emptyTbody = $('zt-filter-empty-tbody');
    if (emptyTbody) {
      const showEmpty = totalCount > 0 && visibleCount === 0 && isFiltering;
      emptyTbody.classList.toggle('hidden', !showEmpty);
    }
  }

  function applyTableFilters() {
    const filtering = isFilterActive();
    let visibleCount = 0;
    rows.forEach((rec) => {
      if (!rec.tr) return;
      const matched = rowMatchesFilters(rec);
      rec.tr.style.display = matched ? '' : 'none';
      if (matched) {
        visibleCount++;
        const sttTd = rec.tr.querySelector('[data-zt-col="stt"]') || (rec.tr.children && rec.tr.children[1]);
        if (sttTd) {
          sttTd.textContent = filtering ? String(visibleCount) : String(rec.stt);
          if (filtering) {
            sttTd.title = 'STT hiển thị: ' + visibleCount + ' (STT gốc: #' + rec.stt + ')';
          } else {
            sttTd.removeAttribute('title');
          }
        }
      }
    });

    updateFilterIndicators(visibleCount, rows.size, filtering);
    refreshSelectAllState();
    updateInviteButtonState();
  }

  function resetAllFilters() {
    const fs = $('zt-filter-search');
    const fg = $('zt-filter-gender');
    const fp = $('zt-filter-prefix');
    const fr = $('zt-filter-region');
    if (fs) fs.value = '';
    if (fg) fg.value = '';
    if (fp) fp.value = '';
    if (fr) fr.value = '';
    applyTableFilters();
  }

  function scheduleApplyFilters() {
    if (filterSearchTimer) clearTimeout(filterSearchTimer);
    filterSearchTimer = setTimeout(function () {
      filterSearchTimer = null;
      applyTableFilters();
    }, 180);
  }

  function applyRowRegion(uid, cityLabel) {
    const row = rows.get(uid);
    if (!row || !row.tr) return;
    const td = row.tr.querySelector('[data-zt-col="region"]');
    if (td) {
      td.removeAttribute('data-zt-loc-pending');
      td.textContent = cityLabel;
    }

    if (row.cityCounted && row.cityKey) {
      const prev = cityMap.get(row.cityKey) || 1;
      if (prev <= 1) cityMap.delete(row.cityKey);
      else cityMap.set(row.cityKey, prev - 1);
    }
    if (cityLabel && cityLabel !== '—') {
      row.cityKey = cityLabel;
      row.cityCounted = true;
      cityMap.set(cityLabel, (cityMap.get(cityLabel) || 0) + 1);
    } else {
      row.cityKey = null;
      row.cityCounted = false;
    }
    maybeMarkRowQualified(row);
    renderCityPie();
    renderRegionTable();
    syncRegionFilterOptions();
    applyTableFilters();
    queueUidLibraryFromRow(uid);
  }

  function enqueueLocationJob(uid, profileUrl) {
    if (!isDeepScan()) return;
    if (!profileUrl) return;
    const job = { uid, profileUrl };
    if (uidScannedCount < LOCATION_GATE_UID) {
      deferredLocationQueue.push(job);
      return;
    }
    locationQueue.push(job);
    runLocationPump();
  }

  async function waitLocationRateLimitCooldown() {
    while (!cancelled && Date.now() < locationRateLimitedUntil) {
      while (paused && !cancelled) await sleep(350);
      if (cancelled) return;
      const leftSec = Math.ceil((locationRateLimitedUntil - Date.now()) / 1000);
      setScanStatus(
        'Facebook đang giới hạn tần suất',
        'Tạm nghỉ tra khu vực/tuổi ' + formatCountdownSec(leftSec) + ' rồi tự chạy lại.',
        { showSpinner: true }
      );
      await sleep(1000);
    }
  }

  function flushDeferredLocationJobs() {
    while (deferredLocationQueue.length) {
      locationQueue.push(deferredLocationQueue.shift());
    }
    runLocationPump();
  }

  /** Xóa hàng chờ tra khu vực và gỡ «Đang tra cứu» (khi Kết thúc / hủy). */
  function abortLocationJobs() {
    locationQueue.length = 0;
    deferredLocationQueue.length = 0;
    rows.forEach(function (rec, uid) {
      if (!rec.tr) return;
      const td = rec.tr.querySelector('[data-zt-col="region"]');
      if (td && td.hasAttribute('data-zt-loc-pending')) {
        applyRowRegion(String(uid), '—');
        applyRowAge(String(uid), null);
      }
    });
  }

  async function runLocationPump() {
    if (locationPumpRunning) return;
    locationPumpRunning = true;
    const LOC_REQ_MS = 55000;
    try {
      while (locationQueue.length && !cancelled && !locationRateLimitedStop) {
        await waitLocationRateLimitCooldown();
        if (cancelled) break;
        await waitSafetyCooldown();
        while (paused && !cancelled) await sleep(400);
        if (cancelled || locationRateLimitedStop) break;
        const batch = [];
        for (let i = 0; i < 1 && locationQueue.length; i++) {
          batch.push(locationQueue.shift());
        }
        if (!batch.length) break;
        await Promise.all(
          batch.map(function (job) {
            return ztRequest('fetchProfileLocation', { url: job.profileUrl, uid: job.uid }, LOC_REQ_MS)
              .then(function (data) {
                const c = data && data.city ? String(data.city).trim() : '';
                const rec = rows.get(String(job.uid));
                if (rec && data && data.birthYear != null && typeof data.birthYear === 'number') {
                  const by = Math.floor(data.birthYear);
                  const cy = new Date().getFullYear();
                  if (by >= 1900 && by <= cy) rec.birthYear = by;
                }
                applyRowRegion(job.uid, c || '—');
                const a = data && typeof data.age === 'number' ? data.age : null;
                applyRowAge(job.uid, a);
              })
              .catch(function (err) {
                const msg = err && err.message ? String(err.message) : '';
                if (/RATE_LIMIT/i.test(msg)) {
                  locationRateLimitedUntil = Math.max(
                    locationRateLimitedUntil,
                    Date.now() + LOCATION_RATE_LIMIT_COOLDOWN_MS
                  );
                  locationQueue.unshift(job);
                  showToast('Facebook giới hạn tần suất — nghỉ 5 phút rồi tự tra tiếp.', 'info');
                  return;
                }
                applyRowRegion(job.uid, '—');
                applyRowAge(job.uid, null);
              });
          })
        );
        await sleep(680);
        if (locationRateLimitedStop) break;
      }
    } finally {
      locationPumpRunning = false;
      if (locationQueue.length > 0 && !cancelled && !locationRateLimitedStop) {
        setTimeout(function () {
          runLocationPump();
        }, 0);
      }
    }
  }

  async function maybeWaitForLocationCheckpoint() {
    if (!isDeepScan()) return;
    while (!cancelled && phoneFoundCount >= nextLocationEnrichCheckpoint) {
      const checkpoint = nextLocationEnrichCheckpoint;
      setScanStatus(
        'Đang đồng bộ khu vực/tuổi',
        'Đã đạt ' +
          checkpoint +
          ' SĐT — đang tra khu vực/tuổi trước khi quét chặng kế tiếp.',
        { showSpinner: true }
      );
      flushDeferredLocationJobs();
      await waitForLocationDrain();
      if (cancelled) return;
      nextLocationEnrichCheckpoint += LOCATION_CHECKPOINT_SIZE;
    }
  }

  /** Số dòng cột khu vực vẫn «Đang tra cứu». */
  function countRegionPendingRows() {
    let n = 0;
    rows.forEach(function (rec) {
      if (!rec.tr) return;
      const td = rec.tr.querySelector('[data-zt-col="region"]');
      if (td && td.hasAttribute('data-zt-loc-pending')) n++;
    });
    return n;
  }

  /** Chờ hàng tra khu vực xử lý xong (GraphQL + fallback www) trước khi báo hoàn tất. */
  async function waitForLocationDrain() {
    const deadline = Date.now() + 25 * 60 * 1000;
    while (Date.now() < deadline) {
      if (locationRateLimitedStop) {
        abortLocationJobs();
        return;
      }
      if (cancelled) {
        abortLocationJobs();
        return;
      }
      /* Không ghi đè dòng trạng thái «Đã tạm dừng» của nút Tạm dừng. */
      if (paused) {
        await sleep(300);
        continue;
      }
      if (Date.now() < locationRateLimitedUntil) {
        await waitLocationRateLimitCooldown();
        continue;
      }
      flushDeferredLocationJobs();
      const qWait = locationQueue.length + deferredLocationQueue.length;
      const pend = countRegionPendingRows();
      if (locationPumpRunning || qWait > 0 || pend > 0) {
        if (pend > 0 || qWait > 0) {
          setScanStatus(
            'Đang tra cứu khu vực',
            pend
              ? 'Còn ' + pend + ' dòng đang tra — có thể bấm «Kết thúc» để dừng hẳn.'
              : 'Đang xử lý hàng chờ…',
            { showSpinner: true }
          );
        }
        await sleep(200);
        continue;
      }
      await sleep(120);
      if (
        !locationPumpRunning &&
        locationQueue.length === 0 &&
        deferredLocationQueue.length === 0 &&
        countRegionPendingRows() === 0
      ) {
        return;
      }
    }
  }

  /** Nội dung nút tạm dừng / tiếp tục (có icon). */
  function setPauseButtonContent(isPaused) {
    const btn = $('zt-btn-pause');
    if (!btn) return;
    if (isPaused) {
      btn.innerHTML =
        '<svg class="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>' +
        '<span>Tiếp tục</span>';
    } else {
      btn.innerHTML =
        '<svg class="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>' +
        '<span>Tạm dừng</span>';
    }
  }

  function isWorkspaceHidden() {
    const ws = $('zt-section-workspace');
    return !ws || ws.classList.contains('hidden');
  }

  /** Gắn class để body/#zt-app không kéo full chiều cao iframe khi chỉ màn cấu hình. */
  function updateModalViewportClass() {
    const only = isWorkspaceHidden();
    document.documentElement.classList.toggle('zt-only-config', only);
    document.body.classList.toggle('zt-only-config', only);
  }

  /** Báo tab cha chỉnh height iframe theo nội dung (chỉ khi chưa mở bảng kết quả). */
  function syncConfigIframeHeightToParent() {
    if (window.parent === window) return;
    if (!isWorkspaceHidden()) return;
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        if (!isWorkspaceHidden()) return;
        const h = Math.ceil(
          Math.max(document.documentElement.scrollHeight, document.body.scrollHeight)
        );
        const bounded = Math.min(Math.max(h, 260), 2000);
        window.parent.postMessage(
          { source: 'zt-modal', type: 'IFRAME_HEIGHT', heightPx: bounded },
          '*'
        );
      });
    });
  }

  function setScanningUI(on) {
    scanning = on;
    const cfg = $('zt-section-config');
    const scan = $('zt-section-scan');
    const ws = $('zt-section-workspace');
    if (cfg) {
      cfg.classList.toggle('hidden', on);
    }
    if (scan) scan.classList.toggle('hidden', !on);
    $('zt-btn-start').disabled = on;
    const sb = $('zt-sidebar');
    const pw = $('zt-progress-wrap');
    const ppw = $('zt-progress-post-wrap');
    const fb = $('zt-filter-bar');
    if (sb) sb.classList.toggle('hidden', !on);
    if (pw) pw.classList.toggle('hidden', !on);
    if (ppw) ppw.classList.add('hidden');
    if (fb) fb.classList.toggle('hidden', !on);
    if (ws) {
      if (on) {
        ws.classList.remove('hidden');
        ws.classList.add('flex');
      } else {
        ws.classList.add('hidden');
        ws.classList.remove('flex');
      }
    }
    if (on) {
      updateScanGroupHeading();
      setProfileModeUi();
    }
    updateEmptyHint();
    updateModalViewportClass();
    if (on) {
      updatePauseButtonVisibility();
    }
    if (window.parent !== window) {
      window.parent.postMessage({ source: 'zt-modal', type: 'PHASE', phase: on ? 'scan' : 'config' }, '*');
      syncConfigIframeHeightToParent();
    }
  }

  const ICON_OPEN =
    '<svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">' +
    '<path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />' +
    '</svg>';

  const ICON_CALL =
    '<svg class="h-3.5 w-3.5 shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">' +
    '<path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />' +
    '</svg>';

  /** Icon chat chung (không dùng logo Zalo — nút đã có chữ «Zalo»). */
  const ICON_CHAT =
    '<svg class="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">' +
    '<path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />' +
    '</svg>';

  /**
   * Chỉ thêm dòng khi đã có SĐT.
   * @param {object} [scoreInfo] - profile mode: { points, likes, comments }
   */
  function addPhoneRow(uid, data, scoreInfo) {
    const phoneDisp = data.phoneDisplay || '';
    if (!phoneDisp) return;

    rowCounter += 1;
    const stt = rowCounter;
    const id = String(uid);
    const profileUrl = data.profileUrl || profileUrlForUid(id, data.memberUrl);
    const name = data.name || '';
    const genderDisp = formatGender(data.gender);
    const avatarUrl = data.pictureUrl || '';
    const phoneDigits = digitsOnly(phoneDisp);
    const phoneDispUi = mapPhoneDispForUi(phoneDisp);
    bumpGender(genderDisp);
    if (!window.__ztPhoneMask) {
      bumpPrefix(phoneDisp);
    }

    const tip =
      scoreInfo && scanMode === 'profile'
        ? (scoreInfo.likes || 0) + ' like · ' + (scoreInfo.comments || 0) + ' comment'
        : '';
    const scoreTd =
      scanMode === 'profile'
        ? '<td class="py-2 pr-2 align-middle" data-zt-col="score">' +
          (scoreInfo && typeof scoreInfo.points === 'number'
            ? '<span class="inline-flex rounded-full bg-fuchsia-950/50 px-2.5 py-0.5 font-mono text-sm text-fuchsia-200" title="' +
              esc(tip) +
              '">' +
              esc(String(scoreInfo.points)) +
              '</span>'
            : '<span class="text-slate-500">—</span>') +
          '</td>'
        : '';

    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-800/50';
    tr.dataset.uid = id;

    const tdPhone = '<td class="py-2 pr-2 font-mono text-sm text-emerald-400">' + esc(phoneDispUi) + '</td>';
    const deep = isDeepScan();
    const tdRegion = deep
      ? '<td class="py-2 pr-2 max-w-[200px] text-xs text-amber-100/90 align-top" data-zt-col="region" data-zt-loc-pending="1">' +
        '<span class="inline-flex flex-wrap items-center gap-1">' +
        '<span class="text-slate-400">Đang tra cứu</span>' +
        '<span class="zt-loc-dots text-violet-300/90" aria-hidden="true">...</span>' +
        '</span></td>'
      : '';
    const tdAge = deep
      ? '<td class="py-2 pr-2 w-[3.25rem] text-center font-mono text-sm text-indigo-200 align-middle" data-zt-col="age" data-zt-loc-pending="1">' +
        '<span class="inline-flex flex-wrap items-center justify-center gap-1">' +
        '<span class="zt-loc-dots text-violet-300/90" aria-hidden="true">...</span>' +
        '</span></td>'
      : '';
    const telH = hrefTelFromDigits(phoneDigits);
    const zaloH = hrefZaloFromDigits(phoneDigits);
    const tdAct = window.__ztPhoneMask
      ? '<td class="py-2 pl-2 pr-3 align-middle text-right" data-zt-col="actions">' +
        '<div class="flex w-full flex-wrap items-center justify-end gap-1">' +
        '<a href="' +
        esc(profileUrl) +
        '" target="_blank" rel="noopener noreferrer" ' +
        'class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-600 bg-slate-800 text-slate-300 transition hover:border-violet-500 hover:bg-slate-700 hover:text-white" ' +
        'title="Mở Facebook">' +
        ICON_OPEN +
        '</a>' +
        '</div></td>'
      : '<td class="py-2 pl-2 pr-3 align-middle text-right" data-zt-col="actions">' +
        '<div class="flex w-full flex-wrap items-center justify-end gap-1">' +
        '<a href="' +
        esc(telH) +
        '" target="_top" rel="noopener noreferrer" onclick="event.stopPropagation()" class="inline-flex h-8 shrink-0 items-center gap-0.5 rounded-lg border border-emerald-600/55 bg-emerald-950/45 px-1.5 text-[11px] font-semibold text-emerald-300 transition hover:border-emerald-500 hover:bg-emerald-900/55" ' +
        'title="Gọi điện">' +
        ICON_CALL +
        '<span>Call</span></a>' +
        '<a href="' +
        esc(zaloH) +
        '" target="_blank" rel="noopener noreferrer" class="inline-flex h-8 shrink-0 items-center gap-0.5 rounded-lg border border-sky-600/55 bg-sky-950/45 px-1.5 text-[11px] font-semibold text-sky-300 transition hover:border-sky-500 hover:bg-sky-900/55" ' +
        'title="Mở Zalo (tab mới)">' +
        ICON_CHAT +
        '<span>Zalo</span></a>' +
        '<a href="' +
        esc(profileUrl) +
        '" target="_blank" rel="noopener noreferrer" ' +
        'class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-600 bg-slate-800 text-slate-300 transition hover:border-violet-500 hover:bg-slate-700 hover:text-white" ' +
        'title="Mở Facebook">' +
        ICON_OPEN +
        '</a>' +
        '</div></td>';

    tr.innerHTML =
      '<td class="py-2 pl-2 pr-1 align-middle">' +
      '<label class="inline-flex h-5 w-5 cursor-pointer items-center justify-center rounded border border-slate-600 bg-slate-800/75">' +
      '<input data-zt-row-select="1" type="checkbox" class="h-3.5 w-3.5 cursor-pointer rounded border-slate-500 bg-slate-900 text-cyan-500 focus:ring-cyan-500" />' +
      '</label>' +
      '</td>' +
      '<td class="py-2 pl-2 pr-2 font-mono text-slate-400" data-zt-col="stt">' +
      stt +
      '</td>' +
      '<td class="py-2 pr-2">' +
      (avatarUrl
        ? '<img class="h-9 w-9 rounded-full object-cover ring-1 ring-slate-600" src="' + esc(avatarUrl) + '" alt="" />'
        : '<div class="h-9 w-9 rounded-full bg-slate-700"></div>') +
      '</td>' +
      '<td class="py-2 pr-2 align-middle">' +
      '<div class="min-w-0">' +
      '<div class="truncate font-medium text-slate-100" title="' +
      esc(name || id) +
      '">' +
      esc(name || '—') +
      '</div>' +
      '<div class="mt-0.5 truncate font-mono text-[11px] text-violet-200/85" title="' +
      esc(id) +
      '">UID: ' +
      esc(id) +
      '</div>' +
      '</div>' +
      '</td>' +
      '<td class="py-2 pr-2 text-slate-300">' +
      esc(genderDisp) +
      '</td>' +
      scoreTd +
      tdPhone +
      tdRegion +
      tdAge +
      tdAct;

    const rowSelectCb = tr.querySelector('[data-zt-row-select="1"]');
    if (rowSelectCb) {
      rowSelectCb.addEventListener('change', function () {
        selectRow(id, !!rowSelectCb.checked);
      });
    }
    tr.addEventListener('click', function (ev) {
      const target = ev && ev.target ? ev.target : null;
      if (!target) return;
      const el = target.closest
        ? target.closest('a,button,input,select,textarea,label,[role="button"]')
        : null;
      if (el) return;
      selectRow(id, true);
    });

    $('zt-tbody').appendChild(tr);
    scheduleScrollPhoneTable();

    rows.set(id, {
      stt,
      tr,
      uid: id,
      name,
      gender: genderDisp,
      phone: phoneDispUi,
      phoneDigits,
      avatarUrl,
      profileUrl,
      cityCounted: false,
      cityKey: null,
      /** Năm sinh từ GraphQL (fetchProfileLocation), dùng cho thư viện UID */
      birthYear: null,
      ageNum: null,
      ageText: '',
      ageBucket: null,
      cooldownQualified: false,
      scoreNum:
        scanMode === 'profile' && scoreInfo && typeof scoreInfo.points === 'number'
          ? scoreInfo.points
          : null,
      scoreText:
        scanMode === 'profile' && scoreInfo && typeof scoreInfo.points === 'number'
          ? String(scoreInfo.points)
          : ''
    });
    syncRowSelectionUi(id);
    updateEmptyHint();
    if (deep) syncRegionFilterOptions();
    applyTableFilters();
    if (deep) enqueueLocationJob(id, profileUrl);
  }

  async function waitResume() {
    await waitSafetyCooldown();
    if (paused && !cancelled) {
      setScanStatus('Đã tạm dừng', 'Nhấn «Tiếp tục» để chạy lại. UID / Ra số giữ nguyên.', {
        showSpinner: false,
        done: true
      });
    }
    while (paused && !cancelled) {
      await sleep(400);
    }
  }

  async function fetchMembersWithRetry(gid, cursor) {
    for (;;) {
      try {
        return await ztRequest('fetchMembers', { groupId: gid, cursor: cursor || null });
      } catch (e) {
        if (String(e.message).includes('RATE_LIMIT') || String(e.message).includes('RATE_LIMIT_EXCEEDED')) {
          setScanStatus(
            pickFriendly('rate', 0),
            'Hệ thống đang nghỉ ngắn — thử lại sau 30 giây.',
            { showSpinner: true }
          );
          showToast('Rate limit — chờ 30 giây…', 'info');
          await sleep(30000);
          continue;
        }
        throw e;
      }
    }
  }

  /**
   * Permalink bài để Referer + fallback HTML — timeline đôi khi không có `url`.
   * Dựng: vanity/posts/pfbid… hoặc profile.php?id=UID&story_fbid=…
   */
  function postPermalinkAbsolute(post, ownerUid, vanitySeg) {
    const u = post && post.url ? String(post.url).trim() : '';
    if (u) {
      const base = u.split('?')[0].split('#')[0];
      if (/^https?:\/\//i.test(base)) return base;
      if (base.startsWith('/')) return getFacebookOrigin() + base;
    }
    const pid = String(post && post.postId != null ? post.postId : '').trim();
    const owner = String(ownerUid || '').replace(/\D/g, '');
    const v = String(vanitySeg || '').trim();
    if (!pid) return '';
    if (/^pfbid/i.test(pid)) {
      if (v) return getFacebookOrigin() + '/' + v + '/posts/' + encodeURIComponent(pid);
      if (owner) return getFacebookOrigin() + '/' + owner + '/posts/' + encodeURIComponent(pid);
      return '';
    }
    if (/^\d{5,20}$/.test(pid) && owner) {
      return getFacebookOrigin() + '/' + owner + '/posts/' + pid;
    }
    if (owner) {
      return getFacebookOrigin() + '/profile.php?id=' + encodeURIComponent(owner) + '&story_fbid=' + encodeURIComponent(pid);
    }
    return '';
  }

  async function fetchProfileTimelineWithRetry(pid, cursor, count) {
    for (;;) {
      try {
        return await ztRequest(
          'fetchProfileTimeline',
          { profileId: pid, cursor: cursor || null, count: count || 10 },
          120000
        );
      } catch (e) {
        if (String(e.message).includes('RATE_LIMIT') || String(e.message).includes('RATE_LIMIT_EXCEEDED')) {
          setScanStatus(
            pickFriendly('rate', 0),
            'Hệ thống đang nghỉ ngắn — thử lại sau 30 giây.',
            { showSpinner: true }
          );
          showToast('Rate limit — chờ 30 giây…', 'info');
          await sleep(30000);
          continue;
        }
        throw e;
      }
    }
  }

  async function fetchPostReactorsWithRetry(ownerId, postId, fidB64, cursor, fidCarry, permalink) {
    for (;;) {
      try {
        return await ztRequest(
          'fetchPostReactorsPage',
          {
            profileOwnerId: ownerId,
            postId: String(postId),
            feedbackIdB64: fidB64 || null,
            cursor: cursor || null,
            feedbackFidCarry: fidCarry || null,
            permalink: permalink || ''
          },
          120000
        );
      } catch (e) {
        if (String(e.message).includes('RATE_LIMIT') || String(e.message).includes('RATE_LIMIT_EXCEEDED')) {
          await sleep(30000);
          continue;
        }
        throw e;
      }
    }
  }

  async function fetchPostCommentsWithRetry(ownerId, postId, fidB64, cursor, fidCarry, permalink) {
    for (;;) {
      try {
        return await ztRequest(
          'fetchPostCommentsPage',
          {
            profileOwnerId: ownerId,
            postId: String(postId),
            feedbackIdB64: fidB64 || null,
            cursor: cursor || null,
            feedbackFidCarry: fidCarry || null,
            permalink: permalink || ''
          },
          120000
        );
      } catch (e) {
        if (String(e.message).includes('RATE_LIMIT') || String(e.message).includes('RATE_LIMIT_EXCEEDED')) {
          await sleep(30000);
          continue;
        }
        throw e;
      }
    }
  }

  async function fetchFanpagePostsWithRetry(pageId, nextUrl) {
    for (;;) {
      try {
        return await ztRequest(
          'fetchFanpagePostsPage',
          { pageId: String(pageId), nextUrl: nextUrl || '' },
          120000
        );
      } catch (e) {
        const em = String(e.message || '');
        if (em.includes('RATE_LIMIT') || em.includes('429')) {
          setScanStatus(pickFriendly('rate', 0), 'Graph REST — chờ 30 giây…', { showSpinner: true });
          await sleep(30000);
          continue;
        }
        throw e;
      }
    }
  }

  /**
   * Permalink bài Fanpage: /{pageObjectId}/posts/{postId}
   */
  function fanpagePostPermalink(pickedPageId, post) {
    const owner = String(pickedPageId || '').replace(/\D/g, '');
    const pid = String(post && post.postId != null ? post.postId : '').trim();
    if (/^\d{5,20}$/.test(pid) && owner) {
      return getFacebookOrigin() + '/' + owner + '/posts/' + encodeURIComponent(pid);
    }
    return '';
  }

  function escapeCsvCell(s) {
    let x = String(s ?? '');
    if (/^[\s\u0000-\u001f]*[=+@-]/.test(x)) x = "'" + x;
    if (/[",\n\r]/.test(x)) return '"' + x.replace(/"/g, '""') + '"';
    return x;
  }

  function downloadFanpageCsvIfNeeded() {
    if (scanMode !== 'fanpage' || rows.size === 0) return;
    const pid = pickedFanpageId || 'page';
    const BOM = '\ufeff';
    const deep = isDeepScan();
    const header = deep
      ? ['STT', 'UID', 'Tên', 'Giới tính', 'SĐT', 'Tuổi']
      : ['STT', 'UID', 'Tên', 'Giới tính', 'SĐT'];
    const lines = [header.join(',')];
    rows.forEach(function (rec) {
      const row = deep
        ? [rec.stt, rec.uid, rec.name || '', rec.gender || '', rec.phone || '', rec.ageText || '']
        : [rec.stt, rec.uid, rec.name || '', rec.gender || '', rec.phone || ''];
      lines.push(row.map(escapeCsvCell).join(','));
    });
    const blob = new Blob([BOM + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'tien-house-fanpage-' + pid + '-' + Date.now() + '.csv';
    a.click();
    setTimeout(function () {
      URL.revokeObjectURL(a.href);
    }, 2000);
  }

  /**
   * Lấy UID Facebook hiện tại của tab (cookie c_user).
   * @returns {string}
   */
  function ztReadCurrentFbUid() {
    try {
      if (window.ZTPhoneDisplay && typeof window.ZTPhoneDisplay.readCurrentFbUidFromCookie === 'function') {
        return String(window.ZTPhoneDisplay.readCurrentFbUidFromCookie() || '').replace(/\D/g, '');
      }
      const m = String(document.cookie || '').match(/(?:^|;\s*)c_user=(\d{5,20})(?:;|$)/);
      return m ? m[1] : '';
    } catch (_) {
      return '';
    }
  }

  /**
   * Kiểm tra tài khoản có đang ở gói VIP còn hạn hay không (KHÔNG so UID nick).
   * Dùng cho quyền Xuất Excel — chỉ phụ thuộc plan, không phụ thuộc nick Facebook đang dùng.
   * Điều kiện:
   *   - Có server token + user.
   *   - effective_plan_code !== 'free'.
   *   - plan_expires_at null (vĩnh viễn) hoặc còn trong tương lai.
   * @returns {Promise<boolean>}
   */
  function ztIsVipActive() {
    return chrome.runtime.sendMessage({ action: 'ZT_SERVER_SESSION_GET' }).then(state => !!state?.authed && state.details?.entitlements?.includes('export'));
  }

  /**
   * Kiểm tra nick Facebook đang đăng nhập có phải nick được kích hoạt VIP hay không.
   * Điều kiện đầy đủ:
   *   - Đã có server token + user.
   *   - User có gói VIP còn hạn (effective_plan_code !== 'free' và plan_expires_at chưa hết).
   *   - UID c_user khớp với vip_locked_facebook_uid.
   * @returns {Promise<boolean>}
   */
  function ztIsCurrentNickVipLocked() {
    // Existing plans grant features by active license; there is no Facebook nick binding.
    return ztIsVipActive();
  }

  /**
   * Sinh hậu tố cho tên file dựa trên nguồn dữ liệu xuất.
   * - source='selected': '-selected-N'
   * - source='visible' / khác: ''
   */
  function buildExportSourceSuffix(source, count) {
    if (source === 'selected') {
      const n = Number.isFinite(count) ? count : 0;
      return '-selected-' + n;
    }
    return '';
  }

  /**
   * Sinh tên file .xlsx an toàn theo ngữ cảnh quét.
   * @param {{source?: string, count?: number}} [opts]
   */
  function buildExportXlsxFilename(opts) {
    const ctx = String(pickedFanpageId || profileId || groupId || 'export').replace(/[^a-zA-Z0-9_-]+/g, '');
    const safe = ctx ? ctx.slice(0, 32) : 'export';
    const d = new Date();
    const pad = (n) => (n < 10 ? '0' + n : '' + n);
    const stamp = d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + '-' +
                  pad(d.getHours()) + pad(d.getMinutes()) + pad(d.getSeconds());
    const suffix = buildExportSourceSuffix(opts && opts.source, opts && opts.count);
    return 'tien-house-' + scanMode + '-' + safe + '-' + stamp + suffix + '.xlsx';
  }

  /**
   * Sinh tên file UID (.txt) an toàn theo ngữ cảnh quét.
   * @param {{source?: string, count?: number}} [opts]
   */
  function buildExportUidFilename(opts) {
    const ctx = String(pickedFanpageId || profileId || groupId || 'export').replace(/[^a-zA-Z0-9_-]+/g, '');
    const safe = ctx ? ctx.slice(0, 32) : 'export';
    const d = new Date();
    const pad = (n) => (n < 10 ? '0' + n : '' + n);
    const stamp = d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + '-' +
                  pad(d.getHours()) + pad(d.getMinutes()) + pad(d.getSeconds());
    const suffix = buildExportSourceSuffix(opts && opts.source, opts && opts.count);
    return 'tien-house-uid-' + scanMode + '-' + safe + '-' + stamp + suffix + '.txt';
  }

  /**
   * Bấm «Xuất File Excel» — chỉ tài khoản VIP còn hạn dùng được (KHÔNG phụ thuộc nick FB hiện tại).
   * Phạm vi dữ liệu: có tick → chỉ dòng đã tick; không tick → các dòng đang hiển thị sau filter.
   */
  async function exportExcelClick() {
    let isVip = false;
    try {
      isVip = await ztIsVipActive();
    } catch (_) {
      isVip = false;
    }
    if (!isVip) {
      showNoticeModal(
        'Tính năng xuất file excel chỉ lưu hành nội bộ, bạn không thể sử dụng',
        'Tính năng nâng cao'
      );
      return;
    }
    if (!rows || rows.size === 0) {
      showToast('Chưa có dữ liệu để xuất.', 'info');
      return;
    }
    if (!window.THXlsx || typeof window.THXlsx.buildXlsxBlob !== 'function') {
      showToast('Thiếu mô-đun xuất Excel — tải lại trang Facebook (F5) rồi thử lại.', 'error');
      return;
    }

    const picked = pickExportRecords();
    if (!picked.records.length) {
      if (picked.source === 'selected') {
        showToast('Chưa tick dòng nào và bảng đang trống.', 'info');
      } else {
        showToast('Không có dòng nào khớp bộ lọc để xuất.', 'info');
      }
      return;
    }

    const deep = isDeepScan();
    const isProfile = scanMode === 'profile';
    const header = ['STT', 'Tên', 'UID', 'Giới tính'];
    if (isProfile) header.push('Điểm');
    header.push('SĐT');
    if (deep) header.push('Khu vực', 'Tuổi');
    header.push('Profile URL');

    const data = [];
    picked.records.forEach(function (rec, idx) {
      const row = [
        idx + 1,
        rec.name || '',
        rec.uid || '',
        rec.gender || ''
      ];
      if (isProfile) {
        row.push(typeof rec.scoreNum === 'number' ? rec.scoreNum : (rec.scoreText || ''));
      }
      row.push(rec.phone || '');
      if (deep) {
        row.push(rec.cityKey || '');
        row.push(rec.ageText || '');
      }
      row.push(rec.profileUrl || '');
      data.push(row);
    });

    let blob;
    try {
      blob = window.THXlsx.buildXlsxBlob({
        sheetName: 'Fairy House AutoData',
        header: header,
        rows: data
      });
    } catch (e) {
      showToast('Không tạo được file Excel: ' + (e && e.message ? e.message : 'lỗi không xác định'), 'error');
      return;
    }

    const a = document.createElement('a');
    const url = URL.createObjectURL(blob);
    a.href = url;
    a.download = buildExportXlsxFilename({ source: picked.source, count: data.length });
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 2000);
    const scopeLabel = picked.source === 'selected' ? ' đã tick' : '';
    showToast('Đã xuất file Excel (' + data.length + ' dòng' + scopeLabel + ').', 'success');
  }

  /**
   * Bấm «Xuất File UID» — xuất UID ra .txt (mỗi UID một dòng).
   * Mở cho cả FREE và VIP.
   * Phạm vi: có tick → chỉ dòng đã tick; không tick → các dòng đang hiển thị sau filter.
   */
  function exportUidTxtClick() {
    if (!rows || rows.size === 0) {
      showToast('Chưa có dữ liệu UID để xuất.', 'info');
      return;
    }

    const picked = pickExportRecords();
    if (!picked.records.length) {
      if (picked.source === 'selected') {
        showToast('Chưa tick dòng nào và bảng đang trống.', 'info');
      } else {
        showToast('Không có dòng nào khớp bộ lọc để xuất.', 'info');
      }
      return;
    }

    const uidLines = [];
    picked.records.forEach(function (rec) {
      const uid = String((rec && rec.uid) || '').trim();
      if (uid) uidLines.push(uid);
    });
    if (!uidLines.length) {
      showToast('Không có UID hợp lệ để xuất.', 'info');
      return;
    }

    const blob = new Blob([uidLines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    const url = URL.createObjectURL(blob);
    a.href = url;
    a.download = buildExportUidFilename({ source: picked.source, count: uidLines.length });
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 2000);
    const scopeLabel = picked.source === 'selected' ? ' đã tick' : '';
    showToast('Đã xuất file UID (' + uidLines.length + ' dòng' + scopeLabel + ').', 'success');
  }

  function openInviteConfigModal() {
    if (!selectedUids.size) {
      showToast('Hãy chọn ít nhất 1 người để gửi lời mời.', 'info');
      return;
    }
    const root = $('zt-invite-config-modal');
    const countEl = $('zt-invite-selected-count');
    if (countEl) countEl.textContent = String(selectedUids.size);
    const minEl = $('zt-invite-delay-min');
    const maxEl = $('zt-invite-delay-max');
    if (minEl) minEl.value = String(inviteDelayMinSec);
    if (maxEl) maxEl.value = String(inviteDelayMaxSec);
    if (root) {
      root.classList.remove('hidden');
      root.classList.add('flex');
    }
  }

  function closeInviteConfigModal() {
    const root = $('zt-invite-config-modal');
    if (!root) return;
    root.classList.add('hidden');
    root.classList.remove('flex');
  }

  function parseInviteDelayConfig() {
    const minEl = $('zt-invite-delay-min');
    const maxEl = $('zt-invite-delay-max');
    let minSec = parseInt(minEl && minEl.value ? minEl.value : '15', 10);
    let maxSec = parseInt(maxEl && maxEl.value ? maxEl.value : '60', 10);
    if (!Number.isFinite(minSec) || minSec < 1) minSec = 15;
    if (!Number.isFinite(maxSec) || maxSec < 1) maxSec = 60;
    if (minSec > maxSec) {
      const tmp = minSec;
      minSec = maxSec;
      maxSec = tmp;
    }
    minSec = Math.min(3600, Math.max(1, minSec));
    maxSec = Math.min(3600, Math.max(minSec, maxSec));
    inviteDelayMinSec = minSec;
    inviteDelayMaxSec = maxSec;
    if (minEl) minEl.value = String(minSec);
    if (maxEl) maxEl.value = String(maxSec);
    return { minSec, maxSec };
  }

  function randomInviteDelayMs() {
    const minMs = Math.max(1000, Math.floor(inviteDelayMinSec * 1000));
    const maxMs = Math.max(minMs, Math.floor(inviteDelayMaxSec * 1000));
    if (maxMs <= minMs) return minMs;
    return minMs + Math.floor(Math.random() * (maxMs - minMs + 1));
  }

  async function ztServerInviteQuota(action, payload) {
    if (typeof chrome === 'undefined' || !chrome.runtime?.sendMessage) {
      throw new Error('Không thể kiểm tra quota kết bạn');
    }
    return await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          action: 'ZT_EXTENSION_FRIEND_INVITE_QUOTA',
          quotaAction: action,
          payload: payload || {}
        },
        function (resp) {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          if (!resp || !resp.ok) {
            reject(new Error((resp && (resp.error || resp.message)) || 'Lỗi quota kết bạn'));
            return;
          }
          resolve(resp.data || {});
        }
      );
    });
  }

  function renderInvitePauseButton() {
    const lb = $('zt-invite-btn-pause-label');
    if (!lb) return;
    lb.textContent = invitePaused ? 'Tiếp tục' : 'Tạm dừng';
  }

  function renderInviteStopButton(forceExit) {
    const lb = $('zt-invite-btn-stop-label');
    if (!lb) return;
    lb.textContent = forceExit ? 'Thoát' : 'Kết thúc';
  }

  function closeInviteProgressModal(forceStopNow) {
    if (forceStopNow) {
      inviteRunToken += 1;
      invitePaused = false;
      inviteStopRequested = true;
      inviteJobState = 'stopped';
    }
    setInviteCountdown(0);
    showInviteProgressPanel(false);
    resetInviteProgressState();
  }

  async function waitWithInviteCountdown(ms) {
    let remain = Math.max(0, Math.floor(ms));
    while (remain > 0 && !inviteStopRequested) {
      if (invitePaused) {
        await sleep(250);
        continue;
      }
      const sec = Math.ceil(remain / 1000);
      setInvitePhase('Đang chờ trước lần gửi tiếp theo…', true);
      setInviteCountdown(sec);
      const step = Math.min(250, remain);
      await sleep(step);
      remain -= step;
    }
    setInviteCountdown(0);
  }

  function openLastInviteProfile() {
    if (!lastInviteProfileUrl) return;
    try {
      if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.create) {
        chrome.tabs.create({ url: lastInviteProfileUrl });
        return;
      }
    } catch (_) {
      /* ignore */
    }
    window.open(lastInviteProfileUrl, '_blank', 'noopener');
  }

  async function runInviteProcess() {
    const uids = Array.from(selectedUids);
    if (!uids.length) {
      showToast('Danh sách chọn đang trống.', 'info');
      return;
    }

    const token = ++inviteRunToken;
    inviteJobState = 'running';
    invitePaused = false;
    inviteStopRequested = false;
    inviteStats.total = uids.length;
    inviteStats.done = 0;
    inviteStats.success = 0;
    inviteStats.failed = 0;
    const log = $('zt-invite-log-list');
    if (log) log.textContent = '';
    showInviteProgressPanel(true);
    updateInviteProgressUi();
    renderInvitePauseButton();
    renderInviteStopButton(false);
    setInviteCountdown(0);
    setInvitePhase('Đang chuẩn bị gửi lời mời…', true);
    updateInviteButtonState();

    let quotaInfo;
    let actorUid = '';
    try {
      const authData = await ztRequest('getActorUid', {}, 30000);
      actorUid = String(authData && authData.actorUid ? authData.actorUid : '').replace(/\D/g, '');
    } catch (_) {
      actorUid = '';
    }
    if (!actorUid) {
      inviteJobState = 'stopped';
      setInviteCountdown(0);
      setInvitePhase('Không xác định được Facebook UID hiện tại', false);
      pushInviteLog('Không lấy được actor UID để kiểm tra quota.', 'error');
      showNoticeModal('Không xác định được Facebook UID hiện tại. Hãy tải lại trang Facebook rồi thử lại.', 'Thiếu UID Facebook');
      updateInviteButtonState();
      return;
    }
    try {
      quotaInfo = await ztServerInviteQuota('check', { facebook_uid: actorUid, expected_count: uids.length });
      if (quotaInfo.blocked) {
        inviteJobState = 'stopped';
        setInviteCountdown(0);
        setInvitePhase('Đã chạm giới hạn 100 lời mời/ngày', false);
        pushInviteLog('Đã đạt giới hạn trong 24h. Vui lòng chạy lại vào ngày mai.', 'error');
        showNoticeModal('Tài khoản của bạn đã đạt giới hạn 100 lời mời trong 24h. Vui lòng thử lại vào ngày mai.', 'Đã chạm giới hạn kết bạn');
        updateInviteButtonState();
        return;
      }
      pushInviteLog('Quota còn lại: ' + (quotaInfo.remaining != null ? quotaInfo.remaining : '—'), 'normal');
    } catch (err) {
      inviteJobState = 'stopped';
      setInviteCountdown(0);
      setInvitePhase('Không kiểm tra được quota kết bạn', false);
      pushInviteLog('Không thể kiểm tra quota: ' + (err.message || err), 'error');
      showNoticeModal('Không kiểm tra được giới hạn kết bạn. Vui lòng thử lại.', 'Lỗi quota');
      updateInviteButtonState();
      return;
    }

    for (let i = 0; i < uids.length; i++) {
      if (inviteRunToken !== token) return;
      if (inviteStopRequested) break;
      while (invitePaused && !inviteStopRequested) {
        setInvitePhase('Đã tạm dừng tiến trình kết bạn', false);
        await sleep(350);
      }
      if (inviteStopRequested) break;
      const uid = String(uids[i] || '');
      const rec = rows.get(uid);
      const targetName = rec && rec.name ? rec.name : 'UID ' + uid;
      if (rec && rec.profileUrl) {
        lastInviteProfileUrl = String(rec.profileUrl);
        const openBtn = $('zt-invite-btn-open-last');
        if (openBtn) openBtn.disabled = false;
      }

      setInvitePhase('Đang gửi lời mời (' + (i + 1) + '/' + uids.length + ')…', true);
      pushInviteLog('Đang gửi tới ' + targetName + ' (' + uid + ')', 'normal');

      try {
        const res = await ztRequest('sendFriendInvite', { targetUid: uid, requestId: crypto.randomUUID() }, 90000);
        if (res && res.success) {
          inviteStats.success += 1;
          pushInviteLog('Thành công: ' + targetName, 'success');
          await ztServerInviteQuota('consume', {
            facebook_uid: actorUid,
            target_uid: uid,
            status: 'success',
            error_message: ''
          });
        } else {
          inviteStats.failed += 1;
          const msg = (res && res.message) || 'Facebook từ chối';
          pushInviteLog('Thất bại: ' + targetName + ' - ' + msg, 'error');
          await ztServerInviteQuota('consume', {
            facebook_uid: actorUid,
            target_uid: uid,
            status: 'failed',
            error_message: msg
          });
        }
      } catch (err) {
        const msg = err && err.message ? String(err.message) : 'Lỗi không xác định';
        inviteStats.failed += 1;
        pushInviteLog('Thất bại: ' + targetName + ' - ' + msg, 'error');
        try {
          const afterFail = await ztServerInviteQuota('consume', {
            facebook_uid: actorUid,
            target_uid: uid,
            status: 'failed',
            error_message: msg
          });
          if (afterFail && afterFail.blocked) {
            showNoticeModal('Đã chạm giới hạn 100 lời mời/ngày cho tài khoản của bạn.', 'Dừng do chạm quota');
            inviteStopRequested = true;
          }
        } catch (_) {
          /* ignore quota log error */
        }
      }

      inviteStats.done += 1;
      updateInviteProgressUi();
      if (inviteStats.done >= inviteStats.total) break;
      if (inviteStopRequested) break;
      const waitMs = randomInviteDelayMs();
      await waitWithInviteCountdown(waitMs);
    }

    if (inviteRunToken !== token) return;
    if (inviteStopRequested) {
      inviteJobState = 'stopped';
      setInviteCountdown(0);
      setInvitePhase('Đã kết thúc tiến trình kết bạn', false);
      renderInviteStopButton(true);
      pushInviteLog('Tiến trình đã dừng thủ công.', 'normal');
    } else {
      inviteJobState = 'done';
      setInviteCountdown(0);
      setInvitePhase('Hoàn tất gửi lời mời kết bạn', false);
      renderInviteStopButton(true);
      pushInviteLog(
        'Hoàn tất: thành công ' + inviteStats.success + ', thất bại ' + inviteStats.failed + '.',
        inviteStats.failed > 0 ? 'normal' : 'success'
      );
    }
    updateInviteButtonState();
  }

  async function runScanFanpage() {
    let showGoalSuccessModal = false;
    cancelled = false;
    paused = false;
    locationRateLimitedStop = false;
    locationRateLimitedUntil = 0;
    nextLocationEnrichCheckpoint = LOCATION_CHECKPOINT_SIZE;
    clearEmptyDotsTimer();
    phoneFoundCount = 0;
    uidScannedCount = 0;
    rowCounter = 0;
    qualifiedRowsCount = 0;
    nextCooldownQualifiedMark = SAFETY_COOLDOWN_EVERY;
    safetyCooldownUntil = 0;
    safetyCooldownAnnounced = false;
    clearSelectedRows();
    resetInviteProgressState();
    rows.clear();
    $('zt-tbody').innerHTML = '';
    resetScoreColumnSortUi();
    locationQueue.length = 0;
    deferredLocationQueue.length = 0;
    pickedFanpageId = '';

    const fs = $('zt-filter-search');
    const fg = $('zt-filter-gender');
    const fp = $('zt-filter-prefix');
    const fr = $('zt-filter-region');
    if (fs) fs.value = '';
    if (fg) fg.value = '';
    if (fp) fp.value = '';
    if (fr) fr.value = '';

    const limit = effectivePhoneLimit();

    scanDepth = readScanDepthFromUi();
    applyScanDepthLayout();
    setScanningUI(true);
    $('zt-error-panel').classList.add('hidden');
    resetSidebarStats();
    setScanStatus(pickFriendly('boot', 0), 'Đang kết nối…', { showSpinner: true });

    try {
      accessToken = await getTokenWithRetry(2);

      try {
        await ztRequest('warmLsd', {}, 35000);
      } catch (_) {
        /* ignore */
      }

      let picked = '';
      let firstPage = null;
      const cands = pageIdCandidates.length ? pageIdCandidates.slice() : [];
      if (!cands.length) {
        throw new Error('Chưa trích được Page ID từ trang. Hãy tải lại Fanpage (F5) rồi thử lại.');
      }

      setScanStatus('Đang thử Page ID', 'Graph REST /posts — tìm ID chuẩn…', { showSpinner: true });
      for (let ci = 0; ci < cands.length; ci++) {
        await waitResume();
        if (cancelled) break;
        const cand = cands[ci];
        const r = await fetchFanpagePostsWithRetry(cand, '');
        if (r && r.ok && Array.isArray(r.posts) && r.posts.length > 0) {
          picked = cand;
          firstPage = r;
          break;
        }
      }

      if (!picked || !firstPage) {
        throw new Error(
          'Không đọc được danh sách bài (Graph REST). Kiểm tra token Ads Manager hoặc quyền truy cập Fanpage.'
        );
      }

      pickedFanpageId = picked;
      try {
        const gn = await ztRequest('fetchGroupName', { groupId: String(picked), token: accessToken }, 22000);
        if (gn && gn.name && String(gn.name).trim()) {
          groupDisplayName = String(gn.name).trim();
        }
      } catch (_) {
        /* giữ tên từ INIT nếu Graph không trả */
      }
      updateScanGroupHeading();
      postScanLogOnce();

      const pageIdBlacklist = new Set(cands.map(String));
      pageIdBlacklist.add(String(picked));

      const ENRICH_BATCH_SIZE = 100;
      const pending = [];
      const seenUids = new Set();

      async function enrichAndRenderChunk(chunk) {
        if (!chunk.length) return;
        const uids = chunk.map((c) => c.id);
        const uidMeta = new Map(chunk.map((c) => [c.id, { name: c.name, url: c.url }]));

        setScanStatus(
          pickFriendly('enrich', uids.length),
          'Đang tra SĐT / giới tính — ' + uids.length + ' UID.',
          { showSpinner: true }
        );
        let enriched;
        try {
          enriched = await ztRequest('enrich', { uids, token: accessToken });
        } catch (err) {
          showToast('Lỗi batch: ' + err.message, 'error');
          throw err;
        }

        const gMap = enriched.genderMap || {};
        const pMap = enriched.phoneMap || {};

        for (const uid of uids) {
          const rawPhone = pMap[uid];
          const phoneDisplay = rawPhone ? formatPhone84to09(rawPhone) : '';
          if (!phoneDisplay) continue;

          phoneFoundCount += 1;
          const g = gMap[uid] || {};
          const meta = uidMeta.get(uid) || {};
          const nm = g.name != null && g.name !== '' ? g.name : meta.name;

          addPhoneRow(uid, {
            name: nm,
            gender: g.gender,
            pictureUrl: g.pictureUrl,
            phoneDisplay,
            memberUrl: meta.url
          });
          updateStats();

          if (phoneFoundCount >= limit) return;
        }
      }

      async function pushUid(uid) {
        const id = String(uid).replace(/\D/g, '');
        if (!id || id === String(picked)) return;
        if (pageIdBlacklist.has(id)) return;
        if (seenUids.has(id)) return;
        seenUids.add(id);
        pending.push({
          id,
          name: '',
          url: getFacebookOrigin() + '/profile.php?id=' + encodeURIComponent(id)
        });
        uidScannedCount += 1;
        updateStats();
        while (pending.length >= ENRICH_BATCH_SIZE && phoneFoundCount < limit && !cancelled) {
          await waitResume();
          const batch = pending.splice(0, ENRICH_BATCH_SIZE);
          await enrichAndRenderChunk(batch);
          await maybeWaitForLocationCheckpoint();
          if (phoneFoundCount >= limit) return;
        }
      }

      let postQueue = firstPage.posts || [];
      let nextPostsUrl = firstPage.nextUrl || null;

      let postsExhausted = false;
      outer: while (phoneFoundCount < limit && !cancelled) {
        for (let pi = 0; pi < postQueue.length; pi++) {
          if (phoneFoundCount >= limit || cancelled) break outer;
          await waitResume();
          const post = postQueue[pi];
          const postId = String(post.postId || '').trim();
          if (!postId) continue;

          const postPermalink = fanpagePostPermalink(picked, post);

          setScanStatus(
            'Đang quét tương tác',
            'Bài post ID ' + (postId.length > 18 ? postId.slice(0, 18) + '…' : postId) + ' — lượt thích',
            { showSpinner: true }
          );

          let rCur = null;
          let rFcarry = null;
          let rFirst = true;
          for (;;) {
            await waitResume();
            if (cancelled) break outer;
            const r = await fetchPostReactorsWithRetry(
              picked,
              postId,
              null,
              rCur,
              rFirst ? null : rFcarry,
              postPermalink
            );
            rFirst = false;
            rFcarry = r.feedbackFid || rFcarry;
            const reactors = r.reactors || [];
            for (const uid of reactors) {
              await pushUid(uid);
              if (phoneFoundCount >= limit) break outer;
            }
            if (!r.hasMore || !r.nextCursor) break;
            rCur = r.nextCursor;
            await sleep(jitterMs());
          }

          const fidForComments = rFcarry || null;

          setScanStatus(
            'Đang quét tương tác',
            'Bài post ID ' + (postId.length > 18 ? postId.slice(0, 18) + '…' : postId) + ' — bình luận',
            { showSpinner: true }
          );

          let cCur = null;
          let cFcarry = null;
          let cFirst = true;
          for (;;) {
            await waitResume();
            if (cancelled) break outer;
            const c = await fetchPostCommentsWithRetry(
              picked,
              postId,
              cFirst ? fidForComments : null,
              cCur,
              cFirst ? null : cFcarry || fidForComments,
              postPermalink
            );
            cFirst = false;
            cFcarry = c.feedbackFid || cFcarry || fidForComments;
            const commenters = c.commenters || [];
            for (const uid of commenters) {
              await pushUid(uid);
              if (phoneFoundCount >= limit) break outer;
            }
            if (!c.hasMore || !c.nextCursor) break;
            cCur = c.nextCursor;
            await sleep(jitterMs());
          }
        }

        if (phoneFoundCount >= limit || cancelled) break;

        if (!nextPostsUrl) {
          postsExhausted = true;
          break;
        }

        await waitResume();
        const nextP = await fetchFanpagePostsWithRetry(picked, nextPostsUrl);
        if (!nextP || !nextP.ok || !nextP.posts || !nextP.posts.length) {
          postsExhausted = true;
          break;
        }
        postQueue = nextP.posts;
        nextPostsUrl = nextP.nextUrl || null;
      }

      if (cancelled) {
        setScanStatus('Đã dừng', 'Đã dừng theo yêu cầu.', { showSpinner: false, done: true });
      } else if (pending.length && phoneFoundCount < limit) {
        await enrichAndRenderChunk(pending.splice(0, pending.length));
        await maybeWaitForLocationCheckpoint();
      }

      if (!cancelled && rows.size > 0) {
        flushDeferredLocationJobs();
        await waitForLocationDrain();
      }

      if (!cancelled) {
        if (rows.size === 0) {
          setScanStatus(
            'Hoàn tất',
            postsExhausted
              ? 'Fanpage đã hết bài — không tìm thấy SĐT trong UID đã quét.'
              : 'Không có dòng nào — không tìm thấy SĐT trong UID đã quét.',
            { showSpinner: false, done: true }
          );
        } else {
          const deep = isDeepScan();
          let detail =
            'Đã ghi ' +
            rows.size +
            ' dòng có SĐT' +
            (deep && locationRateLimitedStop ? ' (một số khu vực chưa tra xong).' : '.');
          if (postsExhausted && phoneFoundCount < limit) {
            detail =
              'Fanpage đã hết bài — lấy được ' +
              phoneFoundCount +
              ' SĐT (mục tiêu ' +
              limit +
              '). ' +
              (deep && locationRateLimitedStop ? ' Một số khu vực có thể «—».' : '');
          }
          setScanStatus('Hoàn tất', detail, { showSpinner: false, done: true });
          if (phoneFoundCount >= limit) showGoalSuccessModal = true;
        }
      }

      if (!cancelled && !showGoalSuccessModal && phoneFoundCount < limit) {
        showToast(postsExhausted ? 'Đã hết bài trên Fanpage.' : 'Đã quét xong.', 'info');
      } else if (!cancelled && showGoalSuccessModal) {
        showToast('Đã đủ số khách hàng.', 'success');
      }
    } catch (e) {
      const rawMsg = e && e.message ? String(e.message) : String(e || '');
      const friendlyMsg = toFriendlyFanpageErrorMessage(rawMsg);
      setScanStatus('Chưa thể quét Fanpage', friendlyMsg, { showSpinner: false, done: true });
      $('zt-error-panel').classList.add('hidden');
      showNoticeModal(friendlyMsg, 'Quét Fanpage tạm gián đoạn');
      showToast('Quét Fanpage chưa thành công.', 'error');
    } finally {
      flushUidDemoToServer();
      scanning = false;
      const bs = $('zt-btn-start');
      if (bs) bs.disabled = false;
      setPauseButtonContent(false);
      paused = false;
      const sp = $('zt-status-spinner');
      const se = $('zt-empty-spinner');
      if (sp) sp.classList.add('hidden');
      if (se) se.classList.add('hidden');
      updateEmptyHint();
      updateTargetProgress();
      updateInviteButtonState();
      if (showGoalSuccessModal) {
        setTimeout(function () {
          showSuccessCelebrationModal();
        }, 200);
      }
    }
  }

  async function runScanProfile() {
    let showGoalSuccessModal = false;
    cancelled = false;
    paused = false;
    locationRateLimitedStop = false;
    locationRateLimitedUntil = 0;
    nextLocationEnrichCheckpoint = LOCATION_CHECKPOINT_SIZE;
    clearEmptyDotsTimer();
    phoneFoundCount = 0;
    uidScannedCount = 0;
    rowCounter = 0;
    qualifiedRowsCount = 0;
    nextCooldownQualifiedMark = SAFETY_COOLDOWN_EVERY;
    safetyCooldownUntil = 0;
    safetyCooldownAnnounced = false;
    clearSelectedRows();
    resetInviteProgressState();
    rows.clear();
    $('zt-tbody').innerHTML = '';
    resetScoreColumnSortUi();
    locationQueue.length = 0;
    deferredLocationQueue.length = 0;

    const fs = $('zt-filter-search');
    const fg = $('zt-filter-gender');
    const fp = $('zt-filter-prefix');
    const fr = $('zt-filter-region');
    if (fs) fs.value = '';
    if (fg) fg.value = '';
    if (fp) fp.value = '';
    if (fr) fr.value = '';

    const limit = effectivePhoneLimit();
    /** Gom đủ ~UID này (chưa enrich) thì gọi tra SĐT ngay — tránh gom hàng trăm UID mới convert. */
    const PROFILE_ENRICH_UID_THRESHOLD = 50;
    const PROFILE_ENRICH_BATCH_SIZE = 50;
    const owner = String(profileId || '').trim();
    if (!owner) {
      showToast('Thiếu UID profile.', 'error');
      return;
    }

    ztDebug(
      '[ZT] ========== Bắt đầu quét profile ==========',
      'UID timeline (phải là chủ profile trong URL):',
      owner,
      '| vanity:',
      profileVanity || '(không)',
      '| So với cookie c_user (nick bạn): nếu trùng UID → đang quét nhầm chính bạn.'
    );

    const scoreMap = new Map();

    function bumpScore(uid, delta, kind) {
      const id = String(uid).replace(/\D/g, '');
      if (!id || id === owner) return;
      const cur = scoreMap.get(id) || { score: 0, likes: 0, comments: 0 };
      cur.score += delta;
      if (kind === 'like') cur.likes += 1;
      if (kind === 'cmt') cur.comments += 1;
      scoreMap.set(id, cur);
    }

    /** Số UID khác nhau đã có ít nhất 1 lượt thích / 1 bình luận (theo bài đang gom). */
    function profileUidCounts() {
      let likeUids = 0;
      let commentUids = 0;
      scoreMap.forEach(function (v) {
        if (v.likes > 0) likeUids += 1;
        if (v.comments > 0) commentUids += 1;
      });
      return { likeUids: likeUids, commentUids: commentUids };
    }

    function profileInteractStatusDetail(postHint, phaseHint, idBai) {
      const c = profileUidCounts();
      let s =
        'Lượt thích: ' +
        c.likeUids +
        ' UID · Bình luận: ' +
        c.commentUids +
        ' UID · ' +
        postHint;
      if (idBai != null && String(idBai).trim() !== '') {
        const sid = String(idBai);
        s += ' · ID bài: ' + (sid.length > 42 ? sid.slice(0, 42) + '…' : sid);
      }
      if (phaseHint) s += ' · ' + phaseHint;
      return s;
    }

    scanDepth = readScanDepthFromUi();
    applyScanDepthLayout();
    setScanningUI(true);
    $('zt-error-panel').classList.add('hidden');
    resetSidebarStats();
    setScanStatus(pickFriendly('boot', 0), 'Đang kết nối…', { showSpinner: true });

    try {
      setScanStatus(pickFriendly('boot', 1), 'Đang xác thực phiên làm việc…', { showSpinner: true });
      accessToken = await getTokenWithRetry(2);

      groupDisplayName = '';
      profileTargetPictureUrl = '';
      try {
        const gn = await ztRequest('fetchGroupName', { groupId: owner, token: accessToken }, 25000);
        if (gn && gn.name && String(gn.name).trim()) {
          groupDisplayName = String(gn.name).trim();
        }
        if (gn && gn.pictureUrl && String(gn.pictureUrl).trim()) {
          profileTargetPictureUrl = String(gn.pictureUrl).trim();
        }
      } catch (_) {
        /* giữ UID trên heading nếu Graph không trả tên */
      }
      ztDebug('[ZT] Graph profile · UID', owner, '| tên:', groupDisplayName || '(không trả)', '| ảnh:', profileTargetPictureUrl ? 'có' : 'không');
      updateScanGroupHeading();
      postScanLogOnce();

      try {
        await ztRequest('warmLsd', {}, 35000);
      } catch (_) {
        /* ignore */
      }

      let timelineCursor = null;
      let postsProcessed = 0;
      let timelineExhausted = false;
      const seenPost = new Set();
      const enrichedUidSet = new Set();
      let tlRound = 0;

      async function enrichProfileChunk(chunk) {
        if (!chunk.length) return;
        const uids = chunk.map((c) => c.id);
        const uidMeta = new Map(
          chunk.map((c) => [
            c.id,
            { name: c.name, url: c.url, scoreInfo: c.scoreInfo }
          ])
        );

        setScanStatus(
          pickFriendly('enrich', uids.length),
          profileInteractStatusDetail(
            'Đang tra SĐT / giới tính — ' + uids.length + ' UID trong lượt này',
            'theo điểm tương tác',
            null
          ),
          { showSpinner: true }
        );
        let enriched;
        try {
          enriched = await ztRequest('enrich', { uids, token: accessToken });
        } catch (err) {
          showToast('Lỗi batch: ' + err.message, 'error');
          throw err;
        }

        const gMap = enriched.genderMap || {};
        const pMap = enriched.phoneMap || {};

        for (const uid of uids) {
          enrichedUidSet.add(String(uid));
          const rawPhone = pMap[uid];
          const phoneDisplay = rawPhone ? formatPhone84to09(rawPhone) : '';
          if (!phoneDisplay) continue;

          phoneFoundCount += 1;
          const g = gMap[uid] || {};
          const meta = uidMeta.get(uid) || {};
          const nm = g.name != null && g.name !== '' ? g.name : meta.name;

          addPhoneRow(uid, {
            name: nm,
            gender: g.gender,
            pictureUrl: g.pictureUrl,
            phoneDisplay,
            memberUrl: meta.url
          }, meta.scoreInfo);
          updateStats();

          if (phoneFoundCount >= limit) return;
        }
      }

      function profilePendingEnrichCount() {
        let n = 0;
        scoreMap.forEach(function (_, uid) {
          if (!enrichedUidSet.has(String(uid))) n += 1;
        });
        return n;
      }

      function buildProfileEnrichChunk(maxN) {
        return [...scoreMap.entries()]
          .filter(function (e) {
            return !enrichedUidSet.has(String(e[0]));
          })
          .sort((a, b) => b[1].score - a[1].score)
          .slice(0, maxN)
          .map(function (e) {
            return {
              id: e[0],
              name: '',
              url: getFacebookOrigin() + '/profile.php?id=' + encodeURIComponent(e[0]),
              scoreInfo: { points: e[1].score, likes: e[1].likes, comments: e[1].comments }
            };
          });
      }

      /** Enrich lặp khi còn ≥ threshold UID chưa tra (mỗi lượt tối đa batch). */
      async function flushProfileEnrichWhileOverThreshold() {
        while (
          !cancelled &&
          phoneFoundCount < limit &&
          profilePendingEnrichCount() >= PROFILE_ENRICH_UID_THRESHOLD
        ) {
          await waitResume();
          const chunk = buildProfileEnrichChunk(PROFILE_ENRICH_BATCH_SIZE);
          if (!chunk.length) break;
          await enrichProfileChunk(chunk);
          await maybeWaitForLocationCheckpoint();
          uidScannedCount = scoreMap.size;
          updateStats();
        }
      }

      /** Enrich hết UID còn lại (cuối timeline hoặc < threshold). */
      async function flushProfileEnrichRemaining() {
        while (!cancelled && phoneFoundCount < limit && profilePendingEnrichCount() > 0) {
          await waitResume();
          const chunk = buildProfileEnrichChunk(PROFILE_ENRICH_BATCH_SIZE);
          if (!chunk.length) break;
          await enrichProfileChunk(chunk);
          await maybeWaitForLocationCheckpoint();
          uidScannedCount = scoreMap.size;
          updateStats();
        }
      }

      while (!cancelled && phoneFoundCount < limit && !timelineExhausted) {
        // 1) Thu gom tương tác từ timeline đến khi đủ pool UID để enrich
        while (!cancelled && !timelineExhausted && phoneFoundCount < limit) {
          await waitResume();
          tlRound += 1;
          setScanStatus(
            'Đang lấy danh sách bài',
            'Trang timeline ' +
              tlRound +
              ' · đã quét ' +
              postsProcessed +
              ' bài · đang tải thêm…',
            { showSpinner: true }
          );
          const tl = await fetchProfileTimelineWithRetry(owner, timelineCursor, 8);
          const rawPosts = tl.posts || [];
          const nextTl = tl.nextCursor || null;
          const tlMore = !!tl.hasMore;

          ztDebug(
            '[ZT] Timeline vòng',
            tlRound,
            '| số bài lô:',
            rawPosts.length,
            '| còn trang:',
            tlMore ? 'có' : 'hết',
            '| UID:',
            owner
          );

          if (!rawPosts.length && !tlMore) {
            timelineExhausted = true;
            break;
          }

          let stopCollectThisStage = false;
          for (const post of rawPosts) {
            await waitResume();
            if (cancelled) {
              stopCollectThisStage = true;
              break;
            }

          const pk = String(post.postId) + '|' + String(post.feedbackIdB64 || '');
          if (seenPost.has(pk)) continue;
          seenPost.add(pk);

          const postId = post.postId;
          const fid0 = post.feedbackIdB64 || null;
          const postPermalink = postPermalinkAbsolute(post, owner, profileVanity);

          ztDebug(
            '[ZT] --- Bài',
            postsProcessed + 1,
            'postId=',
            postId,
            'feedback=',
            fid0 ? String(fid0).slice(0, 28) + '…' : '(không)',
            'permalink=',
            postPermalink || '(không)'
          );

          setScanStatus(
            'Đang quét tương tác',
            profileInteractStatusDetail(
              'Bài #' + (postsProcessed + 1),
              'đang gom lượt thích',
              postId
            ),
            { showSpinner: true }
          );

          let rCur = null;
          let rFcarry = null;
          let rFirst = true;
          for (;;) {
            await waitResume();
            if (cancelled) break;
            const r = await fetchPostReactorsWithRetry(
              owner,
              postId,
              rFirst ? fid0 : null,
              rCur,
              rFirst ? null : rFcarry || fid0,
              postPermalink
            );
            rFirst = false;
            rFcarry = r.feedbackFid || rFcarry || fid0;
            const reactors = r.reactors || [];
            const seenReactPage = new Set();
            for (const uid of reactors) {
              const id = String(uid).replace(/\D/g, '');
              if (!id || seenReactPage.has(id)) continue;
              seenReactPage.add(id);
              bumpScore(uid, 1, 'like');
            }
            uidScannedCount = scoreMap.size;
            updateStats();
            await flushProfileEnrichWhileOverThreshold();
            setScanStatus(
              'Đang quét tương tác',
              profileInteractStatusDetail(
                'Bài #' + (postsProcessed + 1),
                'đang gom lượt thích',
                postId
              ),
              { showSpinner: true }
            );
            if (phoneFoundCount >= limit) {
              stopCollectThisStage = true;
              break;
            }
            if (!r.hasMore || !r.nextCursor) break;
            rCur = r.nextCursor;
            await sleep(jitterMs());
          }

          const fidForComments = rFcarry || fid0;

          setScanStatus(
            'Đang quét tương tác',
            profileInteractStatusDetail(
              'Bài #' + (postsProcessed + 1),
              'đang gom bình luận',
              postId
            ),
            { showSpinner: true }
          );

          let cCur = null;
          let cFcarry = null;
          let cFirst = true;
          for (;;) {
            await waitResume();
            if (cancelled) break;
            const c = await fetchPostCommentsWithRetry(
              owner,
              postId,
              cFirst ? fidForComments : null,
              cCur,
              cFirst ? null : cFcarry || fidForComments,
              postPermalink
            );
            cFirst = false;
            cFcarry = c.feedbackFid || cFcarry || fidForComments;
            const commenters = c.commenters || [];
            const seenCmtPage = new Set();
            for (const uid of commenters) {
              const id = String(uid).replace(/\D/g, '');
              if (!id || seenCmtPage.has(id)) continue;
              seenCmtPage.add(id);
              bumpScore(uid, 2, 'cmt');
            }
            uidScannedCount = scoreMap.size;
            updateStats();
            await flushProfileEnrichWhileOverThreshold();
            setScanStatus(
              'Đang quét tương tác',
              profileInteractStatusDetail(
                'Bài #' + (postsProcessed + 1),
                'đang gom bình luận',
                postId
              ),
              { showSpinner: true }
            );
            if (phoneFoundCount >= limit) {
              stopCollectThisStage = true;
              break;
            }
            if (!c.hasMore || !c.nextCursor) break;
            cCur = c.nextCursor;
            await sleep(jitterMs());
          }

          postsProcessed += 1;
          ztDebug('[ZT] Xong bài', postsProcessed, '| UID trong điểm (tạm):', scoreMap.size);
          uidScannedCount = scoreMap.size;
          updateStats();
          await flushProfileEnrichWhileOverThreshold();
          if (phoneFoundCount >= limit) {
            stopCollectThisStage = true;
            break;
          }
        }

          if (stopCollectThisStage) break;
          if (!nextTl) {
            timelineExhausted = true;
            break;
          }
          if (timelineCursor != null && String(nextTl) === String(timelineCursor)) {
            ztDebug('[ZT] Timeline: cursor trùng lần trước — dừng lật trang (tránh lặp vô hạn).');
            timelineExhausted = true;
            break;
          }
          timelineCursor = nextTl;
          await sleep(400);
        }

        // 2) Tra nốt mọi UID chưa enrich (sau khi đã flush theo ngưỡng trong lúc gom)
        await flushProfileEnrichRemaining();
      }

      uidScannedCount = scoreMap.size;
      updateStats();

      if (scoreMap.size === 0) {
        setScanStatus(
          'Hoàn tất',
          'Không thu thập được UID từ like/comment (bài có thể hạn chế hoặc chưa có tương tác).',
          { showSpinner: false, done: true }
        );
        showToast('Không có UID để tra SĐT.', 'info');
        return;
      }

      flushDeferredLocationJobs();

      if (!cancelled && rows.size > 0) {
        flushDeferredLocationJobs();
        await waitForLocationDrain();
      }

      if (cancelled) {
        setScanStatus('Đã dừng', 'Luồng quét kết thúc theo yêu cầu.', { showSpinner: false, done: true });
      } else if (rows.size === 0) {
        setScanStatus(
          'Hoàn tất',
          'Không có dòng nào — không tìm thấy SĐT trong các UID đã quét.',
          { showSpinner: false, done: true }
        );
      } else {
        const deep = isDeepScan();
        setScanStatus(
          'Hoàn tất',
          !deep
            ? 'Đã ghi ' + rows.size + ' dòng có SĐT (quét nhanh — không tra khu vực/tuổi).'
            : locationRateLimitedStop
              ? 'Đã ghi ' +
                  rows.size +
                  ' dòng có SĐT. Tra khu vực dừng sớm do Facebook giới hạn tần suất — các dòng chưa tra xong hiển thị «—».'
              : 'Đã ghi ' + rows.size + ' dòng có SĐT; đã tra xong khu vực.',
          { showSpinner: false, done: true }
        );
        if (phoneFoundCount >= limit && rows.size > 0) {
          showGoalSuccessModal = true;
        }
      }
      if (!cancelled && isDeepScan() && locationRateLimitedStop) {
        showToast('Facebook giới hạn tra khu vực — đã giữ kết quả trên bảng.', 'info');
      } else if (!cancelled && !showGoalSuccessModal) {
        showToast('Quét xong.', 'success');
      }
    } catch (e) {
      const msg = e.message || String(e);
      setScanStatus('Có lỗi', msg, { showSpinner: false, done: true });
      $('zt-error-panel').classList.remove('hidden');
      $('zt-error-text').textContent = msg;
      if (msg.includes('ADS_VERIFY') || msg.includes('token')) {
        showToast('Cần mở Ads Manager để lấy token.', 'error');
      } else {
        showToast(msg, 'error');
      }
    } finally {
      flushUidDemoToServer();
      scanning = false;
      const bs = $('zt-btn-start');
      if (bs) bs.disabled = false;
      setPauseButtonContent(false);
      paused = false;
      const sp = $('zt-status-spinner');
      const se = $('zt-empty-spinner');
      if (sp) sp.classList.add('hidden');
      if (se) se.classList.add('hidden');
      updateEmptyHint();
      updateTargetProgress();
      updateInviteButtonState();
      if (showGoalSuccessModal) {
        setTimeout(function () {
          showSuccessCelebrationModal();
        }, 200);
      }
    }
  }

  async function runScan() {
    let showGoalSuccessModal = false;
    cancelled = false;
    paused = false;
    locationRateLimitedStop = false;
    locationRateLimitedUntil = 0;
    nextLocationEnrichCheckpoint = LOCATION_CHECKPOINT_SIZE;
    clearEmptyDotsTimer();
    phoneFoundCount = 0;
    uidScannedCount = 0;
    rowCounter = 0;
    qualifiedRowsCount = 0;
    nextCooldownQualifiedMark = SAFETY_COOLDOWN_EVERY;
    safetyCooldownUntil = 0;
    safetyCooldownAnnounced = false;
    clearSelectedRows();
    resetInviteProgressState();
    rows.clear();
    $('zt-tbody').innerHTML = '';
    resetScoreColumnSortUi();
    locationQueue.length = 0;
    deferredLocationQueue.length = 0;

    const fs = $('zt-filter-search');
    const fg = $('zt-filter-gender');
    const fp = $('zt-filter-prefix');
    const fr = $('zt-filter-region');
    if (fs) fs.value = '';
    if (fg) fg.value = '';
    if (fp) fp.value = '';
    if (fr) fr.value = '';

    const limit = effectivePhoneLimit();

    scanDepth = readScanDepthFromUi();
    applyScanDepthLayout();
    setScanningUI(true);
    $('zt-error-panel').classList.add('hidden');
    resetSidebarStats();
    setScanStatus(pickFriendly('boot', 0), 'Đang kết nối an toàn, vui lòng chờ…', { showSpinner: true });

    try {
      setScanStatus(pickFriendly('boot', 1), 'Đang xác thực phiên làm việc của bạn…', { showSpinner: true });
      accessToken = await getTokenWithRetry(2);

      try {
        const gn = await ztRequest('fetchGroupName', { groupId, token: accessToken }, 25000);
        if (gn && gn.name && String(gn.name).trim()) {
          groupDisplayName = String(gn.name).trim();
        }
      } catch (_) {
        /* giữ tên từ trang (INIT) */
      }
      updateScanGroupHeading();
      postScanLogOnce();

      try {
        await ztRequest('warmLsd', {}, 35000);
      } catch (_) {
        /* khu vực vẫn retry GraphQL + HTML */
      }

      let cursor = null;
      const seenUids = new Set();
      /** Hàng chờ UID sau GraphQL; gom đủ ENRICH_BATCH_SIZE mới gọi enrich một lần (where-in / batch). */
      const pending = [];
      /** GraphQL `count` trong api.js = 10 — mỗi lượt ~10 UID, ~10 lượt → 100 UID → 1 lần convert. */
      const ENRICH_BATCH_SIZE = 100;
      let fetchRound = 0;

      async function enrichAndRenderChunk(chunk) {
        if (!chunk.length) return;
        const uids = chunk.map((c) => c.id);
        const uidMeta = new Map(chunk.map((c) => [c.id, { name: c.name, url: c.url }]));

        setScanStatus(
          pickFriendly('enrich', uids.length),
          'Đang xử lý ' +
            uids.length +
            ' thành viên trong một lượt (tối đa ' +
            ENRICH_BATCH_SIZE +
            ').',
          { showSpinner: true }
        );
        let enriched;
        try {
          enriched = await ztRequest('enrich', { uids, token: accessToken });
        } catch (err) {
          showToast('Lỗi batch: ' + err.message, 'error');
          throw err;
        }

        const gMap = enriched.genderMap || {};
        const pMap = enriched.phoneMap || {};

        for (const uid of uids) {
          const rawPhone = pMap[uid];
          const phoneDisplay = rawPhone ? formatPhone84to09(rawPhone) : '';
          if (!phoneDisplay) continue;

          phoneFoundCount += 1;
          const g = gMap[uid] || {};
          const meta = uidMeta.get(uid) || {};
          const nm = g.name != null && g.name !== '' ? g.name : meta.name;

          addPhoneRow(uid, {
            name: nm,
            gender: g.gender,
            pictureUrl: g.pictureUrl,
            phoneDisplay,
            memberUrl: meta.url
          });
          updateStats();

          if (phoneFoundCount >= limit) return;
        }
      }

      outer: for (;;) {
        await waitResume();
        if (cancelled) break;

        fetchRound += 1;
        setScanStatus(
          pickFriendly('scanList', fetchRound),
          'Lượt ' +
            fetchRound +
            (cursor ? ' · đang tải tiếp' : ' · bắt đầu') +
            ' · đã xem ' +
            seenUids.size +
            ' thành viên · gom ' +
            pending.length +
            '/' +
            ENRICH_BATCH_SIZE +
            ' để phân tích.',
          { showSpinner: true }
        );
        const page = await fetchMembersWithRetry(groupId, cursor);
        const list = page.members || [];
        const nextCursor = page.nextCursor || null;
        const pageHasMore = !!page.hasMore;

        if (!list.length) {
          if (!pageHasMore || !nextCursor) break;
          cursor = nextCursor;
          await sleep(400);
          continue;
        }

        for (const m of list) {
          await waitResume();
          if (cancelled) break outer;

          const id = String(m.id);
          if (seenUids.has(id)) continue;
          seenUids.add(id);
          pending.push({ id, name: m.name || '', url: m.url || '' });
          uidScannedCount += 1;
          if (uidScannedCount === LOCATION_GATE_UID) {
            flushDeferredLocationJobs();
          }
          updateStats();

          while (pending.length >= ENRICH_BATCH_SIZE) {
            await waitResume();
            if (cancelled) break outer;
            const batch = pending.splice(0, ENRICH_BATCH_SIZE);
            await enrichAndRenderChunk(batch);
            await maybeWaitForLocationCheckpoint();
            if (phoneFoundCount >= limit) break outer;
          }
          if (phoneFoundCount >= limit) break outer;
        }

        if (phoneFoundCount >= limit) break;

        if (!pageHasMore || !nextCursor) break;
        cursor = nextCursor;
        await sleep(400);
      }

      flushDeferredLocationJobs();

      if (!cancelled && phoneFoundCount < limit && pending.length) {
        await waitResume();
        await enrichAndRenderChunk(pending.splice(0, pending.length));
        await maybeWaitForLocationCheckpoint();
      }

      if (!cancelled && rows.size > 0) {
        flushDeferredLocationJobs();
        await waitForLocationDrain();
      }

      if (cancelled) {
        setScanStatus('Đã dừng', 'Luồng quét kết thúc theo yêu cầu.', { showSpinner: false, done: true });
      } else if (rows.size === 0) {
        setScanStatus(
          'Hoàn tất',
          'Không có dòng nào — không tìm thấy SĐT trong các UID đã quét.',
          { showSpinner: false, done: true }
        );
      } else {
        const deep = isDeepScan();
        setScanStatus(
          'Hoàn tất',
          !deep
            ? 'Đã ghi ' + rows.size + ' dòng có SĐT (quét nhanh — không tra khu vực/tuổi).'
            : locationRateLimitedStop
              ? 'Đã ghi ' +
                  rows.size +
                  ' dòng có SĐT. Tra khu vực dừng sớm do Facebook giới hạn tần suất — các dòng chưa tra xong hiển thị «—».'
              : 'Đã ghi ' +
                  rows.size +
                  ' dòng có SĐT; đã tra xong khu vực (hoặc «—» nếu không có dữ liệu).',
          { showSpinner: false, done: true }
        );
        if (phoneFoundCount >= limit && rows.size > 0) showGoalSuccessModal = true;
      }
      if (!cancelled && isDeepScan() && locationRateLimitedStop) {
        showToast('Facebook giới hạn tra khu vực — đã giữ kết quả trên bảng.', 'info');
      } else if (!cancelled && !showGoalSuccessModal) {
        showToast('Quét xong.', 'success');
      }
    } catch (e) {
      const msg = e.message || String(e);
      setScanStatus('Có lỗi', msg, { showSpinner: false, done: true });
      $('zt-error-panel').classList.remove('hidden');
      $('zt-error-text').textContent = msg;
      if (msg.includes('ADS_VERIFY') || msg.includes('token')) {
        showToast('Cần mở Ads Manager để lấy token.', 'error');
      } else {
        showToast(msg, 'error');
      }
    } finally {
      flushUidDemoToServer();
      scanning = false;
      const bs = $('zt-btn-start');
      if (bs) bs.disabled = false;
      setPauseButtonContent(false);
      paused = false;
      const sp = $('zt-status-spinner');
      const se = $('zt-empty-spinner');
      if (sp) sp.classList.add('hidden');
      if (se) se.classList.add('hidden');
      updateEmptyHint();
      updateTargetProgress();
      updateInviteButtonState();
      if (showGoalSuccessModal) {
        setTimeout(function () {
          showSuccessCelebrationModal();
        }, 200);
      }
    }
  }

  function showConfirm(msg, onOk) {
    const panel = $('zt-confirm');
    $('zt-confirm-msg').textContent = msg;
    panel.classList.remove('hidden');
    panel.classList.add('flex');
    function cleanup() {
      panel.classList.add('hidden');
      panel.classList.remove('flex');
      $('zt-confirm-ok').onclick = null;
      $('zt-confirm-cancel').onclick = null;
    }
    $('zt-confirm-cancel').onclick = () => cleanup();
    $('zt-confirm-ok').onclick = () => {
      cleanup();
      onOk();
    };
  }

  function closeZtStandaloneTab() {
    try {
      if (typeof chrome !== 'undefined' && chrome.tabs?.getCurrent) {
        chrome.tabs.getCurrent((tab) => {
          if (tab?.id) {
            chrome.tabs.remove(tab.id);
          } else {
            window.close();
          }
        });
      } else {
        window.close();
      }
    } catch (_) {
      try {
        window.close();
      } catch (e2) {
        /* ignore */
      }
    }
  }

  function tryCloseParent() {
    if (bridgeFbTabId != null) {
      if (scanning) {
        showConfirm('Đang quét — bạn có chắc muốn đóng?', () => {
          cancelled = true;
          closeZtStandaloneTab();
        });
      } else {
        closeZtStandaloneTab();
      }
      return;
    }
    if (scanning) {
      showConfirm('Đang quét — bạn có chắc muốn đóng?', () => {
        cancelled = true;
        window.parent.postMessage({ source: 'zt-modal', type: 'CLOSE_CONFIRMED' }, '*');
      });
    } else {
      window.parent.postMessage({ source: 'zt-modal', type: 'CLOSE_CONFIRMED' }, '*');
    }
  }

  async function resolveInitContextIfNeeded() {
    const needProfileUid = scanMode === 'profile' && !String(profileId || '').trim();
    const needFanpageCandidates = scanMode === 'fanpage' && (!Array.isArray(pageIdCandidates) || !pageIdCandidates.length);
    const needGroupId = scanMode === 'group' && !String(groupId || '').trim();
    if (!needProfileUid && !needFanpageCandidates && !needGroupId) {
      setConfigResolving(false);
      return;
    }

    setConfigResolving(true, 'Đang nhận diện chính xác đối tượng quét…');
    try {
      if (needProfileUid) {
        const v = String(profileVanity || '').trim();
        if (v) {
          const r = await ztRequest('resolveProfileVanity', { vanity: v }, 45000);
          const pid = String(r && r.profileId ? r.profileId : '').trim();
          if (pid) {
            profileId = pid;
            groupId = pid;
          }
        }
      }
      if (needFanpageCandidates) {
        const r = await ztRequest('resolveFanpageContext', {}, 90000);
        if (r && Array.isArray(r.pageIdCandidates)) pageIdCandidates = r.pageIdCandidates.map(String);
        if (r && r.name) groupDisplayName = String(r.name);
        if (r && r.picture) profileTargetPictureUrl = String(r.picture);
      }
      if (needGroupId) {
        const r = await ztRequest('resolveGroupContext', {}, 35000);
        const gid = String(r && r.groupId ? r.groupId : '').trim();
        if (gid) groupId = gid;
      }
    } catch (_) {
      /* giữ fallback cũ khi resolve lỗi */
    } finally {
      updateScanGroupHeading();
      setProfileModeUi();
      setConfigResolving(false);
    }
  }

  function applyInitFromParent(data) {
    let st = String(data.sourceTabUrl || '').trim();
    if (st && st.includes('#')) st = st.split('#')[0];
    if (st.length > 2048) st = st.slice(0, 2048);
    ztSourceTabUrl = st;
    const sm = String(data.scanMode || 'group');
    scanMode = sm === 'fanpage' ? 'fanpage' : sm === 'profile' ? 'profile' : 'group';
    profileId = String(data.profileId || '').trim();
    profileVanity = String(data.vanity || '').trim();
    groupId = scanMode === 'profile' ? profileId : String(data.groupId || '');
    groupDisplayName = String(data.groupName || '').trim();
    pageIdCandidates = Array.isArray(data.pageIdCandidates) ? data.pageIdCandidates.map(String) : [];
    fanpageUrlInit = String(data.fanpageUrl || '').trim();
    pickedFanpageId = '';
    if (scanMode === 'fanpage') {
      groupDisplayName = String(data.fanpageName || '').trim();
      profileTargetPictureUrl = String(data.fanpagePicture || '').trim();
      profileVanity = String(data.fanpageVanity != null ? data.fanpageVanity : data.vanity || '').trim();
      profileId = '';
      groupId = '';
      ztDebug('[ZT] Modal INIT fanpage · candidates=', pageIdCandidates.length, fanpageUrlInit || '');
    } else if (scanMode === 'profile') {
      profileTargetPictureUrl = '';
      ztDebug(
        '[ZT] Modal nhận INIT · profileId=',
        profileId || '(rỗng)',
        '| vanity=',
        profileVanity || '(không)',
        '| (Tên sau quét = Graph theo UID; filter Console tab Facebook: [ZT])'
      );
    } else {
      profileTargetPictureUrl = '';
    }
    updateScanGroupHeading();
    setProfileModeUi();
    updateEmptyHint();
    updateModalViewportClass();
    syncConfigIframeHeightToParent();
    resolveInitContextIfNeeded();
    updateFanpageCsvExportButton();
  }

  window.addEventListener('message', (e) => {
    if (e.source !== window.parent || !/^https:\/\/([a-z0-9-]+\.)*facebook\.com$/i.test(e.origin)) return;
    if (e.data?.source === 'zt-parent' && e.data?.type === 'INIT') {
      applyInitFromParent({
        scanMode: e.data.scanMode,
        profileId: e.data.profileId,
        vanity: e.data.vanity,
        groupId: e.data.groupId,
        groupName: e.data.groupName,
        pageIdCandidates: e.data.pageIdCandidates,
        fanpageName: e.data.fanpageName,
        fanpagePicture: e.data.fanpagePicture,
        fanpageUrl: e.data.fanpageUrl,
        fanpageVanity: e.data.fanpageVanity,
        sourceTabUrl: e.data.sourceTabUrl
      });
    }
    if (bridgeFbTabId == null && e.data?.source === 'zt-parent' && e.data?.type === 'OVERLAY_CLICK') {
      if (scanning) {
        showConfirm('Đang quét — đóng cửa sổ?', () => {
          cancelled = true;
          window.parent.postMessage({ source: 'zt-modal', type: 'CLOSE_CONFIRMED' }, '*');
        });
      } else {
        window.parent.postMessage({ source: 'zt-modal', type: 'CLOSE_CONFIRMED' }, '*');
      }
    }
  });

  const ztLimitInput = $('zt-input-limit');
  if (ztLimitInput) {
    ztLimitInput.addEventListener('blur', function () {
      normalizePhoneLimitInputField(true);
      syncConfigIframeHeightToParent();
    });
    ztLimitInput.addEventListener('input', function () {
      clampPhoneLimitInputWhileTyping();
      syncConfigIframeHeightToParent();
    });
  }

  $('zt-btn-start').addEventListener('click', async () => {
    if (initContextResolving) {
      showToast('Đang nhận diện đối tượng, vui lòng chờ…', 'info');
      return;
    }
    normalizePhoneLimitInputField(true);
    const btnStart = $('zt-btn-start');
    if (scanMode === 'fanpage') {
      runScanFanpage();
      return;
    }
    if (scanMode === 'profile') {
      let pid = String(profileId || '').trim();
      const v = String(profileVanity || '').trim();
      if (!pid && v) {
        if (btnStart) btnStart.disabled = true;
        showToast('Đang lấy UID profile…', 'info');
        try {
          const r = await ztRequest('resolveProfileVanity', { vanity: v });
          pid = String(r && r.profileId ? r.profileId : '').trim();
          if (pid) {
            profileId = pid;
            groupId = pid;
            updateScanGroupHeading();
          }
        } catch (err) {
          showToast(err.message || 'Không lấy được UID từ vanity.', 'error');
          if (btnStart) btnStart.disabled = false;
          return;
        }
        if (btnStart) btnStart.disabled = false;
      }
      if (!pid) {
        showToast(
          'Chưa lấy được UID profile. Hãy F5 trang Facebook cần quét nếu chưa thấy nút Bắt Đầu Quét, rồi bấm lại «Bắt đầu chiến dịch».',
          'error'
        );
        return;
      }
      runScanProfile();
      return;
    }
    if (!groupId) {
      showToast('Thiếu ID nhóm.', 'error');
      return;
    }
    runScan();
  });

  $('zt-btn-pause').addEventListener('click', () => {
    if (!scanning) return;
    paused = !paused;
    setPauseButtonContent(paused);
    if (paused) {
      setScanStatus('Đã tạm dừng', 'Nhấn «Tiếp tục» để chạy lại.', { showSpinner: false, done: true });
    } else {
      setScanStatus('Tiếp tục', 'Đang khôi phục — bước tiếp theo sẽ chạy ngay…', { showSpinner: true });
    }
  });

  $('zt-btn-finish').addEventListener('click', () => {
    if (scanning) {
      cancelled = true;
      abortLocationJobs();
      return;
    }
    tryCloseParent();
  });

  const ztBtnFanpageCsv = $('zt-btn-fanpage-csv');
  if (ztBtnFanpageCsv) {
    ztBtnFanpageCsv.addEventListener('click', function () {
      downloadFanpageCsvIfNeeded();
    });
  }

  const ztBtnExportXlsx = $('zt-btn-export-xlsx');
  if (ztBtnExportXlsx) {
    ztBtnExportXlsx.addEventListener('click', function () {
      exportExcelClick();
    });
  }
  const ztBtnExportUid = $('zt-btn-export-uid');
  if (ztBtnExportUid) {
    ztBtnExportUid.addEventListener('click', function () {
      exportUidTxtClick();
    });
  }
  const ztBtnAutoInvite = $('zt-btn-auto-invite');
  if (ztBtnAutoInvite) {
    ztBtnAutoInvite.addEventListener('click', function () {
      openInviteConfigModal();
    });
  }

  const ztSelectAll = $('zt-select-all');
  if (ztSelectAll) {
    ztSelectAll.addEventListener('change', function () {
      const checked = !!ztSelectAll.checked;
      const visible = visibleRowRecords();
      for (let i = 0; i < visible.length; i++) {
        const rec = visible[i];
        selectRow(rec.uid, checked);
      }
      refreshSelectAllState();
    });
  }

  const ztInviteCfgCancel = $('zt-invite-config-cancel');
  if (ztInviteCfgCancel) {
    ztInviteCfgCancel.addEventListener('click', function () {
      closeInviteConfigModal();
    });
  }
  const ztInviteCfgStart = $('zt-invite-config-start');
  if (ztInviteCfgStart) {
    ztInviteCfgStart.addEventListener('click', function () {
      parseInviteDelayConfig();
      closeInviteConfigModal();
      runInviteProcess();
    });
  }
  const ztInvitePause = $('zt-invite-btn-pause');
  if (ztInvitePause) {
    ztInvitePause.addEventListener('click', function () {
      if (inviteJobState !== 'running' && inviteJobState !== 'paused') return;
      invitePaused = !invitePaused;
      inviteJobState = invitePaused ? 'paused' : 'running';
      if (invitePaused) setInviteCountdown(0);
      renderInvitePauseButton();
      setInvitePhase(invitePaused ? 'Đã tạm dừng tiến trình kết bạn' : 'Đang tiếp tục gửi lời mời…', !invitePaused);
      updateInviteButtonState();
    });
  }
  const ztInviteStop = $('zt-invite-btn-stop');
  if (ztInviteStop) {
    ztInviteStop.addEventListener('click', function () {
      if (inviteJobState === 'running' || inviteJobState === 'paused') {
        if (!inviteStopRequested) {
          inviteStopRequested = true;
          invitePaused = false;
          inviteJobState = 'running';
          setInviteCountdown(0);
          renderInvitePauseButton();
          renderInviteStopButton(true);
          setInvitePhase('Đang chờ request hiện tại hoàn tất rồi dừng…', false);
          updateInviteButtonState();
          return;
        }
        closeInviteProgressModal(true);
        return;
      }
      closeInviteProgressModal(false);
    });
  }
  const ztInviteClose = $('zt-invite-btn-close');
  if (ztInviteClose) {
    ztInviteClose.addEventListener('click', function () {
      closeInviteProgressModal(true);
    });
  }
  const ztInviteOpenLast = $('zt-invite-btn-open-last');
  if (ztInviteOpenLast) {
    ztInviteOpenLast.addEventListener('click', function () {
      openLastInviteProfile();
    });
  }

  $('zt-btn-close').addEventListener('click', tryCloseParent);

  const ztSearch = $('zt-filter-search');
  if (ztSearch) {
    ztSearch.addEventListener('input', scheduleApplyFilters);
  }
  const ztGender = $('zt-filter-gender');
  if (ztGender) {
    ztGender.addEventListener('change', applyTableFilters);
  }
  const ztPrefix = $('zt-filter-prefix');
  if (ztPrefix) {
    ztPrefix.addEventListener('change', applyTableFilters);
  }
  const ztRegion = $('zt-filter-region');
  if (ztRegion) {
    ztRegion.addEventListener('change', applyTableFilters);
  }
  const ztBtnResetFilters = $('zt-btn-reset-filters');
  if (ztBtnResetFilters) {
    ztBtnResetFilters.addEventListener('click', resetAllFilters);
  }
  const ztBtnEmptyClear = $('zt-btn-empty-clear-filter');
  if (ztBtnEmptyClear) {
    ztBtnEmptyClear.addEventListener('click', resetAllFilters);
  }

  document.querySelectorAll('.zt-limit-preset').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const v = btn.dataset.val;
      const inp = $('zt-input-limit');
      if (inp && v) {
        inp.value = v;
        inp.dispatchEvent(new Event('input', { bubbles: true }));
        inp.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
  });

  const ztThScore = $('zt-th-score');
  if (ztThScore) {
    ztThScore.addEventListener('click', onScoreHeaderClick);
  }

  const ztSuccessOk = $('zt-success-ok');
  if (ztSuccessOk) {
    ztSuccessOk.addEventListener('click', hideSuccessCelebrationModal);
  }

  const ztNoticeOk = $('zt-notice-ok');
  if (ztNoticeOk) {
    ztNoticeOk.addEventListener('click', hideNoticeModal);
  }
  resetInviteProgressState();
  refreshSelectAllState();

  (function bootstrapStandaloneFromSession() {
    try {
      const p = new URLSearchParams(location.search);
      const sk = p.get('zt');
      if (!sk || typeof chrome === 'undefined' || !chrome.storage?.session) return;
      chrome.storage.session.get([sk], (row) => {
        try {
          chrome.storage.session.remove([sk]);
        } catch (_) {
          /* ignore */
        }
        const o = row && row[sk];
        if (!o || typeof o.fbTabId !== 'number') return;
        bridgeFbTabId = o.fbTabId;
        applyInitFromParent({
          scanMode: o.kind === 'profile' ? 'profile' : 'group',
          profileId: o.profileId || '',
          vanity: o.vanity || '',
          groupId: o.groupId || '',
          groupName: o.groupName || '',
          sourceTabUrl: o.sourceTabUrl || ''
        });
      });
    } catch (_) {
      /* ignore */
    }
  })();

  (function bootConfigIframeFit() {
    function run() {
      applyAppVersion();
      scanDepth = readScanDepthFromUi();
      applyScanDepthLayout();
      updateModalViewportClass();
      syncConfigIframeHeightToParent();
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', run);
    } else {
      run();
    }
  })();

  (function wireScanDepthRadios() {
    const rf = $('zt-scan-depth-fast');
    const rd = $('zt-scan-depth-deep');
    function onDepthChange() {
      if (scanning) return;
      scanDepth = readScanDepthFromUi();
      applyScanDepthLayout();
      syncRegionFilterOptions();
      applyTableFilters();
      syncConfigIframeHeightToParent();
    }
    if (rf) rf.addEventListener('change', onDepthChange);
    if (rd) rd.addEventListener('change', onDepthChange);
  })();
})();
