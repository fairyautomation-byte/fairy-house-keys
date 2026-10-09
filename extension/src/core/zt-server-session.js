/* global chrome */
/**
 * Phiên đăng nhập Zoo Target server (Sanctum) — dùng chung cho content scripts.
 * Token lưu tại chrome.storage.local; đồng bộ qua chrome.storage.onChanged.
 */
(function () {
  'use strict';

  var TOKEN_KEY = 'ztServerToken';
  var USER_KEY = 'ztServerUser';
  var SAVED_AT_KEY = 'ztServerTokenSavedAt';

  function hasToken(obj) {
    var t = obj && obj[TOKEN_KEY];
    return !!(t && String(t).trim());
  }

  function getVietnamToday() {
    try {
      return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
    } catch (_) {
      return new Date().toISOString().slice(0, 10);
    }
  }

  function getSessionFromStorage(cb) {
    if (typeof chrome === 'undefined' || !chrome.runtime) { cb({ authed: false, hasQuota: false }); return; }
    chrome.runtime.sendMessage({ action: 'ZT_SERVER_SESSION_GET' }, function (state) {
      if (chrome.runtime.lastError || !state) { cb({ authed: false, hasQuota: false }); return; }
      cb({ authed: !!state.authed, hasQuota: !!state.hasQuota, token: null, user: null, details: state.details || null });
    });
  }

  /**
   * Gọi callback ngay với trạng thái hiện tại, sau đó mỗi khi token/user đổi.
   * @param {function({authed:boolean,token:string,user:*,savedAt:*}):void} cb
   */
  function subscribe(cb) {
    getSessionFromStorage(cb);
    chrome.runtime.onMessage.addListener(function(msg) { if (msg.type === "ZT_SESSION_CHANGED") getSessionFromStorage(cb); });
    try {
      chrome.storage.onChanged.addListener(function (changes, area) {
        if (area !== 'local') return;
        if (!changes[TOKEN_KEY] && !changes[USER_KEY] && !changes[SAVED_AT_KEY] && !changes['ztServerLicenseDetails']) return;
        getSessionFromStorage(cb);
      });
    } catch (_) {
      /* ignore */
    }
  }

  /**
   * Chỉ chạy fn khi đã có token; khi mất token gọi onRevoke (nếu có).
   * @param {function():void} fn
   * @param {function():void} [onRevoke]
   */
  function whenAuthed(fn, onRevoke) {
    var started = false;
    subscribe(function (s) {
      // Chỉ revoke quyền gọi bridge khi mất token (authed = false). 
      // Hết quota (hasQuota = false) thì vẫn giữ bridge để modal đang mở không bị văng.
      if (s.authed) {
        if (!started) {
          started = true;
          try {
            fn();
          } catch (e) {
            console.warn('[ZT] whenAuthed', e);
          }
        }
      } else {
        if (started) {
          started = false;
          if (typeof onRevoke === 'function') {
            try {
              onRevoke();
            } catch (e2) {
              console.warn('[ZT] onRevoke', e2);
            }
          }
        }
      }
    });
  }

  window.ZTServerSession = {
    TOKEN_KEY: TOKEN_KEY,
    USER_KEY: USER_KEY,
    SAVED_AT_KEY: SAVED_AT_KEY,
    getSessionFromStorage: getSessionFromStorage,
    subscribe: subscribe,
    whenAuthed: whenAuthed,
    hasToken: hasToken
  };
})();
