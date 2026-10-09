/* global window */
(function () {
  'use strict';

  function decodeHtml(s) {
    if (!s) return '';
    const t = document.createElement('textarea');
    t.innerHTML = s;
    return t.value;
  }

  function decodeJsonString(s) {
    if (!s) return '';
    let v = String(s);
    v = v.replace(/\\u([0-9a-fA-F]{4})/g, (_, hx) => String.fromCharCode(parseInt(hx, 16)));
    v = v.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
    return v;
  }

  /** Thử lấy chuỗi trong JSON nhúng (Facebook hay nhét vào __bbox / script). */
  function extractFromEmbeddedStrings(html) {
    if (!html) return '';
    const h = html;
    const tries = [
      /"current_city"[^}]*"name"\s*:\s*"((?:[^"\\]|\\.)*)"/,
      /"hometown"[^}]*"name"\s*:\s*"((?:[^"\\]|\\.)*)"/,
      /"location"[^}]*"name"\s*:\s*"((?:[^"\\]|\\.)*)"/,
      /"profile_address"\s*:\s*"((?:[^"\\]|\\.)*)"/,
      /"address"\s*:\s*\{\s*"street"\s*:\s*"((?:[^"\\]|\\.)*)"/
    ];
    for (const re of tries) {
      const m = h.match(re);
      if (m && m[1]) {
        let v = decodeJsonString(m[1]);
        if (v.length >= 2 && v.length < 120) return v.trim();
      }
    }
    return '';
  }

  /**
   * Bóc JSON khối lớn: current_city / hometown / living_location có nested name.
   */
  function extractCityFromStructuredJson(html) {
    if (!html) return '';
    const patterns = [
      /"current_city"\s*:\s*\{[\s\S]{0,4000}?"name"\s*:\s*"((?:[^"\\]|\\.)*)"/,
      /"hometown"\s*:\s*\{[\s\S]{0,4000}?"name"\s*:\s*"((?:[^"\\]|\\.)*)"/,
      /"living_location"\s*:\s*\{[\s\S]{0,3000}?"name"\s*:\s*"((?:[^"\\]|\\.)*)"/,
      /"viewer_location"\s*:\s*\{[\s\S]{0,3000}?"name"\s*:\s*"((?:[^"\\]|\\.)*)"/,
      /"profile_location"\s*:\s*\{[\s\S]{0,3000}?"name"\s*:\s*"((?:[^"\\]|\\.)*)"/,
      /"city"\s*:\s*\{[\s\S]{0,1200}?"name"\s*:\s*"((?:[^"\\]|\\.)*)"/,
      /"address"\s*:\s*\{[\s\S]{0,2000}?"city"\s*:\s*"((?:[^"\\]|\\.)*)"/
    ];
    for (const re of patterns) {
      const m = html.match(re);
      if (m && m[1]) {
        const v = decodeJsonString(m[1]).trim();
        if (v.length >= 2 && v.length < 120 && !/^[\d\s.]+$/.test(v)) return v;
      }
    }
    return '';
  }

  /** Meta og:description (thứ tự attribute Facebook hay đổi). */
  function extractFromMeta(html) {
    if (!html) return '';
    let raw = '';
    const a = html.match(/<meta[^>]+property=["']og:description["'][^>]*content=["']([^"']*)["']/i);
    const b = html.match(/<meta[^>]+content=["']([^"']*)["'][^>]*property=["']og:description["']/i);
    raw = (a && a[1]) || (b && b[1]) || '';
    const text = raw ? decodeHtml(raw) : '';
    if (!text) return '';
    const t = text.replace(/\s+/g, ' ');
    let x = t.match(/(?:Lives in|Living in|Sống ở|Sống tại)\s+([^·•|]+?)(?:\s*[·•|]|\s*$)/i);
    if (x && x[1]) return x[1].trim();
    x = t.match(/(?:Hà Nội|Hanoi|TP\.?\s*Hồ Chí Minh|Ho Chi Minh)/i);
    if (x) return x[0].trim();
    return '';
  }

  /**
   * Bóc từ chuỗi HTML thô (giống View Source) — JSON Relay nhúng trong <script>, không cần DOM đã render.
   */
  function extractCityFromInlineRelayJson(html) {
    if (!html || typeof html !== 'string') return '';
    const keys = [
      'current_city',
      'living_location',
      'hometown',
      'viewer_location',
      'profile_location',
      'address'
    ];
    for (const key of keys) {
      const re = new RegExp(
        '"' +
          key +
          '"\\s*:\\s*\\{[\\s\\S]{0,12000}?"name"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"',
        'i'
      );
      const m = html.match(re);
      if (m && m[1]) {
        const v = decodeJsonString(m[1]).trim();
        if (v.length >= 2 && v.length < 120 && !/^[\d\s.]+$/.test(v)) return v;
      }
    }
    return '';
  }

  /**
   * Một dòng intro kiểu «Sống ở Hà-Nam, Hà Nam, Vietnam» (dài > 40 ký tự) — regex trên HTML gộp khoảng trắng.
   */
  function extractSongOIntroLine(html) {
    if (!html || typeof html !== 'string') return '';
    const h = html.replace(/\s+/g, ' ');
    const m = h.match(/Sống\s+(?:ở|tại)\s+([^<·•]{2,180}?)(?=\s*[·•<]|$)/i);
    if (m && m[1]) {
      let v = decodeHtml(m[1]).replace(/\s+/g, ' ').trim();
      v = v.replace(/^[,;]\s*/, '').trim();
      if (v.length >= 2 && v.length < 200) return v;
    }
    const m2 = h.match(/(?:Lives?\s+in|Currently\s+lives\s+in)\s+([^<·•]{2,180}?)(?=\s*[·•<]|$)/i);
    if (m2 && m2[1]) {
      const v = decodeHtml(m2[1]).replace(/\s+/g, ' ').trim();
      if (v.length >= 2 && v.length < 200) return v;
    }
    return '';
  }

  /** Tìm «Sống ở / Lives in» trong DOM thật sự (DOMParser) — bắt text node cạnh link thành phố. */
  function extractLivingLocationFromDom(html) {
    if (!html || typeof html !== 'string') return '';
    try {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      if (!doc) return '';

      const LABEL_RE =
        /(Sống\s+ở|Sống\s+tại|Lives\s+in|Currently\s+lives\s+in|Living\s+in|Từ\s+Thành\s+phố|Hometown)/i;

      const tw = doc.createTreeWalker(doc.body || doc, NodeFilter.SHOW_TEXT, null, false);
      let node;
      while ((node = tw.nextNode())) {
        const raw = (node.nodeValue || '').replace(/\s+/g, ' ').trim();
        if (!raw || raw.length > 500) continue;

        const inlineVi = raw.match(/^Sống\s+(?:ở|tại)\s+(.+)$/i);
        if (inlineVi && inlineVi[1]) {
          const val = inlineVi[1].trim();
          if (val.length >= 2 && val.length < 200) return val;
        }
        const inlineEn = raw.match(/^(?:Lives?\s+in|Currently\s+lives\s+in)\s+(.+)$/i);
        if (inlineEn && inlineEn[1]) {
          const val = inlineEn[1].trim();
          if (val.length >= 2 && val.length < 200) return val;
        }

        const txt = raw;
        if (txt.length > 40) continue;
        if (!LABEL_RE.test(txt)) continue;

        let host = node.parentElement;
        for (let i = 0; i < 6 && host; i++) {
          const a = host.querySelector('a[href]');
          if (a) {
            const val = (a.textContent || '').replace(/\s+/g, ' ').trim();
            if (val.length >= 2 && val.length < 120 && !LABEL_RE.test(val)) return val;
          }
          const sib = host.nextElementSibling;
          if (sib) {
            const val = (sib.textContent || '').replace(/\s+/g, ' ').trim();
            if (val.length >= 2 && val.length < 120 && !LABEL_RE.test(val)) return val;
          }
          host = host.parentElement;
        }
      }

      const links = doc.querySelectorAll('a[href*="/pages/"],a[href*="places/"],a[href*="/profile"]');
      for (const a of links) {
        const ariaLabel = (a.getAttribute('aria-label') || '').trim();
        const tc = (a.textContent || '').replace(/\s+/g, ' ').trim();
        if (/^(Hà\s*Nội|TP\.?\s*Hồ\s+Chí\s+Minh|Đà\s+Nẵng|Hải\s+Phòng|Cần\s+Thơ)$/i.test(tc)) return tc;
        if (ariaLabel && /^(Hà\s*Nội|Hồ\s+Chí\s+Minh|Đà\s+Nẵng)$/i.test(ariaLabel)) return ariaLabel;
      }
    } catch (_) {
      /* ignore */
    }
    return '';
  }

  /**
   * Trích nơi đang sống từ HTML (fetch trong content script — cùng cookie phiên).
   * Thứ tự: DOM thật (Sống ở + anchor) → JSON nhúng → meta → pattern UI.
   */
  function extractLivingLocation(html) {
    if (!html || typeof html !== 'string') return '';

    let hit = extractSongOIntroLine(html);
    if (hit) return hit;

    hit = extractCityFromInlineRelayJson(html);
    if (hit) return hit;

    hit = extractLivingLocationFromDom(html);
    if (hit) return hit;

    hit = extractCityFromStructuredJson(html);
    if (hit) return hit;

    hit = extractFromMeta(html);
    if (hit) return hit;

    hit = extractFromEmbeddedStrings(html);
    if (hit) return hit;

    const h = html.replace(/\s+/g, ' ');
    const linkPatterns = [
      /Sống ở\s*<\/span>\s*<a[^>]*>([^<]+)<\/a>/i,
      /Sống tại\s*<\/span>\s*<a[^>]*>([^<]+)<\/a>/i,
      /Sống ở\s*<\/div>\s*<a[^>]*>([^<]+)<\/a>/i,
      /Sống tại\s*<\/div>\s*<a[^>]*>([^<]+)<\/a>/i,
      /Lives in\s*<\/span>\s*<a[^>]*>([^<]+)<\/a>/i,
      /Lives in\s*<\/div>\s*<a[^>]*>([^<]+)<\/a>/i,
      /Currently lives in\s*<\/span>\s*<a[^>]*>([^<]+)<\/a>/i,
      /"Sống ở[^"]*"\s*:\s*"((?:[^"\\]|\\.)*)"/i,
      /"Sống tại[^"]*"\s*:\s*"((?:[^"\\]|\\.)*)"/i,
      /"Lives in[^"]*"\s*:\s*"((?:[^"\\]|\\.)*)"/i
    ];
    for (const re of linkPatterns) {
      const m = h.match(re);
      if (m && m[1]) {
        const v = decodeHtml(decodeJsonString(m[1])).trim();
        if (v.length >= 2 && v.length < 120) return v;
      }
    }

    const spanCity = h.match(
      /Sống ở\s*<\/[^>]+>\s*<[^>]+class="[^"]*"[^>]*>([^<]{2,100})<\/[^>]+>/i
    );
    if (spanCity && spanCity[1]) {
      const v = decodeHtml(spanCity[1]).replace(/\s+/g, ' ').trim();
      if (v.length >= 2 && v.length < 120) return v;
    }

    const looseVi = h.match(/Sống ở\s+([^<]{2,80}?)(?:<|$)/i);
    if (looseVi && looseVi[1]) return decodeHtml(looseVi[1]).replace(/\s+/g, ' ').trim();
    const looseVi2 = h.match(/Sống tại\s+([^<]{2,80}?)(?:<|$)/i);
    if (looseVi2 && looseVi2[1]) return decodeHtml(looseVi2[1]).replace(/\s+/g, ' ').trim();
    const looseEn = h.match(/Lives in\s+([^<]{2,80}?)(?:<|$)/i);
    if (looseEn && looseEn[1]) return decodeHtml(looseEn[1]).replace(/\s+/g, ' ').trim();

    const introLine = h.match(/Sống ở\s+([A-Za-zÀ-ỹ][^<·•]{1,55})/i);
    if (introLine && introLine[1]) {
      const v = introLine[1].replace(/\s+/g, ' ').trim();
      if (v.length >= 2 && v.length < 90) return v;
    }

    return '';
  }

  function normalizeCity(raw) {
    if (!raw) return '';
    let t = String(raw).trim();
    if (/^(Vị trí|Location|Current city|Khu vực)$/i.test(t)) return '';
    t = t.replace(/^[\s,.:;·\-]+|[\s,.:;·\-]+$/g, '');
    t = t.replace(/^Thành phố\s+/i, '').replace(/^Tỉnh\s+/i, '');
    t = t.replace(/^TP\.?\s*/i, '');
    if (/^(Hà Nội|Ha Noi|Hanoi)$/i.test(t)) return 'Hà Nội';
    if (/Hồ Chí Minh|Ho Chi Minh|HCM|^SG$|Sài Gòn|Sai Gon/i.test(t)) return 'TP. Hồ Chí Minh';
    if (/Đà Nẵng|Da Nang/i.test(t)) return 'Đà Nẵng';
    if (/Hải Phòng|Hai Phong/i.test(t)) return 'Hải Phòng';
    if (/Cần Thơ|Can Tho/i.test(t)) return 'Cần Thơ';
    if (t.length > 42) return t.slice(0, 40) + '…';
    return t;
  }

  window.ZTProfileLocation = { extractLivingLocation, normalizeCity };
})();
