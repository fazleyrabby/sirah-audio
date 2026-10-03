// Generates the stylised landscape scenes and the map in public/images/.
// Landscapes only: no figures, no faces, no text inside scenes (SPEC 7-12, 36).
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const W = 1600;
const H = 900;

function random(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const n = (value: number) => value.toFixed(1);

function sky(id: string, stops: [number, string][]): string {
  const gradient = stops.map(([offset, color]) => `<stop offset="${offset}" stop-color="${color}"/>`).join("");
  return `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">${gradient}</linearGradient></defs><rect width="${W}" height="${H}" fill="url(#${id})"/>`;
}

function stars(seed: number, count: number, maxY: number): string {
  const rand = random(seed);
  let out = "";
  for (let i = 0; i < count; i++) {
    const y = rand() * maxY;
    const fade = 1 - (y / maxY) * 0.75;
    out += `<circle cx="${n(rand() * W)}" cy="${n(y)}" r="${n(0.5 + rand() * rand() * 1.5)}" fill="#f6ead2" opacity="${(0.4 + rand() * 0.6 * fade).toFixed(2)}"/>`;
  }
  return out;
}

function moon(x: number, y: number, r: number, skyColor: string): string {
  return (
    `<defs><radialGradient id="glow"><stop offset="0" stop-color="#f3e3bf" stop-opacity="0.28"/><stop offset="1" stop-color="#f3e3bf" stop-opacity="0"/></radialGradient></defs>` +
    `<circle cx="${x}" cy="${y}" r="${r * 5}" fill="url(#glow)"/>` +
    `<circle cx="${x}" cy="${y}" r="${r}" fill="#f1e2c0"/>` +
    `<circle cx="${x + r * 0.42}" cy="${y - r * 0.18}" r="${r * 0.92}" fill="${skyColor}"/>`
  );
}

function sun(x: number, y: number, r: number, color: string): string {
  return (
    `<defs><radialGradient id="sun"><stop offset="0" stop-color="${color}" stop-opacity="0.55"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient></defs>` +
    `<ellipse cx="${x}" cy="${y}" rx="${r * 2.4}" ry="${r}" fill="url(#sun)"/>`
  );
}

interface RidgeOptions {
  seed: number;
  base: number;
  height: number;
  jagged?: number;
  peak?: { x: number; width: number; height: number };
  color: string;
  opacity?: number;
}

// A ridgeline: slow waves for the overall shape, optional noise for rock, optional dominant peak.
function ridge(options: RidgeOptions): string {
  const rand = random(options.seed);
  const waves = [0, 1, 2].map((i) => ({
    frequency: (0.0025 + rand() * 0.004) * (i + 1),
    phase: rand() * Math.PI * 2,
    weight: [0.55, 0.3, 0.15][i],
  }));
  const step = options.jagged ? 16 : 24;
  let d = `M0 ${H}`;
  for (let x = 0; x <= W; x += step) {
    let lift = 0;
    for (const wave of waves) lift += (Math.sin(x * wave.frequency + wave.phase) * 0.5 + 0.5) * wave.weight;
    let y = options.base - lift * options.height;
    if (options.peak) {
      const distance = (x - options.peak.x) / options.peak.width;
      y -= options.peak.height * Math.exp(-distance * distance);
    }
    if (options.jagged) y -= rand() * options.jagged;
    d += ` L${x} ${n(y)}`;
  }
  d += ` L${W} ${H} Z`;
  return `<path d="${d}" fill="${options.color}"${options.opacity ? ` opacity="${options.opacity}"` : ""}/>`;
}

function dune(seed: number, base: number, height: number, color: string): string {
  const rand = random(seed);
  const phase = rand() * Math.PI * 2;
  const frequency = 0.0018 + rand() * 0.0022;
  let d = `M0 ${H}`;
  for (let x = 0; x <= W; x += 20) {
    const y = base - (Math.sin(x * frequency + phase) * 0.5 + 0.5) * height - Math.sin(x * frequency * 2.7 + phase) * height * 0.12;
    d += ` L${x} ${n(y)}`;
  }
  return `<path d="${d} L${W} ${H} Z" fill="${color}"/>`;
}

function houses(seed: number, base: number, from: number, to: number, color: string, lit: number): string {
  const rand = random(seed);
  let out = "";
  let x = from;
  while (x < to) {
    const width = 46 + rand() * 80;
    const height = 30 + rand() * 62;
    const y = base - height + (rand() - 0.5) * 14;
    out += `<rect x="${n(x)}" y="${n(y)}" width="${n(width)}" height="${n(height + 40)}" fill="${color}"/>`;
    if (rand() < 0.5) out += `<rect x="${n(x + width * 0.55)}" y="${n(y - 12)}" width="${n(width * 0.3)}" height="14" fill="${color}"/>`;
    if (rand() < lit) {
      out += `<rect x="${n(x + 10 + rand() * (width - 26))}" y="${n(y + 12 + rand() * 12)}" width="6" height="10" fill="#e9b566" opacity="${(0.55 + rand() * 0.4).toFixed(2)}"/>`;
    }
    x += width + rand() * 14 - 4;
  }
  return out;
}

function palm(x: number, base: number, height: number, lean: number, color: string, seed: number): string {
  const rand = random(seed);
  const topX = x + lean;
  const topY = base - height;
  let out = `<path d="M${n(x)} ${base} Q${n(x + lean * 0.2)} ${n(base - height * 0.55)} ${n(topX)} ${n(topY)}" stroke="${color}" stroke-width="${n(height * 0.045)}" fill="none" stroke-linecap="round"/>`;
  for (let i = 0; i < 9; i++) {
    const angle = Math.PI * (1.08 + (i / 8) * 0.84) + (rand() - 0.5) * 0.12;
    const length = height * (0.36 + rand() * 0.12);
    const endX = topX + Math.cos(angle) * length;
    const endY = topY + Math.sin(angle) * length * 0.55 + length * 0.42;
    const midX = topX + Math.cos(angle) * length * 0.55;
    const midY = topY + Math.sin(angle) * length * 0.6 - length * 0.08;
    out += `<path d="M${n(topX)} ${n(topY)} Q${n(midX)} ${n(midY)} ${n(endX)} ${n(endY)}" stroke="${color}" stroke-width="${n(height * 0.03)}" fill="none" stroke-linecap="round"/>`;
  }
  return out;
}

const haze = (y: number, height: number, color: string, opacity: number) =>
  `<defs><linearGradient id="haze${y}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${color}" stop-opacity="0"/><stop offset="1" stop-color="${color}" stop-opacity="${opacity}"/></linearGradient></defs><rect y="${y}" width="${W}" height="${height}" fill="url(#haze${y})"/>`;

const NIGHT: [number, string][] = [[0, "#0f1730"], [0.5, "#1f2a4a"], [0.8, "#3a3a5c"], [1, "#5a4a62"]];
const DAWN: [number, string][] = [[0, "#171b2e"], [0.4, "#3d3145"], [0.66, "#8f5a4c"], [0.82, "#d18f55"], [1, "#eec486"]];
const DUSK: [number, string][] = [[0, "#1b1a2c"], [0.45, "#4a3142"], [0.72, "#9a5740"], [0.9, "#c98045"], [1, "#d99a58"]];
const DAY: [number, string][] = [[0, "#8fa3a6"], [0.5, "#c3bfa5"], [1, "#e3cfa4"]];

const scenes: Record<string, string> = {
  "mountains/hira-night.svg":
    sky("s", NIGHT) + stars(11, 260, 620) + moon(1240, 170, 34, "#141d39") +
    ridge({ seed: 3, base: 700, height: 120, jagged: 10, color: "#2a2c47" }) +
    ridge({ seed: 5, base: 790, height: 90, jagged: 16, peak: { x: 640, width: 330, height: 430 }, color: "#181a2c" }) +
    ridge({ seed: 8, base: 900, height: 80, jagged: 12, color: "#0d0e18" }),

  "mountains/ridges-dusk.svg":
    sky("s", DUSK) + sun(1100, 640, 160, "#f0b06a") +
    ridge({ seed: 21, base: 640, height: 150, jagged: 8, color: "#6b4544" }) +
    haze(520, 200, "#d99a58", 0.25) +
    ridge({ seed: 22, base: 740, height: 170, jagged: 12, color: "#3f2b33" }) +
    ridge({ seed: 23, base: 880, height: 150, jagged: 14, color: "#1c1520" }),

  "makkah/valley-night.svg":
    sky("s", NIGHT) + stars(31, 220, 520) +
    ridge({ seed: 32, base: 600, height: 210, jagged: 12, color: "#2c2e4a" }) +
    ridge({ seed: 33, base: 700, height: 150, jagged: 10, peak: { x: 1250, width: 260, height: 160 }, color: "#1c1e33" }) +
    houses(34, 770, 380, 1180, "#12131f", 0.35) +
    ridge({ seed: 35, base: 900, height: 90, jagged: 8, color: "#0b0c14" }),

  "makkah/valley-dawn.svg":
    sky("s", DAWN) + sun(820, 600, 190, "#f6cf8e") +
    ridge({ seed: 41, base: 610, height: 190, jagged: 10, color: "#7a5350" }) +
    haze(480, 220, "#eec486", 0.3) +
    ridge({ seed: 42, base: 700, height: 150, jagged: 10, peak: { x: 300, width: 280, height: 150 }, color: "#4a3138" }) +
    houses(43, 780, 420, 1240, "#2a1c22", 0.08) +
    ridge({ seed: 44, base: 900, height: 80, jagged: 8, color: "#170f14" }),

  "makkah/homes-night.svg":
    sky("s", NIGHT) + stars(51, 160, 420) + moon(260, 150, 26, "#121a35") +
    ridge({ seed: 52, base: 560, height: 160, jagged: 10, color: "#2a2c47" }) +
    houses(53, 640, -20, 1640, "#1a1c2f", 0.3) +
    houses(54, 790, -40, 1640, "#10111c", 0.55) +
    `<rect y="800" width="${W}" height="100" fill="#0b0c14"/>`,

  "desert/night-sky.svg":
    sky("s", [[0, "#0c1228"], [0.6, "#1b2545"], [1, "#3d3a5e"]]) + stars(61, 520, 800) + stars(62, 140, 400) +
    ridge({ seed: 63, base: 880, height: 90, jagged: 10, color: "#0d0e18" }),

  "desert/dunes-dawn.svg":
    sky("s", DAWN) + sun(1050, 590, 200, "#f6cf8e") +
    dune(71, 640, 70, "#b07a55") + dune(72, 720, 110, "#8a5a44") + dune(73, 820, 120, "#5e3b33") + dune(74, 910, 90, "#35222a"),

  "desert/dunes-day.svg":
    sky("s", DAY) +
    dune(81, 600, 60, "#d3b98a") + dune(82, 690, 110, "#c2a172") + dune(83, 790, 130, "#a8855b") + dune(84, 900, 100, "#7f6245"),

  "desert/dunes-night.svg":
    sky("s", NIGHT) + stars(91, 300, 600) + moon(380, 190, 30, "#141d39") +
    dune(92, 650, 70, "#34365a") + dune(93, 740, 110, "#262844") + dune(94, 840, 120, "#191b30") + dune(95, 920, 80, "#0d0e18"),

  "desert/oasis-dusk.svg":
    sky("s", DUSK) + sun(500, 640, 170, "#f0b06a") +
    dune(101, 660, 60, "#8b5a44") + dune(102, 760, 90, "#583a37") +
    palm(1040, 800, 330, 40, "#1c141b", 1) + palm(1180, 810, 400, -30, "#1c141b", 2) + palm(1300, 805, 290, 55, "#1c141b", 3) +
    palm(900, 815, 240, -20, "#1c141b", 4) + palm(1420, 815, 250, 20, "#1c141b", 5) +
    dune(103, 900, 100, "#1c141b"),
};

// ---- Map: Arabia between the empires. Equirectangular, lon 28-66, lat 12.3-32.2.
const project = ([lon, lat]: [number, number]) => `${n(((lon - 28) / 38) * W)} ${n(((32.2 - lat) / 19.9) * H)}`;
const land = (points: [number, number][], fill: string) => `<path d="M${points.map(project).join(" L")} Z" fill="${fill}"/>`;
const place = (lon: number, lat: number, name: string, dx = 14, dy = 6) => {
  const [x, y] = project([lon, lat]).split(" ").map(Number);
  return `<circle cx="${x}" cy="${y}" r="6" fill="#e2b46a"/><text x="${x + dx}" y="${y + dy}" font-size="26" fill="#f1e6cf">${name}</text>`;
};
const region = (lon: number, lat: number, name: string) => {
  const [x, y] = project([lon, lat]).split(" ").map(Number);
  return `<text x="${x}" y="${y}" font-size="24" letter-spacing="6" fill="#b9a583" opacity="0.8" text-anchor="middle">${name}</text>`;
};

const arabia: [number, number][] = [
  [34.9, 29.5], [36.5, 26], [38, 24], [39.1, 21.5], [41, 18], [42.7, 15], [43.3, 12.7], [45, 12.8], [48.5, 14], [52, 16.5],
  [55, 17.5], [57.8, 19], [59.8, 22.5], [58.6, 23.6], [56.4, 24.8], [56.3, 26.3], [55.3, 25.3], [54, 24.2], [51.6, 24.3],
  [51.5, 26.1], [50.8, 25.2], [50.2, 26.5], [49.5, 27.5], [48.5, 28.5], [48, 29.8], [48.6, 30.4], [50.5, 29.6], [52, 27.6],
  [54.5, 26.6], [56.5, 27], [57.5, 25.5], [61, 25.2], [66, 25.3], [66, 36], [35.5, 36], [35.6, 33], [34.8, 32], [34.3, 31.3],
  [32.5, 31.2], [32.5, 30], [33.5, 28.5], [34.2, 27.8],
];
const africa: [number, number][] = [
  [26, 36], [26, 31.2], [32.3, 31.3], [32.4, 30], [33.4, 27.6], [35, 24.5], [37, 21], [37.4, 18.5], [39.5, 15.5], [41.5, 13.5],
  [43.2, 12.3], [43.3, 11.5], [45, 10.5], [48, 11.3], [51.2, 11.8], [50, 8], [26, 8],
];
const route = ([[44.2, 15.35], [42.9, 18.4], [39.83, 21.42], [39.61, 24.47], [37.6, 27.6], [36.2, 30.6], [36.3, 32.6]] as [number, number][])
  .map(project).join(" L");

scenes["maps/arabia.svg"] =
  `<rect width="${W}" height="${H}" fill="#18222b"/>` +
  land(africa, "#3b3229") + land(arabia, "#4a3d2e") +
  `<path d="M${route}" fill="none" stroke="#e2b46a" stroke-width="3" stroke-dasharray="4 12" stroke-linecap="round" opacity="0.8"/>` +
  `<g font-family="Georgia, 'Times New Roman', serif">` +
  region(33.5, 33.6 - 2.2, "BYZANTINE EMPIRE") + region(56, 30.6, "PERSIAN EMPIRE") + region(34.5, 15.5, "ABYSSINIA") +
  region(47.5, 22.6, "ARABIA") + region(46.6, 15.6, "YEMEN") +
  place(39.83, 21.42, "Makkah") + place(39.61, 24.47, "Yathrib") + place(44.1, 17.5, "Najran") + place(44.2, 15.35, "Sana'a", 14, 26) +
  `</g>`;

for (const [file, body] of Object.entries(scenes)) {
  const target = path.join(root, "public/images", file);
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${body}</svg>\n`);
}

// App icon and default share image.
const icon = (size: number, inset: number) => {
  const s = size;
  const horizon = s * 0.62;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${s} ${s}" width="${s}" height="${s}">` +
    `<defs><linearGradient id="i" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#10131f"/><stop offset="0.62" stop-color="#3a2a33"/><stop offset="1" stop-color="#c98a4b"/></linearGradient></defs>` +
    `<rect width="${s}" height="${s}" fill="url(#i)"/>` +
    `<circle cx="${s * 0.66}" cy="${s * 0.3}" r="${s * 0.07}" fill="#f1e2c0"/><circle cx="${s * 0.69}" cy="${s * 0.288}" r="${s * 0.064}" fill="#151724"/>` +
    `<path d="M0 ${s} L0 ${horizon + s * 0.12} L${s * 0.22} ${horizon} L${s * 0.36} ${horizon + s * 0.07} L${s * 0.52} ${horizon - s * 0.2 + inset} L${s * 0.68} ${horizon + s * 0.05} L${s * 0.84} ${horizon - s * 0.04} L${s} ${horizon + s * 0.1} L${s} ${s} Z" fill="#0c0b11"/>` +
    `</svg>\n`
  );
};
mkdirSync(path.join(root, "public/icons"), { recursive: true });
writeFileSync(path.join(root, "public/icons/icon.svg"), icon(512, 0));
writeFileSync(path.join(root, "public/icons/icon-maskable.svg"), icon(512, 40));
console.log(`visuals: ${Object.keys(scenes).length} scenes, 2 icons`);
