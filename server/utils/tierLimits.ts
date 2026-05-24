/**
 * @fileoverview Per-tier quotas and capability flags. Edit here to change
 * what each tier of user is allowed to do — handlers read these values
 * (e.g. `assess.post.ts` enforces `assessDaily`).
 */

export type Tier = 'public' | 'attendee'

export const TIER_LIMITS = {
  public:   { assessDaily: 10, coachDaily: 0,  canAddCustomPassages: false },
  attendee: { assessDaily: 60, coachDaily: 20, canAddCustomPassages: true  },
} as const
