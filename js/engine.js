/* FormFit Image – processing engine (Session 2).
 *
 * PUBLIC API
 *   window.FF_engine.fitImage(file, settings) -> Promise<Result>
 *       Pure processing (no DOM output). Used by tests/engine-test.html.
 *   window.FF_process(state, settings)
 *       Called by js/ui.js when the user taps "Resize & Compress".
 *       Runs fitImage and renders the result into #result-section.
 *
 * settings = { mode:'photo'|'signature', minKb|null, maxKb, width|null, height|null, fit:'crop'|'pad' }
 * Result   = { blob, width, height, quality, padded, status:'ok'|'max-miss', ms }
 *
 * KB RULE: max is checked as maxKb*1000 bytes and min as minKb*1024 bytes, so the
 * file passes whether a portal means 1 KB = 1000 or 1 KB = 1024 bytes.
 *
 * MIN-KB PADDING: if the best image is still below the minimum (common for plain
 * signatures), blank JPEG comment (COM) segments are inserted. The image pixels are
 * unchanged; the user is told about this in the result card.
 *
 * Privacy: everything happens in memory in the browser. Nothing is sent over the network.
 */
(function () {
  'use strict';

  var MAX_SIDE = 4000;        // longest side when no dimensions are given (memory safety)
  var Q_MIN = 0.05, Q_MAX = 1.0, Q_STEPS = 8;
  var MAX_SHRINK_ROUNDS = 12;
  var MIN_SIDE = 32;
  var GOOD_Q = 0.5;           // with free dimensions, shrink the image rather than go below this quality
  var lastResultUrl = null;

  function track(name, data) {
    if (typeof window.FF_track === 'function') { try { window.FF_track(name, data); } catch (e) {} }
  }

  /* ---------- Decode (EXIF orientation is applied by modern browsers) ---------- */
  function decode(file) {
    function viaImg() {
      return new Promise(function (resolve, reject) {
        var url = URL.createObjectURL(file);
        var img = new Image();
        img.onload = function () {
          resolve({ src: img, w: img.naturalWidth, h: img.naturalHeight, close: function () { URL.revokeObjectURL(url); } });
        };
        img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('decode')); };
        img.src = url;
      });
    }
    if (typeof window.createImageBitmap === 'function') {
      return createImageBitmap(file).then(function (bmp) {
        return { src: bmp, w: bmp.width, h: bmp.height, close: function () { if (bmp.close) bmp.close(); } };
      }, viaImg);
    }
    return viaImg();
  }

  /* ---------- Target size ---------- */
  function targetSize(srcW, srcH, s) {
    if (s.width && s.height) return { w: Math.round(s.width), h: Math.round(s.height), fixed: true };
    if (s.width) return { w: Math.round(s.width), h: Math.max(1, Math.round(srcH * s.width / srcW)), fixed: true };
    if (s.height) return { w: Math.max(1, Math.round(srcW * s.height / srcH)), h: Math.round(s.height), fixed: true };
    var k = Math.min(1, MAX_SIDE / Math.max(srcW, srcH));
    return { w: Math.max(1, Math.round(srcW * k)), h: Math.max(1, Math.round(srcH * k)), fixed: false };
  }

  /* ---------- Render to canvas (white background, crop or pad) ---------- */
  function makeCanvas(w, h) {
    var c = document.createElement('canvas');
    c.width = w; c.height = h;
    return c;
  }

  // Halve the source until it is at most 2x the needed size (better downscale quality).
  function stepDown(src, srcW, srcH, scale) {
    while (scale < 0.5 && srcW > 2 && srcH > 2) {
      var nw = Math.round(srcW / 2), nh = Math.round(srcH / 2);
      var c = makeCanvas(nw, nh), ctx = c.getContext('2d');
      ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(src, 0, 0, nw, nh);
      if (src.tagName === 'CANVAS') src.width = 0; // free intermediate memory
      src = c; scale *= srcW / nw; srcW = nw; srcH = nh;
    }
    return { src: src, w: srcW, h: srcH };
  }

  function render(d, w, h, fit) {
    var srcRatio = d.w / d.h, dstRatio = w / h;
    var scale = fit === 'pad' ? Math.min(w / d.w, h / d.h) : Math.max(w / d.w, h / d.h);
    var s = stepDown(d.src, d.w, d.h, scale);
    var c = makeCanvas(w, h), ctx = c.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    if (fit === 'pad') {
      var dw = srcRatio > dstRatio ? w : h * srcRatio;
      var dh = srcRatio > dstRatio ? w / srcRatio : h;
      ctx.drawImage(s.src, (w - dw) / 2, (h - dh) / 2, dw, dh);
    } else { // crop to fill, centred
      var sw = srcRatio > dstRatio ? s.h * dstRatio : s.w;
      var sh = srcRatio > dstRatio ? s.h : s.w / dstRatio;
      ctx.drawImage(s.src, (s.w - sw) / 2, (s.h - sh) / 2, sw, sh, 0, 0, w, h);
    }
    if (s.src !== d.src && s.src.tagName === 'CANVAS') s.src.width = 0;
    return c;
  }

  /* ---------- Encode + quality search ---------- */
  function encode(canvas, q) {
    return new Promise(function (resolve, reject) {
      canvas.toBlob(function (b) { b ? resolve(b) : reject(new Error('encode')); }, 'image/jpeg', q);
    });
  }

  // Highest quality whose size <= maxBytes. fits=false if even Q_MIN is too big.
  async function searchQuality(canvas, maxBytes) {
    var top = await encode(canvas, Q_MAX);
    if (top.size <= maxBytes) return { blob: top, q: Q_MAX, fits: true };
    var low = await encode(canvas, Q_MIN);
    if (low.size > maxBytes) return { blob: low, q: Q_MIN, fits: false };
    var lo = Q_MIN, hi = Q_MAX, best = low, bestQ = Q_MIN;
    for (var i = 0; i < Q_STEPS; i++) {
      var mid = (lo + hi) / 2, b = await encode(canvas, mid);
      if (b.size <= maxBytes) { best = b; bestQ = mid; lo = mid; } else { hi = mid; }
    }
    return { blob: best, q: bestQ, fits: true };
  }

  /* ---------- Min-KB padding with JPEG COM segments ---------- */
  async function padJpeg(blob, targetBytes) {
    var buf = new Uint8Array(blob.arrayBuffer ? await blob.arrayBuffer() : await new Response(blob).arrayBuffer());
    if (buf[0] !== 0xFF || buf[1] !== 0xD8) return blob; // not a JPEG; leave untouched
    var need = targetBytes - buf.length;
    if (need <= 0) return blob;
    var parts = [buf.subarray(0, 2)];
    while (need > 0) {
      var total = Math.max(4, Math.min(need, 65537)); // marker(2) + length(2) + payload(<=65533)
      var seg = new Uint8Array(total), len = total - 2;
      seg[0] = 0xFF; seg[1] = 0xFE; seg[2] = len >> 8; seg[3] = len & 255;
      seg.fill(0x20, 4);
      parts.push(seg);
      need -= total;
    }
    parts.push(buf.subarray(2));
    return new Blob(parts, { type: 'image/jpeg' });
  }

  /* ---------- Main ---------- */
  async function fitImage(file, s) {
    var t0 = Date.now();
    var maxBytes = Math.floor(s.maxKb * 1000);
    var minBytes = s.minKb ? Math.ceil(s.minKb * 1024) : 0;
    if (minBytes > maxBytes) minBytes = Math.ceil(s.minKb * 1000); // very narrow ranges
    var fit = (s.width && s.height) ? s.fit : 'crop';

    var d = await decode(file);
    try {
      var size = targetSize(d.w, d.h, s), w = size.w, h = size.h, r;
      for (var round = 0; round <= MAX_SHRINK_ROUNDS; round++) {
        var canvas = render(d, w, h, fit);
        r = await searchQuality(canvas, maxBytes);
        canvas.width = 0;
        // Free dimensions: prefer a smaller image over a blurry one (quality < GOOD_Q).
        var goodEnough = r.fits && (size.fixed || r.q >= GOOD_Q);
        if (goodEnough || size.fixed || Math.min(w, h) <= MIN_SIDE) break;
        // Shrink proportionally to the overshoot (size at lowest q, or at the q we got).
        var k = r.fits ? 0.75 : Math.min(0.9, Math.max(0.5, Math.sqrt(maxBytes / r.blob.size) * 0.95));
        w = Math.max(MIN_SIDE, Math.round(w * k)); h = Math.max(MIN_SIDE, Math.round(h * k));
      }

      var blob = r.blob, padded = false;
      if (r.fits && minBytes && blob.size < minBytes) {
        var target = Math.max(minBytes, Math.min(maxBytes - 200, minBytes + 1024));
        blob = await padJpeg(blob, target);
        padded = blob.size > r.blob.size;
      }
      return {
        blob: blob, width: w, height: h, quality: r.q, padded: padded,
        status: blob.size <= maxBytes ? 'ok' : 'max-miss', ms: Date.now() - t0
      };
    } finally { d.close(); }
  }

  /* ---------- UI rendering ---------- */
  function fmtKb(bytes) { return (bytes / 1024).toFixed(1) + ' KB'; }
  function fmtBytes(bytes) { return bytes.toLocaleString('en-US') + ' bytes'; }

  function row(ok, label, text) {
    return '<li class="' + (ok ? 'pass' : 'fail') + '"><span aria-hidden="true">' + (ok ? '✅' : '❌') +
      '</span> <strong>' + label + ':</strong> ' + text + '</li>';
  }

  function renderResult(box, res, s) {
    if (lastResultUrl) URL.revokeObjectURL(lastResultUrl);
    var url = lastResultUrl = URL.createObjectURL(res.blob);
    var bytes = res.blob.size;
    var maxOk = bytes <= s.maxKb * 1000;
    var minOk = !s.minKb || bytes >= Math.min(s.minKb * 1024, s.maxKb * 1000);
    var range = s.minKb ? s.minKb + '–' + s.maxKb + ' KB' : 'max ' + s.maxKb + ' KB';
    var dimsWanted = s.width || s.height;
    var dimsOk = (!s.width || res.width === Math.round(s.width)) && (!s.height || res.height === Math.round(s.height));
    var name = s.mode + '_' + Math.round(bytes / 1024) + 'kb.jpg';

    var html =
      '<h2 class="result-title">' + (maxOk && minOk && dimsOk ? 'Your file is ready' : 'Check the result') + '</h2>' +
      '<figure class="result-preview"><img id="result-img" src="' + url + '" alt="Processed image preview"></figure>' +
      '<ul class="checklist">' +
      row(maxOk && minOk, 'File size', fmtKb(bytes) + ' (' + fmtBytes(bytes) + ') · required ' + range) +
      row(!dimsWanted || dimsOk, 'Dimensions', res.width + ' × ' + res.height + ' px' +
        (dimsWanted ? ' · required ' + (s.width || 'auto') + ' × ' + (s.height || 'auto') + ' px' : '')) +
      row(true, 'Format', 'JPG') +
      '</ul>';

    if (!maxOk) {
      html += '<p class="error">We could not make the file small enough at ' + res.width + ' × ' + res.height +
        ' px. Try smaller dimensions or a higher max KB.</p>';
    }
    if (res.padded) {
      html += '<p class="muted">Your image was smaller than the minimum size, so blank data was added to the file to reach it. The picture itself has not changed.</p>';
    }
    html +=
      '<a id="download-btn" class="btn-primary btn-link" href="' + url + '" download="' + name + '">⬇ Download ' + name + '</a>' +
      '<p class="muted small">Download not working? Long-press the image above and choose <em>Save image</em>, or open this page in Chrome.</p>' +
      '<div class="btn-row">' +
      '<button type="button" id="again-settings-btn" class="btn-secondary">Change settings</button>' +
      '<button type="button" id="again-file-btn" class="btn-secondary">New image</button>' +
      '</div>';

    box.innerHTML = html;
    box.hidden = false;

    document.getElementById('download-btn').addEventListener('click', function () {
      track('download_click', { kb: Math.round(bytes / 1024), mode: s.mode });
    });
    document.getElementById('again-settings-btn').addEventListener('click', function () {
      document.getElementById('preset-chips').scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    document.getElementById('again-file-btn').addEventListener('click', function () {
      var input = document.getElementById('file-input');
      input.value = '';
      input.click();
    });
    box.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function renderError(box, err) {
    var msg = 'Something went wrong while processing this image. Please try another file.';
    if (err && err.message === 'decode') msg = 'This image could not be read. It may be damaged or in an unsupported format.';
    else if (err && (err.name === 'RangeError' || /memory|allocation/i.test(err.message || ''))) {
      msg = 'Your device ran out of memory with this image. Try a smaller photo or a screenshot of it.';
    }
    box.innerHTML = '<p class="error" role="alert">' + msg + '</p>';
    box.hidden = false;
  }

  window.FF_process = async function (state, s) {
    var btn = document.getElementById('process-btn');
    var box = document.getElementById('result-section');
    var label = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner" aria-hidden="true"></span> Processing…';
    try {
      var res = await fitImage(state.file, s);
      renderResult(box, res, s);
      track('process_success', { status: res.status, padded: res.padded, ms: res.ms, mode: s.mode });
    } catch (err) {
      console.error('FormFit processing failed:', err);
      renderError(box, err);
      track('process_error', { reason: (err && err.message) || 'unknown' });
    } finally {
      btn.innerHTML = label;
      btn.disabled = false;
    }
  };

  window.FF_engine = { fitImage: fitImage, padJpeg: padJpeg };
})();
