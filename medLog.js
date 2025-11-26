import {
  db, collection, addDoc, deleteDoc, doc,
  onSnapshot, query, orderBy, serverTimestamp,
} from "./firebase.js";

window.addEventListener("DOMContentLoaded", () => { //ensure dom loaded before run script
console.log('medLog.js loaded');

(() => {
  const dlg = document.getElementById('popupMenu');
  const btnMeds = document.getElementById('btnMeds');
  const btnService = document.getElementById('btnService');
  if (!dlg) { console.error('Missing #popupMenu'); return; }

//dom targets
const logEl=document.getElementById('medLog');

//dom target for reminders box
const remEl=document.getElementById('remLog');

//global storage helpers for reminders
function getRems(){try{return JSON.parse(localStorage.getItem('medReminders')||'[]')}catch{return[]}}
function setRems(arr){localStorage.setItem('medReminders',JSON.stringify(arr||[]))}

//no space after slashes
//firestore collection and render target
const medsCol=collection(db,"meds");
const medLogEl=document.getElementById("medLog");

//live meds cache for menus
let medsCache = [];

//render a list of meds into the white box
function renderMeds(docs){
  if(!medLogEl) return;
  if(!docs.length){
    medLogEl.innerHTML=`<div class="empty">No Medications.</div>`;
    return;
  }
  medLogEl.innerHTML=docs.map(d=>{
    const data=d.data();
    const name=(data.name||"(unnamed)").replace(/</g,"&lt;");
    const dose=(data.dose||"").replace(/</g,"&lt;");
    return `
      <div class="entry" data-id="${d.id}">
        <div class="row">
          <div><strong>${name}</strong>${dose?` — ${dose}`:""}</div>
          <button class="column embDel" data-del="${d.id}">Delete</button>
        </div>
      </div>`;
  }).join("");

  //wire delete buttons
  medLogEl.querySelectorAll("[data-del]").forEach(b=>{
    b.addEventListener("click",async(e)=>{
      const id=e.currentTarget.getAttribute("data-del");
      try{ await deleteMedFromDb(id); }catch(err){ console.error(err); alert("failed to delete"); }
    });
  });
}

//live subscription to firestore changes
function subscribeAndRenderMeds(){
  const q=query(medsCol,orderBy("createdAt","desc"));
  onSnapshot(q,(snap)=>{ mirrorMedsFromSnapshot(snap.docs)
    //update cache for menus and dropdowns
    medsCache = snap.docs.map(d => ({ id: d.id, ...(d.data()||{}) }));
    //let any open menus know the cache changed
    document.dispatchEvent(new CustomEvent('meds-cache-updated'));
    renderMeds(snap.docs);
  },(err)=>{
    console.error(err);
    medLogEl.innerHTML=`<div class="empty">error loading med log</div>`;
  });
}
//rebuild options in a select from medsCache
function buildMedSelectOptions(select){
  //clear
  select.innerHTML = '';
  const optNone = document.createElement('option');
  optNone.value = '';
  optNone.textContent = '(none)';
  select.appendChild(optNone);

  medsCache.forEach(m=>{
    const name = m.name || '(unnamed)';
    const label = m.dose ? `${name} — ${m.dose}` : name;
    const o = document.createElement('option');
    o.value = name;
    o.textContent = label;
    select.appendChild(o);
  });
}
//helpers to add and delete
async function addMedToDb(name,dose){
  await addDoc(medsCol,{
    name:String(name||"").trim(),
    dose:String(dose||"").trim(),
    createdAt:serverTimestamp()
  });
}
async function deleteMedFromDb(id){
  await deleteDoc(doc(db,"meds",id));
}

//collections
const remCol=collection(db,"reminders");

//add reminder
//expects {title,med,whenISO,repeat,notes}
async function addReminderToDb({title="",med="",whenISO="",repeat="none",notes=""}){
  if(!whenISO) throw new Error("whenISO required");
  await addDoc(remCol,{
    title:String(title||"").trim(),
    med:String(med||"").trim(),
    when:String(whenISO),              //iso string
    repeat:String(repeat||"none"),
    notes:String(notes||"").trim(),
    createdAt:serverTimestamp()
  });
}

//delete reminder
async function deleteReminderFromDb(id){
  await deleteDoc(doc(db,"reminders",id));
}

//live subscription + render for reminders with countdown
function subscribeAndRenderReminders(){
  const q=query(remCol,orderBy("when","asc"));
  onSnapshot(q,(snap)=>{ mirrorRemsFromSnapshot(snap.docs)
    renderReminders(snap.docs);   //renderer below
  },(err)=>{
    console.error(err);
    if(remEl) remEl.innerHTML='<div class="empty">error loading reminders</div>';
  });
}

//renderer
function renderReminders(docs){
  if(!remEl) return;

  if(!docs.length){
    remEl.innerHTML='<div class="empty">No Reminders.</div>';
    if(remTickHandle){clearInterval(remTickHandle);remTickHandle=null}
    return;
  }

  remEl.innerHTML=docs.map(d=>{
    const r=d.data();
    const title=(r.title||r.med||"reminder").replace(/</g,"&lt;");
    const when=r.when;
    return `
      <div class="entry" data-id="${d.id}">
        <div class="row">
          <div><strong>${title}</strong></div>
          <div class="countdown" data-iso="${when}"></div>
        </div>
      </div>`;
  }).join("");

  //wire deletes on each entry
  const tick=()=>{
    remEl.querySelectorAll(".countdown").forEach(el=>{
      const iso=el.getAttribute("data-iso");
      const ms=new Date(iso).getTime()-Date.now();
      el.textContent=ms>0?formatMs(ms):"due";
    });
  };
  tick();
  if(remTickHandle) clearInterval(remTickHandle);
  remTickHandle=setInterval(tick,1000);
}
//kick off live view
subscribeAndRenderMeds();
subscribeAndRenderReminders();
//this setup uses localstorage as cache for faster paint and offline access
//but firebase is the "truth" so sync when possible
const mirrorRemindersToLocal=true;

function mirrorRemsFromSnapshot(docs){
  if(!mirrorRemindersToLocal) return;
  const arr=docs.map(d=>({id:d.id,...d.data()}));
  localStorage.setItem("medReminders",JSON.stringify(arr));
}

const mirrorMedsToLocal=false;
function mirrorMedsFromSnapshot(docs){
  if(!mirrorMedsToLocal) return;
  const arr=docs.map(d=>({id:d.id,...d.data()}));
  localStorage.setItem("meds",JSON.stringify(arr));
}

//countdown formatter d:hh:mm:ss
function formatMs(ms){
  let s=Math.max(0,Math.floor(ms/1000));
  const d=Math.floor(s/86400); s%=86400;
  const h=Math.floor(s/3600); s%=3600;
  const m=Math.floor(s/60); s%=60;
  const pad=n=>String(n).padStart(2,'0');
  return `${d}:${pad(h)}:${pad(m)}:${pad(s)}`;
}

let remTickHandle=null;

//render the reminders white box with live countdowns
function renderRemLog(){
  if(!remEl){return}
  const items=getRems();
  if(!items.length){
    remEl.innerHTML='<div class="empty">No Reminders.</div>';
    if(remTickHandle){clearInterval(remTickHandle);remTickHandle=null}
    return;
  }

  remEl.innerHTML=items.map(r=>{
  const title = (r.title || r.med || 'reminder').replace(/</g, '&lt;');
  return `
    <div class="entry">
      <strong>${title}</strong>
      <div class="countdown" data-iso="${r.when}"></div>
    </div>`;
}).join('');

  const update=()=>{
    remEl.querySelectorAll('.countdown').forEach(el=>{
      const iso=el.getAttribute('data-iso');
      const ms=new Date(iso).getTime()-Date.now();
      el.textContent=ms>0?formatMs(ms):'Due';
    });
  };
  update();
  if(remTickHandle){clearInterval(remTickHandle)}
  remTickHandle=setInterval(update,1000);
}

//storage helpers used across menus
function getMeds(){try{return JSON.parse(localStorage.getItem('meds')||'[]')}catch{return[]}}
function setMeds(arr){localStorage.setItem('meds',JSON.stringify(arr||[]))}

//render the white log area
function renderMedLog(){
  if(!logEl){return}
  const meds=getMeds();
  if(!meds.length){
    logEl.innerHTML='<div class="empty">No Medications.</div>';
    return;
  }
  //simple list layout for now
  logEl.innerHTML=meds.map(m=>{
    const n=(m.name||'(unnamed)').replace(/</g,'&lt;');
    const d=(m.dose||'').replace(/</g,'&lt;');
    return `
      <div class="row">
        <div><strong>${n}</strong>${d?` — ${d}`:''}</div>
        <button class="embDel danger" data-del="${n}|${d}">Delete</button>
      </div>`;
  }).join('');

  //wire delete buttons
  logEl.querySelectorAll('button[data-del]').forEach(btn=>{
    btn.addEventListener('click',e=>{
      const key=e.currentTarget.getAttribute('data-del');
      const [n,d]=key.split('|');
      const all=getMeds();
      const i=all.findIndex(x=>(x.name||'')===n&&(x.dose||'')===d);
      if(i>-1){all.splice(i,1);setMeds(all);renderMedLog()}
    });
  });
}

//initial paint
renderMedLog();
renderRemLog();


  //ensure styling hook exists evenif html forgot
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

    //force center
    dlg.removeAttribute('style');
    dlg.classList.add('popup-center');

    if (!dlg.open) {
      dlg.showModal();
      //use capturing so back drop clicks are caught early
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
  nameInput.classList.add('input','full');
  formElements.push(nameInput);

  const doseInput = document.createElement('input');
  doseInput.type = 'text';
  doseInput.placeholder = 'Dosage (e.g., 10 mg)';
  doseInput.classList.add('input','full');
  formElements.push(doseInput);

  //create the menu items (including buttons)
  const items = [
    { 
      label: 'Save', 
      action: async () => {
    const name=nameInput.value.trim();
    const dose=doseInput.value.trim();
    if(!name||!dose){ alert('please fill out both fields.'); return; }
    try{
      await addMedToDb(name,dose);
      nameInput.value='';
      doseInput.value='';
      dlg.close(); //optional: close after save
    }catch(err){
      console.error('addMedToDb failed:', err && (err.code || err.message) || err);
      alert('failed to save');
    }
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
  const wrap = document.createElement('div');
  wrap.className = 'menu';

  const h = document.createElement('div');
  h.textContent = 'Add Medication';
  h.className = 'menu-title';
  wrap.appendChild(h);

  //add input boxes before the buttons
  formElements.forEach(el => wrap.appendChild(el));

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

  //force center
  dlg.removeAttribute('style');
  dlg.classList.add('popup-center');
}

function openManageSubmenu() {
  //build the submenu UI manually
  const wrap = document.createElement('div');
  wrap.className = 'menu';

  const h = document.createElement('div');
  h.textContent = 'Manage Options';
  h.className = 'menu-title';
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
  search.classList.add('input','full');
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
      empty.className = 'empty';
      list.appendChild(empty);
      return;
    }

    filtered.forEach((m, idxInFiltered) => {
      const row = document.createElement('div');
      row.className = 'row';

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
          renderMedLog();
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
  confirmWrap.className = 'inline-center';
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
    renderMedLog();
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

  //force center
  dlg.removeAttribute('style');
  dlg.classList.add('popup-center');

  if (!dlg.open) dlg.showModal();
}

function openExportSubmenu() {
  const wrap = document.createElement('div');
  wrap.className = 'menu';

  const h = document.createElement('div');
  h.textContent = 'Export / Import';
  h.className = 'menu-title';
  wrap.appendChild(h);

  //localstorage access
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
  expHeader.className = 'section-title';
  wrap.appendChild(expHeader);

  const fileName = document.createElement('input');
  fileName.type = 'text';
  fileName.placeholder = 'Filename (e.g., meds.json)';
  fileName.value = 'meds.json';
  fileName.classList.add('input','full');
  wrap.appendChild(fileName);

  const prettyWrap = document.createElement('label');
  prettyWrap.className = 'inline-center';
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
  impHeader.className = 'section-title';
  wrap.appendChild(impHeader);

  const modeRow = document.createElement('div');
  modeRow.className = 'row';
  const lReplace = document.createElement('label');
  lReplace.className = 'inline-center';
  const rReplace = document.createElement('input');
  rReplace.type = 'radio'; rReplace.name = 'importMode'; rReplace.checked = true;
  lReplace.appendChild(rReplace);
  lReplace.appendChild(document.createTextNode('Replace existing'));

  const lMerge = document.createElement('label');
  lMerge.className = 'inline-center';
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
  paste.classList.add('input','full');
  wrap.appendChild(paste);

  const btnImport = document.createElement('button');
  btnImport.textContent = 'Import JSON';
  btnImport.addEventListener('click', async (e) => {
    e.stopPropagation();

    //read json from text area or file
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
        renderMedLog();
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

  //swap into the dialog and keep position
  dlg.innerHTML = '';
  dlg.appendChild(wrap);

  //force center
  dlg.removeAttribute('style');
  dlg.classList.add('popup-center');

  if (!dlg.open) dlg.showModal();
}
function openReminderMenu(trigger) {
  //build ui
  const wrap = document.createElement('div');
  wrap.className = 'menu';

  const h = document.createElement('div');
  h.textContent = 'Reminder Service';
  h.className = 'menu-title';
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

  const reminderTimers = {}; //local map for this open session

  //form fields
  //med dropdown
  const meds = getMeds();
  const medRow = document.createElement('div');
  medRow.className = 'form-row';
  const medLabel = document.createElement('label'); medLabel.textContent = 'Medication:';
  const medSelect = document.createElement('select'); medSelect.classList.add('input','full');
  buildMedSelectOptions(medSelect);
  //listen for future snapshot updates while the dialog is open
  const medCacheHandler = () => buildMedSelectOptions(medSelect);
  document.addEventListener('meds-cache-updated', medCacheHandler);
  medRow.appendChild(medLabel); medRow.appendChild(medSelect);
  wrap.appendChild(medRow);

  //title
  const titleRow = document.createElement('div');
  titleRow.className = 'form-row';
  const titleLabel = document.createElement('label'); titleLabel.textContent = 'Title:';
  const titleInput = document.createElement('input');
  titleInput.type = 'text'; titleInput.placeholder = 'e.g., Take morning dose'; titleInput.classList.add('input','full');
  titleRow.appendChild(titleLabel); titleRow.appendChild(titleInput);
  wrap.appendChild(titleRow);

  //when(datetime-local)
  const whenRow = document.createElement('div');
  whenRow.className = 'form-row';
  const whenLabel = document.createElement('label'); whenLabel.textContent = 'When:';
  const whenInput = document.createElement('input');
  whenInput.type = 'datetime-local'; whenInput.classList.add('input','full');
  const dt = new Date(Date.now() + 10 * 60 * 1000);
  whenInput.value = new Date(dt.getTime() - dt.getTimezoneOffset()*60000).toISOString().slice(0,16);
  whenRow.appendChild(whenLabel); whenRow.appendChild(whenInput);
  wrap.appendChild(whenRow);

  //repeat
  const repRow = document.createElement('div');
  repRow.className = 'form-row';
  const repLabel = document.createElement('label'); repLabel.textContent = 'Repeat:';
  const repSelect = document.createElement('select'); repSelect.classList.add('input','full');
  ['none','daily','weekly'].forEach(v => {
    const o = document.createElement('option');
    o.value = v; o.textContent = v[0].toUpperCase() + v.slice(1);
    repSelect.appendChild(o);
  });
  repRow.appendChild(repLabel); repRow.appendChild(repSelect);
  wrap.appendChild(repRow);

  //notes
  const notesRow = document.createElement('div');
  notesRow.className = 'form-row';
  const notesLabel = document.createElement('label'); notesLabel.textContent = 'Notes:';
  const notesArea = document.createElement('textarea');
  notesArea.placeholder = 'Optional notes…'; notesArea.rows = 3; notesArea.classList.add('input','full');
  notesRow.appendChild(notesLabel); notesRow.appendChild(notesArea);
  wrap.appendChild(notesRow);

  //existing reminders list (reads from local mirror)
  const listHeader = document.createElement('div');
  listHeader.textContent = 'Scheduled Reminders';
  listHeader.className = 'section-title';
  wrap.appendChild(listHeader);

  const list = document.createElement('div');
  wrap.appendChild(list);

  function renderList() {
    const items = getRems();
    list.innerHTML = '';
    if (!items.length) {
      const empty = document.createElement('div');
      empty.textContent = 'None scheduled.';
      empty.className = 'empty';
      list.appendChild(empty);
      return;
    }
    items.sort((a,b)=> new Date(a.when)-new Date(b.when)).forEach(r => {
      const row = document.createElement('div');
      row.className = 'row';

      const left = document.createElement('div');
      const whenLocal = new Date(r.when);
      left.innerHTML =
        `<strong>${(r.title || r.med || 'Reminder')}</strong>` +
        ` — ${whenLocal.toLocaleString()}` +
        (r.repeat && r.repeat!=='none' ? ` (${r.repeat})` : '') +
        (r.med ? `<br><span style="opacity:.8">${r.med}</span>` : '') +
        (r.notes ? `<br><span style="opacity:.8">${r.notes}</span>` : '');

      const del = document.createElement('button');
      del.textContent = 'Delete';
      del.classList.add('danger');
      del.addEventListener('click', async (e) => {
        e.stopPropagation();
        try{
          await deleteReminderFromDb(r.id); //ui will refresh via snapshot mirror
          renderList(); //light refresh in case mirror is a tick late
        }catch(err){
          console.error('deleteReminderFromDb failed:',err&& (err.code||err.message)||err);
          alert('failed to delete reminder');
        }
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
    if (!whenInput.value) { alert('pick a date/time.'); return; }

    try{
      await addReminderToDb({
        title:(titleInput.value||'').trim(),
        med:medSelect.value||'',
        whenISO:new Date(whenInput.value).toISOString(),
        repeat:repSelect.value,
        notes:(notesArea.value||'').trim()
      });

      //optional clear
      titleInput.value=''; notesArea.value='';
      //dialog can stay open or close; closing feels nice
      dlg.close();
    }catch(err){
      console.error('addReminderToDb failed:',err&& (err.code||err.message)||err);
      alert('failed to save reminder');
    }
  });
  wrap.appendChild(btnCreate);

  const btnClear = document.createElement('button');
  btnClear.textContent = 'Clear Scheduled Reminders';
  btnClear.classList.add('danger');
  btnClear.addEventListener('click', async (e) => {
    e.stopPropagation();
    if (!confirm('Delete all scheduled reminders?')) return;
    try{
      const items=getRems();
      await Promise.all(items.map(x=>deleteReminderFromDb(x.id).catch(()=>{})));
      renderList();
    }catch(err){
      console.error('bulk delete failed:',err&& (err.code||err.message)||err);
      alert('failed to clear reminders');
    }
  });
  wrap.appendChild(btnClear);

  const btnClose = document.createElement('button');
  btnClose.textContent = 'Close';
  btnClose.classList.add('danger');
  btnClose.addEventListener('click', (e) => { e.stopPropagation(); dlg.close(); });
  wrap.appendChild(btnClose);

  //force center position(ignore any previous anchoring)
  dlg.innerHTML = '';
  dlg.appendChild(wrap);
  dlg.removeAttribute('style');
  dlg.classList.add('popup-center');
  if (!dlg.open) dlg.showModal();

  //when dialog closes, stop listening
  dlg.addEventListener('close', () => {
  document.removeEventListener('meds-cache-updated', medCacheHandler);
  }, { once: true });

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
});
