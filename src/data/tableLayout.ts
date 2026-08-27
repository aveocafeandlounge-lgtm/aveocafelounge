import type { LayoutTable } from '../types';

export const TABLE_LAYOUT: LayoutTable[] = [
  // =========================================================
  // GROUND FLOOR
  // =========================================================

  {
    name: 'Table 01',
    floor: 'Ground Floor & Garden',
    section: 'Indoor',
    seats: 0,
    x: 55,
    y: 32,
    width: 68,
    height: 65,
    shape: 'rectangle',
  },

  {
    name: 'Table 02',
    floor: 'Ground Floor & Garden',
    section: 'Indoor',
    seats: 8,
    x: 55,
    y: 9,
    width: 68,
    height: 65,
    shape: 'rectangle',
  },

  {
    name: 'Table 03',
    floor: 'Ground Floor & Garden',
    section: 'Indoor',
    seats: 6,
    x: 83,
    y: 25,
    width: 68,
    height: 40,
    shape: 'rectangle',
  },

  // =========================================================
  // GARDEN
  // =========================================================

  {
    name: 'Table 10',
    floor: 'Ground Floor & Garden',
    section: 'Garden',
    seats: 6,
    x: 6,
    y: 57,
    width: 55,
    height: 60,
    shape: 'square',
  },

  {
    name: 'Table 11',
    floor: 'Ground Floor & Garden',
    section: 'Garden',
    seats: 4,
    x: 22,
    y: 12,
    width: 48,
    height: 60,
    shape: 'square',
  },

  {
    name: 'Table 12',
    floor: 'Ground Floor & Garden',
    section: 'Garden',
    seats: 4,
    x: 35,
    y: 57,
    width: 48,
    height: 60,
    shape: 'square',
  },

  {
    name: 'Table 13',
    floor: 'Ground Floor & Garden',
    section: 'Garden',
    seats: 4,
    x: 45,
    y: 12,
    width: 48,
    height: 60,
    shape: 'square',
  },

  {
    name: 'Table 14',
    floor: 'Ground Floor & Garden',
    section: 'Garden',
    seats: 10,
    x: 63,
    y: 20,
    width: 48,
    height: 112,
    shape: 'rectangle',
  },

  {
    name: 'Table 15',
    floor: 'Ground Floor & Garden',
    section: 'Garden',
    seats: 4,
    x: 80,
    y: 67,
    width: 48,
    height: 60,
    shape: 'square',
  },

  {
    name: 'Table 16',
    floor: 'Ground Floor & Garden',
    section: 'Garden',
    seats: 4,
    x: 90,
    y: 44,
    width: 48,
    height: 60,
    shape: 'square',
  },

  {
    name: 'Table 17',
    floor: 'Ground Floor & Garden',
    section: 'Garden',
    seats: 4,
    x: 80,
    y: 12,
    width: 48,
    height: 60,
    shape: 'square',
  },

  // These two are OUTSIDE the main garden rectangle
  {
    name: 'Table 18',
    floor: 'Ground Floor & Garden',
    section: 'Garden',
    seats: 4,
    x: 70,
    y: 15,
    width: 30,
    height: 25,
    shape: 'square',
  },

  {
    name: 'Table 19',
    floor: 'Ground Floor & Garden',
    section: 'Garden',
    seats: 4,
    x: 15,
    y: 15,
    width: 30,
    height: 25,
    shape: 'square',
  },

  // =========================================================
  // 1ST FLOOR
  // =========================================================

  {
    name: 'Table 06',
    floor: '1st Floor',
    section: 'Indoor',
    seats: 4,
    x: 9,
    y: 15,
    width: 65,
    height: 65,
    shape: 'square',
  },

  {
    name: 'Table 07',
    floor: '1st Floor',
    section: 'Indoor',
    seats: 4,
    x: 9,
    y: 50,
    width: 65,
    height: 65,
    shape: 'square',
  },

  {
    name: 'Table 08',
    floor: '1st Floor',
    section: 'Indoor',
    seats: 4,
    x: 34,
    y: 15,
    width: 65,
    height: 65,
    shape: 'square',
  },

  {
    name: 'Table 09',
    floor: '1st Floor',
    section: 'Indoor',
    seats: 4,
    x: 34,
    y: 50,
    width: 65,
    height: 65,
    shape: 'square',
  },

  {
    name: 'Table 05',
    floor: '1st Floor',
    section: 'Indoor',
    seats: 6,
    x: 56,
    y: 25,
    width: 105,
    height: 65,
    shape: 'rectangle',
  },

  {
    name: 'Table 04',
    floor: '1st Floor',
    section: 'Indoor',
    seats: 4,
    x: 84,
    y: 34,
    width: 105,
    height: 65,
    shape: 'rectangle',
  },
];

export function getTableLayout(tableName: string): LayoutTable | undefined {
  return TABLE_LAYOUT.find((table) => table.name === tableName);
}
