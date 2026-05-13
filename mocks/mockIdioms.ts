import type { IdiomPack } from '~/types/idioms'

function placeholder(label: string) {
  return `https://placehold.co/800x800?text=${encodeURIComponent(label)}`
}

export const IDIOM_PACK_1: IdiomPack = {
  id: 'pack-1',
  title: 'Idiom Pack 1',
  challenges: [
    {
      id: 'bite-the-bullet',
      phrase: 'Bite the bullet',
      literalImageUrl: placeholder('Literal: Person biting a bullet'),
      figurativeImageUrl: placeholder('Figurative: Person facing a difficult situation'),
      distractorImageUrls: [
        placeholder('Distractor: Athlete with quick reactions'),
        placeholder('Distractor: Frustrated woman'),
        placeholder('Distractor: Archer missing a target'),
      ],
      explanation:
        'To get "cold feet" means to suddenly feel too nervous or scared to do something you had planned. It is often used when someone is afraid to go through with a big decision, like getting married or starting a new job.',
    },
    {
      id: 'cold-feet',
      phrase: 'Cold feet',
      literalImageUrl: placeholder('Literal: Frozen feet in snow'),
      figurativeImageUrl: placeholder('Figurative: Person nervous before wedding'),
      distractorImageUrls: [
        placeholder('Distractor: Person running away'),
        placeholder('Distractor: Doctor treating feet'),
        placeholder('Distractor: Person wearing socks'),
      ],
      explanation:
        'To get "cold feet" means to suddenly feel too nervous or scared to do something you had planned. It is often used when someone is afraid to go through with a big decision, like getting married or starting a new job.',
    },
    {
      id: 'piece-of-cake',
      phrase: 'Piece of cake',
      literalImageUrl: placeholder('Literal: Slice of birthday cake on a plate'),
      figurativeImageUrl: placeholder('Figurative: Student acing an easy exam'),
      distractorImageUrls: [
        placeholder('Distractor: Baker decorating a cake'),
        placeholder('Distractor: Person eating dessert'),
        placeholder('Distractor: Cake shop window'),
      ],
      explanation:
        '"Piece of cake" means something is very easy to do. If a task feels effortless, you can say it was a piece of cake — just like eating cake requires almost no effort.',
    },
    {
      id: 'better-late-than-never',
      phrase: 'Better late than never',
      literalImageUrl: placeholder('Literal: Person running very late to a clock'),
      figurativeImageUrl: placeholder('Figurative: Person arriving late but still welcomed'),
      distractorImageUrls: [
        placeholder('Distractor: Broken clock on wall'),
        placeholder('Distractor: Person giving up and going home'),
        placeholder('Distractor: Empty meeting room'),
      ],
      explanation:
        '"Better late than never" means it is better to do something late than not do it at all. It encourages people not to give up just because they are behind schedule.',
    },
    {
      id: 'time-flies',
      phrase: 'Time flies',
      literalImageUrl: placeholder('Literal: Clock with wings flying away'),
      figurativeImageUrl: placeholder('Figurative: Friends having fun, hours passing fast'),
      distractorImageUrls: [
        placeholder('Distractor: Airplane in the sky'),
        placeholder('Distractor: Person bored watching clock'),
        placeholder('Distractor: Calendar pages blowing away'),
      ],
      explanation:
        '"Time flies" means time passes much faster than you expect, especially when you are enjoying yourself. The full phrase is "time flies when you\'re having fun."',
    },
    {
      id: 'sit-tight',
      phrase: 'Sit tight',
      literalImageUrl: placeholder('Literal: Person gripping a chair tightly'),
      figurativeImageUrl: placeholder('Figurative: Person calmly waiting for news'),
      distractorImageUrls: [
        placeholder('Distractor: Person fidgeting anxiously'),
        placeholder('Distractor: Crowded subway seat'),
        placeholder('Distractor: Person running out the door'),
      ],
      explanation:
        '"Sit tight" means to wait patiently and not take any action until the right moment or until you receive more information. It is used to calm someone who is anxious to act.',
    },
    {
      id: 'let-someone-off-the-hook',
      phrase: 'Let someone off the hook',
      literalImageUrl: placeholder('Literal: Fish being released from a fishing hook'),
      figurativeImageUrl: placeholder('Figurative: Boss forgiving employee for a mistake'),
      distractorImageUrls: [
        placeholder('Distractor: Person hanging coat on hook'),
        placeholder('Distractor: Fishing boat on a lake'),
        placeholder('Distractor: Judge sentencing someone'),
      ],
      explanation:
        'To "let someone off the hook" means to free someone from a responsibility, obligation, or blame. Just like releasing a fish from a hook, you are allowing the person to escape a difficult situation.',
    },
    {
      id: 'cut-someone-some-slack',
      phrase: 'Cut someone some slack',
      literalImageUrl: placeholder('Literal: Person cutting a loose rope'),
      figurativeImageUrl: placeholder('Figurative: Team being understanding with a struggling colleague'),
      distractorImageUrls: [
        placeholder('Distractor: Scissors cutting paper'),
        placeholder('Distractor: Person being strictly judged'),
        placeholder('Distractor: Rope tied very tightly'),
      ],
      explanation:
        'To "cut someone some slack" means to be less strict or critical of someone, especially when they are having a hard time. You are giving them extra room to make mistakes without harsh judgment.',
    },
    {
      id: 'benefit-of-the-doubt',
      phrase: 'Give someone the benefit of the doubt',
      literalImageUrl: placeholder('Literal: Scale with a question mark balanced on it'),
      figurativeImageUrl: placeholder('Figurative: Person trusting a friend despite uncertainty'),
      distractorImageUrls: [
        placeholder('Distractor: Judge hammering a gavel'),
        placeholder('Distractor: Person accusing another'),
        placeholder('Distractor: Suspicious person under spotlight'),
      ],
      explanation:
        'To "give someone the benefit of the doubt" means to choose to believe or trust someone even when you are not completely sure they are right or innocent. You assume the best about their intentions.',
    },
    {
      id: 'best-of-both-worlds',
      phrase: 'The best of both worlds',
      literalImageUrl: placeholder('Literal: Two globes side by side'),
      figurativeImageUrl: placeholder('Figurative: Person enjoying city job and country home'),
      distractorImageUrls: [
        placeholder('Distractor: Person forced to choose one path'),
        placeholder('Distractor: World map with conflict zones'),
        placeholder('Distractor: Two people arguing over choices'),
      ],
      explanation:
        '"The best of both worlds" means enjoying two different advantages at the same time without having to sacrifice one for the other. You get all the benefits from two separate situations.',
    },
    {
      id: 'hit-the-sack',
      phrase: 'Hit the sack',
      literalImageUrl: placeholder('Literal: Person punching a large burlap sack'),
      figurativeImageUrl: placeholder('Figurative: Tired person falling into bed'),
      distractorImageUrls: [
        placeholder('Distractor: Boxer training in a gym'),
        placeholder('Distractor: Person wide awake at night'),
        placeholder('Distractor: Farmer carrying grain sacks'),
      ],
      explanation:
        '"Hit the sack" means to go to bed and sleep. The phrase comes from old times when mattresses were sacks filled with straw. It is a casual, informal way to say you are going to sleep.',
    },
    {
      id: 'speak-of-the-devil',
      phrase: 'Speak of the devil',
      literalImageUrl: placeholder('Literal: Devil cartoon appearing in a puff of smoke'),
      figurativeImageUrl: placeholder('Figurative: Person arriving just as they were being discussed'),
      distractorImageUrls: [
        placeholder('Distractor: Halloween costume party'),
        placeholder('Distractor: Person on the phone gossiping'),
        placeholder('Distractor: Empty room after a discussion'),
      ],
      explanation:
        '"Speak of the devil" is said when someone appears right at the moment you were talking about them. It is a playful way to note the coincidence of a person showing up during a conversation about them.',
    },
    {
      id: 'hit-the-road',
      phrase: 'Hit the road',
      literalImageUrl: placeholder('Literal: Fist hitting a paved road'),
      figurativeImageUrl: placeholder('Figurative: Person waving goodbye and driving away'),
      distractorImageUrls: [
        placeholder('Distractor: Road construction worker'),
        placeholder('Distractor: Person arriving at a destination'),
        placeholder('Distractor: Car accident on a highway'),
      ],
      explanation:
        '"Hit the road" means to start a journey or to leave a place. It is a casual expression used when you are departing, similar to saying "let\'s go" or "time to leave."',
    },
    {
      id: 'keep-an-eye-on',
      phrase: 'Keep an eye on',
      literalImageUrl: placeholder('Literal: Giant eyeball watching over a scene'),
      figurativeImageUrl: placeholder('Figurative: Parent watching child play at park'),
      distractorImageUrls: [
        placeholder('Distractor: Eye doctor examining a patient'),
        placeholder('Distractor: Person ignoring surroundings'),
        placeholder('Distractor: Security camera on a building'),
      ],
      explanation:
        'To "keep an eye on" something or someone means to watch them carefully and pay close attention, often to make sure they are safe or behaving properly.',
    },
    {
      id: 'spill-the-beans',
      phrase: 'Spill the beans',
      literalImageUrl: placeholder('Literal: Bowl of beans spilling onto a table'),
      figurativeImageUrl: placeholder('Figurative: Person accidentally revealing a surprise party'),
      distractorImageUrls: [
        placeholder('Distractor: Chef cooking a bean dish'),
        placeholder('Distractor: Person keeping a secret'),
        placeholder('Distractor: Grocery store produce aisle'),
      ],
      explanation:
        'To "spill the beans" means to accidentally or carelessly reveal secret information. It is used when someone shares something that was supposed to be kept private or hidden.',
    },
    {
      id: 'costs-an-arm-and-a-leg',
      phrase: 'Costs an arm and a leg',
      literalImageUrl: placeholder('Literal: Price tag attached to a severed arm and leg'),
      figurativeImageUrl: placeholder('Figurative: Person shocked by an expensive bill'),
      distractorImageUrls: [
        placeholder('Distractor: Hospital room with a patient'),
        placeholder('Distractor: Person shopping at a discount store'),
        placeholder('Distractor: Free giveaway event'),
      ],
      explanation:
        'If something "costs an arm and a leg," it is extremely expensive. This expression emphasizes that the price is so high it feels like you are giving up something very valuable — like a part of your body.',
    },
    {
      id: 'jump-the-gun',
      phrase: 'Jump the gun',
      literalImageUrl: placeholder('Literal: Runner leaping forward before starter pistol fires'),
      figurativeImageUrl: placeholder('Figurative: Person announcing news before it is confirmed'),
      distractorImageUrls: [
        placeholder('Distractor: Hunter aiming at a target'),
        placeholder('Distractor: Person waiting calmly in line'),
        placeholder('Distractor: Athlete finishing a race'),
      ],
      explanation:
        'To "jump the gun" means to start something too soon or to act before the right moment. It comes from track and field, where a runner who starts before the starting gun fires has jumped the gun.',
    },
    {
      id: 'rain-on-someones-parade',
      phrase: "Rain on someone's parade",
      literalImageUrl: placeholder('Literal: Storm cloud raining on a parade float'),
      figurativeImageUrl: placeholder('Figurative: Person criticizing a friend\'s exciting news'),
      distractorImageUrls: [
        placeholder('Distractor: Weather forecast showing sunshine'),
        placeholder('Distractor: People dancing in the rain happily'),
        placeholder('Distractor: Crowd cheering at a celebration'),
      ],
      explanation:
        'To "rain on someone\'s parade" means to spoil someone\'s plans or dampen their enthusiasm by introducing something negative. You are ruining a happy moment for them, just like rain ruins an outdoor parade.',
    },
    {
      id: 'bigger-fish-to-fry',
      phrase: 'Has bigger fish to fry',
      literalImageUrl: placeholder('Literal: Small fish next to a huge fish in a pan'),
      figurativeImageUrl: placeholder('Figurative: Executive too busy with major deals to handle minor issue'),
      distractorImageUrls: [
        placeholder('Distractor: Fisher casting a line'),
        placeholder('Distractor: Person focused on a tiny task'),
        placeholder('Distractor: Empty restaurant kitchen'),
      ],
      explanation:
        'To "have bigger fish to fry" means to have more important things to deal with than the current situation. You are saying that something else deserves more of your time and attention.',
    },
    {
      id: 'grain-of-salt',
      phrase: 'Take it with a grain of salt',
      literalImageUrl: placeholder('Literal: Hand holding a single grain of salt over food'),
      figurativeImageUrl: placeholder('Figurative: Person skeptically reading an unverified rumor'),
      distractorImageUrls: [
        placeholder('Distractor: Person blindly believing everything'),
        placeholder('Distractor: Chef seasoning a meal generously'),
        placeholder('Distractor: Doctor prescribing medicine'),
      ],
      explanation:
        'To "take something with a grain of salt" means to be skeptical about it and not fully believe it. You acknowledge the information but remain doubtful about its accuracy or truth.',
    },
    {
      id: 'call-it-a-day',
      phrase: 'Call it a day',
      literalImageUrl: placeholder('Literal: Person shouting "Day!" at a calendar'),
      figurativeImageUrl: placeholder('Figurative: Office workers shutting down computers to go home'),
      distractorImageUrls: [
        placeholder('Distractor: Person starting work early in the morning'),
        placeholder('Distractor: Worker pulling an all-nighter'),
        placeholder('Distractor: Alarm clock ringing loudly'),
      ],
      explanation:
        'To "call it a day" means to stop working or doing an activity, usually because you have done enough for the day or you are tired. It signals that it is time to wrap up and finish.',
    },
    {
      id: 'hit-the-books',
      phrase: 'Hit the books',
      literalImageUrl: placeholder('Literal: Fist slamming down on a stack of textbooks'),
      figurativeImageUrl: placeholder('Figurative: Student studying hard at a desk with many books'),
      distractorImageUrls: [
        placeholder('Distractor: Person throwing books in the trash'),
        placeholder('Distractor: Library with empty chairs'),
        placeholder('Distractor: Bookstore shopping for novels'),
      ],
      explanation:
        'To "hit the books" means to start studying seriously. It is a common informal expression used by students when they need to dedicate time to reading and studying for school or exams.',
    },
  ],
}

export const MOCK_IDIOMS = IDIOM_PACK_1.challenges

export const ALL_PACKS = [IDIOM_PACK_1]
