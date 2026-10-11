/**
 * Facebook Schema Adapter & Safety Guard (A13)
 * Phân loại phản hồi GraphQL / REST / HTML từ Facebook,
 * phát hiện checkpoint/block/rate-limit để dừng quét an toàn,
 * chống spam và bảo vệ tài khoản người dùng.
 */

const FB_ERROR_TYPES = {
  SUCCESS: 'SUCCESS',
  LOGIN_REQUIRED: 'LOGIN_REQUIRED',
  CHECKPOINT_OR_BLOCKED: 'CHECKPOINT_OR_BLOCKED',
  RATE_LIMITED: 'RATE_LIMITED',
  SCHEMA_MISMATCH: 'SCHEMA_MISMATCH',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
};

function classifyFacebookResponse(rawText, httpStatus = 200) {
  if (httpStatus === 429) {
    return {
      type: FB_ERROR_TYPES.RATE_LIMITED,
      message: 'Facebook đang tạm thời giới hạn tần suất yêu cầu (HTTP 429). Đang tạm dừng để bảo vệ tài khoản.',
      retryable: true
    };
  }

  const text = String(rawText || '').trim();

  // Kiểm tra HTML redirect trang login khi mất phiên hoặc cookie hết hạn
  if (
    text.startsWith('<!DOCTYPE html') ||
    text.includes('login_form') ||
    text.includes('id="loginbutton"') ||
    text.includes('checkpoint/block')
  ) {
    if (text.includes('checkpoint')) {
      return {
        type: FB_ERROR_TYPES.CHECKPOINT_OR_BLOCKED,
        message: 'Tài khoản Facebook bị yêu cầu xác minh bảo mật (Checkpoint). Đã dừng quét an toàn.',
        retryable: false
      };
    }
    return {
      type: FB_ERROR_TYPES.LOGIN_REQUIRED,
      message: 'Phiên đăng nhập Facebook đã hết hạn. Vui lòng đăng nhập lại Facebook trên trình duyệt.',
      retryable: false
    };
  }

  // Parse JSON
  let cleaned = text;
  if (cleaned.startsWith('for (;;);')) cleaned = cleaned.substring(9);

  let payload;
  try {
    payload = JSON.parse(cleaned);
  } catch (_) {
    // Có thể là JSON nhiều dòng
    const lines = cleaned.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('{')) {
        try {
          payload = JSON.parse(trimmed);
          if (payload && (payload.data || payload.errors)) break;
        } catch (_) {}
      }
    }
  }

  if (!payload || typeof payload !== 'object') {
    return {
      type: FB_ERROR_TYPES.SCHEMA_MISMATCH,
      message: 'Không thể phân tích dữ liệu phản hồi từ Facebook.',
      retryable: false
    };
  }

  // Kiểm tra errors array trong GraphQL response
  const errors = Array.isArray(payload.errors) ? payload.errors : [];
  if (errors.length > 0) {
    const firstErr = errors[0] || {};
    const code = Number(firstErr.code || 0);
    const msg = String(firstErr.message || '').toLowerCase();

    // Mã lỗi 368: Facebook Action Blocked / Temporarily Blocked
    if (code === 368 || msg.includes('temporarily blocked') || msg.includes('chặn tạm thời')) {
      return {
        type: FB_ERROR_TYPES.CHECKPOINT_OR_BLOCKED,
        message: 'Facebook thông báo tài khoản đang bị hạn chế thao tác tạm thời (Mã 368). Dừng quét.',
        retryable: false
      };
    }

    // Rate limit GraphQL
    if (code === 1341012 || msg.includes('rate limit') || msg.includes('quá nhiều yêu cầu')) {
      return {
        type: FB_ERROR_TYPES.RATE_LIMITED,
        message: 'Facebook cảnh báo tần suất quét quá nhanh. Vui lòng tăng thời gian chờ.',
        retryable: true
      };
    }

    if (code === 190 || msg.includes('session expired') || msg.includes('hết phiên')) {
      return {
        type: FB_ERROR_TYPES.LOGIN_REQUIRED,
        message: 'Phiên Facebook đã kết thúc. Vui lòng đăng nhập lại.',
        retryable: false
      };
    }

    // Lỗi field_exception của Facebook GraphQL khi đối phương khóa kết bạn / đủ 5000 bạn
    if (msg.includes('field_exception') || msg.includes('field exception') || (msg.includes('server error') && msg.includes('server logs'))) {
      return {
        type: FB_ERROR_TYPES.UNKNOWN_ERROR,
        message: 'Đối phương cài đặt quyền riêng tư không nhận kết bạn từ người lạ (chỉ nhận bạn chung) hoặc đã đủ 5.000 bạn bè.',
        retryable: false
      };
    }

    if (msg.includes('friend limit') || msg.includes('5000')) {
      return {
        type: FB_ERROR_TYPES.UNKNOWN_ERROR,
        message: 'Không thể kết bạn: Đối phương hoặc tài khoản của bạn đã đạt giới hạn tối đa 5.000 bạn bè.',
        retryable: false
      };
    }

    if (msg.includes('cannot_request') || msg.includes('cannot request') || msg.includes('cannot add')) {
      return {
        type: FB_ERROR_TYPES.UNKNOWN_ERROR,
        message: 'Đối phương cài đặt quyền riêng tư không nhận lời mời kết bạn từ người lạ.',
        retryable: false
      };
    }

    return {
      type: FB_ERROR_TYPES.UNKNOWN_ERROR,
      message: firstErr.message || 'Lỗi yêu cầu từ Facebook.',
      retryable: false
    };
  }

  return {
    type: FB_ERROR_TYPES.SUCCESS,
    payload
  };
}

/**
 * Adapter chuẩn hóa danh sách thành viên nhóm
 */
function adaptGroupMembers(payload) {
  const result = { members: [], nextCursor: null, hasNextPage: false };
  if (!payload || !payload.data) return result;

  const groupNode = payload.data.node || payload.data.group;
  const edgeContainer = groupNode?.new_members || groupNode?.group_members || groupNode?.all_members;
  if (!edgeContainer) return result;

  const edges = Array.isArray(edgeContainer.edges) ? edgeContainer.edges : [];
  for (const edge of edges) {
    const node = edge.node;
    if (node && node.id) {
      result.members.push({
        id: String(node.id),
        name: String(node.name || ''),
        url: String(node.url || '')
      });
    }
  }

  const pageInfo = edgeContainer.page_info;
  if (pageInfo) {
    result.hasNextPage = Boolean(pageInfo.has_next_page);
    result.nextCursor = pageInfo.end_cursor || null;
  }

  return result;
}

/**
 * Adapter chuẩn hóa kết quả gửi lời mời kết bạn
 */
function adaptFriendInvite(payload) {
  if (!payload || !payload.data) {
    return { ok: false, status: 'failed', message: 'Dữ liệu phản hồi trống' };
  }
  const result = payload.data.friend_request_send;
  const requestee = Array.isArray(result?.friend_requestees) ? result.friend_requestees[0] : null;
  const status = requestee?.friendship_status || '';
  const ok = status === 'OUTGOING_REQUEST' || status === 'ARE_FRIENDS' || status === 'CAN_REQUEST';
  let viDesc = '';
  if (status === 'CANNOT_REQUEST') viDesc = ' (Đối phương chặn kết bạn từ người lạ)';
  else if (status === 'ARE_FRIENDS') viDesc = ' (Đã là bạn bè)';
  else if (status === 'OUTGOING_REQUEST') viDesc = ' (Đang chờ đồng ý)';
  return {
    ok,
    status: ok ? 'success' : 'failed',
    friendship_status: status,
    message: ok ? 'Đã gửi lời mời kết bạn thành công.' : `Trạng thái: ${status || 'Không xác định'}${viDesc}`
  };
}

const FacebookAdapter = {
  FB_ERROR_TYPES,
  classifyFacebookResponse,
  adaptGroupMembers,
  adaptFriendInvite
};

if (typeof globalThis !== 'undefined') {
  globalThis.FacebookAdapter = FacebookAdapter;
}
if (typeof window !== 'undefined') {
  window.FacebookAdapter = FacebookAdapter;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    FacebookAdapter,
    FB_ERROR_TYPES,
    classifyFacebookResponse,
    adaptGroupMembers,
    adaptFriendInvite
  };
}
