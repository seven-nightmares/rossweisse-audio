/**
 * How each content type looks in the admin for shop staff: plain-English labels, help text,
 * field order and list columns. Applied on every start by src/index.ts, so this file is the
 * source of truth: changes made with "Configure the view" in the admin are reset on restart.
 *
 * Edit rows hold fields whose sizes add up to 12 at most. Media, rich text and components are
 * always full width (12). Any field missing here is appended at the end so nothing gets hidden.
 */

export interface FieldText {
  label: string;
  description?: string;
  placeholder?: string;
}

export interface AdminLayout {
  mainField: string;
  defaultSortBy: string;
  defaultSortOrder: 'ASC' | 'DESC';
  list: string[];
  edit: [string, number][][];
  fields: Record<string, FieldText>;
}

export const ADMIN_LAYOUTS: Record<string, AdminLayout> = {
  'api::product.product': {
    mainField: 'title',
    defaultSortBy: 'arrivedOn',
    defaultSortOrder: 'DESC',
    list: ['title', 'sku', 'price', 'availability', 'arrivedOn'],
    edit: [
      [['title', 8], ['sku', 4]],
      [['brand', 6], ['category', 6]],
      [['modelNumber', 4], ['price', 4], ['availability', 4]],
      [['arrivedOn', 4], ['featured', 4], ['slug', 4]],
      [['summary', 12]],
      [['photos', 12]],
      [['conditionGrade', 6], ['newOrUsed', 6]],
      [['workingCondition', 6], ['cosmeticNotes', 6]],
      [['era', 4], ['technology', 4], ['voltage', 4]],
      [['rare', 4], ['localPickupOnly', 4]],
      [['description', 12]],
      [['serviceNotes', 6], ['tubeNotes', 6]],
      [['ownershipHistory', 6], ['soundCharacter', 6]],
      [['connections', 6], ['includedItems', 6]],
      [['specs', 12]],
      [['yearsInProduction', 4], ['dimensions', 4], ['weight', 4]],
      [['shippingNote', 12]],
      [['manual', 12]],
      [['recommendedWith', 6]],
    ],
    fields: {
      title: { label: 'Title', description: 'Brand, model and what it is, e.g. "McIntosh MC240 Tube Amplifier".' },
      sku: { label: 'Stock number (SKU)', description: 'Your stock code, e.g. RA-1042. Must be unique. Never change it once listed.' },
      slug: { label: 'Web address', description: 'Click ↻ to make it from the title. Avoid changing it after publishing: old links would break.' },
      brand: { label: 'Brand', description: 'Pick the maker. Add new makers under Content Manager → Brand.' },
      category: { label: 'Type of gear', description: 'Required before publishing.' },
      modelNumber: { label: 'Model', placeholder: 'e.g. MC240' },
      price: { label: 'Price (US dollars)', description: 'Whole dollars, no $ sign or commas: 4990 = $4,990.' },
      availability: { label: 'Availability', description: '"on-hold" keeps the price visible with an On hold label. "sold" hides the price and moves it to the Sold archive.' },
      arrivedOn: { label: 'Arrived on', description: 'Newest arrivals are shown first in "Just arrived".' },
      featured: { label: 'Staff favorite', description: 'Show it in "Staff favorites" on the home page.' },
      summary: { label: 'Short summary', description: 'One or two sentences (max 280 characters). Shown under the title and in link previews.' },
      photos: { label: 'Photos', description: 'Drag to reorder: the first photo is the one shown in the shop. Add a short alternative text to each.' },
      conditionGrade: { label: 'Condition grade', description: 'How it looks, using the Rating Scale page. Pick "new" or "new-old-stock" for unused pieces.' },
      newOrUsed: { label: 'New or pre-owned' },
      workingCondition: { label: 'Working condition', placeholder: 'Fully working. Tested on the bench and in our listening room.' },
      cosmeticNotes: { label: 'Cosmetic notes', description: 'Every scratch, dent or missing part the photos show.' },
      era: { label: 'Era' },
      technology: { label: 'Technology', description: 'Leave empty for speakers, turntables, cables and accessories.' },
      voltage: { label: 'Voltage', description: 'Leave empty if it has no power cord.' },
      rare: { label: 'Rare piece', description: 'Shows a "Rare" label on the page.' },
      localPickupOnly: { label: 'Local pickup or freight only', description: 'For speakers and very heavy pieces.' },
      description: { label: 'About this piece', description: 'The story: what makes it special, how it sounds, who it suits.' },
      serviceNotes: { label: 'Service notes', description: 'What was tested, serviced or replaced, when, and by whom.' },
      tubeNotes: { label: 'Tube notes', description: 'Tube gear only: which tubes are fitted and how they test.' },
      ownershipHistory: { label: 'Ownership', placeholder: 'e.g. Second owner; bought new in 1964.' },
      soundCharacter: { label: 'Sound' },
      connections: { label: 'Connections', placeholder: 'e.g. RCA inputs, speaker terminals for 4, 8 and 16 ohm.' },
      includedItems: { label: 'Included', placeholder: 'e.g. Original box, manual and remote.' },
      specs: { label: 'Specifications', description: 'One line per spec, e.g. "Power output" / "40 W per channel into 8 Ω".' },
      yearsInProduction: { label: 'Years made', placeholder: 'e.g. 1961–1968' },
      dimensions: { label: 'Dimensions', placeholder: 'e.g. 17 × 9 × 12 in (W × H × D)' },
      weight: { label: 'Weight', placeholder: 'e.g. 48 lb' },
      shippingNote: { label: 'Shipping note', description: 'Anything special about shipping this piece.' },
      manual: { label: 'Owner’s manual (PDF)' },
      recommendedWith: { label: 'Pairs well with', description: 'Optional: other pieces to suggest on this page.' },
    },
  },

  'api::brand.brand': {
    mainField: 'name',
    defaultSortBy: 'sortOrder',
    defaultSortOrder: 'ASC',
    list: ['name', 'country', 'authorizedDealer', 'sortOrder'],
    edit: [
      [['name', 6], ['slug', 6]],
      [['country', 4], ['founded', 4], ['sortOrder', 4]],
      [['blurb', 12]],
      [['authorizedDealer', 6]],
      [['products', 6]],
    ],
    fields: {
      name: { label: 'Name' },
      slug: { label: 'Web address', description: 'Click ↻ to make it from the name.' },
      country: { label: 'Country' },
      founded: { label: 'Founded (year)' },
      sortOrder: { label: 'Sort order', description: 'Lower numbers come first in menus and filters.' },
      blurb: { label: 'Short description', description: 'One or two sentences for the Brands page.' },
      authorizedDealer: { label: 'We are an authorized dealer' },
      products: { label: 'Products' },
    },
  },

  'api::category.category': {
    mainField: 'name',
    defaultSortBy: 'sortOrder',
    defaultSortOrder: 'ASC',
    list: ['name', 'showInMenu', 'showOnHome', 'sortOrder'],
    edit: [
      [['name', 6], ['slug', 6]],
      [['description', 12]],
      [['image', 12]],
      [['showInMenu', 4], ['showOnHome', 4], ['sortOrder', 4]],
      [['products', 6]],
    ],
    fields: {
      name: { label: 'Name' },
      slug: { label: 'Web address', description: 'Click ↻ to make it from the name.' },
      description: { label: 'Short description', description: 'Shown on the home page tile and the shop page.' },
      image: { label: 'Tile image', description: 'Shown on the home page when "Show on home page" is on.' },
      showInMenu: { label: 'Show in Shop menu' },
      showOnHome: { label: 'Show on home page' },
      sortOrder: { label: 'Sort order', description: 'Lower numbers come first.' },
      products: { label: 'Products' },
    },
  },

  'api::info-page.info-page': {
    mainField: 'title',
    defaultSortBy: 'sortOrder',
    defaultSortOrder: 'ASC',
    list: ['title', 'menuGroup', 'sortOrder'],
    edit: [
      [['title', 6], ['slug', 6]],
      [['summary', 12]],
      [['menuGroup', 6], ['sortOrder', 6]],
      [['body', 12]],
    ],
    fields: {
      title: { label: 'Title' },
      slug: { label: 'Web address', description: 'Don’t change the address of Rating Scale, Testing Process, Warranty, Shipping & Pickup, Consignment or Contact: the site links to them.' },
      summary: { label: 'Summary', description: 'One sentence shown under the title.' },
      menuGroup: { label: 'Menu', description: '"about" lists it under About; "sell" under Sell your gear; empty keeps it out of menus.' },
      sortOrder: { label: 'Sort order' },
      body: { label: 'Page text' },
    },
  },

  'api::wanted-item.wanted-item': {
    mainField: 'model',
    defaultSortBy: 'sortOrder',
    defaultSortOrder: 'ASC',
    list: ['brand', 'model', 'note', 'sortOrder'],
    edit: [[['brand', 6], ['model', 6]], [['note', 8], ['sortOrder', 4]]],
    fields: {
      brand: { label: 'Brand' },
      model: { label: 'Model(s)', placeholder: 'e.g. MC275 tube amplifier, all generations' },
      note: { label: 'Note', placeholder: 'e.g. Working or not' },
      sortOrder: { label: 'Sort order' },
    },
  },

  'api::inquiry.inquiry': {
    mainField: 'name',
    defaultSortBy: 'createdAt',
    defaultSortOrder: 'DESC',
    list: ['name', 'type', 'status', 'productTitle', 'createdAt'],
    edit: [
      [['status', 6], ['type', 6]],
      [['staffNotes', 12]],
      [['name', 4], ['email', 4], ['phone', 4]],
      [['message', 12]],
      [['productSku', 4], ['productTitle', 8]],
      [['gearDescription', 12]],
      [['budget', 4], ['roomSize', 4], ['musicTaste', 4]],
    ],
    fields: {
      status: { label: 'Status', description: 'Set to "replied" once you have answered, "closed" when done.' },
      type: { label: 'Type of inquiry' },
      staffNotes: { label: 'Staff notes', description: 'Private notes for the team. Never shown to the customer.' },
      name: { label: 'Name' },
      email: { label: 'Email' },
      phone: { label: 'Phone' },
      message: { label: 'Message' },
      productSku: { label: 'Piece (SKU)' },
      productTitle: { label: 'Piece' },
      gearDescription: { label: 'Their gear', description: 'For sell, trade and consign inquiries.' },
      budget: { label: 'Budget' },
      roomSize: { label: 'Room' },
      musicTaste: { label: 'Music' },
    },
  },

  'api::site-setting.site-setting': {
    mainField: 'shopName',
    defaultSortBy: 'shopName',
    defaultSortOrder: 'ASC',
    list: ['shopName'],
    edit: [
      [['shopName', 6], ['tagline', 6]],
      [['announcement', 12]],
      [['heroTitle', 12]],
      [['heroText', 12]],
      [['heroImage', 12]],
      [['email', 6], ['phone', 6]],
      [['address', 6], ['hours', 6]],
      [['social', 12]],
    ],
    fields: {
      shopName: { label: 'Shop name' },
      tagline: { label: 'Tagline', description: 'Shown above the home page headline and in the footer.' },
      announcement: { label: 'Announcement bar', description: 'The thin black bar at the very top of every page. Leave empty to hide it.' },
      heroTitle: { label: 'Home page headline' },
      heroText: { label: 'Home page introduction' },
      heroImage: { label: 'Home page picture', description: 'A wide picture (7 by 3, at least 2100 pixels wide) on a plain, light background. Keep the left 40% empty: the headline sits there. Phones crop the left side away.' },
      email: { label: 'Contact email' },
      phone: { label: 'Phone' },
      address: { label: 'Address', description: 'One line per row.' },
      hours: { label: 'Opening hours', description: 'One line per row, e.g. "Tue–Fri 11am–6pm".' },
      social: { label: 'Social links', description: 'Each needs a full https:// address.' },
    },
  },
};
