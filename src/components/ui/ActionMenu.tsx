'use client';

import { useEffect, useRef, useState } from 'react';

export type ActionItem = {
  label?: string;
  onClick?: () => void;
  href?: string;
  icon?: React.ReactNode;
  danger?: boolean;
  disabled?: boolean;
  separator?: boolean;
};

interface ActionMenuProps {
  items: ActionItem[];
  label?: string;
}

export function ActionMenu({ items, label = 'Actions' }: ActionMenuProps) {
  const [open, setOpen] = useState(false);
  const [style, setStyle] = useState<React.CSSProperties>({});
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const openMenu = () => {
    if (!btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    const menuH = items.length * 38 + 8;
    const spaceBelow = window.innerHeight - r.bottom;
    const top = spaceBelow < menuH ? r.top - menuH - 4 : r.bottom + 4;
    setStyle({ position: 'fixed', top, right: window.innerWidth - r.right, zIndex: 9999 });
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (
        !btnRef.current?.contains(e.target as Node) &&
        !menuRef.current?.contains(e.target as Node)
      ) setOpen(false);
    };
    const onScroll = () => setOpen(false);
    document.addEventListener('mousedown', close);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('mousedown', close);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [open]);

  return (
    <>
      <button
        ref={btnRef}
        onClick={openMenu}
        aria-haspopup="true"
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500"
      >
        {label}
        <svg
          className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          ref={menuRef}
          style={style}
          role="menu"
          className="w-44 overflow-hidden rounded-xl border border-gray-100 bg-white py-1 shadow-xl ring-1 ring-black/5"
        >
          {items.map((item, i) =>
            item.separator ? (
              <div key={i} className="my-1 border-t border-gray-100" />
            ) : item.href ? (
              <a
                key={item.label}
                href={item.href}
                role="menuitem"
                onClick={() => setOpen(false)}
                className={`flex w-full items-center gap-2.5 px-4 py-2 text-sm transition-colors ${
                  item.danger ? 'text-red-500 hover:bg-red-50 hover:text-red-600' : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {item.icon && <span className="flex h-4 w-4 shrink-0 items-center justify-center opacity-60">{item.icon}</span>}
                {item.label}
              </a>
            ) : (
              <button
                key={item.label}
                role="menuitem"
                disabled={item.disabled}
                onClick={() => { setOpen(false); item.onClick?.(); }}
                className={`flex w-full items-center gap-2.5 px-4 py-2 text-sm transition-colors ${
                  item.danger ? 'text-red-500 hover:bg-red-50 hover:text-red-600' : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                } ${item.disabled ? 'cursor-not-allowed opacity-40' : ''}`}
              >
                {item.icon && <span className="flex h-4 w-4 shrink-0 items-center justify-center opacity-60">{item.icon}</span>}
                {item.label}
              </button>
            )
          )}
        </div>
      )}
    </>
  );
}
