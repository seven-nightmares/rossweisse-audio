'use strict';

/**
 * Loads the storefront's sample content (web/src/lib/demo/content.json, bind-mounted into the
 * container at /opt/app/demo-content) into Strapi, so the demo site and the CMS can't drift.
 * Idempotent: entries are matched by slug or SKU and existing ones are left alone.
 *
 *   npm run seed                     # sample content only
 *   npm run seed -- --with-token     # also (re)create the storefront's two API tokens and print them
 */

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const sharp = require('sharp');
const { compileStrapi, createStrapi } = require('@strapi/strapi');

const CONTENT_DIR = process.env.DEMO_CONTENT_DIR ?? path.join(__dirname, '..', 'demo-content');
const content = JSON.parse(fs.readFileSync(path.join(CONTENT_DIR, 'data', 'content.json'), 'utf8'));
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'audiostore-seed-'));

const READ_TOKEN = 'Storefront (catalog read)';
const INQUIRY_TOKEN = 'Storefront inquiries (create only)';

/** Storefront facet keys → CMS enumeration values (CMS values can't start with a digit). */
const GRADE = {
  new: 'new',
  nos: 'new-old-stock',
  10: 'grade-10-mint',
  9: 'grade-9-excellent',
  8: 'grade-8-very-good',
  7: 'grade-7-good',
  6: 'grade-6-fair',
  5: 'grade-5-average',
  4: 'grade-4-worn',
  3: 'grade-3-rough',
  2: 'grade-2-very-rough',
  1: 'grade-1-for-parts',
};
const NEW_OR_USED = { new: 'new', 'pre-owned': 'pre-owned', nos: 'new-old-stock' };
const VOLTAGE = { '120v': 'us-120v', '240v': 'intl-220-240v', switchable: 'switchable' };

/** Converts one of the demo's SVG illustrations to JPG and uploads it to the media library. */
async function uploadImage(strapi, media) {
  if (!media) return null;
  const name = path.basename(media.url, '.svg');
  const existing = await strapi.db.query('plugin::upload.file').findOne({ where: { name: `${name}.jpg` } });
  if (existing) return existing.id;

  const filepath = path.join(tmpDir, `${name}.jpg`);
  await sharp(path.join(CONTENT_DIR, 'static', media.url), { density: 96 })
    .resize({ width: media.width, height: media.height, fit: 'fill' })
    .flatten({ background: '#e4e1dc' })
    .jpeg({ quality: 84, mozjpeg: true })
    .toFile(filepath);
  const [file] = await strapi
    .plugin('upload')
    .service('upload')
    .upload({
      data: { fileInfo: { name: `${name}.jpg`, alternativeText: media.alternativeText ?? '' } },
      files: { filepath, originalFilename: `${name}.jpg`, mimetype: 'image/jpeg', size: fs.statSync(filepath).size },
    });
  return file.id;
}

async function upsert(strapi, uid, key, entries, mapData) {
  const byKey = {};
  let created = 0;
  for (const entry of entries) {
    const existing = await strapi.documents(uid).findFirst({ filters: { [key]: entry[key] }, status: 'draft' });
    if (existing) {
      byKey[entry[key]] = existing;
      continue;
    }
    const { status, data } = await mapData(entry);
    byKey[entry[key]] = await strapi.documents(uid).create({ status, data });
    created++;
  }
  return { byKey, created };
}

async function seed(strapi) {
  const categories = await upsert(strapi, 'api::category.category', 'slug', content.categories, async (c) => ({
    data: { ...c, image: await uploadImage(strapi, c.image) },
  }));

  const brands = await upsert(strapi, 'api::brand.brand', 'slug', content.brands, async (b) => ({ data: b }));

  const settingsUid = 'api::site-setting.site-setting';
  if (!(await strapi.documents(settingsUid).findFirst())) {
    const { addressLines, hours, heroImage, ...rest } = content.siteSettings;
    await strapi.documents(settingsUid).create({
      data: {
        ...rest,
        heroImage: await uploadImage(strapi, heroImage),
        address: (addressLines ?? []).join('\n'),
        hours: (hours ?? []).join('\n'),
      },
    });
  }

  const infoPages = await upsert(strapi, 'api::info-page.info-page', 'slug', content.infoPages, async (p) => ({
    status: 'published',
    data: p,
  }));

  const wantedUid = 'api::wanted-item.wanted-item';
  if ((await strapi.documents(wantedUid).count()) === 0) {
    for (const w of content.wantedItems) await strapi.documents(wantedUid).create({ data: w });
  }

  const products = await upsert(strapi, 'api::product.product', 'sku', content.products, async (p) => {
    const photos = [];
    for (const media of p.photos ?? []) photos.push(await uploadImage(strapi, media));
    const { recommendedWith: _later, manualUrl: _none, photos: _p, ...fields } = p;
    return {
      status: 'published',
      data: {
        ...fields,
        brand: brands.byKey[p.brand]?.documentId ?? null,
        category: categories.byKey[p.category]?.documentId ?? null,
        conditionGrade: GRADE[p.conditionGrade],
        newOrUsed: NEW_OR_USED[p.newOrUsed],
        voltage: p.voltage ? VOLTAGE[p.voltage] : null,
        photos,
      },
    };
  });

  // Second pass: "pairs well with" links need every product to exist first.
  for (const p of content.products) {
    const doc = products.byKey[p.sku];
    const links = (p.recommendedWith ?? []).map((sku) => products.byKey[sku]?.documentId).filter(Boolean);
    if (!doc || !links.length) continue;
    await strapi.documents('api::product.product').update({ documentId: doc.documentId, data: { recommendedWith: links } });
    await strapi.documents('api::product.product').publish({ documentId: doc.documentId });
  }

  return {
    categories: categories.created,
    brands: brands.created,
    infoPages: infoPages.created,
    products: products.created,
  };
}

/** Creates the token, or resets an existing one to exactly these permissions, and returns a fresh key. */
async function ensureToken(strapi, name, spec) {
  const tokens = strapi.service('admin::api-token-content-api');
  const existing = await tokens.getByName(name);
  if (!existing) return (await tokens.create({ name, lifespan: null, ...spec })).accessKey;
  await tokens.update(existing.id, spec);
  return (await tokens.regenerate(existing.id)).accessKey;
}

/**
 * The storefront may read catalog content only. Strapi's built-in "read-only" token type would
 * also expose inquiries (customer names, emails and messages), so this is a custom token.
 */
const CATALOG_READ = [
  'api::product.product',
  'api::brand.brand',
  'api::category.category',
  'api::info-page.info-page',
  'api::wanted-item.wanted-item',
].flatMap((uid) => [`${uid}.find`, `${uid}.findOne`]).concat('api::site-setting.site-setting.find');

async function main() {
  const withToken = process.argv.includes('--with-token');
  const app = await createStrapi(await compileStrapi()).load();
  app.log.level = 'error';

  try {
    const created = await seed(app);
    console.log(
      `Seed complete. New: ${created.products} products, ${created.brands} brands, ` +
        `${created.categories} categories, ${created.infoPages} info pages.`
    );

    if (withToken) {
      const read = await ensureToken(app, READ_TOKEN, {
        type: 'custom',
        description: 'Used by the storefront to read catalog content. Cannot see inquiries.',
        permissions: CATALOG_READ,
      });
      const inquiry = await ensureToken(app, INQUIRY_TOKEN, {
        type: 'custom',
        description: 'Used by the storefront to save website inquiries. Can only create inquiries.',
        permissions: ['api::inquiry.inquiry.create'],
      });
      console.log('\nCopy these into .env, then run: docker compose up -d web\n');
      console.log(`STRAPI_API_TOKEN=${read}`);
      console.log(`STRAPI_INQUIRY_TOKEN=${inquiry}\n`);
    }
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    await app.destroy();
  }
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  }
);
