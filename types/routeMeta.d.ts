export {}

declare module 'vue-router' {
  interface RouteMeta {
    // Per-page access level. Layers on top of the login check.
    // - 'approved' (default): user must be logged in AND approval_status='approved'
    // - 'attendee': user must be logged in AND profiles.tier='attendee'
    // - 'free': user must be logged in; no approval or tier required
    // Truly unauthenticated routes (e.g. /account, /confirm) are governed by
    // the publicRoutes lists in the auth middlewares, not this flag.
    access?: 'free' | 'attendee' | 'approved'
  }
}
