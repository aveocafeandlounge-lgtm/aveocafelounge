import type { TableItem } from '../types';
import FloorTable from './FloorTable';

interface FirstFloorPlanProps {
  tables: TableItem[];
  occupiedTableNames: Set<string>;
  onEdit: (table: TableItem) => void;
  onDelete: (id: string) => void;
  onTableClick: (table: TableItem) => void;
  selectedTable?: string;
  selectedSeat?: string;
  onSeatClick?: (seat: string, table: TableItem) => void;
}

export default function FirstFloorPlan({
  tables,
  occupiedTableNames,
  onEdit,
  onDelete,
  onTableClick,
  selectedTable,
  selectedSeat,
  onSeatClick,
}: FirstFloorPlanProps) {
  const getTable = (name: string) => tables.find((table) => table.name === name);

  return (
    <div className="overflow-auto rounded-3xl border bg-slate-100 p-5">
      <div className="relative w-full">
        <div className="mb-6 flex justify-center">
          <div className="border-2 border-slate-400 bg-white px-24 py-5 text-3xl font-semibold">
            01 Floor
          </div>
        </div>

        {/* 45' × 30' BUILDING */}
        <div className="relative h-[700px] w-full border-2 border-slate-500 bg-white">
          {/* 30' × 13' upper dining area */}
          <div className="absolute left-0 right-0 top-0 h-[52%] border-b-2 border-slate-500">
            {/* Table 06 */}
            {getTable('Table 06') && (
              <FloorTable
                table={getTable('Table 06')!}
                occupied={occupiedTableNames.has('Table 06')}
                onEdit={onEdit}
                onDelete={onDelete}
                onClick={() => onTableClick(getTable('Table 06')!)}
                selected={selectedTable === 'Table 06'}
                selectedSeat={selectedSeat}
                onSeatClick={onSeatClick}
              />
            )}

            {/* Table 07 */}
            {getTable('Table 07') && (
              <FloorTable
                table={getTable('Table 07')!}
                occupied={occupiedTableNames.has('Table 07')}
                onEdit={onEdit}
                onDelete={onDelete}
                onClick={() => onTableClick(getTable('Table 07')!)}
                selected={selectedTable === 'Table 07'}
                selectedSeat={selectedSeat}
                onSeatClick={onSeatClick}
              />
            )}

            {/* Table 08 */}
            {getTable('Table 08') && (
              <FloorTable
                table={getTable('Table 08')!}
                occupied={occupiedTableNames.has('Table 08')}
                onEdit={onEdit}
                onDelete={onDelete}
                onClick={() => onTableClick(getTable('Table 08')!)}
                selected={selectedTable === 'Table 08'}
                selectedSeat={selectedSeat}
                onSeatClick={onSeatClick}
              />
            )}

            {/* Table 09 */}
            {getTable('Table 09') && (
              <FloorTable
                table={getTable('Table 09')!}
                occupied={occupiedTableNames.has('Table 09')}
                onEdit={onEdit}
                onDelete={onDelete}
                onClick={() => onTableClick(getTable('Table 09')!)}
                selected={selectedTable === 'Table 09'}
                selectedSeat={selectedSeat}
                onSeatClick={onSeatClick}
              />
            )}

            {/* Table 05 */}
            {getTable('Table 05') && (
              <FloorTable
                table={getTable('Table 05')!}
                occupied={occupiedTableNames.has('Table 05')}
                onEdit={onEdit}
                onDelete={onDelete}
                onClick={() => onTableClick(getTable('Table 05')!)}
                selected={selectedTable === 'Table 05'}
                selectedSeat={selectedSeat}
                onSeatClick={onSeatClick}
              />
            )}

            {/* Table 04 */}
            {getTable('Table 04') && (
              <FloorTable
                table={getTable('Table 04')!}
                occupied={occupiedTableNames.has('Table 04')}
                onEdit={onEdit}
                onDelete={onDelete}
                onClick={() => onTableClick(getTable('Table 04')!)}
                selected={selectedTable === 'Table 04'}
                selectedSeat={selectedSeat}
                onSeatClick={onSeatClick}
              />
            )}

            {/* Stairs */}
            <div className="absolute left-[65%] bottom-0 flex h-[40%] w-[17%] items-center justify-center border-2 border-slate-500 bg-slate-100 text-2xl font-semibold">
              Stairs
            </div>
          </div>

          {/* HAPPY LIFE */}
          <div className="absolute bottom-0 left-0 right-0 flex h-[48%] items-center justify-center bg-white">
            <div className="border-2 border-slate-400 px-24 py-8 text-4xl font-semibold">
              Happy Life
            </div>
          </div>
        </div>

        {/* DIMENSION */}
        <div className="mt-2 text-center text-lg font-semibold text-slate-600">
          45′
        </div>
      </div>
    </div>
  );
}
