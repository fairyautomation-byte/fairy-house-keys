(function () {
  'use strict';

  if (typeof location === 'undefined') return;
  const FB_ALLOWED_HOSTS = new Set(['facebook.com', 'www.facebook.com', 'web.facebook.com']);
  if (!FB_ALLOWED_HOSTS.has(String(location.hostname || '').toLowerCase())) return;

  const ZOO_BTN_ID = 'zoo-target-header-btn';
  const WRAP_ID = 'zt-profile-phone-header-wrap';
  const MODAL_ID = 'zt-profile-phone-modal-overlay';
  const LINK_ID = 'zt-biz-inbox-phone-css';
  const DEBOUNCE_MS = 400;

  let mobTimer = null;
  let scheduleTimer = null;
  let lastPath = '';
  /** @type {{ uid: string, raw: string|null, pathKey?: string, fetched?: boolean }|null} */
  let phoneCache = null;
  let lastSkipProfileLogKey = '';
  let modalKeydownHandler = null;
  /** Tránh chạy song song nhiều lần `ensureProfilePhoneButton`. */
  let profilePhoneEnsureLock = false;
  let ztCoverMainObs = null;
  let ztCoverPollTimer = null;

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

  const PHONE_SVG =
    '<svg class="zt-phbtn-svg" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" fill="currentColor"/>' +
    '</svg>';

  function isGroupPageLocal() {
    const p = location.pathname || '';
    if (!/^\/groups\/[^/]+/.test(p)) return false;
    const m = p.match(/^\/groups\/([^/]+)/);
    const seg = m ? String(m[1] || '').trim() : '';
    if (!seg || /^(feed|discover|browse|suggested|join|create|your_groups)$/i.test(seg)) return false;
    return true;
  }

  function isFanpageLikePageLocal() {
    if (isGroupPageLocal()) return false;
    if (typeof FanpageResolver === 'undefined' || !FanpageResolver.detectFromDocument) return false;
    const p = String(location.pathname || '').replace(/\/+$/, '') || '/';
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

  function isProfileLikePageLocal() {
    if (isGroupPageLocal()) return false;
    const p = String(location.pathname || '').replace(/\/+$/, '') || '/';
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

  function shouldRunOnPersonalProfile() {
    if (isGroupPageLocal()) return false;
    if (isFanpageLikePageLocal()) return false;
    return isProfileLikePageLocal();
  }

  function ensureStyles() {
    if (document.getElementById(LINK_ID)) return;
    const link = document.createElement('link');
    link.id = LINK_ID;
    link.rel = 'stylesheet';
    link.href = chrome.runtime.getURL('src/ui/business-inbox-phone.css');
    (document.head || document.documentElement).appendChild(link);
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

  function dbgPhone(msg, data) {
    try {
      if (typeof localStorage !== 'undefined' && localStorage.getItem('ztCoverDebug') !== '1') return;
      if (msg.indexOf('bỏ qua') >= 0 && data && data.path) {
        const k = String(data.path);
        if (k === lastSkipProfileLogKey) return;
        lastSkipProfileLogKey = k;
      }
      if (data !== undefined) console.info('[ZT Phone]', msg, data);
      else console.info('[ZT Phone]', msg);
    } catch (_) {
      /* ignore */
    }
  }

  function closeModal() {
    const el = document.getElementById(MODAL_ID);
    if (el) {
      try {
        el.remove();
      } catch (_) {
        /* ignore */
      }
    }
    if (modalKeydownHandler) {
      try {
        document.removeEventListener('keydown', modalKeydownHandler, true);
      } catch (_) {
        /* ignore */
      }
      modalKeydownHandler = null;
    }
  }

  function renderModalBody(uid, phoneDisplay, digits, errMsg, subMsg) {
    const uidEsc = escHtml(uid);
    let phoneBlock = '';
    if (phoneDisplay && digits) {
      const masked =
        !!window.__ztPhoneMask &&
        window.ZTPhoneDisplay &&
        typeof window.ZTPhoneDisplay.maskDisplay === 'function';
      const dispUi = masked ? window.ZTPhoneDisplay.maskDisplay(phoneDisplay) : phoneDisplay;
      if (masked) {
        phoneBlock =
          '<div class="zt-pphone-field">' +
          '<span class="zt-pphone-label">Số điện thoại</span>' +
          '<p class="zt-pphone-phone">' +
          escHtml(dispUi) +
          '</p>' +
          '</div>';
      } else {
        const tel = hrefTelFromDigits(digits);
        const zalo = hrefZaloFromDigits(digits);
        phoneBlock =
          '<div class="zt-pphone-field">' +
          '<span class="zt-pphone-label">Số điện thoại</span>' +
          '<p class="zt-pphone-phone">' +
          escHtml(dispUi) +
          '</p>' +
          '<div class="zt-pphone-actions">' +
          '<a class="zt-pphone-btn zt-pphone-btn--call" href="' +
          escHtml(tel) +
          '" rel="noopener noreferrer">Gọi</a>' +
          '<a class="zt-pphone-btn zt-pphone-btn--zalo" href="' +
          escHtml(zalo) +
          '" target="_blank" rel="noopener noreferrer">Zalo</a>' +
          '</div>' +
          '</div>';
      }
    } else if (errMsg) {
      phoneBlock =
        '<div class="zt-pphone-field zt-pphone-field--err">' +
        '<p class="zt-pphone-sub">' +
        escHtml(errMsg) +
        '</p>' +
        '</div>';
    } else if (subMsg) {
      phoneBlock =
        '<div class="zt-pphone-field zt-pphone-field--muted">' +
        '<p class="zt-pphone-sub">' +
        escHtml(subMsg) +
        '</p>' +
        '</div>';
    } else {
      phoneBlock =
        '<div class="zt-pphone-field zt-pphone-field--muted">' +
        '<p class="zt-pphone-sub">Chưa có SĐT trong kho cho UID này.</p>' +
        '</div>';
    }

    return (
      '<div class="zt-pphone-body-inner">' +
      '<div class="zt-pphone-field">' +
      '<span class="zt-pphone-label">UID</span>' +
      '<p class="zt-pphone-uid">' +
      uidEsc +
      '</p>' +
      '</div>' +
      phoneBlock +
      '</div>'
    );
  }

  function openModalLoading() {
    closeModal();
    ensureStyles();
    const overlay = document.createElement('div');
    overlay.id = MODAL_ID;
    overlay.className = 'zt-pphone-modal-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.innerHTML =
      '<div class="zt-pphone-modal-backdrop" data-zt-pphone-close="1"></div>' +
      '<div class="zt-pphone-modal-shell">' +
      '<div class="zt-pphone-modal-card">' +
      '<div class="zt-pphone-modal-head">' +
      '<span class="zt-pphone-modal-title">Fairy House AutoData</span>' +
      '<button type="button" class="zt-pphone-modal-x" data-zt-pphone-close="1" aria-label="Đóng">×</button>' +
      '</div>' +
      '<div class="zt-pphone-modal-body">' +
      '<p class="zt-pphone-loading">Đang lấy UID &amp; SĐT…</p>' +
      '</div>' +
      '</div>' +
      '</div>';

    document.body.appendChild(overlay);

    function onClose(e) {
      if (e.target && e.target.getAttribute && e.target.getAttribute('data-zt-pphone-close') === '1') {
        e.preventDefault();
        closeModal();
      }
    }
    overlay.addEventListener('click', onClose, true);

    modalKeydownHandler = function (ev) {
      if (ev.key === 'Escape') {
        ev.preventDefault();
        closeModal();
      }
    };
    document.addEventListener('keydown', modalKeydownHandler, true);
  }

  function openModalFilled(uid, phoneDisplay, digits, errMsg, subMsg) {
    closeModal();
    ensureStyles();
    const overlay = document.createElement('div');
    overlay.id = MODAL_ID;
    overlay.className = 'zt-pphone-modal-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.innerHTML =
      '<div class="zt-pphone-modal-backdrop" data-zt-pphone-close="1"></div>' +
      '<div class="zt-pphone-modal-shell">' +
      '<div class="zt-pphone-modal-card">' +
      '<div class="zt-pphone-modal-head">' +
      '<span class="zt-pphone-modal-title">Fairy House AutoData · Liên hệ</span>' +
      '<button type="button" class="zt-pphone-modal-x" data-zt-pphone-close="1" aria-label="Đóng">×</button>' +
      '</div>' +
      '<div class="zt-pphone-modal-body">' +
      renderModalBody(uid, phoneDisplay, digits, errMsg, subMsg) +
      '</div>' +
      '</div>' +
      '</div>';

    document.body.appendChild(overlay);

    overlay.addEventListener(
      'click',
      function (e) {
        if (e.target && e.target.getAttribute && e.target.getAttribute('data-zt-pphone-close') === '1') {
          e.preventDefault();
          closeModal();
        }
      },
      true
    );

    modalKeydownHandler = function (ev) {
      if (ev.key === 'Escape') {
        ev.preventDefault();
        closeModal();
      }
    };
    document.addEventListener('keydown', modalKeydownHandler, true);
  }

  function removePhoneUi() {
    closeModal();
    const w = document.getElementById(WRAP_ID);
    if (w && w.parentNode) w.parentNode.removeChild(w);
    phoneCache = null;
  }

  function hasDisplayablePhoneFromCache() {
    if (!phoneCache || !phoneCache.raw) return false;
    const d = digitsOnly(phoneCache.raw);
    return d.length >= 9;
  }

  async function onPhoneBtnClick(e) {
    e.preventDefault();
    e.stopPropagation();
    openModalLoading();

    const pathKey = String(location.pathname || '') + String(location.search || '');

    if (typeof ProfileResolver === 'undefined' || !ProfileResolver.getProfileIdFromCurrentPage) {
      openModalFilled('—', '', '', 'ProfileResolver không sẵn sàng.', '');
      return;
    }

    let uid = '';
    try {
      uid = await ProfileResolver.getProfileIdFromCurrentPage();
    } catch (err) {
      uid = '';
    }
    uid = uid ? String(uid).trim() : '';

    if (!uid || !/^\d{5,20}$/.test(uid)) {
      openModalFilled('—', '', '', 'Không lấy được UID.', '');
      return;
    }

    if (phoneCache && phoneCache.uid === uid) {
      const raw = phoneCache.raw;
      if (raw) {
        const disp = formatPhone84to09(raw);
        const dig = digitsOnly(raw);
        openModalFilled(uid, disp, dig, '', '');
      } else {
        openModalFilled(uid, '', '', '', 'Kho phone.zooinbox.com chưa có số cho UID này.');
      }
      return;
    }

    try {
      const map = await fetchPhoneMap(uid);
      const raw = map && map[uid] ? String(map[uid]) : '';
      phoneCache = { uid: uid, raw: raw || null };
      if (raw) {
        const disp = formatPhone84to09(raw);
        const dig = digitsOnly(raw);
        openModalFilled(uid, disp, dig, '', '');
      } else {
        openModalFilled(uid, '', '', '', 'Kho phone.zooinbox.com chưa có số cho UID này.');
      }
    } catch (err) {
      phoneCache = { uid: uid, raw: null };
      openModalFilled(uid, '', '', err && err.message ? String(err.message) : 'Lỗi tra SĐT.', '');
    }
  }

  function mountPhoneWrapAfterZoo(zoo) {
    let wrap = document.getElementById(WRAP_ID);
    if (wrap && wrap.previousElementSibling !== zoo) {
      try {
        wrap.remove();
      } catch (_) {
        /* ignore */
      }
      wrap = null;
    }
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id = WRAP_ID;
      wrap.className = 'zt-profile-phone-header-wrap';
      wrap.innerHTML =
        '<button type="button" class="zt-phbtn" aria-label="Xem số điện thoại Fairy House AutoData">' + PHONE_SVG + '</button>';
      zoo.insertAdjacentElement('afterend', wrap);
      const btn = wrap.querySelector('.zt-phbtn');
      if (btn) btn.addEventListener('click', onPhoneBtnClick, true);
    }
    return wrap;
  }

  async function prefetchPhoneForProfile(pathKey) {
    if (typeof ProfileResolver === 'undefined' || !ProfileResolver.getProfileIdFromCurrentPage) return;

    let uid = '';
    try {
      uid = await ProfileResolver.getProfileIdFromCurrentPage();
    } catch (_) {
      uid = '';
    }
    uid = uid ? String(uid).trim() : '';
    if (!uid || !/^\d{5,20}$/.test(uid)) {
      phoneCache = { uid: '', raw: null, pathKey: pathKey, fetched: false };
      return;
    }

    if (phoneCache && phoneCache.fetched && phoneCache.pathKey === pathKey && phoneCache.uid === uid) return;

    try {
      const map = await fetchPhoneMap(uid);
      const raw = map && map[uid] ? String(map[uid]) : '';
      phoneCache = { uid: uid, raw: raw || null, pathKey: pathKey, fetched: true };
    } catch (_) {
      phoneCache = { uid: uid, raw: null, pathKey: pathKey, fetched: true };
    }
  }

  async function ensureProfilePhoneButton() {
    const pathKey = String(location.pathname || '') + String(location.search || '');

    if (!shouldRunOnPersonalProfile()) {
      removePhoneUi();
      dbgPhone('bỏ qua (không phải profile cá nhân / là Fanpage)', { path: pathKey });
      lastPath = pathKey;
      return;
    }

    if (pathKey !== lastPath) {
      phoneCache = null;
      lastPath = pathKey;
      lastSkipProfileLogKey = '';
    }

    const mainEl = document.querySelector('main') || document.querySelector('[role="main"]');
    const zoo = document.getElementById(ZOO_BTN_ID);

    if (!mainEl || !zoo || zoo.getAttribute('data-zt-ctx-kind') !== 'profile' || !mainEl.contains(zoo)) {
      const w = document.getElementById(WRAP_ID);
      if (w) w.remove();
      closeModal();
      dbgPhone('chưa có nút Zoo Target profile trong main — không hiện nút điện thoại', { path: pathKey });
      return;
    }

    if (profilePhoneEnsureLock) return;
    profilePhoneEnsureLock = true;
    try {
      const pathBefore = pathKey;
      ensureStyles();
      await prefetchPhoneForProfile(pathBefore);

      const pathAfter = String(location.pathname || '') + String(location.search || '');
      if (pathBefore !== pathAfter) return;

      if (!hasDisplayablePhoneFromCache()) {
        const w = document.getElementById(WRAP_ID);
        if (w) w.remove();
        closeModal();
        dbgPhone('không có SĐT trong kho — không hiện icon điện thoại', { path: pathBefore });
        return;
      }

      const zoo2 = document.getElementById(ZOO_BTN_ID);
      if (!mainEl.contains(zoo2) || zoo2.getAttribute('data-zt-ctx-kind') !== 'profile') return;

      const wrap = mountPhoneWrapAfterZoo(zoo2);
      wrap.setAttribute('data-zt-phone-path', pathBefore);
    } finally {
      profilePhoneEnsureLock = false;
    }
  }

  function schedule() {
    if (scheduleTimer) clearTimeout(scheduleTimer);
    scheduleTimer = setTimeout(function () {
      scheduleTimer = null;
      void ensureProfilePhoneButton();
    }, 80);
  }

  function onMutations() {
    if (mobTimer) clearTimeout(mobTimer);
    mobTimer = setTimeout(function () {
      mobTimer = null;
      const p = String(location.pathname || '') + String(location.search || '');
      const w = document.getElementById(WRAP_ID);
      if (phoneCache && phoneCache.pathKey === p) {
        if (hasDisplayablePhoneFromCache()) {
          if (w && w.isConnected && w.getAttribute('data-zt-phone-path') === p && document.getElementById(ZOO_BTN_ID)) {
            return;
          }
        } else if (!w && phoneCache.fetched && phoneCache.uid && /^\d{5,20}$/.test(String(phoneCache.uid))) {
          return;
        }
      }
      schedule();
    }, DEBOUNCE_MS);
  }

  function attachMainObserver() {
    const main = document.querySelector('main') || document.querySelector('[role="main"]');
    if (!main) return false;
    try {
      if (ztCoverMainObs) {
        try {
          ztCoverMainObs.disconnect();
        } catch (_) {
          /* ignore */
        }
        ztCoverMainObs = null;
      }
      ztCoverMainObs = new MutationObserver(onMutations);
      ztCoverMainObs.observe(main, { childList: true, subtree: true });
      return true;
    } catch (_) {
      return false;
    }
  }

  const origPushHist2 = history.pushState;
  const origReplaceHist2 = history.replaceState;

  function ztStartCoverPhone() {
    history.pushState = function () {
      const r = origPushHist2.apply(this, arguments);
      queueMicrotask(schedule);
      return r;
    };
    history.replaceState = function () {
      const r = origReplaceHist2.apply(this, arguments);
      queueMicrotask(schedule);
      return r;
    };
    window.addEventListener('popstate', schedule);

    if (attachMainObserver()) {
      /* ok */
    } else {
      document.addEventListener(
        'DOMContentLoaded',
        function () {
          attachMainObserver();
          schedule();
        },
        { once: true }
      );
    }

    schedule();
    if (ztCoverPollTimer) clearInterval(ztCoverPollTimer);
    ztCoverPollTimer = setInterval(function () {
      const p = String(location.pathname || '') + String(location.search || '');
      const w = document.getElementById(WRAP_ID);
      if (phoneCache && phoneCache.pathKey === p) {
        if (hasDisplayablePhoneFromCache()) {
          if (w && w.isConnected && w.getAttribute('data-zt-phone-path') === p && document.getElementById(ZOO_BTN_ID)) {
            return;
          }
        } else if (!w && phoneCache.fetched && phoneCache.uid && /^\d{5,20}$/.test(String(phoneCache.uid))) {
          return;
        }
      }
      if (!shouldRunOnPersonalProfile()) return;
      schedule();
    }, 4500);
  }

  function ztStopCoverPhone() {
    history.pushState = origPushHist2;
    history.replaceState = origReplaceHist2;
    window.removeEventListener('popstate', schedule);
    if (ztCoverPollTimer) {
      clearInterval(ztCoverPollTimer);
      ztCoverPollTimer = null;
    }
    if (ztCoverMainObs) {
      try {
        ztCoverMainObs.disconnect();
      } catch (_) {
        /* ignore */
      }
      ztCoverMainObs = null;
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
      const w = document.getElementById(WRAP_ID);
      if (w && w.parentNode) w.parentNode.removeChild(w);
    } catch (_) {
      /* ignore */
    }
    try {
      const m = document.getElementById(MODAL_ID);
      if (m && m.parentNode) m.parentNode.removeChild(m);
    } catch (_) {
      /* ignore */
    }
  }

  if (window.ZTServerSession && typeof window.ZTServerSession.whenAuthed === 'function') {
    window.ZTServerSession.whenAuthed(ztStartCoverPhone, ztStopCoverPhone);
  } else {
    ztStartCoverPhone();
  }

  try {
    window.ZTCoverPhoneDebug = {
      apply: ensureProfilePhoneButton,
      findZoo: function () {
        return document.getElementById(ZOO_BTN_ID);
      },
      shouldRun: shouldRunOnPersonalProfile,
      isFanpage: isFanpageLikePageLocal,
      isProfile: isProfileLikePageLocal
    };
    console.info('[ZT Phone] Debug: localStorage.setItem("ztCoverDebug","1") — ZTCoverPhoneDebug.apply()');
  } catch (_) {
    /* ignore */
  }
})();
