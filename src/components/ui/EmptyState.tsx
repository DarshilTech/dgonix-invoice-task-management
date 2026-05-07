type EmptyStateProps = {
  title: string;
  description?: string;
  action?: React.ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white px-6 py-10 text-center">
      <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      {description ? <p className="mt-2 max-w-md text-sm text-gray-600">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
