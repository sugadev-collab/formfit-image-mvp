/* FormFit Image – size presets.
 * Generic presets only. Exam-specific values must be verified against the
 * official notification before being added (see PROJECT_PLAN.md). */
window.FF_PRESETS = {
  'photo-20-50':  { label: 'Photo 20–50 KB',     mode: 'photo',     minKb: 20, maxKb: 50 },
  'sig-10-20':    { label: 'Signature 10–20 KB', mode: 'signature', minKb: 10, maxKb: 20 },
  'under-20':     { label: 'Under 20 KB',        mode: null,        minKb: null, maxKb: 20 },
  'under-50':     { label: 'Under 50 KB',        mode: null,        minKb: null, maxKb: 50 },
  'under-100':    { label: 'Under 100 KB',       mode: null,        minKb: null, maxKb: 100 },
  'under-200':    { label: 'Under 200 KB',       mode: null,        minKb: null, maxKb: 200 }
};
