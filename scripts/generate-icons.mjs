/**
 * Renders every browser/app icon and the social share image from the one
 * source mark, `public/wow-logo-mark.png`.
 *
 *   npm run icons:generate
 *
 * The outputs are committed, so this only needs re-running when the logo
 * itself changes. Keeping one source avoids the state this repo was in
 * before: metadata referencing /favicon.ico, /favicon-32x32.png and
 * /og-image.jpg, none of which existed, so browsers fell back to the
 * default globe and shared links had no picture.
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.join(import.meta.dirname, "..");
const PUBLIC = path.join(ROOT, "public");
const LOGO = path.join(PUBLIC, "wow-logo-mark.png");

const GOLD_LIGHT = "#E2BE6A";
const GOLD = "#C9A84C";
const INK = "#0B0B0B";
/**
 * The artwork's own background is pure black, inside the circle and out — the
 * circle reads as a circle only once it is masked. Anything letterboxed or
 * composited behind the mark has to use this exact value, not INK, or the
 * seam shows as a faint square.
 */
const BLACK = "#000000";

/**
 * Where the monogram sits inside the 1254px source, measured from the artwork
 * rather than eyeballed: the gold pixels occupy rows 293–944, broken by a clean
 * gap at 849–876 that separates the W from the "Just Looking Like a WOW"
 * strapline beneath it.
 *
 * Small icons crop to the W alone. At 16–32px the full lockup is barely 4px of
 * strapline — an illegible gold smear that also shrinks the W to nothing — so
 * the letter is used on its own and stays recognisable.
 */
const W_MARK = { left: 209, top: 273, width: 838, height: 596 };
const SMALL = 48;

/** The full circular lockup at an exact pixel size. */
const full = (size) => sharp(LOGO).resize(size, size, { fit: "cover" }).png();

/** Just the W, letterboxed onto the logo's own black so the join is invisible. */
const monogram = (size) =>
  sharp(LOGO)
    .extract(W_MARK)
    .resize(size, size, { fit: "contain", background: BLACK })
    .png();

const mark = (size) => (size <= SMALL ? monogram(size) : full(size));

/**
 * The lockup cut out to its own circle.
 *
 * The source is a black circle on a black square, and #000 against the tiles'
 * #0B0B0B is just different enough to show as a faint square outline around the
 * badge. Masking to the circle removes the corners entirely so the mark sits on
 * whatever it is composited over.
 */
async function circleMark(size) {
  const base = await full(size).toBuffer();
  const circle = Buffer.from(
    `<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#fff"/></svg>`,
  );
  return sharp(base).composite([{ input: circle, blend: "dest-in" }]).png().toBuffer();
}

async function writePng(size, file) {
  await mark(size).toFile(path.join(PUBLIC, file));
  return `${file} (${size}×${size})`;
}

/**
 * Apple and Android tiles are composited onto opaque black: iOS ignores
 * transparency and would otherwise punch the circle's corners out to white
 * on a dark home screen.
 */
async function writeTile(size, file, padding = 0.06) {
  const inner = Math.round(size * (1 - padding * 2));
  const markPng = inner <= SMALL ? await monogram(inner).toBuffer() : await circleMark(inner);
  await sharp({
    create: { width: size, height: size, channels: 4, background: BLACK },
  })
    .composite([
      { input: markPng, top: Math.round((size - inner) / 2), left: Math.round((size - inner) / 2) },
    ])
    .png()
    .toFile(path.join(PUBLIC, file));
  return `${file} (${size}×${size}, opaque)`;
}

/**
 * A multi-size .ico. Windows and the older-browser fallback path still ask
 * for this by name, and it is the one icon format Next.js metadata cannot
 * synthesise. PNG payloads inside an ICO container are read by every
 * browser still in service.
 */
async function writeIco(sizes, file) {
  const images = await Promise.all(sizes.map((s) => mark(s).toBuffer()));

  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // 1 = icon
  header.writeUInt16LE(sizes.length, 4);

  let offset = 6 + sizes.length * 16;
  const entries = sizes.map((size, i) => {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0); // 0 means 256
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt8(0, 2); // palette size
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // colour planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(images[i].length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += images[i].length;
    return entry;
  });

  fs.writeFileSync(path.join(PUBLIC, file), Buffer.concat([header, ...entries, ...images]));
  return `${file} (${sizes.join(", ")})`;
}

/**
 * The badge the site header and footer render.
 *
 * The full lockup can't be used here: beside it the header already prints the
 * brand name, location and strapline as live text, and at 40px the strapline
 * baked into the artwork is an unreadable smear that also crowds the W down to
 * nothing. So this is the circle and the monogram only — same mark, legible
 * small — cut out to the circle so it sits on the light header and the dark
 * footer alike.
 */
async function writeBrandMark(size, file) {
  const inner = Math.round(size * 0.62);
  const w = await monogram(inner).toBuffer();
  const badge = await sharp({
    create: { width: size, height: size, channels: 4, background: BLACK },
  })
    .composite([{ input: w, top: Math.round((size - inner) / 2), left: Math.round((size - inner) / 2) }])
    .png()
    .toBuffer();

  const circle = Buffer.from(
    `<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#fff"/></svg>`,
  );
  await sharp(badge)
    .composite([{ input: circle, blend: "dest-in" }])
    .png()
    .toFile(path.join(PUBLIC, file));
  return `${file} (${size}×${size}, transparent outside the circle)`;
}

/** The 1200×630 card WhatsApp, Facebook and X show when the site is shared. */
async function writeOgImage(file) {
  const W = 1200;
  const H = 630;
  const markPng = await circleMark(300);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${GOLD_LIGHT}"/>
      <stop offset="100%" stop-color="${GOLD}"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.78" cy="0.18" r="0.75">
      <stop offset="0%" stop-color="${GOLD}" stop-opacity="0.20"/>
      <stop offset="100%" stop-color="${INK}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="${INK}"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  <rect x="0" y="0" width="${W}" height="8" fill="url(#gold)"/>

  <text x="420" y="272" font-family="Georgia, 'Times New Roman', serif" font-size="76"
        font-weight="bold" fill="url(#gold)" letter-spacing="1">WOW LIFESTYLE</text>
  <text x="424" y="330" font-family="Arial, Helvetica, sans-serif" font-size="30" fill="#EDEDED">
    Toys &#183; Hobby-Grade RC Cars &#183; Drones &#183; Bikes
  </text>
  <text x="424" y="378" font-family="Arial, Helvetica, sans-serif" font-size="25" fill="${GOLD}">
    Texvalley, Erode &#183; Thuraiyur &#183; Delivered across India
  </text>

  <rect x="424" y="424" width="150" height="2" fill="${GOLD}" opacity="0.5"/>
  <text x="424" y="476" font-family="Arial, Helvetica, sans-serif" font-size="25" fill="#9A9A9A">
    wowlifestyle.online
  </text>
</svg>`;

  await sharp(Buffer.from(svg))
    .composite([{ input: markPng, top: Math.round((H - 300) / 2), left: 80 }])
    .jpeg({ quality: 90, chromaSubsampling: "4:4:4" })
    .toFile(path.join(PUBLIC, file));
  return `${file} (${W}×${H})`;
}

const written = [
  await writeIco([16, 32, 48], "favicon.ico"),
  await writePng(16, "favicon-16x16.png"),
  await writePng(32, "favicon-32x32.png"),
  await writePng(96, "favicon-96x96.png"),
  // Google wants a favicon that is a multiple of 48px square for search results.
  await writePng(48, "favicon-48x48.png"),
  await writePng(144, "favicon-144x144.png"),
  await writeTile(180, "apple-touch-icon.png"),
  await writeTile(192, "icon-192.png"),
  await writeTile(512, "icon-512.png"),
  await writeBrandMark(256, "wow-mark.png"),
  await writeOgImage("og-image.jpg"),
];

console.log(`Generated from ${path.relative(ROOT, LOGO)}:`);
for (const line of written) console.log(`  ${line}`);
