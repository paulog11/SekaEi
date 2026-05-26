export interface IdiomChallenge {
  id: string
  phrase: string
  meaning: string
  sampleSentence: string
  literalImageUrl: string
  figurativeImageUrl: string
  distractorImageUrls: string[]
  audioUrl?: string
  explanation: string
}

export interface IdiomPack {
  id: string
  title: string
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced'
  challenges: IdiomChallenge[]
}
