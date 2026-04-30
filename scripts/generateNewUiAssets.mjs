import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = '/workspace';
const GRAPHICS = path.join(ROOT, 'Graphics');
const CARDS = path.join(ROOT, 'Cards');
const HOSTS = path.join(ROOT, 'Hosts');
const OUT = path.join(ROOT, 'public/assets/new-ui');

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/\//g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

const categoryFileToId = {
  'file_0000000004507246a44963ca2478882c.png': 'travel-disasters',
  'file_000000000bc471f4a4be5e4b8c16f1e2.png': 'sports',
  'file_00000000108471f4b62e2c7ae9ea6c20.png': 'weird',
  'file_0000000011287243aa1d7097907ab3f0.png': 'roommate-chaos',
  'file_000000001cf472468c1e5253748737b7.png': 'nerd-culture',
  'file_00000000212872468341f511f51b2f86.png': 'toys',
  'file_000000002d807243a36f17fef486c120.png': 'mobile-apps',
  'file_00000000338471f4986d6c1c5fcbde49.png': 'animals',
  'file_00000000352c71f49946ebd2f0b55cef.png': 'school-uni',
  'file_0000000037a07243b0e12f5087cc7efc.png': 'game-shows',
  'file_000000003e3871f4bf80082a4942293c.png': 'mythical-creatures',
  'file_000000004a2071f487c31ad1e65a8068.png': 'science',
  'file_000000004adc7246b893cf9026908a0a.png': 'movies',
  'file_000000004edc724399accd5c505585f0.png': 'pic-mix',
  'file_00000000516871f49c6212360cd5971e.png': 'cars-motors',
  'file_000000005f5c7243a78e30b1d96d95e2.png': 'anime',
  'file_0000000069187243ac0ae855cc6e6231.png': 'memes-viral',
  'file_000000006efc71f4ba857ce8fe76d7e4.png': 'childhood-nostalgia',
  'file_0000000075fc7243acf971fe8f99c89e.png': 'books',
  'file_00000000776c71f49af3179666cffc08.png': 'conspiracy-lite',
  'file_000000007cc071f48b67b5e19803392a.png': 'horror',
  'file_000000007ec071f4a5493391cb65343f.png': 'food',
  'file_000000007f487243a5eeffce81132c04.png': 'fashion-fails',
  'file_000000007fec72439be0762334cfe169.png': 'dating-bios',
  'file_00000000848471f4976c8a4f00eeea92.png': 'art',
  'file_0000000084c071f4b7a3869196be413a.png': 'board-game-lore',
  'file_000000008c107243bb9d8c98628d5637.png': 'comedy',
  'file_000000008ca0724382dd71e323ef23d4.png': 'memes-viral-alt',
  'file_00000000915471f4b0d2e8337d6e783c.png': 'places',
  'file_0000000099a871f48e0421ca492134f0.png': 'internet-slang',
  'file_0000000099f07243aa4e06e730fc415a.png': 'historical-figures',
  'file_00000000a5c8720a89681d53b1be1149.png': 'wrestling',
  'file_00000000b56c7243b54709a5d0a877bf.png': 'cartoons',
  'file_00000000b9f871f48a133385f0882482.png': 'musicals',
  'file_00000000c07c7243ad83ffffd294e805.png': 'tech',
  'file_00000000c7a471f4b182eb1453461fdb.png': 'hobbies',
  'file_00000000d28071f48e94453b135d45c2.png': 'games',
  'file_00000000d4f471f4aab303735facd965.png': 'brands',
  'file_00000000d5147243b13573b8508f7154.png': 'festivals-holidays',
  'file_00000000d9907246873baa0eea5c243f.png': 'superstitions',
  'file_00000000da9071f49b5b73d3b4fba06f.png': 'eurovision',
  'file_00000000de6c71f4895025338e3dc9fb.png': 'tv',
  'file_00000000f16c720aa39fadc47156720a.png': 'celebrities',
  'file_00000000f47471f49c9fda63c0918fd7.png': 'music',
  'file_00000000f5ac72439a6e484a2f26fff5.png': 'comic-books-manga',
  'file_00000000f94471f4bf1d0da62af35c11.png': 'girl-bands-vs-boy-bands',
  'file_00000000fb2071f48c9e1e7006543f6f.png': 'theatre',
  'file_00000000fce471f4853460f4b0e160ee.png': 'party',
};

const gameModeMap = {
  'file_00000000bc2871f4aeed7dcd61ceaac4.png': 'prompt',
  'file_0000000041ac7243873a7b4f412eaedc.png': 'opinion',
  'file_00000000517c71f4bfd70c5f1e7a1f36.png': 'picture',
  'file_000000007a1c71f48376fc677649eaa5.png': 'meme',
  'file_0000000003b071f48757e9af0cf96321.png': 'noise',
  'file_00000000d74471f4a0ed51614f7fd36d.png': 'chain',
  'file_00000000c69871f4b96acd241308dc57.png': 'grill',
  'file_0000000054f471f4896003b70c9e15a6.png': 'sound',
  'file_000000000cb471f4924b33c8dead5d3c.png': 'video',
};

const cardsMap = {
  'Default.png': 'default-back',
  'Default front.png': 'default-front',
  'Murder Mystery.png': 'murder-mystery-back',
  'Murder Mystery front.png': 'murder-mystery-front',
  'Pirate.png': 'pirates-back',
  'Pirates front.png': 'pirates-front',
  'Ghosts.png': 'ghosts-and-ghouls-back',
  'Ghosts front.png': 'ghosts-and-ghouls-front',
  'Cops and Robbers.png': 'cops-and-robbers-back',
  'Cops and robbers front.png': 'cops-and-robbers-front',
  'Liar Front.png': 'liar-front',
};

const hostSpriteSheetMap = {
  'file_00000000a69871f4bf3c81abe19a3813.png': { themeSlug: 'default', columns: 3, rows: 3 },
  'file_000000001a8c720ab9fcc74066a89029.png': { themeSlug: 'pirates', columns: 3, rows: 2 },
  'file_0000000060a0720abe7575dc323bdf02.png': { themeSlug: 'murder-mystery', columns: 3, rows: 2 },
  'file_00000000bbcc71f4b79741c539e9ba51.png': { themeSlug: 'cops-and-robbers', columns: 2, rows: 3 },
  'file_000000001d80720aa63a6ac81ee5ebb6.png': { themeSlug: 'ghosts-and-ghouls', columns: 3, rows: 2 },
};

async function resizePng(source, destination, width, height, opts = {}) {
  ensureDir(path.dirname(destination));
  const fit = opts.fit || 'contain';
  const background = opts.background || { r: 0, g: 0, b: 0, alpha: 0 };
  await sharp(source)
    .resize({ width, height, fit, background })
    .png({ compressionLevel: 9, adaptiveFiltering: true, quality: 80 })
    .toFile(destination);
}

async function extractHostFrames(source, destinationDir, {
  columns = 3,
  rows = 2,
  stripBottomRatio = 0.06,
  maxWidth = 640,
  maxHeight = 960,
} = {}) {
  ensureDir(destinationDir);
  const metadata = await sharp(source).metadata();
  const width = Number(metadata.width || 0);
  const height = Number(metadata.height || 0);
  if (!width || !height) {
    throw new Error(`Unable to read dimensions for host sprite sheet: ${source}`);
  }

  const baseFrameWidth = Math.floor(width / columns);
  const baseFrameHeight = Math.floor(height / rows);
  let index = 0;

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const left = column * baseFrameWidth;
      const top = row * baseFrameHeight;
      const frameWidth = column === columns - 1 ? width - left : baseFrameWidth;
      const frameHeight = row === rows - 1 ? height - top : baseFrameHeight;
      const stripBottom = Math.max(
        0,
        Math.min(frameHeight - 1, Math.round(frameHeight * stripBottomRatio))
      );
      const usableHeight = frameHeight - stripBottom;
      index += 1;

      await sharp(source)
        .extract({
          left,
          top,
          width: frameWidth,
          height: usableHeight,
        })
        .resize({
          width: maxWidth,
          height: maxHeight,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .png({ compressionLevel: 9, adaptiveFiltering: true, quality: 80 })
        .toFile(path.join(destinationDir, `talk-${String(index).padStart(2, '0')}.png`));
    }
  }

  return index;
}

async function main() {
  const categoriesOut = path.join(OUT, 'categories');
  const gameModesOut = path.join(OUT, 'game-modes');
  const cardsOut = path.join(OUT, 'cards');
  const wallpapersOut = path.join(OUT, 'wallpapers');
  const logosOut = path.join(OUT, 'logos');
  const mockupsOut = path.join(OUT, 'mockups');
  const hostsOut = path.join(OUT, 'hosts');

  ensureDir(categoriesOut);
  ensureDir(gameModesOut);
  ensureDir(cardsOut);
  ensureDir(wallpapersOut);
  ensureDir(logosOut);
  ensureDir(mockupsOut);
  ensureDir(hostsOut);

  const categoriesDir = path.join(GRAPHICS, 'Categories');
  for (const file of fs.readdirSync(categoriesDir)) {
    if (!file.endsWith('.png')) continue;
    const id = categoryFileToId[file] || slugify(file.replace(/\.png$/i, ''));
    await resizePng(path.join(categoriesDir, file), path.join(categoriesOut, `${id}.png`), 768, 768);
  }

  const modesDir = path.join(GRAPHICS, 'Game Modes');
  for (const file of fs.readdirSync(modesDir)) {
    if (!file.endsWith('.png')) continue;
    const id = gameModeMap[file] || slugify(file.replace(/\.png$/i, ''));
    await resizePng(path.join(modesDir, file), path.join(gameModesOut, `${id}.png`), 768, 768);
  }

  for (const file of fs.readdirSync(CARDS)) {
    if (!file.endsWith('.png')) continue;
    const name = cardsMap[file] || slugify(file.replace(/\.png$/i, ''));
    await resizePng(path.join(CARDS, file), path.join(cardsOut, `${name}.png`), 768, 1152);
  }

  await resizePng(path.join(GRAPHICS, 'Wallpapers', 'Home page.png'), path.join(wallpapersOut, 'home-page.png'), 1280, 2770, { fit: 'cover' });
  await resizePng(path.join(GRAPHICS, 'Wallpapers', 'In game.png'), path.join(wallpapersOut, 'in-game.png'), 1280, 2770, { fit: 'cover' });

  const logosDir = path.join(GRAPHICS, 'Logos');
  for (const file of fs.readdirSync(logosDir)) {
    if (!file.endsWith('.png')) continue;
    const role = file.includes('26a0724') ? 'main-logo' : 'logo-18plus';
    await resizePng(path.join(logosDir, file), path.join(logosOut, `${role}.png`), 1024, 1024);
  }

  const mockupsDir = path.join(GRAPHICS, 'UI Mockups');
  for (const file of fs.readdirSync(mockupsDir)) {
    if (!file.endsWith('.png')) continue;
    const slug = slugify(file.replace(/\.png$/i, ''));
    await resizePng(path.join(mockupsDir, file), path.join(mockupsOut, `${slug}.png`), 720, 1556, { fit: 'contain' });
  }

  if (fs.existsSync(HOSTS)) {
    for (const [fileName, config] of Object.entries(hostSpriteSheetMap)) {
      const sourceFile = path.join(HOSTS, fileName);
      if (!fs.existsSync(sourceFile)) {
        console.warn(`Host sprite sheet missing, skipped: ${sourceFile}`);
        continue;
      }
      const destinationDir = path.join(hostsOut, config.themeSlug);
      const frameCount = await extractHostFrames(sourceFile, destinationDir, {
        columns: config.columns,
        rows: config.rows,
      });
      console.log(`Generated ${frameCount} host frames for ${config.themeSlug}`);
    }
  }

  console.log('Generated optimized assets at', OUT);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
