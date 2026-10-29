/**
 * Inquiry form validation, shared by the browser (instant feedback) and the /api/inquiries
 * endpoint that stores inquiries in the CMS.
 */
import * as v from 'valibot';

export const INQUIRY_TYPES = {
	'product-question': 'Question about a piece',
	sell: 'Sell my gear',
	trade: 'Trade in toward a purchase',
	consign: 'Consign my gear',
	concierge: 'Help me build a system'
} as const;
export type InquiryType = keyof typeof INQUIRY_TYPES;

const text = (max: number, label: string) =>
	v.pipe(v.string(), v.trim(), v.maxLength(max, `${label} is too long (max ${max} characters).`));
const required = (min: number, max: number, label: string, message: string) =>
	v.pipe(
		v.string(),
		v.trim(),
		v.minLength(min, message),
		v.maxLength(max, `${label} is too long.`)
	);
const optional = (max: number, label: string) => v.optional(text(max, label), '');

const contact = {
	name: required(1, 100, 'Name', 'Please tell us your name.'),
	email: v.pipe(
		v.string(),
		v.trim(),
		v.minLength(1, 'Please enter your email address.'),
		v.email('Please enter a valid email address.'),
		v.maxLength(200, 'Email is too long.')
	),
	phone: optional(40, 'Phone'),
	message: required(10, 4000, 'Message', 'Please write a few words (at least 10 characters).'),
	/** Honeypot: hidden from people, filled in by bots. */
	website: v.optional(v.literal(''), '')
};

const gear = {
	gearDescription: required(3, 2000, 'Gear description', 'Please list the gear (brand and model).')
};

export const InquirySchema = v.variant('type', [
	v.object({
		type: v.literal('product-question'),
		productSku: v.optional(
			v.union([v.literal(''), v.pipe(v.string(), v.regex(/^[A-Z0-9][A-Z0-9-]{2,31}$/))]),
			''
		),
		...contact
	}),
	v.object({ type: v.picklist(['sell', 'trade', 'consign']), ...gear, ...contact }),
	v.object({
		type: v.literal('concierge'),
		budget: optional(60, 'Budget'),
		roomSize: optional(120, 'Room'),
		musicTaste: optional(400, 'Music'),
		...contact
	})
]);
export type Inquiry = v.InferOutput<typeof InquirySchema>;

export type InquiryResult =
	{ ok: true; data: Inquiry } | { ok: false; errors: Partial<Record<string, string>> };

export function validateInquiry(form: FormData): InquiryResult {
	const raw = Object.fromEntries(
		[...form].filter((entry): entry is [string, string] => typeof entry[1] === 'string')
	);
	const result = v.safeParse(InquirySchema, raw);
	if (result.success) return { ok: true, data: result.output };
	const nested = v.flatten<typeof InquirySchema>(result.issues).nested ?? {};
	const errors: Partial<Record<string, string>> = {};
	for (const [key, messages] of Object.entries(nested)) {
		if (messages?.[0]) errors[key] = messages[0];
	}
	if (!Object.keys(errors).length) errors.form = 'Please check the form and try again.';
	return { ok: false, errors };
}
