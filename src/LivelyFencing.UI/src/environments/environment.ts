export const environment = {
  production: true,
  // Same-origin proxy via nginx (see docker/nginx.conf /api/ block).
  // This avoids cross-origin XHR which is unreliable in Facebook/Instagram
  // in-app WKWebView browsers due to storage partitioning and CF bot challenges.
  apiUrl: '/api'
};
