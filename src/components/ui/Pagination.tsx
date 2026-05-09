const DEFAULT_ROWS = [10, 25, 50, 100];

type PaginationProps = {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  rowsOptions?: number[];
};

function Btn({
  onClick,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  disabled: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-500 transition-colors hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-30"
    >
      {children}
    </button>
  );
}

export function Pagination({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
  onLimitChange,
  rowsOptions = DEFAULT_ROWS,
}: PaginationProps) {
  const safePages = totalPages || 1;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 bg-gray-50/40 px-4 py-3">
      {/* Total */}
      <span className="text-sm text-gray-500">
        Total results: <span className="font-medium text-gray-700">{total}</span>
      </span>

      {/* Page controls */}
      <div className="flex items-center gap-1">
        <Btn onClick={() => onPageChange(1)} disabled={page === 1} title="First">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </Btn>
        <Btn onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page === 1} title="Previous">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Btn>
        <span className="min-w-[60px] rounded-md border border-gray-200 bg-white px-3 py-1 text-center text-sm font-medium text-gray-700">
          {page} / {safePages}
        </span>
        <Btn onClick={() => onPageChange(Math.min(safePages, page + 1))} disabled={page >= safePages} title="Next">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Btn>
        <Btn onClick={() => onPageChange(safePages)} disabled={page >= safePages} title="Last">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
        </Btn>
      </div>

      {/* Rows per page */}
      <div className="flex items-center gap-1.5 text-sm text-gray-500">
        rows:
        <select
          value={limit}
          onChange={(e) => { onLimitChange(Number(e.target.value)); onPageChange(1); }}
          className="rounded-md border border-gray-200 bg-white px-2 py-1 text-sm text-gray-700 focus:border-primary-400 focus:outline-none"
        >
          {rowsOptions.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
