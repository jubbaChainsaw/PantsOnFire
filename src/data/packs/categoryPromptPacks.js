import { SportsPromptRoundData } from './sports/promptRoundData';
import { FoodPromptRoundData } from './food/promptRoundData';
import { MoviesPromptRoundData } from './movies/promptRoundData';
import { MusicPromptRoundData } from './music/promptRoundData';
import { PlacesPromptRoundData } from './places/promptRoundData';
import { GamesPromptRoundData } from './games/promptRoundData';
import { AnimalsPromptRoundData } from './animals/promptRoundData';
import { WeirdPromptRoundData } from './weird/promptRoundData';
import { JobsPromptRoundData } from './jobs/promptRoundData';
import { CelebritiesPromptRoundData } from './celebrities/promptRoundData';
import { TechPromptRoundData } from './tech/promptRoundData';
import { TvPromptRoundData } from './tv/promptRoundData';
import { HobbiesPromptRoundData } from './hobbies/promptRoundData';
import { BrandsPromptRoundData } from './brands/promptRoundData';
import { SciencePromptRoundData } from './science/promptRoundData';
import { PartyPromptRoundData } from './party/promptRoundData';
import { AnimePromptRoundData } from './anime/promptRoundData';
import { CartoonsPromptRoundData } from './cartoons/promptRoundData';
import { ComicBooksMangaPromptRoundData } from './comic-books-manga/promptRoundData';
import { HistoricalFiguresPromptRoundData } from './historical-figures/promptRoundData';
import { ArtPromptRoundData } from './art/promptRoundData';
import { BooksPromptRoundData } from './books/promptRoundData';
import { NerdCulturePromptRoundData } from './nerd-culture/promptRoundData';
import { ToysPromptRoundData } from './toys/promptRoundData';
import { WrestlingPromptRoundData } from './wrestling/promptRoundData';
import { UfcPromptRoundData } from './ufc/promptRoundData';
import { MotorsportPromptRoundData } from './motorsport/promptRoundData';

const InternetSlangPromptRoundData = {
  id: 'internet-slang',
  name: 'Internet Slang',
  emoji: '🗯️',
  prompts: [
    { hint: 'Hype Phrase', main: "It's giving", imposter: 'No cap' },
    { hint: 'Approval Slang', main: 'Slay', imposter: 'Ate' },
    { hint: 'Suspicion Slang', main: 'Sus', imposter: 'Shady' },
    { hint: 'Drama Signal', main: 'Tea', imposter: 'Receipts' },
    { hint: 'Dismissive Reply', main: 'Touch grass', imposter: 'Log off' },
    { hint: 'Embarrassment Slang', main: 'Cringe', imposter: 'Ick' },
    { hint: 'Self-delusion Slang', main: 'Delulu', imposter: 'Copium' },
    { hint: 'Main Character Vibe', main: 'Main character energy', imposter: 'Big aura' },
    { hint: 'Late-night DM Slang', main: 'You up?', imposter: 'Send location' },
  ],
};

const MemesViralPromptRoundData = {
  id: 'memes-viral',
  name: 'Memes & Viral Moments',
  emoji: '😂',
  prompts: [
    { hint: 'Reaction Meme', main: 'Distracted Boyfriend', imposter: 'Woman Yelling at Cat' },
    { hint: 'Chaotic Meme Vibe', main: 'This is fine', imposter: 'Everything is fine' },
    { hint: 'Nostalgic Viral Era', main: 'Harlem Shake', imposter: 'Mannequin Challenge' },
    { hint: 'Big Win Meme', main: 'Task failed successfully', imposter: 'Suffering from success' },
    { hint: 'POV Meme Intro', main: 'POV: You forgot your homework', imposter: 'POV: You overslept your exam' },
    { hint: 'Overused GIF Energy', main: 'Slow clap', imposter: 'Eye roll' },
    { hint: 'Viral Trend', main: 'Ice Bucket Challenge', imposter: 'Bottle Cap Challenge' },
    { hint: 'Sound Meme', main: 'Bruh sound effect', imposter: 'Vine boom' },
    { hint: 'Viral Drama', main: 'Leaked close-friends story', imposter: 'Accidental thirst trap post' },
  ],
};

const TravelDisastersPromptRoundData = {
  id: 'travel-disasters',
  name: 'Travel Disasters',
  emoji: '🧳',
  prompts: [
    { hint: 'Airport Disaster', main: 'Missed flight', imposter: 'Lost passport' },
    { hint: 'Hotel Problem', main: 'Wrong room booking', imposter: 'No hot water' },
    { hint: 'Transport Chaos', main: 'Train canceled', imposter: 'Bus breakdown' },
    { hint: 'Packing Fail', main: 'Forgot charger', imposter: 'Forgot shoes' },
    { hint: 'Language Mishap', main: 'Ordered the wrong meal', imposter: 'Asked for directions to nowhere' },
    { hint: 'Weather Ruin', main: 'Monsoon beach holiday', imposter: 'Heatwave city break' },
    { hint: 'Luggage Drama', main: 'Suitcase sent to the wrong country', imposter: 'Suitcase arrives days late' },
    { hint: 'Tourist Trap', main: 'Overpriced taxi scam', imposter: 'Fake ticket scam' },
    { hint: 'Travel Mix-up', main: 'Awkward hotel checkout together', imposter: 'Walk of shame airport run' },
  ],
};

const FashionPromptRoundData = {
  id: 'fashion-fails',
  name: 'Fashion',
  emoji: '👗',
  prompts: [
    { hint: 'Clothing Type', main: 'T-shirt', imposter: 'Hoodie' },
    { hint: 'Footwear', main: 'Sneakers', imposter: 'Boots' },
    { hint: 'Formal Wear', main: 'Suit', imposter: 'Tuxedo' },
    { hint: 'Summer Outfit', main: 'Shorts', imposter: 'Skirt' },
    { hint: 'Outerwear', main: 'Jacket', imposter: 'Coat' },
    { hint: 'Headwear', main: 'Cap', imposter: 'Beanie' },
    { hint: 'Accessories', main: 'Watch', imposter: 'Bracelet' },
    { hint: 'Bags', main: 'Backpack', imposter: 'Handbag' },
    { hint: 'Party Look', main: 'Smart casual outfit', imposter: 'Formal evening outfit' },
  ],
};

const DatingBiosPromptRoundData = {
  id: 'dating-bios',
  name: 'Dating App Bios',
  emoji: '💘',
  prompts: [
    { hint: 'Basic Bio Line', main: 'Fluent in sarcasm', imposter: 'Partner in crime' },
    { hint: 'Pet Flex', main: 'Dog dad', imposter: 'Cat mom' },
    { hint: 'Adventure Claim', main: 'Always planning my next trip', imposter: 'Spontaneous weekend warrior' },
    { hint: 'Food Personality', main: 'Taco enthusiast', imposter: 'Coffee addict' },
    { hint: 'Gym Bio', main: '6AM gym sessions', imposter: 'Post-gym smoothie person' },
    { hint: 'Music Taste Line', main: 'Send me your playlist', imposter: 'Concert buddy wanted' },
    { hint: 'Conversation Hook', main: 'Tell me your hot take', imposter: 'Convince me pineapple belongs on pizza' },
    { hint: 'Bio Cliche', main: 'No drama please', imposter: 'Good vibes only' },
    { hint: 'Risky Bio Prompt', main: 'Looking for chaos, not closure', imposter: 'Not here for pen pals' },
  ],
};

const SchoolUniPromptRoundData = {
  id: 'school-uni',
  name: 'School / Uni Life',
  emoji: '🎓',
  prompts: [
    { hint: 'Exam Stress', main: 'All-nighter before finals', imposter: 'Cramming in the library lobby' },
    { hint: 'Lecture Habit', main: 'Back row nap', imposter: 'Front row overachiever' },
    { hint: 'Group Project Pain', main: 'One person does all the work', imposter: 'Nobody replies in the group chat' },
    { hint: 'Campus Routine', main: 'Coffee before class', imposter: 'Energy drink before class' },
    { hint: 'Teacher Type', main: 'Strict marker', imposter: 'Easy grader' },
    { hint: 'Uni House Chaos', main: 'Kitchen pile-up', imposter: 'Bathroom queue meltdown' },
    { hint: 'School Memory', main: 'Forgot PE kit', imposter: 'Forgot homework' },
    { hint: 'Deadline Disaster', main: 'Wrong file upload', imposter: 'Submitted one minute late' },
    { hint: 'Messy Fresher Night', main: 'Lost your shoes at the student bar', imposter: 'Woke up in the wrong dorm kitchen' },
  ],
};

const ConspiracyLitePromptRoundData = {
  id: 'conspiracy-lite',
  name: 'Conspiracy Lite',
  emoji: '👁️',
  prompts: [
    { hint: 'Classic Theory', main: 'Moon landing hoax chat', imposter: 'Flat earth chat' },
    { hint: 'Internet Rabbit Hole', main: 'Simulation theory', imposter: 'Mandela effect' },
    { hint: 'Tech Conspiracy', main: 'Phone always listening', imposter: 'Smart TV spying' },
    { hint: 'Government Mystery', main: 'Area 51 cover-up', imposter: 'Secret underground bunkers' },
    { hint: 'Food Theory', main: 'Secret menu code', imposter: 'Shrinkflation sabotage' },
    { hint: 'Celebrity Theory', main: 'Industry clone rumors', imposter: 'Publicity contract rumors' },
    { hint: 'History Mystery', main: 'Lost civilization map', imposter: 'Hidden ancient technology' },
    { hint: 'Everyday Suspicion', main: 'Birds are drones', imposter: 'Pigeons are camera spies' },
    { hint: 'Tin-foil Take', main: 'Your ex has a burner account watching you', imposter: 'Someone leaked your private voice notes' },
  ],
};

const MythicalCreaturesPromptRoundData = {
  id: 'mythical-creatures',
  name: 'Mythical Creatures',
  emoji: '🐉',
  prompts: [
    { hint: 'Legendary Beast', main: 'Dragon', imposter: 'Wyvern' },
    { hint: 'Forest Myth', main: 'Unicorn', imposter: 'Pegasus' },
    { hint: 'Sea Myth', main: 'Kraken', imposter: 'Leviathan' },
    { hint: 'Trickster Creature', main: 'Kitsune', imposter: 'Tanuki' },
    { hint: 'Undead Myth', main: 'Vampire', imposter: 'Ghoul' },
    { hint: 'Ancient Guardian', main: 'Griffin', imposter: 'Sphinx' },
    { hint: 'Tiny Myth', main: 'Fairy', imposter: 'Pixie' },
    { hint: 'Dark Fantasy Creature', main: 'Banshee', imposter: 'Wraith' },
    { hint: 'Tavern Tale', main: 'Seductive succubus rumor', imposter: 'Charming vampire rumor' },
  ],
};

const CarsMotorsPromptRoundData = {
  id: 'cars-motors',
  name: 'Cars & Motors',
  emoji: '🚗',
  prompts: [
    { hint: 'Car Type', main: 'Sports car', imposter: 'Muscle car' },
    { hint: 'Garage Job', main: 'Oil change', imposter: 'Brake pad swap' },
    { hint: 'Driving Mishap', main: 'Missed exit', imposter: 'Wrong turn in one-way street' },
    { hint: 'Race Event', main: 'Drag race', imposter: 'Circuit race' },
    { hint: 'Car Feature', main: 'Manual gearbox', imposter: 'Paddle shifters' },
    { hint: 'Road Situation', main: 'Traffic jam', imposter: 'Road closure detour' },
    { hint: 'Driver Personality', main: 'Backseat driver', imposter: 'Road-rage driver' },
    { hint: 'Car Clean-up', main: 'Interior detail', imposter: 'Exterior polish' },
    { hint: 'Car Park Chaos', main: 'Foggy windows after date night', imposter: 'Awkward goodbye in the rain' },
  ],
};

const RoommateChaosPromptRoundData = {
  id: 'roommate-chaos',
  name: 'Roommate Chaos',
  emoji: '🛋️',
  prompts: [
    { hint: 'Kitchen Conflict', main: 'Someone ate my leftovers', imposter: 'Someone used my mug without asking' },
    { hint: 'Noise Complaint', main: 'Midnight blender', imposter: '3AM speaker session' },
    { hint: 'Cleaning Drama', main: 'Never takes out bins', imposter: 'Never cleans bathroom sink' },
    { hint: 'Fridge Politics', main: 'Mystery expired food', imposter: 'Shelf space war' },
    { hint: 'Bathroom Queue', main: 'Forty-minute shower', imposter: 'Mirror monopoly' },
    { hint: 'Guest Rule', main: 'Unannounced couch guest', imposter: 'Partner basically moved in' },
    { hint: 'Bills Argument', main: 'Late utility payment', imposter: 'Split calculation argument' },
    { hint: 'Passive Aggressive Move', main: 'Sticky-note warning', imposter: 'Silent treatment in group chat' },
    { hint: 'Afterparty Flat Chaos', main: 'Stranger asleep on your sofa', imposter: 'Random jacket and no owner' },
  ],
};

const ChildhoodNostalgiaPromptRoundData = {
  id: 'childhood-nostalgia',
  name: 'Childhood Nostalgia',
  emoji: '🧸',
  prompts: [
    { hint: 'Playground Classic', main: 'Tag', imposter: 'Hide and seek' },
    { hint: 'Old Tech', main: 'Game Boy', imposter: 'Nintendo DS' },
    { hint: 'School Memory', main: 'Pencil case flex', imposter: 'Sticker collection flex' },
    { hint: 'Cartoon Era', main: 'Saturday morning cartoons', imposter: 'After-school cartoons' },
    { hint: 'Snack Time', main: 'Lunchbox chocolate bar', imposter: 'Lunchbox fruit roll' },
    { hint: 'Toy Chaos', main: 'LEGO on the floor pain', imposter: 'Puzzle piece missing rage' },
    { hint: 'Holiday Memory', main: 'Arcade holiday tokens', imposter: 'Souvenir fridge magnets' },
    { hint: 'School Trip', main: 'Museum coach trip', imposter: 'Farm park coach trip' },
    { hint: 'Teen Throwback', main: 'Sneaking out to meet your crush', imposter: 'Secret late-night phone calls' },
  ],
};

const MobileAppsPromptRoundData = {
  id: 'mobile-apps',
  name: 'Mobile Apps',
  emoji: '📱',
  prompts: [
    { hint: 'Messaging App', main: 'WhatsApp', imposter: 'Telegram' },
    { hint: 'Navigation App', main: 'Google Maps', imposter: 'Waze' },
    { hint: 'Photo App', main: 'Instagram', imposter: 'Snapchat' },
    { hint: 'Short Video App', main: 'TikTok', imposter: 'YouTube Shorts' },
    { hint: 'Music App', main: 'Spotify', imposter: 'Apple Music' },
    { hint: 'Food Delivery App', main: 'Uber Eats', imposter: 'Deliveroo' },
    { hint: 'Fitness App', main: 'Strava', imposter: 'Nike Run Club' },
    { hint: 'Note-taking App', main: 'Notion', imposter: 'Evernote' },
    { hint: 'Late-night App Mistake', main: 'Sent risky DM to wrong chat', imposter: 'Accidentally liked an old photo at 2AM' },
  ],
};

const BoardGamesPromptRoundData = {
  id: 'board-game-lore',
  name: 'Board Games',
  emoji: '🎲',
  prompts: [
    { hint: 'Classic Board Game', main: 'Monopoly', imposter: 'The Game of Life' },
    { hint: 'Word Game', main: 'Scrabble', imposter: 'Boggle' },
    { hint: 'Mystery Game', main: 'Cluedo', imposter: 'Mysterium' },
    { hint: 'Card Game', main: 'UNO', imposter: 'Exploding Kittens' },
    { hint: 'Strategy Game', main: 'Catan', imposter: 'Ticket to Ride' },
    { hint: 'Team Game', main: 'Pictionary', imposter: 'Charades' },
    { hint: 'Quick Game', main: 'Connect 4', imposter: 'Jenga' },
    { hint: 'Family Game', main: 'Snakes and Ladders', imposter: 'Ludo' },
    { hint: 'Game Night Vibe', main: 'Friendly game night', imposter: 'Competitive game night' },
  ],
};

const SuperstitionsPromptRoundData = {
  id: 'superstitions',
  name: 'Superstitions',
  emoji: '🍀',
  prompts: [
    { hint: 'Lucky Charm', main: 'Four-leaf clover', imposter: 'Rabbit foot' },
    { hint: 'Bad Omen', main: 'Broken mirror', imposter: 'Walking under ladder' },
    { hint: 'Household Superstition', main: 'Knock on wood', imposter: 'Throw salt over shoulder' },
    { hint: 'Weather Lore', main: 'Red sky warning', imposter: 'Groundhog prediction' },
    { hint: 'Number Superstition', main: 'Lucky number seven', imposter: 'Unlucky number thirteen' },
    { hint: 'Travel Ritual', main: 'Never say quiet flight', imposter: 'Always board with right foot first' },
    { hint: 'Sports Ritual', main: 'Lucky socks', imposter: 'Lucky pre-game song' },
    { hint: 'Festival Ritual', main: 'Wish at midnight', imposter: 'Burn old notes for fresh luck' },
    { hint: 'Romance Superstition', main: 'Never text your ex during Mercury retrograde', imposter: 'Never start dating on a full moon' },
  ],
};

const FestivalsHolidaysPromptRoundData = {
  id: 'festivals-holidays',
  name: 'Festivals & Holidays',
  emoji: '🎊',
  prompts: [
    { hint: 'Winter Holiday', main: 'Christmas dinner', imposter: 'New Year dinner' },
    { hint: 'Summer Festival', main: 'Music festival weekend', imposter: 'Food festival weekend' },
    { hint: 'Dress-up Event', main: 'Halloween party', imposter: 'Masquerade party' },
    { hint: 'Gift Tradition', main: 'Secret Santa', imposter: 'White Elephant' },
    { hint: 'Holiday Travel', main: 'Beach holiday', imposter: 'Ski holiday' },
    { hint: 'Family Gathering', main: 'Huge family lunch', imposter: 'Huge family game night' },
    { hint: 'Festival Problem', main: 'Lost your friends in the crowd', imposter: 'Phone died before meetup' },
    { hint: 'Holiday Budget Drama', main: 'Overspent on gifts', imposter: 'Overspent on flights' },
    { hint: 'Holiday Story', main: 'Festival kiss at midnight', imposter: 'Holiday fling that got messy fast' },
  ],
};

const PicAndMixPromptRoundData = {
  id: 'pic-mix',
  name: 'Pic & Mix',
  emoji: '🧩',
  prompts: [
    { hint: 'Urban Landmark Scene', main: 'City bridge at sunset', imposter: 'Canal ride through old town' },
    { hint: 'Street & Travel Moment', main: 'Busy market street', imposter: 'Quiet historic side street' },
    { hint: 'Food Close-up', main: 'Plated signature dish', imposter: 'Dessert close-up' },
    { hint: 'Wildlife Snapshot', main: 'Animal portrait in nature', imposter: 'Animal in aquarium' },
    { hint: 'Skyline View', main: 'Modern skyline at dusk', imposter: 'Historic skyline at dusk' },
    { hint: 'Action Scene', main: 'Live sports action frame', imposter: 'Crowd celebration frame' },
    { hint: 'Night Lights', main: 'Harbor lights at night', imposter: 'Fireworks over city harbor' },
    { hint: 'Transit Moment', main: 'Train platform photo', imposter: 'Airplane cabin photo' },
    { hint: 'Indoor Lifestyle', main: 'Workspace with laptop and coffee', imposter: 'Restaurant table with drinks' },
  ],
};

export const CATEGORY_PROMPT_PACKS = [
  SportsPromptRoundData,
  FoodPromptRoundData,
  MoviesPromptRoundData,
  MusicPromptRoundData,
  PlacesPromptRoundData,
  GamesPromptRoundData,
  AnimalsPromptRoundData,
  WeirdPromptRoundData,
  JobsPromptRoundData,
  CelebritiesPromptRoundData,
  TechPromptRoundData,
  TvPromptRoundData,
  AnimePromptRoundData,
  CartoonsPromptRoundData,
  ComicBooksMangaPromptRoundData,
  HistoricalFiguresPromptRoundData,
  ArtPromptRoundData,
  BooksPromptRoundData,
  NerdCulturePromptRoundData,
  ToysPromptRoundData,
  WrestlingPromptRoundData,
  UfcPromptRoundData,
  MotorsportPromptRoundData,
  HobbiesPromptRoundData,
  BrandsPromptRoundData,
  SciencePromptRoundData,
  PartyPromptRoundData,
  InternetSlangPromptRoundData,
  MemesViralPromptRoundData,
  TravelDisastersPromptRoundData,
  FashionPromptRoundData,
  DatingBiosPromptRoundData,
  SchoolUniPromptRoundData,
  ConspiracyLitePromptRoundData,
  MythicalCreaturesPromptRoundData,
  CarsMotorsPromptRoundData,
  RoommateChaosPromptRoundData,
  ChildhoodNostalgiaPromptRoundData,
  MobileAppsPromptRoundData,
  BoardGamesPromptRoundData,
  SuperstitionsPromptRoundData,
  FestivalsHolidaysPromptRoundData,
  PicAndMixPromptRoundData,
];
