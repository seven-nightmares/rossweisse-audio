/**
 * Generates the demo's sample content and placeholder art:
 *   src/lib/demo/content.json   (catalog content, in the raw CMS shape; M2's Strapi seed reads it too)
 *   static/demo/**.svg          (original illustrations)
 *
 * Everything here is invented: brands, models, prices and copy. Real inventory replaces it.
 *
 *   npm run demo:generate
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
	H,
	HERO_W,
	VIEW_NAMES,
	W,
	drawCategory,
	drawHero,
	drawProduct,
	viewCount
} from './demo-art.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const staticDir = path.join(root, 'static', 'demo');
const contentFile = path.join(root, 'src', 'lib', 'demo', 'content.json');

/* ---------- rich-text helpers (Strapi Blocks shape) ---------- */

const t = (text) => ({ type: 'text', text });
const b = (text) => ({ type: 'text', text, bold: true });
const link = (url, text) => ({ type: 'link', url, children: [t(text)] });
const p = (...parts) => ({
	type: 'paragraph',
	children: parts.map((x) => (typeof x === 'string' ? t(x) : x))
});
const h = (level, text) => ({ type: 'heading', level, children: [t(text)] });
const ul = (...items) => ({
	type: 'list',
	format: 'unordered',
	children: items.map((x) => ({
		type: 'list-item',
		children: (Array.isArray(x) ? x : [x]).map((y) => (typeof y === 'string' ? t(y) : y))
	}))
});

/* ---------- taxonomies ---------- */

const categories = [
	[
		'Amplifiers',
		'amplifiers',
		'power-amp',
		true,
		'Stereo and monoblock power amplifiers, tube and solid state.'
	],
	[
		'Integrated Amplifiers',
		'integrated-amplifiers',
		'integrated',
		true,
		'Preamp and power amp in one chassis.'
	],
	[
		'Preamplifiers',
		'preamplifiers',
		'preamp',
		false,
		'Line stages, phono stages and control centers.'
	],
	[
		'Receivers',
		'receivers',
		'receiver',
		true,
		'Amplifier and tuner together, many with glowing dial windows.'
	],
	['Speakers', 'speakers', 'speakers', true, 'Floorstanders, bookshelf monitors and horns.'],
	[
		'Turntables',
		'turntables',
		'turntable',
		true,
		'Belt, idler and direct drive, serviced and set up.'
	],
	[
		'Phono Cartridges',
		'phono-cartridges',
		'cartridge',
		false,
		'Moving magnet and moving coil, new and pre-owned.'
	],
	[
		'Tape Decks',
		'tape-decks',
		'tape-deck',
		true,
		'Cassette and reel-to-reel decks with fresh belts.'
	],
	['CD & Digital', 'cd-digital', 'dac', false, 'CD players, DACs and streamers.'],
	['Tuners', 'tuners', 'tuner', false, 'FM and AM/FM tuners for radio that still sounds right.'],
	['Cables & Interconnects', 'cables', 'cable', false, 'Interconnects and speaker cables.'],
	[
		'Accessories',
		'accessories',
		'headphones',
		false,
		'Headphones and the bits that finish a system.'
	]
].map(([name, slug, art, showOnHome, description], i) => ({
	name,
	slug,
	sortOrder: i + 1,
	description,
	showInMenu: true,
	showOnHome,
	image: {
		url: `demo/categories/${slug}.svg`,
		alternativeText: `Illustration representing ${name}`,
		width: W,
		height: H
	},
	art
}));

const brands = [
	[
		'Marlowe & Finch',
		'marlowe-finch',
		'United Kingdom',
		1957,
		'Hand-wired tube amplifiers and preamps from a small Midlands workshop.',
		false
	],
	[
		'Kestrel Audio Labs',
		'kestrel',
		'United States',
		1974,
		'Muscular, cool-running solid-state amplification.',
		false
	],
	[
		'Tsukimi Electric',
		'tsukimi',
		'Japan',
		1951,
		'Receivers, tuners and tape decks built to a very high standard.',
		false
	],
	[
		'Halvorsen Acoustics',
		'halvorsen',
		'Norway',
		1966,
		'Warm, room-friendly loudspeakers in real wood veneers.',
		false
	],
	[
		'Aldenbrook',
		'aldenbrook',
		'United States',
		1962,
		'Turntables and tonearms with a reputation for quiet running.',
		false
	],
	[
		'Vireo Digital',
		'vireo',
		'United States',
		2012,
		'Modern DACs and streamers. We are an authorized dealer.',
		true
	],
	[
		'Corvane Loudspeakers',
		'corvane',
		'United States',
		1979,
		'Horn-loaded and studio-monitor designs.',
		false
	],
	[
		'Brightwater Sound',
		'brightwater',
		'United States',
		1985,
		'Quiet, transparent preamplifiers and phono stages.',
		false
	],
	[
		'Okuda Precision',
		'okuda',
		'Japan',
		1969,
		'Phono cartridges and tonearms. We are an authorized dealer.',
		true
	],
	[
		'Lindqvist Kabel',
		'lindqvist',
		'Sweden',
		1996,
		'Braided interconnects and speaker cables. Authorized dealer.',
		true
	],
	[
		'Sorrel Radio Company',
		'sorrel',
		'United States',
		1946,
		'Classic tube tuners and receivers.',
		false
	]
].map(([name, slug, country, founded, blurb, authorizedDealer], i) => ({
	name,
	slug,
	sortOrder: i + 1,
	country,
	founded,
	blurb,
	authorizedDealer
}));
const brandName = Object.fromEntries(brands.map((x) => [x.slug, x.name]));

/* ---------- products ---------- */

const spec = (...pairs) => pairs.map(([label, value]) => ({ label, value }));
const LISTENED = 'Fully working. Tested on the bench and in our listening room.';

/** Compact product definitions; defaults are filled in below. */
const products = [
	{
		sku: 'RA-1001',
		title: 'Marlowe & Finch MF-40 Stereo Tube Amplifier',
		brand: 'marlowe-finch',
		model: 'MF-40',
		category: 'amplifiers',
		kind: 'power-amp',
		price: 3890,
		featured: true,
		arrivedOn: '2026-10-24',
		newOrUsed: 'pre-owned',
		era: 'vintage',
		technology: 'tube',
		voltage: '120v',
		conditionGrade: '6',
		summary:
			'A classic 40-watt-per-channel push-pull tube amp, recapped and fitted with new output tubes.',
		description: [
			p(
				'The MF-40 is the amplifier many people picture when they think of British tube hi-fi: two big meters, chrome transformers and a tone that flatters almost any speaker.'
			),
			p(
				'Forty watts per channel is enough for most efficient and moderately efficient speakers, and it runs cool enough to live in a living room.'
			)
		],
		serviceNotes:
			'Power supply rebuilt with new filter capacitors in September 2026. All coupling capacitors replaced. Bias checked and set to factory spec.',
		tubeNotes:
			'New matched quad of current-production EL34 output tubes. Driver tubes test strong.',
		cosmeticNotes:
			'Light wear to the faceplate lettering and some pitting on the transformer covers. One small scuff on the left handle.',
		ownershipHistory: 'Second owner; bought new by a local collector in 1964.',
		soundCharacter: 'Rich midrange, relaxed treble, surprisingly firm bass.',
		connections: 'RCA inputs, screw terminals for 4, 8 and 16 ohm speakers, captive power cord.',
		includedItems: 'Amplifier and tube cage.',
		yearsInProduction: '1961–1968',
		dimensions: '17 × 9 × 12 in (W × H × D)',
		weight: '48 lb',
		specs: spec(
			['Power output', '40 W per channel into 8 Ω'],
			['Frequency response', '18 Hz – 40 kHz, ±1 dB'],
			['Distortion', '< 0.5% at rated output'],
			['Output tubes', '4 × EL34']
		),
		recommendedWith: ['RA-1011', 'RA-1035', 'RA-1018']
	},
	{
		sku: 'RA-1002',
		title: 'Marlowe & Finch MF-75 Monoblock Amplifiers (Pair)',
		brand: 'marlowe-finch',
		model: 'MF-75',
		category: 'amplifiers',
		kind: 'power-amp',
		price: 7450,
		featured: true,
		rare: true,
		arrivedOn: '2026-10-21',
		newOrUsed: 'pre-owned',
		era: 'vintage',
		technology: 'tube',
		voltage: '120v',
		conditionGrade: '7',
		summary: 'A matched pair of 75-watt tube monoblocks with consecutive serial numbers.',
		description: [
			p(
				'Rarely seen as a matched pair, these monoblocks were the top of the Marlowe & Finch range. Each chassis drives one speaker with authority to spare.'
			)
		],
		serviceNotes:
			'Both units fully restored: new capacitors, resistors in the signal path checked and replaced where out of tolerance, new tube sockets for the output stage.',
		tubeNotes: 'New KT88 output tubes in both units; vintage driver tubes, all testing strong.',
		cosmeticNotes: 'Very clean for their age. A few hairline scratches on the top plates.',
		soundCharacter: 'Big, open and effortless.',
		connections: 'RCA input, binding posts for 4 and 8 ohm, IEC power socket on each unit.',
		includedItems: 'Both amplifiers, two power cords and tube cages.',
		yearsInProduction: '1964–1970',
		dimensions: '12 × 9 × 16 in each',
		weight: '55 lb each',
		specs: spec(
			['Power output', '75 W into 8 Ω (each)'],
			['Output tubes', '2 × KT88 per unit'],
			['Input sensitivity', '1.0 V']
		),
		recommendedWith: ['RA-1011', 'RA-1019']
	},
	{
		sku: 'RA-1003',
		title: 'Kestrel KA-250 Stereo Power Amplifier',
		brand: 'kestrel',
		model: 'KA-250',
		category: 'amplifiers',
		kind: 'power-amp',
		price: 1890,
		arrivedOn: '2026-10-12',
		newOrUsed: 'pre-owned',
		era: 'vintage',
		technology: 'solid-state',
		voltage: '120v',
		conditionGrade: '8',
		summary: '125 watts per channel of clean, solid-state power with big blue meters.',
		description: [
			p(
				'The KA-250 drives difficult speakers without breaking a sweat, and its meters are a joy to watch.'
			)
		],
		serviceNotes:
			'Cleaned throughout, output bias and DC offset set to spec, meter lamps replaced with warm LEDs.',
		cosmeticNotes: 'Excellent faceplate. Two light scratches on the top cover.',
		connections: 'RCA inputs, two sets of binding posts, captive power cord.',
		includedItems: 'Amplifier only.',
		yearsInProduction: '1979–1984',
		dimensions: '19 × 7 × 15 in',
		weight: '42 lb',
		specs: spec(
			['Power output', '125 W per channel into 8 Ω'],
			['Damping factor', '> 200'],
			['Signal-to-noise', '110 dB']
		),
		recommendedWith: ['RA-1010', 'RA-1017']
	},
	{
		sku: 'RA-1004',
		title: 'Kestrel KA-600 Reference Amplifier',
		brand: 'kestrel',
		model: 'KA-600',
		category: 'amplifiers',
		kind: 'power-amp',
		availability: 'on-hold',
		price: 5290,
		arrivedOn: '2026-10-05',
		newOrUsed: 'pre-owned',
		era: 'modern',
		technology: 'solid-state',
		voltage: 'switchable',
		conditionGrade: '9',
		summary: 'A modern 300-watt reference amplifier from a single careful owner.',
		description: [
			p(
				'Kestrel’s flagship of the 2010s. Balanced inputs, a massive power supply and very low noise.'
			)
		],
		cosmeticNotes: 'Near perfect. Faint marks on the underside from its rack shelf.',
		ownershipHistory: 'One owner, non-smoking home, original box and manual.',
		includedItems: 'Original box, manual, power cord.',
		connections: 'XLR and RCA inputs, two pairs of binding posts, IEC socket.',
		yearsInProduction: '2009–2016',
		dimensions: '19 × 9 × 20 in',
		weight: '88 lb',
		specs: spec(
			['Power output', '300 W per channel into 8 Ω'],
			['Inputs', 'Balanced XLR, single-ended RCA']
		)
	},
	{
		sku: 'RA-1005',
		title: 'Kestrel KA-120 Compact Amplifier',
		brand: 'kestrel',
		model: 'KA-120',
		category: 'amplifiers',
		kind: 'power-amp',
		availability: 'sold',
		price: 790,
		arrivedOn: '2026-09-02',
		newOrUsed: 'pre-owned',
		era: 'modern',
		technology: 'solid-state',
		voltage: '120v',
		conditionGrade: '7',
		summary: 'A compact 60-watt amplifier, ideal for a second system.',
		yearsInProduction: '2011–2015'
	},
	{
		sku: 'RA-1006',
		title: 'Marlowe & Finch MF-30i Integrated Tube Amplifier',
		brand: 'marlowe-finch',
		model: 'MF-30i',
		category: 'integrated-amplifiers',
		kind: 'integrated',
		price: 2690,
		arrivedOn: '2026-10-18',
		newOrUsed: 'pre-owned',
		era: 'vintage',
		technology: 'tube',
		voltage: '120v',
		conditionGrade: '7',
		summary: 'A 30-watt integrated tube amp with a built-in moving-magnet phono stage.',
		description: [
			p(
				'Everything you need for a vintage record system in one handsome chassis: just add a turntable and speakers.'
			)
		],
		serviceNotes: 'Recapped, selector switches and volume control cleaned, new power cord fitted.',
		tubeNotes: 'Output tubes test at 85–90% of new. Spare set available on request.',
		cosmeticNotes: 'Wood case has a few small nicks; faceplate is very good.',
		yearsInProduction: '1966–1972',
		dimensions: '16 × 6 × 12 in',
		weight: '31 lb',
		specs: spec(['Power output', '30 W per channel'], ['Phono input', 'Moving magnet']),
		recommendedWith: ['RA-1022', 'RA-1026', 'RA-1018']
	},
	{
		sku: 'RA-1007',
		title: 'Tsukimi TA-7700 Integrated Amplifier',
		brand: 'tsukimi',
		model: 'TA-7700',
		category: 'integrated-amplifiers',
		kind: 'integrated',
		price: 1250,
		featured: true,
		arrivedOn: '2026-10-26',
		newOrUsed: 'pre-owned',
		era: 'vintage',
		technology: 'solid-state',
		voltage: '120v',
		conditionGrade: '8',
		summary: 'Late-70s Japanese integrated with twin meters and a superb phono stage.',
		description: [
			p(
				'Built when Japanese manufacturers were competing hardest on quality. Heavy, quiet and beautifully finished.'
			)
		],
		serviceNotes: 'All controls cleaned, protection relay replaced, meter lamps replaced.',
		cosmeticNotes: 'Faceplate excellent. Wood side cheeks show light wear.',
		yearsInProduction: '1977–1980',
		dimensions: '18 × 6 × 15 in',
		weight: '34 lb',
		specs: spec(
			['Power output', '90 W per channel'],
			['Phono', 'MM and MC'],
			['Tone controls', 'Bass, mid, treble with defeat']
		),
		recommendedWith: ['RA-1024', 'RA-1018']
	},
	{
		sku: 'RA-1008',
		title: 'Brightwater BI-2 Hybrid Integrated Amplifier',
		brand: 'brightwater',
		model: 'BI-2',
		category: 'integrated-amplifiers',
		kind: 'integrated',
		price: 3400,
		arrivedOn: '2026-10-08',
		newOrUsed: 'pre-owned',
		era: 'modern',
		technology: 'hybrid',
		voltage: 'switchable',
		conditionGrade: '9',
		summary: 'Tube preamp stage, solid-state output: warmth with real control.',
		description: [
			p(
				'A modern hybrid that pairs a tube input stage with a high-current solid-state output stage. Includes a remote.'
			)
		],
		includedItems: 'Original box, remote control, manual, power cord.',
		cosmeticNotes: 'Like new.',
		yearsInProduction: '2018–present',
		dimensions: '17 × 5 × 16 in',
		weight: '38 lb',
		specs: spec(['Power output', '150 W per channel into 8 Ω'], ['Input tubes', '2 × 6922'])
	},
	{
		sku: 'RA-1009',
		title: 'Kestrel KI-90 Integrated Amplifier (220–240V)',
		brand: 'kestrel',
		model: 'KI-90',
		category: 'integrated-amplifiers',
		kind: 'integrated',
		price: 1490,
		arrivedOn: '2026-09-28',
		newOrUsed: 'pre-owned',
		era: 'modern',
		technology: 'solid-state',
		voltage: '240v',
		conditionGrade: '8',
		summary:
			'European-voltage unit, ideal for international buyers or with a step-down transformer.',
		description: [
			p(
				'This unit is wired for 220–240V mains. It will not work on US outlets without a suitable step-up transformer, which we can supply.'
			)
		],
		yearsInProduction: '2012–2018',
		dimensions: '17 × 4 × 14 in',
		weight: '24 lb',
		specs: spec(['Power output', '90 W per channel'], ['Mains', '230 V, 50 Hz'])
	},
	{
		sku: 'RA-1010',
		title: 'Brightwater BP-1 Line Preamplifier',
		brand: 'brightwater',
		model: 'BP-1',
		category: 'preamplifiers',
		kind: 'preamp',
		price: 1990,
		arrivedOn: '2026-10-15',
		newOrUsed: 'pre-owned',
		era: 'modern',
		technology: 'solid-state',
		voltage: 'switchable',
		conditionGrade: '9',
		summary: 'A dead-quiet line stage with a precise stepped volume control.',
		cosmeticNotes: 'Excellent. No visible marks on the faceplate.',
		includedItems: 'Remote, manual, power cord.',
		yearsInProduction: '2014–2020',
		dimensions: '17 × 3.5 × 13 in',
		weight: '16 lb',
		specs: spec(
			['Inputs', '4 × RCA, 1 × XLR'],
			['Outputs', 'RCA and XLR'],
			['Volume', '0.5 dB steps']
		)
	},
	{
		sku: 'RA-1011',
		title: 'Marlowe & Finch MF-22 Tube Preamplifier with Phono',
		brand: 'marlowe-finch',
		model: 'MF-22',
		category: 'preamplifiers',
		kind: 'preamp',
		price: 2450,
		rare: true,
		arrivedOn: '2026-10-10',
		newOrUsed: 'pre-owned',
		era: 'vintage',
		technology: 'tube',
		voltage: '120v',
		conditionGrade: '6',
		summary: 'The matching preamp for the MF-40, with a lovely tube phono stage.',
		serviceNotes: 'Recapped and rewired with new RCA jacks. All controls cleaned and lubricated.',
		tubeNotes: 'Six 12AX7 tubes, all testing strong. Low noise selected for the phono stage.',
		cosmeticNotes: 'Visible wear on the faceplate lettering and one small dent in the top cover.',
		yearsInProduction: '1960–1967',
		weight: '14 lb',
		specs: spec(['Tubes', '6 × 12AX7'], ['Phono', 'Moving magnet, RIAA'])
	},
	{
		sku: 'RA-1012',
		title: 'Brightwater Phono One MM/MC Phono Stage',
		brand: 'brightwater',
		model: 'Phono One',
		category: 'preamplifiers',
		kind: 'preamp',
		price: 1195,
		arrivedOn: '2026-10-02',
		newOrUsed: 'pre-owned',
		era: 'modern',
		technology: 'solid-state',
		voltage: 'switchable',
		conditionGrade: '10',
		summary: 'Open-box phono stage, never installed. Adjustable loading for MC cartridges.',
		includedItems: 'Original box, manual, power supply.',
		yearsInProduction: '2020–present',
		specs: spec(['Gain', '40 / 60 dB'], ['MC loading', '50 Ω – 47 kΩ'])
	},
	{
		sku: 'RA-1013',
		title: 'Tsukimi TR-2250 Stereo Receiver',
		brand: 'tsukimi',
		model: 'TR-2250',
		category: 'receivers',
		kind: 'receiver',
		price: 1650,
		featured: true,
		arrivedOn: '2026-10-27',
		newOrUsed: 'pre-owned',
		era: 'vintage',
		technology: 'solid-state',
		voltage: '120v',
		conditionGrade: '7',
		summary:
			'The glowing blue dial everyone remembers, fully serviced and ready for another 40 years.',
		description: [
			p(
				'A 50-watt-per-channel receiver with a smooth flywheel tuning knob and that unmistakable glow.'
			),
			p(
				'We replaced every dial lamp with warm LEDs matched to the original color, so it will stay bright for years.'
			)
		],
		serviceNotes:
			'Full recap of the power supply and amplifier boards. Tuner aligned. All lamps replaced.',
		cosmeticNotes: 'Two small scratches on the top of the wood case. Faceplate is very good.',
		yearsInProduction: '1975–1978',
		dimensions: '20 × 6 × 15 in',
		weight: '35 lb',
		specs: spec(
			['Power output', '50 W per channel into 8 Ω'],
			['FM sensitivity', '1.9 µV'],
			['Phono', 'Moving magnet']
		),
		recommendedWith: ['RA-1018', 'RA-1022']
	},
	{
		sku: 'RA-1014',
		title: 'Tsukimi TR-4400 Quadraphonic Receiver',
		brand: 'tsukimi',
		model: 'TR-4400',
		category: 'receivers',
		kind: 'receiver',
		price: 2890,
		rare: true,
		arrivedOn: '2026-09-30',
		newOrUsed: 'pre-owned',
		era: 'vintage',
		technology: 'solid-state',
		voltage: '120v',
		conditionGrade: '6',
		summary: 'A four-channel showpiece receiver, also superb in plain stereo.',
		serviceNotes: 'Recapped; all four channels tested to spec. Decoder board cleaned.',
		cosmeticNotes: 'Wood case refinished. Faceplate has visible scratches around the volume knob.',
		weight: '52 lb',
		yearsInProduction: '1973–1976',
		shippingNote: 'Heavy: ships double-boxed by freight, or pick up at the showroom.'
	},
	{
		sku: 'RA-1015',
		title: 'Sorrel Model 8 Stereo Tube Receiver',
		brand: 'sorrel',
		model: 'Model 8',
		category: 'receivers',
		kind: 'receiver',
		price: 1350,
		arrivedOn: '2026-09-25',
		newOrUsed: 'pre-owned',
		era: 'vintage',
		technology: 'tube',
		voltage: '120v',
		conditionGrade: '5',
		summary: 'An early-60s tube receiver with genuine character and a warm, glowing dial.',
		serviceNotes: 'Recapped, rectifier replaced, dial cord restrung.',
		tubeNotes: 'Output tubes replaced; original tuner tubes retained and testing well.',
		cosmeticNotes: 'Multiple scratches including the faceplate; see photos.',
		yearsInProduction: '1961–1964'
	},
	{
		sku: 'RA-1016',
		title: 'Tsukimi TR-1500 Stereo Receiver',
		brand: 'tsukimi',
		model: 'TR-1500',
		category: 'receivers',
		kind: 'receiver',
		availability: 'sold',
		price: 690,
		arrivedOn: '2026-09-04',
		newOrUsed: 'pre-owned',
		era: 'vintage',
		technology: 'solid-state',
		voltage: '120v',
		conditionGrade: '7',
		summary: 'Compact entry-level receiver.'
	},
	{
		sku: 'RA-1017',
		title: 'Halvorsen Fjord 3 Floorstanding Speakers (Pair)',
		brand: 'halvorsen',
		model: 'Fjord 3',
		category: 'speakers',
		kind: 'speakers',
		price: 2950,
		featured: true,
		arrivedOn: '2026-10-22',
		newOrUsed: 'pre-owned',
		era: 'vintage',
		conditionGrade: '8',
		localPickupOnly: true,
		summary: 'Three-way floorstanders in walnut, with refoamed woofers.',
		description: [
			p(
				'Big, warm and easy to drive. The Fjord 3 fills a room without shouting, and looks wonderful doing it.'
			)
		],
		serviceNotes: 'Woofers refoamed, crossovers inspected, all drivers tested.',
		cosmeticNotes: 'Veneer in very good condition. Grilles have two small pulls.',
		includedItems: 'Both speakers with grilles.',
		yearsInProduction: '1981–1986',
		dimensions: '14 × 40 × 13 in each',
		weight: '62 lb each',
		specs: spec(
			['Drivers', '10 in woofer, 5 in midrange, 1 in dome tweeter'],
			['Impedance', '8 Ω'],
			['Sensitivity', '91 dB']
		),
		shippingNote: 'Local pickup only, or delivery within 50 miles for a fee.',
		recommendedWith: ['RA-1003', 'RA-1036']
	},
	{
		sku: 'RA-1018',
		title: 'Halvorsen Nord 1 Bookshelf Speakers (Pair)',
		brand: 'halvorsen',
		model: 'Nord 1',
		category: 'speakers',
		kind: 'bookshelf',
		price: 890,
		arrivedOn: '2026-10-19',
		newOrUsed: 'pre-owned',
		era: 'vintage',
		conditionGrade: '7',
		summary: 'Small two-way speakers with a big, natural sound. Great with tube amps.',
		serviceNotes: 'All drivers tested; tweeter level controls cleaned.',
		cosmeticNotes: 'Light marks on the tops and a small chip on one rear corner.',
		yearsInProduction: '1974–1979',
		dimensions: '11 × 18 × 9 in each',
		weight: '17 lb each',
		specs: spec(['Drivers', '8 in woofer, 1 in tweeter'], ['Impedance', '8 Ω'])
	},
	{
		sku: 'RA-1019',
		title: 'Corvane C-15 Horn Loudspeakers (Pair)',
		brand: 'corvane',
		model: 'C-15',
		category: 'speakers',
		kind: 'speakers',
		price: 6200,
		rare: true,
		arrivedOn: '2026-10-03',
		newOrUsed: 'pre-owned',
		era: 'vintage',
		conditionGrade: '6',
		localPickupOnly: true,
		summary: 'High-efficiency horn speakers that come alive with even a few watts.',
		description: [
			p(
				'These need very little power, which makes them a natural partner for low-powered tube amplifiers.'
			)
		],
		cosmeticNotes:
			'Cabinets show their age with scuffs on the lower edges. Drivers are original and perfect.',
		weight: '120 lb each',
		yearsInProduction: '1981–1990',
		specs: spec(['Sensitivity', '104 dB'], ['Impedance', '8 Ω']),
		shippingNote: 'Local pickup or freight only.'
	},
	{
		sku: 'RA-1020',
		title: 'Corvane Studio 6 Monitors (Pair)',
		brand: 'corvane',
		model: 'Studio 6',
		category: 'speakers',
		kind: 'bookshelf',
		price: 1750,
		arrivedOn: '2026-10-13',
		newOrUsed: 'pre-owned',
		era: 'modern',
		conditionGrade: '9',
		summary: 'Accurate stand-mount monitors, barely used.',
		includedItems: 'Original boxes, grilles, manual.',
		yearsInProduction: '2015–2021'
	},
	{
		sku: 'RA-1021',
		title: 'Corvane C-8 Loudspeakers (Pair)',
		brand: 'corvane',
		model: 'C-8',
		category: 'speakers',
		kind: 'speakers',
		availability: 'sold',
		price: 1900,
		arrivedOn: '2026-09-10',
		newOrUsed: 'pre-owned',
		era: 'vintage',
		conditionGrade: '7',
		summary: 'Mid-size horn-loaded speakers.'
	},
	{
		sku: 'RA-1022',
		title: 'Aldenbrook Model 20 Belt-Drive Turntable',
		brand: 'aldenbrook',
		model: 'Model 20',
		category: 'turntables',
		kind: 'turntable',
		price: 1150,
		featured: true,
		arrivedOn: '2026-10-25',
		newOrUsed: 'pre-owned',
		era: 'vintage',
		technology: null,
		voltage: '120v',
		conditionGrade: '7',
		summary: 'A beautifully quiet belt-drive deck, set up and ready to play.',
		serviceNotes:
			'New belt, bearing cleaned and re-oiled, speed calibrated, tonearm set up with a new cartridge.',
		cosmeticNotes: 'Dust cover slightly hazy; plinth very good.',
		includedItems: 'Dust cover, mat and an Okuda OM-10 cartridge mounted and aligned.',
		yearsInProduction: '1970–1977',
		weight: '19 lb',
		specs: spec(['Drive', 'Belt'], ['Speeds', '33⅓ and 45 rpm'], ['Wow and flutter', '0.05%']),
		recommendedWith: ['RA-1026', 'RA-1012']
	},
	{
		sku: 'RA-1023',
		title: 'Aldenbrook Model 40 Idler-Drive Turntable in Walnut Plinth',
		brand: 'aldenbrook',
		model: 'Model 40',
		category: 'turntables',
		kind: 'turntable',
		price: 3690,
		featured: true,
		rare: true,
		arrivedOn: '2026-10-20',
		newOrUsed: 'pre-owned',
		era: 'vintage',
		voltage: '120v',
		conditionGrade: '8',
		summary: 'Fully restored idler-drive classic in a custom solid-walnut plinth.',
		description: [
			p(
				'Idler-drive turntables have a punch and drive that belt-drive decks rarely match. This one has been completely rebuilt in our workshop.'
			)
		],
		serviceNotes: 'Motor rebuilt, new idler wheel, bearing serviced, new plinth built in-house.',
		cosmeticNotes: 'Top plate repainted. Plinth is new.',
		yearsInProduction: '1957–1965',
		specs: spec(['Drive', 'Idler wheel'], ['Speeds', '16, 33⅓, 45 and 78 rpm'])
	},
	{
		sku: 'RA-1024',
		title: 'Tsukimi TT-5 Direct-Drive Turntable',
		brand: 'tsukimi',
		model: 'TT-5',
		category: 'turntables',
		kind: 'turntable',
		availability: 'on-hold',
		price: 990,
		arrivedOn: '2026-10-11',
		newOrUsed: 'pre-owned',
		era: 'vintage',
		voltage: '120v',
		conditionGrade: '8',
		summary: 'Rock-steady direct drive with quartz lock.',
		serviceNotes: 'Speed calibrated, arm lift damped, new feet.',
		yearsInProduction: '1978–1982'
	},
	{
		sku: 'RA-1025',
		title: 'Okuda OC-3 Moving Coil Cartridge',
		brand: 'okuda',
		model: 'OC-3',
		category: 'phono-cartridges',
		kind: 'cartridge',
		price: 899,
		arrivedOn: '2026-10-14',
		newOrUsed: 'new',
		era: 'modern',
		conditionGrade: 'new',
		summary: 'Brand new, with full manufacturer warranty.',
		includedItems: 'Sealed box with mounting hardware and stylus guard.',
		specs: spec(['Type', 'Low-output moving coil'], ['Output', '0.4 mV'], ['Stylus', 'Microline']),
		recommendedWith: ['RA-1012']
	},
	{
		sku: 'RA-1026',
		title: 'Okuda OM-10 Moving Magnet Cartridge (New Old Stock)',
		brand: 'okuda',
		model: 'OM-10',
		category: 'phono-cartridges',
		kind: 'cartridge',
		price: 249,
		arrivedOn: '2026-10-09',
		newOrUsed: 'nos',
		era: 'vintage',
		conditionGrade: 'nos',
		summary: 'Sealed 1980s stock, never mounted.',
		specs: spec(['Type', 'Moving magnet'], ['Output', '4 mV'])
	},
	{
		sku: 'RA-1027',
		title: 'Okuda OC-1 Moving Coil Cartridge (Pre-owned)',
		brand: 'okuda',
		model: 'OC-1',
		category: 'phono-cartridges',
		kind: 'cartridge',
		price: 520,
		arrivedOn: '2026-09-27',
		newOrUsed: 'pre-owned',
		era: 'modern',
		conditionGrade: '9',
		summary: 'About 150 hours of use, stylus inspected under the microscope.',
		workingCondition:
			'Stylus inspected under magnification: minimal wear. Tested on our reference turntable.'
	},
	{
		sku: 'RA-1028',
		title: 'Tsukimi TD-9 Three-Head Cassette Deck',
		brand: 'tsukimi',
		model: 'TD-9',
		category: 'tape-decks',
		kind: 'tape-deck',
		price: 1490,
		featured: true,
		arrivedOn: '2026-10-23',
		newOrUsed: 'pre-owned',
		era: 'vintage',
		technology: 'solid-state',
		voltage: '120v',
		conditionGrade: '8',
		summary: 'A three-head deck with fresh belts and an alignment to factory spec.',
		serviceNotes:
			'All belts replaced, heads cleaned and demagnetized, azimuth and speed calibrated.',
		cosmeticNotes: 'Very good; light marks on the cassette door.',
		yearsInProduction: '1981–1984',
		specs: spec(['Heads', '3 (separate record and playback)'], ['Noise reduction', 'Type B and C'])
	},
	{
		sku: 'RA-1029',
		title: 'Tsukimi TR-77 Reel-to-Reel Tape Deck',
		brand: 'tsukimi',
		model: 'TR-77',
		category: 'tape-decks',
		kind: 'reel',
		price: 2250,
		rare: true,
		arrivedOn: '2026-10-06',
		newOrUsed: 'pre-owned',
		era: 'vintage',
		technology: 'solid-state',
		voltage: '120v',
		conditionGrade: '6',
		summary: 'A 7-inch reel deck with new pinch roller and belts.',
		serviceNotes: 'New pinch roller and belts, brakes adjusted, heads cleaned and demagnetized.',
		cosmeticNotes: 'Scratches on the head cover; one knob is a period-correct replacement.',
		includedItems: 'Two empty reels and a dust cover.',
		yearsInProduction: '1972–1977'
	},
	{
		sku: 'RA-1030',
		title: 'Tsukimi TD-3 Cassette Deck',
		brand: 'tsukimi',
		model: 'TD-3',
		category: 'tape-decks',
		kind: 'tape-deck',
		availability: 'sold',
		price: 390,
		arrivedOn: '2026-09-08',
		newOrUsed: 'pre-owned',
		era: 'vintage',
		technology: 'solid-state',
		voltage: '120v',
		conditionGrade: '7',
		summary: 'Two-head cassette deck.'
	},
	{
		sku: 'RA-1031',
		title: 'Vireo Stream DAC Two',
		brand: 'vireo',
		model: 'Stream DAC Two',
		category: 'cd-digital',
		kind: 'dac',
		price: 2495,
		arrivedOn: '2026-10-16',
		newOrUsed: 'new',
		era: 'modern',
		technology: 'solid-state',
		voltage: 'switchable',
		conditionGrade: 'new',
		summary: 'Streamer and DAC in one box. New, with full manufacturer warranty.',
		description: [
			p(
				'Plays your streaming services and your own files, and doubles as a high-quality DAC for a CD transport or TV.'
			)
		],
		includedItems: 'Sealed box, remote, power cord.',
		specs: spec(
			['Inputs', 'USB, optical, coaxial, Ethernet, Wi-Fi'],
			['Outputs', 'RCA and XLR'],
			['Formats', 'PCM to 384 kHz, DSD256']
		)
	},
	{
		sku: 'RA-1032',
		title: 'Kestrel KCD-5 CD Player',
		brand: 'kestrel',
		model: 'KCD-5',
		category: 'cd-digital',
		kind: 'cd',
		price: 690,
		arrivedOn: '2026-09-29',
		newOrUsed: 'pre-owned',
		era: 'modern',
		technology: 'solid-state',
		voltage: '120v',
		conditionGrade: '8',
		summary: 'A solid, well-built CD player with a smooth, quiet drawer.',
		serviceNotes: 'Laser checked, drawer belt replaced.',
		includedItems: 'Remote control.',
		yearsInProduction: '2003–2008'
	},
	{
		sku: 'RA-1033',
		title: 'Sorrel FM-60 Tube FM Tuner',
		brand: 'sorrel',
		model: 'FM-60',
		category: 'tuners',
		kind: 'tuner',
		price: 590,
		arrivedOn: '2026-10-07',
		newOrUsed: 'pre-owned',
		era: 'vintage',
		technology: 'tube',
		voltage: '120v',
		conditionGrade: '6',
		summary: 'A warm-sounding tube FM tuner, aligned and recapped.',
		serviceNotes: 'Recapped and aligned for best stereo separation.',
		yearsInProduction: '1959–1963'
	},
	{
		sku: 'RA-1034',
		title: 'Tsukimi FT-500 Analog Tuner',
		brand: 'tsukimi',
		model: 'FT-500',
		category: 'tuners',
		kind: 'tuner',
		availability: 'sold',
		price: 450,
		arrivedOn: '2026-09-12',
		newOrUsed: 'pre-owned',
		era: 'vintage',
		technology: 'solid-state',
		voltage: '120v',
		conditionGrade: '8',
		summary: 'Sensitive analog FM tuner.'
	},
	{
		sku: 'RA-1035',
		title: 'Lindqvist Aria RCA Interconnects, 1 m Pair',
		brand: 'lindqvist',
		model: 'Aria',
		category: 'cables',
		kind: 'cable',
		price: 320,
		arrivedOn: '2026-10-01',
		newOrUsed: 'new',
		era: 'modern',
		conditionGrade: 'new',
		summary: 'Braided interconnects that suit almost any system. New.',
		specs: spec(['Length', '1 m'], ['Connectors', 'Gold-plated RCA'])
	},
	{
		sku: 'RA-1036',
		title: 'Lindqvist Aria Speaker Cables, 8 ft Pair',
		brand: 'lindqvist',
		model: 'Aria',
		category: 'cables',
		kind: 'cable',
		price: 640,
		arrivedOn: '2026-10-01',
		newOrUsed: 'new',
		era: 'modern',
		conditionGrade: 'new',
		summary: 'Matching speaker cables with banana or spade terminations. New.',
		specs: spec(['Length', '8 ft'], ['Terminations', 'Banana or spade (your choice)'])
	},
	{
		sku: 'RA-1037',
		title: 'Corvane H-1 Open-Back Headphones',
		brand: 'corvane',
		model: 'H-1',
		category: 'accessories',
		kind: 'headphones',
		price: 380,
		arrivedOn: '2026-10-17',
		newOrUsed: 'pre-owned',
		era: 'modern',
		conditionGrade: '9',
		summary: 'Comfortable open-back headphones with fresh ear pads.',
		includedItems: 'Case, two cables, new ear pads fitted.'
	}
];

const slugify = (s) =>
	s
		.toLowerCase()
		.normalize('NFKD')
		.replace(/[̀-ͯ]/g, '')
		.replace(/&/g, 'and')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');

const fullProducts = products.map((x, index) => {
	const views = viewCount(x.kind);
	const photos = Array.from({ length: views }, (_, i) => ({
		url: `demo/products/${x.sku.toLowerCase()}-${i + 1}.svg`,
		alternativeText: `${x.title}, ${VIEW_NAMES[i]} (placeholder illustration)`,
		width: W,
		height: H
	}));
	return {
		sku: x.sku,
		slug: slugify(x.title),
		title: x.title,
		summary: x.summary,
		brand: x.brand,
		category: x.category,
		modelNumber: x.model,
		price: x.price,
		availability: x.availability ?? 'available',
		featured: x.featured ?? false,
		arrivedOn: x.arrivedOn,
		newOrUsed: x.newOrUsed,
		era: x.era,
		technology:
			x.technology ??
			(['speakers', 'cables', 'phono-cartridges', 'turntables', 'accessories'].includes(x.category)
				? null
				: 'solid-state'),
		voltage: x.voltage ?? null,
		rare: x.rare ?? false,
		conditionGrade: x.conditionGrade,
		workingCondition: x.workingCondition ?? (x.newOrUsed === 'new' ? 'New and sealed.' : LISTENED),
		cosmeticNotes: x.cosmeticNotes ?? null,
		description: x.description ?? [p(x.summary)],
		serviceNotes: x.serviceNotes ?? null,
		tubeNotes: x.tubeNotes ?? null,
		ownershipHistory: x.ownershipHistory ?? null,
		soundCharacter: x.soundCharacter ?? null,
		connections: x.connections ?? null,
		includedItems: x.includedItems ?? null,
		specs: x.specs ?? [],
		yearsInProduction: x.yearsInProduction ?? null,
		dimensions: x.dimensions ?? null,
		weight: x.weight ?? null,
		manualUrl: null,
		photos,
		localPickupOnly: x.localPickupOnly ?? false,
		shippingNote: x.shippingNote ?? null,
		recommendedWith: x.recommendedWith ?? [],
		// Art-only fields (stripped before writing content.json)
		_art: { kind: x.kind, seed: index + 1, views, brand: brandName[x.brand], model: x.model }
	};
});

/* ---------- info pages (our own copy; the owner should rewrite before launch) ---------- */

const infoPages = [
	{
		title: 'About Rossweisse Audio',
		slug: 'about',
		menuGroup: 'about',
		sortOrder: 1,
		summary: 'Who we are and how we choose the gear we sell.',
		body: [
			p(
				'Rossweisse Audio is a small hi-fi shop for people who love listening. We buy, service and sell vintage and modern audio equipment, and we only list pieces we would be happy to own ourselves.'
			),
			p(
				'Every piece is tested on the bench and in our listening room before it goes on the site. If something is not right, we fix it or we do not sell it.'
			),
			h(2, 'Visit us'),
			p(
				'Our showroom is open by appointment, so we can give you our full attention and a proper listen. ',
				link('/info/contact', 'Get in touch'),
				' to book a time.'
			)
		]
	},
	{
		title: 'Our Testing Process',
		slug: 'testing-process',
		menuGroup: 'about',
		sortOrder: 2,
		summary: 'What happens to every piece before it is listed.',
		body: [
			p('Each component goes through the same steps before we list it:'),
			ul(
				[
					b('Inspection. '),
					t(
						'We open it up and look for heat damage, leaking or bulging capacitors and previous repairs.'
					)
				],
				[
					b('Safe power-up. '),
					t(
						'Vintage gear is brought up slowly on a variable supply while we watch the critical voltages.'
					)
				],
				[
					b('Bench measurements. '),
					t(
						'Output power, distortion, channel balance and noise are checked against the original specifications.'
					)
				],
				[
					b('Service. '),
					t('Worn parts are replaced, controls are cleaned and anything out of spec is repaired.')
				],
				[b('Listening. '), t('Finally, it plays music in our listening room for several hours.')]
			),
			p(
				'What we found and what we replaced is written in each listing under ',
				b('Service notes'),
				'.'
			)
		]
	},
	{
		title: 'Our Rating Scale',
		slug: 'rating-scale',
		menuGroup: 'about',
		sortOrder: 3,
		summary: 'How we grade cosmetic condition, from New to For parts only.',
		body: [
			p(
				'The condition grade on each listing describes how the piece ',
				b('looks'),
				'. How it ',
				b('works'),
				' is described separately under Working condition, and everything we sell works unless the listing clearly says otherwise.'
			),
			p(
				'Our scale follows the 1-to-10 convention common in the used hi-fi world. We grade conservatively: if we are unsure between two grades, we choose the lower one.'
			),
			ul(
				[b('New: '), t('factory sealed, with full manufacturer warranty.')],
				[b('New old stock (NOS): '), t('never used, but made years or decades ago.')],
				[b('10 · Mint: '), t('no signs of use at all, usually open-box.')],
				[
					b('9 · Excellent: '),
					t('looks new on close inspection; at most a faint mark where it sat.')
				],
				[b('8 · Very good: '), t('a clean faceplate and one or two minor marks elsewhere.')],
				[b('7 · Good: '), t('a few light scratches or light wear on knobs and switches.')],
				[b('6 · Fair: '), t('several scratches or one obvious mark; still presents well.')],
				[b('5 · Average: '), t('visible wear, including on the front panel.')],
				[b('4 · Worn: '), t('rough cosmetics, but everything works.')],
				[b('3 · Rough: '), t('heavy wear, possibly a missing knob or cover.')],
				[b('2 · Very rough: '), t('damaged parts; sold mainly for restoration.')],
				[b('1 · For parts only: '), t('not working; sold as-is for parts.')]
			),
			p('Photos show every mark we mention. If you would like more pictures, just ask.')
		]
	},
	{
		title: 'Warranty & Returns',
		slug: 'warranty',
		menuGroup: 'about',
		sortOrder: 4,
		summary: 'What we promise, and what happens if something goes wrong.',
		body: [
			p(
				'Pre-owned pieces come with our 90-day warranty covering parts and labor. New pieces carry the full manufacturer warranty.'
			),
			p(
				'If a piece arrives damaged or does not match its description, contact us within 7 days and we will make it right: a repair, a replacement or a refund.'
			),
			p(
				'This is sample policy text for the demo. The shop will publish its real terms before launch.'
			)
		]
	},
	{
		title: 'Shipping & Pickup',
		slug: 'shipping-and-pickup',
		menuGroup: 'about',
		sortOrder: 5,
		summary: 'How we pack, ship and hand over your gear.',
		body: [
			p(
				'Electronics are double-boxed with custom foam and fully insured. Speakers and very heavy pieces ship by freight or can be picked up at the showroom; their listings say so.'
			),
			p('Local pickup is always free. Bring a blanket for the drive home.')
		]
	},
	{
		title: 'Consignment',
		slug: 'consignment',
		menuGroup: 'sell',
		sortOrder: 6,
		summary: 'Let us sell your gear for you.',
		body: [
			p(
				'If you would rather not deal with buyers yourself, we can sell your equipment on consignment. We test, photograph and list it, handle every question and ship it safely.'
			),
			p(
				'We agree the asking price together, and you are paid once the buyer has received the piece and is happy with it.'
			),
			p(link('/sell', 'Tell us about your gear'), ' to get started.')
		]
	},
	{
		title: 'Contact',
		slug: 'contact',
		menuGroup: null,
		sortOrder: 7,
		summary: 'Call, email or book a listening appointment.',
		body: [
			p(
				'The quickest way to reach us is by phone or email. Questions about a particular piece? Use the ',
				b('Ask about this piece'),
				' button on its page so we know exactly which one you mean.'
			),
			p('Thinking about a whole system? Try our ', link('/concierge', 'system help'), ' form.')
		]
	}
];

const wantedItems = [
	['Marlowe & Finch', 'MF-40 and MF-75 tube amplifiers', 'Working or not'],
	['Marlowe & Finch', 'MF-22 preamplifier', null],
	['Tsukimi Electric', 'TR-4400 and TR-6600 receivers', null],
	['Tsukimi Electric', 'TR-77 and TR-99 reel-to-reel decks', 'Working or not'],
	['Halvorsen Acoustics', 'Fjord 5 speakers', 'Local pickup preferred'],
	['Aldenbrook', 'Model 40 and Model 50 turntables', 'Any condition'],
	['Sorrel Radio Company', 'Model 10 tube receiver', null],
	['Corvane Loudspeakers', 'C-15 and C-21 horns', null],
	['Kestrel Audio Labs', 'KA-600 and KA-900 amplifiers', null],
	['Brightwater Sound', 'BP-0 preamplifier', null]
].map(([brand, model, note], i) => ({ brand, model, note, sortOrder: i + 1 }));

const siteSettings = {
	shopName: 'Rossweisse Audio',
	tagline: 'Tested vintage and modern hi-fi',
	announcement:
		'Free insured shipping on electronics within the contiguous US · Speakers ship by freight or local pickup',
	heroTitle: 'Hi-fi that’s been through the lab, not just the listing.',
	heroText:
		'Vintage classics and modern components, each one inspected, serviced and listened to before it reaches you.',
	heroImage: { url: 'demo/hero.svg', alternativeText: '', width: HERO_W, height: H },
	email: 'hello@rossweisse-audio.example',
	phone: '(555) 010-0199',
	addressLines: ['Showroom by appointment', '100 Example Avenue', 'Anytown, NJ 00000'],
	hours: ['Tue–Fri 11am–6pm', 'Sat 10am–4pm'],
	social: []
};

/* ---------- write ---------- */

function writeFile(file, data) {
	fs.mkdirSync(path.dirname(file), { recursive: true });
	fs.writeFileSync(file, data);
}

fs.rmSync(staticDir, { recursive: true, force: true });
let images = 0;
for (const product of fullProducts) {
	const art = product._art;
	for (let view = 1; view <= art.views; view++) {
		writeFile(
			path.join(staticDir, 'products', `${product.sku.toLowerCase()}-${view}.svg`),
			drawProduct({ kind: art.kind, brand: art.brand, model: art.model, seed: art.seed, view })
		);
		images++;
	}
}
for (const [i, c] of categories.entries()) {
	writeFile(path.join(staticDir, 'categories', `${c.slug}.svg`), drawCategory(c.art, 100 + i));
	images++;
}
writeFile(path.join(staticDir, 'hero.svg'), drawHero());
images++;

/** Copy of `obj` without `key` (drops the art-only fields). */
const omit = (obj, key) => Object.fromEntries(Object.entries(obj).filter(([k]) => k !== key));

const content = {
	siteSettings,
	categories: categories.map((c) => omit(c, 'art')),
	brands,
	products: fullProducts.map((prod) => omit(prod, '_art')),
	infoPages,
	wantedItems
};
writeFile(contentFile, JSON.stringify(content, null, '\t') + '\n');

console.log(
	`Wrote ${content.products.length} products, ${categories.length} categories, ${brands.length} brands, ` +
		`${infoPages.length} info pages and ${images} images.`
);
