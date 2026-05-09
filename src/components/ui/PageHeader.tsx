import Link from 'next/link';
import type { ReactNode } from 'react';

type Crumb = {
  label: string;
  href?: string;
  home?: boolean;
};

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  breadcrumbs?: Crumb[];
  actions?: ReactNode;
};

function HomeIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}

export function PageHeader({ title, subtitle, breadcrumbs, actions }: PageHeaderProps) {
  return (
    <div className="mb-6 space-y-1.5">
       {/* Title row */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="section-title">{title}</h1>
          {subtitle && <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1.5 text-sm text-gray-400">
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <span>/</span>}
              {crumb.href ? (
                <Link
                  href={crumb.href}
                  className="flex items-center gap-1 hover:text-gray-600 transition-colors"
                >
                  {crumb.home && <HomeIcon />}
                  {!crumb.home && crumb.label}
                </Link>
              ) : (
                <span className="font-medium text-gray-700">
                  {crumb.home ? <HomeIcon /> : crumb.label}
                </span>
              )}
            </span>
          ))}
        </nav>
      )}
    </div>
  );
}
