import type { IdiomChallenge } from '~/types/idioms'

export const MOCK_IDIOMS: IdiomChallenge[] = [
  {
    id: 'cold-feet',
    phrase: 'Cold feet',
    literalImageUrl: 'https://placehold.co/600x400?text=Literal:+Frozen+feet+in+snow',
    figurativeImageUrl: 'https://placehold.co/600x400?text=Figurative:+Person+nervous+before+wedding',
    distractorImageUrls: [
      'https://placehold.co/600x400?text=Distractor:+Person+running+away',
      'https://placehold.co/600x400?text=Distractor:+Doctor+treating+feet',
      'https://placehold.co/600x400?text=Distractor:+Person+wearing+socks',
    ],
    explanation:
      'To get "cold feet" means to suddenly feel too nervous or scared to do something you had planned. It is often used when someone is afraid to go through with a big decision, like getting married or starting a new job.',
  },
  {
    id: 'break-a-leg',
    phrase: 'Break a leg',
    literalImageUrl: 'https://placehold.co/600x400?text=Literal:+Person+with+broken+leg+in+cast',
    figurativeImageUrl: 'https://placehold.co/600x400?text=Figurative:+Actor+on+stage+performing+well',
    distractorImageUrls: [
      'https://placehold.co/600x400?text=Distractor:+Hospital+emergency+room',
      'https://placehold.co/600x400?text=Distractor:+Person+tripping+and+falling',
      'https://placehold.co/600x400?text=Distractor:+Doctor+looking+at+x-ray',
    ],
    explanation:
      '"Break a leg" is a way to wish someone good luck, especially before a performance or important event. Instead of saying "good luck," people say this because saying "good luck" directly was once thought to bring bad luck in the theater world.',
  },
  {
    id: 'bite-the-bullet',
    phrase: 'Bite the bullet',
    literalImageUrl: 'https://placehold.co/600x400?text=Literal:+Person+biting+a+metal+bullet',
    figurativeImageUrl: 'https://placehold.co/600x400?text=Figurative:+Person+enduring+pain+at+dentist',
    distractorImageUrls: [
      'https://placehold.co/600x400?text=Distractor:+Person+eating+food',
      'https://placehold.co/600x400?text=Distractor:+Soldier+loading+a+gun',
      'https://placehold.co/600x400?text=Distractor:+Person+smiling+happily',
    ],
    explanation:
      'To "bite the bullet" means to force yourself to do something difficult or unpleasant that you have been avoiding. It comes from the old practice of having patients bite on a bullet to endure pain during surgery before anesthesia existed.',
  },
]
