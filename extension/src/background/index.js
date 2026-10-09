const BRIDGE_ACTIONS = new Set(["fetchMembers", "fetchProfileTimeline", "fetchPostReactorsPage", "fetchPostCommentsPage", "sendFriendInvite", "getActorUid", "getToken", "enrich", "warmLsd", "fetchFanpagePostsPage", "fetchGroupName", "resolveProfileVanity", "resolveFanpageContext", "resolveGroupContext", "fetchProfileLocation", "chromeStorageSet", "chromeStorageGet"]);
/* global chrome */
const storageReady = Promise.all([
  chrome.storage.local.setAccessLevel ? chrome.storage.local.setAccessLevel({ accessLevel: 'TRUSTED_CONTEXTS' }) : Promise.resolve(),
  chrome.storage.session.setAccessLevel ? chrome.storage.session.setAccessLevel({ accessLevel: 'TRUSTED_CONTEXTS' }) : Promise.resolve()
]);
chrome.storage.local.remove(['adsAccessToken', 'adsAccessTokenKind']).catch(() => {});
const PUBLIC_STORAGE_KEYS = new Set(['ztUiPreferences']);
function trustedSender(sender) { return sender.id === chrome.runtime.id && typeof sender.url === 'string' && sender.url.startsWith(chrome.runtime.getURL('')); }
function facebookSender(sender) { try { const u = new URL(sender.url); return sender.id === chrome.runtime.id && u.protocol === 'https:' && (u.hostname === 'facebook.com' || u.hostname.endsWith('.facebook.com')); } catch { return false; } }
async function broadcastSessionChange() {
  const tabs = await chrome.tabs.query({ url: '*://*.facebook.com/*' });
  for (const tab of tabs) if (tab.id) chrome.tabs.sendMessage(tab.id, { type: 'ZT_SESSION_CHANGED' }).catch(() => {});
}
async function publicSession(includeLicense = false) {
  await storageReady;
  const data = await chrome.storage.local.get(['ztServerToken','ztServerLicenseDetails','ztServerTokenSavedAt']);
  const details = data.ztServerLicenseDetails;
  const expired = details?.expires_at && new Date(details.expires_at).getTime() <= Date.now();
  const authed = !!data.ztServerToken && details?.license_status === 'ACTIVE' && !expired && Date.now() - Number(data.ztServerTokenSavedAt || 0) < 60000;
  const used = details?.last_reset_date === getVietnamToday() ? Number(details.daily_used || 0) : 0;
  return { ok: authed, authed, hasQuota: authed && (details.daily_limit === -1 || details.daily_limit === null || used < details.daily_limit), details: details || null, ...(includeLicense ? { license: data.ztServerToken || null } : {}) };
}
async function timedFetch(url, options = {}) { return fetch(url, { ...options, signal: AbortSignal.timeout(20000) }); }


chrome.runtime.onInstalled.addListener(() => {
  console.log('[Zoo Target] installed');
});

function detectTokenKind(token) {
  const t = (token || '').trim();
  if (t.startsWith('EAAG')) return 'EAAG';
  if (t.startsWith('EAAB')) return 'EAAB';
  return 'UNKNOWN';
}

function extractTokenByPrefix(html, prefix) {
  if (!html) return null;
  const re = new RegExp('(' + prefix + '[0-9A-Za-z]+)', 'g');
  const m = re.exec(html);
  return m && m[1] ? m[1] : null;
}

async function fetchBusinessEAAGToken() {
  try {
    await fetch('https://business.facebook.com/', { method: 'GET', credentials: 'include', redirect: 'follow' });
  } catch (_) { /* ignore */ }

  const resp = await fetch('https://business.facebook.com/content_management/?nav_source=flyout_menu', {
    method: 'GET',
    credentials: 'include',
    redirect: 'follow'
  });
  if (!resp.ok) throw new Error('HTTP ' + resp.status);
  const text = await resp.text();
  const eaag = extractTokenByPrefix(text, 'EAAG');
  if (!eaag) throw new Error('NO_EAAG');
  return eaag.trim();
}

async function getAdsAccessToken() {
  const tabs = await chrome.tabs.query({ url: '*://adsmanager.facebook.com/*' });
  for (const tab of tabs) {
    if (!tab.id) continue;
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: function () {
          return (typeof window._accessToken === 'string' && window._accessToken)
            ? window._accessToken
            : (typeof window.__accessToken === 'string' && window.__accessToken)
              ? window.__accessToken
              : null;
        }
      });
      const token = results?.[0]?.result;
      if (token && typeof token === 'string' && token.trim()) {
        const t = token.trim();
        try {
          await chrome.storage.session.set({ adsAccessToken: t, adsAccessTokenKind: detectTokenKind(t) });
        } catch (_) { /* ignore */ }
        return { token: t, kind: detectTokenKind(t) };
      }
    } catch (_) { /* ignore tab */ }
  }

  const resp = await fetch('https://adsmanager.facebook.com/adsmanager/', {
    method: 'GET',
    credentials: 'include',
    redirect: 'follow'
  });
  if (!resp.ok) throw new Error('HTTP ' + resp.status);
  const text = await resp.text();

  let token = extractTokenByPrefix(text, 'EAAB');
  if (!token) token = extractTokenByPrefix(text, 'EAAG');
  if (!token) {
    try {
      const eaag = await fetchBusinessEAAGToken();
      await chrome.storage.session.set({ adsAccessToken: eaag, adsAccessTokenKind: 'EAAG' });
      return { token: eaag, kind: 'EAAG' };
    } catch (_) {
      throw new Error('ADS_VERIFY_REQUIRED');
    }
  }
  token = token.replace(/\\"/g, '"').trim();
  try {
    await chrome.storage.session.set({ adsAccessToken: token, adsAccessTokenKind: detectTokenKind(token) });
  } catch (_) { /* ignore */ }
  return { token, kind: detectTokenKind(token) };
}

async function getGenderMap(uids, token) {
  const out = {};
  /** Mỗi vòng tối đa 50 `ids` (URL an toàn; batch modal 100 UID → 2 vòng Graph). */
  const chunkSize = 50;
  const list = uids.map((u) => String(u));
  for (let i = 0; i < list.length; i += chunkSize) {
    const chunk = list.slice(i, i + chunkSize);
    const ids = chunk.join(',');
    const url = 'https://graph.facebook.com/v21.0/?ids=' + encodeURIComponent(ids)
      + '&fields=id,name,gender,picture.width(80).height(80)&access_token=' + encodeURIComponent(token);
    const r = await fetch(url);
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error("Graph HTTP " + r.status);
    if (j.error) throw new Error(j.error.message || 'Graph API lỗi');
    for (const id of chunk) {
      const row = j[id];
      if (row) {
        out[id] = {
          name: row.name || '',
          gender: row.gender || '',
          pictureUrl: row.picture?.data?.url || ''
        };
      }
    }
  }
  return out;
}

function sleepBg(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Graph REST — danh sách bài Fanpage (token EAAB từ Ads Manager).
 * @param {string} pageId
 * @param {string} nextUrl - paging.next đầy đủ hoặc rỗng
 * @param {number} retryCount
 */
async function fanpageFetchPostsPage(pageId, nextUrl, retryCount) {
  const rc = retryCount || 0;
  const tokResult = await getAdsAccessToken();
  const tok = tokResult && tokResult.token ? String(tokResult.token).trim() : '';
  if (!tok) {
    return { ok: false, error: 'Không có access token', posts: [], nextUrl: null };
  }
  const base = 'https://graph.facebook.com/v21.0/';
  const fields = 'id,created_time,message';
  const url =
    nextUrl && String(nextUrl).trim()
      ? String(nextUrl).trim()
      : base +
        encodeURIComponent(String(pageId)) +
        '/posts?fields=' +
        encodeURIComponent(fields) +
        '&limit=50&access_token=' +
        encodeURIComponent(tok);
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:' || parsed.hostname !== 'graph.facebook.com' || parsed.port || parsed.username || parsed.password || !/^\/v[0-9.]+\//.test(parsed.pathname)) throw new Error('URL Graph không hợp lệ');
  const r = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(20000) });
  const j = await r.json().catch(() => ({}));
  if (j.error) {
    const code = Number(j.error.code || 0);
    if ((code === 4 || code === 17 || code === 32 || code === 613 || code === 800) && rc < 3) {
      await sleepBg(30000);
      return fanpageFetchPostsPage(pageId, nextUrl, rc + 1);
    }
    return {
      ok: false,
      error: j.error.message || String(code),
      posts: [],
      nextUrl: null
    };
  }
  const rawList = j.data || [];
  const posts = rawList.map((p) => {
    const full = String(p.id || '');
    const mm = full.match(/_(\d+)$/);
    const postId = mm ? mm[1] : full.replace(/\D/g, '') || full;
    return {
      postId: String(postId),
      fullId: full,
      created_time: p.created_time || '',
      message: p.message || ''
    };
  });
  return {
    ok: true,
    posts,
    nextUrl: j.paging && j.paging.next ? j.paging.next : null
  };
}

/**
 * Gộp kết quả phone.zooinbox.com — API đôi khi trả `phones` dù không có `ok`,
 * hoặc tên field khác (mobile, PhoneNumber, user_id).
 */
function mergePhoneApiPayloadIntoMap(map, d, requestedUids) {
  if (!d || typeof d !== 'object') return;
  const rows = Array.isArray(d.phones)
    ? d.phones
    : Array.isArray(d.data)
      ? d.data
      : Array.isArray(d.rows)
        ? d.rows
        : Array.isArray(d.result)
          ? d.result
          : null;
  if (rows) {
    for (let i = 0; i < rows.length; i++) {
      const p = rows[i];
      if (!p || typeof p !== 'object') continue;
      const uidRaw = p.uid != null ? p.uid : p.UID != null ? p.UID : p.user_id != null ? p.user_id : p.fb_id != null ? p.fb_id : p.id;
      if (uidRaw == null) continue;
      const uid = String(uidRaw).replace(/\D/g, '');
      if (!/^\d{5,20}$/.test(uid)) continue;
      const ph =
        p.phone != null
          ? p.phone
          : p.Phone != null
            ? p.Phone
            : p.mobile != null
              ? p.mobile
              : p.tel != null
                ? p.tel
                : p.PhoneNumber != null
                  ? p.PhoneNumber
                  : '';
      const ps = String(ph).trim();
      if (!ps || /^phone\s*number$/i.test(ps)) continue;
      map[uid] = ps;
    }
  }
  if (d.map && typeof d.map === 'object') {
    const keys = Object.keys(d.map);
    for (let j = 0; j < keys.length; j++) {
      const k = keys[j];
      const v = d.map[k];
      const uid = String(k).replace(/\D/g, '');
      if (!/^\d{5,20}$/.test(uid)) continue;
      const ps = v != null ? String(v).trim() : '';
      if (ps && !/^phone\s*number$/i.test(ps)) map[uid] = ps;
    }
  }
  for (let r = 0; r < requestedUids.length; r++) {
    const u = String(requestedUids[r]);
    if (d[u] != null) {
      const ps = String(d[u]).trim();
      if (ps && !/^phone\s*number$/i.test(ps)) map[u.replace(/\D/g, '')] = ps;
    }
  }
  const dk = Object.keys(d);
  for (let x = 0; x < dk.length; x++) {
    const k = dk[x];
    const kn = String(k).replace(/\D/g, '');
    if (!/^\d{10,20}$/.test(kn)) continue;
    const v = d[k];
    const ps = v != null ? String(v).trim() : '';
    if (ps && !/^phone\s*number$/i.test(ps)) map[kn] = ps;
  }
}

function alignPhoneMapKeysToRequested(map, requestedUids) {
  const out = {};
  const req = requestedUids.map((u) => String(u).replace(/\D/g, ''));
  for (let i = 0; i < req.length; i++) {
    const want = req[i];
    if (!want) continue;
    if (map[want]) {
      out[requestedUids[i]] = map[want];
      continue;
    }
    const keys = Object.keys(map);
    for (let k = 0; k < keys.length; k++) {
      const key = keys[k];
      if (String(key).replace(/\D/g, '') === want) {
        out[requestedUids[i]] = map[key];
        break;
      }
    }
  }
  return out;
}

function getVietnamToday() {
  try {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
  } catch (_) {
    return new Date().toISOString().slice(0, 10);
  }
}

async function readBackendJson(response) {
  try { return await response.json(); }
  catch (_) {
    const message = response.status === 404
      ? 'Website chưa được cập nhật cho tiện ích này. Vui lòng cập nhật backend trước khi quét.'
      : 'Máy chủ trả về trang web thay vì dữ liệu. Vui lòng kiểm tra địa chỉ API và quyền truy cập máy chủ.';
    const error = new Error(message); error.code = 'BACKEND_API_UNAVAILABLE'; throw error;
  }
}

async function getPhoneMap(uids) {
  const session = await chrome.storage.local.get(['ztServerToken']);
  if (!session.ztServerToken) throw new Error('Vui lòng nhập License Key.');
  const generation = sessionGeneration, key = session.ztServerToken;
  const list = [...new Set(uids.map(String))];
  if (!list.length || list.length > 500 || list.some(uid => !/^\d{5,20}$/.test(uid))) throw new Error('UID không hợp lệ');
  const requestId = crypto.randomUUID(); let response, data;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      response = await timedFetch(ZT_API_BASE + '/api/license/phones', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ licenseKey: key, uids: list, requestId }) });
      data = await readBackendJson(response);
      if (response.ok && data.ok) break;
      if (data.code === 'DAILY_LIMIT_REACHED') throw new Error('License Key đã hết lượt hôm nay.');
      if (response.status < 500 && data.code !== 'RATE_LIMIT_EXCEEDED') throw new Error(data.error || 'Không có quyền tra dữ liệu.');
      if (attempt === 2) throw new Error(data.error || 'Máy chủ chưa sẵn sàng.');
    } catch (error) { if (response && response.status < 500 && data?.code !== 'RATE_LIMIT_EXCEEDED' || attempt === 2) throw error; }
    await sleepBg(Math.min(10000, Number(response?.headers?.get('Retry-After') || 0) * 1000 || 1000 * (attempt + 1)));
  }
  const current = await chrome.storage.local.get(['ztServerToken']);
  if (generation !== sessionGeneration || current.ztServerToken !== key) throw new Error('Phiên đã thay đổi.');
  if (data?.quota) await chrome.storage.local.set({ ztServerLicenseDetails: data.quota, ztServerTokenSavedAt: Date.now() });
  return data?.phoneMap || {};
}

const ZT_API_BASE = 'https://www.fairyautomation.io.vn';
const ZT_DEVICE_NAME = 'tien-house-automation';

let sessionGeneration = 0;
let lastRefreshMeTimestamp = 0, lastRefreshMeResponse = null, lastRefreshKey = null;
let sessionWrites = Promise.resolve();
let refreshInFlight = null;
function writeSession(fn) { const result = sessionWrites.then(fn); sessionWrites = result.catch(() => {}); return result; }
async function ztServerLoginFlow(licenseKey, isRefresh = false) {
  await storageReady;
  const key = String(licenseKey || '').trim().toUpperCase();
  if (!key || key.length > 80) return { ok: false, error: 'INVALID_LICENSE' };
  const generation = isRefresh ? sessionGeneration : ++sessionGeneration;
  if (!isRefresh) { lastRefreshMeResponse = null; lastRefreshKey = null; }
  try {
    const response = await timedFetch(ZT_API_BASE + '/api/license/validate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ licenseKey: key }) });
    const data = await readBackendJson(response);
    return await writeSession(async () => {
      const current = await chrome.storage.local.get(['ztServerToken','ztServerLicenseDetails']);
      if (generation !== sessionGeneration || isRefresh && current.ztServerToken !== key) return { ok: false, error: 'SESSION_CHANGED' };
      if (!response.ok || !data.valid) {
        const status = response.status === 429 || response.status >= 500 ? 'STALE' : String(data.error || data.code || 'DENIED').replace(/^LICENSE_/, '');
        // An attempted new key never changes the existing key's state.
        if (isRefresh || current.ztServerToken === key) await chrome.storage.local.set({ ztServerLicenseDetails: { ...(current.ztServerLicenseDetails || {}), valid: false, license_status: status } });
        lastRefreshMeResponse = null; await broadcastSessionChange();
        return { ok: false, error: data.error || 'Máy chủ chưa sẵn sàng.' };
      }
      const details = { ...data, last_reset_date: data.last_reset_date || getVietnamToday() };
      await chrome.storage.local.set({ ztServerToken: key, ztServerUser: { name: 'User' }, ztServerLicenseDetails: details, ztServerTokenSavedAt: Date.now() });
      await broadcastSessionChange(); return { ok: true, license: key, details };
    });
  } catch (error) {
    await writeSession(async () => {
      const current = await chrome.storage.local.get(['ztServerToken','ztServerLicenseDetails']);
      if (generation === sessionGeneration && current.ztServerToken === key) await chrome.storage.local.set({ ztServerLicenseDetails: { ...(current.ztServerLicenseDetails || {}), valid: false, license_status: 'STALE' } });
    });
    lastRefreshMeResponse = null; await broadcastSessionChange();
    return { ok: false, error: 'Không kết nối được máy chủ. Key vẫn được lưu; vui lòng thử lại.' };
  }
}
async function ztServerLogoutFlow() {
  ++sessionGeneration; lastRefreshMeResponse = null; lastRefreshKey = null; lastRefreshMeTimestamp = 0;
  await writeSession(() => chrome.storage.local.remove(['ztServerToken','ztServerUser','ztServerTokenSavedAt','ztServerLicenseDetails']));
  await chrome.storage.session.remove(['adsAccessToken','adsAccessTokenKind']);
  await broadcastSessionChange(); return { ok: true };
}
async function ztServerRefreshMeFlow(force = false) {
  const data = await chrome.storage.local.get(['ztServerToken']);
  if (!data.ztServerToken) return { ok: false, error: 'Chưa đăng nhập' };
  const generation = sessionGeneration, now = Date.now();
  if (!force && lastRefreshMeResponse && lastRefreshKey === data.ztServerToken && now - lastRefreshMeTimestamp < 15000) return lastRefreshMeResponse;
  if (refreshInFlight && refreshInFlight.key === data.ztServerToken && refreshInFlight.generation === generation) return refreshInFlight.promise;
  const promise = ztServerLoginFlow(data.ztServerToken,true);
  refreshInFlight = { key: data.ztServerToken, generation, promise };
  const result = await promise;
  if (refreshInFlight?.promise === promise) refreshInFlight = null;
  if (result.ok && generation === sessionGeneration) { lastRefreshMeTimestamp = now; lastRefreshKey = data.ztServerToken; lastRefreshMeResponse = result; }
  return result;
}

async function ztGetFacebookAccountStatus() {
  let fbUid = '';
  try {
    const ck = (await chrome.cookies.get({ url: 'https://www.facebook.com', name: 'c_user' }))
      || (await chrome.cookies.get({ url: 'https://www.facebook.com', name: 'i_user' }));
    fbUid = ck && ck.value ? String(ck.value).replace(/\D/g, '') : '';
  } catch (_) {
    fbUid = '';
  }

  return {
    ok: true,
    ready: !!fbUid,
    fbUid: fbUid,
    isVipActive: (await publicSession()).authed,
    isVipLocked: false,
    message: fbUid ? 'Đã kết nối Facebook.' : 'Vui lòng đăng nhập Facebook.'
  };
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!trustedSender(sender) && !facebookSender(sender)) { sendResponse({ ok: false, error: 'SENDER_DENIED' }); return false; }
  if (['ZT_SERVER_LOGIN','ZT_SERVER_LOGOUT','ZT_BRIDGE'].includes(msg?.action) && !trustedSender(sender)) { sendResponse({ ok: false, error: 'TRUSTED_CONTEXT_REQUIRED' }); return false; }
  if ((msg?.action === 'CHROME_STORAGE_GET' || msg?.action === 'CHROME_STORAGE_SET') && !PUBLIC_STORAGE_KEYS.has(msg.key)) { sendResponse({ ok: false, error: 'STORAGE_DENIED' }); return false; }

  if (msg?.action === 'ZT_SERVER_LOGIN') {
    ztServerLoginFlow(msg.licenseKey)
      .then((r) => sendResponse(trustedSender(sender) ? r : { ok: r.ok, details: r.details, error: r.error }))
      .catch((e) => sendResponse({ ok: false, error: e.message || String(e) }));
    return true;
  }

  if (msg?.action === 'ZT_SERVER_LOGOUT') {
    ztServerLogoutFlow()
      .then((r) => sendResponse(trustedSender(sender) ? r : { ok: r.ok, details: r.details, error: r.error }))
      .catch((e) => sendResponse({ ok: false, error: e.message || String(e) }));
    return true;
  }

  if (msg?.action === 'ZT_SERVER_SESSION_GET') {
    (async () => { await ztServerRefreshMeFlow(false); sendResponse(await publicSession(trustedSender(sender))); })().catch(() => sendResponse({ ok: false, authed: false }));
    return true;
  }
  if (msg?.action === 'ZT_FB_ACCOUNT_STATUS') {
    ztGetFacebookAccountStatus()
      .then((r) => sendResponse(trustedSender(sender) ? r : { ok: r.ok, details: r.details, error: r.error }))
      .catch((e) =>
        sendResponse({
          ok: false,
          ready: false,
          fbUid: '',
          isVipActive: false,
          isVipLocked: false,
          message: e && e.message ? String(e.message) : 'Không kiểm tra được trạng thái Facebook.'
        })
      );
    return true;
  }

  if (msg?.action === 'CHROME_STORAGE_SET') {
    chrome.storage.local.set({ [msg.key]: msg.value }, () => {
      sendResponse({ ok: true });
    });
    return true;
  }

  if (msg?.action === 'CHROME_STORAGE_GET') {
    chrome.storage.local.get([msg.key], (res) => {
      sendResponse({ ok: true, value: res[msg.key] || null });
    });
    return true;
  }

  if (msg?.action === 'ZT_SERVER_REFRESH_ME') {
    ztServerRefreshMeFlow(!!msg.force)
      .then((r) => sendResponse(trustedSender(sender) ? r : { ok: r.ok, details: r.details, error: r.error }))
      .catch((e) => sendResponse({ ok: false, error: e.message || String(e) }));
    return true;
  }

  if (msg?.action === 'ZT_SERVER_SYNC_FACEBOOK_PROFILE') {
    publicSession().then(s => sendResponse({ ok: s.authed, data: { user: { effective_plan_code: s.details?.plan || 'unknown' } } })); return true;
  }
  if (msg?.action === 'ZT_EXTENSION_SCAN_LOG') {
    (async () => {
      sendResponse({ ok: true });
    })().catch((e) => sendResponse({ ok: false, error: e.message || String(e) }));
    return true;
  }

  if (msg?.action === 'ZT_EXTENSION_UID_DEMO_BATCH') {
    (async () => {
      sendResponse({ ok: true, skipped: true });
    })().catch((e) => sendResponse({ ok: false, error: e.message || String(e) }));
    return true;
  }

  if (msg?.action === 'ZT_EXTENSION_FRIEND_INVITE_QUOTA') {
    (async () => {
      // Old post-send reporting is observational; reservation occurs before the Facebook request.
      if (msg.quotaAction === 'consume') { sendResponse({ ok: true, data: {} }); return; }
      const state = await chrome.storage.local.get(['ztServerToken']);
      const response = await timedFetch(ZT_API_BASE + '/api/license/invite', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ licenseKey: state.ztServerToken, action: msg.quotaAction === 'reserve' ? 'consume' : 'check', requestId: msg.requestId || crypto.randomUUID() }) });
      const data = await readBackendJson(response); sendResponse(response.ok ? data : { ok: false, error: data.error || 'Không có quyền gửi lời mời.' });
    })().catch(() => sendResponse({ ok: false, error: 'Không kiểm tra được giới hạn kết bạn.' })); return true;
  }
  if (msg?.action === 'OPEN_ZT_UI') {
    (async () => {
      const fbTabId = sender.tab?.id;
      if (!fbTabId) {
        sendResponse({ ok: false, error: 'Không xác định được tab Facebook' });
        return;
      }
      let sourceTabUrl = '';
      try {
        const t = await chrome.tabs.get(fbTabId);
        if (t && t.url) {
          sourceTabUrl = String(t.url).split('#')[0];
        }
      } catch (_) {
        /* ignore */
      }
      const sk =
        'zt' +
        Date.now().toString(36) +
        Math.random()
          .toString(36)
          .replace(/[^a-z0-9]+/g, '')
          .slice(0, 10);
      await chrome.storage.session.set({
        [sk]: {
          kind: msg.kind === 'profile' ? 'profile' : 'group',
          profileId: String(msg.profileId || ''),
          groupId: String(msg.groupId || ''),
          groupName: String(msg.groupName || ''),
          fbTabId,
          sourceTabUrl,
        }
      });
      const url = chrome.runtime.getURL('src/ui/modal.html') + '?zt=' + encodeURIComponent(sk);
      await chrome.tabs.create({ url, active: true });
      sendResponse({ ok: true });
    })().catch((e) => sendResponse({ ok: false, error: e.message || String(e) }));
    return true;
  }

  if (msg?.action === 'ZT_BRIDGE') {
    const fbTabId = msg.fbTabId;
    const bridgeAction = msg.bridgeAction;
    const payload = msg.payload || {};
    if (typeof fbTabId !== 'number' || !bridgeAction) {
      sendResponse({ ok: false, error: 'Thiếu fbTabId hoặc bridgeAction' });
      return true;
    }
    if (!BRIDGE_ACTIONS.has(bridgeAction)) { sendResponse({ ok: false, error: 'ACTION_DENIED' }); return false; }
    chrome.tabs.get(fbTabId, (tab) => {
      if (chrome.runtime.lastError || !tab || !/^https:\/\/([a-z0-9-]+\.)*facebook\.com\//i.test(tab.url || '')) {
        sendResponse({
          ok: false,
          error: 'Tab Facebook đã đóng hoặc không còn hợp lệ — quay lại tab profile/nhóm rồi mở Fairy House AutoData lại.'
        });
        return;
      }
      chrome.tabs.sendMessage(
        fbTabId,
        {
          type: 'ZT_BRIDGE',
          action: bridgeAction,
          payload
        },
        (resp) => {
          if (chrome.runtime.lastError) {
            sendResponse({ ok: false, error: chrome.runtime.lastError.message });
            return;
          }
          if (resp?.ok) {
            sendResponse({ ok: true, data: resp.data });
          } else {
            sendResponse({ ok: false, error: resp?.error || 'Lỗi bridge' });
          }
        }
      );
    });
    return true;
  }

  if (msg?.action === 'graphGetNameById') {
    (async () => {
      const id = String(msg.id || '').trim();
      const token = String(msg.token || '').trim();
      if (!id || !token) {
        sendResponse({ ok: false, error: 'Thiếu id hoặc token' });
        return;
      }
      const url =
        'https://graph.facebook.com/v21.0/' +
        encodeURIComponent(id) +
        '?fields=name,picture.width(120).height(120)&access_token=' +
        encodeURIComponent(token);
      try {
        const resp = await fetch(url);
        const j = await resp.json().catch(() => ({}));
        if (!resp.ok || j.error) {
          sendResponse({ ok: true, name: '', pictureUrl: '' });
          return;
        }
        sendResponse({
          ok: true,
          name: j.name ? String(j.name) : '',
          pictureUrl: j.picture && j.picture.data && j.picture.data.url ? String(j.picture.data.url) : ''
        });
      } catch (_) {
        sendResponse({ ok: true, name: '', pictureUrl: '' });
      }
    })();
    return true;
  }

  if (msg?.action === 'fanpageFetchPostsPage') {
    (async () => {
      try {
        await sleepBg(180 + Math.floor(Math.random() * 80));
        const pageId = String(msg.pageId || '').trim();
        const nextUrl = msg.nextUrl != null ? String(msg.nextUrl) : '';
        if (!pageId && !nextUrl) {
          sendResponse({ ok: false, error: 'Thiếu pageId', posts: [], nextUrl: null });
          return;
        }
        const out = await fanpageFetchPostsPage(pageId || '0', nextUrl, 0);
        sendResponse(out);
      } catch (e) {
        sendResponse({ ok: false, error: e.message || String(e), posts: [], nextUrl: null });
      }
    })();
    return true;
  }

  if (msg?.action === 'getAdsAccessToken') {
    getAdsAccessToken()
      .then((result) => sendResponse({ ok: true, token: result?.token || null, kind: result?.kind || null }))
      .catch((e) => sendResponse({ ok: false, error: e.message || 'Lỗi lấy token Ads Manager' }));
    return true;
  }

  if (msg?.action === 'getPhoneMapOnly') {
    (async () => {
      const uids = msg.uids;
      if (!Array.isArray(uids) || !uids.length) {
        sendResponse({ ok: false, error: 'Thiếu uids' });
        return;
      }
      try {
        const phoneMap = await getPhoneMap(uids.map((u) => String(u)));
        sendResponse({ ok: true, phoneMap });
      } catch (e) {
        sendResponse({ ok: false, error: e.message || String(e) });
      }
    })();
    return true;
  }

  if (msg?.action === 'enrichBatch') {
    (async () => {
      const uids = msg.uids;
      const token = msg.token;
      if (!Array.isArray(uids) || !uids.length) {
        sendResponse({ ok: false, error: 'Thiếu uids' });
        return;
      }
      if (!token || !String(token).trim()) {
        sendResponse({ ok: false, error: 'Thiếu access token' });
        return;
      }
      const [gender, phone] = await Promise.allSettled([getGenderMap(uids, String(token).trim()), getPhoneMap(uids)]);
      if (phone.status === 'rejected') throw phone.reason;
      sendResponse({ ok: true, data: { genderMap: gender.status === 'fulfilled' ? gender.value : {}, phoneMap: phone.value, genderError: gender.status === 'rejected' ? 'Không lấy được giới tính' : null } });
    })().catch((e) => sendResponse({ ok: false, error: e.message || 'enrichBatch lỗi' }));
    return true;
  }
  return false;
});
