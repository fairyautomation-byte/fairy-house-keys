/* global window */
/**
 * ZTXlsx — bộ ghi .xlsx siêu nhẹ, không phụ thuộc thư viện ngoài.
 * Sinh file Open Office XML (xlsx) đóng gói trong ZIP STORED + CRC32.
 *
 * Cách dùng:
 *   const blob = window.ZTXlsx.buildXlsxBlob({
 *     sheetName: 'Fairy House Auto Data',
 *     header: ['STT', 'UID', 'Tên'],
 *     rows: [[1, '1000123', 'A'], [2, '1000456', 'B']]
 *   });
 *
 * Ghi chú:
 *  - Mọi chuỗi (UID, SĐT) ghi dưới dạng inlineStr để tránh mất số 0 đầu / mất chính xác
 *    với UID Facebook 15–16 chữ số (Excel chỉ giữ 15 con số có nghĩa khi là number).
 *  - Header row dùng style index 1 (đậm, nền tím, chữ trắng, căn giữa).
 */
(function () {
  'use strict';

  if (typeof window === 'undefined') return;

  const CRC_TABLE = (function () {
    const t = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let k = 0; k < 8; k++) {
        c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
      }
      t[i] = c >>> 0;
    }
    return t;
  })();

  function crc32(bytes) {
    let crc = 0xffffffff;
    for (let i = 0; i < bytes.length; i++) {
      crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  const TEXT_ENCODER = new TextEncoder();
  function utf8(s) {
    return TEXT_ENCODER.encode(String(s));
  }

  function escapeXml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
      // eslint-disable-next-line no-control-regex
      .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, '');
  }

  function colName(idx) {
    let s = '';
    let n = idx + 1;
    while (n > 0) {
      const r = (n - 1) % 26;
      s = String.fromCharCode(65 + r) + s;
      n = Math.floor((n - 1) / 26);
    }
    return s;
  }

  function isFiniteNumber(v) {
    return typeof v === 'number' && Number.isFinite(v);
  }

  function buildSheetXml(header, rows) {
    const parts = [];
    parts.push('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>');
    parts.push('<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">');

    const widths = header.map((h, i) => {
      let w = String(h == null ? '' : h).length + 2;
      const sample = Math.min(rows.length, 200);
      for (let r = 0; r < sample; r++) {
        const v = rows[r][i];
        const len = String(v == null ? '' : v).length + 1;
        if (len > w) w = len;
      }
      return Math.min(60, Math.max(8, w));
    });
    if (widths.length) {
      parts.push('<cols>');
      widths.forEach((w, i) => {
        parts.push('<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + w + '" customWidth="1"/>');
      });
      parts.push('</cols>');
    }

    parts.push('<sheetData>');

    parts.push('<row r="1">');
    header.forEach((h, i) => {
      const ref = colName(i) + '1';
      parts.push(
        '<c r="' + ref + '" s="1" t="inlineStr"><is><t xml:space="preserve">' +
        escapeXml(h) + '</t></is></c>'
      );
    });
    parts.push('</row>');

    for (let r = 0; r < rows.length; r++) {
      const row = rows[r] || [];
      const rowIdx = r + 2;
      parts.push('<row r="' + rowIdx + '">');
      for (let i = 0; i < header.length; i++) {
        const v = row[i];
        if (v == null || v === '') continue;
        const ref = colName(i) + rowIdx;
        if (isFiniteNumber(v)) {
          parts.push('<c r="' + ref + '"><v>' + v + '</v></c>');
        } else {
          parts.push(
            '<c r="' + ref + '" t="inlineStr"><is><t xml:space="preserve">' +
            escapeXml(v) + '</t></is></c>'
          );
        }
      }
      parts.push('</row>');
    }

    parts.push('</sheetData>');
    parts.push('</worksheet>');
    return parts.join('');
  }

  function buildContentTypes() {
    return [
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">',
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>',
      '<Default Extension="xml" ContentType="application/xml"/>',
      '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>',
      '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>',
      '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>',
      '</Types>'
    ].join('');
  }

  function buildRootRels() {
    return [
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">',
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>',
      '</Relationships>'
    ].join('');
  }

  function buildWorkbook(sheetName) {
    const safeName = escapeXml(sheetName).slice(0, 31).replace(/[\\/?*\[\]:]/g, ' ').trim() || 'Sheet1';
    return [
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
      '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"',
      ' xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">',
      '<sheets>',
      '<sheet name="' + safeName + '" sheetId="1" r:id="rId1"/>',
      '</sheets>',
      '</workbook>'
    ].join('');
  }

  function buildWorkbookRels() {
    return [
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">',
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>',
      '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>',
      '</Relationships>'
    ].join('');
  }

  function buildStyles() {
    return [
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
      '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">',
      '<fonts count="2">',
      '<font><sz val="11"/><name val="Calibri"/></font>',
      '<font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>',
      '</fonts>',
      '<fills count="3">',
      '<fill><patternFill patternType="none"/></fill>',
      '<fill><patternFill patternType="gray125"/></fill>',
      '<fill><patternFill patternType="solid"><fgColor rgb="FF6D28D9"/><bgColor indexed="64"/></patternFill></fill>',
      '</fills>',
      '<borders count="1"><border/></borders>',
      '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>',
      '<cellXfs count="2">',
      '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>',
      '<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>',
      '</cellXfs>',
      '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>',
      '</styleSheet>'
    ].join('');
  }

  function dosDateTime(d) {
    d = d || new Date();
    const yr = d.getFullYear();
    const time = ((d.getHours() & 0x1f) << 11) |
                 ((d.getMinutes() & 0x3f) << 5) |
                 (Math.floor(d.getSeconds() / 2) & 0x1f);
    const date = (((yr < 1980 ? 0 : yr - 1980) & 0x7f) << 9) |
                 (((d.getMonth() + 1) & 0xf) << 5) |
                 (d.getDate() & 0x1f);
    return { time: time & 0xffff, date: date & 0xffff };
  }

  function writeUint16LE(arr, offset, val) {
    arr[offset] = val & 0xff;
    arr[offset + 1] = (val >>> 8) & 0xff;
  }

  function writeUint32LE(arr, offset, val) {
    arr[offset] = val & 0xff;
    arr[offset + 1] = (val >>> 8) & 0xff;
    arr[offset + 2] = (val >>> 16) & 0xff;
    arr[offset + 3] = (val >>> 24) & 0xff;
  }

  /**
   * Đóng gói danh sách file vào ZIP STORED (không nén).
   * @param {Array<{name:string, data:Uint8Array}>} files
   * @returns {Uint8Array}
   */
  function zipStore(files) {
    const dt = dosDateTime();
    const localChunks = [];
    const centralChunks = [];
    let offset = 0;
    let centralSize = 0;

    files.forEach(function (f) {
      const nameBytes = utf8(f.name);
      const data = f.data;
      const c = crc32(data);
      const size = data.length;

      const local = new Uint8Array(30 + nameBytes.length);
      writeUint32LE(local, 0, 0x04034b50);
      writeUint16LE(local, 4, 20);
      writeUint16LE(local, 6, 0x0800);
      writeUint16LE(local, 8, 0);
      writeUint16LE(local, 10, dt.time);
      writeUint16LE(local, 12, dt.date);
      writeUint32LE(local, 14, c);
      writeUint32LE(local, 18, size);
      writeUint32LE(local, 22, size);
      writeUint16LE(local, 26, nameBytes.length);
      writeUint16LE(local, 28, 0);
      local.set(nameBytes, 30);

      localChunks.push(local);
      localChunks.push(data);

      const central = new Uint8Array(46 + nameBytes.length);
      writeUint32LE(central, 0, 0x02014b50);
      writeUint16LE(central, 4, 20);
      writeUint16LE(central, 6, 20);
      writeUint16LE(central, 8, 0x0800);
      writeUint16LE(central, 10, 0);
      writeUint16LE(central, 12, dt.time);
      writeUint16LE(central, 14, dt.date);
      writeUint32LE(central, 16, c);
      writeUint32LE(central, 20, size);
      writeUint32LE(central, 24, size);
      writeUint16LE(central, 28, nameBytes.length);
      writeUint16LE(central, 30, 0);
      writeUint16LE(central, 32, 0);
      writeUint16LE(central, 34, 0);
      writeUint16LE(central, 36, 0);
      writeUint32LE(central, 38, 0);
      writeUint32LE(central, 42, offset);
      central.set(nameBytes, 46);
      centralChunks.push(central);

      offset += local.length + data.length;
      centralSize += central.length;
    });

    const eocd = new Uint8Array(22);
    writeUint32LE(eocd, 0, 0x06054b50);
    writeUint16LE(eocd, 4, 0);
    writeUint16LE(eocd, 6, 0);
    writeUint16LE(eocd, 8, files.length);
    writeUint16LE(eocd, 10, files.length);
    writeUint32LE(eocd, 12, centralSize);
    writeUint32LE(eocd, 16, offset);
    writeUint16LE(eocd, 20, 0);

    const total = offset + centralSize + eocd.length;
    const out = new Uint8Array(total);
    let pos = 0;
    for (let i = 0; i < localChunks.length; i++) {
      out.set(localChunks[i], pos);
      pos += localChunks[i].length;
    }
    for (let i = 0; i < centralChunks.length; i++) {
      out.set(centralChunks[i], pos);
      pos += centralChunks[i].length;
    }
    out.set(eocd, pos);
    return out;
  }

  /**
   * Tạo Blob .xlsx từ header + rows.
   * @param {{sheetName?:string, header:Array<string>, rows:Array<Array>}} opts
   * @returns {Blob}
   */
  function buildXlsxBlob(opts) {
    const o = opts || {};
    const sheetName = o.sheetName ? String(o.sheetName) : 'Sheet1';
    const header = Array.isArray(o.header) ? o.header : [];
    const rows = Array.isArray(o.rows) ? o.rows : [];

    const files = [
      { name: '[Content_Types].xml',        data: utf8(buildContentTypes()) },
      { name: '_rels/.rels',                data: utf8(buildRootRels()) },
      { name: 'xl/workbook.xml',            data: utf8(buildWorkbook(sheetName)) },
      { name: 'xl/_rels/workbook.xml.rels', data: utf8(buildWorkbookRels()) },
      { name: 'xl/styles.xml',              data: utf8(buildStyles()) },
      { name: 'xl/worksheets/sheet1.xml',   data: utf8(buildSheetXml(header, rows)) }
    ];

    const zipBytes = zipStore(files);
    return new Blob(
      [zipBytes],
      { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
    );
  }

  window.THXlsx = {
    buildXlsxBlob: buildXlsxBlob,
    crc32: crc32,
    colName: colName
  };
})();
