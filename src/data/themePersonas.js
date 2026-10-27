import { toCanonicalThemeName } from './themeAliases.js';
import { NAME_POOLS } from './names.js';
import { ALL_THEME_NAMES } from './themeCatalog.js';
import { DLC_CURATED_THEME_PERSONA_POOLS } from './dlcCuratedPersonas.js';

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

const DEFAULT_THEME_PERSONAS_ADDITIONAL = [
  {
    id: 'default-harper-highlighter-jones',
    name: 'Harper "Highlighter" Jones',
    bio: 'Marks up every detail in bright colors and still insists she missed nothing important.',
    imageSrc: '/assets/themes/default/personas/26-harper-highlighter-jones.png',
  },
  {
    id: 'default-rio-last-minute-lane',
    name: 'Rio Last-Minute Lane',
    bio: 'Always unprepared until suddenly overprepared. Keeps changing plans mid-sentence.',
    imageSrc: '/assets/themes/default/personas/27-rio-last-minute-lane.png',
  },
  {
    id: 'default-sadie-sticker-book',
    name: 'Sadie Sticker Book',
    bio: 'Looks cheerful and harmless, but her reactions are suspiciously timed.',
    imageSrc: '/assets/themes/default/personas/28-sadie-sticker-book.png',
  },
  {
    id: 'default-nico-soft-launch',
    name: 'Nico Soft Launch',
    bio: 'Drops tiny hints like breadcrumbs, then pretends he never said anything.',
    imageSrc: '/assets/themes/default/personas/29-nico-soft-launch.png',
  },
  {
    id: 'default-cleo-checkmate',
    name: 'Cleo Checkmate',
    bio: 'Talks like every sentence is a strategy move and every silence is a trap.',
    imageSrc: '/assets/themes/default/personas/30-cleo-checkmate.png',
  },
  {
    id: 'default-marco-half-truths-miles',
    name: 'Marco "Half Truths" Miles',
    bio: 'Technically honest, emotionally evasive, and definitely too comfortable with loopholes.',
    imageSrc: '/assets/themes/default/personas/31-marco-half-truths-miles.png',
  },
  {
    id: 'default-lena-late-reply',
    name: 'Lena Late Reply',
    bio: 'Always takes a beat too long to answer, like she is editing in real time.',
    imageSrc: '/assets/themes/default/personas/32-lena-late-reply.png',
  },
  {
    id: 'default-oscar-overfriendly',
    name: 'Oscar Overfriendly',
    bio: 'Greets everyone like best mates while quietly steering every conversation.',
    imageSrc: '/assets/themes/default/personas/33-oscar-overfriendly.png',
  },
  {
    id: 'default-priya-plot-twist',
    name: 'Priya Plot Twist',
    bio: 'Calm until challenged, then suddenly reveals details no one asked for.',
    imageSrc: '/assets/themes/default/personas/34-priya-plot-twist.png',
  },
  {
    id: 'default-dex-pocket-alibi',
    name: 'Dex Pocket Alibi',
    bio: 'Carries backup excuses for everything and reaches for one instantly.',
    imageSrc: '/assets/themes/default/personas/35-dex-pocket-alibi.png',
  },
  {
    id: 'default-naomi-soft-smirk',
    name: 'Naomi Soft Smirk',
    bio: 'Looks amused by the chaos, especially when she is likely causing it.',
    imageSrc: '/assets/themes/default/personas/36-naomi-soft-smirk.png',
  },
  {
    id: 'default-jules-crossed-wires',
    name: 'Jules Crossed Wires',
    bio: 'Gets details mixed up but somehow lands exactly where suspicion is lowest.',
    imageSrc: '/assets/themes/default/personas/37-jules-crossed-wires.png',
  },
  {
    id: 'default-freddie-fast-talk',
    name: 'Freddie Fast Talk',
    bio: 'Speaks quickly, changes topics faster, and leaves everyone slightly confused.',
    imageSrc: '/assets/themes/default/personas/38-freddie-fast-talk.png',
  },
  {
    id: 'default-carmen-cold-read',
    name: 'Carmen Cold Read',
    bio: 'Reads the room in seconds and adjusts her tone like a pro.',
    imageSrc: '/assets/themes/default/personas/39-carmen-cold-read.png',
  },
  {
    id: 'default-owen-too-specific',
    name: 'Owen Too Specific',
    bio: 'Adds oddly precise details to stories that should be simple.',
    imageSrc: '/assets/themes/default/personas/40-owen-too-specific.png',
  },
  {
    id: 'default-mia-never-rattled',
    name: 'Mia Never Rattled',
    bio: 'Keeps perfect composure even when everything around her goes sideways.',
    imageSrc: '/assets/themes/default/personas/41-mia-never-rattled.png',
  },
  {
    id: 'default-ezra-signal-noise',
    name: 'Ezra Signal Noise',
    bio: 'Floods conversations with side details to hide the one thing that matters.',
    imageSrc: '/assets/themes/default/personas/42-ezra-signal-noise.png',
  },
  {
    id: 'default-ivy-double-booked',
    name: 'Ivy Double Booked',
    bio: 'Always in a hurry, always somewhere else, somehow always nearby when drama starts.',
    imageSrc: '/assets/themes/default/personas/43-ivy-double-booked.png',
  },
  {
    id: 'default-rhett-side-bet',
    name: 'Rhett Side Bet',
    bio: 'Treats every round like a gamble and acts surprised when called out.',
    imageSrc: '/assets/themes/default/personas/44-rhett-side-bet.png',
  },
  {
    id: 'default-kira-curated-chaos',
    name: 'Kira Curated Chaos',
    bio: 'Looks polished, sounds polished, and leaves messy uncertainty behind.',
    imageSrc: '/assets/themes/default/personas/45-kira-curated-chaos.png',
  },
  {
    id: 'default-paul-no-comment',
    name: 'Paul "No Comment"',
    bio: 'Dodges direct questions with charming nonsense and a shrug.',
    imageSrc: '/assets/themes/default/personas/46-paul-no-comment.png',
  },
  {
    id: 'default-zoe-bounce-back',
    name: 'Zoe Bounce Back',
    bio: 'Recovers from bad answers instantly, like she rehearsed the recovery line.',
    imageSrc: '/assets/themes/default/personas/47-zoe-bounce-back.png',
  },
  {
    id: 'default-gabe-quiet-volume',
    name: 'Gabe Quiet Volume',
    bio: 'Speaks softly but somehow takes over the whole room.',
    imageSrc: '/assets/themes/default/personas/48-gabe-quiet-volume.png',
  },
  {
    id: 'default-tori-misdirect',
    name: 'Tori Misdirect',
    bio: 'Answers one question by creating three new ones.',
    imageSrc: '/assets/themes/default/personas/49-tori-misdirect.png',
  },
  {
    id: 'default-vincent-final-draft',
    name: 'Vincent Final Draft',
    bio: 'Edits his story every time he repeats it and calls that "clarity."',
    imageSrc: '/assets/themes/default/personas/50-vincent-final-draft.png',
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

const GHOSTS_AND_GHOULS_THEME_PERSONAS = [
  {
    id: 'ghost-count-smoulder',
    name: 'Count Smoulder',
    bio: "Charming vampire with a crooked grin; watches everyone like he's picking his next meal.",
    imageSrc: '/assets/themes/ghosts-and-ghouls/personas/01-count-smoulder.png',
  },
  {
    id: 'ghost-rotgut-eddie',
    name: 'Rotgut Eddie',
    bio: 'Decaying undead bloke who looks confused but somehow always ends up where trouble is.',
    imageSrc: '/assets/themes/ghosts-and-ghouls/personas/02-rotgut-eddie.png',
  },
  {
    id: 'ghost-bride-static',
    name: 'Bride Static',
    bio: "Silent, pale bride with a twitch in her eye; stares like she remembers something she shouldn't.",
    imageSrc: '/assets/themes/ghosts-and-ghouls/personas/03-bride-static.png',
  },
  {
    id: 'ghost-frank-two-bolts-malone',
    name: 'Frank "Two-Bolts" Malone',
    bio: "Gruff stitched-up brute who seems slow... until he suddenly isn't.",
    imageSrc: '/assets/themes/ghosts-and-ghouls/personas/04-frank-two-bolts-malone.png',
  },
  {
    id: 'ghost-hollow-annie',
    name: 'Hollow Annie',
    bio: 'Emotionless girl with dead eyes who never reacts at the right time.',
    imageSrc: '/assets/themes/ghosts-and-ghouls/personas/05-hollow-annie.png',
  },
  {
    id: 'ghost-fangridge-barry',
    name: 'Fangridge Barry',
    bio: "Hairy, tense werewolf who looks one bad moment away from losing control.",
    imageSrc: '/assets/themes/ghosts-and-ghouls/personas/06-fangridge-barry.png',
  },
  {
    id: 'ghost-medusa-mel',
    name: 'Medusa Mel',
    bio: 'Cool-headed but unsettling; avoids eye contact like she knows what happens if she does not.',
    imageSrc: '/assets/themes/ghosts-and-ghouls/personas/07-medusa-mel.png',
  },
  {
    id: 'ghost-nosfer-stu',
    name: 'Nosfer Stu',
    bio: 'Gaunt, twitchy vampire who lingers too long in conversations.',
    imageSrc: '/assets/themes/ghosts-and-ghouls/personas/08-nosfer-stu.png',
  },
  {
    id: 'ghost-wailer-beth',
    name: 'Wailer Beth',
    bio: "Mouth slightly open like she's about to scream - people tend to leave before she does.",
    imageSrc: '/assets/themes/ghosts-and-ghouls/personas/09-wailer-beth.png',
  },
  {
    id: 'ghost-dr-plagueworth',
    name: 'Dr. Plagueworth',
    bio: 'Masked figure who tilts his head too much, like he is studying you.',
    imageSrc: '/assets/themes/ghosts-and-ghouls/personas/10-dr-plagueworth.png',
  },
  {
    id: 'ghost-dusty-bones',
    name: 'Dusty Bones',
    bio: 'Half-rotted skeleton who somehow still looks nervous about being caught.',
    imageSrc: '/assets/themes/ghosts-and-ghouls/personas/11-dusty-bones.png',
  },
  {
    id: 'ghost-lady-mourne',
    name: 'Lady Mourne',
    bio: 'Elegant but cold; smiles politely while clearly judging everyone.',
    imageSrc: '/assets/themes/ghosts-and-ghouls/personas/12-lady-mourne.png',
  },
  {
    id: 'ghost-grinlock',
    name: 'Grinlock',
    bio: 'Horned trickster with a smirk that screams bad intentions.',
    imageSrc: '/assets/themes/ghosts-and-ghouls/personas/13-grinlock.png',
  },
  {
    id: 'ghost-stringhair-sadie',
    name: 'Stringhair Sadie',
    bio: 'Long-haired ghost who barely moves - except when you stop looking.',
    imageSrc: '/assets/themes/ghosts-and-ghouls/personas/14-stringhair-sadie.png',
  },
  {
    id: 'ghost-crookback-hilda',
    name: 'Crookback Hilda',
    bio: 'Old witch muttering to herself... and sometimes answering back.',
    imageSrc: '/assets/themes/ghosts-and-ghouls/personas/15-crookback-hilda.png',
  },
  {
    id: 'ghost-topper-graves',
    name: 'Topper Graves',
    bio: 'Dapper skeleton in a top hat who acts like he owns the place.',
    imageSrc: '/assets/themes/ghosts-and-ghouls/personas/16-topper-graves.png',
  },
  {
    id: 'ghost-pale-prince-alaric',
    name: 'Pale Prince Alaric',
    bio: 'Aristocratic vampire with a superiority complex and a dangerous calm.',
    imageSrc: '/assets/themes/ghosts-and-ghouls/personas/17-pale-prince-alaric.png',
  },
  {
    id: 'ghost-undertaker-voss',
    name: 'Undertaker Voss',
    bio: "Quiet, brooding man who looks like he's already measured everyone.",
    imageSrc: '/assets/themes/ghosts-and-ghouls/personas/18-undertaker-voss.png',
  },
  {
    id: 'ghost-jester-grin',
    name: 'Jester Grin',
    bio: 'Creepy clown with a fixed smile that never quite matches his eyes.',
    imageSrc: '/assets/themes/ghosts-and-ghouls/personas/19-jester-grin.png',
  },
  {
    id: 'ghost-father-hollow',
    name: 'Father Hollow',
    bio: 'Stern priest whose stare feels more like judgment than comfort.',
    imageSrc: '/assets/themes/ghosts-and-ghouls/personas/20-father-hollow.png',
  },
  {
    id: 'ghost-misty-floe',
    name: 'Misty Floe',
    bio: 'Soft, drifting ghost who seems harmless... until she is suddenly right behind you.',
    imageSrc: '/assets/themes/ghosts-and-ghouls/personas/21-misty-floe.png',
  },
  {
    id: 'ghost-dolly-knots',
    name: 'Dolly Knots',
    bio: 'Childlike ghoul with stitched features and unpredictable reactions.',
    imageSrc: '/assets/themes/ghosts-and-ghouls/personas/22-dolly-knots.png',
  },
  {
    id: 'ghost-void-walker',
    name: 'Void Walker',
    bio: 'Hooded figure with glowing eyes; impossible to read, impossible to trust.',
    imageSrc: '/assets/themes/ghosts-and-ghouls/personas/23-void-walker.png',
  },
  {
    id: 'ghost-velvet-fang',
    name: 'Velvet Fang',
    bio: 'Seductive vampire who leans in too close and asks too many questions.',
    imageSrc: '/assets/themes/ghosts-and-ghouls/personas/24-velvet-fang.png',
  },
  {
    id: 'ghost-bogrot-bill',
    name: 'Bogrot Bill',
    bio: 'Sludgy swamp creature who smells like trouble and watches everything.',
    imageSrc: '/assets/themes/ghosts-and-ghouls/personas/25-bogrot-bill.png',
  },
];

const PIRATES_THEME_PERSONAS = [
  {
    id: 'pirates-captain-grizzlehook',
    name: 'Captain Grizzlehook',
    bio: "A scarred veteran with a permanent scowl. Always watching others' hands like he expects theft - probably because he has already done it.",
    imageSrc: '/assets/themes/pirates/personas/01-captain-grizzlehook.png',
  },
  {
    id: 'pirates-coral-red-tide-maeve',
    name: 'Coral "Red Tide" Maeve',
    bio: 'Sharp-eyed and fiery, she chews on grudges like tobacco. Known to disappear right before things go missing.',
    imageSrc: '/assets/themes/pirates/personas/02-coral-red-tide-maeve.png',
  },
  {
    id: 'pirates-scurvy-len',
    name: 'Scurvy Len',
    bio: 'Half-mad and twitchy, always scratching his neck. Claims he hears whispers from the sea telling him secrets.',
    imageSrc: '/assets/themes/pirates/personas/03-scurvy-len.png',
  },
  {
    id: 'pirates-dreadlock-nyx',
    name: 'Dreadlock Nyx',
    bio: 'Cool, composed, and unreadable. Keeps her distance - rumour is she switches allegiances when it suits her.',
    imageSrc: '/assets/themes/pirates/personas/04-dreadlock-nyx.png',
  },
  {
    id: 'pirates-barnacle-bill',
    name: 'Barnacle Bill',
    bio: 'Skin like old rope and eyes that do not blink enough. Smells like the ocean - and possibly death.',
    imageSrc: '/assets/themes/pirates/personas/05-barnacle-bill.png',
  },
  {
    id: 'pirates-old-salt-garrick',
    name: 'Old Salt Garrick',
    bio: 'Blind in one eye but sees more than he should. Keeps muttering about "patterns" in people.',
    imageSrc: '/assets/themes/pirates/personas/06-old-salt-garrick.png',
  },
  {
    id: 'pirates-biscuit-tom',
    name: 'Biscuit Tom',
    bio: 'Wide-eyed and nervous, always sweating. Laughs at the wrong moments - definitely hiding something.',
    imageSrc: '/assets/themes/pirates/personas/07-biscuit-tom.png',
  },
  {
    id: 'pirates-blackfeather-vex',
    name: 'Blackfeather Vex',
    bio: 'Elegant and dangerous, never raises her voice. The kind who poisons you politely.',
    imageSrc: '/assets/themes/pirates/personas/08-blackfeather-vex.png',
  },
  {
    id: 'pirates-hooknose-redd',
    name: 'Hooknose Redd',
    bio: 'Crooked grin, sharper instincts. Known for selling out crewmates before they can sell him.',
    imageSrc: '/assets/themes/pirates/personas/09-hooknose-redd.png',
  },
  {
    id: 'pirates-mad-coil-jenkins',
    name: 'Mad Coil Jenkins',
    bio: 'Hair like a storm and thoughts just as wild. Claims genius, but nobody trusts his inventions - or his stories.',
    imageSrc: '/assets/themes/pirates/personas/10-mad-coil-jenkins.png',
  },
  {
    id: 'pirates-silent-fang-lin',
    name: 'Silent Fang Lin',
    bio: "Speaks little, watches everything. Her stillness feels deliberate - like she is waiting for a signal.",
    imageSrc: '/assets/themes/pirates/personas/11-silent-fang-lin.png',
  },
  {
    id: 'pirates-ironjaw-burke',
    name: 'Ironjaw Burke',
    bio: 'Thick-necked and permanently annoyed. Breaks things first, asks questions never.',
    imageSrc: '/assets/themes/pirates/personas/12-ironjaw-burke.png',
  },
  {
    id: 'pirates-mirelurk-lira',
    name: 'Mirelurk Lira',
    bio: 'A sea-touched woman with pale, eerie calm. People swear she does not breathe when she sleeps.',
    imageSrc: '/assets/themes/pirates/personas/13-mirelurk-lira.png',
  },
  {
    id: 'pirates-sultan-ash-rami',
    name: 'Sultan Ash Rami',
    bio: "Draped in finery, eyes dart constantly. Always calculating odds - usually at someone else's expense.",
    imageSrc: '/assets/themes/pirates/personas/14-sultan-ash-rami.png',
  },
  {
    id: 'pirates-frostbraid-elin',
    name: 'Frostbraid Elin',
    bio: 'Cold stare, colder tone. Loyal... but only to her own code.',
    imageSrc: '/assets/themes/pirates/personas/15-frostbraid-elin.png',
  },
  {
    id: 'pirates-knuckles-dreg',
    name: 'Knuckles Dreg',
    bio: 'Scarred and twitchy, always ready to throw a punch. Suspicious of everyone - even himself.',
    imageSrc: '/assets/themes/pirates/personas/16-knuckles-dreg.png',
  },
  {
    id: 'pirates-granny-nettles',
    name: 'Granny Nettles',
    bio: "Sweet voice, sharp mind. Knows everyone's secrets and enjoys reminding them.",
    imageSrc: '/assets/themes/pirates/personas/17-granny-nettles.png',
  },
  {
    id: 'pirates-gullcoat-harlan',
    name: 'Gullcoat Harlan',
    bio: 'Weathered fisherman type who rarely smiles. Watches the horizon like he is expecting trouble.',
    imageSrc: '/assets/themes/pirates/personas/18-gullcoat-harlan.png',
  },
  {
    id: 'pirates-silas-the-slick',
    name: 'Silas the Slick',
    bio: 'Smooth talker with a permanent smirk. Too charming to trust.',
    imageSrc: '/assets/themes/pirates/personas/19-silas-the-slick.png',
  },
  {
    id: 'pirates-barrelgut-donny',
    name: 'Barrelgut Donny',
    bio: 'Sweaty, grumpy, and always eating. Gets defensive whenever anyone asks where he was.',
    imageSrc: '/assets/themes/pirates/personas/20-barrelgut-donny.png',
  },
  {
    id: 'pirates-reefspawn-glim',
    name: 'Reefspawn Glim',
    bio: 'Fish-eyed and unsettlingly still. Moves like he does not belong on land.',
    imageSrc: '/assets/themes/pirates/personas/21-reefspawn-glim.png',
  },
  {
    id: 'pirates-scarlet-rook',
    name: 'Scarlet Rook',
    bio: 'Hot-headed and quick to snap. Claims innocence a bit too loudly.',
    imageSrc: '/assets/themes/pirates/personas/22-scarlet-rook.png',
  },
  {
    id: 'pirates-master-kaito-grey',
    name: 'Master Kaito Grey',
    bio: 'Calm, disciplined, and distant. Keeps his emotions locked tighter than a treasure chest.',
    imageSrc: '/assets/themes/pirates/personas/23-master-kaito-grey.png',
  },
  {
    id: 'pirates-tidecaller-zuri',
    name: 'Tidecaller Zuri',
    bio: 'Confident and commanding. Seems to know more about the situation than she lets on.',
    imageSrc: '/assets/themes/pirates/personas/24-tidecaller-zuri.png',
  },
  {
    id: 'pirates-admiral-rustbane',
    name: 'Admiral Rustbane',
    bio: "Old but sharp, with authority in his voice. Feels like he is orchestrating something behind the scenes.",
    imageSrc: '/assets/themes/pirates/personas/25-admiral-rustbane.png',
  },
];

const EXTENDED_DEFAULT_THEME_PERSONAS = [
  ...DEFAULT_THEME_PERSONAS,
  ...DEFAULT_THEME_PERSONAS_ADDITIONAL,
];

const PROCEDURAL_PERSONA_BIO_TEMPLATES = [
  '{name} keeps a confident smile while clearly editing the story in real time.',
  '{name} reads the room fast and always answers a second too carefully.',
  '{name} acts relaxed, but every detail sounds rehearsed under pressure.',
  '{name} has strong {theme} energy and a suspicious talent for avoiding direct answers.',
  '{name} sounds convincing until someone asks the one follow-up question.',
  '{name} looks calm, moves deliberately, and notices far more than they admit.',
  '{name} is charming and polished, but the timing of every reaction feels intentional.',
  '{name} deflects neatly, then pivots the conversation before anyone can press further.',
];

const PROCEDURAL_PERSONA_COUNT = 25;

function toSlug(value = '') {
  return String(value || '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function ensureUnique(baseValue, seen, fallbackPrefix = 'item') {
  const base = baseValue || `${fallbackPrefix}-1`;
  if (!seen.has(base)) {
    seen.add(base);
    return base;
  }
  let suffix = 2;
  let candidate = `${base}-${suffix}`;
  while (seen.has(candidate)) {
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
  seen.add(candidate);
  return candidate;
}

function buildProceduralThemePersonas(themeName = 'Default', count = PROCEDURAL_PERSONA_COUNT) {
  const canonicalThemeName = toCanonicalThemeName(themeName);
  const sourcePool = (
    NAME_POOLS[themeName]
    || NAME_POOLS[canonicalThemeName]
    || NAME_POOLS.Default
    || []
  );
  if (!sourcePool.length) return [];

  const themeSlug = toSlug(themeName) || 'default';
  const seenIds = new Set();
  const seenFilenames = new Set();
  const personas = [];

  for (let index = 0; index < count; index += 1) {
    const name = String(sourcePool[index % sourcePool.length] || `${themeName} Persona ${index + 1}`).trim();
    const nameSlug = toSlug(name) || `persona-${index + 1}`;
    const id = ensureUnique(`${themeSlug}-${nameSlug}`, seenIds, `${themeSlug}-persona`);
    const filenameStem = ensureUnique(
      `${String(index + 1).padStart(2, '0')}-${nameSlug}`,
      seenFilenames,
      `${String(index + 1).padStart(2, '0')}-persona`
    );
    const template = PROCEDURAL_PERSONA_BIO_TEMPLATES[index % PROCEDURAL_PERSONA_BIO_TEMPLATES.length];
    const bio = template
      .replaceAll('{name}', name)
      .replaceAll('{theme}', themeName);

    personas.push({
      id,
      name,
      bio,
      imageSrc: `/assets/themes/${themeSlug}/personas/${filenameStem}.png`,
    });
  }

  return personas;
}

const CURATED_THEME_PERSONA_POOLS = {
  Default: EXTENDED_DEFAULT_THEME_PERSONAS,
  'Murder Mystery': MURDER_MYSTERY_THEME_PERSONAS,
  'Cops and Robbers': COPS_AND_ROBBERS_THEME_PERSONAS,
  'Ghosts and Ghouls': GHOSTS_AND_GHOULS_THEME_PERSONAS,
  Pirates: PIRATES_THEME_PERSONAS,
  ...DLC_CURATED_THEME_PERSONA_POOLS,
};

const ALL_KNOWN_THEME_NAMES = [
  ...new Set([
    ...ALL_THEME_NAMES,
    ...Object.keys(NAME_POOLS),
    ...Object.keys(CURATED_THEME_PERSONA_POOLS),
  ]),
];

const PROCEDURAL_THEME_PERSONA_POOLS = Object.fromEntries(
  ALL_KNOWN_THEME_NAMES
    .filter((themeName) => !Array.isArray(CURATED_THEME_PERSONA_POOLS[themeName]))
    .map((themeName) => [themeName, buildProceduralThemePersonas(themeName)])
);

const THEME_PERSONA_POOLS = {
  ...CURATED_THEME_PERSONA_POOLS,
  ...PROCEDURAL_THEME_PERSONA_POOLS,
  Victorian: MURDER_MYSTERY_THEME_PERSONAS,
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
  const filtered = pool.filter(
    (persona) => !blockedNames.has(String(persona.name || '').toLowerCase()),
  );
  if (!filtered.length) return null;
  return (
    filtered[Math.floor(Math.random() * filtered.length)] || filtered[0] || null
  );
}
