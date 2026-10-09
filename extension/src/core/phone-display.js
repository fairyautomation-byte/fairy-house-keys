/* global chrome */
/** Phone display follows active license entitlements; current plans do not bind Facebook nick. */
(function () {
  'use strict';

  function digitsOnly(s) {
    return String(s || '').replace(/\D/g, '');
  }

  /**
   * Mask kiểu 090******2: 3 số đầu + * phần giữa + 1 số cuối.
   * @param {string} phone
   * @returns {string}
   */
  function maskDisplay(phone) {
    const value = phone == null ? '' : String(phone).trim();
    return value.length > 4 ? value.slice(0,3) + '*'.repeat(value.length - 4) + value.slice(-1) : '*'.repeat(value.length);
  }

  function readCurrentFbUidFromCookie() {
    try {
      var raw = String(document.cookie || '');
      var m = raw.match(/(?:^|;\s*)c_user=(\d{5,20})(?:;|$)/);
      return m ? m[1] : '';
    } catch (_) {
      return '';
    }
  }

  /**
   * Tính mask theo session user + UID hiện tại.
   * - FREE: luôn mask.
   * - VIP, UID khớp vip_locked_facebook_uid: full số.
   * - VIP, UID khác hoặc chưa có UID: mask.
   * - Fallback (chưa có session): suy theo phone_display_mode legacy.
   */
  function computePhoneMaskFromSession(user, currentFbUid) {
    return !user || user.license_status !== 'ACTIVE';
  }

  function syncMaskFlag() {
    window.__ztPhoneMask = true;
    if (chrome.runtime) chrome.runtime.sendMessage({ action: 'ZT_SERVER_SESSION_GET' }, state => { window.__ztPhoneMask = !state?.authed || !state.details?.entitlements?.includes('phone'); });
    window.__ztCurrentFbUid = readCurrentFbUidFromCookie();
  }

  window.ZTPhoneDisplay = {
    digitsOnly: digitsOnly,
    maskDisplay: maskDisplay,
    syncMaskFlag: syncMaskFlag,
    computePhoneMaskFromSession: computePhoneMaskFromSession,
    readCurrentFbUidFromCookie: readCurrentFbUidFromCookie
  };

  syncMaskFlag();
  try {
    chrome.storage.onChanged.addListener(function (changes, area) {
      if (area === 'local' && changes.ztServerUser) syncMaskFlag();
    });
  } catch (_) {
    /* ignore */
  }

  chrome.runtime.onMessage.addListener(function(msg) { if (msg.type === 'ZT_SESSION_CHANGED') syncMaskFlag(); });

  // Re-compute định kỳ để bắt thay đổi UID khi user đổi tab/đổi nick FB
  // mà không trigger Storage change (cookie c_user đổi).
  try {
    var lastUid = readCurrentFbUidFromCookie();
    setInterval(function () {
      var nowUid = readCurrentFbUidFromCookie();
      if (nowUid !== lastUid) {
        lastUid = nowUid;
        syncMaskFlag();
      }
    }, 4000);
  } catch (_) {
    /* ignore */
  }
})();
