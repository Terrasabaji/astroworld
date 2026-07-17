/**
 * Astro World — bridge Chart Engine birth session into embedded module iframes.
 */
(function () {
  'use strict';

  function pad2(n) {
    return String(n).padStart(2, '0');
  }

  function setVal(id, value) {
    const el = document.getElementById(id);
    if (el && value !== undefined && value !== null) el.value = value;
  }

  function fillPerson(prefix, p) {
    if (!p) return;
    setVal(prefix + 'name', p.name || (prefix === 'b_' ? 'Groom' : 'Bride'));
    setVal(prefix + 'place', p.place || '');
    setVal(prefix + 'y', p.year);
    setVal(prefix + 'm', p.month);
    setVal(prefix + 'd', p.day);
    setVal(prefix + 'h', p.hour);
    setVal(prefix + 'min', p.minute);
    setVal(prefix + 'tz', p.tz_offset);
    setVal(prefix + 'lat', p.latitude);
    setVal(prefix + 'lon', p.longitude);
  }

  function fillMarriage(data) {
    fillPerson('b_', data.groom);
    fillPerson('g_', data.bride);
    // Marital status from Chart Engine birth session (gates marriage-event timing).
    window.__AW_MARITAL__ = {
      groom: (data.groom && data.groom.marital_status) || 'unmarried',
      bride: (data.bride && data.bride.marital_status) || 'unmarried',
      native: (data.native && data.native.marital_status)
        || (data.groom && data.groom.marital_status)
        || 'unmarried',
    };
  }

  function fillHealth(native) {
    if (!native) return;
    setVal('name', native.name || 'Native');
    setVal('dob', `${native.year}-${pad2(native.month)}-${pad2(native.day)}`);
    setVal('tob', `${pad2(native.hour)}:${pad2(native.minute)}`);
    setVal('lat', native.latitude);
    setVal('lon', native.longitude);
    setVal('tz', native.tz_offset);
    const unknown = document.getElementById('unknown-time');
    if (unknown) unknown.checked = false;
    const tob = document.getElementById('tob');
    if (tob) tob.disabled = false;
    const resolved = document.getElementById('place-resolved');
    if (resolved && native.place) {
      resolved.textContent = 'From Chart Engine: ' + native.place;
    }
  }

  function fillBtr(native) {
    if (!native) return;
    setVal('native_name', native.name || 'Native');
    setVal('b_dt', `${native.year}-${pad2(native.month)}-${pad2(native.day)}T${pad2(native.hour)}:${pad2(native.minute)}:00`);
    setVal('b_tz', native.tz_offset);
    setVal('b_place', native.place || '');
    setVal('b_lat', native.latitude);
    setVal('b_lon', native.longitude);
    const cdt = document.getElementById('c_dt');
    if (cdt && !cdt.value) {
      const now = new Date();
      now.setSeconds(0, 0);
      cdt.value = now.toISOString().slice(0, 16);
    }
  }

  function fillPrashna(native) {
    if (!native) return;
    // Manual / Mooka Prashna location fields (if present in prashna.html)
    ['pr_lat', 'pr_lon', 'pr_tz', 'pr_place', 'lat', 'lon', 'tz', 'place'].forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      if (id.includes('lat')) el.value = native.latitude;
      else if (id.includes('lon')) el.value = native.longitude;
      else if (id === 'pr_tz' || id === 'tz') el.value = native.tz_offset;
      else el.value = native.place || '';
    });
  }

  function autoRun(module) {
    if (module === 'health') {
      const form = document.getElementById('birth-form');
      if (form) form.requestSubmit();
    } else if (module === 'marriage') {
      const form = document.getElementById('matchForm');
      if (form) form.requestSubmit();
    }
  }

  function applyPayload(msg) {
    const module = msg.module || document.body.dataset.siddhantaModule;
    if (!module) return;

    if (module === 'marriage') {
      fillMarriage(msg);
    } else if (module === 'health') {
      fillHealth(msg.native || msg);
    } else if (module === 'btr') {
      fillBtr(msg.native || msg);
    } else if (module === 'prashna') {
      fillPrashna(msg.native || msg);
    }

    if (msg.autoRun) autoRun(module);
  }

  window.addEventListener('message', (event) => {
    if (!event.data || event.data.type !== 'siddhanta-birth') return;
    applyPayload(event.data);
  });

  // Signal parent that iframe is ready to receive birth data
  window.addEventListener('DOMContentLoaded', () => {
    if (window.parent !== window) {
      window.parent.postMessage({ type: 'siddhanta-module-ready', module: document.body.dataset.siddhantaModule }, '*');
    }
  });
})();
