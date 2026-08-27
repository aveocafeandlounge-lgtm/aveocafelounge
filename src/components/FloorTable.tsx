import { Edit3, Trash2 } from 'lucide-react';
import type { TableItem } from '../types';
import { getTableLayout } from '../data/tableLayout';

interface FloorTableProps {
  table: TableItem;
  occupied: boolean;
  onEdit: (table: TableItem) => void;
  onDelete: (id: string) => void;
  onClick?: () => void;
  selected?: boolean;
  selectedSeat?: string;
  onSeatClick?: (seat: string, table: TableItem) => void;
}

export default function FloorTable({ table, occupied, onEdit, onDelete, onClick, selected = false, selectedSeat, onSeatClick }: FloorTableProps) {
  const layout = getTableLayout(table.name);

  if (!layout) return null;

  // Custom seat arrangement for joined Tables 01 and 02 (8 seats total across both tables)
  const isNearStairsTable = (table.name === 'Table 01' || table.name === 'Table 02');
  
  // Custom seat arrangement for Tables 18 and 19 (move seats further out)
  const isGardenEdgeTable = (table.name === 'Table 18' || table.name === 'Table 19');
  
  const seatPositions = isGardenEdgeTable
    ? [
        { left: '50%', top: '-35px', label: 'S1' },
        { left: '-35px', top: '50%', label: 'S2' },
        { right: '-35px', top: '50%', label: 'S3' },
        { left: '50%', bottom: '-35px', label: 'S4' },
      ]
    : isNearStairsTable
    ? table.name === 'Table 02'
      ? [
          // Table 02: S1-S4 at bottom in one line, S5-S8 on right side
          { left: '-20%', bottom: '-100px', label: 'S1' },
          { left: '26%', bottom: '-100px', label: 'S2' },
          { left: '70%', bottom: '-100px', label: 'S3' },
          { right: '-37px', bottom: '-99px', label: 'S4' },
          { right: '-37px', bottom: '-115%', label: 'S5' },
          { right: '-37px', bottom: '-65%', label: 'S6' },
          { right: '-37px', bottom: '-15%', label: 'S7' },
          { right: '-37px', top: '15%', label: 'S8' },
        ]
      : []
    : layout.seats === 10
    ? [
        { left: '50%', top: '-25px', label: 'S1' },
        { left: '50%', bottom: '-25px', label: 'S2' },
        { left: '-25px', top: '12%', label: 'S3' },
        { left: '-25px', top: '30%', label: 'S4' },
        { left: '-25px', top: '48%', label: 'S5' },
        { left: '-25px', top: '66%', label: 'S6' },
        { left: '-25px', top: '84%', label: 'S7' },
        { right: '-25px', top: '12%', label: 'S8' },
        { right: '-25px', top: '30%', label: 'S9' },
        { right: '-25px', top: '48%', label: 'S10' },
      ]
    : layout.seats === 6
    ? [
        { left: '5%', top: '-25px', label: 'S1' },
        { left: '55%', top: '-25px', label: 'S2' },
        { left: '-25px', top: '50%', label: 'S3' },
        { right: '-25px', top: '50%', label: 'S4' },
        { left: '5%', bottom: '-25px', label: 'S5' },
        { left: '55%', bottom: '-25px', label: 'S6' },
      ]
    : [
        { left: '50%', top: '-25px', label: 'S1' },
        { left: '-25px', top: '50%', label: 'S2' },
        { right: '-25px', top: '50%', label: 'S3' },
        { left: '50%', bottom: '-25px', label: 'S4' },
      ];

  return (
    <div
      className="group absolute z-20 cursor-pointer"
      style={{
        left: `${layout.x}%`,
        top: `${layout.y}%`,
      }}
      onClick={onClick}
    >
      <div
        className={`
          relative flex items-center justify-center
          border-2 shadow-md transition-all
          ${
            layout.shape === 'square'
              ? 'rounded-sm'
              : 'rounded-sm'
          }
          ${
            occupied
              ? 'border-red-500 bg-red-100 shadow-red-200'
              : selected
              ? 'border-green-600 bg-green-100 shadow-green-200'
              : 'border-slate-500 bg-white hover:border-green-600 hover:shadow-xl'
          }
        `}
        style={{
          width: layout.width,
          height: layout.height,
        }}
      >
        {seatPositions.map((position, index) => (
          <button
            key={index}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onSeatClick) onSeatClick(position.label, table);
            }}
            className={`
              absolute flex h-7 w-7
              items-center justify-center
              rounded-full border
              text-[7px] font-semibold
              cursor-pointer transition
              ${
                occupied
                  ? 'border-red-400 bg-red-500 text-white cursor-not-allowed'
                  : selected && selectedSeat === position.label
                  ? 'border-green-600 bg-green-500 text-white'
                  : 'border-slate-400 bg-white text-slate-600 hover:bg-green-100'
              }
            `}
            style={{
              ...position,
              transform:
                position.left === '50%'
                  ? 'translateX(-50%)'
                  : position.top === '50%'
                  ? 'translateY(-50%)'
                  : undefined,
            }}
            disabled={occupied}
          >
            {position.label}
          </button>
        ))}

        <div className="text-center">
          <div
            className={`
              text-xs font-bold
              ${
                occupied
                  ? 'text-red-700'
                  : 'text-slate-800'
              }
            `}
          >
            {table.name}
          </div>

          <div className="text-[9px] text-slate-500">
            {table.seats} seats
          </div>

          {occupied && (
            <div className="mt-1 text-[8px] font-bold text-red-600">
              OCCUPIED
            </div>
          )}
        </div>

        {/* Edit/Delete controls */}
        <div className="absolute -right-16 top-0 hidden gap-1 group-hover:flex">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(table);
            }}
            className="rounded-lg bg-green-600 p-2 text-white"
          >
            <Edit3 className="h-3 w-3" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(table!.id);
            }}
            className="rounded-lg bg-red-600 p-2 text-white"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
