export type Tier = 'public' | 'attendee'

export const TIER_LIMITS = {
  public:   { assessDaily: 10, coachDaily: 0,  canAddCustomPassages: false },
  attendee: { assessDaily: 60, coachDaily: 20, canAddCustomPassages: true  },
} as const
