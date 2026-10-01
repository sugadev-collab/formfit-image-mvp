/* FormFit Image – checks every tool page: correct preset, SEO tags, footer, and a full
 * process → download run with a generated image. Open tests/pages-test.html. */
(async function () {
  'use strict';
  var PAGES = [
    { path: '../index.html', maxKb: '50', minKb: '20', mode: 'photo' },
    { path: '../resize-image-to-20kb/index.html', maxKb: '20', minKb: '', mode: 'photo' },
    { path: '../resize-image-to-50kb/index.html', maxKb: '50', minKb: '', mode: 'photo' },
    { path: '../resize-image-to-100kb/index.html', maxKb: '100', minKb: '', mode: 'photo' },
    { path: '../signature-resize-10kb-to-20kb/index.html', maxKb: '20', minKb: '10', mode: 'signature' },
    { path: '../ssc-photo-signature-resize/index.html', maxKb: '', minKb: '', mode: 'photo', custom: true }
  ];
  var frame = document.getElementById('frame'), out = document.getElementById('out');
  var pass = 0, fail = 0;

  function log(ok, name, detail) {
    ok ? pass++ : fail++;
    var line = (ok ? 'PASS' : 'FAIL') + ' | ' + name + ' | ' + detail;
    console.log(line);
    var li = document.createElement('li'); li.textContent = line;
    li.style.color = ok ? '#15803d' : '#b91c1c'; out.appendChild(li);
  }
  function load(src) { return new Promise(function (r) { frame.onload = r; frame.src = src; }); }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  for (var i = 0; i < PAGES.length; i++) {
    var p = PAGES[i];
    var errors = [];
    await load(p.path);
    var win = frame.contentWindow, doc = win.document;
    win.addEventListener('error', function (e) { errors.push(e.message); });

    // 1. Preset + SEO
    var mode = doc.querySelector('input[name="mode"]:checked').value;
    var presetOk = doc.getElementById('max-kb').value === p.maxKb && doc.getElementById('min-kb').value === p.minKb && mode === p.mode;
    var canonical = doc.querySelector('link[rel="canonical"]');
    var ld = doc.querySelector('script[type="application/ld+json"]'), ldOk = false;
    try { ldOk = JSON.parse(ld.textContent)['@type'] === 'FAQPage'; } catch (e) {}
    var seoOk = !!canonical && !!doc.querySelector('meta[name="description"]') && doc.querySelectorAll('h1').length === 1 && ldOk;
    var footerOk = doc.querySelectorAll('.footer-nav a').length === 7;
    var cssOk = win.getComputedStyle(doc.querySelector('.btn-primary')).backgroundColor !== 'rgba(0, 0, 0, 0)';
    log(presetOk && seoOk && footerOk && cssOk, p.path + ' setup',
      'max=' + doc.getElementById('max-kb').value + ' min=' + doc.getElementById('min-kb').value + ' mode=' + mode +
      ' seo=' + seoOk + ' footer=' + footerOk + ' css=' + cssOk);

    // 2. Custom page: button must stay disabled until max KB entered
    if (p.custom) {
      log(doc.getElementById('process-btn').disabled && !doc.getElementById('settings-error').hidden, p.path + ' requires values', 'button disabled until Max KB is entered');
      doc.getElementById('max-kb').value = 20;
      doc.getElementById('min-kb').value = 10;
      doc.getElementById('max-kb').dispatchEvent(new win.Event('input'));
    }

    // 3. Full run
    var c = doc.createElement('canvas'); c.width = 900; c.height = 1200;
    var ctx = c.getContext('2d'); var g = ctx.createLinearGradient(0, 0, 900, 1200);
    g.addColorStop(0, '#d9a07a'); g.addColorStop(1, '#2a4d7a'); ctx.fillStyle = g; ctx.fillRect(0, 0, 900, 1200);
    var blob = await new Promise(function (r) { c.toBlob(r, 'image/jpeg', 0.95); });
    var dt = new win.DataTransfer(); dt.items.add(new win.File([blob], 't.jpg', { type: 'image/jpeg' }));
    var input = doc.getElementById('file-input'); input.files = dt.files; input.dispatchEvent(new win.Event('change'));
    for (var t = 0; t < 30 && doc.getElementById('process-btn').disabled; t++) await wait(100);
    doc.getElementById('process-btn').click();
    for (t = 0; t < 100 && !doc.getElementById('download-btn'); t++) await wait(100);
    var dl = doc.getElementById('download-btn');
    var allPass = dl && doc.querySelectorAll('.checklist li.fail').length === 0;
    log(!!allPass && errors.length === 0, p.path + ' process', dl ? dl.getAttribute('download') + ' | ' + doc.querySelector('.checklist li').innerText : 'no result; errors=' + errors.join(';'));
  }

  // Static pages
  for (var s of ['../privacy/index.html', '../404.html']) {
    await load(s);
    var d = frame.contentDocument;
    log(d.querySelectorAll('h1').length === 1 && !d.getElementById('file-input'), s, 'title=' + d.title);
  }

  var summary = 'SUMMARY: ' + pass + ' passed, ' + fail + ' failed';
  console.log(summary); document.getElementById('summary').textContent = summary;
})();
