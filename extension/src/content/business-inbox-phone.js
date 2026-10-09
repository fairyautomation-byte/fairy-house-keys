(function () {
  'use strict';

  if (typeof location === 'undefined' || location.hostname !== 'business.facebook.com') return;
  if (!/\/inbox\//i.test(String(location.pathname || ''))) return;

  const LINK_ID = 'zt-biz-inbox-phone-css';
  const ROOT_ID = 'zt-biz-inbox-phone-root';
  const DEBOUNCE_MS = 400;
  const LABELS = ['Chi tiết liên hệ', 'Contact details'];

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
  /** @type {{ uid: string, raw: string|null }|null} */
  let phoneLookupCache = null;
  let inflightUid = '';

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

  function getSelectedUid() {
    try {
      const id = new URLSearchParams(location.search).get('selected_item_id');
      return id && /^\d{5,20}$/.test(id) ? id : '';
    } catch (_) {
      return '';
    }
  }

  function ensureStyles() {
    if (document.getElementById(LINK_ID)) return;
    const link = document.createElement('link');
    link.id = LINK_ID;
    link.rel = 'stylesheet';
    link.href = chrome.runtime.getURL('src/ui/business-inbox-phone.css');
    (document.head || document.documentElement).appendChild(link);
  }

  function findHeadingElement() {
    const nodes = document.querySelectorAll('span,div,h2,h3,h4,h5,strong');
    for (let i = 0; i < nodes.length; i++) {
      const el = nodes[i];
      const t = (el.textContent || '').trim();
      for (let j = 0; j < LABELS.length; j++) {
        if (t === LABELS[j]) return el;
      }
    }
    return null;
  }

  function mountRootAfter(headingEl) {
    let root = document.getElementById(ROOT_ID);
    if (!root) {
      root = document.createElement('div');
      root.id = ROOT_ID;
    }
    const parent = headingEl.parentElement;
    if (!parent) return null;
    if (root.parentNode !== parent || root.previousElementSibling !== headingEl) {
      if (root.parentNode) root.parentNode.removeChild(root);
      if (headingEl.nextSibling) {
        parent.insertBefore(root, headingEl.nextSibling);
      } else {
        parent.appendChild(root);
      }
    }
    return root;
  }

  function setLoading(root) {
    root.innerHTML =
      '<div class="zt-biz-card zt-biz-card--muted">' +
      '<p class="zt-biz-card-label">Fairy House AutoData</p>' +
      '<p class="zt-biz-muted-text">Đang tra SĐT…</p>' +
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

  function applyUid(uid) {
    ensureStyles();
    const heading = findHeadingElement();
    if (!heading) {
      return;
    }
    const root = mountRootAfter(heading);
    if (!root) return;

    if (!uid) {
      root.innerHTML = '';
      phoneLookupCache = null;
      inflightUid = '';
      return;
    }

    if (phoneLookupCache && phoneLookupCache.uid === uid) {
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

    if (inflightUid === uid) return;
    inflightUid = uid;
    setLoading(root);

    const requestUid = uid;
    fetchPhoneMap(requestUid)
      .then(function (map) {
        if (getSelectedUid() !== requestUid) {
          inflightUid = '';
          return;
        }
        inflightUid = '';
        const raw = map && map[requestUid] ? String(map[requestUid]) : '';
        phoneLookupCache = { uid: requestUid, raw: raw || null };
        if (raw) {
          const disp = formatPhone84to09(raw);
          const dig = digitsOnly(raw);
          setOk(root, disp, dig);
        } else {
          setError(root, 'không tìm thấy số');
        }
      })
      .catch(function (err) {
        if (getSelectedUid() !== requestUid) {
          inflightUid = '';
          return;
        }
        inflightUid = '';
        console.warn('[ZT] Business Inbox tra SĐT', err && err.message ? err.message : err);
        phoneLookupCache = { uid: requestUid, raw: null };
        setError(root, 'không tìm thấy số');
      });
  }

  function schedule() {
    if (scheduleTimer) clearTimeout(scheduleTimer);
    scheduleTimer = setTimeout(function () {
      scheduleTimer = null;
      const uid = getSelectedUid();
      if (phoneLookupCache && uid !== phoneLookupCache.uid) {
        phoneLookupCache = null;
      }
      applyUid(uid);
    }, 80);
  }

  function onMutations() {
    if (mobTimer) clearTimeout(mobTimer);
    mobTimer = setTimeout(function () {
      mobTimer = null;
      schedule();
    }, DEBOUNCE_MS);
  }

  const origPushHist0 = history.pushState;
  const origReplaceHist0 = history.replaceState;
  let bizInboxObs = null;

  function ztStartBizInboxPhone() {
    history.pushState = function () {
      const r = origPushHist0.apply(this, arguments);
      queueMicrotask(schedule);
      return r;
    };
    history.replaceState = function () {
      const r = origReplaceHist0.apply(this, arguments);
      queueMicrotask(schedule);
      return r;
    };
    window.addEventListener('popstate', schedule);

    bizInboxObs = new MutationObserver(onMutations);
    if (document.body) {
      bizInboxObs.observe(document.body, { childList: true, subtree: true });
    } else {
      document.addEventListener(
        'DOMContentLoaded',
        function () {
          if (document.body) bizInboxObs.observe(document.body, { childList: true, subtree: true });
          schedule();
        },
        { once: true }
      );
    }

    schedule();
  }

  function ztStopBizInboxPhone() {
    history.pushState = origPushHist0;
    history.replaceState = origReplaceHist0;
    window.removeEventListener('popstate', schedule);
    if (bizInboxObs) {
      try {
        bizInboxObs.disconnect();
      } catch (_) {
        /* ignore */
      }
      bizInboxObs = null;
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
    window.ZTServerSession.whenAuthed(ztStartBizInboxPhone, ztStopBizInboxPhone);
  } else {
    ztStartBizInboxPhone();
  }
})();
