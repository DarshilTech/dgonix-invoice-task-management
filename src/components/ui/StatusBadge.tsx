type StatusBadgeProps = {
  status: string;
};

const statusClasses: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700 ring-gray-200',
  sent: 'bg-sky-50 text-sky-700 ring-sky-200',
  pending: 'bg-gray-100 text-gray-700 ring-gray-200',
  confirmed: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  paid: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  partially_paid: 'bg-amber-50 text-amber-700 ring-amber-200',
  overdue: 'bg-red-50 text-red-700 ring-red-200',
  failed: 'bg-red-50 text-red-700 ring-red-200',
  cancelled: 'bg-gray-100 text-gray-600 ring-gray-200',
};

export function humanizeStatus(status: string) {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
        statusClasses[status] || statusClasses.draft
      }`}
    >
      {humanizeStatus(status)}
    </span>
  );
}
