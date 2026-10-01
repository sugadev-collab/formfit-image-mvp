/* FormFit Image – UI controller (Session 1).
 * Handles presets, settings validation, file selection and preview.
 * Processing engine (js/engine.js) is added in Session 2 and hooks into
 * window.FF_STATE + the #process-btn click handler below. */
(function () {
  'use strict';

  var MAX_FILE_BYTES = 25 * 1024 * 1024; // 25 MB hard limit (mobile memory safety)
  var ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'];

  var $ = function (id) { return document.getElementById(id); };
  var els = {
    chips: $('preset-chips'), minKb: $('min-kb'), maxKb: $('max-kb'),
    width: $('width-px'), height: $('height-px'), fitRow: $('fit-row'),
    settingsError: $('settings-error'), fileInput: $('file-input'),
    fileText: $('file-drop-text'), fileError: $('file-error'),
    previewBox: $('preview-box'), previewImg: $('preview-img'),
    previewInfo: $('preview-info'), processBtn: $('process-btn')
  };

  // Shared state for the engine (Session 2)
  var state = window.FF_STATE = { file: null, previewUrl: null, imgWidth: 0, imgHeight: 0 };

  /* ---------- Presets ---------- */
  function renderChips() {
    var presets = window.FF_PRESETS || {};
    Object.keys(presets).forEach(function (key) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip';
      b.dataset.preset = key;
      b.textContent = presets[key].label;
      b.addEventListener('click', function () { applyPreset(key); });
      els.chips.appendChild(b);
    });
  }

  function applyPreset(key) {
    var p = window.FF_PRESETS[key];
    if (!p) return;
    els.minKb.value = p.minKb || '';
    els.maxKb.value = p.maxKb || '';
    if (p.width) els.width.value = p.width;
    if (p.height) els.height.value = p.height;
    if (p.mode) {
      var r = document.querySelector('input[name="mode"][value="' + p.mode + '"]');
      if (r) r.checked = true;
    }
    Array.prototype.forEach.call(els.chips.children, function (c) {
      c.classList.toggle('active', c.dataset.preset === key);
      c.setAttribute('aria-pressed', c.dataset.preset === key ? 'true' : 'false');
    });
    validateSettings();
  }

  function clearActiveChip() {
    Array.prototype.forEach.call(els.chips.children, function (c) {
      c.classList.remove('active');
      c.setAttribute('aria-pressed', 'false');
    });
  }

  /* ---------- Settings ---------- */
  function num(input) {
    var v = parseFloat(input.value);
    return isFinite(v) && v > 0 ? v : null;
  }

  function getSettings() {
    return {
      mode: document.querySelector('input[name="mode"]:checked').value,
      minKb: num(els.minKb), maxKb: num(els.maxKb),
      width: num(els.width), height: num(els.height),
      fit: document.querySelector('input[name="fit"]:checked').value
    };
  }
  window.FF_getSettings = getSettings;

  function validateSettings() {
    var s = getSettings(), msg = '';
    if (!s.maxKb) msg = 'Enter the maximum KB size from your form.';
    else if (s.minKb && s.minKb >= s.maxKb) msg = 'Min KB must be smaller than Max KB.';
    else if (s.maxKb > 10000) msg = 'Max KB looks too large. Please check the value.';
    else if ((s.width && s.width > 6000) || (s.height && s.height > 6000)) msg = 'Width or height above 6000 px is not supported.';

    els.settingsError.textContent = msg;
    els.settingsError.hidden = !msg;
    // Fit options are only relevant when both dimensions are fixed
    els.fitRow.hidden = !(s.width && s.height);
    updateProcessBtn(!msg);
    return !msg;
  }

  function updateProcessBtn(settingsOk) {
    if (settingsOk === undefined) settingsOk = !els.settingsError.textContent;
    els.processBtn.disabled = !(settingsOk && state.file);
  }

  /* ---------- File selection ---------- */
  function showFileError(msg) {
    els.fileError.textContent = msg;
    els.fileError.hidden = !msg;
  }

  function formatSize(bytes) {
    return bytes >= 1024 * 1024
      ? (bytes / (1024 * 1024)).toFixed(2) + ' MB'
      : (bytes / 1024).toFixed(1) + ' KB';
  }

  function resetFile() {
    if (state.previewUrl) URL.revokeObjectURL(state.previewUrl);
    state.file = null; state.previewUrl = null; state.imgWidth = state.imgHeight = 0;
    els.previewBox.hidden = true;
    document.getElementById('result-section').hidden = true; // stale result from previous file
    els.fileText.textContent = 'Tap to choose a photo (JPG, PNG, WebP)';
    updateProcessBtn();
  }

  function onFileChosen(file) {
    showFileError('');
    resetFile();
    if (!file) return;

    var isHeic = /\.(heic|heif)$/i.test(file.name) || /heic|heif/i.test(file.type);
    if (isHeic) return showFileError('HEIC photos are not supported yet. On iPhone, choose "Most Compatible" in Camera settings, or take a screenshot of the photo and upload that.');
    if (ACCEPTED.indexOf(file.type) === -1) return showFileError('Unsupported file type. Please choose a JPG, PNG or WebP image.');
    if (file.size > MAX_FILE_BYTES) return showFileError('File is too large (' + formatSize(file.size) + '). Maximum is 25 MB.');

    var url = URL.createObjectURL(file);
    var img = els.previewImg;
    img.onload = function () {
      state.file = file;
      state.previewUrl = url;
      state.imgWidth = img.naturalWidth;
      state.imgHeight = img.naturalHeight;
      els.previewInfo.textContent = img.naturalWidth + ' × ' + img.naturalHeight + ' px · ' + formatSize(file.size);
      els.previewBox.hidden = false;
      els.fileText.textContent = 'Change image';
      updateProcessBtn();
    };
    img.onerror = function () {
      URL.revokeObjectURL(url);
      showFileError('This image could not be opened. It may be damaged. Please try another file.');
    };
    img.src = url;
  }

  /* ---------- Wire up ---------- */
  function init() {
    renderChips();
    [els.minKb, els.maxKb, els.width, els.height].forEach(function (i) {
      i.addEventListener('input', function () { clearActiveChip(); validateSettings(); });
    });
    els.fileInput.addEventListener('change', function () {
      onFileChosen(els.fileInput.files && els.fileInput.files[0]);
    });
    els.processBtn.addEventListener('click', function () {
      if (!validateSettings() || !state.file) return;
      if (typeof window.FF_process === 'function') {
        window.FF_process(state, getSettings());
      } else {
        var r = document.getElementById('result-section');
        r.hidden = false;
        r.innerHTML = '<p class="muted">The processing engine has not been added yet (Session 2).</p>';
      }
    });
    applyPreset(document.body.dataset.preset || 'photo-20-50');
  }

  init();
})();
