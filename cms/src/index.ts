import type { Core, UID } from '@strapi/strapi';
import { errors } from '@strapi/utils';
import { ADMIN_LAYOUTS, type AdminLayout } from './admin-layout';

const PRODUCT_UID = 'api::product.product';
const SETTINGS_UID = 'api::site-setting.site-setting';

/** Fields that are always full width in the admin's edit view. */
const FULL_WIDTH = new Set(['media', 'blocks', 'richtext', 'component', 'dynamiczone', 'json']);

function normalizeProductData(data: Record<string, unknown>) {
  if (typeof data.sku === 'string') data.sku = data.sku.trim().toUpperCase();
}

function validateSettingsData(data: Record<string, unknown>) {
  const social = data.social;
  if (!Array.isArray(social)) return;
  for (const link of social as { url?: unknown }[]) {
    if (typeof link?.url !== 'string') continue;
    let ok = false;
    try {
      ok = new URL(link.url.trim()).protocol === 'https:';
    } catch {
      ok = false;
    }
    if (!ok) throw new errors.ValidationError('Social links must be full https:// addresses.');
  }
}

/** Refuses to publish a product that the storefront can't present well. */
async function checkPublishable(strapi: Core.Strapi, documentId: string) {
  const draft = await strapi.documents(PRODUCT_UID).findOne({
    documentId,
    status: 'draft',
    populate: { brand: { fields: ['id'] }, category: { fields: ['id'] }, photos: { fields: ['id'] } },
  });
  if (!draft) return;
  const missing = [
    !draft.brand && 'a brand',
    !draft.category && 'a type of gear',
    !(draft.photos as unknown[] | null)?.length && 'at least one photo',
  ].filter(Boolean);
  if (missing.length) {
    throw new errors.ValidationError(`Add ${missing.join(', ')} before publishing this product.`);
  }
}

/** Applies src/admin-layout.ts: staff-friendly labels, help text and field order. */
async function applyAdminLayouts(strapi: Core.Strapi) {
  const service = strapi.plugin('content-manager').service('content-types');
  for (const [uid, layout] of Object.entries(ADMIN_LAYOUTS) as [UID.ContentType, AdminLayout][]) {
    const contentType = service.findContentType(uid);
    if (!contentType) continue;
    const current = await service.findConfiguration(contentType);
    const attributes = contentType.attributes as Record<string, { type: string }>;

    const metadatas = { ...current.metadatas };
    for (const [field, text] of Object.entries(layout.fields)) {
      if (!metadatas[field]) continue;
      metadatas[field] = {
        ...metadatas[field],
        edit: { ...metadatas[field].edit, ...text },
        list: { ...metadatas[field].list, label: text.label },
      };
    }

    const placed = new Set<string>();
    const edit = layout.edit
      .map((row) =>
        row
          .filter(([name]) => attributes[name])
          .map(([name, size]) => {
            placed.add(name);
            return { name, size: FULL_WIDTH.has(attributes[name].type) ? 12 : size };
          })
      )
      .filter((row) => row.length);
    // Never hide a field: anything editable that the layout forgot goes at the end.
    for (const row of current.layouts.edit as { name: string; size: number }[][]) {
      for (const field of row) {
        if (!placed.has(field.name)) edit.push([field]);
      }
    }

    await service.updateConfiguration(contentType, {
      settings: {
        ...current.settings,
        mainField: layout.mainField,
        defaultSortBy: layout.defaultSortBy,
        defaultSortOrder: layout.defaultSortOrder,
      },
      metadatas,
      layouts: { ...current.layouts, list: layout.list.filter((f) => metadatas[f]), edit },
    });
  }
}

export default {
  register({ strapi }: { strapi: Core.Strapi }) {
    // The site has no customer accounts: hide the users-permissions "User" type from staff menus.
    const user = strapi.contentType('plugin::users-permissions.user');
    if (user) {
      user.pluginOptions = {
        ...user.pluginOptions,
        'content-manager': { visible: false },
        'content-type-builder': { visible: false },
      };
    }

    strapi.documents.use(async (context, next) => {
      const params = context.params as { data?: Record<string, unknown>; documentId?: string };
      const writing = context.action === 'create' || context.action === 'update';

      if (context.uid === PRODUCT_UID) {
        if (writing && params.data) normalizeProductData(params.data);
        if (context.action === 'publish' && params.documentId) {
          await checkPublishable(strapi, params.documentId);
        }
      }
      if (context.uid === SETTINGS_UID && writing && params.data) {
        validateSettingsData(params.data);
      }
      return next();
    });
  },

  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    await applyAdminLayouts(strapi);
  },
};
