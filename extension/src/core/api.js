/* eslint-disable no-unused-vars */
/**
 * GraphQL Comet — modal Directory (click field): **một** `doc_id` cho cả `CURRENT_CITY` lẫn `BIRTHDAY`.
 * HAR: `tuoi profile.har` (`ProfileCometDirectoryPostClickDialogQuery`).
 */
const DOC_ID_PROFILE_DIRECTORY_POST_CLICK = '27193145910291507';
const FB_FRIENDLY_PROFILE_DIRECTORY_POST_CLICK = 'ProfileCometDirectoryPostClickDialogQuery';
const DOC_ID_FRIEND_REQUEST_SEND = '34373951838917178';
const FB_FRIENDLY_FRIEND_REQUEST_SEND = 'FriendingCometFriendRequestSendMutation';

/**
 * Các helper độc lập khỏi `this` để tránh lỗi kiểu
 * `this._getFacebookGraphqlUrl is not a function` nếu ngữ cảnh bị mất.
 */
function ztGetFacebookOriginForGraph() {
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

function ztGetFacebookGraphqlUrl() {
  return ztGetFacebookOriginForGraph() + '/api/graphql/';
}

function ztParseGraphqlPayload(text) {
  let cleaned = String(text || '');
  if (cleaned.startsWith('for (;;);')) cleaned = cleaned.substring(9);
  try {
    return JSON.parse(cleaned);
  } catch (_) {
    /* fallback */
  }
  const lines = cleaned.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = String(lines[i] || '').trim();
    if (!line || line.charAt(0) !== '{') continue;
    try {
      return JSON.parse(line);
    } catch (_) {
      /* keep scanning */
    }
  }
  return {};
}

const PushGroupAPI = {

  _parseResponse(text) {
    let cleaned = text;
    if (cleaned.startsWith('for (;;);')) cleaned = cleaned.substring(9);
    try { return JSON.parse(cleaned); } catch (_) { /* fallback */ }
    const s = cleaned.indexOf('{');
    const e = cleaned.lastIndexOf('}');
    if (s !== -1 && e > s) {
      try { return JSON.parse(cleaned.substring(s, e + 1)); } catch (_) { /* ignore */ }
    }
    const lines = cleaned.split('\n');
    for (const line of lines) {
      const t = line.trim();
      if (!t || !t.startsWith('{')) continue;
      try {
        const obj = JSON.parse(t);
        if (obj.data) return obj;
      } catch (_) { /* skip */ }
    }
    throw new Error('Không thể parse response từ Facebook');
  },

  _parseMultiResponse(text) {
    let cleaned = text;
    if (cleaned.startsWith('for (;;);')) cleaned = cleaned.substring(9);
    const results = [];
    const lines = cleaned.split('\n');
    for (const line of lines) {
      const t = line.trim();
      if (!t || !t.startsWith('{')) continue;
      try {
        results.push(JSON.parse(t));
      } catch (_) {
        this._splitConcatJson(t, results);
      }
    }
    if (results.length === 0) {
      this._splitConcatJson(cleaned, results);
    }
    return results;
  },

  _splitConcatJson(str, results) {
    let pos = 0;
    while (pos < str.length) {
      const start = str.indexOf('{', pos);
      if (start === -1) break;
      let depth = 0; let i = start; let inStr = false; let esc = false;
      for (; i < str.length; i++) {
        const c = str.charCodeAt(i);
        if (esc) { esc = false; continue; }
        if (c === 92) { esc = true; continue; }
        if (c === 34) { inStr = !inStr; continue; }
        if (inStr) continue;
        if (c === 123) depth++;
        else if (c === 125) { depth--; if (depth === 0) { i++; break; } }
      }
      if (depth === 0 && i > start) {
        try { results.push(JSON.parse(str.substring(start, i))); } catch (_) { /* skip */ }
      }
      pos = i;
    }
  },

  async sendFriendInvite(targetUid, opts) {
    const uid = String(targetUid || '').replace(/\D/g, '');
    if (!uid || uid.length < 6) {
      throw new Error('UID kết bạn không hợp lệ');
    }
    const { fbDtsg, userId } = PushGroupAuth.getAuth();
    if (!fbDtsg || !userId) throw new Error('Không lấy được token Facebook');
    let rp = PushGroupAuth.getRequestParams();
    if (!rp.lsd && typeof PushGroupAuth.fetchLsdFromPageAsync === 'function') {
      rp = { ...rp, lsd: await PushGroupAuth.fetchLsdFromPageAsync() };
    }
    if ((!rp.lsd || String(rp.lsd).length < 8) && typeof PushGroupAuth.ensureLsdAsync === 'function') {
      rp = { ...rp, lsd: await PushGroupAuth.ensureLsdAsync() };
    }
    const jazoest = rp.jazoest || PushGroupAuth.generateJazoest(fbDtsg);
    const actorId = String(userId).replace(/\D/g, '');
    const input = {
      click_correlation_id: String(Date.now()),
      click_proof_validation_result: '{"validated":true}',
      friend_requestee_ids: [uid],
      friending_channel: opts && opts.friendingChannel ? String(opts.friendingChannel) : 'PROFILE_BUTTON',
      warn_ack_for_ids: [],
      actor_id: actorId,
      client_mutation_id: String(Date.now() % 1000000)
    };
    const variables = { input, scale: 1 };
    const params = new URLSearchParams({
      av: actorId,
      __aaid: rp.__aaid || '0',
      __user: actorId,
      __a: '1',
      __req: rp.__req || '0',
      __hs: rp.__hs || '',
      dpr: rp.dpr || '1',
      __ccg: rp.__ccg || 'EXCELLENT',
      __rev: rp.__rev || '',
      __s: rp.__s || '',
      __hsi: rp.__hsi || '',
      __dyn: rp.__dyn || '',
      __csr: rp.__csr || '',
      __comet_req: rp.__comet_req || '15',
      fb_dtsg: fbDtsg,
      jazoest: jazoest,
      lsd: rp.lsd || '',
      __spin_r: rp.__spin_r || rp.__rev || '',
      __spin_b: rp.__spin_b || 'trunk',
      __spin_t: rp.__spin_t || '',
      __crn: 'comet.fbweb.CometProfileTimelineListViewRoute',
      qpl_active_flow_ids: '521482763',
      fb_api_caller_class: 'RelayModern',
      fb_api_req_friendly_name: FB_FRIENDLY_FRIEND_REQUEST_SEND,
      server_timestamps: 'true',
      variables: JSON.stringify(variables),
      doc_id: DOC_ID_FRIEND_REQUEST_SEND
    });
    const resp = await fetch(ztGetFacebookGraphqlUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest',
        'x-fb-friendly-name': FB_FRIENDLY_FRIEND_REQUEST_SEND,
        'x-fb-lsd': rp.lsd || '',
        'x-asbd-id': '359341'
      },
      credentials: 'include',
      body: params.toString()
    });
    if (!resp.ok) {
      throw new Error('HTTP ' + resp.status);
    }
    const raw = await resp.text();
    const payload = ztParseGraphqlPayload(raw);
    const errors = Array.isArray(payload && payload.errors) ? payload.errors : [];
    if (errors.length) {
      const err = errors[0] || {};
      return {
        success: false,
        status: 'failed',
        message: String(err.message || 'Facebook từ chối lời mời'),
        code: err.code != null ? Number(err.code) : null
      };
    }
    const result = payload && payload.data && payload.data.friend_request_send;
    const requestee =
      result && Array.isArray(result.friend_requestees) && result.friend_requestees.length
        ? result.friend_requestees[0]
        : null;
    const status = requestee && requestee.friendship_status ? String(requestee.friendship_status) : '';
    const ok =
      status === 'OUTGOING_REQUEST' ||
      status === 'ARE_FRIENDS' ||
      status === 'CAN_REQUEST';
    return {
      success: !!ok,
      status: ok ? 'success' : 'failed',
      message: ok ? 'Đã gửi lời mời thành công' : status ? ('Trạng thái: ' + status) : 'Facebook không xác nhận gửi lời mời',
      friendship_status: status || ''
    };
  },

  async fetchGroupMembersPage(groupId, cursor) {
    const { fbDtsg, userId } = PushGroupAuth.getAuth();
    console.log('[TienHouse] getAuth →', { fbDtsg: fbDtsg ? '✓ (' + fbDtsg.substring(0, 12) + '…)' : '✗ null', userId: userId || '✗ null' });
    if (!fbDtsg || !userId) throw new Error('Không lấy được fb_dtsg hoặc userId. Hãy F5 trang Facebook rồi thử lại.');
    let rp = PushGroupAuth.getRequestParams();
    // Đảm bảo có lsd — thử nhiều phương thức
    if (!rp.lsd || String(rp.lsd).length < 8) {
      if (typeof PushGroupAuth.ensureLsdAsync === 'function') {
        const lsd = await PushGroupAuth.ensureLsdAsync();
        if (lsd) rp = { ...rp, lsd };
      } else if (typeof PushGroupAuth.fetchLsdFromPageAsync === 'function') {
        const lsd = await PushGroupAuth.fetchLsdFromPageAsync();
        if (lsd) rp = { ...rp, lsd };
      }
    }
    console.log('[TienHouse] lsd →', rp.lsd ? '✓ (' + String(rp.lsd).substring(0, 10) + '…)' : '✗ empty');
    const jazoest = rp.jazoest || PushGroupAuth.generateJazoest(fbDtsg);
    const variables = {
      count: 10,
      cursor: cursor || null,
      groupID: String(groupId),
      recruitingGroupFilterNonCompliant: false,
      scale: 1,
      id: String(groupId)
    };
    const params = new URLSearchParams({
      av: String(userId), __aaid: rp.__aaid || '0',
      __user: String(userId), __a: '1',
      __req: rp.__req || '0',
      __hs: rp.__hs || '', dpr: rp.dpr || '1',
      __ccg: rp.__ccg || 'EXCELLENT',
      __rev: rp.__rev || '',
      __s: rp.__s || '', __hsi: rp.__hsi || '',
      __dyn: rp.__dyn || '', __csr: rp.__csr || '',
      __comet_req: rp.__comet_req || '15',
      fb_dtsg: fbDtsg, jazoest,
      lsd: rp.lsd || '',
      __spin_r: rp.__spin_r || rp.__rev || '',
      __spin_b: rp.__spin_b || 'trunk',
      __spin_t: rp.__spin_t || '',
      fb_api_caller_class: 'RelayModern',
      fb_api_req_friendly_name: 'GroupsCometMembersPageNewMembersSectionRefetchQuery',
      variables: JSON.stringify(variables),
      server_timestamps: 'true',
      doc_id: '26296205566653090'
    });
    const resp = await fetch(ztGetFacebookGraphqlUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8', 'X-Requested-With': 'XMLHttpRequest' },
      credentials: 'include',
      body: params.toString()
    });
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    const text = await resp.text();
    console.log('[TienHouse] GraphQL response length:', text.length, '| first 200 chars:', text.substring(0, 200));
    const chunks = this._parseMultiResponse(text);
    for (const chunk of chunks) {
      const errs = chunk?.errors || chunk?.data?.errors || [];
      const rateLimit = errs.some(e => (e.code === 1675004) || (String(e.message || '').toLowerCase().includes('rate limit')));
      if (rateLimit) throw new Error('RATE_LIMIT_EXCEEDED');
      if (errs.length > 0) {
        const msg = errs[0].message || errs[0].summary || 'Lỗi truy xuất dữ liệu từ Facebook';
        console.warn('[TienHouse] GraphQL error:', msg);
        throw new Error('GraphQLError: ' + msg);
      }
    }
    const members = [];
    let nextCursor = null;
    let hasMore = false;
    let foundGroupNode = false;
    for (const chunk of chunks) {
      // Đường dẫn chuẩn: chunk.data.node.__typename === 'Group'
      let node = chunk?.data?.node;
      if (node && node.__typename === 'Group') {
        foundGroupNode = true;
      } else {
        // Thử đường dẫn thay thế khi dùng Page profile
        node = chunk?.data?.group || chunk?.data?.viewer?.group || null;
        if (node) foundGroupNode = true;
      }
      if (!foundGroupNode || !node) continue;
      const edges = node.new_members?.edges || node.new_forum_members?.edges || node.members?.edges || [];
      for (const edge of edges) {
        const m = edge.node;
        if (!m?.id) continue;
        members.push({ id: m.id, name: m.name || '', url: m.url || '' });
      }
      const pi = node.new_members?.page_info || node.new_forum_members?.page_info || node.members?.page_info;
      if (pi?.end_cursor && pi.end_cursor !== cursor) {
        nextCursor = pi.end_cursor;
        hasMore = pi.has_next_page !== false;
      }
    }
    // Nếu response có data nhưng không tìm thấy Group node → lỗi phiên/quyền
    if (!foundGroupNode && chunks.length > 0) {
      const preview = JSON.stringify(chunks).substring(0, 800);
      console.warn('[TienHouse] Response không chứa Group node. Preview:', preview);
      // Kiểm tra xem có đang dùng Page không
      const auth = PushGroupAuth.getAuth();
      const cookieStr = document.cookie || '';
      const hasCUser = /c_user=\d/.test(cookieStr);
      const hasIUser = /i_user=\d/.test(cookieStr);
      if (!hasCUser && hasIUser) {
        throw new Error('Bạn đang dùng Facebook dưới dạng Trang (Page). Tính năng quét thành viên nhóm yêu cầu tài khoản cá nhân. Hãy chuyển về tài khoản cá nhân: Bấm vào ảnh đại diện góc phải → "Chuyển hồ sơ" → Chọn tài khoản cá nhân → F5 lại trang.');
      }
      if (text.includes('login') || text.includes('checkpoint')) {
        throw new Error('Phiên đăng nhập hết hạn. Hãy F5 trang Facebook rồi quét lại.');
      }
      throw new Error('Facebook không trả về dữ liệu nhóm (userId: ' + (auth?.userId || '?') + '). Hãy F5 trang Facebook rồi quét lại.');
    }
    console.log('[TienHouse] Fetched', members.length, 'members, hasMore:', hasMore);
    return { members, nextCursor, hasMore };
  },

  /**
   * Thành phố đang sống qua GraphQL (Comet Directory) — khớp HAR `ProfileCometDirectoryPostClickDialogQuery`.
   * Nếu Facebook đổi doc_id, cập nhật DOC_ID_DIRECTORY_CURRENT_CITY từ DevTools.
   */
  _isDirectoryFieldLabel(s) {
    const t = String(s || '').trim();
    if (t.length < 2) return true;
    return /^(Vị trí|Location|Current city|Hometown|Home town|Khu vực)$/i.test(t);
  },

  /** Slug trong URL page địa danh: `Hà-Nội-106388046062960` → `Hà Nội`. */
  _cityFromFacebookPlaceUrl(urlStr) {
    if (!urlStr || typeof urlStr !== 'string') return '';
    try {
      const path = new URL(urlStr).pathname;
      const seg = path.split('/').filter(Boolean).pop();
      if (!seg) return '';
      let s = decodeURIComponent(seg.replace(/\+/g, ' '));
      const idTail = s.match(/^(.+)-(\d{6,})$/);
      if (idTail) s = idTail[1];
      s = s.replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
      if (s.length >= 2 && s.length < 120 && !/^\d+$/.test(s)) return s;
    } catch (_) {
      /* ignore */
    }
    return '';
  },

  /** Bóc từ object `headline` Relay (text phẳng hoặc ranges + Page địa danh). */
  _extractCityFromHeadlineObject(headline) {
    if (!headline || typeof headline !== 'object') return '';
    let t = headline.text;
    if (typeof t === 'string') {
      t = t.trim();
      if (t && !this._isDirectoryFieldLabel(t)) return t;
    }
    const ranges = headline.ranges;
    if (Array.isArray(ranges)) {
      for (const r of ranges) {
        const ent = r?.entity;
        if (ent && (ent.__typename === 'Page' || ent.category_type)) {
          const cat = String(ent.category_type || '');
          if (cat.includes('CITY') || cat === 'CITY_WITH_ID' || /city/i.test(cat)) {
            const fromUrl =
              this._cityFromFacebookPlaceUrl(ent.url || ent.comet_url || ent.profile_url || ent.mobileUrl);
            if (fromUrl) return fromUrl;
          }
        }
        const rt = r?.text;
        if (typeof rt === 'string') {
          const u = rt.trim();
          if (u && !this._isDirectoryFieldLabel(u)) return u;
        }
      }
    }
    return '';
  },

  /** `post_click_content_section` (dialog đầy đủ). */
  _extractCityFromPostClickSection(pcs) {
    if (!pcs || typeof pcs !== 'object') return '';
    let t = this._extractCityFromHeadlineObject(pcs.headline);
    if (t) return t;
    const hs = pcs.header_section?.headline?.text;
    if (typeof hs === 'string') {
      const u = hs.trim();
      if (u && !this._isDirectoryFieldLabel(u)) return u;
    }
    return '';
  },

  /**
   * Một `post_click_content_section_renderer` — có thể là:
   * - `content.post_click_content_section` (HAR cũ)
   * - `context.headline` (Comet — DevTools: renderer → context → headline.text)
   */
  _extractCityFromPostClickRenderer(renderer) {
    if (!renderer || typeof renderer !== 'object') return '';
    const pcs = renderer.content?.post_click_content_section;
    let t = this._extractCityFromPostClickSection(pcs);
    if (t) return t;
    const ctx = renderer.context;
    if (ctx && typeof ctx === 'object') {
      t = this._extractCityFromHeadlineObject(ctx.headline);
      if (t) return t;
    }
    return '';
  },

  _hasProfileDirectoryPayload(pdc) {
    if (pdc == null) return false;
    if (Array.isArray(pdc)) return pdc.length > 0;
    return typeof pdc === 'object';
  },

  /** Bóc thành phố từ `profile_directory_content` (mảng hoặc object). */
  _extractCityFromProfileDirectoryContent(pdc) {
    if (!this._hasProfileDirectoryPayload(pdc)) return '';
    try {
      if (Array.isArray(pdc)) {
        for (const block of pdc) {
          if (!block || typeof block !== 'object') continue;
          const r = block.post_click_content_section_renderer;
          let t = this._extractCityFromPostClickRenderer(r);
          if (t) return t;
        }
        return '';
      }
      if (typeof pdc === 'object') {
        let t = this._extractCityFromPostClickRenderer(pdc.post_click_content_section_renderer);
        if (t) return t;
      }
    } catch (_) {
      /* ignore */
    }
    return '';
  },

  _extractCityFromDirectoryGraphql(data) {
    try {
      const pdc = data?.data?.user?.profile_directory_content;
      return this._extractCityFromProfileDirectoryContent(pdc);
    } catch (_) {
      /* ignore */
    }
    return '';
  },

  _deepFindKey(obj, key, maxDepth) {
    if (maxDepth <= 0 || obj == null || typeof obj !== 'object') return undefined;
    if (Object.prototype.hasOwnProperty.call(obj, key)) return obj[key];
    if (Array.isArray(obj)) {
      for (const it of obj) {
        const f = this._deepFindKey(it, key, maxDepth - 1);
        if (f !== undefined) return f;
      }
      return undefined;
    }
    for (const k of Object.keys(obj)) {
      const f = this._deepFindKey(obj[k], key, maxDepth - 1);
      if (f !== undefined) return f;
    }
    return undefined;
  },

  _collectPostClickRenderers(obj, depth, out) {
    if (depth > 18 || !obj || typeof obj !== 'object') return;
    if (obj.post_click_content_section_renderer) {
      out.push(obj.post_click_content_section_renderer);
    }
    if (Array.isArray(obj)) {
      for (const it of obj) this._collectPostClickRenderers(it, depth + 1, out);
    } else {
      for (const k of Object.keys(obj)) {
        this._collectPostClickRenderers(obj[k], depth + 1, out);
      }
    }
  },

  /** Facebook đôi khi lồng `profile_directory_content` / renderer chỗ khác `data.user`. */
  _extractCityFromDirectoryDeepScan(dataRoot) {
    if (!dataRoot || typeof dataRoot !== 'object') return '';
    const pdc = this._deepFindKey(dataRoot, 'profile_directory_content', 14);
    if (pdc != null) {
      const t = this._extractCityFromProfileDirectoryContent(pdc);
      if (t) return t;
    }
    const renderers = [];
    this._collectPostClickRenderers(dataRoot, 0, renderers);
    for (const r of renderers) {
      const t = this._extractCityFromPostClickRenderer(r);
      if (t) return t;
    }
    return '';
  },

  _decodeGraphqlEscapedString(s) {
    if (!s || typeof s !== 'string') return '';
    let v = String(s);
    v = v.replace(/\\u([0-9a-fA-F]{4})/g, (_, hx) => String.fromCharCode(parseInt(hx, 16)));
    v = v.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
    return v.trim();
  },

  /** Khi cấu trúc Relay đổi, vẫn có thể bóc từ chuỗi phản hồi thô. */
  _extractCityFromGraphqlResponseText(text) {
    if (!text || typeof text !== 'string') return '';
    const slice = text.length > 2500000 ? text.slice(0, 2500000) : text;
    const patterns = [
      /"profileFieldType"\s*:\s*"CURRENT_CITY"[\s\S]{0,42000}?"text"\s*:\s*"((?:[^"\\]|\\.)*)"/,
      /CURRENT_CITY[\s\S]{0,22000}?"headline"\s*:\s*\{[\s\S]{0,6000}?"text"\s*:\s*"((?:[^"\\]|\\.)*)"/,
      /CURRENT_CITY[\s\S]{0,22000}?"text"\s*:\s*"((?:[^"\\]|\\.)*)"/,
      /"current_city"\s*:\s*\{[\s\S]{0,8000}?"name"\s*:\s*"((?:[^"\\]|\\.)*)"/,
      /"living_location"\s*:\s*\{[\s\S]{0,8000}?"name"\s*:\s*"((?:[^"\\]|\\.)*)"/,
      /"viewer_current_city"\s*:\s*\{[\s\S]{0,6000}?"name"\s*:\s*"((?:[^"\\]|\\.)*)"/
    ];
    for (const re of patterns) {
      const m = slice.match(re);
      if (m && m[1]) {
        const v = this._decodeGraphqlEscapedString(m[1]);
        if (v.length >= 2 && v.length < 200 && !this._isDirectoryFieldLabel(v)) return v;
      }
    }
    return '';
  },

  async fetchProfileCurrentCityDirectory(profileId) {
    let lastErr = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        if (attempt > 0 && typeof PushGroupAuth.invalidateLsdCache === 'function') {
          PushGroupAuth.invalidateLsdCache();
          await new Promise((r) => setTimeout(r, 350 * attempt));
        }
        return await this._fetchProfileCurrentCityDirectoryOnce(profileId);
      } catch (e) {
        lastErr = e;
        const msg = String(e?.message || e);
        if (/RATE_LIMIT/i.test(msg)) throw e;
      }
    }
    throw lastErr || new Error('GraphQL khu vực thất bại');
  },

  async _fetchProfileCurrentCityDirectoryOnce(profileId) {
    const { fbDtsg, userId } = PushGroupAuth.getAuth();
    if (!fbDtsg || !userId) throw new Error('Không lấy được fb_dtsg / user.');
    let rp = PushGroupAuth.getRequestParams();
    let lsd = rp.lsd ? String(rp.lsd) : '';
    if (lsd.length < 8 && typeof PushGroupAuth.ensureLsdAsync === 'function') {
      lsd = await PushGroupAuth.ensureLsdAsync();
    }
    if (lsd.length < 8 && typeof PushGroupAuth.fetchLsdFromPageAsync === 'function') {
      lsd = await PushGroupAuth.fetchLsdFromPageAsync();
    }
    if (!lsd || lsd.length < 8) throw new Error('Thiếu lsd — hãy tải lại trang nhóm hoặc cuộn trang để Facebook gửi GraphQL.');
    rp = { ...rp, lsd };
    const jazoest = rp.jazoest || PushGroupAuth.generateJazoest(fbDtsg);
    const variables = {
      profileFieldType: 'CURRENT_CITY',
      profileID: String(profileId),
      scale: 1
    };
    const params = new URLSearchParams({
      av: String(userId),
      __aaid: rp.__aaid || '0',
      __user: String(userId),
      __a: '1',
      __req: rp.__req || '0',
      __hs: rp.__hs || '',
      dpr: rp.dpr || '1',
      __ccg: rp.__ccg || 'EXCELLENT',
      __rev: rp.__rev || '',
      __s: rp.__s || '',
      __hsi: rp.__hsi || '',
      __dyn: rp.__dyn || '',
      __csr: rp.__csr || '',
      __comet_req: rp.__comet_req || '15',
      fb_dtsg: fbDtsg,
      jazoest,
      lsd: rp.lsd || '',
      __spin_r: rp.__spin_r || rp.__rev || '',
      __spin_b: rp.__spin_b || 'trunk',
      __spin_t: rp.__spin_t || '',
      fb_api_caller_class: 'RelayModern',
      fb_api_req_friendly_name: FB_FRIENDLY_PROFILE_DIRECTORY_POST_CLICK,
      variables: JSON.stringify(variables),
      server_timestamps: 'true',
      doc_id: DOC_ID_PROFILE_DIRECTORY_POST_CLICK
    });
    const resp = await fetch(ztGetFacebookGraphqlUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest',
        'x-fb-friendly-name': FB_FRIENDLY_PROFILE_DIRECTORY_POST_CLICK,
        'x-fb-lsd': rp.lsd || ''
      },
      credentials: 'include',
      body: params.toString()
    });
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    const text = await resp.text();
    const chunks = this._parseMultiResponse(text);
    if (!chunks.length) {
      try {
        chunks.push(this._parseResponse(text));
      } catch (_) {
        throw new Error('Không parse được JSON GraphQL');
      }
    }

    for (const ch of chunks) {
      const list = ch?.errors || [];
      for (const e of list) {
        if (/rate|limit|throttle/i.test(String(e?.message || ''))) throw new Error('RATE_LIMIT');
      }
    }

    let city = '';
    for (const chunk of chunks) {
      city =
        this._extractCityFromDirectoryGraphql(chunk) ||
        this._extractCityFromDirectoryDeepScan(chunk?.data);
      if (city) break;
    }
    if (!city) {
      city = this._extractCityFromGraphqlResponseText(text);
    }

    if (city) return city;

    const mergedErrs = chunks.flatMap((c) => c?.errors || []).filter(Boolean);
    if (mergedErrs.length) {
      const msg = mergedErrs.map((e) => e.message || '').join('; ');
      if (/rate|limit|throttle/i.test(msg)) throw new Error('RATE_LIMIT');
    }

    return '';
  },

  /**
   * Bóc chuỗi ngày sinh từ GraphQL Directory (vd. «18 tháng 8, 1996») → chỉ năm.
   */
  _extractBirthdayRawFromGraphqlResponseText(text) {
    if (!text || typeof text !== 'string') return '';
    const slice = text.length > 2500000 ? text.slice(0, 2500000) : text;
    const patterns = [
      /"profileFieldType"\s*:\s*"BIRTHDAY"[\s\S]{0,52000}?"text"\s*:\s*"((?:[^"\\]|\\.)*)"/,
      /BIRTHDAY[\s\S]{0,26000}?"headline"\s*:\s*\{[\s\S]{0,6000}?"text"\s*:\s*"((?:[^"\\]|\\.)*)"/,
      /BIRTHDAY[\s\S]{0,26000}?"text"\s*:\s*"((?:[^"\\]|\\.)*)"/,
      /"feature_surface"\s*:\s*"birthdays"[\s\S]{0,12000}?"text"\s*:\s*"((?:[^"\\]|\\.)*)"/i
    ];
    for (const re of patterns) {
      const m = slice.match(re);
      if (m && m[1]) {
        const v = this._decodeGraphqlEscapedString(m[1]);
        if (v.length >= 2 && v.length < 200) return v.trim();
      }
    }
    return '';
  },

  /** Chuỗi hiển thị Facebook → năm sinh (4 chữ số), hoặc null. */
  parseBirthYearFromDisplay(raw) {
    if (raw == null) return null;
    const s = String(raw).trim();
    if (!s) return null;
    if (/^\d{4}$/.test(s)) {
      const y = parseInt(s, 10);
      return y >= 1900 && y <= 2099 ? y : null;
    }
    const years = s.match(/\b(19|20)\d{2}\b/g);
    if (!years || !years.length) return null;
    const y = parseInt(years[years.length - 1], 10);
    return y >= 1900 && y <= 2099 ? y : null;
  },

  computeAgeFromBirthYear(year) {
    if (year == null || typeof year !== 'number') return null;
    const cy = new Date().getFullYear();
    const a = cy - year;
    if (a < 0 || a > 120) return null;
    return a;
  },

  async fetchProfileBirthdayDirectory(profileId) {
    let lastErr = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        if (attempt > 0 && typeof PushGroupAuth.invalidateLsdCache === 'function') {
          PushGroupAuth.invalidateLsdCache();
          await new Promise((r) => setTimeout(r, 350 * attempt));
        }
        return await this._fetchProfileBirthdayDirectoryOnce(profileId);
      } catch (e) {
        lastErr = e;
        const msg = String(e?.message || e);
        if (/RATE_LIMIT/i.test(msg)) throw e;
      }
    }
    throw lastErr || new Error('GraphQL ngày sinh thất bại');
  },

  /**
   * Ngày sinh — **cùng** operation với khu vực: `ProfileCometDirectoryPostClickDialogQuery` + `profileFieldType: BIRTHDAY`
   * (HAR `tuoi profile.har`). Không dùng `RootClick…` — Facebook trả lỗi «document … not found».
   */
  async _fetchProfileBirthdayDirectoryOnce(profileId) {
    const { fbDtsg, userId } = PushGroupAuth.getAuth();
    if (!fbDtsg || !userId) throw new Error('Không lấy được fb_dtsg / user.');
    let rp = PushGroupAuth.getRequestParams();
    let lsd = rp.lsd ? String(rp.lsd) : '';
    if (lsd.length < 8 && typeof PushGroupAuth.ensureLsdAsync === 'function') {
      lsd = await PushGroupAuth.ensureLsdAsync();
    }
    if (lsd.length < 8 && typeof PushGroupAuth.fetchLsdFromPageAsync === 'function') {
      lsd = await PushGroupAuth.fetchLsdFromPageAsync();
    }
    if (!lsd || lsd.length < 8) throw new Error('Thiếu lsd — hãy tải lại trang nhóm hoặc cuộn trang để Facebook gửi GraphQL.');
    rp = { ...rp, lsd };
    const jazoest = rp.jazoest || PushGroupAuth.generateJazoest(fbDtsg);
    const variables = {
      profileFieldType: 'BIRTHDAY',
      profileID: String(profileId),
      scale: 1
    };
    const params = new URLSearchParams({
      av: String(userId),
      __aaid: rp.__aaid || '0',
      __user: String(userId),
      __a: '1',
      __req: rp.__req || '0',
      __hs: rp.__hs || '',
      dpr: rp.dpr || '1',
      __ccg: rp.__ccg || 'EXCELLENT',
      __rev: rp.__rev || '',
      __s: rp.__s || '',
      __hsi: rp.__hsi || '',
      __dyn: rp.__dyn || '',
      __csr: rp.__csr || '',
      __comet_req: rp.__comet_req || '15',
      fb_dtsg: fbDtsg,
      jazoest,
      lsd: rp.lsd || '',
      __spin_r: rp.__spin_r || rp.__rev || '',
      __spin_b: rp.__spin_b || 'trunk',
      __spin_t: rp.__spin_t || '',
      fb_api_caller_class: 'RelayModern',
      fb_api_req_friendly_name: FB_FRIENDLY_PROFILE_DIRECTORY_POST_CLICK,
      variables: JSON.stringify(variables),
      server_timestamps: 'true',
      doc_id: DOC_ID_PROFILE_DIRECTORY_POST_CLICK
    });
    const resp = await fetch(ztGetFacebookGraphqlUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest',
        'x-fb-friendly-name': FB_FRIENDLY_PROFILE_DIRECTORY_POST_CLICK,
        'x-fb-lsd': rp.lsd || ''
      },
      credentials: 'include',
      body: params.toString()
    });
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    const text = await resp.text();
    const chunks = this._parseMultiResponse(text);
    if (!chunks.length) {
      try {
        chunks.push(this._parseResponse(text));
      } catch (_) {
        throw new Error('Không parse được JSON GraphQL');
      }
    }

    for (const ch of chunks) {
      const list = ch?.errors || [];
      for (const e of list) {
        if (/rate|limit|throttle/i.test(String(e?.message || ''))) throw new Error('RATE_LIMIT');
      }
    }

    let raw = '';
    for (const chunk of chunks) {
      raw =
        this._extractBirthdayRawFromDirectoryGraphql(chunk) ||
        this._extractBirthdayRawFromDirectoryDeepScan(chunk?.data);
      if (raw) break;
    }
    if (!raw) {
      raw = this._extractBirthdayRawFromGraphqlResponseText(text);
    }

    if (raw) return raw;

    const mergedErrs = chunks.flatMap((c) => c?.errors || []).filter(Boolean);
    if (mergedErrs.length) {
      const msg = mergedErrs.map((e) => e.message || '').join('; ');
      if (/rate|limit|throttle/i.test(msg)) throw new Error('RATE_LIMIT');
    }

    return '';
  },

  _extractBirthdayRawFromDirectoryGraphql(data) {
    try {
      const pdc = data?.data?.user?.profile_directory_content;
      const t = this._extractBirthdayFromProfileDirectoryContent(pdc);
      if (t) return t;
    } catch (_) {
      /* ignore */
    }
    return '';
  },

  _extractBirthdayFromProfileDirectoryContent(pdc) {
    if (!this._hasProfileDirectoryPayload(pdc)) return '';
    try {
      if (Array.isArray(pdc)) {
        for (const block of pdc) {
          if (!block || typeof block !== 'object') continue;
          const r = block.post_click_content_section_renderer;
          const t = this._extractBirthdayFromPostClickRenderer(r);
          if (t) return t;
        }
        return '';
      }
      if (typeof pdc === 'object') {
        return this._extractBirthdayFromPostClickRenderer(pdc.post_click_content_section_renderer);
      }
    } catch (_) {
      /* ignore */
    }
    return '';
  },

  _extractBirthdayFromPostClickRenderer(renderer) {
    if (!renderer || typeof renderer !== 'object') return '';
    const pcs = renderer.content?.post_click_content_section;
    let t = this._extractBirthdayFromPostClickSection(pcs);
    if (t) return t;
    const ctx = renderer.context;
    if (ctx && typeof ctx === 'object') {
      t = this._extractBirthdayFromHeadlineObject(ctx.headline);
      if (t) return t;
    }
    return '';
  },

  _extractBirthdayFromPostClickSection(pcs) {
    if (!pcs || typeof pcs !== 'object') return '';
    let t = this._extractBirthdayFromHeadlineObject(pcs.headline);
    if (t) return t;
    const hs = pcs.header_section?.headline?.text;
    if (typeof hs === 'string') {
      const u = hs.trim();
      if (u && !this._isBirthdayFieldLabel(u)) return u;
    }
    return '';
  },

  _isBirthdayFieldLabel(s) {
    const t = String(s || '').trim();
    if (t.length < 2) return true;
    return /^(Ngày sinh|Birthday|Date of birth|Birth)$/i.test(t);
  },

  _extractBirthdayFromHeadlineObject(headline) {
    if (!headline || typeof headline !== 'object') return '';
    let t = headline.text;
    if (typeof t === 'string') {
      t = t.trim();
      if (t && !this._isBirthdayFieldLabel(t)) return t;
    }
    const ranges = headline.ranges;
    if (Array.isArray(ranges)) {
      for (const r of ranges) {
        const rt = r?.text;
        if (typeof rt === 'string') {
          const u = rt.trim();
          if (u && !this._isBirthdayFieldLabel(u)) return u;
        }
      }
    }
    return '';
  },

  _extractBirthdayRawFromDirectoryDeepScan(dataRoot) {
    if (!dataRoot || typeof dataRoot !== 'object') return '';
    const pdc = this._deepFindKey(dataRoot, 'profile_directory_content', 14);
    if (pdc != null) {
      const t = this._extractBirthdayFromProfileDirectoryContent(pdc);
      if (t) return t;
    }
    const renderers = [];
    this._collectPostClickRenderers(dataRoot, 0, renderers);
    for (const r of renderers) {
      const t = this._extractBirthdayFromPostClickRenderer(r);
      if (t) return t;
    }
    return '';
  },

  _feedbackB64Legacy(postId) {
    const s = 'feedback:' + String(postId);
    try {
      return btoa(unescape(encodeURIComponent(s)));
    } catch (_) {
      return btoa(s);
    }
  },

  _feedbackB64Gid(postId) {
    const n = String(postId).replace(/\D/g, '');
    if (!n) return this._feedbackB64Legacy(postId);
    const s = 'gid://facebook/Feedback/' + n;
    try {
      return btoa(unescape(encodeURIComponent(s)));
    } catch (_) {
      return btoa(s);
    }
  },

  _decodeFeedbackIdToPostId(fid) {
    if (!fid || typeof fid !== 'string') return '';
    try {
      const bin = atob(fid.replace(/-/g, '+').replace(/_/g, '/'));
      const dec = decodeURIComponent(escape(bin));
      const m = dec.match(/feedback:(\d+)/i) || dec.match(/Feedback\/(\d+)/i);
      return m ? m[1] : '';
    } catch (_) {
      return '';
    }
  },

  _deepFindFirst(obj, key, depth) {
    if (depth <= 0 || obj == null || typeof obj !== 'object') return undefined;
    if (Object.prototype.hasOwnProperty.call(obj, key)) return obj[key];
    if (Array.isArray(obj)) {
      for (const it of obj) {
        const f = this._deepFindFirst(it, key, depth - 1);
        if (f !== undefined) return f;
      }
      return undefined;
    }
    for (const k of Object.keys(obj)) {
      const f = this._deepFindFirst(obj[k], key, depth - 1);
      if (f !== undefined) return f;
    }
    return undefined;
  },

  _parseStoryFeedUnit(node, profileIdStr) {
    if (!node || typeof node !== 'object') return null;
    const fid = node.feedback && node.feedback.id ? String(node.feedback.id) : '';
    let postId =
      node.post_id != null
        ? String(node.post_id).replace(/\D/g, '')
        : this._deepFindFirst(node, 'post_id', 12);
    if (postId && typeof postId !== 'string') postId = String(postId).replace(/\D/g, '');
    if (!postId && fid) postId = this._decodeFeedbackIdToPostId(fid);
    if (!postId) {
      const legacy = this._deepFindFirst(node, 'legacy_story_hideable_id', 8);
      if (legacy != null) postId = String(legacy).replace(/\D/g, '');
    }
    const url = node.url || node.post_permalink_url || node.shareable_url || '';
    const urlStr = typeof url === 'string' ? url : '';
    if (!postId && urlStr) {
      const pf = urlStr.match(/posts\/(pfbid[a-zA-Z0-9_-]+)/);
      if (pf) postId = pf[1];
    }
    if (!postId && urlStr) {
      const mm = urlStr.match(/posts\/(\d{5,20})(?:[/?#]|$)/);
      if (mm) postId = mm[1];
    }
    if (!fid) return null;
    if (!postId) {
      postId = 'fb_' + fid.replace(/[^a-zA-Z0-9]/g, '').slice(-40);
    }
    return { postId, feedbackIdB64: fid, url: urlStr };
  },

  _findTimelineListFeedConnection(node) {
    if (!node || typeof node !== 'object') return null;
    const keys = [
      'timeline_list_feed_units',
      'timeline_list_units',
      'profile_connection_timeline_list_feed_units'
    ];
    for (let i = 0; i < keys.length; i++) {
      const c = node[keys[i]];
      if (c && Array.isArray(c.edges)) return c;
    }
    if (node.profile_timeline && typeof node.profile_timeline === 'object') {
      return this._findTimelineListFeedConnection(node.profile_timeline);
    }
    return null;
  },

  _normalizeTimelinePageInfo(tlfu) {
    if (!tlfu || typeof tlfu !== 'object') return null;
    const pi = tlfu.page_info || tlfu.pageInfo;
    if (!pi || typeof pi !== 'object') return null;
    const end =
      pi.end_cursor != null && String(pi.end_cursor).length > 0
        ? String(pi.end_cursor)
        : pi.endCursor != null && String(pi.endCursor).length > 0
          ? String(pi.endCursor)
          : '';
    const hasMore =
      pi.has_next_page === true || pi.hasNextPage === true || !!end;
    return { end_cursor: end, hasMore };
  },

  _mergeTimelinePostsFromChunks(chunks, profileIdStr) {
    const posts = [];
    const seen = new Set();
    let nextCursor = null;
    let hasMore = false;
    let lastEdgeCursor = '';
    for (const chunk of chunks) {
      const node = chunk?.data?.node;
      if (!node) continue;
      const tlfu = this._findTimelineListFeedConnection(node);
      if (!tlfu) continue;
      const edges = tlfu.edges || [];
      for (let ei = 0; ei < edges.length; ei++) {
        const edge = edges[ei];
        if (edge && edge.cursor && String(edge.cursor).length > 4) {
          lastEdgeCursor = String(edge.cursor);
        }
        const parsed = this._parseStoryFeedUnit(edge?.node, profileIdStr);
        if (!parsed || seen.has(parsed.postId)) continue;
        seen.add(parsed.postId);
        posts.push(parsed);
      }
      const norm = this._normalizeTimelinePageInfo(tlfu);
      if (norm) {
        if (norm.end_cursor) nextCursor = norm.end_cursor;
        hasMore = hasMore || norm.hasMore;
      }
    }
    if (!nextCursor && lastEdgeCursor) {
      nextCursor = lastEdgeCursor;
      hasMore = true;
    }
    return { posts, nextCursor, hasMore };
  },

  async fetchProfileTimelinePage(profileId, cursor, count) {
    const { fbDtsg, userId } = PushGroupAuth.getAuth();
    console.log('[TienHouse] Timeline getAuth →', { fbDtsg: fbDtsg ? '✓' : '✗', userId });
    if (!fbDtsg || !userId) throw new Error('Không lấy được token. Hãy refresh trang.');
    let rp = PushGroupAuth.getRequestParams();
    if (!rp.lsd || rp.lsd.length < 8) {
      if (typeof PushGroupAuth.ensureLsdAsync === 'function') {
        const lsd = await PushGroupAuth.ensureLsdAsync();
        if (lsd) rp = { ...rp, lsd };
      } else if (typeof PushGroupAuth.fetchLsdFromPageAsync === 'function') {
        const lsd = await PushGroupAuth.fetchLsdFromPageAsync();
        if (lsd) rp = { ...rp, lsd };
      }
    }
    console.log('[TienHouse] Timeline lsd →', rp.lsd ? '✓' : '✗');
    const jazoest = rp.jazoest || PushGroupAuth.generateJazoest(fbDtsg);
    const pid = String(profileId);
    /** HAR profile: count 3–15 mỗi lần, stream_count luôn 1 — không gộp stream_count = count (API trả ít bài / lỗi). */
    const pageSize = Math.min(15, Math.max(3, count || 8));
    const hasCursor = !!(cursor && String(cursor).trim());
    const variables = {
      afterTime: null,
      beforeTime: null,
      count: pageSize,
      cursor: hasCursor ? String(cursor) : null,
      feedLocation: 'TIMELINE',
      feedbackSource: 0,
      focusCommentID: null,
      memorializedSplitTimeFilter: null,
      omitPinnedPost: true,
      postedBy: null,
      privacy: null,
      privacySelectorRenderLocation: 'COMET_STREAM',
      referringStoryRenderLocation: null,
      renderLocation: 'timeline',
      scale: 1,
      stream_count: 1,
      taggedInOnly: null,
      trackingCode: null,
      useDefaultActor: false,
      id: pid
    };
    /** HAR `quet bai viet profile2.har`: mọi lần (kể cả có cursor) đều dùng RefetchQuery — PaginationQuery doc khác dễ trả page_info sai. */
    const DOC_REFETCH = '26823446043957791';

    const self = this;
    async function runGraphql(friendlyName, docId) {
      const params = new URLSearchParams({
        av: String(userId),
        __aaid: rp.__aaid || '0',
        __user: String(userId),
        __a: '1',
        __req: rp.__req || '0',
        __hs: rp.__hs || '',
        dpr: rp.dpr || '1',
        __ccg: rp.__ccg || 'EXCELLENT',
        __rev: rp.__rev || '',
        __s: rp.__s || '',
        __hsi: rp.__hsi || '',
        __dyn: rp.__dyn || '',
        __csr: rp.__csr || '',
        __comet_req: rp.__comet_req || '15',
        fb_dtsg: fbDtsg,
        jazoest,
        lsd: rp.lsd || '',
        __spin_r: rp.__spin_r || rp.__rev || '',
        __spin_b: rp.__spin_b || 'trunk',
        __spin_t: rp.__spin_t || '',
        __crn: 'comet.fbweb.CometProfileTimelineListViewRoute',
        fb_api_caller_class: 'RelayModern',
        fb_api_req_friendly_name: friendlyName,
        variables: JSON.stringify(variables),
        server_timestamps: 'true',
        doc_id: docId
      });
      const resp = await fetch(ztGetFacebookGraphqlUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'X-Requested-With': 'XMLHttpRequest',
          'x-fb-friendly-name': friendlyName,
          'x-fb-lsd': rp.lsd || '',
          'x-asbd-id': '359341'
        },
        credentials: 'include',
        body: params.toString()
      });
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      const text = await resp.text();
      console.log('[TienHouse] Timeline response length:', text.length);
      const chunks = self._parseMultiResponse(text);
      if (!chunks.length) {
        try {
          chunks.push(self._parseResponse(text));
        } catch (_) {
          throw new Error('Không parse được JSON timeline');
        }
      }
      for (let i = 0; i < chunks.length; i++) {
        const errs = chunks[i]?.errors || [];
        const rateLimit = errs.some(
          (e) => e.code === 1675004 || String(e.message || '').toLowerCase().includes('rate limit')
        );
        if (rateLimit) throw new Error('RATE_LIMIT_EXCEEDED');
        if (errs.length > 0) {
          console.warn('[TienHouse] Timeline GraphQL error:', errs[0].message);
        }
      }
      const res = self._mergeTimelinePostsFromChunks(chunks, pid);
      if (res.posts.length === 0 && text.includes('login')) {
         throw new Error('Phiên hết hạn (login required). Hãy F5 trang.');
      }
      return res;
    }

    const merged = await runGraphql('ProfileCometTimelineFeedRefetchQuery', DOC_REFETCH);

    console.info(
      '[ZT] Timeline GraphQL · UID:',
      pid,
      '| số bài:',
      (merged.posts && merged.posts.length) || 0,
      '| hasMore:',
      !!merged.hasMore
    );
    return merged;
  },

  /**
   * GET permalink bài (cùng cookie) — bóc feedbackTargetID / post_id trong HTML như khi mở trang bài trong trình duyệt.
   * @param {string} permalink
   * @returns {Promise<{ feedbackB64: string, numericPostId: string }>}
   */
  async _extractFeedbackFromPostHtml(permalink) {
    const raw = String(permalink || '').trim();
    if (!raw) return { feedbackB64: '', numericPostId: '' };
    const u0 = raw.split('?')[0].split('#')[0];
    const u = u0.startsWith('/') ? ztGetFacebookOriginForGraph() + u0 : u0;
    if (!/facebook\.com\//i.test(u)) return { feedbackB64: '', numericPostId: '' };
    let html = '';
    try {
      const resp = await fetch(u, { credentials: 'include', redirect: 'follow' });
      if (!resp.ok) return { feedbackB64: '', numericPostId: '' };
      html = await resp.text();
    } catch (_) {
      return { feedbackB64: '', numericPostId: '' };
    }
    if (!html || html.length < 400) return { feedbackB64: '', numericPostId: '' };
    console.info('[ZT] Fallback HTML permalink (độ dài HTML):', html.length, '| URL:', u);
    const slice = html.length > 650000 ? html.slice(0, 650000) : html;
    let feedbackB64 = '';
    const fbPatterns = [
      /feedbackTargetID["']:\s*["']([A-Za-z0-9+/=_-]{24,})["']/,
      /"feedbackID"\s*:\s*"([A-Za-z0-9+/=_-]{24,})"/,
      /"top_level_feedback_id"\s*:\s*"([A-Za-z0-9+/=_-]{24,})"/,
      /"feedback_id"\s*:\s*"([A-Za-z0-9+/=_-]{24,})"/i
    ];
    for (const re of fbPatterns) {
      const m = slice.match(re);
      if (m && m[1] && m[1].length > 20) {
        feedbackB64 = m[1];
        break;
      }
    }
    let numericPostId = '';
    const idPatterns = [
      /"post_id"\s*:\s*"(\d{5,20})"/,
      /"story_id"\s*:\s*"(\d{5,20})"/,
      /legacy_story_hideable_id["']:\s*"?(\d{5,20})"?/
    ];
    for (const re of idPatterns) {
      const m = slice.match(re);
      if (m && m[1]) {
        numericPostId = m[1];
        break;
      }
    }
    console.info(
      '[ZT] Kết quả bóc HTML:',
      feedbackB64 ? 'feedbackB64=' + String(feedbackB64).slice(0, 28) + '…' : 'không có',
      '| post_id số:',
      numericPostId || '(không)'
    );
    return { feedbackB64, numericPostId };
  },

  _filterReactorUid(node, ownerId) {
    if (!node || typeof node !== 'object') return null;
    const uid = node.id != null ? String(node.id).replace(/\D/g, '') : '';
    if (!uid || (ownerId && uid === String(ownerId))) return null;
    const name = node.name != null ? String(node.name) : '';
    if (
      name === 'Người dùng Facebook' ||
      name === 'Facebook User' ||
      name === 'facebook user' ||
      name === 'FB User'
    ) {
      return null;
    }
    return uid;
  },

  async _fetchPostReactorsGraphqlAttempt(postId, feedbackB64, cursor, docId, friendlyName, refererUrl) {
    const { fbDtsg, userId } = PushGroupAuth.getAuth();
    if (!fbDtsg || !userId) throw new Error('Không lấy được fb_dtsg / user.');
    let rp = PushGroupAuth.getRequestParams();
    if (!rp.lsd || rp.lsd.length < 8) {
      if (typeof PushGroupAuth.ensureLsdAsync === 'function') rp = { ...rp, lsd: await PushGroupAuth.ensureLsdAsync() };
    }
    const jazoest = rp.jazoest || PushGroupAuth.generateJazoest(fbDtsg);
    const fid = feedbackB64;
    const doc = String(docId || '25576256592037408');
    const fn = String(friendlyName || 'CometUFIReactionsDialogTabContentRefetchQuery');
    const ref =
      String(refererUrl || '').trim() ||
      (typeof location !== 'undefined' && location.href
        ? location.href.split('#')[0].split('?')[0]
        : ztGetFacebookOriginForGraph() + '/');
    const isFirstPage = cursor == null || cursor === '';
    const variables = {
      count: isFirstPage ? 10 : 50,
      cursor: cursor || null,
      feedbackTargetID: fid,
      reactionID: null,
      scale: 1,
      id: fid
    };
    const params = new URLSearchParams({
      av: String(userId),
      __aaid: rp.__aaid || '0',
      __user: String(userId),
      __a: '1',
      __req: rp.__req || '0',
      __hs: rp.__hs || '',
      dpr: rp.dpr || '1',
      __ccg: rp.__ccg || 'EXCELLENT',
      __rev: rp.__rev || '',
      __s: rp.__s || '',
      __hsi: rp.__hsi || '',
      __dyn: rp.__dyn || '',
      __csr: rp.__csr || '',
      __comet_req: rp.__comet_req || '15',
      fb_dtsg: fbDtsg,
      jazoest,
      lsd: rp.lsd || '',
      __spin_r: rp.__spin_r || rp.__rev || '',
      __spin_b: rp.__spin_b || 'trunk',
      __spin_t: rp.__spin_t || '',
      fb_api_caller_class: 'RelayModern',
      fb_api_req_friendly_name: fn,
      variables: JSON.stringify(variables),
      server_timestamps: 'true',
      doc_id: doc
    });
    const resp = await fetch(ztGetFacebookGraphqlUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest',
        'x-fb-friendly-name': fn,
        'x-fb-lsd': rp.lsd || '',
        Referer: ref,
        Origin: ztGetFacebookOriginForGraph(),
        'x-asbd-id': '359341'
      },
      credentials: 'include',
      body: params.toString()
    });
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    const text = await resp.text();
    let json;
    try {
      json = JSON.parse(text.startsWith('for (;;);') ? text.substring(9) : text);
    } catch (_) {
      const chunks = this._parseMultiResponse(text);
      json = chunks[0] || {};
    }
    const errs = json?.errors || [];
    const rateLimit = errs.some(
      (e) => e.code === 1675004 || String(e.message || '').toLowerCase().includes('rate limit')
    );
    if (rateLimit) throw new Error('RATE_LIMIT_EXCEEDED');
    const node = json?.data?.node;
    const edges = node?.reactors?.edges;
    const pageInfo = node?.reactors?.page_info;
    const reactors = [];
    if (Array.isArray(edges)) {
      for (const edge of edges) {
        const u = this._filterReactorUid(edge?.node, null);
        if (u) reactors.push(u);
      }
    }
    const hasMore = !!pageInfo?.has_next_page;
    const nextCursor = pageInfo?.end_cursor || null;
    if (!reactors.length && !hasMore) {
      console.info(
        '[ZT] Reactors GraphQL trả rỗng · feedback:',
        String(fid).slice(0, 36) + '…',
        '| Referer:',
        ref.slice(0, 80) + (ref.length > 80 ? '…' : '')
      );
    } else {
      console.info('[ZT] Reactors · số người:', reactors.length, '| hasMore:', hasMore, '| feedback:', String(fid).slice(0, 24) + '…');
    }
    return { reactors, nextCursor, hasMore, feedbackFid: fid };
  },

  /** Thử RefetchQuery rồi FetchQuery (đúng tên gói khi mở dialog cảm xúc trên trang bài). */
  async _fetchPostReactorsOnce(postId, feedbackB64, cursor, docId, refererUrl) {
    const doc = docId != null ? String(docId) : '25576256592037408';
    const names = [
      'CometUFIReactionsDialogTabContentRefetchQuery',
      'CometUFIReactionsDialogTabContentFetchQuery'
    ];
    let last = { reactors: [], nextCursor: null, hasMore: false, feedbackFid: feedbackB64 };
    for (const fn of names) {
      const one = await this._fetchPostReactorsGraphqlAttempt(
        postId,
        feedbackB64,
        cursor,
        doc,
        fn,
        refererUrl
      );
      last = one;
      if (one.reactors.length || one.hasMore) return one;
    }
    return last;
  },

  async fetchPostReactorsPage(profileOwnerId, postId, feedbackIdB64, cursor, feedbackFidCarry, permalink) {
    const self = this;
    const owner = String(profileOwnerId || '');
    const DOC_ALT = '25376258562857408';
    const hasC = cursor != null && cursor !== '';
    const gid = feedbackIdB64 || this._feedbackB64Gid(postId);
    const legacy = this._feedbackB64Legacy(postId);
    const refererForPost =
      String(permalink || '').trim() ||
      (typeof location !== 'undefined' && location.href
        ? location.href.split('#')[0].split('?')[0]
        : ztGetFacebookOriginForGraph() + '/');

    async function run(fid, cur, docId) {
      const r = await self._fetchPostReactorsOnce(postId, fid, cur, docId, refererForPost);
      const reactors = [];
      for (const uid of r.reactors) {
        if (owner && uid === owner) continue;
        reactors.push(uid);
      }
      return { reactors, nextCursor: r.nextCursor, hasMore: r.hasMore, feedbackFid: r.feedbackFid || fid };
    }

    if (hasC) {
      const fid = feedbackFidCarry || gid;
      let r = await run(fid, cursor, null);
      if (!r.reactors.length && !r.hasMore) {
        r = await run(fid, cursor, DOC_ALT);
      }
      return r;
    }

    console.info(
      '[ZT] → Bước reactors: UID chủ profile (timeline)=',
      owner,
      '| postId=',
      String(postId).slice(0, 56),
      '| feedback (b64 đầu)=',
      String(gid).slice(0, 32) + '…',
      '| Referer=',
      refererForPost.slice(0, 100) + (refererForPost.length > 100 ? '…' : '')
    );
    let r = await run(gid, null, null);
    if (!r.reactors.length && !r.hasMore) {
      let r2 = await run(legacy, null, null);
      if (!r2.reactors.length && !r2.hasMore) {
        r2 = await run(gid, null, DOC_ALT);
        if (!r2.reactors.length && !r2.hasMore) r2 = await run(legacy, null, DOC_ALT);
      }
      if (r2.reactors.length || r2.hasMore) return { ...r2, feedbackFid: r2.feedbackFid || legacy };
    }
    const perm = String(permalink || '').trim();
    if (!r.reactors.length && !r.hasMore && perm) {
      console.info('[ZT] Reactors rỗng — thử fallback HTML permalink…');
      const hints = await self._extractFeedbackFromPostHtml(perm);
      if (hints && hints.feedbackB64) {
        let rh = await run(hints.feedbackB64, null, null);
        if (rh.reactors.length || rh.hasMore) {
          console.info('[ZT] Fallback HTML OK · reactors:', rh.reactors.length);
          return { ...rh, feedbackFid: rh.feedbackFid || hints.feedbackB64 };
        }
        rh = await run(hints.feedbackB64, null, DOC_ALT);
        if (rh.reactors.length || rh.hasMore) {
          console.info('[ZT] Fallback HTML OK (doc alt) · reactors:', rh.reactors.length);
          return { ...rh, feedbackFid: rh.feedbackFid || hints.feedbackB64 };
        }
      }
    }
    console.info('[ZT] ← Kết quả reactors bài này:', r.reactors.length, 'UID (đã trừ chủ profile nếu trùng).');
    return { ...r, feedbackFid: r.feedbackFid || gid };
  },

  _commentRelayDefaults() {
    return {
      __relay_internal__pv__CometUFICommentAutoTranslationTyperelayprovider: 'ORIGINAL',
      __relay_internal__pv__CometUFICommentAvatarStickerAnimatedImagerelayprovider: false,
      __relay_internal__pv__CometUFICommentActionLinksRewriteEnabledrelayprovider: true,
      __relay_internal__pv__IsWorkUserrelayprovider: false
    };
  },

  async _fetchPostCommentsOnce(profileOwnerId, postId, feedbackB64, cursor, docId, refererUrl) {
    const { fbDtsg, userId } = PushGroupAuth.getAuth();
    if (!fbDtsg || !userId) throw new Error('Không lấy được fb_dtsg / user.');
    let rp = PushGroupAuth.getRequestParams();
    if (!rp.lsd || rp.lsd.length < 8) {
      if (typeof PushGroupAuth.ensureLsdAsync === 'function') rp = { ...rp, lsd: await PushGroupAuth.ensureLsdAsync() };
    }
    const jazoest = rp.jazoest || PushGroupAuth.generateJazoest(fbDtsg);
    const ref =
      String(refererUrl || '').trim() ||
      (typeof location !== 'undefined' && location.href
        ? location.href.split('#')[0].split('?')[0]
        : ztGetFacebookOriginForGraph() + '/');
    const hasCursor = cursor != null && cursor !== '';
    const variables = Object.assign(
      {
        commentsAfterCount: hasCursor ? -1 : 50,
        commentsAfterCursor: hasCursor ? cursor : null,
        commentsBeforeCount: null,
        commentsBeforeCursor: null,
        commentsIntentToken: null,
        feedLocation: 'POST_PERMALINK_DIALOG',
        focusCommentID: null,
        scale: 1,
        useDefaultActor: false,
        id: feedbackB64
      },
      this._commentRelayDefaults()
    );
    const params = new URLSearchParams({
      av: String(userId),
      __aaid: rp.__aaid || '0',
      __user: String(userId),
      __a: '1',
      __req: rp.__req || '0',
      __hs: rp.__hs || '',
      dpr: rp.dpr || '1',
      __ccg: rp.__ccg || 'EXCELLENT',
      __rev: rp.__rev || '',
      __s: rp.__s || '',
      __hsi: rp.__hsi || '',
      __dyn: rp.__dyn || '',
      __csr: rp.__csr || '',
      __comet_req: rp.__comet_req || '15',
      fb_dtsg: fbDtsg,
      jazoest,
      lsd: rp.lsd || '',
      __spin_r: rp.__spin_r || rp.__rev || '',
      __spin_b: rp.__spin_b || 'trunk',
      __spin_t: rp.__spin_t || '',
      fb_api_caller_class: 'RelayModern',
      fb_api_req_friendly_name: 'CommentsListComponentsPaginationQuery',
      variables: JSON.stringify(variables),
      server_timestamps: 'true',
      doc_id: String(docId)
    });
    const resp = await fetch(ztGetFacebookGraphqlUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest',
        'x-fb-friendly-name': 'CommentsListComponentsPaginationQuery',
        'x-fb-lsd': rp.lsd || '',
        Referer: ref,
        Origin: ztGetFacebookOriginForGraph(),
        'x-asbd-id': '359341'
      },
      credentials: 'include',
      body: params.toString()
    });
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    const text = await resp.text();
    let json;
    try {
      json = JSON.parse(text.startsWith('for (;;);') ? text.substring(9) : text);
    } catch (_) {
      const chunks = this._parseMultiResponse(text);
      json = chunks[0] || {};
    }
    const errs = json?.errors || [];
    const rateLimit = errs.some(
      (e) => e.code === 1675004 || String(e.message || '').toLowerCase().includes('rate limit')
    );
    if (rateLimit) throw new Error('RATE_LIMIT_EXCEEDED');
    const node = json?.data?.node;
    const comments = node?.comment_rendering_instance_for_feed_location?.comments || node?.comments;
    const edges = comments?.edges;
    const pageInfo = comments?.page_info;
    const commenters = [];
    if (Array.isArray(edges)) {
      for (const edge of edges) {
        const author = edge?.node?.author;
        const uid =
          author && author.id != null ? String(author.id).replace(/\D/g, '') : '';
        if (!uid) continue;
        const name = author.name != null ? String(author.name) : '';
        if (
          name === 'Người dùng Facebook' ||
          name === 'Facebook User' ||
          name === 'facebook user'
        ) {
          continue;
        }
        if (profileOwnerId && uid === String(profileOwnerId)) continue;
        commenters.push(uid);
      }
    }
    const hasMore = !!pageInfo?.has_next_page;
    const nextCursor = pageInfo?.end_cursor || null;
    return { commenters, nextCursor, hasMore, feedbackFid: feedbackB64 };
  },

  async fetchPostCommentsPage(profileOwnerId, postId, feedbackIdB64, cursor, feedbackFidCarry, permalink) {
    const self = this;
    const DOC_PRIMARY = '26233394729665676';
    const DOC_FALLBACK = '26233334723165676';
    const gid = feedbackIdB64 || this._feedbackB64Gid(postId);
    const legacy = this._feedbackB64Legacy(postId);
    const owner = String(profileOwnerId || '');
    const hasC = cursor != null && cursor !== '';
    const refererForPost =
      String(permalink || '').trim() ||
      (typeof location !== 'undefined' && location.href
        ? location.href.split('#')[0].split('?')[0]
        : ztGetFacebookOriginForGraph() + '/');

    if (!hasC) {
      console.info(
        '[ZT] → Comments: UID chủ=',
        owner,
        '| postId=',
        String(postId).slice(0, 48),
        '| Referer=',
        refererForPost.slice(0, 96)
      );
    }

    const tryDoc = async (fid, c, doc) => {
      const r = await self._fetchPostCommentsOnce(owner, postId, fid, c, doc, refererForPost);
      const out = [];
      for (const uid of r.commenters) {
        if (owner && uid === owner) continue;
        out.push(uid);
      }
      return { commenters: out, nextCursor: r.nextCursor, hasMore: r.hasMore, feedbackFid: r.feedbackFid || fid };
    };

    const tryBoth = async (fid, c) => {
      let r = await tryDoc(fid, c, DOC_PRIMARY);
      if (!r.commenters.length && !r.hasMore) {
        const r2 = await tryDoc(fid, c, DOC_FALLBACK);
        if (r2.commenters.length || r2.hasMore) return r2;
      }
      return r;
    };

    if (hasC) {
      const fid = feedbackFidCarry || gid;
      return tryBoth(fid, cursor);
    }

    if (feedbackFidCarry) {
      const rp = await tryBoth(feedbackFidCarry, null);
      if (rp.commenters.length || rp.hasMore) return rp;
    }

    let r = await tryBoth(gid, null);
    if (!r.commenters.length && !r.hasMore) {
      r = await tryBoth(legacy, null);
    }
    const perm = String(permalink || '').trim();
    if (!r.commenters.length && !r.hasMore && perm) {
      const hints = await self._extractFeedbackFromPostHtml(perm);
      if (hints && hints.feedbackB64) {
        const rh = await tryBoth(hints.feedbackB64, null);
        if (rh.commenters.length || rh.hasMore) return rh;
      }
    }
    return r;
  }
};
