export interface TutorialStep {
  id: string
  selector: string
  title: string
  body: string
  advanceOn?: 'event'
  waitHint?: string
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'passage-card',
    selector: 'passage-card',
    title: 'Choose a passage',
    body: 'Tap any passage card to preview its full text. Then tap "Practice this passage" to select it.',
    advanceOn: 'event',
    waitHint: 'Tap a passage card to continue',
  },
  {
    id: 'practice-this-passage',
    selector: 'practice-this-passage',
    title: 'Confirm your selection',
    body: 'Tap "Practice this passage" to load the text and get ready to record.',
    advanceOn: 'event',
    waitHint: 'Tap the button to continue',
  },
  {
    id: 'reference-panel',
    selector: 'reference-panel',
    title: 'What you\'ll read aloud',
    body: 'This is your reference text. Take a moment to look it over, then record yourself reading it aloud.',
  },
  {
    id: 'start-recording',
    selector: 'start-recording',
    title: 'Record yourself',
    body: 'Tap "Start Recording" when you\'re ready. You have up to 45 seconds to read the passage.',
    advanceOn: 'event',
    waitHint: 'Tap "Start Recording" to continue',
  },
  {
    id: 'stop-recording',
    selector: 'stop-recording',
    title: 'Stop when you\'re done',
    body: 'Watch the mic bar — it shows your input level. Tap "Stop Recording" after you finish reading.',
    advanceOn: 'event',
    waitHint: 'Tap "Stop Recording" to continue',
  },
  {
    id: 'check-pronunciation',
    selector: 'check-pronunciation',
    title: 'Submit for scoring',
    body: 'Tap "Check My Pronunciation" to send your recording to Azure AI for analysis.',
    advanceOn: 'event',
    waitHint: 'Tap the button to continue',
  },
  {
    id: 'score-grid',
    selector: 'score-grid',
    title: 'Your five scores',
    body: 'Accuracy, Fluency, Completeness, Overall, and Prosody. Hover the ⓘ on any tile for a full explanation in English and Japanese.',
  },
  {
    id: 'word-chip',
    selector: 'word-chip',
    title: 'Review each word',
    body: 'Words are colour-coded: green ≥80, amber 60–79, red <60. Tap any word to see its phoneme scores, replay it, or save it to your drill list.',
  },
  {
    id: 'try-again',
    selector: 'try-again',
    title: 'You\'re all set!',
    body: 'Re-record any passage to improve your score, or pick a new one anytime. Happy practising!',
  },
]
