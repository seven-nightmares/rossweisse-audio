import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { ADMIN_LAYOUTS } from './admin-layout';

/** Reads a content type's schema.json from src/api by its UID (api::name.name). */
function schemaFor(uid: string) {
  const name = uid.split('::')[1].split('.')[0];
  const file = path.join(__dirname, 'api', name, 'content-types', name, 'schema.json');
  return JSON.parse(fs.readFileSync(file, 'utf8')) as {
    attributes: Record<string, { type: string; private?: boolean }>;
  };
}

describe('admin layouts', () => {
  for (const [uid, layout] of Object.entries(ADMIN_LAYOUTS)) {
    describe(uid, () => {
      const attributes = schemaFor(uid).attributes;
      const placed = layout.edit.flat().map(([name]) => name);

      it('places every field exactly once', () => {
        expect([...placed].sort()).toEqual(Object.keys(attributes).sort());
      });

      it('keeps every row within 12 columns', () => {
        for (const row of layout.edit) {
          expect(row.reduce((sum, [, size]) => sum + size, 0)).toBeLessThanOrEqual(12);
        }
      });

      it('labels every field and only real fields', () => {
        expect(Object.keys(layout.fields).sort()).toEqual(Object.keys(attributes).sort());
      });

      it('lists and sorts by real fields', () => {
        const known = new Set([...Object.keys(attributes), 'createdAt', 'updatedAt']);
        for (const field of layout.list) expect(known.has(field), field).toBe(true);
        expect(known.has(layout.defaultSortBy)).toBe(true);
        expect(known.has(layout.mainField)).toBe(true);
      });
    });
  }
});
