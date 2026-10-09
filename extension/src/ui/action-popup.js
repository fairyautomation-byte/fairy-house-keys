/* global chrome */
(function () {
  'use strict';

  function $(id) {
    return document.getElementById(id);
  }

  function show(el, on, useFlex) {
    if (!el) return;
    el.classList.toggle('hidden', !on);
    if (useFlex) {
      if (on) el.classList.add('flex');
      else el.classList.remove('flex');
    }
  }

  function setLoading(v) {
    show($('zt-loading'), v, true);
  }

  function setLoginPanel(v) {
    show($('zt-panel-login'), v, true);
  }

  function setLoggedPanel(v) {
    show($('zt-panel-logged'), v, true);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function showLoginError(msg) {
    var p = $('zt-login-error');
    if (!p) return;
    if (!msg) {
      p.className = 'hidden';
      p.innerHTML = '';
      return;
    }

    var lower = String(msg).toLowerCase();
    var isExpired = lower.includes('hết hạn') || lower.includes('expired');
    var isBound = lower.includes('thiết bị') || lower.includes('dùng trên') || lower.includes('used');
    var isRevoked = lower.includes('thu hồi') || lower.includes('revoked');
    var isNotFound = lower.includes('không tồn tại') || lower.includes('not found');
    var isFormat = lower.includes('định dạng') || lower.includes('format');
    var isSys = lower.includes('hệ thống') || lower.includes('kết nối') || lower.includes('network') || lower.includes('fetch') || lower.includes('unauthorized');

    var tone = 'border-rose-200 bg-rose-50 text-rose-800';
    var iconSvg = '<svg class="h-4 w-4 shrink-0 text-rose-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>';
    var title = 'License Key không hợp lệ';
    var desc = msg;

    if (isExpired) {
      tone = 'border-amber-200 bg-amber-50 text-amber-900';
      iconSvg = '<svg class="h-4 w-4 shrink-0 text-amber-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>';
      title = 'Key đã hết hạn';
      desc = 'Thời gian sử dụng của key này đã kết thúc. Vui lòng gia hạn để tiếp tục sử dụng.';
    } else if (isBound) {
      tone = 'border-amber-200 bg-amber-50 text-amber-900';
      iconSvg = '<svg class="h-4 w-4 shrink-0 text-amber-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>';
      title = 'Key đã kích hoạt trên thiết bị khác';
      desc = msg + '. Mỗi key chỉ dùng trên 1 máy tính. Liên hệ Zalo: 0378791667 để đổi thiết bị.';
    } else if (isRevoked) {
      title = 'Key đã bị thu hồi';
      desc = 'Key bản quyền này đã bị vô hiệu hoá. Vui lòng liên hệ Admin Zalo: 0378791667.';
    } else if (isNotFound) {
      title = 'Key không tồn tại';
      desc = 'Mã license key không chính xác. Vui lòng kiểm tra lại từng ký tự.';
    } else if (isFormat) {
      title = 'Sai định dạng Key';
      desc = 'Key phải có dạng FHAD-XXXX-XXXX-XXXX viết hoa.';
    } else if (isSys) {
      tone = 'border-zinc-200 bg-zinc-100 text-zinc-800';
      iconSvg = '<svg class="h-4 w-4 shrink-0 text-zinc-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636a9 9 0 010 12.728m-2.828-2.828a5 5 0 000-7.072m-2.828 2.828a1 1 0 010 1.414M12 12h.01"/></svg>';
      title = 'Lỗi kết nối máy chủ';
      desc = msg + '. Vui lòng kiểm tra mạng Internet và thử lại.';
    }

    p.className = 'flex items-start gap-2.5 rounded-xl border p-3 text-xs leading-relaxed ' + tone;
    p.innerHTML =
      iconSvg +
      '<div class="min-w-0 flex-1">' +
      '<strong class="block font-semibold">' + escapeHtml(title) + '</strong>' +
      '<p class="mt-0.5 text-[11px] opacity-90">' + escapeHtml(desc) + '</p>' +
      (isExpired ? '<a href="https://fairyautomation.io.vn" target="_blank" class="mt-1.5 inline-block font-bold underline text-[11px] text-teal-800 hover:text-teal-900">Bấm vào đây để gia hạn</a>' : '') +
      (isBound || isRevoked ? '<a href="https://zalo.me/0378791667" target="_blank" class="mt-1.5 inline-flex items-center gap-1 font-bold underline text-[11px] text-teal-800 hover:text-teal-900">Liên hệ Zalo Admin: 0378791667 &rarr;</a>' : '') +
      '</div>';
  }

  function send(action, payload) {
    return new Promise(function (resolve, reject) {
      try {
        chrome.runtime.sendMessage(
          Object.assign({ action: action }, payload || {}),
          function (resp) {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
              return;
            }
            resolve(resp);
          }
        );
      } catch (e) {
        reject(e);
      }
    });
  }

  function getVietnamToday() {
    try {
      return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
    } catch (_) {
      return new Date().toISOString().slice(0, 10);
    }
  }

  function renderLicenseDetails(license, details) {
    if (!details) details = {};
    $('zt-logged-email').textContent = license || 'Unknown';

    var planName = String(details.plan || details.plan_id || 'trial').toUpperCase();
    $('zt-license-plan').textContent = planName;

    var expireText = 'Không giới hạn';
    if (details.expires_at) {
      var ms = 0;
      if (typeof details.expires_at === 'string' || typeof details.expires_at === 'number') {
        ms = new Date(details.expires_at).getTime();
      } else if (details.expires_at._seconds) {
        ms = details.expires_at._seconds * 1000;
      } else if (details.expires_at.seconds) {
        ms = details.expires_at.seconds * 1000;
      }
      if (ms > 0) {
        var exDate = new Date(ms);
        expireText = exDate.toLocaleDateString('vi-VN');
      }
    }
    $('zt-license-expire').textContent = expireText;

    var today = getVietnamToday();
    var used = Number(details.daily_used) || 0;
    // Kiểm tra reset ngày mới theo giờ Việt Nam
    if (details.last_reset_date && details.last_reset_date !== today) {
      used = 0;
    }

    var limit = details.daily_limit;
    var limitText = (limit === -1 || limit === null) ? '∞' : limit;
    $('zt-license-quota-text').textContent = used + ' / ' + limitText;

    var percent = 0;
    if (limit > 0) {
      percent = Math.min(100, Math.round((used / limit) * 100));
    }
    $('zt-license-quota-bar').style.width = percent + '%';

    $('zt-license-total-scans').textContent = 'Đã quét: ' + (details.total_scans || 0) + ' UID';
  }

  function refreshSession() {
    send('ZT_SERVER_SESSION_GET', {})
      .then(function (r) {
        if (r && r.ok && r.authed) {
          setLoading(false);
          setLoginPanel(false);
          var license = r.license || 'Unknown';
          var details = r.details || {};
          renderLicenseDetails(license, details);
          setLoggedPanel(true);
          refreshFacebookStatus();

          // Đồng bộ ngầm với server để cập nhật số liệu mới nhất (nếu admin có chỉnh trên web)
          send('ZT_SERVER_REFRESH_ME', { force: false })
            .then(function (refRes) {
              if (refRes && refRes.ok && refRes.details) {
                renderLicenseDetails(refRes.license || license, refRes.details);
              } else if (refRes && !refRes.ok) { setLoggedPanel(false); setLoginPanel(true); showLoginError(refRes.error || 'Phiên chưa sẵn sàng'); }
            })
            .catch(function () {
              // Mạng chậm hoặc lỗi ngầm thì giữ nguyên UI từ cache, TUYỆT ĐỐI không văng ra ngoài!
            });
        } else {
          setLoading(false);
          setLoggedPanel(false);
          setLoginPanel(true);
        }
      })
      .catch(function () {
        setLoading(false);
        setLoggedPanel(false);
        setLoginPanel(true);
      });
  }

  function setFacebookStatus(ready, msg, fbUid) {
    var dot = $('zt-fb-status-dot');
    var title = $('zt-fb-status-title');
    var desc = $('zt-fb-status-desc');
    if (!dot || !title || !desc) return;
    if (ready) {
      dot.className = 'inline-block h-2 w-2 rounded-full bg-emerald-500';
      title.className = 'text-xs font-bold text-zinc-900';
      title.textContent = 'Dịch vụ đã sẵn sàng';
    } else {
      dot.className = 'inline-block h-2 w-2 rounded-full bg-rose-500';
      title.className = 'text-xs font-bold text-zinc-900';
      title.textContent = 'Dịch vụ chưa sẵn sàng';
    }
    desc.textContent = msg || (ready ? 'Đã kết nối tài khoản Facebook.' : 'Chưa kết nối Facebook.');
  }

  function refreshFacebookStatus() {
    send('ZT_FB_ACCOUNT_STATUS', {})
      .then(function (r) {
        setFacebookStatus(!!(r && r.ready), (r && r.message) || '', (r && r.fbUid) || '');
      })
      .catch(function () {
        setFacebookStatus(false, 'Không kiểm tra được trạng thái nick Facebook hiện tại.', '');
      });
  }

  document.addEventListener('DOMContentLoaded', function () {
    refreshSession();

    var btnSync = $('zt-btn-sync-quota');
    if (btnSync) {
      btnSync.addEventListener('click', function () {
        var icon = $('zt-sync-icon');
        if (icon) icon.classList.add('animate-spin');
        send('ZT_SERVER_REFRESH_ME', { force: true })
          .then(function (r) {
            if (r && r.ok && r.details) {
              renderLicenseDetails(r.license, r.details);
            }
          })
          .finally(function () {
            setTimeout(function () {
              if (icon) icon.classList.remove('animate-spin');
            }, 600);
          });
      });
    }

    $('zt-form-login').addEventListener('submit', function (ev) {
      ev.preventDefault();
      showLoginError('');
      var licenseKey = ($('zt-license-key').value || '').trim().toUpperCase();
      if (!licenseKey) return;
      var btn = $('zt-btn-submit');
      var label = $('zt-btn-submit-label');
      btn.disabled = true;
      label.textContent = 'Đang kích hoạt…';
      send('ZT_SERVER_LOGIN', { licenseKey: licenseKey })
        .then(function (r) {
          if (r && r.ok) {
            $('zt-license-key').value = '';
            refreshSession();
            chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
              if (tabs && tabs[0] && tabs[0].url && tabs[0].url.includes('facebook.com')) {
                chrome.tabs.reload(tabs[0].id);
              }
            });
          } else {
            showLoginError((r && r.error) || 'License Key không hợp lệ.');
          }
        })
        .catch(function (e) {
          showLoginError(e.message || 'Lỗi kết nối.');
        })
        .finally(function () {
          btn.disabled = false;
          label.textContent = 'Kích hoạt License';
        });
    });

    var btnLogout = $('zt-btn-logout');
    if (btnLogout) {
      btnLogout.addEventListener('click', function () {
        setLoading(true);
        send('ZT_SERVER_LOGOUT', {})
          .then(function() {
            refreshSession();
            chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
              if (tabs && tabs[0] && tabs[0].url && tabs[0].url.includes('facebook.com')) {
                chrome.tabs.reload(tabs[0].id);
              }
            });
          })
          .catch(refreshSession);
      });
    }

    var btnOpenFb = $('zt-btn-open-facebook');
    if (btnOpenFb) {
      btnOpenFb.addEventListener('click', function () {
        try {
          chrome.tabs.create({ url: 'https://www.facebook.com', active: true });
        } catch (_) {
          /* ignore */
        }
      });
    }

    $('zt-btn-refresh-status').addEventListener('click', function () {
      try {
        chrome.tabs.create({ url: 'https://fairyautomation.io.vn', active: true });
      } catch (_) {
        /* ignore */
      }
    });

    $('zt-btn-register').addEventListener('click', function () {
      try {
        chrome.tabs.create({ url: 'https://fairyautomation.io.vn', active: true });
      } catch (_) {
        /* ignore */
      }
    });
  });
})();
