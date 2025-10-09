
  if ('serviceWorker' in navigator) {
    //waits until page finishes loading
    window.addEventListener('load', () => {
      //tell the browser to activate service-worker.js
      navigator.serviceWorker.register('/service-worker.js')
        .then(reg => console.log('service-worker registered', reg))
        .catch(console.error);
    });
  }