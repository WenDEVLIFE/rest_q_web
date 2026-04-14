/**
 * Res-Q Centralized Route Constants
 */
export const APP_ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  ADMIN: {
    DASHBOARD: '/admin',
    MONITORING: '/admin?tab=monitoring',
    ANALYTICS: '/admin?tab=analytics',
    FACILITIES: '/admin?tab=facilities',
    USERS: '/admin?tab=users',
  },
} as const;

export type AppRoute = typeof APP_ROUTES[keyof typeof APP_ROUTES];
