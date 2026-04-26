const GENERAL_ADULT_ONLY_POOL = [
  'Cocktail bar',
  'Nightclub dance floor',
  'Casino lounge',
  'Hotel rooftop pool',
  'After-hours karaoke booth',
  'VIP lounge',
  'Late-night diner',
  'Adult arcade',
  'Moonlight beach party',
  'Speakeasy',
];

const DEFAULT_CATEGORY_POOL = {
  regularMain: ['London', 'Eiffel Tower', 'Lion', 'Pizza', 'Taylor Swift', 'Nintendo Switch', 'Football stadium', 'Great White Shark'],
  regularImposter: ['Paris', 'Big Ben', 'Tiger', 'Burger', 'Beyonce', 'PlayStation 5', 'Baseball stadium', 'Hammerhead Shark'],
  adultMain: GENERAL_ADULT_ONLY_POOL,
  adultImposter: [...GENERAL_ADULT_ONLY_POOL.slice(1), GENERAL_ADULT_ONLY_POOL[0]],
};

export const CATEGORY_GUESSABLE_ENTITY_POOLS = {
  sports: {
    regularMain: ['Basketball', 'Football', 'Tennis', 'Boxing', 'Ice Hockey', 'Formula 1', 'Cricket', 'Volleyball', 'Rugby', 'Golf'],
    regularImposter: ['Baseball', 'Rugby Union', 'Badminton', 'MMA', 'Lacrosse', 'NASCAR', 'Baseball', 'Handball', 'American Football', 'Table Tennis'],
    adultMain: ['Sports bar', 'Boxing afterparty', 'VIP stadium suite', 'Rooftop victory party', 'Late-night gym'],
    adultImposter: ['Airport sports lounge', 'Casino sports lounge', 'Hotel afterparty', 'Private karaoke room', 'Taxi rank outside arena'],
  },
  food: {
    regularMain: ['Pizza', 'Burger', 'Ramen', 'Sushi', 'Tacos', 'Pancakes', 'Waffles', 'Donut', 'Cheesecake', 'Lasagna'],
    regularImposter: ['Calzone', 'Hot Dog', 'Udon', 'Poke Bowl', 'Burrito', 'French Toast', 'Crepe', 'Bagel', 'Brownie', 'Baked Ziti'],
    adultMain: ['Wine bar', 'Cocktail brunch', 'Steakhouse date night', 'Dessert bar', 'Late-night taco stand'],
    adultImposter: ['Champagne lounge', 'Hotel room service', 'Midnight diner', 'Private chef table', 'Afterparty pizza joint'],
  },
  movies: {
    regularMain: ['Inception', 'Interstellar', 'Titanic', 'The Matrix', 'Jaws', 'Shrek', 'Gladiator', 'The Dark Knight', 'Avatar', 'Toy Story'],
    regularImposter: ['Memento', 'Gravity', 'The Notebook', 'Blade Runner', 'Jurassic Park', 'Monsters, Inc.', 'Troy', 'Batman Begins', 'Dune', 'Finding Nemo'],
    adultMain: ['Drive-in cinema', 'Private screening room', 'Film festival afterparty', 'Rooftop movie night', 'Luxury cinema lounge'],
    adultImposter: ['Hotel cinema room', 'Back-row cinema date', 'Late-night horror marathon', 'Midnight premiere queue', 'Cinema bar'],
  },
  music: {
    regularMain: ['Taylor Swift', 'Adele', 'The Beatles', 'Nirvana', 'Arctic Monkeys', 'Drake', 'Metallica', 'Beyonce', 'Coldplay', 'Eminem'],
    regularImposter: ['Dua Lipa', 'Sam Smith', 'Queen', 'Foo Fighters', 'The 1975', 'Kendrick Lamar', 'Megadeth', 'Rihanna', 'Imagine Dragons', '50 Cent'],
    adultMain: ['Jazz club', 'Underground rave', 'VIP concert box', 'Karaoke lounge', 'Festival afterparty'],
    adultImposter: ['Piano cocktail bar', 'Nightclub DJ booth', 'Backstage bar', 'Hotel lobby piano bar', 'Rooftop DJ set'],
  },
  places: {
    regularMain: ['London', 'Paris', 'Rome', 'Tokyo', 'Sydney', 'Barcelona', 'Dubai', 'New York', 'Berlin', 'Cape Town'],
    regularImposter: ['Manchester', 'Madrid', 'Milan', 'Seoul', 'Melbourne', 'Lisbon', 'Abu Dhabi', 'Los Angeles', 'Munich', 'Johannesburg'],
    adultMain: ['Ibiza beach club', 'Las Vegas strip', 'Monaco casino', 'Mykonos beach bar', 'Rio rooftop party'],
    adultImposter: ['Miami nightclub district', 'Bangkok rooftop bar', 'Dubai marina lounge', 'Berlin techno club', 'London Soho late night'],
  },
  games: {
    regularMain: ['Minecraft', 'Fortnite', 'Mario Kart', 'Elden Ring', 'Call of Duty', 'The Sims', 'FIFA', 'Valorant', 'Zelda', 'Animal Crossing'],
    regularImposter: ['Roblox', 'Apex Legends', 'Crash Team Racing', 'Dark Souls', 'Battlefield', 'SimCity', 'eFootball', 'Counter-Strike', 'Genshin Impact', 'Stardew Valley'],
    adultMain: ['Arcade bar', 'Casino poker room', 'VR gaming lounge', 'Board game pub', 'Late-night LAN cafe'],
    adultImposter: ['Retro arcade lounge', 'Private poker table', 'Hotel game suite', 'Esports arena afterparty', 'Midnight escape room'],
  },
  animals: {
    regularMain: ['Lion', 'Tiger', 'Cheetah', 'Eagle', 'Dolphin', 'Panda', 'Wolf', 'Otter', 'Elephant', 'Giraffe'],
    regularImposter: ['Leopard', 'Jaguar', 'Hyena', 'Hawk', 'Orca', 'Koala', 'Coyote', 'Beaver', 'Rhino', 'Zebra'],
    adultMain: ['Night safari', 'Aquarium adults-only night', 'Zoo twilight tour', 'Wildlife lodge bar', 'Safari resort lounge'],
    adultImposter: ['Jungle night cruise', 'Marine life evening event', 'Luxury safari camp', 'Moonlight zoo event', 'Island wildlife resort'],
  },
  weird: {
    regularMain: ['Area 51', 'Bermuda Triangle', 'Mothman', 'Bigfoot', 'Loch Ness Monster', 'Jersey Devil', 'Roswell', 'Stonehenge', 'Nazca Lines', 'Annabelle doll'],
    regularImposter: ['Skinwalker Ranch', 'Devils Triangle', 'Chupacabra', 'Yeti', 'Kraken', 'Thunderbird', 'Phoenix Lights', 'Easter Island statues', 'Moai quarry', 'Chucky doll'],
    adultMain: ['Haunted hotel', 'Ghost tour pub crawl', 'Occult bookstore basement', 'Paranormal museum night', 'Seance party room'],
    adultImposter: ['Abandoned mansion party', 'Night cemetery tour', 'Mystery escape room', 'Tarot lounge', 'Midnight ghost walk'],
  },
  jobs: {
    regularMain: ['Doctor', 'Nurse', 'Teacher', 'Lawyer', 'Chef', 'Firefighter', 'Pilot', 'Architect', 'Photographer', 'Journalist'],
    regularImposter: ['Paramedic', 'Pharmacist', 'Lecturer', 'Barrister', 'Line cook', 'Police officer', 'Flight attendant', 'Civil engineer', 'Videographer', 'Reporter'],
    adultMain: ['Hotel concierge desk', 'Casino dealer table', 'Nightclub bartender shift', 'Event photographer booth', 'Luxury cruise host desk'],
    adultImposter: ['VIP host stand', 'Private club security desk', 'Late shift diner chef line', 'Resort spa reception', 'After-hours radio studio'],
  },
  celebrities: {
    regularMain: ['Taylor Swift', 'Lionel Messi', 'Gordon Ramsay', 'Ryan Reynolds', 'Zendaya', 'The Rock', 'Adele', 'Beyonce', 'Keanu Reeves', 'Tom Holland'],
    regularImposter: ['Lady Gaga', 'Cristiano Ronaldo', 'Jamie Oliver', 'Chris Pratt', 'Sydney Sweeney', 'John Cena', 'Dua Lipa', 'Ariana Grande', 'Robert Pattinson', 'Timothee Chalamet'],
    adultMain: ['Met Gala afterparty', 'Cannes yacht party', 'Oscars afterparty lounge', 'Fashion week VIP room', 'Private celebrity club'],
    adultImposter: ['Red carpet cocktail bar', 'Film festival rooftop lounge', 'Music awards green room', 'Celebrity beach club', 'Private penthouse event'],
  },
  tech: {
    regularMain: ['iPhone', 'Android', 'Windows', 'Linux', 'PlayStation 5', 'Xbox Series X', 'ChatGPT', 'Claude', 'Google Drive', 'Dropbox'],
    regularImposter: ['Google Pixel', 'Samsung Galaxy', 'macOS', 'Ubuntu', 'Nintendo Switch', 'Steam Deck', 'Gemini', 'Copilot', 'OneDrive', 'iCloud'],
    adultMain: ['Tech conference afterparty', 'VR lounge', 'Gaming cafe VIP room', 'Startup launch rooftop', 'Crypto meetup bar'],
    adultImposter: ['Hackathon overnight venue', 'Silicon Valley cocktail event', 'Esports afterparty suite', 'Developer meetup pub', 'Late-night arcade lounge'],
  },
  tv: {
    regularMain: ['Breaking Bad', 'Game of Thrones', 'Friends', 'Stranger Things', 'The Office', 'Sherlock', 'The Simpsons', 'Black Mirror', 'The Boys', 'Loki'],
    regularImposter: ['Better Call Saul', 'The Witcher', 'How I Met Your Mother', 'Dark', 'Parks and Recreation', 'Lupin', 'Family Guy', 'Love Death + Robots', 'Invincible', 'Moon Knight'],
    adultMain: ['TV premiere afterparty', 'Reality show reunion stage', 'Late-night talk show lounge', 'Streaming launch party', 'Private watch party loft'],
    adultImposter: ['Film studio rooftop', 'Press junket cocktail room', 'Aftershow podcast studio', 'Awards ceremony lounge', 'Luxury screening suite'],
  },
  hobbies: {
    regularMain: ['Painting', 'Photography', 'Gardening', 'Woodworking', 'Cycling', 'Running', 'Baking', 'Chess', 'Guitar', 'Fishing'],
    regularImposter: ['Sketching', 'Videography', 'Houseplants', '3D printing', 'Mountain biking', 'Hiking', 'Pastry making', 'Sudoku', 'Bass guitar', 'Kayaking'],
    adultMain: ['Wine and paint night', 'Dance studio social night', 'Cooking class date', 'Rooftop yoga night', 'Photography night walk'],
    adultImposter: ['Pottery studio evening class', 'Salsa club social', 'Late-night baking class', 'Jazz improv workshop', 'Night cycling meetup'],
  },
  brands: {
    regularMain: ['Nike', 'Adidas', 'Apple', 'Samsung', 'Coca-Cola', 'Pepsi', 'BMW', 'Mercedes-Benz', 'IKEA', 'Starbucks'],
    regularImposter: ['Puma', 'Reebok', 'Google', 'Sony', 'Fanta', 'Dr Pepper', 'Audi', 'Lexus', 'Wayfair', 'Costa Coffee'],
    adultMain: ['Designer boutique launch', 'Whisky tasting event', 'Luxury watch showroom', 'Sports car launch party', 'Fashion house rooftop event'],
    adultImposter: ['Premium sneaker drop night', 'Champagne brand event', 'Perfume launch lounge', 'Exclusive members club', 'Private shopping suite'],
  },
  science: {
    regularMain: ['Solar system', 'Milky Way', 'DNA', 'RNA', 'Volcano', 'Earthquake', 'Comet', 'Asteroid', 'Telescope', 'Microscope'],
    regularImposter: ['Andromeda galaxy', 'Triangulum galaxy', 'Cell nucleus', 'Mitochondria', 'Hurricane', 'Tsunami', 'Meteor', 'Nebula', 'Satellite', 'Periscope'],
    adultMain: ['Science museum after dark', 'Planetarium late show', 'Observatory night tour', 'Biotech gala', 'Space center launch party'],
    adultImposter: ['Aquarium science night', 'Natural history museum gala', 'Innovation expo lounge', 'Astronomy rooftop event', 'Engineering conference afterparty'],
  },
  party: {
    regularMain: ['House party', 'Karaoke night', 'Trivia night', 'Board game night', 'Costume party', 'Pool party', 'Garden party', 'Rooftop party', 'Dance battle', 'Pub quiz'],
    regularImposter: ['Beach party', 'Open mic night', 'Bingo night', 'Poker night', 'Masquerade party', 'Boat party', 'BBQ party', 'Penthouse party', 'Lip sync battle', 'Game show night'],
    adultMain: ['Nightclub VIP table', 'Casino afterparty', 'Private cocktail party', 'Luxury yacht party', 'Exclusive lounge party'],
    adultImposter: ['Speakeasy party room', 'Hotel penthouse party', 'Late-night cabaret', 'Rooftop bottle service', 'Midnight beach party'],
  },
};

function toEntityPrompt(hintPrefix, main, imposter, index, adultOnly = false) {
  return {
    hint: `${hintPrefix} ${index + 1}${adultOnly ? ' (18+)' : ''}`,
    main,
    imposter,
    ...(adultOnly ? { adultOnly: true } : {}),
  };
}

function buildEntityBatch(pool, hintPrefix, count = 50, adultOnly = false) {
  const mainPool = (adultOnly ? pool.adultMain : pool.regularMain) || [];
  const imposterPool = (adultOnly ? pool.adultImposter : pool.regularImposter) || [];
  if (!mainPool.length || !imposterPool.length) return [];
  return Array.from({ length: count }, (_, index) => {
    const main = mainPool[index % mainPool.length];
    const imposter = imposterPool[(index + 1) % imposterPool.length];
    return toEntityPrompt(hintPrefix, main, imposter, index, adultOnly);
  });
}

export function buildExpandedEntityPrompts(categoryId, categoryName, count = 50) {
  const pool = CATEGORY_GUESSABLE_ENTITY_POOLS[categoryId] || DEFAULT_CATEGORY_POOL;
  const safeName = String(categoryName || 'Category').trim() || 'Category';
  return [
    ...buildEntityBatch(pool, `${safeName} Link`, count, false),
    ...buildEntityBatch(pool, `${safeName} Night`, count, true),
  ];
}

