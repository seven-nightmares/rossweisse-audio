/**
 * Original placeholder "photos" for the demo: simple hi-fi illustrations drawn as SVG,
 * on a neutral grey studio sweep so they sit well in both the light and dark site themes.
 * Every drawing is generated here from shapes; nothing is traced or copied.
 * Real photography replaces these when staff add inventory.
 */

export const W = 1200;
export const H = 900;
export const HERO_W = 2100;

const FACES = [
	{ face: '#c9ced4', face2: '#a9b0b8', ink: '#1b1e23', edge: '#7d848d' }, // brushed silver
	{ face: '#1c1f24', face2: '#121418', ink: '#d7dde3', edge: '#3a404a' }, // black
	{ face: '#d8c9a5', face2: '#bfae86', ink: '#2b2418', edge: '#8f805e' } // champagne
];
const GLOWS = ['#4db4ff', '#ffb347', '#5fe0a8'];
const WOODS = ['#6b4428', '#4a2f1d', '#8a5a34'];

const esc = (s) =>
	String(s).replace(
		/[&<>"']/g,
		(c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
	);

/** Small deterministic PRNG so the same seed always draws the same picture. */
export function rng(seed) {
	let a = seed >>> 0;
	return () => {
		a = (a + 0x6d2b79f5) >>> 0;
		let t = a;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

const pick = (r, list) => list[Math.floor(r() * list.length)];

function palette(seed) {
	const r = rng(seed * 7919 + 13);
	return { ...pick(r, FACES), glow: pick(r, GLOWS), wood: pick(r, WOODS), r };
}

/* ---------- primitives ---------- */

function defs(p) {
	return `<defs>
  <radialGradient id="bg" cx="50%" cy="35%" r="75%">
    <stop offset="0" stop-color="#f3f1ee"/><stop offset=".6" stop-color="#e4e1dc"/><stop offset="1" stop-color="#d3cfc9"/>
  </radialGradient>
  <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#dcd8d2"/><stop offset="1" stop-color="#cbc6bf"/>
  </linearGradient>
  <linearGradient id="face" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${p.face}"/><stop offset="1" stop-color="${p.face2}"/>
  </linearGradient>
  <radialGradient id="meter" cx="50%" cy="85%" r="90%">
    <stop offset="0" stop-color="${p.glow}" stop-opacity=".95"/><stop offset="1" stop-color="${p.glow}" stop-opacity=".35"/>
  </radialGradient>
  <radialGradient id="knob" cx="35%" cy="30%" r="80%">
    <stop offset="0" stop-color="#f2f4f6"/><stop offset=".55" stop-color="#9aa1aa"/><stop offset="1" stop-color="#3b4148"/>
  </radialGradient>
  <radialGradient id="cone" cx="45%" cy="40%" r="70%">
    <stop offset="0" stop-color="#3a3f46"/><stop offset=".7" stop-color="#15181c"/><stop offset="1" stop-color="#0b0d10"/>
  </radialGradient>
  <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
    <feGaussianBlur stdDeviation="14" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
</defs>`;
}

function backdrop() {
	return `<rect width="${W}" height="${H}" fill="url(#bg)"/>
<rect y="690" width="${W}" height="${H - 690}" fill="url(#floor)"/>
<line x1="0" y1="690" x2="${W}" y2="690" stroke="#d2cdc6" stroke-width="2"/>`;
}

/** A component chassis sitting on the floor line, with feet and a soft reflection. */
function chassis(p, x, y, w, h, { wood = false } = {}) {
	const cheek = wood
		? `<rect x="${x - 34}" y="${y - 8}" width="40" height="${h + 16}" rx="8" fill="${p.wood}"/>
       <rect x="${x + w - 6}" y="${y - 8}" width="40" height="${h + 16}" rx="8" fill="${p.wood}"/>`
		: '';
	return `<ellipse cx="${x + w / 2}" cy="${y + h + 30}" rx="${w * 0.55}" ry="22" fill="#3a342c" opacity=".28"/>
${cheek}
<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="url(#face)" stroke="${p.edge}" stroke-width="3"/>
<rect x="${x + 6}" y="${y + 6}" width="${w - 12}" height="6" rx="3" fill="#fff" opacity=".18"/>
<rect x="${x + 40}" y="${y + h}" width="60" height="14" rx="4" fill="#0d0f12"/>
<rect x="${x + w - 100}" y="${y + h}" width="60" height="14" rx="4" fill="#0d0f12"/>`;
}

function label(p, x, y, text, size = 22, anchor = 'start', weight = 700) {
	return `<text x="${x}" y="${y}" fill="${p.ink}" font-family="Inter, Arial, sans-serif" font-size="${size}" font-weight="${weight}" letter-spacing="2" text-anchor="${anchor}">${esc(text)}</text>`;
}

function meter(p, x, y, w, h, swing) {
	const cx = x + w / 2;
	const cy = y + h * 0.95;
	const rad = h * 0.75;
	const ticks = Array.from({ length: 11 }, (_, i) => {
		const a = Math.PI * (1.15 + (i / 10) * 0.7);
		const x1 = cx + Math.cos(a) * rad;
		const y1 = cy + Math.sin(a) * rad;
		const x2 = cx + Math.cos(a) * (rad - (i % 5 === 0 ? 22 : 12));
		const y2 = cy + Math.sin(a) * (rad - (i % 5 === 0 ? 22 : 12));
		return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#0b1016" stroke-width="3"/>`;
	}).join('');
	const a = Math.PI * (1.15 + swing * 0.7);
	return `<g>
<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="url(#meter)" filter="url(#glow)"/>
<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="none" stroke="#0b1016" stroke-width="4"/>
${ticks}
<line x1="${cx}" y1="${cy}" x2="${(cx + Math.cos(a) * (rad + 6)).toFixed(1)}" y2="${(cy + Math.sin(a) * (rad + 6)).toFixed(1)}" stroke="#0b1016" stroke-width="4" stroke-linecap="round"/>
<text x="${cx}" y="${y + h * 0.42}" fill="#0b1016" font-family="Inter, Arial, sans-serif" font-size="${Math.round(h * 0.12)}" font-weight="700" text-anchor="middle">VU</text>
</g>`;
}

function knob(cx, cy, r, angle = -40) {
	const a = (angle * Math.PI) / 180;
	return `<circle cx="${cx}" cy="${cy}" r="${r + 4}" fill="#0d0f12" opacity=".6"/>
<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#knob)" stroke="#2b3036" stroke-width="2"/>
<line x1="${cx}" y1="${cy}" x2="${(cx + Math.sin(a) * r * 0.8).toFixed(1)}" y2="${(cy - Math.cos(a) * r * 0.8).toFixed(1)}" stroke="#15181c" stroke-width="${Math.max(2, r / 8)}" stroke-linecap="round"/>`;
}

function knobRow(p, x, y, w, n, r) {
	return Array.from({ length: n }, (_, i) =>
		knob(x + (w / (n - 1 || 1)) * i, y, r, -120 + p.r() * 240)
	).join('');
}

function switches(x, y, n, gap = 46) {
	return Array.from(
		{ length: n },
		(_, i) =>
			`<rect x="${x + i * gap}" y="${y}" width="14" height="30" rx="4" fill="#2a2f36"/><rect x="${x + i * gap + 3}" y="${y + 3}" width="8" height="12" rx="2" fill="#c3c9cf"/>`
	).join('');
}

function cone(cx, cy, r) {
	return `<circle cx="${cx}" cy="${cy}" r="${r + 10}" fill="#0b0d10"/>
<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#cone)" stroke="#2a2f36" stroke-width="4"/>
<circle cx="${cx}" cy="${cy}" r="${r * 0.28}" fill="#23272d" stroke="#3a4048" stroke-width="3"/>`;
}

/** One floorstanding speaker, 280 wide, standing on the floor line. */
function floorSpeaker(p, x, brand) {
	return `<ellipse cx="${x + 140}" cy="720" rx="170" ry="20" fill="#3a342c" opacity=".28"/>
<rect x="${x}" y="150" width="280" height="560" rx="14" fill="${p.wood}" stroke="#2a1b10" stroke-width="4"/>
<rect x="${x + 14}" y="164" width="252" height="532" rx="8" fill="#16191d"/>
${cone(x + 140, 240, 34)}${cone(x + 140, 370, 62)}${cone(x + 140, 560, 100)}
<text x="${x + 140}" y="685" fill="#9aa1aa" font-family="Inter, Arial, sans-serif" font-size="14" font-weight="700" letter-spacing="3" text-anchor="middle">${esc(brand.toUpperCase())}</text>`;
}

/* ---------- drawings by kind ---------- */

const kinds = {
	'power-amp': (p, t) => {
		const x = 150,
			y = 300,
			w = 900,
			h = 330;
		return `${chassis(p, x, y, w, h)}
<rect x="${x - 26}" y="${y + 40}" width="22" height="${h - 80}" rx="10" fill="#9aa1aa"/>
<rect x="${x + w + 4}" y="${y + 40}" width="22" height="${h - 80}" rx="10" fill="#9aa1aa"/>
${meter(p, x + 70, y + 50, 330, 170, 0.35 + p.r() * 0.4)}
${meter(p, x + w - 400, y + 50, 330, 170, 0.35 + p.r() * 0.4)}
${knob(x + 150, y + 270, 26)}${knob(x + w - 150, y + 270, 26)}
${label(p, x + w / 2, y + 280, t.brand, 24, 'middle')}
${label(p, x + w / 2, y + 306, t.model, 16, 'middle', 500)}`;
	},
	integrated: (p, t) => {
		const x = 170,
			y = 330,
			w = 860,
			h = 300;
		return `${chassis(p, x, y, w, h, { wood: p.r() > 0.5 })}
${meter(p, x + 60, y + 40, 220, 120, 0.3 + p.r() * 0.5)}
${meter(p, x + 300, y + 40, 220, 120, 0.3 + p.r() * 0.5)}
${knob(x + w - 150, y + 110, 70, -60 + p.r() * 120)}
${knobRow(p, x + 80, y + 225, 430, 5, 22)}
${switches(x + 580, y + 210, 4)}
${label(p, x + 60, y + 190, t.brand, 20)}${label(p, x + 330, y + 190, t.model, 16, 'start', 500)}`;
	},
	preamp: (p, t) => {
		const x = 160,
			y = 420,
			w = 880,
			h = 170;
		return `${chassis(p, x, y, w, h)}
${knobRow(p, x + 90, y + 95, 520, 6, 26)}
<rect x="${x + 680}" y="${y + 55}" width="150" height="56" rx="6" fill="#071019"/>
<text x="${x + 755}" y="${y + 93}" fill="${p.glow}" font-family="monospace" font-size="30" text-anchor="middle" filter="url(#glow)">-32.5</text>
${label(p, x + 40, y + 36, t.brand, 18)}${label(p, x + w - 40, y + 150, t.model, 14, 'end', 500)}`;
	},
	receiver: (p, t) => {
		const x = 130,
			y = 320,
			w = 940,
			h = 310;
		const ticks = Array.from(
			{ length: 21 },
			(_, i) =>
				`<line x1="${x + 90 + i * 30}" y1="${y + 70}" x2="${x + 90 + i * 30}" y2="${y + (i % 2 ? 84 : 94)}" stroke="#0b1016" stroke-width="2"/>`
		).join('');
		return `${chassis(p, x, y, w, h, { wood: true })}
<rect x="${x + 50}" y="${y + 40}" width="${w - 100}" height="120" rx="6" fill="url(#meter)" filter="url(#glow)"/>
<rect x="${x + 50}" y="${y + 40}" width="${w - 100}" height="120" rx="6" fill="none" stroke="#0b1016" stroke-width="4"/>
${ticks}
<text x="${x + 90}" y="${y + 128}" fill="#0b1016" font-family="Inter, Arial, sans-serif" font-size="18">FM  88  92  96  100  104  108 MHz</text>
<line x1="${x + 240 + p.r() * 400}" y1="${y + 50}" x2="${x + 240 + p.r() * 400}" y2="${y + 150}" stroke="#d33" stroke-width="4"/>
${knobRow(p, x + 90, y + 230, 560, 6, 24)}
${knob(x + w - 130, y + 230, 52)}
${label(p, x + 60, y + 290, t.brand, 18)}${label(p, x + w - 60, y + 290, t.model, 14, 'end', 500)}`;
	},
	tuner: (p, t) => {
		const x = 150,
			y = 410,
			w = 900,
			h = 190;
		return `${chassis(p, x, y, w, h, { wood: p.r() > 0.4 })}
<rect x="${x + 40}" y="${y + 35}" width="560" height="90" rx="6" fill="url(#meter)" filter="url(#glow)"/>
<text x="${x + 70}" y="${y + 90}" fill="#0b1016" font-family="Inter, Arial, sans-serif" font-size="20">88   92   96   100   104   108</text>
<line x1="${x + 200 + p.r() * 300}" y1="${y + 40}" x2="${x + 200 + p.r() * 300}" y2="${y + 120}" stroke="#d33" stroke-width="4"/>
${meter(p, x + 630, y + 35, 120, 90, 0.7)}
${knob(x + w - 80, y + 85, 46)}
${label(p, x + 40, y + 165, t.brand, 16)}${label(p, x + 600, y + 165, t.model, 14, 'end', 500)}`;
	},
	turntable: (p, t) => {
		const px = 230,
			py = 170,
			pw = 740,
			ph = 520;
		const grooves = Array.from(
			{ length: 9 },
			(_, i) =>
				`<circle cx="560" cy="430" r="${110 + i * 11}" fill="none" stroke="#2a2f36" stroke-width="1.5"/>`
		).join('');
		return `<ellipse cx="600" cy="720" rx="420" ry="26" fill="#3a342c" opacity=".28"/>
<rect x="${px}" y="${py}" width="${pw}" height="${ph}" rx="18" fill="${p.wood}" stroke="#2a1b10" stroke-width="4"/>
<rect x="${px + 14}" y="${py + 14}" width="${pw - 28}" height="${ph - 28}" rx="12" fill="url(#face)" opacity=".92"/>
<circle cx="560" cy="430" r="225" fill="#2f343b" stroke="#9aa1aa" stroke-width="6"/>
<circle cx="560" cy="430" r="212" fill="#0b0c0e"/>
${grooves}
<circle cx="560" cy="430" r="62" fill="${p.glow}" opacity=".85"/>
<circle cx="560" cy="430" r="8" fill="#d7dde3"/>
<circle cx="860" cy="250" r="34" fill="url(#knob)" stroke="#2b3036" stroke-width="2"/>
<path d="M860 250 L850 470 L690 560" fill="none" stroke="#c9ced4" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>
<rect x="660" y="545" width="44" height="30" rx="5" fill="#1b1e23" transform="rotate(-28 682 560)"/>
<rect x="890" y="300" width="40" height="70" rx="8" fill="#9aa1aa"/>
${knob(300, 640, 20)}${knob(360, 640, 20)}
${label(p, px + pw - 40, py + ph - 30, t.brand, 16, 'end')}`;
	},
	speakers: (p, t) => floorSpeaker(p, 230, t.brand) + floorSpeaker(p, 690, t.brand),
	bookshelf: (p, t) => {
		const one = (
			x
		) => `<ellipse cx="${x + 120}" cy="720" rx="150" ry="18" fill="#3a342c" opacity=".28"/>
<rect x="${x + 60}" y="600" width="120" height="110" fill="#1b1e23"/>
<rect x="${x}" y="300" width="240" height="300" rx="12" fill="${p.wood}" stroke="#2a1b10" stroke-width="4"/>
<rect x="${x + 12}" y="312" width="216" height="276" rx="6" fill="#16191d"/>
${cone(x + 120, 375, 28)}${cone(x + 120, 490, 70)}
<text x="${x + 120}" y="580" fill="#9aa1aa" font-family="Inter, Arial, sans-serif" font-size="12" font-weight="700" letter-spacing="3" text-anchor="middle">${esc(t.brand.toUpperCase())}</text>`;
		return one(270) + one(690);
	},
	'tape-deck': (p, t) => {
		const x = 160,
			y = 330,
			w = 880,
			h = 300;
		return `${chassis(p, x, y, w, h)}
<rect x="${x + 50}" y="${y + 40}" width="380" height="200" rx="10" fill="#0d1014" stroke="#3a404a" stroke-width="3"/>
<rect x="${x + 80}" y="${y + 75}" width="320" height="120" rx="8" fill="#2a2f36"/>
<circle cx="${x + 170}" cy="${y + 135}" r="34" fill="#d7dde3"/><circle cx="${x + 170}" cy="${y + 135}" r="12" fill="#2a2f36"/>
<circle cx="${x + 310}" cy="${y + 135}" r="34" fill="#d7dde3"/><circle cx="${x + 310}" cy="${y + 135}" r="12" fill="#2a2f36"/>
${meter(p, x + 470, y + 40, 170, 100, 0.55)}${meter(p, x + 660, y + 40, 170, 100, 0.5)}
${Array.from({ length: 6 }, (_, i) => `<rect x="${x + 470 + i * 62}" y="${y + 175}" width="50" height="34" rx="5" fill="#2a2f36" stroke="#4a515b" stroke-width="2"/>`).join('')}
${knob(x + 520, y + 255, 18)}${knob(x + 580, y + 255, 18)}
${label(p, x + 50, y + 275, t.brand, 18)}${label(p, x + w - 40, y + 275, t.model, 14, 'end', 500)}`;
	},
	reel: (p, t) => {
		const x = 300,
			y = 90,
			w = 600,
			h = 600;
		const reel = (
			cx
		) => `<circle cx="${cx}" cy="${y + 170}" r="130" fill="#b9c0c8" stroke="#5a616b" stroke-width="4"/>
${[0, 120, 240].map((a) => `<circle cx="${(cx + Math.cos((a * Math.PI) / 180) * 70).toFixed(1)}" cy="${(y + 170 + Math.sin((a * Math.PI) / 180) * 70).toFixed(1)}" r="34" fill="#11151b"/>`).join('')}
<circle cx="${cx}" cy="${y + 170}" r="16" fill="#2a2f36"/>`;
		return `${chassis(p, x, y, w, h)}
${reel(x + 155)}${reel(x + w - 155)}
<rect x="${x + 60}" y="${y + 330}" width="${w - 120}" height="70" rx="8" fill="#0d1014"/>
<path d="M${x + 155} ${y + 300} L${x + 200} ${y + 365} L${x + w - 200} ${y + 365} L${x + w - 155} ${y + 300}" fill="none" stroke="#5a3a22" stroke-width="4"/>
${meter(p, x + 70, y + 420, 200, 100, 0.5)}${meter(p, x + w - 270, y + 420, 200, 100, 0.45)}
${knobRow(p, x + 110, y + 560, 380, 4, 18)}
${label(p, x + w / 2, y + 40, t.brand, 18, 'middle')}`;
	},
	cd: (p, t) => {
		const x = 160,
			y = 440,
			w = 880,
			h = 150;
		return `${chassis(p, x, y, w, h)}
<rect x="${x + 50}" y="${y + 30}" width="380" height="26" rx="5" fill="#0d1014"/>
<rect x="${x + 500}" y="${y + 30}" width="230" height="64" rx="6" fill="#071019"/>
<text x="${x + 615}" y="${y + 73}" fill="${p.glow}" font-family="monospace" font-size="30" text-anchor="middle" filter="url(#glow)">03  4:21</text>
${Array.from({ length: 5 }, (_, i) => `<circle cx="${x + 70 + i * 50}" cy="${y + 105}" r="13" fill="#2a2f36" stroke="#4a515b" stroke-width="2"/>`).join('')}
${knob(x + w - 80, y + 75, 32)}
${label(p, x + 500, y + 128, t.brand, 16)}${label(p, x + 50, y + 135, t.model, 13, 'start', 500)}`;
	},
	dac: (p, t) => {
		const x = 300,
			y = 450,
			w = 600,
			h = 150;
		return `${chassis(p, x, y, w, h)}
<rect x="${x + 50}" y="${y + 35}" width="300" height="80" rx="6" fill="#071019"/>
<text x="${x + 200}" y="${y + 70}" fill="${p.glow}" font-family="monospace" font-size="24" text-anchor="middle" filter="url(#glow)">USB  192k</text>
<text x="${x + 200}" y="${y + 100}" fill="${p.glow}" font-family="monospace" font-size="18" text-anchor="middle" opacity=".8">-18.0 dB</text>
${knob(x + w - 110, y + 75, 44)}
${label(p, x + 50, y + 138, t.brand, 14)}`;
	},
	cartridge: (p, t) => {
		return `<ellipse cx="600" cy="720" rx="320" ry="22" fill="#3a342c" opacity=".28"/>
<rect x="360" y="210" width="480" height="70" rx="10" fill="#9aa1aa" stroke="#4a515b" stroke-width="3"/>
<circle cx="470" cy="245" r="14" fill="#2a2f36"/><circle cx="730" cy="245" r="14" fill="#2a2f36"/>
<path d="M420 280 L780 280 L740 560 L460 560 Z" fill="${p.glow}" stroke="#0b1016" stroke-width="4" opacity=".92"/>
<path d="M420 280 L780 280 L740 560 L460 560 Z" fill="url(#face)" opacity=".35"/>
<line x1="600" y1="560" x2="690" y2="640" stroke="#d7dde3" stroke-width="7" stroke-linecap="round"/>
<circle cx="694" cy="644" r="7" fill="#fff"/>
${['#d33', '#3a6', '#36c', '#ddd'].map((c, i) => `<rect x="${480 + i * 70}" y="140" width="22" height="70" rx="4" fill="${c}"/>`).join('')}
<text x="600" y="430" fill="#0b1016" font-family="Inter, Arial, sans-serif" font-size="34" font-weight="800" letter-spacing="3" text-anchor="middle">${esc(t.model)}</text>
<text x="600" y="475" fill="#0b1016" font-family="Inter, Arial, sans-serif" font-size="18" font-weight="700" letter-spacing="3" text-anchor="middle">${esc(t.brand.toUpperCase())}</text>`;
	},
	cable: (p) => {
		const plug = (
			x,
			y,
			c
		) => `<rect x="${x}" y="${y}" width="150" height="60" rx="12" fill="#1b1e23" stroke="#4a515b" stroke-width="3"/>
<rect x="${x + 150}" y="${y + 12}" width="70" height="36" rx="6" fill="#c9a24a"/>
<rect x="${x + 220}" y="${y + 24}" width="30" height="12" rx="4" fill="#d9b860"/>
<rect x="${x + 20}" y="${y + 22}" width="30" height="16" rx="3" fill="${c}"/>`;
		return `<path d="M200 330 C 520 180, 380 620, 760 560 S 1040 380, 980 640" fill="none" stroke="${p.glow}" stroke-width="22" stroke-linecap="round" opacity=".85"/>
<path d="M200 420 C 560 280, 420 700, 780 640 S 1060 470, 1000 700" fill="none" stroke="#9aa1aa" stroke-width="22" stroke-linecap="round" opacity=".85"/>
${plug(40, 300, '#d33')}${plug(40, 390, '#eee')}`;
	},
	headphones: (p) => {
		return `<ellipse cx="600" cy="720" rx="330" ry="22" fill="#3a342c" opacity=".28"/>
<path d="M330 520 C 330 180, 870 180, 870 520" fill="none" stroke="#2a2f36" stroke-width="40" stroke-linecap="round"/>
<path d="M330 520 C 330 200, 870 200, 870 520" fill="none" stroke="${p.wood}" stroke-width="14"/>
<rect x="250" y="440" width="150" height="240" rx="70" fill="url(#face)" stroke="${p.edge}" stroke-width="4"/>
<rect x="800" y="440" width="150" height="240" rx="70" fill="url(#face)" stroke="${p.edge}" stroke-width="4"/>
<circle cx="325" cy="560" r="40" fill="${p.glow}" opacity=".6"/><circle cx="875" cy="560" r="40" fill="${p.glow}" opacity=".6"/>`;
	}
};

/** Back panel used as a second or third view for boxed components. */
function rearPanel(p, t) {
	const x = 150,
		y = 320,
		w = 900,
		h = 300;
	const rca = (cx, cy, c) =>
		`<circle cx="${cx}" cy="${cy}" r="16" fill="#c9a24a"/><circle cx="${cx}" cy="${cy}" r="8" fill="#1b1e23"/><circle cx="${cx}" cy="${cy}" r="22" fill="none" stroke="${c}" stroke-width="4"/>`;
	const pairs = Array.from(
		{ length: 4 },
		(_, i) => rca(x + 90 + i * 90, y + 110, '#d33') + rca(x + 90 + i * 90, y + 180, '#eee')
	).join('');
	const posts = Array.from(
		{ length: 4 },
		(_, i) =>
			`<circle cx="${x + 520 + i * 70}" cy="${y + 145}" r="20" fill="${i % 2 ? '#222' : '#c22'}" stroke="#555" stroke-width="3"/>`
	).join('');
	return `${chassis({ ...p, face: '#1f2329', face2: '#16191d', edge: '#3a404a' }, x, y, w, h)}
${pairs}${posts}
<rect x="${x + w - 110}" y="${y + 110}" width="70" height="60" rx="6" fill="#0d0f12" stroke="#4a515b" stroke-width="3"/>
<text x="${x + 60}" y="${y + 50}" fill="#9aa1aa" font-family="Inter, Arial, sans-serif" font-size="16" letter-spacing="2">${esc(t.brand.toUpperCase())} · ${esc(t.model)} · MADE FOR DEMO PURPOSES</text>
<text x="${x + 60}" y="${y + 260}" fill="#7d848d" font-family="Inter, Arial, sans-serif" font-size="14">INPUTS · OUTPUTS · SPEAKERS · AC</text>`;
}

/** Zoomed-in crop per kind for the "detail" view. */
const DETAIL = {
	'power-amp': '180 320 520 390',
	integrated: '200 340 520 390',
	preamp: '580 400 480 360',
	receiver: '160 330 620 465',
	tuner: '170 400 560 420',
	turntable: '520 200 480 360',
	speakers: '230 150 320 240',
	bookshelf: '270 290 260 195',
	'tape-deck': '190 340 480 360',
	reel: '330 120 560 420',
	cd: '620 440 440 330',
	dac: '320 440 420 315',
	cartridge: '400 300 400 300',
	cable: '20 260 520 390',
	headphones: '220 400 420 315'
};

const BOXED = new Set([
	'power-amp',
	'integrated',
	'preamp',
	'receiver',
	'tuner',
	'tape-deck',
	'cd',
	'dac'
]);

export const VIEW_NAMES = ['front view', 'close-up detail', 'rear panel'];

/**
 * Draws one view of a product.
 * @param {{ kind: string, brand: string, model: string, seed: number, view: 1|2|3 }} opts
 */
export function drawProduct({ kind, brand, model, seed, view }) {
	const draw = kinds[kind];
	if (!draw) throw new Error(`Unknown art kind: ${kind}`);
	const p = palette(seed);
	const t = { brand, model };
	const body = view === 3 && BOXED.has(kind) ? rearPanel(p, t) : draw(p, t);
	const viewBox = view === 2 ? DETAIL[kind] : `0 0 ${W} ${H}`;
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${W}" height="${H}">${defs(p)}${backdrop()}${body}</svg>\n`;
}

export function viewCount(kind) {
	return BOXED.has(kind) ? 3 : 2;
}

/** Wide hero: a small listening-room rack with glowing meters between two speakers. */
export function drawHero() {
	const p = { ...palette(4242), glow: GLOWS[1], wood: WOODS[1] };
	// Gear sits on the right two-thirds; the left stays clear for the headline laid over it.
	// The amp is drawn in product coordinates (x 150–1050, y 300–644) and scaled onto the floor line.
	const amp = kinds['power-amp'](p, { brand: 'ROSSWEISSE', model: 'AUDIO' });
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${HERO_W} ${H}" width="${HERO_W}" height="${H}">${defs(p)}
<rect width="${HERO_W}" height="${H}" fill="url(#bg)"/>
<rect y="690" width="${HERO_W}" height="${H - 690}" fill="url(#floor)"/>
<line x1="0" y1="690" x2="${HERO_W}" y2="690" stroke="#d2cdc6" stroke-width="2"/>
${floorSpeaker(p, 940, 'Rossweisse')}
${floorSpeaker(p, 1760, 'Rossweisse')}
<g transform="translate(1150 304) scale(0.6)">${amp}</g>
</svg>
`;
}

/** Category tile art reuses a product drawing with a fixed seed. */
export function drawCategory(kind, seed) {
	return drawProduct({ kind, brand: 'Rossweisse', model: '', seed, view: 1 });
}
