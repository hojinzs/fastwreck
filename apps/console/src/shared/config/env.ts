export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000',
  oidcEnabled: import.meta.env.VITE_OIDC_ENABLED === 'true',
  oidcAuthorizeUrl: import.meta.env.VITE_OIDC_AUTHORIZE_URL || '',
} as const;
