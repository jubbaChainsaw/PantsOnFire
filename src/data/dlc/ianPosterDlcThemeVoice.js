/**
 * Ian Poster host voice lines for DLC theme trios.
 * Each pack has its own master CSV under exports/dlc/<pack-id>/host-voice-master.csv
 */

function flowCopy(home, setup, chooser, passPhone, revealNormal, revealLiar, discussion, voting, caught, escaped, winner, onlineLobby) {
  return {
    home,
    setup,
    chooser,
    passPhone,
    revealNormal,
    revealLiar,
    discussion,
    voting,
    caught,
    escaped,
    winner,
    onlineLobby,
  };
}

/** Registry of DLC packs that have Ian Poster voice scripts (for export tooling). */
export const DLC_HOST_VOICE_PACKS = {
  'wanted-better-alibis': {
    id: 'wanted-better-alibis',
    name: 'Wanted: Better Alibis',
    themeNames: ['Cowboys', 'Gangsters', 'Wrestlers'],
  },
  'ye-olde-baloney': {
    id: 'ye-olde-baloney',
    name: 'Ye Olde Baloney',
    themeNames: ['Vikings', 'Gladiators', 'Medieval'],
  },
  'myth-taken-identity': {
    id: 'myth-taken-identity',
    name: 'Myth-Taken Identity',
    themeNames: ['Royalty', 'Mythology (Gods & Legends)', 'Time Travelers'],
  },
  'licence-to-fib': {
    id: 'licence-to-fib',
    name: 'Licence to Fib',
    themeNames: ['Spies', 'Ninjas', 'Law and Order'],
  },
  'rank-and-file-mostly-file': {
    id: 'rank-and-file-mostly-file',
    name: 'Rank & File (Mostly File)',
    themeNames: ['Medical', 'Military', 'Flying Squad'],
  },
  'beast-mode-deceit': {
    id: 'beast-mode-deceit',
    name: 'Beast Mode: Deceit',
    themeNames: ['Sports', 'Animals', 'Monsters'],
  },
  'ctrl-alt-elieve': {
    id: 'ctrl-alt-elieve',
    name: 'Ctrl+Alt+ELIEVE',
    themeNames: ['Cyberpunk', 'Sci-Fi', 'Aliens'],
  },
  'dark-arts-krafty-lies': {
    id: 'dark-arts-krafty-lies',
    name: 'Dark Arts & Krafty Lies',
    themeNames: ['Wizards & Witches', 'Post-Apocalypse', 'Carnival'],
  },
  'drawn-to-lie': {
    id: 'drawn-to-lie',
    name: 'Drawn to Lie',
    themeNames: ['Under the Sea', 'Cartoons', 'Anime'],
  },
  'glitter-and-suspects': {
    id: 'glitter-and-suspects',
    name: 'Glitter & Suspects',
    themeNames: ['Rock Stars', 'Drag Queens', 'Superheroes'],
  },
};

export const DLC_THEME_VOICE_SLUG_BY_NAME = {
  Cowboys: 'cowboys',
  Gangsters: 'gangsters',
  Wrestlers: 'wrestlers',
  Vikings: 'vikings',
  Gladiators: 'gladiators',
  Medieval: 'medieval',
  Royalty: 'royalty',
  'Mythology (Gods & Legends)': 'mythology-gods-legends',
  'Time Travelers': 'time-travelers',
  Spies: 'spies',
  Ninjas: 'ninjas',
  'Law and Order': 'law-and-order',
  Medical: 'medical',
  Military: 'military',
  'Flying Squad': 'flying-squad',
  Sports: 'sports',
  Animals: 'animals',
  Monsters: 'monsters',
  Cyberpunk: 'cyberpunk',
  'Sci-Fi': 'sci-fi',
  Aliens: 'aliens',
  'Wizards & Witches': 'wizards-witches',
  'Post-Apocalypse': 'post-apocalypse',
  Carnival: 'carnival',
  'Under the Sea': 'under-the-sea',
  Cartoons: 'cartoons',
  Anime: 'anime',
  'Rock Stars': 'rock-stars',
  'Drag Queens': 'drag-queens',
  Superheroes: 'superheroes',
};

/**
 * DLC theme voice scripts. Add themes as each pack is authored.
 * Export with: npm run host:export-dlc-voice -- --pack <pack-id>
 */
export const IAN_POSTER_DLC_THEME_VOICE = {
  Cowboys: {
    themedRole: 'high-noon suspicion stylist',
    accentNotes: 'Western drawl; dry humor, wanted-poster energy, partner/sundown idioms.',
    welcomeSuffix: 'and welcome to Pants on Fire — wanted for better alibis.',
    greetings: {
      morning: 'Mornin',
      afternoon: 'Howdy this afternoon',
      evening: 'Evenin',
      anytime: 'Howdy',
    },
    introHooks: [
      'Round these parts, a shaky alibi gets you posted on the saloon wall by sundown.',
      'Keep your clue short, partner — ramblin is how innocent folks start lookin guilty.',
      'I have seen tumbleweeds with more convincing stories than some of you.',
      'One of you is ridin a lie into town, and I aim to find out who.',
    ],
    onlinePrompt: 'Online saloon is open: private cards, public shootout at high noon.',
    passPrompt: 'Pass the phone nice and easy, like a loaded revolver you do not want to drop.',
    closingLine: 'Keep your story straight, your hat lower, and your alibi faster than a draw.',
    roundsLineTemplate:
      'Through {rounds} dusty rounds, {players} outlaws will try to dodge the liar before the liar dodges the truth.',
    roundStingers: [
      '{roundTypeName} at high noon. One clue each, no ten-gallon monologues.',
      'In {roundTypeFlavor}, the liar rides in too confident or too quiet.',
      'Read the room, partner. Somebody is bluffin with their whole ten-gallon hat.',
    ],
    flowCopy: flowCopy(
      [
        'Wanted: better alibis. The frontier of fibs starts now.',
        'Saddle up for suspicion, partner. Someone here is all hat, no truth.',
      ],
      [
        'Round up your posse and pick how wild this ride gets.',
        'Set the rules before someone lawyered-up starts talkin.',
      ],
      [
        'Pick a category like choosin which side of the law you are on today.',
        'Your pick might backfire faster than a misfire at high noon.',
      ],
      [
        'Pass that phone slow — peekin is how good folks become wanted posters.',
        'Hand it over like evidence at the marshal desk.',
      ],
      [
        'You drew an honest card. Try not to grin like you just found gold.',
        'Act natural, partner. Innocent and nervous still looks guilty out here.',
      ],
      [
        'Wanted poster update: you are the liar. Ride that lie or get bucked off.',
        'You are the rustler of truth tonight. Sell it or get run out of town.',
      ],
      [
        'One clue each before the saloon starts judgin.',
        'Speak up, partner. Mumbling sounds like a confession with extra steps.',
      ],
      [
        'Point at the varmint. The town is watchin.',
        'Vote now — frontier justice waits for nobody.',
      ],
      [
        'Caught at high noon. That alibi did not survive the draw.',
        'The liar folded faster than a cheap tent in a windstorm.',
      ],
      [
        'The liar rode off into the sunset. Embarrassin for the rest of y’all.',
        'They escaped. Y’all got played like greenhorns.',
      ],
      [
        'Crowned the least wanted liar in the territory.',
        'Winner, winner, chuckwagon dinner — take a bow, partner.',
      ],
      [
        'Remote saloon: every device joins the shootout from its own corral.',
      ],
    ),
  },
  Gangsters: {
    themedRole: 'consigliere of convenient memory',
    accentNotes: 'Mob-boss cadence; streetwise, clipped, snitch and family idioms.',
    welcomeSuffix: 'and welcome to Pants on Fire — the family expects better alibis.',
    greetings: {
      morning: 'Morning, family',
      afternoon: 'Afternoon, family',
      evening: 'Evening, family',
      anytime: 'Listen up, family',
    },
    introHooks: [
      'Talk smart, talk short, and never sound like a snitch.',
      'If your clue wobbles, the whole family notices — capisce?',
      'I can smell a rat alibi from across the borough.',
      'One of you is runnin a story that does not add up, and I do not like math that lies.',
    ],
    onlinePrompt: 'Online operation is live. Keep private prompts off the wire.',
    passPrompt: 'Pass the phone and keep your stories consistent, capisce?',
    closingLine: 'Keep it tidy, keep it believable, and keep your prints off the evidence.',
    roundsLineTemplate:
      'Over {rounds} sit-downs, {players} members of the family will find the liar before the liar finds your weak spot.',
    roundStingers: [
      '{roundTypeName} starts now. Keep your clue tidy and your nerves hidden.',
      'In {roundTypeFlavor}, one rat is overexplaining for no reason.',
      'No speeches. No panic. Just one clean clue and ruthless judgement.',
    ],
    flowCopy: flowCopy(
      [
        'The family is assembled. Somebody here is a rat with a better press agent.',
        'Tonight we separate facts from fiction — and friends from witnesses.',
      ],
      [
        'Set the rules before someone starts improvin their alibi.',
        'Get the crew sorted. Trust is optional; suspicion is mandatory.',
      ],
      [
        'Pick a category. Choose wisely — the boss is takin notes.',
        'Your category pick might age worse than last week’s alibi.',
      ],
      [
        'Pass the phone. No peekin — snitches get stitches, remember?',
        'Hand it over clean. Fingerprints are for amateurs.',
      ],
      [
        'You got a straight story. Try not to look relieved.',
        'Blend in with the family. Nervous sweating is still a tell.',
      ],
      [
        'Bad news: you are the rat tonight. Lie like rent is due.',
        'You are the problem in this room. Compose yourself.',
      ],
      [
        'Everybody talks. Keep it tight and reviewable.',
        'One statement each. I am loggin every wobble.',
      ],
      [
        'Point at the rat. Make it official.',
        'Vote before this goes to internal review.',
      ],
      [
        'The family has spoken. The liar cracked.',
        'Busted. Should have kept your mouth shut.',
      ],
      [
        'The rat slipped away. Shameful scenes for the rest of you.',
        'They walked. You all got played like tourists.',
      ],
      [
        'Top dog of the family tonight. Respect earned.',
        'You run this table now. Nobody crosses you.',
      ],
      [
        'Distributed operation: separate phones, same manhunt.',
      ],
    ),
  },
  Wrestlers: {
    themedRole: 'ringside doubt dealer',
    accentNotes: 'Arena announcer energy; sports-entertainment hype, work/shoot puns.',
    welcomeSuffix: 'and welcome to Pants on Fire — main event: better alibis.',
    greetings: {
      morning: 'Good morning, marks',
      afternoon: 'Good afternoon, marks',
      evening: 'Good evening, marks',
      anytime: 'Ladies and gentlemen',
    },
    introHooks: [
      'Keep your clue tight or get body-slammed by suspicion.',
      'One of you is cutting promo with fake facts — and the crowd can tell.',
      'In this ring, over-selling your alibi is a finishing move on yourself.',
      'Somebody is workin the room with a worked alibi, and I love a good heel turn.',
    ],
    onlinePrompt: 'Online arena mode: private cards, public callouts from the cheap seats.',
    passPrompt: 'Pass the phone like a steel chair in slow motion.',
    closingLine: 'Keep the promo short, the clue sharp, and your face heel-neutral.',
    roundsLineTemplate:
      'Across {rounds} rounds, {players} competitors will expose the liar before the liar taps out.',
    roundStingers: [
      '{roundTypeName} main event. One clue each, no twenty-minute promos.',
      'In {roundTypeFlavor}, liars tap out when specifics hit the mat.',
      'Bring the energy, keep the clue compact, and read the room.',
    ],
    flowCopy: flowCopy(
      [
        'Welcome to the squared circle of suspicion. Somebody is workin a lie.',
        'Tonight’s card: chaos, clues, and one absolutely guilty promo.',
      ],
      [
        'Book your match settings and let the drama begin.',
        'Set the rules before someone hits you with a surprise finisher.',
      ],
      [
        'Pick your category like pickin your entrance music.',
        'Choose wrong and the crowd turns on you instantly.',
      ],
      [
        'Pass the phone — no peekin, that is a cheap heel move.',
        'Hand it over like a tag-team relay worth booing.',
      ],
      [
        'You drew a face card. Play it straight.',
        'Act natural — botched selling still gets you booed.',
      ],
      [
        'Plot twist: you are the heel. Work the lie or get buried.',
        'You are the villain of this promo. Commit to the bit.',
      ],
      [
        'One clue each. No runnin the ropes around the truth.',
        'Talk now before the crowd starts chanting your name wrong.',
      ],
      [
        'Point at the heel. Make the call.',
        'Vote now — the ref is not waiting.',
      ],
      [
        'Pinned! The liar tapped out under pressure.',
        'Caught clean. That alibi had no kick-out left.',
      ],
      [
        'The heel escaped via count-out. Embarrassing for the faces.',
        'They fled the ring. You all fell for the work.',
      ],
      [
        'And your winner, by way of better instincts!',
        'Champion of chaos — take a bow on the turnbuckle.',
      ],
      [
        'Watch party mode: every screen joins the arena.',
      ],
    ),
  },
};
