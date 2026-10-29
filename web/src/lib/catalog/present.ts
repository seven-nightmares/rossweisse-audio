/**
 * Maps raw CMS content to the view models sent to the browser.
 * This is the one place that decides what visitors may see: sold prices are dropped here,
 * links are restricted to safe schemes, and unknown enumeration values are rejected.
 */
import {
	AVAILABILITY_STATUS,
	CONDITION_GRADES,
	ERAS,
	NEW_OR_USED,
	TECHNOLOGIES,
	VOLTAGES,
	isKey
} from '#lib/facets.ts';
import type {
	Block,
	Brand,
	Category,
	Image,
	InfoPage,
	InfoPageLink,
	ProductCard,
	ProductDetail,
	SiteSettings,
	Term,
	WantedItem
} from '#lib/types.ts';
import type {
	RawBrand,
	RawCategory,
	RawInfoPage,
	RawMedia,
	RawProduct,
	RawSiteSettings,
	RawWantedItem
} from './raw.ts';

export interface PresentContext {
	/** Turns a site-relative asset path into a URL that honours the base path. */
	asset: (path: string) => string;
}

/** A product whose brand and category relations have been looked up. */
export type ResolvedProduct = Omit<RawProduct, 'brand' | 'category'> & {
	brand: Term | null;
	category: Term | null;
};

const LOCAL_MEDIA = /^[a-z0-9][a-z0-9/_.-]{0,200}\.(?:svg|jpe?g|png|webp|avif)$/i;
const LOCAL_PDF = /^uploads\/[A-Za-z0-9_.-]{1,200}\.pdf$/;

const isLocal = (url: string, pattern: RegExp) => !url.includes('..') && pattern.test(url);

export function toImage(
	media: RawMedia | null | undefined,
	fallbackAlt: string,
	ctx: PresentContext
): Image | null {
	if (!media || !isLocal(media.url, LOCAL_MEDIA)) return null;
	if (!(media.width > 0) || !(media.height > 0)) return null;
	const candidates = [
		...(media.formats ?? []).filter((f) => isLocal(f.url, LOCAL_MEDIA) && f.width > 0),
		{ url: media.url, width: media.width, height: media.height }
	].sort((a, b) => a.width - b.width);
	const medium = candidates.find((c) => c.width >= 700) ?? candidates[candidates.length - 1];
	return {
		src: ctx.asset(medium.url),
		srcset: candidates.map((c) => `${ctx.asset(c.url)} ${c.width}w`).join(', '),
		width: media.width,
		height: media.height,
		alt: media.alternativeText?.trim() || fallbackAlt
	};
}

/** Only https links (and mailto/tel where noted) from editor content are kept. */
export function safeHttps(url: string | null | undefined): string | null {
	if (!url) return null;
	try {
		const u = new URL(url);
		return u.protocol === 'https:' ? u.href : null;
	} catch {
		return null;
	}
}

const EMAIL = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[a-z]{2,}$/i;

const text = (s: string | null | undefined): string | null => s?.trim() || null;
const blocks = (b: Block[] | null | undefined): Block[] => (Array.isArray(b) ? b : []);

type CheckedFields = Pick<
	RawProduct,
	'availability' | 'conditionGrade' | 'newOrUsed' | 'era' | 'technology' | 'voltage' | 'price'
>;

export function isPresentable(p: CheckedFields): boolean {
	return (
		isKey(AVAILABILITY_STATUS, p.availability) &&
		isKey(CONDITION_GRADES, p.conditionGrade) &&
		isKey(NEW_OR_USED, p.newOrUsed) &&
		isKey(ERAS, p.era) &&
		(p.technology == null || isKey(TECHNOLOGIES, p.technology)) &&
		(p.voltage == null || isKey(VOLTAGES, p.voltage)) &&
		Number.isInteger(p.price) &&
		p.price >= 0
	);
}

export function toCard(p: ResolvedProduct, ctx: PresentContext): ProductCard {
	if (!isPresentable(p)) throw new Error(`Product ${p.sku} has invalid field values`);
	const base = {
		sku: p.sku,
		slug: p.slug,
		title: p.title,
		brand: p.brand,
		category: p.category,
		conditionGrade: p.conditionGrade as ProductCard['conditionGrade'],
		newOrUsed: p.newOrUsed as ProductCard['newOrUsed'],
		era: p.era as ProductCard['era'],
		technology: (p.technology ?? null) as ProductCard['technology'],
		arrivedOn: p.arrivedOn,
		image: toImage(p.photos?.[0], `${p.title}, photo 1`, ctx)
	};
	if (p.availability === 'sold') return { ...base, status: 'sold', sold: true };
	return {
		...base,
		status: p.availability as 'available' | 'on-hold',
		sold: false,
		price: p.price
	};
}

export function toDetail(
	p: ResolvedProduct,
	recommended: ProductCard[],
	ctx: PresentContext
): ProductDetail {
	const photos = (p.photos ?? [])
		.map((m, i, all) => toImage(m, `${p.title}, photo ${i + 1} of ${all.length}`, ctx))
		.filter((m): m is Image => m !== null);
	return {
		...toCard(p, ctx),
		summary: p.summary,
		modelNumber: text(p.modelNumber),
		voltage: (p.voltage ?? null) as ProductDetail['voltage'],
		rare: p.rare === true,
		workingCondition: text(p.workingCondition),
		cosmeticNotes: text(p.cosmeticNotes),
		description: blocks(p.description),
		serviceNotes: text(p.serviceNotes),
		tubeNotes: text(p.tubeNotes),
		ownershipHistory: text(p.ownershipHistory),
		soundCharacter: text(p.soundCharacter),
		connections: text(p.connections),
		includedItems: text(p.includedItems),
		specs: (p.specs ?? [])
			.map((s) => ({ label: s.label.trim(), value: s.value.trim() }))
			.filter((s) => s.label && s.value),
		yearsInProduction: text(p.yearsInProduction),
		dimensions: text(p.dimensions),
		weight: text(p.weight),
		manualUrl:
			safeHttps(p.manualUrl) ??
			(p.manualFile && isLocal(p.manualFile, LOCAL_PDF) ? ctx.asset(p.manualFile) : null),
		localPickupOnly: p.localPickupOnly === true,
		shippingNote: text(p.shippingNote),
		photos,
		recommended
	};
}

export function toCategory(c: RawCategory, ctx: PresentContext): Category {
	return {
		name: c.name,
		slug: c.slug,
		description: text(c.description),
		image: toImage(c.image, '', ctx),
		showInMenu: c.showInMenu !== false,
		showOnHome: c.showOnHome === true
	};
}

export function toBrand(b: RawBrand): Brand {
	return {
		name: b.name,
		slug: b.slug,
		country: text(b.country),
		founded: Number.isInteger(b.founded) ? (b.founded as number) : null,
		blurb: text(b.blurb),
		authorizedDealer: b.authorizedDealer === true
	};
}

const MENU_GROUPS = ['about', 'sell'] as const;

export function toInfoPageLink(p: RawInfoPage): InfoPageLink {
	const group = MENU_GROUPS.find((g) => g === p.menuGroup) ?? null;
	return { title: p.title, slug: p.slug, menuGroup: group };
}

export function toInfoPage(p: RawInfoPage): InfoPage {
	return { ...toInfoPageLink(p), summary: text(p.summary), body: blocks(p.body) };
}

export function toWantedItem(w: RawWantedItem): WantedItem {
	return { brand: w.brand, model: w.model, note: text(w.note) };
}

export const DEFAULT_SETTINGS: SiteSettings = {
	shopName: 'Rossweisse Audio',
	tagline: null,
	announcement: null,
	heroTitle: null,
	heroText: null,
	heroImage: null,
	email: null,
	phone: null,
	addressLines: [],
	hours: [],
	social: []
};

const lines = (l: string[] | null | undefined) => (l ?? []).map((s) => s.trim()).filter(Boolean);

export function toSettings(
	raw: RawSiteSettings | null | undefined,
	ctx: PresentContext
): SiteSettings {
	if (!raw) return DEFAULT_SETTINGS;
	return {
		shopName: raw.shopName?.trim() || DEFAULT_SETTINGS.shopName,
		tagline: text(raw.tagline),
		announcement: text(raw.announcement),
		heroTitle: text(raw.heroTitle),
		heroText: text(raw.heroText),
		heroImage: toImage(raw.heroImage, '', ctx),
		email: raw.email && EMAIL.test(raw.email) ? raw.email : null,
		phone: text(raw.phone),
		addressLines: lines(raw.addressLines),
		hours: lines(raw.hours),
		social: (raw.social ?? []).flatMap((s) => {
			const url = safeHttps(s.url);
			return url && s.label?.trim() ? [{ label: s.label.trim(), url }] : [];
		})
	};
}
