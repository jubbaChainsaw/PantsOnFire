function toAssetSlug(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function toPackImageSrc(pack, groupId, pairIndex, main, imposter, variant) {
  const groupSlug = toAssetSlug(groupId);
  const pairSlug = `${String(pairIndex + 1).padStart(2, '0')}-${toAssetSlug(main)}-vs-${toAssetSlug(imposter)}`;
  return `${pack.basePath}/${groupSlug}-${pairSlug}-${variant}.png`;
}

const CORE_V1_GROUPS = [
  {
    id: 'places',
    name: 'Places',
    pairs: [
      ['Eiffel Tower, Paris', 'Big Ben, London'],
      ['Times Square, New York', 'Shibuya Crossing, Tokyo'],
      ['Grand Canyon, Arizona', 'Bryce Canyon, Utah'],
      ['Santorini, Greece', 'Amalfi Coast, Italy'],
      ['Sydney Opera House', 'Marina Bay Sands'],
      ['Golden Gate Bridge', 'Brooklyn Bridge'],
      ['Niagara Falls', 'Victoria Falls'],
      ['Machu Picchu', 'Petra, Jordan'],
      ['Sahara Desert Dunes', 'Gobi Desert'],
      ['Banff National Park', 'Yosemite Valley'],
    ],
  },
  {
    id: 'animals',
    name: 'Animals',
    pairs: [
      ['African Lion', 'Bengal Tiger'],
      ['Giant Panda', 'Red Panda'],
      ['Emperor Penguin', 'Puffin'],
      ['Sea Turtle', 'Manta Ray'],
      ['Koala', 'Sloth'],
      ['Arctic Fox', 'Fennec Fox'],
      ['Dolphin Pod', 'Orca Pod'],
      ['Snow Leopard', 'Clouded Leopard'],
      ['Giraffe Herd', 'Zebra Herd'],
      ['Bald Eagle', 'Golden Eagle'],
    ],
  },
  {
    id: 'foods',
    name: 'Foods',
    pairs: [
      ['Margherita Pizza', 'Pepperoni Pizza'],
      ['Sushi Platter', 'Sashimi Platter'],
      ['Cheeseburger', 'Chicken Burger'],
      ['Tacos al Pastor', 'Beef Burrito'],
      ['Ramen Bowl', 'Pho Bowl'],
      ['Butter Chicken', 'Chicken Tikka Masala'],
      ['Croissant', 'Pain au Chocolat'],
      ['Blueberry Pancakes', 'Belgian Waffles'],
      ['Caesar Salad', 'Greek Salad'],
      ['Chocolate Cake', 'Chocolate Brownie'],
    ],
  },
  {
    id: 'celebrities',
    name: 'Celebrities',
    pairs: [
      ['Taylor Swift', 'Ariana Grande'],
      ['Dwayne Johnson', 'John Cena'],
      ['Lionel Messi', 'Cristiano Ronaldo'],
      ['Zendaya', 'Sydney Sweeney'],
      ['Rihanna', 'Beyonce'],
      ['Keanu Reeves', 'Ryan Reynolds'],
      ['Tom Holland', 'Timothee Chalamet'],
      ['Emma Stone', 'Jennifer Lawrence'],
      ['Gordon Ramsay', 'Jamie Oliver'],
      ['MrBeast', 'KSI'],
    ],
  },
  {
    id: 'sports',
    name: 'Sports',
    pairs: [
      ['Football Stadium', 'Rugby Stadium'],
      ['Formula 1 Car', 'IndyCar'],
      ['Tennis Court', 'Badminton Court'],
      ['NBA Arena', 'NHL Arena'],
      ['Olympic Swimming Pool', 'Water Polo Pool'],
      ['Baseball Diamond', 'Cricket Pitch'],
      ['Boxing Ring', 'MMA Octagon'],
      ['Golf Course', 'Disc Golf Course'],
      ['Skate Park', 'BMX Park'],
      ['Ski Resort', 'Snowboard Park'],
    ],
  },
  {
    id: 'travel',
    name: 'Travel',
    pairs: [
      ['Airplane Cabin', 'High-Speed Train Cabin'],
      ['Luxury Hotel Lobby', 'Boutique Hotel Lobby'],
      ['Tropical Beach Resort', 'Mountain Ski Resort'],
      ['Street Market in Bangkok', 'Souk in Marrakech'],
      ['Venice Gondola Ride', 'Amsterdam Canal Cruise'],
      ['Northern Lights in Iceland', 'Milky Way in Desert'],
      ['Safari Jeep in Kenya', 'Desert Jeep in Dubai'],
      ['Tokyo Metro Station', 'London Underground Station'],
      ['Paris Cafe Terrace', 'Rome Piazza Cafe'],
      ['Dubai Skyline', 'Singapore Skyline'],
    ],
  },
];

export const PICTURE_DLC_MANIFESTS = [
  {
    id: 'core-v1',
    version: 1,
    label: 'Core Picture Prompt Pack',
    category: 'picture',
    releaseChannel: 'base',
    basePath: '/assets/graphic-packs/picture/core-v1/images',
    groups: CORE_V1_GROUPS,
  },
];

export function buildPictureRoundsFromManifest(manifest) {
  if (!manifest || !Array.isArray(manifest.groups)) return [];
  return manifest.groups.flatMap((group) => (
    (group.pairs || []).map(([main, imposter], index) => ({
      hint: `Picture Prompt • ${group.name} ${index + 1}`,
      main,
      imposter,
      picturePackId: manifest.id,
      previewLabel: `Graphic pack clue from the ${group.name} picture prompts.`,
      mainImageSrc: toPackImageSrc(manifest, group.id, index, main, imposter, 'main'),
      imposterImageSrc: toPackImageSrc(manifest, group.id, index, main, imposter, 'imposter'),
    }))
  ));
}

export function buildAllPictureDlcRounds() {
  return PICTURE_DLC_MANIFESTS.flatMap((manifest) => buildPictureRoundsFromManifest(manifest));
}

export function validatePictureDlcManifest(manifest) {
  if (!manifest || typeof manifest !== 'object') return false;
  if (!manifest.id || !manifest.category || !manifest.basePath) return false;
  if (manifest.category !== 'picture') return false;
  if (!Array.isArray(manifest.groups) || manifest.groups.length === 0) return false;
  return manifest.groups.every((group) => (
    group &&
    typeof group === 'object' &&
    group.id &&
    group.name &&
    Array.isArray(group.pairs) &&
    group.pairs.every((pair) => Array.isArray(pair) && pair.length === 2)
  ));
}
