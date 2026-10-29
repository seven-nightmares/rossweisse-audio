/** View models sent to the browser. Built by #lib/catalog/present.ts. */
import type {
	AvailabilityStatus,
	ConditionGrade,
	Era,
	NewOrUsed,
	Technology,
	Voltage
} from './facets.ts';

export interface Image {
	src: string;
	srcset: string;
	width: number;
	height: number;
	alt: string;
}

export interface Term {
	name: string;
	slug: string;
}

export interface Category extends Term {
	description: string | null;
	image: Image | null;
	showInMenu: boolean;
	showOnHome: boolean;
}

export interface Brand extends Term {
	country: string | null;
	founded: number | null;
	blurb: string | null;
	authorizedDealer: boolean;
}

/** Inline/blocks content from Strapi's rich text (Blocks) editor. */
export type Block =
	| { type: 'paragraph'; children: Inline[] }
	| { type: 'heading'; level: 1 | 2 | 3 | 4 | 5 | 6; children: Inline[] }
	| { type: 'quote'; children: Inline[] }
	| { type: 'list'; format: 'ordered' | 'unordered'; children: ListItem[] }
	| { type: 'code'; children: Inline[] };

export interface ListItem {
	type: 'list-item';
	children: Inline[];
}

export type Inline =
	| {
			type: 'text';
			text: string;
			bold?: boolean;
			italic?: boolean;
			underline?: boolean;
			strikethrough?: boolean;
			code?: boolean;
	  }
	| { type: 'link'; url: string; children: Inline[] };

export interface Spec {
	label: string;
	value: string;
}

interface ProductBase {
	sku: string;
	slug: string;
	title: string;
	brand: Term | null;
	category: Term | null;
	conditionGrade: ConditionGrade;
	newOrUsed: NewOrUsed;
	era: Era;
	technology: Technology | null;
	/** ISO date (YYYY-MM-DD) the piece arrived; drives "Just arrived". */
	arrivedOn: string;
	image: Image | null;
}

/**
 * Sold items carry no price: it is stripped in the presenter so the historical price
 * never reaches the browser. On-hold items keep their price.
 */
export type ProductCard = ProductBase &
	(
		| { status: Exclude<AvailabilityStatus, 'sold'>; sold: false; price: number }
		| { status: 'sold'; sold: true; price?: never }
	);

export type ProductDetail = ProductCard & {
	summary: string;
	modelNumber: string | null;
	voltage: Voltage | null;
	rare: boolean;
	workingCondition: string | null;
	cosmeticNotes: string | null;
	description: Block[];
	serviceNotes: string | null;
	tubeNotes: string | null;
	ownershipHistory: string | null;
	soundCharacter: string | null;
	connections: string | null;
	includedItems: string | null;
	specs: Spec[];
	yearsInProduction: string | null;
	dimensions: string | null;
	weight: string | null;
	manualUrl: string | null;
	localPickupOnly: boolean;
	shippingNote: string | null;
	photos: Image[];
	recommended: ProductCard[];
};

/** A product reference for the inquiry form's "Which piece?" picker. */
export interface ProductOption {
	sku: string;
	title: string;
}

export interface InfoPageLink {
	title: string;
	slug: string;
	menuGroup: 'about' | 'sell' | null;
}

export interface InfoPage extends InfoPageLink {
	summary: string | null;
	body: Block[];
}

export interface WantedItem {
	brand: string;
	model: string;
	note: string | null;
}

export interface SocialLink {
	label: string;
	url: string;
}

export interface SiteSettings {
	shopName: string;
	tagline: string | null;
	announcement: string | null;
	heroTitle: string | null;
	heroText: string | null;
	heroImage: Image | null;
	email: string | null;
	phone: string | null;
	addressLines: string[];
	hours: string[];
	social: SocialLink[];
}

export interface SearchResult {
	items: ProductCard[];
	total: number;
	page: number;
	pageCount: number;
}

export interface Taxonomies {
	categories: Category[];
	brands: Brand[];
}
