/**
 * Renders every browser/app icon and the social share image from the one
 * source mark, `public/wow-logo.svg`.
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
const LOGO = path.join(PUBLIC, "wow-logo.svg");

const GOLD_LIGHT = "#E2BE6A";
const GOLD = "#C9A84C";
const INK = "#0B0B0B";

const logoSvg = fs.readFileSync(LOGO);

/**
 * At 16–32 px the monogram is only a handful of pixels tall and reads as a
 * gold smudge inside the ring. Enlarging just the letter for those sizes
 * keeps the W legible without changing the logo everywhere else.
 */
const smallLogoSvg = Buffer.from(
  logoSvg.toString("utf8").replace('font-size="24"', 'font-size="34"'),
);

/** The mark at an exact pixel size. `density` keeps the vector crisp. */
const mark = (size) =>
  sharp(size <= 32 ? smallLogoSvg : logoSvg, { density: 900 }).resize(size, size).png();

async function writePng(size, file) {
  await mark(size).toFile(path.join(PUBLIC, file));
  return `${file} (${size}×${size})`;
}

/**
 * Apple and Android tiles are composited onto opaque black: iOS ignores
 * transparency and would otherwise punch the circle's corners out to white
 * on a dark home screen.
 */
async function writeTile(size, file, padding = 0.1) {
  const inner = Math.round(size * (1 - padding * 2));
  const markPng = await mark(inner).toBuffer();
  await sharp({
    create: { width: size, height: size, channels: 4, background: INK },
  })
    .composite([{ input: markPng, top: Math.round((size - inner) / 2), left: Math.round((size - inner) / 2) }])
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

/** The 1200×630 card WhatsApp, Facebook and X show when the site is shared. */
async function writeOgImage(file) {
  const W = 1200;
  const H = 630;
  const markPng = await mark(260).toBuffer();

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

  <text x="366" y="286" font-family="Georgia, 'Times New Roman', serif" font-size="78"
        font-weight="bold" fill="url(#gold)" letter-spacing="1">WOW LIFESTYLE</text>
  <text x="370" y="344" font-family="Arial, Helvetica, sans-serif" font-size="31" fill="#EDEDED">
    Toys &#183; Hobby-Grade RC Cars &#183; Drones &#183; Bikes
  </text>
  <text x="370" y="392" font-family="Arial, Helvetica, sans-serif" font-size="26" fill="${GOLD}">
    Texvalley, Erode &#183; Tamil Nadu &#183; Delivered across India
  </text>

  <rect x="370" y="440" width="150" height="2" fill="${GOLD}" opacity="0.5"/>
  <text x="370" y="492" font-family="Arial, Helvetica, sans-serif" font-size="25" fill="#9A9A9A">
    wowlifestyle.online
  </text>
</svg>`;

  await sharp(Buffer.from(svg))
    .composite([{ input: markPng, top: Math.round((H - 260) / 2), left: 70 }])
    .jpeg({ quality: 90, chromaSubsampling: "4:4:4" })
    .toFile(path.join(PUBLIC, file));
  return `${file} (${W}×${H})`;
}

const written = [
  await writeIco([16, 32, 48], "favicon.ico"),
  await writePng(16, "favicon-16x16.png"),
  await writePng(32, "favicon-32x32.png"),
  await writePng(96, "favicon-96x96.png"),
  await writeTile(180, "apple-touch-icon.png"),
  await writeTile(192, "icon-192.png"),
  await writeTile(512, "icon-512.png"),
  await writeOgImage("og-image.jpg"),
];

console.log(`Generated from ${path.relative(ROOT, LOGO)}:`);
for (const line of written) console.log(`  ${line}`);
