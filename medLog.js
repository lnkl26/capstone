console.log('medLog.js loaded');

(() => {
  const dlg = document.getElementById('popupMenu');
  const btnMeds = document.getElementById('btnMeds');
  const btnService = document.getElementById('btnService');
  if (!dlg) { console.error('Missing #popupMenu'); return; }

  //ensure styling hook exists even if HTML forgot
  dlg.classList.add('popup-menu');

  //remember the anchor rect so submenu apper in the same spot
  let lastRect = null;

  //single outside click handler
  function handleOutsideClick(e) {
    const wrap = dlg.querySelector('.menu');
    if (!wrap) return;
    const r = wrap.getBoundingClientRect();
    const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    if (!inside) dlg.close();
  }

  function showMenuNear(trigger, items, title) {
    //cache anchor position from trigger if provided
    const rect = trigger?.getBoundingClientRect();
    if (rect) lastRect = rect;

    //build content
    const wrap = document.createElement('div');
    wrap.className = 'menu';

    if (title) {
      const h = document.createElement('div');
      h.textContent = title;
      h.className = 'menu-title';
      wrap.appendChild(h);
    }

    items.forEach(({ label, action, className }) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'menu-btn';
      if (className) b.classList.add(className);
      b.textContent = label;

      //prevent the click from bubbling up to the dialog
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        action?.(e);
      });

      wrap.appendChild(b);
    });

    //swap content
    dlg.innerHTML = '';
    dlg.appendChild(wrap);

  //center the dialog
  dlg.style.top = '50%';
  dlg.style.left = '50%';
  //dlg.style.transform = 'translate(-50%, -50%)';
  dlg.showModal();
    if (!dlg.open) {
      dlg.showModal();
      //usse capturing so backdrop clicks are caught early
      dlg.addEventListener('click', handleOutsideClick, { once: true, capture: true });
    } else {
      //arm outside click listener for the new content
      dlg.removeEventListener('click', handleOutsideClick, { capture: true });
      dlg.addEventListener('click', handleOutsideClick, { once: true, capture: true });
    }
  }

  //menus
  function openManageMenu(trigger) {
    showMenuNear(trigger, [
      { label: 'Add New Medication', action: () => openAddSubmenu() },
      { label: 'Manage Medications', action: () => openManageSubmenu() },
      { label: 'Export / Import',    action: () => openExportSubmenu() },
      { label: 'Close',              action: () => dlg.close(), className: 'danger' },
    ], 'Medication Menu');
  }

  function openAddSubmenu() {
  const formElements = [];

  //build a simple form inside the submenu
  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.placeholder = 'Medication name';
  nameInput.style.width = '96%';
  formElements.push(nameInput);

  const doseInput = document.createElement('input');
  doseInput.type = 'text';
  doseInput.placeholder = 'Dosage (e.g., 10 mg)';
  doseInput.style.width = '96%';
  formElements.push(doseInput);

  //create the menu items (including buttons)
  const items = [
    { 
      label: 'Save', 
      action: () => {
        const name = nameInput.value.trim();
        const dose = doseInput.value.trim();
        if (!name || !dose) {
          alert('Please fill out both fields.');
          return;
        }
        alert(`Saved: ${name} (${dose})`);
        //you could store this in localStorage or JSON here
      } 
    },
    { 
      label: 'Back', 
      action: () => openManageMenu(null), 
      className: 'secondary' 
    },
  ];

  //create the menu wrapper manually
  const rect = null;
  const dlg = document.getElementById('popupMenu');
  const wrap = document.createElement('div');
  wrap.className = 'menu';

  const h = document.createElement('div');
  h.textContent = 'Add Medication';
  h.className = 'title';
  h.margin = '20px 40px';
  wrap.appendChild(h);

  //add input boxes before the buttons
  formElements.forEach(el => wrap.appendChild(el));

  //now add your buttons
  items.forEach(({ label, action, className }) => {
    const b = document.createElement('button');
    if (className) b.classList.add(className);
    b.textContent = label;
    b.addEventListener('click', e => {
      e.stopPropagation();
      action?.(e);
    });
    wrap.appendChild(b);
  });

  dlg.innerHTML = '';
  dlg.appendChild(wrap);
}

function openManageSubmenu() {
  //build the submenu UI manually
  const wrap = document.createElement('div');
  wrap.className = 'menu';

  const h = document.createElement('div');
  h.textContent = 'Manage Options';
  h.className = 'title';
  wrap.appendChild(h);

  //load meds from localStorage
  function getMeds() {
    try { return JSON.parse(localStorage.getItem('meds') || '[]'); }
    catch { return []; }
  }
  function setMeds(arr) {
    localStorage.setItem('meds', JSON.stringify(arr || []));
  }

  //search input
  const search = document.createElement('input');
  search.type = 'search';
  search.placeholder = 'Search medications...';
  search.autocomplete = 'off';
  search.style.width = '100%';
  wrap.appendChild(search);

  //list container
  const list = document.createElement('div');
  wrap.appendChild(list);

  function renderList(filter = '') {
    const meds = getMeds();
    list.innerHTML = '';
    const q = filter.trim().toLowerCase();
    const filtered = meds.filter(m =>
      !q || (m.name || '').toLowerCase().includes(q) || (m.dose || '').toLowerCase().includes(q)
    );

    if (!filtered.length) {
      const empty = document.createElement('div');
      empty.textContent = q ? 'No matches.' : 'No medications saved yet.';
      empty.style.opacity = '0.7';
      list.appendChild(empty);
      return;
    }

    filtered.forEach((m, idxInFiltered) => {
      const row = document.createElement('div');
      row.style.display = 'grid';
      row.style.gridTemplateColumns = '1fr auto';
      row.style.gap = '8px';
      row.style.alignItems = 'center';

      const left = document.createElement('div');
      left.innerHTML = `<strong>${m.name || '(unnamed)'}</strong>${m.dose ? ' — ' + m.dose : ''}`;

      const del = document.createElement('button');
      del.textContent = 'Delete';
      del.classList.add('danger');
      del.addEventListener('click', (e) => {
        e.stopPropagation();
        //delete by identity from full list
        const medsAll = getMeds();
        const i = medsAll.findIndex(x => x === m || ((x.name||'') === (m.name||'') && (x.dose||'') === (m.dose||'')));
        if (i > -1) {
          medsAll.splice(i, 1);
          setMeds(medsAll);
          renderList(search.value);
        }
      });

      row.appendChild(left);
      row.appendChild(del);
      list.appendChild(row);
    });
  }

  renderList();
  search.addEventListener('input', () => renderList(search.value));

  //confirm clear all
  const confirmWrap = document.createElement('label');
  confirmWrap.style.display = 'flex';
  confirmWrap.style.alignItems = 'center';
  confirmWrap.style.gap = '8px';
  const confirmChk = document.createElement('input');
  confirmChk.type = 'checkbox';
  const confirmTxt = document.createElement('span');
  confirmTxt.textContent = 'Yes, permanently delete all medications';
  confirmWrap.appendChild(confirmChk);
  confirmWrap.appendChild(confirmTxt);
  wrap.appendChild(confirmWrap);

  //buttons
  const btnClear = document.createElement('button');
  btnClear.textContent = 'Clear All';
  btnClear.classList.add('danger');
  btnClear.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!confirmChk.checked) {
      alert('Please check the confirmation box to clear all.');
      return;
    }
    localStorage.setItem('meds', '[]');
    confirmChk.checked = false;
    renderList('');
    search.value = '';
  });
  wrap.appendChild(btnClear);

  const btnBack = document.createElement('button');
  btnBack.textContent = 'Back';
  btnBack.classList.add('secondary');
  btnBack.addEventListener('click', (e) => {
    e.stopPropagation();
    openManageMenu(null);
  });
  wrap.appendChild(btnBack);

  //swap content into the dialog and keep position
  dlg.innerHTML = '';
  dlg.appendChild(wrap);
  if (lastRect) {
    dlg.style.top  = `${lastRect.bottom + window.scrollY + 6}px`;
    dlg.style.left = `${lastRect.left   + window.scrollX}px`;
  } else { dlg.style.top = ''; dlg.style.left = ''; }
  if (!dlg.open) dlg.showModal();
}

function openExportSubmenu() {
  const wrap = document.createElement('div');
  wrap.className = 'menu';

  const h = document.createElement('div');
  h.textContent = 'Export / Import';
  h.className = 'title';
  wrap.appendChild(h);

  //local storage access
  function getMeds() {
    try { return JSON.parse(localStorage.getItem('meds') || '[]'); }
    catch { return []; }
  }
  function setMeds(arr) {
    localStorage.setItem('meds', JSON.stringify(arr || []));
  }

  //export section
  const expHeader = document.createElement('div');
  expHeader.textContent = 'Export';
  expHeader.style.fontWeight = '600';
  wrap.appendChild(expHeader);

  const fileName = document.createElement('input');
  fileName.type = 'text';
  fileName.placeholder = 'Filename (e.g., meds.json)';
  fileName.value = 'meds.json';
  fileName.style.width = '100%';
  wrap.appendChild(fileName);

  const prettyWrap = document.createElement('label');
  prettyWrap.style.display = 'flex';
  prettyWrap.style.alignItems = 'center';
  prettyWrap.style.gap = '8px';
  const pretty = document.createElement('input');
  pretty.type = 'checkbox';
  const prettyTxt = document.createElement('span');
  prettyTxt.textContent = 'Pretty print JSON';
  prettyWrap.appendChild(pretty);
  prettyWrap.appendChild(prettyTxt);
  wrap.appendChild(prettyWrap);

  const btnDownload = document.createElement('button');
  btnDownload.textContent = 'Download JSON';
  btnDownload.addEventListener('click', (e) => {
    e.stopPropagation();
    const meds = getMeds();
    const body = pretty.checked ? JSON.stringify(meds, null, 2) : JSON.stringify(meds);
    const blob = new Blob([body], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = (fileName.value.trim() || 'meds.json');
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 0);
  });
  wrap.appendChild(btnDownload);

  //import section
  const impHeader = document.createElement('div');
  impHeader.textContent = 'Import';
  impHeader.style.fontWeight = '600';
  impHeader.style.marginTop = '8px';
  wrap.appendChild(impHeader);

  const modeRow = document.createElement('div');
  modeRow.style.display = 'grid';
  modeRow.style.gridTemplateColumns = '1fr 1fr';
  modeRow.style.gap = '8px';

  const lReplace = document.createElement('label');
  lReplace.style.display = 'flex'; lReplace.style.gap = '6px'; lReplace.style.alignItems = 'center';
  const rReplace = document.createElement('input');
  rReplace.type = 'radio'; rReplace.name = 'importMode'; rReplace.checked = true;
  lReplace.appendChild(rReplace);
  lReplace.appendChild(document.createTextNode('Replace existing'));

  const lMerge = document.createElement('label');
  lMerge.style.display = 'flex'; lMerge.style.gap = '6px'; lMerge.style.alignItems = 'center';
  const rMerge = document.createElement('input');
  rMerge.type = 'radio'; rMerge.name = 'importMode';
  lMerge.appendChild(rMerge);
  lMerge.appendChild(document.createTextNode('Merge with existing'));

  modeRow.appendChild(lReplace);
  modeRow.appendChild(lMerge);
  wrap.appendChild(modeRow);

  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'application/json';
  wrap.appendChild(fileInput);

  const paste = document.createElement('textarea');
  paste.placeholder = '…or paste JSON here';
  paste.rows = 5;
  paste.style.width = '100%';
  wrap.appendChild(paste);

  const btnImport = document.createElement('button');
  btnImport.textContent = 'Import JSON';
  btnImport.addEventListener('click', async (e) => {
    e.stopPropagation();

    //read JSON from text area or file
    let text = paste.value.trim();
    if (!text && fileInput.files && fileInput.files[0]) {
      text = await new Promise((res, rej) => {
        const fr = new FileReader();
        fr.onload = () => res(String(fr.result || ''));
        fr.onerror = rej;
        fr.readAsText(fileInput.files[0]);
      });
    }
    if (!text) { alert('Choose a JSON file or paste JSON.'); return; }

    try {
      const incoming = JSON.parse(text);
      if (!Array.isArray(incoming)) {
        alert('Expected an array of medications, e.g. [{ "name": "...", "dose": "..." }]');
        return;
      }

      if (rReplace.checked) {
        setMeds(incoming);
      } else {
        const existing = getMeds();
        const merged = [...existing];
        incoming.forEach(m => {
          const key = (m.name || '') + '|' + (m.dose || '');
          const dup = merged.find(x => ((x.name || '') + '|' + (x.dose || '')) === key);
          if (!dup) merged.push(m);
        });
        setMeds(merged);
      }
      alert('Import complete.');
    } catch (err) {
      console.error(err);
      alert('Import failed: invalid JSON?');
    }
  });
  wrap.appendChild(btnImport);

  const btnBack = document.createElement('button');
  btnBack.textContent = 'Back';
  btnBack.classList.add('secondary');
  btnBack.addEventListener('click', (e) => {
    e.stopPropagation();
    openManageMenu(null);
  });
  wrap.appendChild(btnBack);

  //swap into dialog and keep position
  dlg.innerHTML = '';
  dlg.appendChild(wrap);
  if (lastRect) {
    dlg.style.top  = `${lastRect.bottom + window.scrollY + 6}px`;
    dlg.style.left = `${lastRect.left   + window.scrollX}px`;
  } else { dlg.style.top = ''; dlg.style.left = ''; }
  if (!dlg.open) dlg.showModal();
}
function openReminderMenu(trigger) {
  //suild UI
  const wrap = document.createElement('div');
  wrap.className = 'menu';

  const h = document.createElement('div');
  h.textContent = 'Reminder Service';
  h.className = 'title';
  wrap.appendChild(h);

  //tiny helpers
  function getMeds() {
    try { return JSON.parse(localStorage.getItem('meds') || '[]'); }
    catch { return []; }
  }
  function getRems() {
    try { return JSON.parse(localStorage.getItem('medReminders') || '[]'); }
    catch { return []; }
  }
  function setRems(arr) {
    localStorage.setItem('medReminders', JSON.stringify(arr || []));
  }
  const reminderTimers = {}; //local map for this open session

  function scheduleReminder(rem) {
    const whenMs = new Date(rem.when).getTime();
    const delay = whenMs - Date.now();
    if (delay <= 0) return;

    const handle = setTimeout(async () => {
      const body = [rem.med || rem.title || 'Medication', rem.notes || '']
        .filter(Boolean).join(' — ');
      try {
        if ('Notification' in window) {
          if (Notification.permission === 'granted') {
            new Notification(rem.title || 'Medication reminder', { body });
          } else if (Notification.permission !== 'denied') {
            const p = await Notification.requestPermission();
            if (p === 'granted') new Notification(rem.title || 'Medication reminder', { body });
            else alert(`Reminder: ${body}`);
          } else {
            alert(`Reminder: ${body}`);
          }
        } else {
          alert(`Reminder: ${body}`);
        }
      } catch {
        alert(`Reminder: ${body}`);
      }

      //basic repeat support
      if (rem.repeat && rem.repeat !== 'none') {
        const next = new Date(whenMs);
        if (rem.repeat === 'daily') next.setDate(next.getDate() + 1);
        if (rem.repeat === 'weekly') next.setDate(next.getDate() + 7);

        const all = getRems();
        const i = all.findIndex(r => r.id === rem.id);
        if (i > -1) {
          all[i].when = next.toISOString();
          setRems(all);
          scheduleReminder(all[i]);
        }
      }
    }, delay);

    reminderTimers[rem.id] = handle;
  }

  //form fields
  //med dropdown
  const meds = getMeds();
  const medRow = document.createElement('div');
  medRow.style.display = 'grid';
  medRow.style.gridTemplateColumns = '110px 1fr';
  medRow.style.gap = '8px'; medRow.style.alignItems = 'center';
  const medLabel = document.createElement('label'); medLabel.textContent = 'Medication:';
  const medSelect = document.createElement('select'); medSelect.style.width = '100%';
  const optNone = document.createElement('option'); optNone.value = ''; optNone.textContent = '(none)';
  medSelect.appendChild(optNone);
  meds.forEach(m => {
    const o = document.createElement('option');
    o.value = m.name || '';
    o.textContent = m.name ? (m.dose ? `${m.name} — ${m.dose}` : m.name) : '(unnamed)';
    medSelect.appendChild(o);
  });
  medRow.appendChild(medLabel); medRow.appendChild(medSelect);
  wrap.appendChild(medRow);

  //title
  const titleRow = document.createElement('div');
  titleRow.style.display = 'grid';
  titleRow.style.gridTemplateColumns = '110px 1fr';
  titleRow.style.gap = '8px'; titleRow.style.alignItems = 'center';
  const titleLabel = document.createElement('label'); titleLabel.textContent = 'Title:';
  const titleInput = document.createElement('input');
  titleInput.type = 'text'; titleInput.placeholder = 'e.g., Take morning dose'; titleInput.style.width = '100%';
  titleRow.appendChild(titleLabel); titleRow.appendChild(titleInput);
  wrap.appendChild(titleRow);

  //when (datetime-local)
  const whenRow = document.createElement('div');
  whenRow.style.display = 'grid';
  whenRow.style.gridTemplateColumns = '110px 1fr';
  whenRow.style.gap = '8px'; whenRow.style.alignItems = 'center';
  const whenLabel = document.createElement('label'); whenLabel.textContent = 'When:';
  const whenInput = document.createElement('input');
  whenInput.type = 'datetime-local'; whenInput.style.width = '100%';
  const dt = new Date(Date.now() + 10 * 60 * 1000);
  whenInput.value = new Date(dt.getTime() - dt.getTimezoneOffset()*60000).toISOString().slice(0,16);
  whenRow.appendChild(whenLabel); whenRow.appendChild(whenInput);
  wrap.appendChild(whenRow);

  //repeat
  const repRow = document.createElement('div');
  repRow.style.display = 'grid';
  repRow.style.gridTemplateColumns = '110px 1fr';
  repRow.style.gap = '8px'; repRow.style.alignItems = 'center';
  const repLabel = document.createElement('label'); repLabel.textContent = 'Repeat:';
  const repSelect = document.createElement('select'); repSelect.style.width = '100%';
  ['none','daily','weekly'].forEach(v => {
    const o = document.createElement('option');
    o.value = v; o.textContent = v[0].toUpperCase() + v.slice(1);
    repSelect.appendChild(o);
  });
  repRow.appendChild(repLabel); repRow.appendChild(repSelect);
  wrap.appendChild(repRow);

  //notes
  const notesRow = document.createElement('div');
  notesRow.style.display = 'grid';
  notesRow.style.gridTemplateColumns = '110px 1fr';
  notesRow.style.gap = '8px'; notesRow.style.alignItems = 'start';
  const notesLabel = document.createElement('label'); notesLabel.textContent = 'Notes:';
  const notesArea = document.createElement('textarea');
  notesArea.placeholder = 'Optional notes…'; notesArea.rows = 3; notesArea.style.width = '100%';
  notesRow.appendChild(notesLabel); notesRow.appendChild(notesArea);
  wrap.appendChild(notesRow);

  //existing reminders list
  const listHeader = document.createElement('div');
  listHeader.textContent = 'Scheduled Reminders';
  listHeader.style.fontWeight = '600';
  listHeader.style.marginTop = '8px';
  wrap.appendChild(listHeader);

  const list = document.createElement('div');
  wrap.appendChild(list);

  function renderList() {
    const items = getRems();
    list.innerHTML = '';
    if (!items.length) {
      const empty = document.createElement('div');
      empty.textContent = 'None scheduled.';
      empty.style.opacity = '0.7';
      list.appendChild(empty);
      return;
    }
    items.sort((a,b)=> new Date(a.when)-new Date(b.when)).forEach(r => {
      const row = document.createElement('div');
      row.style.display = 'grid';
      row.style.gridTemplateColumns = '1fr auto';
      row.style.alignItems = 'center';
      row.style.gap = '8px';

      const left = document.createElement('div');
      const whenLocal = new Date(r.when);
      left.innerHTML =
        `<strong>${r.title || r.med || 'Reminder'}</strong>` +
        ` — ${whenLocal.toLocaleString()}` +
        (r.repeat && r.repeat!=='none' ? ` (${r.repeat})` : '') +
        (r.med ? `<br><span style="opacity:.8">${r.med}</span>` : '') +
        (r.notes ? `<br><span style="opacity:.8">${r.notes}</span>` : '');

      const del = document.createElement('button');
      del.textContent = 'Delete';
      del.classList.add('danger');
      del.addEventListener('click', (e) => {
        e.stopPropagation();
        const all = getRems().filter(x => x.id !== r.id);
        setRems(all);
        if (reminderTimers[r.id]) clearTimeout(reminderTimers[r.id]);
        renderList();
      });

      row.appendChild(left);
      row.appendChild(del);
      list.appendChild(row);
    });
  }
  renderList();

  //buttons
  const btnCreate = document.createElement('button');
  btnCreate.textContent = 'Create Med Reminder';
  btnCreate.addEventListener('click', async (e) => {
    e.stopPropagation();
    if (!whenInput.value) { alert('Pick a date/time.'); return; }
    const rem = {
      id: (crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random())),
      med: medSelect.value || '',
      title: (titleInput.value || '').trim(),
      when: new Date(whenInput.value).toISOString(),
      repeat: repSelect.value,
      notes: (notesArea.value || '').trim(),
    };
    const all = getRems(); all.push(rem); setRems(all);
    scheduleReminder(rem);
    renderList();
  });
  wrap.appendChild(btnCreate);

  const btnClear = document.createElement('button');
  btnClear.textContent = 'Clear Scheduled Reminders';
  btnClear.classList.add('danger');
  btnClear.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!confirm('Delete all scheduled reminders?')) return;
    localStorage.setItem('medReminders', '[]');
    Object.values(reminderTimers).forEach(h => clearTimeout(h));
    renderList();
  });
  wrap.appendChild(btnClear);

  const btnBack = document.createElement('button');
  btnBack.textContent = 'Back';
  btnBack.classList.add('secondary');
  btnBack.addEventListener('click', (e) => { e.stopPropagation(); openManageMenu(null); });
  wrap.appendChild(btnBack);

  const btnClose = document.createElement('button');
  btnClose.textContent = 'Close';
  btnClose.classList.add('danger');
  btnClose.addEventListener('click', (e) => { e.stopPropagation(); dlg.close(); });
  wrap.appendChild(btnClose);

  //mount + position
  dlg.innerHTML = '';
  dlg.appendChild(wrap);
  const rect = trigger?.getBoundingClientRect() || null;
  if (rect) lastRect = rect;
  if (lastRect) {
    dlg.style.top  = `${lastRect.bottom + window.scrollY + 6}px`;
    dlg.style.left = `${lastRect.left   + window.scrollX}px`;
  } else { dlg.style.top = ''; dlg.style.left = ''; }
  if (!dlg.open) dlg.showModal();

  //outside click to close
  dlg.addEventListener('click', (e) => {
    const r = wrap.getBoundingClientRect();
    const inside = e.clientX >= r.left && e.clientX <= r.right &&
                   e.clientY >= r.top  && e.clientY <= r.bottom;
    if (!inside) dlg.close();
  }, { once: true });
}
  //wire top buttons
  if (btnMeds) {
    btnMeds.addEventListener('click', (e) => openManageMenu(e.currentTarget));
  }
  if (btnService) {
    btnService.addEventListener('click', (e) => {
      openReminderMenu(e.currentTarget);
    });
  }
})();
