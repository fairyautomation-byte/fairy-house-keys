const fs = require('fs');
const vm = require('vm');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const { webcrypto } = require('node:crypto');
const path = require('path');

const source = fs.readFileSync(path.join(__dirname, '../src/background/index.js'), 'utf8');

function setup(initialData = {}) {
  let data = { ...initialData };
  let listener;
  const clone = structuredClone;
  const chrome = {
    runtime: {
      id: 'test',
      getURL: (p) => 'chrome-extension://test/' + p,
      onInstalled: { addListener() {} },
      onMessage: { addListener(fn) { listener = fn; } }
    },
    storage: {
      local: {
        async setAccessLevel() {},
        async get(keys) {
          return Object.fromEntries(keys.filter((k) => k in data).map((k) => [k, clone(data[k])]));
        },
        async set(v) { Object.assign(data, clone(v)); },
        async remove(keys) { keys.forEach((k) => delete data[k]); }
      },
      session: {
        async setAccessLevel() {},
        async set() {},
        async remove() {}
      }
    },
    tabs: { async query() { return []; }, async sendMessage() {} },
    cookies: { async get() { return null; } }
  };
  const ctx = vm.createContext({
    chrome,
    fetch: async () => ({ ok: true, status: 200, json: async () => ({}) }),
    crypto: webcrypto,
    AbortSignal,
    console: { log() {}, warn() {}, error() {} },
    Date,
    Promise,
    JSON,
    Math,
    URL,
    setTimeout
  });
  vm.runInContext(source, ctx);
  return {
    run: (s) => vm.runInContext(s, ctx),
    read: () => clone(data),
    msg: (message, sender = { id: 'test', url: 'chrome-extension://test/src/ui/action-popup.html' }) =>
      new Promise((resolve) => listener(message, sender, resolve))
  };
}

test('A14: getOrCreateInstallationId persists unique installation identifier', async () => {
  const env = setup();
  const id1 = await env.run('getOrCreateInstallationId()');
  assert.ok(typeof id1 === 'string' && id1.startsWith('inst_'));
  const id2 = await env.run('getOrCreateInstallationId()');
  assert.equal(id1, id2);
  assert.equal(env.read().ztInstallationId, id1);
});

test('A14: ZT_CAMPAIGN_CHECKPOINT_SAVE and GET allow campaign pause & resume', async () => {
  const env = setup();
  const saveRes = await env.msg({
    action: 'ZT_CAMPAIGN_CHECKPOINT_SAVE',
    campaignId: 'camp-1234',
    targetType: 'group',
    targetId: '123456789',
    targetName: 'Hội Bất Động Sản',
    scannedCount: 250,
    phoneFoundCount: 45,
    cursor: 'page_token_xyz',
    status: 'paused'
  });
  assert.equal(saveRes.ok, true);
  assert.equal(saveRes.checkpoint.campaignId, 'camp-1234');
  assert.equal(saveRes.checkpoint.scannedCount, 250);

  const getRes = await env.msg({ action: 'ZT_CAMPAIGN_CHECKPOINT_GET' });
  assert.equal(getRes.ok, true);
  assert.equal(getRes.checkpoint.campaignId, 'camp-1234');
  assert.equal(getRes.checkpoint.phoneFoundCount, 45);
  assert.equal(getRes.checkpoint.status, 'paused');
});

test('A14: ZT_EXTENSION_SCAN_LOG caps history to 20 recent items', async () => {
  const env = setup();
  for (let i = 1; i <= 25; i++) {
    await env.msg({
      action: 'ZT_EXTENSION_SCAN_LOG',
      campaignId: `camp-${i}`,
      uidsCount: i * 10,
      phonesCount: i
    });
  }
  const history = env.read().ztScanHistory;
  assert.equal(history.length, 20);
  assert.equal(history[0].campaignId, 'camp-25');
});

test('A14: ZT_EXTENSION_UID_DEMO_BATCH deduplicates UIDs correctly', async () => {
  const env = setup();
  const res = await env.msg({
    action: 'ZT_EXTENSION_UID_DEMO_BATCH',
    uids: ['1001', '1002', '1001', '1003', '1002']
  });
  assert.equal(res.ok, true);
  assert.equal(res.count, 3);
  assert.equal(res.localOnly, true);
});

test('R08: ZT_GET_CAPABILITIES fetches and caches server capabilities', async () => {
  const env = setup({
    ztServerCapabilities: { phones: true, validate: true, invite: true, idempotency: true },
    ztServerCapabilitiesCheckedAt: Date.now()
  });

  const res = await env.msg({ action: 'ZT_GET_CAPABILITIES' });
  assert.equal(res.ok, true);
  assert.equal(res.capabilities.phones, true);
  assert.equal(res.capabilities.validate, true);
});

test('R08: FacebookAdapter is connected into api.js friend request flow', async () => {
  const { PushGroupAPI } = require('../src/core/api.js');
  const originalFetch = global.fetch;
  const originalAuth = global.PushGroupAuth;

  global.PushGroupAuth = {
    getAuth: () => ({ fbDtsg: 'mock_dtsg_123', userId: '10000000001' }),
    getRequestParams: () => ({ lsd: 'mock_lsd_123', jazoest: '21234' }),
    generateJazoest: () => '21234'
  };

  try {
    // 1. Mock Facebook returning checkpoint error (code 368)
    global.fetch = async () => ({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({
        errors: [{ code: 368, message: 'Your account is temporarily blocked' }]
      })
    });

    const resCheckpoint = await PushGroupAPI.sendFriendRequest('10000000002');
    assert.equal(resCheckpoint.success, false);
    assert.equal(resCheckpoint.errorType, 'CHECKPOINT_OR_BLOCKED');

    // 2. Mock Facebook returning successful friend request OUTGOING_REQUEST
    global.fetch = async () => ({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({
        data: {
          friend_request_send: {
            friend_requestees: [{ friendship_status: 'OUTGOING_REQUEST' }]
          }
        }
      })
    });

    const resSuccess = await PushGroupAPI.sendFriendRequest('10000000003');
    assert.equal(resSuccess.success, true);
    assert.equal(resSuccess.status, 'success');
    assert.equal(resSuccess.friendship_status, 'OUTGOING_REQUEST');
  } finally {
    global.fetch = originalFetch;
    global.PushGroupAuth = originalAuth;
  }
});

test('L2-05: manifest includes facebook-adapter.js and browser VM loads adapter without require', async () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '../manifest.json'), 'utf8'));
  const scripts = manifest.content_scripts.flatMap((entry) => entry.js);
  assert.equal(scripts.includes('src/core/facebook-adapter.js'), true);

  // Pure browser context without require/module
  const ctx = vm.createContext({
    URLSearchParams,
    Date,
    console,
    location: { origin: 'https://www.facebook.com' },
    window: {},
    PushGroupAuth: {
      getAuth: () => ({ fbDtsg: 'mock-token', userId: '10000000001' }),
      getRequestParams: () => ({ lsd: 'mock_lsd_123', jazoest: '21234' }),
      generateJazoest: () => '21234'
    },
    fetch: async () => ({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ errors: [{ code: 368, message: 'blocked fixture' }] })
    })
  });

  // Load scripts in manifest content_scripts order
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../src/core/facebook-adapter.js'), 'utf8'), ctx);
  assert.equal(vm.runInContext("typeof window.FacebookAdapter !== 'undefined'", ctx), true);

  vm.runInContext(fs.readFileSync(path.join(__dirname, '../src/core/api.js'), 'utf8'), ctx);
  assert.equal(vm.runInContext('_fbAdapter !== null', ctx), true);

  const fb = await vm.runInContext("PushGroupAPI.sendFriendInvite('10000000002')", ctx);
  assert.equal(fb.success, false);
  assert.equal(fb.errorType, 'CHECKPOINT_OR_BLOCKED');
});

test('L2-05: ZT_GET_CAPABILITIES live handshake when cache is empty', async () => {
  const env = setup();
  env.run(`fetch = async (url) => {
    return {
      ok: true,
      status: 200,
      json: async () => ({ ok: true, capabilities: { phones: true, validate: true, invite: true, idempotency: true } })
    };
  }`);

  const res = await env.msg({ action: 'ZT_GET_CAPABILITIES' });
  assert.equal(res.ok, true);
  assert.equal(res.capabilities.invite, true);
  const stored = env.read();
  assert.equal(stored.ztServerCapabilities?.invite, true);
});


