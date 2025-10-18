console.log('medLog.js loaded');
//popup menu handler for Medication pages
(() => {
  //dlg = dialog, the html element
  const dlg = document.getElementById('popupMenu');
  if (!dlg) {
    console.error('Missing #popupMenu element.');
    return;
  }

  //open a popup menu next to a trigger button
  function openMenu(trigger, items) {
    dlg.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'menu';

    //create each menu item
    items.forEach(({ label, action, className }) => {
      const b = document.createElement('button');
      b.textContent = label;
      if (className) b.classList.add(className);
      b.addEventListener('click', () => {
        dlg.close();
        if (typeof action === 'function') action();
      });
      wrap.appendChild(b);
    });
    dlg.appendChild(wrap);

    //position menu relative to button
    const rect = trigger.getBoundingClientRect();
    dlg.style.top = `${rect.bottom + window.scrollY + 6}px`;
    dlg.style.left = `${rect.left + window.scrollX}px`;

    //show modal (pop up)
    dlg.showModal();

    //close if user clicks outside
    dlg.addEventListener('click', (e) => {
        const r = wrap.getBoundingClientRect();
        const inside =
          e.clientX >= r.left &&
          e.clientX <= r.right &&
          e.clientY >= r.top &&
          e.clientY <= r.bottom;
        if (!inside) dlg.close();
      }, { once: true }
    );
  }
  //set buttons
  const btnMeds = document.getElementById('btnMeds');
  const btnService = document.getElementById('btnService');

  if (btnMeds) {
document.getElementById('btnMeds')?.addEventListener('click', (e) => {
  openMenu(e.currentTarget, [
    { label: 'Open Med Log',          action: () => location.href = 'trackmed.html' },
    { label: 'Add New Medication',    action: () => location.href = 'trackmed.html#add' },
    { label: 'Manage Medications',    action: () => location.href = 'trackmed.html#list' },
    { label: 'Export / Import (JSON)',action: () => location.href = 'trackmed.html#export' },
    { label: 'Close', action: () => {}, className: 'danger' },
  ]);
});
}

  if (btnService) {
    btnService.addEventListener('click', (e) => {
      openMenu(e.currentTarget, [
        {label: 'Enable Notifications', action: () => alert('Notifications Enabled (but not really)') },
        {label: 'Create Med Reminder', action: () => alert('In Dev') },
        {label: 'Clear Scheduled Reminders', action: () => alert('In Dev') },
        {label: 'Close', action: () => {}, className: 'danger' },
    ]);
    });
  }
})();
