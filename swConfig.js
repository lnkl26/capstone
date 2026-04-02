if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    //check if running locally
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const basePath = isLocalhost ? '' : '/capstone';

    //register with the dynamic path
    navigator.serviceWorker.register(`${basePath}/service-worker.js`)
      .then(reg => {
        console.log('Service worker registered successfully.', reg.scope);
      })
      .catch(err => {
        console.error('Service worker registration failed:', err);
      });
  });
}