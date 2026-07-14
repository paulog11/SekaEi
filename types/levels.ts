/**
 * @fileoverview Static "World Journey" gamification path: 8 levels mapping
 * XP totals to traveler ranks and destinations, each carrying its
 * recommended set of `SAMPLE_PASSAGES` ids (soft path — nothing is gated).
 */

export interface LevelDef {
  level: number
  city: string
  cityJa: string
  rank: string
  xpThreshold: number
  passageIds: string[]
}

export const LEVELS: LevelDef[] = [
  {
    level: 1,
    city: 'Tokyo — Departure',
    cityJa: '東京 — 出発',
    rank: 'Tourist',
    xpThreshold: 0,
    passageIds: ['captain-america-steve', 'toy-story-woody', 'kung-fu-panda-present', 'lion-king-future', 'forrest-gump-chocolates'],
  },
  {
    level: 2,
    city: 'Honolulu',
    cityJa: 'ホノルル',
    rank: 'Sightseer',
    xpThreshold: 150,
    passageIds: ['break-a-leg', 'burn-midnight-oil', 'caught-red-handed', 'elephant-in-room', 'raining-cats-dogs'],
  },
  {
    level: 3,
    city: 'Los Angeles',
    cityJa: 'ロサンゼルス',
    rank: 'Explorer',
    xpThreshold: 400,
    passageIds: ['inigo-montoya', 'interstellar', 'brave-fate', 'up-russell', 'wizard-of-oz-home', 'hobbit-door'],
  },
  {
    level: 4,
    city: 'New York',
    cityJa: 'ニューヨーク',
    rank: 'Adventurer',
    xpThreshold: 800,
    passageIds: ['spider-verse-miles', 'black-panther-tchalla', 'mulan-emperor', 'old-man-sea', 'dorian-gray'],
  },
  {
    level: 5,
    city: 'Washington D.C.',
    cityJa: 'ワシントンD.C.',
    rank: 'Trailblazer',
    xpThreshold: 1400,
    passageIds: ['steve-jobs-stanford', 'jfk-inaugural', 'i-have-a-dream', 'great-dictator'],
  },
  {
    level: 6,
    city: 'London',
    cityJa: 'ロンドン',
    rank: 'World Wanderer',
    xpThreshold: 2100,
    passageIds: ['still-i-rise', 'their-eyes-were-watching', 'pride-and-prejudice', 'ratatouille-ego', 'rocky-balboa'],
  },
  {
    level: 7,
    city: 'Paris',
    cityJa: 'パリ',
    rank: 'Globetrotter',
    xpThreshold: 3000,
    passageIds: ['politics-language', 'self-reliance', 'room-of-ones-own', 'once-more-lake'],
  },
  {
    level: 8,
    city: 'Tokyo — Homecoming',
    cityJa: '東京 — 帰国',
    rank: 'Global Speaker',
    xpThreshold: 4000,
    passageIds: ['she-sells-seashells', 'peter-piper', 'woodchuck'],
  },
]

/** Highest level whose xpThreshold <= total. Negative totals clamp to level 1. */
export function levelForXp(total: number): LevelDef {
  const xp = Math.max(0, total)
  let current = LEVELS[0]
  for (const def of LEVELS) {
    if (def.xpThreshold <= xp) current = def
  }
  return current
}

export interface LevelProgress {
  level: LevelDef
  nextThreshold: number | null
  intoLevel: number
  span: number
}

/** XP earned past the current level's threshold, and distance to the next. */
export function levelProgress(total: number): LevelProgress {
  const xp = Math.max(0, total)
  const level = levelForXp(xp)
  const next = LEVELS.find(def => def.level === level.level + 1) ?? null

  if (!next) {
    return { level, nextThreshold: null, intoLevel: xp - level.xpThreshold, span: 0 }
  }

  return {
    level,
    nextThreshold: next.xpThreshold,
    intoLevel: xp - level.xpThreshold,
    span: next.xpThreshold - level.xpThreshold,
  }
}
