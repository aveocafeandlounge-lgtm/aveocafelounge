import type { TableItem } from '../types';
import FloorTable from './FloorTable';

interface GroundFloorPlanProps {
  tables: TableItem[];
  occupiedTableNames: Set<string>;
  onEdit: (table: TableItem) => void;
  onDelete: (id: string) => void;
  onTableClick: (table: TableItem) => void;
  selectedTable?: string;
  selectedSeat?: string;
  onSeatClick?: (seat: string, table: TableItem) => void;
}

export default function GroundFloorPlan({
  tables,
  occupiedTableNames,
  onEdit,
  onDelete,
  onTableClick,
  selectedTable,
  selectedSeat,
  onSeatClick,
}: GroundFloorPlanProps) {
  const getTable = (name: string) => tables.find((table) => table.name === name);

  return (
    <div className="overflow-auto rounded-3xl border bg-slate-100 p-5">
      <div className="relative w-full">
        {/* ================= GARDEN LABEL ================= */}
        <div className="mb-6 flex justify-center">
          <div className="border-2 border-slate-400 bg-white px-20 py-5 text-3xl font-semibold">
            Garden
          </div>
        </div>

        {/* ================= GARDEN ================= */}
        <div className="relative h-[250px] w-full border-2 border-slate-500 bg-emerald-50">
          {['Table 10', 'Table 11', 'Table 12', 'Table 13', 'Table 14', 'Table 15', 'Table 16', 'Table 17'].map(
            (name) => {
              const table = getTable(name);
              if (!table) return null;
              return (
                <FloorTable
                  key={name}
                  table={table}
                  occupied={occupiedTableNames.has(name)}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onClick={() => onTableClick(table)}
                  selected={selectedTable === name}
                  selectedSeat={selectedSeat}
                  onSeatClick={onSeatClick}
                />
              );
            }
          )}
        </div>

        {/* ================= TABLE 19 / 18 ================= */}
        <div className="relative h-[70px]">
          {['Table 19', 'Table 18'].map((name) => {
            const table = getTable(name);
            if (!table) return null;
            return (
              <FloorTable
                key={name}
                table={table}
                occupied={occupiedTableNames.has(name)}
                onEdit={onEdit}
                onDelete={onDelete}
                onClick={() => onTableClick(table)}
                selected={selectedTable === name}
              />
            );
          })}
        </div>

        {/* ================= GROUND FLOOR ================= */}
        <div className="relative mt-5 h-[300px] border-2 border-slate-500 bg-white">
          {/* Kitchen */}
          <div className="absolute left-0 top-0 flex h-[55%] w-[30%] items-center justify-center border-r-2 border-slate-500 bg-slate-50 text-2xl font-semibold">
            Kitchen
          </div>

          {/* 13' × 13' label */}
          <div className="absolute left-[13%] top-[48%] text-xs text-slate-500">
            13′ × 13′
          </div>

          {/* Bar */}
          <div className="absolute left-[32.4%] top-[-3%] flex h-[30%] w-[7%] rotate-90 items-center justify-center border-2 border-slate-400 bg-amber-50 text-xl font-semibold">
            Bar
          </div>

          {/* Counter */}
          <div className="absolute left-[42%] top-0 flex h-[55%] w-[7%] items-center justify-center border-2 border-slate-400 bg-slate-50 text-lg font-semibold [writing-mode:vertical-rl]">
            Counter
          </div>

          {/* Stairs */}
          <div className="absolute left-[65%] top-[15%] flex h-[48%] w-[14%] items-center justify-center border-2 border-slate-500 bg-slate-100 text-2xl font-semibold">
            Stairs
          </div>

          {/* Table 01 */}
          {getTable('Table 01') && (
            <FloorTable
              table={getTable('Table 01')!}
              occupied={occupiedTableNames.has('Table 01')}
              onEdit={onEdit}
              onDelete={onDelete}
              onClick={() => onTableClick(getTable('Table 01')!)}
              selected={selectedTable === 'Table 01'}
              selectedSeat={selectedSeat}
              onSeatClick={onSeatClick}
            />
          )}

          {/* Table 02 */}
          {getTable('Table 02') && (
            <FloorTable
              table={getTable('Table 02')!}
              occupied={occupiedTableNames.has('Table 02')}
              onEdit={onEdit}
              onDelete={onDelete}
              onClick={() => onTableClick(getTable('Table 02')!)}
              selected={selectedTable === 'Table 02'}
              selectedSeat={selectedSeat}
              onSeatClick={onSeatClick}
            />
          )}

          {/* Table 03 */}
          {getTable('Table 03') && (
            <FloorTable
              table={getTable('Table 03')!}
              occupied={occupiedTableNames.has('Table 03')}
              onEdit={onEdit}
              onDelete={onDelete}
              onClick={() => onTableClick(getTable('Table 03')!)}
              selected={selectedTable === 'Table 03'}
              selectedSeat={selectedSeat}
              onSeatClick={onSeatClick}
            />
          )}

          {/* Happy Life */}
          <div className="absolute bottom-0 left-0 right-0 flex h-[38%] items-center justify-center border-t-2 border-slate-500 bg-white text-3xl font-semibold">
            Happy Life
          </div>
        </div>
      </div>
    </div>
  );
}
