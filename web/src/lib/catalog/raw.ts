/**
 * Raw content shapes, as stored in the CMS (and in the demo's content.json).
 * Field names match the planned Strapi schema so the M2 Strapi adapter can feed the same
 * presenters. Relations are referenced by slug (brand, category) or SKU (recommendedWith);
 * an adapter resolves them before presenting.
 */
import type { Block } from '#lib/types.ts';

export interface RawMedia {
	/** Site-relative path without a leading slash (e.g. "demo/products/x-1.svg"), or an absolute https URL. */
	url: string;
	alternativeText: string | null;
	width: number;
	height: number;
	/** Smaller renditions of the same image (Strapi's responsive formats), any order. */
	formats?: { url: string; width: number; height: number }[] | null;
}

export interface RawCategory {
	name: string;
	slug: string;
	sortOrder: number;
	description?: string | null;
	image?: RawMedia | null;
	showInMenu?: boolean;
	showOnHome?: boolean;
}

export interface RawBrand {
	name: string;
	slug: string;
	sortOrder: number;
	country?: string | null;
	founded?: number | null;
	blurb?: string | null;
	authorizedDealer?: boolean;
}

export interface RawSpec {
	label: string;
	value: string;
}

export interface RawProduct {
	sku: string;
	slug: string;
	title: string;
	summary: string;
	brand: string | null;
	category: string | null;
	modelNumber?: string | null;
	/** Whole US dollars. */
	price: number;
	availability: string;
	featured?: boolean;
	arrivedOn: string;
	newOrUsed: string;
	era: string;
	technology?: string | null;
	voltage?: string | null;
	rare?: boolean;
	conditionGrade: string;
	workingCondition?: string | null;
	cosmeticNotes?: string | null;
	description?: Block[] | null;
	serviceNotes?: string | null;
	tubeNotes?: string | null;
	ownershipHistory?: string | null;
	soundCharacter?: string | null;
	connections?: string | null;
	includedItems?: string | null;
	specs?: RawSpec[] | null;
	yearsInProduction?: string | null;
	dimensions?: string | null;
	weight?: string | null;
	/** External https link to a manual. */
	manualUrl?: string | null;
	/** Uploaded manual: site-relative PDF path, e.g. "uploads/mc240_manual.pdf". */
	manualFile?: string | null;
	photos?: RawMedia[] | null;
	localPickupOnly?: boolean;
	shippingNote?: string | null;
	recommendedWith?: string[] | null;
}

export interface RawInfoPage {
	title: string;
	slug: string;
	summary?: string | null;
	menuGroup?: string | null;
	sortOrder: number;
	body?: Block[] | null;
}

export interface RawWantedItem {
	brand: string;
	model: string;
	note?: string | null;
	sortOrder: number;
}

export interface RawSiteSettings {
	shopName: string;
	tagline?: string | null;
	announcement?: string | null;
	heroTitle?: string | null;
	heroText?: string | null;
	heroImage?: RawMedia | null;
	email?: string | null;
	phone?: string | null;
	addressLines?: string[] | null;
	hours?: string[] | null;
	social?: { label: string; url: string }[] | null;
}

export interface RawContent {
	siteSettings: RawSiteSettings;
	categories: RawCategory[];
	brands: RawBrand[];
	products: RawProduct[];
	infoPages: RawInfoPage[];
	wantedItems: RawWantedItem[];
}
