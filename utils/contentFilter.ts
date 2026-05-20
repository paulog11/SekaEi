const BAD_WORDS = [
  // Profanity
  'fuck', 'fucker', 'fucking', 'fucked', 'fucks',
  'shit', 'shits', 'shitty', 'bullshit',
  'ass', 'asses', 'asshole', 'assholes',
  'bitch', 'bitches', 'bitchy',
  'bastard', 'bastards',
  'damn', 'damned',
  'crap', 'crappy',
  'cunt', 'cunts',
  'dick', 'dicks',
  'cock', 'cocks',
  'pussy', 'pussies',
  'piss', 'pissed',
  'whore', 'whores',
  'slut', 'sluts',
  'porn', 'porno',
  'sex', 'sexy',
  'penis', 'vagina', 'boobs', 'tits', 'nipple',
  'nude', 'naked', 'nudes',
  'rape', 'rapist',
  'nigger', 'nigga', 'faggot', 'fag',
  'retard', 'retarded',
  'kike', 'spic', 'chink', 'gook',
  // Obfuscations / leet-speak (common variants)
  'f*ck', 'sh*t', 'a**', 'b*tch',
]

const WORD_RE = new RegExp(
  `\\b(${BAD_WORDS.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`,
  'i',
)

export function containsBadWords(text: string): boolean {
  return WORD_RE.test(text)
}
