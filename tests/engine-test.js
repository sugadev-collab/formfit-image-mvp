/* FormFit Image – engine self-test. Open tests/engine-test.html in a browser.
 * Generates synthetic images in memory (nothing is uploaded) and checks that
 * FF_engine.fitImage meets each requirement. Results appear on the page and in the console. */
(async function () {
  'use strict';
  var out = document.getElementById('out');
  var pass = 0, fail = 0;

  function log(ok, name, detail) {
    ok ? pass++ : fail++;
    var line = (ok ? 'PASS' : 'FAIL') + ' | ' + name + ' | ' + detail;
    console.log(line);
    var li = document.createElement('li');
    li.textContent = line;
    li.style.color = ok ? '#15803d' : '#b91c1c';
    out.appendChild(li);
  }

  function makeImage(w, h, kind, type) {
    var c = document.createElement('canvas'); c.width = w; c.height = h;
    var ctx = c.getContext('2d');
    if (kind === 'photo') { // gradient + noise ≈ real camera photo
      var g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, '#c08060'); g.addColorStop(1, '#305080');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      var id = ctx.getImageData(0, 0, w, h), d = id.data;
      for (var i = 0; i < d.length; i += 4) { var n = (Math.random() - 0.5) * 60; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
      ctx.putImageData(id, 0, 0);
    } else { // signature: dark strokes on transparent background
      ctx.strokeStyle = '#102060'; ctx.lineWidth = Math.max(2, w / 150);
      ctx.beginPath(); ctx.moveTo(w * 0.1, h * 0.6);
      for (var x = 0.1; x < 0.9; x += 0.02) ctx.lineTo(w * x, h * (0.5 + 0.25 * Math.sin(x * 25)));
      ctx.stroke();
    }
    return new Promise(function (r) { c.toBlob(function (b) { r(new File([b], 'test.' + (type === 'image/png' ? 'png' : 'jpg'), { type: type })); }, type, 0.92); });
  }

  var photo = await makeImage(3000, 4000, 'photo', 'image/jpeg');
  var sig = await makeImage(800, 300, 'signature', 'image/png');
  var cases = [
    { name: 'Photo 20–50KB @200x230 crop', file: photo, s: { mode: 'photo', minKb: 20, maxKb: 50, width: 200, height: 230, fit: 'crop' } },
    { name: 'Photo 20–50KB @200x230 pad', file: photo, s: { mode: 'photo', minKb: 20, maxKb: 50, width: 200, height: 230, fit: 'pad' } },
    { name: 'Photo 20–50KB no dims', file: photo, s: { mode: 'photo', minKb: 20, maxKb: 50, width: null, height: null, fit: 'crop' } },
    { name: 'Photo under 20KB no dims', file: photo, s: { mode: 'photo', minKb: null, maxKb: 20, width: null, height: null, fit: 'crop' } },
    { name: 'Photo under 200KB width only 600', file: photo, s: { mode: 'photo', minKb: null, maxKb: 200, width: 600, height: null, fit: 'crop' } },
    { name: 'Signature PNG 10–20KB @140x60', file: sig, s: { mode: 'signature', minKb: 10, maxKb: 20, width: 140, height: 60, fit: 'pad' } },
    { name: 'Signature PNG 10–20KB no dims', file: sig, s: { mode: 'signature', minKb: 10, maxKb: 20, width: null, height: null, fit: 'crop' } },
    { name: 'Impossible: 2000x2000 under 5KB (expect max-miss)', file: photo, s: { mode: 'photo', minKb: null, maxKb: 5, width: 2000, height: 2000, fit: 'crop' }, expectMiss: true }
  ];

  for (var i = 0; i < cases.length; i++) {
    var c = cases[i];
    try {
      var r = await FF_engine.fitImage(c.file, c.s);
      var b = r.blob.size;
      var sizeOk = b <= c.s.maxKb * 1000 && (!c.s.minKb || b >= c.s.minKb * 1024);
      var dimsOk = (!c.s.width || r.width === c.s.width) && (!c.s.height || r.height === c.s.height);
      // Verify output really is a decodable JPEG with the expected size
      var bmp = await createImageBitmap(r.blob);
      var decodeOk = bmp.width === r.width && bmp.height === r.height && r.blob.type === 'image/jpeg';
      var ok = c.expectMiss ? r.status === 'max-miss' : (sizeOk && dimsOk && decodeOk && r.status === 'ok');
      log(ok, c.name, b + ' B, ' + r.width + 'x' + r.height + ', q=' + r.quality.toFixed(2) + ', padded=' + r.padded + ', status=' + r.status + ', ' + r.ms + 'ms');
    } catch (e) { log(false, c.name, 'threw ' + e.message); }
  }

  try {
    await FF_engine.fitImage(new File([new Uint8Array([1, 2, 3, 4])], 'bad.jpg', { type: 'image/jpeg' }), cases[0].s);
    log(false, 'Corrupt file rejected', 'no error thrown');
  } catch (e) { log(e.message === 'decode', 'Corrupt file rejected', 'error=' + e.message); }

  var summary = 'SUMMARY: ' + pass + ' passed, ' + fail + ' failed';
  console.log(summary);
  document.getElementById('summary').textContent = summary;
})();
