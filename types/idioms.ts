export interface IdiomChallenge {
  id: string
  phrase: string
  literalImageUrl: string
  figurativeImageUrl: string
  distractorImageUrls: string[]
  audioUrl?: string
  explanation: string
}
