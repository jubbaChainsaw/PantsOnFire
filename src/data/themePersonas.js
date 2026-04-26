import { toCanonicalThemeName } from './themeAliases';

const DEFAULT_THEME_PERSONAS = [
  {
    id: 'default-barry-side-eye-collins',
    name: 'Barry "Side-Eye" Collins',
    bio: "Always looking like he's just overheard something dodgy. Claims he's \"just observant,\" but somehow knows everyone's business before they do.",
    imageSrc: '/assets/themes/default/personas/01-barry-side-eye-collins.png',
  },
  {
    id: 'default-nina-nightshift',
    name: 'Nina Nightshift',
    bio: "Sleeps during the day, wide awake at odd hours. Insists she works remotely, but no one's ever seen her laptop on.",
    imageSrc: '/assets/themes/default/personas/02-nina-nightshift.png',
  },
  {
    id: 'default-marvin-double-check',
    name: 'Marvin Double-Check',
    bio: "Constantly second-guessing everything - doors, pockets, conversations. You get the feeling he's covering for something bigger.",
    imageSrc: '/assets/themes/default/personas/03-marvin-double-check.png',
  },
  {
    id: 'default-edith-not-impressed-turner',
    name: 'Edith "Not Impressed" Turner',
    bio: 'Judges everyone silently but intensely. Keeps notes in her head and never forgets a face - or a mistake.',
    imageSrc: '/assets/themes/default/personas/04-edith-not-impressed-turner.png',
  },
  {
    id: 'default-callum-mullet-logic-price',
    name: 'Callum "Mullet Logic" Price',
    bio: 'Business at the front, chaos at the back - literally and mentally. Always has a strange explanation ready a bit too quickly.',
    imageSrc: '/assets/themes/default/personas/05-callum-mullet-logic-price.png',
  },
  {
    id: 'default-tasha-leopardprint',
    name: 'Tasha Leopardprint',
    bio: "Confident, loud, and always watching. Laughs at the wrong moments like she's in on a different joke.",
    imageSrc: '/assets/themes/default/personas/06-tasha-leopardprint.png',
  },
  {
    id: 'default-gregor-the-overthinker',
    name: 'Gregor the Overthinker',
    bio: 'Pauses before answering even simple questions. You can almost hear the internal calculations going wrong.',
    imageSrc: '/assets/themes/default/personas/07-gregor-the-overthinker.png',
  },
  {
    id: 'default-pixie-two-buns',
    name: 'Pixie Two-Buns',
    bio: "Looks sweet, acts unpredictable. Switches moods fast enough to make you question what's real.",
    imageSrc: '/assets/themes/default/personas/08-pixie-two-buns.png',
  },
  {
    id: 'default-leon-low-battery-briggs',
    name: 'Leon "Low Battery" Briggs',
    bio: "Perpetually tired but oddly alert when something interesting happens. Notices details no one else does.",
    imageSrc: '/assets/themes/default/personas/09-leon-low-battery-briggs.png',
  },
  {
    id: 'default-zara-glance-back',
    name: 'Zara Glance-Back',
    bio: "Always looking over her shoulder mid-conversation. Says it's a habit, but it feels more like caution.",
    imageSrc: '/assets/themes/default/personas/10-zara-glance-back.png',
  },
  {
    id: 'default-big-dave-probably-fine',
    name: 'Big Dave "Probably Fine"',
    bio: "Built like a tank, speaks like he's hiding something. Laughs off serious questions a bit too quickly.",
    imageSrc: '/assets/themes/default/personas/11-big-dave-probably-fine.png',
  },
  {
    id: 'default-penny-specs',
    name: 'Penny Specs',
    bio: "Quiet and observant behind oversized glasses. Knows things she shouldn't but never explains how.",
    imageSrc: '/assets/themes/default/personas/12-penny-specs.png',
  },
  {
    id: 'default-ollie-headphones',
    name: 'Ollie Headphones',
    bio: "Rarely takes them off, even when nothing's playing. Pretends not to hear things that matter.",
    imageSrc: '/assets/themes/default/personas/13-ollie-headphones.png',
  },
  {
    id: 'default-chloe-pink-fur',
    name: 'Chloe Pink-Fur',
    bio: "Always dressed like she's going somewhere important. Smiles sweetly while clearly judging everyone.",
    imageSrc: '/assets/themes/default/personas/14-chloe-pink-fur.png',
  },
  {
    id: 'default-malik-stoneface',
    name: 'Malik Stoneface',
    bio: "Keeps a straight expression no matter what's happening. You never know if he's calm or calculating.",
    imageSrc: '/assets/themes/default/personas/15-malik-stoneface.png',
  },
  {
    id: 'default-rachel-seen-it-all',
    name: 'Rachel "Seen It All"',
    bio: "Gives knowing looks at everything. Reacts like she's watched this exact situation play out before.",
    imageSrc: '/assets/themes/default/personas/16-rachel-seen-it-all.png',
  },
  {
    id: 'default-ronan-grumble',
    name: 'Ronan Grumble',
    bio: "Always muttering under his breath. Denies it every time you ask what he said.",
    imageSrc: '/assets/themes/default/personas/17-ronan-grumble.png',
  },
  {
    id: 'default-jett-greenhair',
    name: 'Jett Greenhair',
    bio: 'Bold look, sharper attitude. Says exactly what she thinks - except when it matters.',
    imageSrc: '/assets/themes/default/personas/18-jett-greenhair.png',
  },
  {
    id: 'default-colin-just-curious',
    name: 'Colin "Just Curious"',
    bio: "Asks a lot of questions... too many. Plays it off as interest, but it feels investigative.",
    imageSrc: '/assets/themes/default/personas/19-colin-just-curious.png',
  },
  {
    id: 'default-amy-side-whisper',
    name: 'Amy Side-Whisper',
    bio: "Leans in close when talking, even when she doesn't need to. Makes everything sound like a secret.",
    imageSrc: '/assets/themes/default/personas/20-amy-side-whisper.png',
  },
  {
    id: 'default-yusuf-watchful',
    name: 'Yusuf Watchful',
    bio: 'Tracks every movement in the room without turning his head. Claims it is just "people watching."',
    imageSrc: '/assets/themes/default/personas/21-yusuf-watchful.png',
  },
  {
    id: 'default-ingrid-precision',
    name: 'Ingrid Precision',
    bio: "Neat, controlled, and exact in everything. Gets uncomfortable when things don't go as planned.",
    imageSrc: '/assets/themes/default/personas/22-ingrid-precision.png',
  },
  {
    id: 'default-kyle-backwards-cap',
    name: 'Kyle Backwards Cap',
    bio: 'Acts laid-back, but reacts fast to anything suspicious. Knows shortcuts no one taught him.',
    imageSrc: '/assets/themes/default/personas/23-kyle-backwards-cap.png',
  },
  {
    id: 'default-bianca-red-blazer',
    name: 'Bianca Red Blazer',
    bio: 'Confident and composed, always in control of the conversation. Somehow steers things away from herself.',
    imageSrc: '/assets/themes/default/personas/24-bianca-red-blazer.png',
  },
  {
    id: 'default-arthur-old-tricks-bennett',
    name: 'Arthur "Old Tricks" Bennett',
    bio: "Seems harmless, but his eyes say otherwise. Has that unsettling vibe of someone who's done this before.",
    imageSrc: '/assets/themes/default/personas/25-arthur-old-tricks-bennett.png',
  },
];

const MURDER_MYSTERY_THEME_PERSONAS = [
  {
    id: 'murder-agatha-primrose',
    name: 'Agatha Primrose',
    bio: 'A sharp-tongued elderly widow who notices everything and forgets nothing - especially grudges.',
    imageSrc: '/assets/themes/murder-mystery/personas/01-agatha-primrose.png',
  },
  {
    id: 'murder-reginald-crowhurst',
    name: 'Reginald Crowhurst',
    bio: 'A well-dressed gentleman with a perfect moustache and an alibi that feels rehearsed.',
    imageSrc: '/assets/themes/murder-mystery/personas/02-reginald-crowhurst.png',
  },
  {
    id: 'murder-lillian-devereaux',
    name: 'Lillian Devereaux',
    bio: 'A glamorous socialite who always seems to be watching people instead of talking to them.',
    imageSrc: '/assets/themes/murder-mystery/personas/03-lillian-devereaux.png',
  },
  {
    id: 'murder-arthur-bellamy',
    name: 'Arthur Bellamy',
    bio: 'A retired colonel with a temper barely held together beneath rigid politeness.',
    imageSrc: '/assets/themes/murder-mystery/personas/04-arthur-bellamy.png',
  },
  {
    id: 'murder-edith-pritchard',
    name: 'Edith Pritchard',
    bio: 'A stern housekeeper who knows every secret in the house - and who came and went.',
    imageSrc: '/assets/themes/murder-mystery/personas/05-edith-pritchard.png',
  },
  {
    id: 'murder-father-benedict-hale',
    name: 'Father Benedict Hale',
    bio: 'A nervous clergyman who avoids eye contact and clutches his collar when questioned.',
    imageSrc: '/assets/themes/murder-mystery/personas/06-father-benedict-hale.png',
  },
  {
    id: 'murder-margaret-whitlock',
    name: 'Margaret Whitlock',
    bio: 'A pearl-draped widow who insists she "heard nothing," despite being closest to the scene.',
    imageSrc: '/assets/themes/murder-mystery/personas/07-margaret-whitlock.png',
  },
  {
    id: 'murder-thomas-finch',
    name: 'Thomas Finch',
    bio: 'A jittery young man whose story changes slightly each time he tells it.',
    imageSrc: '/assets/themes/murder-mystery/personas/08-thomas-finch.png',
  },
  {
    id: 'murder-vivian-blackwood',
    name: 'Vivian Blackwood',
    bio: 'Elegant and cold, she smiles often - but never with her eyes.',
    imageSrc: '/assets/themes/murder-mystery/personas/09-vivian-blackwood.png',
  },
  {
    id: 'murder-harold-sykes',
    name: 'Harold Sykes',
    bio: "A balding accountant type who seems far too interested in everyone's finances.",
    imageSrc: '/assets/themes/murder-mystery/personas/10-harold-sykes.png',
  },
  {
    id: 'murder-clara-winslow',
    name: 'Clara Winslow',
    bio: 'A quiet librarian whose knowledge of poisons is... surprisingly extensive.',
    imageSrc: '/assets/themes/murder-mystery/personas/11-clara-winslow.png',
  },
  {
    id: 'murder-bernard-griggs',
    name: 'Bernard Griggs',
    bio: 'A gruff old man with stained hands and a habit of muttering under his breath.',
    imageSrc: '/assets/themes/murder-mystery/personas/12-bernard-griggs.png',
  },
  {
    id: 'murder-mabel-thorne',
    name: 'Mabel Thorne',
    bio: "Cheerful on the surface, but with a knowing smirk that suggests she's enjoying the chaos.",
    imageSrc: '/assets/themes/murder-mystery/personas/13-mabel-thorne.png',
  },
  {
    id: 'murder-inspector-doyle',
    name: 'Inspector Doyle',
    bio: 'A trench-coated investigator who may be hiding more than he is revealing.',
    imageSrc: '/assets/themes/murder-mystery/personas/14-inspector-doyle.png',
  },
  {
    id: 'murder-beatrice-holloway',
    name: 'Beatrice Holloway',
    bio: 'A fur-clad aristocrat who seems offended by the mere suggestion of suspicion.',
    imageSrc: '/assets/themes/murder-mystery/personas/15-beatrice-holloway.png',
  },
  {
    id: 'murder-cedric-vale',
    name: 'Cedric Vale',
    bio: "A nervous aristocrat constantly adjusting his collar like it's tightening around his neck.",
    imageSrc: '/assets/themes/murder-mystery/personas/16-cedric-vale.png',
  },
  {
    id: 'murder-nora-pritchard',
    name: 'Nora Pritchard',
    bio: 'A maid who claims loyalty but listens far more than she speaks.',
    imageSrc: '/assets/themes/murder-mystery/personas/17-nora-pritchard.png',
  },
  {
    id: 'murder-douglas-harker',
    name: 'Douglas Harker',
    bio: 'A stern businessman with a short fuse and a very long list of enemies.',
    imageSrc: '/assets/themes/murder-mystery/personas/18-douglas-harker.png',
  },
  {
    id: 'murder-winifred-dalloway',
    name: 'Winifred Dalloway',
    bio: 'An observant old lady with sharp eyes behind round spectacles - nothing escapes her.',
    imageSrc: '/assets/themes/murder-mystery/personas/19-winifred-dalloway.png',
  },
  {
    id: 'murder-leonard-graves',
    name: 'Leonard Graves',
    bio: 'A slick, charming man whose politeness feels like a performance.',
    imageSrc: '/assets/themes/murder-mystery/personas/20-leonard-graves.png',
  },
  {
    id: 'murder-evelyn-marlowe',
    name: 'Evelyn Marlowe',
    bio: 'A refined woman who seems calm... perhaps too calm given the circumstances.',
    imageSrc: '/assets/themes/murder-mystery/personas/21-evelyn-marlowe.png',
  },
  {
    id: 'murder-victor-kane',
    name: 'Victor Kane',
    bio: 'A large, imposing figure with a scowl - and something to hide in his past.',
    imageSrc: '/assets/themes/murder-mystery/personas/22-victor-kane.png',
  },
  {
    id: 'murder-helena-voss',
    name: 'Helena Voss',
    bio: 'A poised and calculating woman who studies people like puzzles.',
    imageSrc: '/assets/themes/murder-mystery/personas/23-helena-voss.png',
  },
  {
    id: 'murder-captain-rupert-shaw',
    name: 'Captain Rupert Shaw',
    bio: 'A decorated officer whose rigid posture hides clear discomfort.',
    imageSrc: '/assets/themes/murder-mystery/personas/24-captain-rupert-shaw.png',
  },
  {
    id: 'murder-mildred-finchley',
    name: 'Mildred Finchley',
    bio: "An elderly gossip who knows everyone's business - and enjoys spreading it just enough.",
    imageSrc: '/assets/themes/murder-mystery/personas/25-mildred-finchley.png',
  },
];

const COPS_AND_ROBBERS_THEME_PERSONAS = [
  {
    id: 'cops-sergeant-brickjaw',
    name: 'Sergeant Brickjaw',
    bio: "Thick-necked veteran cop with a permanent scowl; stares like he's already decided you're guilty.",
    imageSrc: '/assets/themes/cops-and-robbers/personas/01-sergeant-brickjaw.png',
  },
  {
    id: 'cops-whisper-kev',
    name: 'Whisper Kev',
    bio: 'Hoodie-clad street lurker who barely speaks, but always seems to know what is going on.',
    imageSrc: '/assets/themes/cops-and-robbers/personas/02-whisper-kev.png',
  },
  {
    id: 'cops-pc-bubblegum-harris',
    name: 'PC Bubblegum Harris',
    bio: 'Sharp-eyed officer blowing gum bubbles while silently judging everyone in the room.',
    imageSrc: '/assets/themes/cops-and-robbers/personas/03-pc-bubblegum-harris.png',
  },
  {
    id: 'cops-redline-ricky',
    name: 'Redline Ricky',
    bio: "Wild-haired adrenaline junkie who looks like he's one bad idea away from running.",
    imageSrc: '/assets/themes/cops-and-robbers/personas/04-redline-ricky.png',
  },
  {
    id: 'cops-old-man-latchford',
    name: 'Old Man Latchford',
    bio: 'Gruff pensioner who claims innocence but always appears suspiciously nearby.',
    imageSrc: '/assets/themes/cops-and-robbers/personas/05-old-man-latchford.png',
  },
  {
    id: 'cops-detective-crowe',
    name: 'Detective Crowe',
    bio: 'Sleep-deprived investigator with piercing eyes and a mind that never switches off.',
    imageSrc: '/assets/themes/cops-and-robbers/personas/06-detective-crowe.png',
  },
  {
    id: 'cops-nosey-nadine',
    name: 'Nosey Nadine',
    bio: 'Over-observant civilian who inserts herself into everything and remembers too much.',
    imageSrc: '/assets/themes/cops-and-robbers/personas/07-nosey-nadine.png',
  },
  {
    id: 'cops-two-coat-tony',
    name: 'Two-Coat Tony',
    bio: 'Always layered up - no one knows what he is hiding underneath.',
    imageSrc: '/assets/themes/cops-and-robbers/personas/08-two-coat-tony.png',
  },
  {
    id: 'cops-pc-dullahan',
    name: 'PC Dullahan',
    bio: 'Emotionless officer with a blank stare that unsettles even fellow cops.',
    imageSrc: '/assets/themes/cops-and-robbers/personas/09-pc-dullahan.png',
  },
  {
    id: 'cops-grease-mick',
    name: 'Grease Mick',
    bio: 'Slick-backed charmer who smiles through lies and sweats under pressure.',
    imageSrc: '/assets/themes/cops-and-robbers/personas/10-grease-mick.png',
  },
  {
    id: 'cops-inspector-vale',
    name: 'Inspector Vale',
    bio: 'Calm, calculated leader who controls the room without raising her voice.',
    imageSrc: '/assets/themes/cops-and-robbers/personas/11-inspector-vale.png',
  },
  {
    id: 'cops-skint-davey',
    name: 'Skint Davey',
    bio: 'Nervy bloke who always looks broke but somehow never is.',
    imageSrc: '/assets/themes/cops-and-robbers/personas/12-skint-davey.png',
  },
  {
    id: 'cops-bucket-hat-lenny',
    name: 'Bucket Hat Lenny',
    bio: 'Avoids eye contact like a pro - clearly hiding something.',
    imageSrc: '/assets/themes/cops-and-robbers/personas/13-bucket-hat-lenny.png',
  },
  {
    id: 'cops-pc-rigs',
    name: 'PC Rigs',
    bio: 'Built like a unit but cracks under the smallest bit of pressure.',
    imageSrc: '/assets/themes/cops-and-robbers/personas/14-pc-rigs.png',
  },
  {
    id: 'cops-ciggy-claire',
    name: 'Ciggy Claire',
    bio: 'Permanently irritated, cigarette dangling, watching everything unfold.',
    imageSrc: '/assets/themes/cops-and-robbers/personas/15-ciggy-claire.png',
  },
  {
    id: 'cops-silent-omar',
    name: 'Silent Omar',
    bio: 'Speaks rarely, observes constantly, disappears quickly when needed.',
    imageSrc: '/assets/themes/cops-and-robbers/personas/16-silent-omar.png',
  },
  {
    id: 'cops-detective-bloom',
    name: 'Detective Bloom',
    bio: 'Friendly on the surface but mentally ticking off inconsistencies.',
    imageSrc: '/assets/themes/cops-and-robbers/personas/17-detective-bloom.png',
  },
  {
    id: 'cops-panic-pete',
    name: 'Panic Pete',
    bio: "Sweaty, jittery, looks guilty even when he's not.",
    imageSrc: '/assets/themes/cops-and-robbers/personas/18-panic-pete.png',
  },
  {
    id: 'cops-mumsy-carol',
    name: 'Mumsy Carol',
    bio: "Sweet, chatty, and somehow knows everyone's business.",
    imageSrc: '/assets/themes/cops-and-robbers/personas/19-mumsy-carol.png',
  },
  {
    id: 'cops-flatcap-ronnie',
    name: 'Flatcap Ronnie',
    bio: 'Old-school geezer who denies everything before you even ask.',
    imageSrc: '/assets/themes/cops-and-robbers/personas/20-flatcap-ronnie.png',
  },
  {
    id: 'cops-pc-glitch',
    name: 'PC Glitch',
    bio: 'Young officer who freezes mid-thought like his brain lagged out.',
    imageSrc: '/assets/themes/cops-and-robbers/personas/21-pc-glitch.png',
  },
  {
    id: 'cops-shifty-ellis',
    name: 'Shifty Ellis',
    bio: "Never stands still, always angled like he's ready to bolt.",
    imageSrc: '/assets/themes/cops-and-robbers/personas/22-shifty-ellis.png',
  },
  {
    id: 'cops-lipbite-laura',
    name: 'Lipbite Laura',
    bio: 'Constantly biting her lip while thinking - usually mid-lie.',
    imageSrc: '/assets/themes/cops-and-robbers/personas/23-lipbite-laura.png',
  },
  {
    id: 'cops-sniffer-dan',
    name: 'Sniffer Dan',
    bio: 'Always twitching and sniffing like he is tracking something... or hiding nerves.',
    imageSrc: '/assets/themes/cops-and-robbers/personas/24-sniffer-dan.png',
  },
  {
    id: 'cops-captain-holloway',
    name: 'Captain Holloway',
    bio: 'Senior officer with a calm smile that feels just a bit too controlled.',
    imageSrc: '/assets/themes/cops-and-robbers/personas/25-captain-holloway.png',
  },
];

const THEME_PERSONA_POOLS = {
  Default: DEFAULT_THEME_PERSONAS,
  'Murder Mystery': MURDER_MYSTERY_THEME_PERSONAS,
  'Cops and Robbers': COPS_AND_ROBBERS_THEME_PERSONAS,
  Gangsters: COPS_AND_ROBBERS_THEME_PERSONAS,
  Spies: COPS_AND_ROBBERS_THEME_PERSONAS,
  Cowboys: COPS_AND_ROBBERS_THEME_PERSONAS,
};

export function getThemePersonas(themeName = 'Default') {
  const canonicalThemeName = toCanonicalThemeName(themeName);
  if (Array.isArray(THEME_PERSONA_POOLS[themeName])) return THEME_PERSONA_POOLS[themeName];
  if (Array.isArray(THEME_PERSONA_POOLS[canonicalThemeName])) return THEME_PERSONA_POOLS[canonicalThemeName];
  return [];
}

export function pickRandomThemePersona(themeName = 'Default', excludeNames = []) {
  const pool = getThemePersonas(themeName);
  if (!pool.length) return null;
  const blockedNames = new Set(
    (excludeNames || [])
      .map((name) => String(name || '').trim().toLowerCase())
      .filter(Boolean)
  );
  const filtered = pool.filter((persona) => !blockedNames.has(persona.name.toLowerCase()));
  const selectionPool = filtered.length ? filtered : pool;
  return selectionPool[Math.floor(Math.random() * selectionPool.length)] || pool[0] || null;
}
