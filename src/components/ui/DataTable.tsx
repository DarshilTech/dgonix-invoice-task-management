import type { ReactNode } from 'react';

export type Column<T> = {
  key: string;
  label: string;
  sortable?: boolean;
  calIcon?: boolean;
  headerClass?: string;
  cellClass?: string | ((row: T) => string);
  render: (row: T) => ReactNode;
};

type DataTableProps<T> = {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  loadingRows?: number;
  sortKey?: string;
  sortDir?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  selected?: Set<string>;
  onSelectAll?: () => void;
  onSelectRow?: (id: string) => void;
  rowKey: (row: T) => string;
  visibleCols?: Set<string>;
  emptyText?: string;
  rowAction?: (row: T) => ReactNode;
  rowClassName?: (row: T) => string;
};

function SortIcon({ active, dir }: { active: boolean; dir?: 'asc' | 'desc' }) {
  return (
    <svg
      className={`ml-1 inline h-3 w-3 transition-opacity ${active ? 'opacity-80' : 'opacity-30'}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
    >
      {active && dir === 'asc' ? (
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 15l4-4 4 4" />
      ) : active && dir === 'desc' ? (
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4 4 4-4" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4M16 15l-4 4-4-4" />
      )}
    </svg>
  );
}

function CalIcon() {
  return (
    <svg className="mr-1 inline h-3.5 w-3.5 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

export function DataTable<T>({
  columns,
  data,
  loading = false,
  loadingRows = 10,
  sortKey,
  sortDir,
  onSort,
  selected,
  onSelectAll,
  onSelectRow,
  rowKey,
  visibleCols,
  emptyText = 'No records found',
  rowAction,
  rowClassName,
}: DataTableProps<T>) {
  const selectable = !!selected && !!onSelectAll && !!onSelectRow;
  const hasActions = !!rowAction;
  const allChecked = selectable && data.length > 0 && data.every((row) => selected!.has(rowKey(row)));

  const visibleColumns = visibleCols
    ? columns.filter((col) => visibleCols.has(col.key))
    : columns;

  const colSpan = visibleColumns.length + (selectable ? 1 : 0) + (hasActions ? 1 : 0);

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="border-b border-gray-100 bg-gray-50/60">
            <tr>
              {selectable && (
                <th className="w-10 px-3 py-3">
                  <input
                    type="checkbox"
                    checked={allChecked}
                    onChange={onSelectAll}
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </th>
              )}
              {visibleColumns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => col.sortable && onSort?.(col.key)}
                  className={[
                    'whitespace-nowrap px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 transition-colors',
                    col.sortable ? 'cursor-pointer select-none hover:text-gray-800' : '',
                    col.sortable && sortKey === col.key ? 'text-gray-800' : '',
                    col.headerClass ?? '',
                  ].join(' ')}
                >
                  {col.calIcon && <CalIcon />}
                  {col.label}
                  {col.sortable && (
                    <SortIcon active={sortKey === col.key} dir={sortKey === col.key ? sortDir : undefined} />
                  )}
                </th>
              ))}
              {hasActions && <th className="px-3 py-3" />}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-50">
            {loading ? (
              Array.from({ length: loadingRows }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {selectable && (
                    <td className="px-3 py-3.5">
                      <div className="h-4 w-4 rounded bg-gray-100" />
                    </td>
                  )}
                  {visibleColumns.map((col) => (
                    <td key={col.key} className="px-3 py-3.5">
                      <div className={`h-4 rounded bg-gray-100 ${col.key === 'status' ? 'w-16 rounded-full' : 'w-28'}`} />
                    </td>
                  ))}
                  {hasActions && <td className="px-3 py-3.5" />}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={colSpan} className="py-16 text-center text-sm text-gray-400">
                  {emptyText}
                </td>
              </tr>
            ) : (
              data.map((row) => {
                const id = rowKey(row);
                const isSelected = selectable && selected!.has(id);
                return (
                  <tr
                    key={id}
                    className={[
                      'transition-colors hover:bg-gray-50/70',
                      isSelected ? 'bg-primary-50/40' : '',
                      rowClassName ? rowClassName(row) : '',
                    ].join(' ')}
                  >
                    {selectable && (
                      <td className="px-3 py-3.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onSelectRow!(id)}
                          className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                      </td>
                    )}
                    {visibleColumns.map((col) => {
                      const cc =
                        typeof col.cellClass === 'function'
                          ? col.cellClass(row)
                          : col.cellClass ?? '';
                      return (
                        <td key={col.key} className={`px-3 py-3.5 text-sm ${cc}`}>
                          {col.render(row)}
                        </td>
                      );
                    })}
                    {hasActions && (
                      <td className="px-3 py-3.5">{rowAction!(row)}</td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
