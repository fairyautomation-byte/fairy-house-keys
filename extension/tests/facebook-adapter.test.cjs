const assert = require('node:assert/strict');
const { test } = require('node:test');
const {
  FB_ERROR_TYPES,
  classifyFacebookResponse,
  adaptGroupMembers,
  adaptFriendInvite
} = require('../src/core/facebook-adapter.js');

test('A13: classifies HTTP 429 as RATE_LIMITED with safe cooldown', () => {
  const result = classifyFacebookResponse('', 429);
  assert.equal(result.type, FB_ERROR_TYPES.RATE_LIMITED);
  assert.equal(result.retryable, true);
  assert.ok(result.message.includes('HTTP 429'));
});

test('A13: classifies HTML login redirect as LOGIN_REQUIRED', () => {
  const htmlDoc = '<!DOCTYPE html><html><body><form id="login_form" action="/login.php"></form></body></html>';
  const result = classifyFacebookResponse(htmlDoc, 200);
  assert.equal(result.type, FB_ERROR_TYPES.LOGIN_REQUIRED);
  assert.equal(result.retryable, false);
  assert.ok(result.message.includes('hết hạn'));
});

test('A13: classifies error code 368 as CHECKPOINT_OR_BLOCKED to prevent account suspension', () => {
  const blockedResponse = JSON.stringify({
    errors: [
      {
        message: "You're Temporarily Blocked",
        severity: 'CRITICAL',
        code: 368,
        description: 'It looks like you were misusing this feature by going too fast.'
      }
    ]
  });
  const result = classifyFacebookResponse(blockedResponse, 200);
  assert.equal(result.type, FB_ERROR_TYPES.CHECKPOINT_OR_BLOCKED);
  assert.equal(result.retryable, false);
  assert.ok(result.message.includes('368'));
});

test('A13: adaptGroupMembers extracts members list and pagination cursor correctly', () => {
  const fixture = {
    data: {
      node: {
        __typename: 'Group',
        new_members: {
          edges: [
            {
              node: {
                id: '100088990011223',
                name: 'Nguyễn Văn A',
                url: 'https://facebook.com/nguyenvana'
              }
            },
            {
              node: {
                id: '100088990011224',
                name: 'Trần Thị B',
                url: 'https://facebook.com/tranthib'
              }
            }
          ],
          page_info: {
            has_next_page: true,
            end_cursor: 'cursor_page_token_abc123'
          }
        }
      }
    }
  };

  const adapted = adaptGroupMembers(fixture);
  assert.equal(adapted.members.length, 2);
  assert.equal(adapted.members[0].id, '100088990011223');
  assert.equal(adapted.members[0].name, 'Nguyễn Văn A');
  assert.equal(adapted.hasNextPage, true);
  assert.equal(adapted.nextCursor, 'cursor_page_token_abc123');
});

test('A13: adaptFriendInvite parses OUTGOING_REQUEST as successful invitation', () => {
  const successInvite = {
    data: {
      friend_request_send: {
        friend_requestees: [
          {
            id: '100012345678901',
            friendship_status: 'OUTGOING_REQUEST'
          }
        ]
      }
    }
  };
  const result = adaptFriendInvite(successInvite);
  assert.equal(result.ok, true);
  assert.equal(result.status, 'success');
  assert.equal(result.friendship_status, 'OUTGOING_REQUEST');
});

test('A13: adaptFriendInvite parses rejected/failed status accurately', () => {
  const rejectedInvite = {
    data: {
      friend_request_send: {
        friend_requestees: [
          {
            id: '100012345678901',
            friendship_status: 'CANNOT_REQUEST'
          }
        ]
      }
    }
  };
  const result = adaptFriendInvite(rejectedInvite);
  assert.equal(result.ok, false);
  assert.equal(result.status, 'failed');
  assert.equal(result.friendship_status, 'CANNOT_REQUEST');
});

test('A13: handles malformed JSON response safely as SCHEMA_MISMATCH', () => {
  const brokenPayload = 'for (;;); <xml>not json</xml>';
  const result = classifyFacebookResponse(brokenPayload, 200);
  assert.equal(result.type, FB_ERROR_TYPES.SCHEMA_MISMATCH);
});
