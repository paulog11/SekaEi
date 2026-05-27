import type { IdiomPack } from '~/types/idioms'

function placeholder(label: string) {
  return `https://placehold.co/800x800?text=${encodeURIComponent(label)}`
}

export const IDIOM_PACK_1: IdiomPack = {
  id: 'pack-1',
  title: 'Idiom Pack 1',
  difficulty: 'Beginner',
  challenges: [
    {
      id: 'bite-the-bullet',
      phrase: 'Bite the bullet',
      meaning: 'To endure a painful or difficult situation without complaining',
      sampleSentence: 'The surgery was scary, but she decided to bite the bullet and go through with it.',
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
      meaning: 'To suddenly feel too nervous or scared to follow through with plans',
      sampleSentence: 'He got cold feet right before asking her to dance at the party.',
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
      meaning: 'Something that is very easy to do',
      sampleSentence: 'The math test was a piece of cake — I finished it in ten minutes.',
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
      meaning: 'It is better to do something late than to not do it at all',
      sampleSentence: 'I know I missed the deadline, but I submitted the report anyway — better late than never.',
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
      meaning: 'Time passes much faster than you expect',
      sampleSentence: 'We were having so much fun at the festival that time flew by.',
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
      meaning: 'To wait patiently without taking any action',
      sampleSentence: 'Just sit tight — the doctor will call your name in a few minutes.',
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
      meaning: 'To free someone from a responsibility or blame',
      sampleSentence: 'The teacher let him off the hook because it was his first mistake all semester.',
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
      meaning: 'To be less strict or critical of someone',
      sampleSentence: 'Cut her some slack — she only started the job last week and is still learning.',
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
      meaning: 'To choose to believe or trust someone despite uncertainty',
      sampleSentence: "I'll give him the benefit of the doubt and assume he was just running late, not being rude.",
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
      meaning: 'Enjoying two different advantages at the same time',
      sampleSentence: 'Working from home gives her the best of both worlds — a good salary and time with her family.',
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
      meaning: 'To go to bed and sleep',
      sampleSentence: "It's almost midnight, and I have an early class tomorrow, so I'm going to hit the sack.",
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
      meaning: 'Said when someone appears right as you were talking about them',
      sampleSentence: 'We were just talking about you — speak of the devil! Come join us.',
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
      meaning: 'To start a journey or leave a place',
      sampleSentence: "We'd better hit the road now if we want to arrive before dark.",
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
      meaning: 'To watch something or someone carefully',
      sampleSentence: 'Can you keep an eye on my bag while I go to buy a drink?',
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
      meaning: 'To accidentally reveal secret information',
      sampleSentence: "Don't spill the beans about the surprise party — she has no idea!",
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
      meaning: 'Something that is extremely expensive',
      sampleSentence: 'The concert tickets cost an arm and a leg, but it was worth every penny.',
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
      meaning: 'To start something too soon or act before the right moment',
      sampleSentence: "Don't jump the gun — wait until you have all the facts before making a decision.",
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
      meaning: "To spoil someone's plans or dampen their enthusiasm",
      sampleSentence: 'I hate to rain on your parade, but the outdoor event has been cancelled due to the weather.',
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
      meaning: 'To have more important things to deal with',
      sampleSentence: 'The CEO has bigger fish to fry than worrying about the broken coffee machine.',
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
      meaning: 'To be skeptical and not fully believe something',
      sampleSentence: 'The review seemed exaggerated, so I took it with a grain of salt before deciding.',
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
      meaning: 'To stop working or doing an activity for the day',
      sampleSentence: "We've been studying for five hours straight — let's call it a day and rest.",
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
      meaning: 'To start studying seriously',
      sampleSentence: 'The exam is tomorrow, so I need to hit the books tonight instead of watching TV.',
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

export const IDIOM_PACK_2: IdiomPack = {
  id: 'pack-2',
  title: 'Idiom Pack 2',
  difficulty: 'Intermediate',
  challenges: [
    {
      id: 'cutting-corners',
      phrase: 'Cutting corners',
      meaning: 'To do something in the easiest or cheapest way, often by ignoring rules or quality',
      sampleSentence: 'The builder was fined for cutting corners on safety inspections.',
      literalImageUrl: placeholder('Literal: Person cutting a corner off a piece of paper'),
      figurativeImageUrl: placeholder('Figurative: Worker skipping safety steps on a construction site'),
      distractorImageUrls: [
        placeholder('Distractor: Person turning a sharp corner while driving'),
        placeholder('Distractor: Scissors on a desk'),
        placeholder('Distractor: Tidy organized worker'),
      ],
      explanation:
        "'Cutting corners' means taking shortcuts to save time or money, usually at the cost of quality or proper procedure. It often has a negative meaning, suggesting carelessness or dishonesty.",
    },
    {
      id: 'back-to-square-one',
      phrase: 'Back to square one',
      meaning: 'To return to the starting point because previous progress was lost',
      sampleSentence: 'After the client rejected the design, we were back to square one.',
      literalImageUrl: placeholder('Literal: Board game piece being moved back to square 1'),
      figurativeImageUrl: placeholder('Figurative: Team at a whiteboard starting a project over'),
      distractorImageUrls: [
        placeholder('Distractor: Checkerboard with pieces mid-game'),
        placeholder('Distractor: Person celebrating a finished project'),
        placeholder('Distractor: Calendar with a date circled'),
      ],
      explanation:
        "'Back to square one' means returning to the very beginning, usually after an attempt has failed. The phrase comes from board games where a player is sent back to the first square.",
    },
    {
      id: 'up-in-the-air',
      phrase: 'Up in the air',
      meaning: 'Unsettled or undecided',
      sampleSentence: 'Our weekend plans are still up in the air until we hear about the weather.',
      literalImageUrl: placeholder('Literal: Object floating with no clear direction'),
      figurativeImageUrl: placeholder('Figurative: Person shrugging at a question mark on a board'),
      distractorImageUrls: [
        placeholder('Distractor: Airplane flying at high altitude'),
        placeholder('Distractor: Person confidently signing a contract'),
        placeholder('Distractor: Balloon tied to a fence post'),
      ],
      explanation:
        "If something is 'up in the air,' it is uncertain or has not been decided yet. Like an object floating without a clear destination, the outcome is still unresolved.",
    },
    {
      id: 'go-the-extra-mile',
      phrase: 'Go the extra mile',
      meaning: 'To make more effort than is expected of you',
      sampleSentence: 'She always goes the extra mile to help her students succeed.',
      literalImageUrl: placeholder('Literal: Road sign showing 1 mile with a runner going further'),
      figurativeImageUrl: placeholder('Figurative: Employee staying late to help a struggling colleague'),
      distractorImageUrls: [
        placeholder('Distractor: Marathon runner giving up near finish line'),
        placeholder('Distractor: Person doing only the minimum required work'),
        placeholder('Distractor: Taxi driver taking a shortcut'),
      ],
      explanation:
        "To 'go the extra mile' means to do more than what is required or expected. It describes someone who puts in extra effort to achieve a great result or help others.",
    },
    {
      id: 'under-the-weather',
      phrase: 'Under the weather',
      meaning: 'Feeling slightly ill',
      sampleSentence: "I'm a little under the weather today, so I'll skip the gym.",
      literalImageUrl: placeholder('Literal: Person standing in rain looking miserable'),
      figurativeImageUrl: placeholder('Figurative: Person in bed with a mild cold holding tissues'),
      distractorImageUrls: [
        placeholder('Distractor: Storm cloud directly over a city'),
        placeholder('Distractor: Person running happily in the rain'),
        placeholder('Distractor: Weather app showing a forecast'),
      ],
      explanation:
        "Feeling 'under the weather' means feeling slightly sick or unwell. It is a polite, casual way to say you are not feeling 100%.",
    },
    {
      id: 'throw-in-the-towel',
      phrase: 'Throw in the towel',
      meaning: 'To give up or admit defeat',
      sampleSentence: 'After three failed attempts, he finally threw in the towel.',
      literalImageUrl: placeholder('Literal: Towel being thrown into a boxing ring'),
      figurativeImageUrl: placeholder('Figurative: Person walking away from a difficult challenge'),
      distractorImageUrls: [
        placeholder('Distractor: Laundry basket full of towels'),
        placeholder('Distractor: Boxer celebrating a victory'),
        placeholder('Distractor: Person pushing through exhaustion to finish'),
      ],
      explanation:
        "To 'throw in the towel' means to give up or surrender. It comes from boxing, where a trainer throws a towel into the ring to stop the fight and protect the boxer.",
    },
    {
      id: 'blessing-in-disguise',
      phrase: 'A blessing in disguise',
      meaning: 'Something that seems bad at first but turns out to be good',
      sampleSentence: 'Losing that job was a blessing in disguise — it led me to a much better one.',
      literalImageUrl: placeholder('Literal: Gift box wrapped in thorns but glowing inside'),
      figurativeImageUrl: placeholder('Figurative: Person happy about a missed bus that led them to meet a friend'),
      distractorImageUrls: [
        placeholder('Distractor: Something clearly bad with no upside'),
        placeholder('Distractor: Person crying over spilled milk'),
        placeholder('Distractor: A wolf in a costume'),
      ],
      explanation:
        "'A blessing in disguise' refers to something that initially appears negative or unfortunate but later proves to be beneficial. The good fortune is hidden behind a bad first impression.",
    },
    {
      id: 'beat-around-the-bush',
      phrase: 'Beat around the bush',
      meaning: 'To avoid talking about the main point of an issue',
      sampleSentence: 'Stop beating around the bush and just tell me what happened.',
      literalImageUrl: placeholder('Literal: Person poking a bush while avoiding touching something else'),
      figurativeImageUrl: placeholder('Figurative: Person talking at length without getting to the point'),
      distractorImageUrls: [
        placeholder('Distractor: Gardener trimming a hedge'),
        placeholder('Distractor: Person speaking directly and clearly'),
        placeholder('Distractor: Hunter hiding behind a bush'),
      ],
      explanation:
        "To 'beat around the bush' means to avoid discussing the main subject directly. Instead of getting to the point, the person talks around it, often because the topic is uncomfortable.",
    },
    {
      id: 'pull-yourself-together',
      phrase: 'Pull yourself together',
      meaning: 'To calm down and regain control of your emotions',
      sampleSentence: 'I know the news is upsetting, but try to pull yourself together before the meeting.',
      literalImageUrl: placeholder('Literal: Scattered puzzle pieces being gathered into one'),
      figurativeImageUrl: placeholder('Figurative: Person taking a deep breath to calm down before speaking'),
      distractorImageUrls: [
        placeholder('Distractor: Person crying uncontrollably'),
        placeholder('Distractor: Someone pulling a heavy rope'),
        placeholder('Distractor: Group hug after a difficult moment'),
      ],
      explanation:
        "To 'pull yourself together' means to calm down and regain self-control after feeling overwhelmed or upset. It is used to encourage someone who is struggling emotionally.",
    },
    {
      id: 'get-out-of-hand',
      phrase: 'Get out of hand',
      meaning: 'To become difficult or impossible to control',
      sampleSentence: 'The argument got out of hand quickly and had to be stopped by management.',
      literalImageUrl: placeholder('Literal: Object slipping out of a hand'),
      figurativeImageUrl: placeholder('Figurative: Small party turning into a chaotic crowd'),
      distractorImageUrls: [
        placeholder('Distractor: Person confidently managing a busy situation'),
        placeholder('Distractor: Empty quiet room'),
        placeholder('Distractor: Person offering a handshake'),
      ],
      explanation:
        "When something 'gets out of hand,' it has become too chaotic or extreme to manage. The situation has gone beyond what is acceptable or controllable.",
    },
    {
      id: 'not-rocket-science',
      phrase: "It's not rocket science",
      meaning: 'Something is not difficult to understand or do',
      sampleSentence: "Just follow the instructions step by step — it's not rocket science.",
      literalImageUrl: placeholder('Literal: Rocket with complex equations vs simple recipe card'),
      figurativeImageUrl: placeholder('Figurative: Person easily assembling furniture with a smile'),
      distractorImageUrls: [
        placeholder('Distractor: NASA engineer at a control panel'),
        placeholder('Distractor: Person struggling with a very complicated task'),
        placeholder('Distractor: Astronaut in space'),
      ],
      explanation:
        "'It's not rocket science' is a casual way of saying a task or idea is not as complicated as it might seem. It encourages someone who is overthinking something that is actually straightforward.",
    },
    {
      id: 'dime-a-dozen',
      phrase: 'A dime a dozen',
      meaning: 'Very common and of little special value',
      sampleSentence: 'Tourist souvenir shops near the castle are a dime a dozen.',
      literalImageUrl: placeholder('Literal: Pile of dimes next to twelve identical items'),
      figurativeImageUrl: placeholder('Figurative: Crowded street full of identical coffee shops'),
      distractorImageUrls: [
        placeholder('Distractor: Rare gemstone in a display case'),
        placeholder('Distractor: Coin collector examining a valuable piece'),
        placeholder('Distractor: Expensive one-of-a-kind antique'),
      ],
      explanation:
        "If something is 'a dime a dozen,' it is so common that it has little individual worth. The idiom suggests the thing is easily found everywhere and easily replaced.",
    },
    {
      id: 'easy-does-it',
      phrase: 'Easy does it',
      meaning: 'Be careful and proceed slowly',
      sampleSentence: "Easy does it — that antique vase is very fragile.",
      literalImageUrl: placeholder('Literal: Hands slowly and carefully moving a fragile object'),
      figurativeImageUrl: placeholder('Figurative: Two movers carefully guiding a heavy sofa through a door'),
      distractorImageUrls: [
        placeholder('Distractor: Person rushing carelessly through a task'),
        placeholder('Distractor: Easy button being pressed'),
        placeholder('Distractor: Person relaxing with no effort'),
      ],
      explanation:
        "'Easy does it' is said when you want someone to slow down and be gentle, often to avoid breaking something or causing an accident. It is a calm, cautious instruction.",
    },
    {
      id: 'make-a-long-story-short',
      phrase: 'Make a long story short',
      meaning: 'To skip the details and give only a brief summary',
      sampleSentence: 'To make a long story short, we missed the flight and ended up driving all night.',
      literalImageUrl: placeholder('Literal: Long scroll of text being compressed into a short note'),
      figurativeImageUrl: placeholder('Figurative: Person fast-forwarding through a long story to the ending'),
      distractorImageUrls: [
        placeholder('Distractor: Person writing a very long detailed report'),
        placeholder('Distractor: Library shelf full of thick books'),
        placeholder('Distractor: Storyteller captivating a crowd with full details'),
      ],
      explanation:
        "'To make a long story short' is used when you want to skip the full details and jump to the main point or result. It signals you are giving a condensed version of events.",
    },
    {
      id: 'miss-the-boat',
      phrase: 'Miss the boat',
      meaning: 'To miss an opportunity',
      sampleSentence: "If you don't apply by Friday, you'll miss the boat on this scholarship.",
      literalImageUrl: placeholder('Literal: Person running toward a dock as a boat pulls away'),
      figurativeImageUrl: placeholder('Figurative: Person realizing they missed the deadline for a great deal'),
      distractorImageUrls: [
        placeholder('Distractor: Person arriving early at a harbor'),
        placeholder('Distractor: Boat returning to pick someone up'),
        placeholder('Distractor: Person successfully boarding a ferry'),
      ],
      explanation:
        "To 'miss the boat' means to lose a chance to do something because you acted too slowly or did not respond in time. The opportunity has already passed, just like a boat that has left the dock.",
    },
    {
      id: 'so-far-so-good',
      phrase: 'So far so good',
      meaning: 'Things are going well up to this point',
      sampleSentence: "I've been studying for three hours — so far so good, but I still have a lot to cover.",
      literalImageUrl: placeholder('Literal: Hiker checking progress halfway up a mountain'),
      figurativeImageUrl: placeholder('Figurative: Student reviewing completed exam questions with satisfaction'),
      distractorImageUrls: [
        placeholder('Distractor: Person at the finish line celebrating full completion'),
        placeholder('Distractor: Things clearly going wrong from the start'),
        placeholder('Distractor: Person looking backwards with regret'),
      ],
      explanation:
        "'So far so good' means that everything is going well at the current moment. It implies cautious optimism — things are fine right now, but there is still uncertainty ahead.",
    },
  ],
}

export const ALL_PACKS = [IDIOM_PACK_1, IDIOM_PACK_2]
