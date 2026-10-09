(function () {
  'use strict';

  let overlay = null;
  let modalIframe = null;
  let modalInitCleanup = null;
  let modalPhase = 'config';

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

  function injectLsdCapture() {
    if (document.getElementById('zt-lsd-capture')) return;
    const script = document.createElement('script');
    script.id = 'zt-lsd-capture';
    script.src = chrome.runtime.getURL('src/content/lsd-capture.js');
    (document.head || document.documentElement).appendChild(script);
    script.onload = function () {
      script.remove();
    };
  }

  async function runZtBridgeAction(action, payload) {
    const state = await chrome.runtime.sendMessage({ action: 'ZT_SERVER_SESSION_GET' });
    if (!state?.authed) throw new Error('License chưa sẵn sàng hoặc đã bị khóa.');
    const p = payload || {};
    if (!p || typeof p !== 'object' || Array.isArray(p)) throw new Error('Payload không hợp lệ');
    if (action === 'fetchMembers') {
      return await PushGroupAPI.fetchGroupMembersPage(p.groupId, p.cursor || null);
    }
    if (action === 'fetchProfileTimeline') {
      return await PushGroupAPI.fetchProfileTimelinePage(p.profileId, p.cursor || null, p.count || 10);
    }
    if (action === 'fetchPostReactorsPage') {
      return await PushGroupAPI.fetchPostReactorsPage(
        p.profileOwnerId,
        p.postId,
        p.feedbackIdB64 || null,
        p.cursor || null,
        p.feedbackFidCarry || null,
        p.permalink || null
      );
    }
    if (action === 'fetchPostCommentsPage') {
      return await PushGroupAPI.fetchPostCommentsPage(
        p.profileOwnerId,
        p.postId,
        p.feedbackIdB64 || null,
        p.cursor || null,
        p.feedbackFidCarry || null,
        p.permalink || null
      );
    }
    if (action === 'sendFriendInvite') {
      const quota = await chrome.runtime.sendMessage({ action: 'ZT_EXTENSION_FRIEND_INVITE_QUOTA', quotaAction: 'reserve', requestId: p.requestId || crypto.randomUUID() });
      if (!quota?.ok || !quota.data?.allowed) throw new Error(quota?.error || 'Đã đạt giới hạn kết bạn.');
      return await PushGroupAPI.sendFriendInvite(p.targetUid, {
        friendingChannel: p.friendingChannel || 'PROFILE_BUTTON'
      });
    }
    if (action === 'getActorUid') {
      const auth = PushGroupAuth.getAuth();
      const actorUid = auth && auth.userId ? String(auth.userId).replace(/\D/g, '') : '';
      return { actorUid };
    }
    if (action === 'getToken') {
      const r = await chrome.runtime.sendMessage({ action: 'getAdsAccessToken' });
      if (!r?.ok) throw new Error(r?.error || 'Không lấy được token');
      return { token: r.token, kind: r.kind };
    }
    if (action === 'enrich') {
      const r = await chrome.runtime.sendMessage({
        action: 'enrichBatch',
        uids: p.uids,
        token: p.token
      });
      if (!r?.ok) throw new Error(r?.error || 'Lỗi enrich');
      return r.data;
    }
    if (action === 'warmLsd') {
      if (typeof PushGroupAuth.ensureLsdAsync === 'function') {
        await PushGroupAuth.ensureLsdAsync();
      }
      return { warmed: true };
    }
    if (action === 'fetchFanpagePostsPage') {
      const pageId = String(p.pageId || '').trim();
      const nextUrl = p.nextUrl != null && String(p.nextUrl).length ? String(p.nextUrl) : '';
      return await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
          { action: 'fanpageFetchPostsPage', pageId, nextUrl },
          (resp) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
              return;
            }
            if (resp && resp.ok) resolve(resp);
            else reject(new Error(resp?.error || 'fanpageFetchPostsPage lỗi'));
          }
        );
      });
    }
    if (action === 'fetchGroupName') {
      const gid = String(p.groupId || '').trim();
      const token = String(p.token || '').trim();
      if (!gid || !token) throw new Error('Thiếu groupId hoặc token');
      return await new Promise((resolve, reject) => {
        try {
          chrome.runtime.sendMessage(
            { action: 'graphGetNameById', id: gid, token },
            (resp) => {
              if (chrome.runtime.lastError) {
                resolve({ name: '', pictureUrl: '' });
                return;
              }
              if (resp && resp.ok) {
                resolve({
                  name: resp.name ? String(resp.name) : '',
                  pictureUrl: resp.pictureUrl ? String(resp.pictureUrl) : ''
                });
              } else {
                resolve({ name: '', pictureUrl: '' });
              }
            }
          );
        } catch (_) {
          resolve({ name: '', pictureUrl: '' });
        }
      });
    }
    if (action === 'resolveProfileVanity') {
      const v = String(p.vanity || '').trim();
      if (!v) throw new Error('Thiếu vanity');
      if (typeof ProfileResolver.resolveVanity !== 'function') {
        throw new Error('ProfileResolver.resolveVanity không khả dụng');
      }
      const id = await ProfileResolver.resolveVanity(v);
      return { profileId: id ? String(id) : '' };
    }
    if (action === 'resolveFanpageContext') {
      if (typeof FanpageResolver === 'undefined' || !FanpageResolver.getPageIdCandidatesFromCurrentPage) {
        return { pageIdCandidates: [], name: '', picture: '' };
      }
      const r = await FanpageResolver.getPageIdCandidatesFromCurrentPage();
      return {
        pageIdCandidates: Array.isArray(r?.pageIdCandidates) ? r.pageIdCandidates.map(String) : [],
        name: r?.name ? String(r.name) : '',
        picture: r?.picture ? String(r.picture) : ''
      };
    }
    if (action === 'resolveGroupContext') {
      let gid = '';
      try {
        if (typeof window.__ztGetGroupIdFromPage === 'function') {
          gid = String(window.__ztGetGroupIdFromPage() || '').trim();
        }
      } catch (_) {
        gid = '';
      }
      return { groupId: gid };
    }
    if (action === 'fetchProfileLocation') {
      const ZT = window.ZTProfileLocation;
      if (!ZT) throw new Error('Thiếu module vị trí');

      const uidDigits = String(p.uid || '').replace(/\D/g, '');
      let raw = '';
      let city = '';
      let source = '';
      /** @type {number|null} */
      let birthYear = null;
      /** @type {number|null} */
      let age = null;

      function sleepMs(ms) {
        return new Promise(function (resolve) {
          setTimeout(resolve, ms);
        });
      }

      if (uidDigits.length >= 8 && typeof PushGroupAPI.fetchProfileCurrentCityDirectory === 'function') {
        try {
          const dirLabel = await PushGroupAPI.fetchProfileCurrentCityDirectory(uidDigits);
          raw = dirLabel;
          city = ZT.normalizeCity(dirLabel);
          if (city) {
            source = 'graphql';
          }
        } catch (err) {
          const em = err && err.message ? String(err.message) : '';
          if (/RATE_LIMIT/i.test(em)) {
            throw new Error('RATE_LIMIT');
          }
          console.warn('[ZT] GraphQL CURRENT_CITY lỗi', uidDigits, err?.message || err);
        }
      }

      if (uidDigits.length >= 8 && typeof PushGroupAPI.fetchProfileBirthdayDirectory === 'function') {
        await sleepMs(520);
        try {
          const bdRaw = await PushGroupAPI.fetchProfileBirthdayDirectory(uidDigits);
          const y = PushGroupAPI.parseBirthYearFromDisplay(bdRaw);
          if (y != null) {
            birthYear = y;
            age = PushGroupAPI.computeAgeFromBirthYear(y);
          }
        } catch (err) {
          const em = err && err.message ? String(err.message) : '';
          if (/RATE_LIMIT/i.test(em)) {
            console.warn('[ZT] GraphQL BIRTHDAY rate limit — giữ khu vực, bỏ qua tuổi UID', uidDigits);
          } else {
            console.warn('[ZT] GraphQL BIRTHDAY lỗi', uidDigits, err?.message || err);
          }
        }
      }

      function normalizeFbUrl(u) {
        let s = String(u || '').trim();
        if (!s) return '';
        if (s.startsWith('//')) s = 'https:' + s;
        if (s.startsWith('/')) s = getFacebookOrigin() + s;
        return s;
      }

      function toAboutUrls(u) {
        const out = [];
        try {
          const x = new URL(u);
          if (!/facebook\.com$/i.test(x.hostname.replace(/^www\./, ''))) return out;
          if (x.pathname.includes('/about')) return out;
          const origin = getFacebookOrigin();
          if (x.pathname.includes('profile.php')) {
            const id = x.searchParams.get('id');
            if (id) {
              out.push(origin + '/profile.php?id=' + encodeURIComponent(id) + '&sk=about');
            }
            return out;
          }
          const path = x.pathname.replace(/\/+$/, '');
          if (!path) return out;
          out.push(origin + path + '/about' + x.search);
          const sp = new URLSearchParams(x.search.replace(/^\?/, ''));
          if (!sp.has('sk')) {
            const sep = x.search && x.search.length ? '&' : '?';
            out.push(origin + path + x.search + sep + 'sk=about');
          }
        } catch (_) {
          /* ignore */
        }
        return out;
      }

      function uniqueUrls(list) {
        const seen = new Set();
        const r = [];
        for (const u of list) {
          if (!u || seen.has(u)) continue;
          seen.add(u);
          r.push(u);
        }
        return r;
      }

      async function fetchHtml(u) {
        const resp = await fetch(u, {
          method: 'GET',
          credentials: 'include',
          redirect: 'follow',
          headers: {
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate'
          }
        });
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        const t = await resp.text();
        return t.length > 1200000 ? t.slice(0, 1200000) : t;
      }

      if (!city) {
        let url = normalizeFbUrl(p.url);
        if (!url || !/^https:\/\/([a-z0-9.-]+\.)?facebook\.com\//i.test(url)) {
          throw new Error('URL không hợp lệ');
        }

        const idAbout =
          uidDigits.length >= 8
            ? getFacebookOrigin() + '/profile.php?id=' + encodeURIComponent(uidDigits) + '&sk=about'
            : '';
        const tryUrls = uniqueUrls([idAbout, url, ...toAboutUrls(url)].filter(Boolean));

        for (const uTry of tryUrls) {
          if (!uTry) continue;
          await sleepMs(220);
          try {
            const slice = await fetchHtml(uTry);
            raw = ZT.extractLivingLocation(slice);
            city = ZT.normalizeCity(raw);
            if (city) {
              source = 'html:' + uTry;
              break;
            }
          } catch (err) {
            console.warn('[ZT] Fetch HTML lỗi', uTry, err?.message || err);
          }
        }
      }

      return {
        city: city || '',
        rawSnippet: raw ? String(raw).slice(0, 120) : '',
        source: source || 'none',
        birthYear: birthYear != null ? birthYear : null,
        age: age != null ? age : null
      };
    }
    if (action === 'chromeStorageSet') {
      return await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ action: 'CHROME_STORAGE_SET', key: p.key, value: p.value }, (resp) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          if (resp && resp.ok) resolve({ ok: true });
          else reject(new Error(resp?.error || 'CHROME_STORAGE_SET error'));
        });
      });
    }
    if (action === 'chromeStorageGet') {
      return await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ action: 'CHROME_STORAGE_GET', key: p.key }, (resp) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          if (resp && resp.ok) resolve({ value: resp.value });
          else reject(new Error(resp?.error || 'CHROME_STORAGE_GET error'));
        });
      });
    }
    throw new Error('Unknown action: ' + action);
  }

  /** Bridge iframe modal (postMessage) — cùng tab Facebook, cookie GraphQL đầy đủ. */
  function handleIframeMessage(event) {
    if (event.source !== modalIframe?.contentWindow || event.origin !== chrome.runtime.getURL('').replace(/\/$/, '')) return;
    if (event.data?.source === 'zt-modal' && event.data?.type === 'ZT_DEBUG' && typeof event.data.line === 'string') {
      console.info(event.data.line);
      return;
    }
    if (event.data?.source === 'zt-modal' && event.data?.type === 'CLOSE_CONFIRMED') {
      if (event.source === modalIframe?.contentWindow) closeModal();
      return;
    }

    if (event.data?.source !== 'zt-modal' || !event.data?.requestId) return;
    if (event.source !== modalIframe?.contentWindow) return;

    const { requestId, action, payload } = event.data;

    (async () => {
      try {
        const data = await runZtBridgeAction(action, payload);
        event.source.postMessage({ source: 'zt-parent', requestId, ok: true, data }, event.origin);
      } catch (err) {
        event.source.postMessage(
          {
            source: 'zt-parent',
            requestId,
            ok: false,
            error: err.message || String(err)
          },
          event.origin
        );
      }
    })();
  }

  function ztModalBridgeChromeListener(msg, _sender, sendResponse) {
    if (msg?.type !== 'ZT_BRIDGE' || _sender.id !== chrome.runtime.id || !_sender.url?.startsWith(chrome.runtime.getURL(''))) return false;
    (async () => {
      try {
        const data = await runZtBridgeAction(msg.action, msg.payload);
        sendResponse({ ok: true, data });
      } catch (err) {
        sendResponse({ ok: false, error: err.message || String(err) });
      }
    })();
    return true;
  }

  function ztModalLayoutMessage(e) {
    if (e.data?.source !== 'zt-modal' || e.origin !== chrome.runtime.getURL('').replace(/\/$/, '')) return;
    if (!modalIframe || e.source !== modalIframe.contentWindow) return;
    if (e.data.type === 'PHASE') {
      modalPhase = e.data.phase === 'scan' ? 'scan' : 'config';
      modalIframe.style.cssText =
        'width:min(1440px,96vw);max-width:1440px;height:92vh;min-height:560px;border:none;border-radius:20px;' +
        'box-shadow:0 25px 80px rgba(0,0,0,0.3);background:#ffffff;overflow:hidden;';
      return;
    }
    if (e.data.type === 'IFRAME_HEIGHT') {
      // Workstation layout maintains a solid, non-jumping 92vh viewport
      return;
    }
  }

  function closeModal() {
    if (typeof modalInitCleanup === 'function') {
      modalInitCleanup();
      modalInitCleanup = null;
    }
    if (overlay) overlay.remove();
    overlay = null;
    modalIframe = null;
    document.removeEventListener('keydown', onEsc);
  }

  function onEsc(e) {
    if (e.key === 'Escape' && modalIframe?.contentWindow) {
      modalIframe.contentWindow.postMessage({ source: 'zt-parent', type: 'OVERLAY_CLICK' }, '*');
    }
  }

  function guessGroupTitleFromPage() {
    try {
      const t = document.title || '';
      let s = t
        .replace(/\s*[|\u007c]\s*Facebook.*$/i, '')
        .replace(/\s*-\s*Facebook.*$/i, '')
        .replace(/\s*·\s*Facebook.*$/i, '')
        .trim();
      if (s.length > 1 && s.length < 200 && !/^Facebook$/i.test(s)) return s;
    } catch (_) {
      /* ignore */
    }
    const h =
      document.querySelector('main h1[dir="auto"]') ||
      document.querySelector('[role="main"] h1') ||
      document.querySelector('main h1');
    if (h && h.textContent) {
      const s = h.textContent.trim();
      if (s.length > 0 && s.length < 200) return s;
    }
    return '';
  }

  function emitModalReady(kind, profileId, groupId, extra) {
    const ex = extra || {};
    let detail;
    if (kind === 'profile') {
      detail = { kind: 'profile', profileId: String(profileId || '') };
    } else if (kind === 'fanpage') {
      detail = {
        kind: 'fanpage',
        fanpageKey: String(ex.fanpageKey || '')
      };
    } else {
      detail = { kind: 'group', groupId: String(groupId || '') };
    }
    document.dispatchEvent(
      new CustomEvent('zoo-target-modal-ready', {
        bubbles: true,
        detail: detail
      })
    );
  }

  function openModal(opts) {
    if (overlay) closeModal();
    modalPhase = 'config';

    const kind =
      opts && opts.kind === 'fanpage' ? 'fanpage' : opts && opts.kind === 'profile' ? 'profile' : 'group';
    const groupId = opts && opts.groupId ? String(opts.groupId) : '';
    const profileId = opts && opts.profileId ? String(opts.profileId) : '';
    const vanity = opts && opts.vanity ? String(opts.vanity) : '';
    const pageIdCandidates = opts && Array.isArray(opts.pageIdCandidates) ? opts.pageIdCandidates : [];
    const fanpageName = opts && opts.fanpageName ? String(opts.fanpageName) : '';
    const fanpagePicture = opts && opts.fanpagePicture ? String(opts.fanpagePicture) : '';
    const fanpageUrl = opts && opts.fanpageUrl ? String(opts.fanpageUrl) : '';
    const fanpageKey = opts && opts.fanpageKey ? String(opts.fanpageKey) : '';
    const fanpageVanityOpt = opts && opts.fanpageVanity ? String(opts.fanpageVanity) : '';

    overlay = document.createElement('div');
    overlay.id = 'zt-overlay';
    overlay.dataset.ztKind = kind === 'fanpage' ? 'fanpage' : kind === 'profile' ? 'profile' : 'group';
    overlay.style.cssText =
      'position:fixed;inset:0;z-index:2147483646;display:flex;align-items:center;justify-content:center;' +
      'background:rgba(15,23,42,0.45);backdrop-filter:blur(4px);';

    modalIframe = document.createElement('iframe');
    modalIframe.src = chrome.runtime.getURL('src/ui/modal.html');
    modalIframe.style.cssText =
      'width:min(1440px,96vw);max-width:1440px;height:92vh;min-height:560px;border:none;border-radius:20px;' +
      'box-shadow:0 25px 80px rgba(0,0,0,0.3);background:#ffffff;overflow:hidden;';
    modalIframe.setAttribute('title', 'Fairy House AutoData');

    overlay.appendChild(modalIframe);
    document.body.appendChild(overlay);

    document.addEventListener('keydown', onEsc);

    let initSent = false;
    let fallbackTimer = null;

    function sendModalInit() {
      if (initSent || !modalIframe?.contentWindow) return;
      initSent = true;
      if (fallbackTimer) {
        clearTimeout(fallbackTimer);
        fallbackTimer = null;
      }
      if (kind === 'profile') {
        console.info(
          '[ZT] INIT iframe · profileId (UID mục tiêu)=',
          profileId || '(rỗng)',
          '| vanity=',
          vanity || '(không)',
          '| URL tab=',
          typeof location !== 'undefined' ? location.href.split('?')[0] : ''
        );
      }
      if (kind === 'fanpage') {
        console.info('[ZT] INIT iframe · fanpage · candidates=', pageIdCandidates.length, fanpageUrl || '');
      }
      modalIframe.contentWindow.postMessage(
        {
          source: 'zt-parent',
          type: 'INIT',
          scanMode: kind,
          groupId: kind === 'group' ? String(groupId) : '',
          profileId: kind === 'profile' ? String(profileId) : '',
          vanity: kind === 'profile' ? String(vanity) : '',
          groupName: kind === 'profile' || kind === 'fanpage' ? '' : guessGroupTitleFromPage(),
          pageIdCandidates: kind === 'fanpage' ? pageIdCandidates : [],
          fanpageName: kind === 'fanpage' ? fanpageName : '',
          fanpagePicture: kind === 'fanpage' ? fanpagePicture : '',
          fanpageUrl: kind === 'fanpage' ? fanpageUrl : '',
          fanpageKey: kind === 'fanpage' ? fanpageKey : '',
          fanpageVanity: kind === 'fanpage' ? fanpageVanityOpt : '',
          sourceTabUrl:
            typeof location !== 'undefined' && location.href
              ? String(location.href).split('#')[0]
              : ''
        },
        '*'
      );
      emitModalReady(kind, profileId, groupId, { fanpageKey: fanpageKey });
    }

    function onModalReadyMsg(ev) {
      if (ev.source !== modalIframe?.contentWindow) return;
      if (ev.data?.source !== 'zt-modal' || ev.data?.type !== 'READY') return;
      window.removeEventListener('message', onModalReadyMsg);
      sendModalInit();
    }
    window.addEventListener('message', onModalReadyMsg);

    fallbackTimer = setTimeout(function () {
      fallbackTimer = null;
      window.removeEventListener('message', onModalReadyMsg);
      sendModalInit();
    }, 12000);

    modalInitCleanup = function () {
      if (fallbackTimer) {
        clearTimeout(fallbackTimer);
        fallbackTimer = null;
      }
      window.removeEventListener('message', onModalReadyMsg);
    };
  }

  function onZooTargetOpen(e) {
    const d = e.detail || {};
    if (d.kind === 'fanpage') {
      (async function () {
        let candidates = [];
        let name = '';
        let picture = '';
        try {
          if (typeof FanpageResolver !== 'undefined' && FanpageResolver.getPageIdCandidatesFromCurrentPage) {
            const r = await FanpageResolver.getPageIdCandidatesFromCurrentPage();
            candidates = Array.isArray(r.pageIdCandidates) ? r.pageIdCandidates : [];
            name = r.name ? String(r.name) : '';
            picture = r.picture ? String(r.picture) : '';
          }
        } catch (err) {
          console.warn('[ZT] Fanpage resolve', err);
        }
        openModal({
          kind: 'fanpage',
          pageIdCandidates: candidates,
          fanpageName: name,
          fanpagePicture: picture,
          fanpageVanity: d.vanity ? String(d.vanity) : '',
          fanpageUrl: d.fanpageUrl ? String(d.fanpageUrl) : String(location.href || '').split('#')[0],
          fanpageKey: d.fanpageKey ? String(d.fanpageKey) : ''
        });
      })();
      return;
    }
    const kind = d.kind === 'profile' ? 'profile' : 'group';
    const profileId = d.profileId ? String(d.profileId) : '';
    let groupId = d.groupId ? String(d.groupId) : '';
    const vanity = d.vanity ? String(d.vanity) : '';
    if (kind === 'group' && !groupId && typeof window.__ztGetGroupIdFromPage === 'function') {
      try {
        groupId = String(window.__ztGetGroupIdFromPage() || '').trim();
      } catch (_) {
        groupId = '';
      }
    }
    if (kind === 'group' && !groupId) {
      emitModalReady('group', '', '');
      return;
    }
    openModal({ kind, profileId, groupId, vanity });
  }

  function startZtModalBridge() {
    if (window.__ztModalBridgeOn) return;
    window.__ztModalBridgeOn = true;
    injectLsdCapture();
    window.addEventListener('message', handleIframeMessage);
    window.addEventListener('message', ztModalLayoutMessage);
    chrome.runtime.onMessage.addListener(ztModalBridgeChromeListener);
    document.addEventListener('zoo-target-open', onZooTargetOpen);
  }

  function stopZtModalBridge() {
    if (!window.__ztModalBridgeOn) return;
    window.__ztModalBridgeOn = false;
    window.removeEventListener('message', handleIframeMessage);
    window.removeEventListener('message', ztModalLayoutMessage);
    chrome.runtime.onMessage.removeListener(ztModalBridgeChromeListener);
    document.removeEventListener('zoo-target-open', onZooTargetOpen);
    closeModal();
  }

  if (window.ZTServerSession && typeof window.ZTServerSession.whenAuthed === 'function') {
    window.ZTServerSession.whenAuthed(startZtModalBridge, stopZtModalBridge);
  } else {
    startZtModalBridge();
  }
})();
