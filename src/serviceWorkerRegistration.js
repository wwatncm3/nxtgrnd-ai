// Service Worker Registration
// Handles PWA service worker registration for offline capability

const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
  window.location.hostname === '[::1]' ||
  window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/)
);

export function register(config) {
  if ('serviceWorker' in navigator) {
    const publicUrl = new URL(process.env.PUBLIC_URL || '', window.location.href);

    if (publicUrl.origin !== window.location.origin) {
      console.log('[SWR] Public URL origin mismatch, skipping registration');
      return;
    }

    window.addEventListener('load', () => {
      const swUrl = `${process.env.PUBLIC_URL || ''}/service-worker.js`;

      if (isLocalhost) {
        // In development, check if service worker exists
        checkValidServiceWorker(swUrl, config);
        navigator.serviceWorker.ready.then(() => {
          console.log('[SWR] Service worker ready (localhost)');
        });
      } else {
        // In production, register service worker
        registerValidSW(swUrl, config);
      }
    });
  } else {
    console.log('[SWR] Service workers not supported');
  }
}

function registerValidSW(swUrl, config) {
  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      console.log('[SWR] Service worker registered:', registration.scope);

      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (installingWorker == null) {
          return;
        }

        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // New content available
              console.log('[SWR] New content available; refresh to update');

              if (config && config.onUpdate) {
                config.onUpdate(registration);
              }
            } else {
              // Content is cached for offline use
              console.log('[SWR] Content cached for offline use');

              if (config && config.onSuccess) {
                config.onSuccess(registration);
              }
            }
          }
        };
      };
    })
    .catch((error) => {
      console.error('[SWR] Error during service worker registration:', error);
    });
}

function checkValidServiceWorker(swUrl, config) {
  fetch(swUrl, { headers: { 'Service-Worker': 'script' } })
    .then((response) => {
      const contentType = response.headers.get('content-type');
      if (
        response.status === 404 ||
        (contentType != null && contentType.indexOf('javascript') === -1)
      ) {
        // No service worker found, unregister any existing one
        navigator.serviceWorker.ready.then((registration) => {
          registration.unregister().then(() => {
            window.location.reload();
          });
        });
      } else {
        // Service worker found, proceed with registration
        registerValidSW(swUrl, config);
      }
    })
    .catch(() => {
      console.log('[SWR] No internet connection found. App is running in offline mode.');
    });
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
        console.log('[SWR] Service worker unregistered');
      })
      .catch((error) => {
        console.error('[SWR] Error unregistering service worker:', error);
      });
  }
}

// Check if app is running as PWA
export function isPWA() {
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.navigator.standalone === true;
}

// Request persistent storage (helps prevent cache eviction)
export async function requestPersistentStorage() {
  if (navigator.storage && navigator.storage.persist) {
    const granted = await navigator.storage.persist();
    console.log(`[SWR] Persistent storage ${granted ? 'granted' : 'denied'}`);
    return granted;
  }
  return false;
}

// Get storage estimate
export async function getStorageEstimate() {
  if (navigator.storage && navigator.storage.estimate) {
    const estimate = await navigator.storage.estimate();
    console.log('[SWR] Storage estimate:', {
      usage: `${(estimate.usage / 1024 / 1024).toFixed(2)} MB`,
      quota: `${(estimate.quota / 1024 / 1024).toFixed(2)} MB`,
      percentUsed: `${((estimate.usage / estimate.quota) * 100).toFixed(2)}%`
    });
    return estimate;
  }
  return null;
}
