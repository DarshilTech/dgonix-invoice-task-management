'use client';

import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { ChevronDown } from 'lucide-react';

export type ActionItem = {
  label: string;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
};

interface ActionMenuProps {
  items: ActionItem[];
  label?: string;
}

export function ActionMenu({ items, label = 'Actions' }: ActionMenuProps) {
  return (
    <Menu as="div" className="relative inline-block text-left">
      <Menu.Button className="inline-flex items-center gap-1 rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-1">
        {label}
        <ChevronDown className="h-3 w-3" aria-hidden="true" />
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-30 mt-1 w-40 origin-top-right overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg ring-1 ring-black/5 focus:outline-none">
          {items.map((item) => (
            <Menu.Item key={item.label} disabled={item.disabled}>
              {({ active }) => (
                <button
                  onClick={item.onClick}
                  disabled={item.disabled}
                  className={`flex w-full items-center px-4 py-2.5 text-sm transition-colors ${
                    item.danger
                      ? active
                        ? 'bg-red-50 text-red-600'
                        : 'text-red-500'
                      : active
                      ? 'bg-gray-50 text-gray-900'
                      : 'text-gray-700'
                  } ${item.disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-default'}`}
                >
                  {item.label}
                </button>
              )}
            </Menu.Item>
          ))}
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
