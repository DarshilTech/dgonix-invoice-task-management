'use client';

import { Fragment, useState } from 'react';
import { Combobox as HCombobox, Transition } from '@headlessui/react';
import { Check, ChevronDown, Search } from 'lucide-react';

export type ComboOption = { value: string; label: string };

interface ComboboxProps {
  value: string;
  onChange: (value: string) => void;
  options: ComboOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function Combobox({
  value,
  onChange,
  options,
  placeholder = 'Search…',
  className = '',
  disabled = false,
}: ComboboxProps) {
  const [query, setQuery] = useState('');

  const filtered =
    query === ''
      ? options
      : options.filter((o) =>
          o.label.toLowerCase().includes(query.toLowerCase())
        );

  const selected = options.find((o) => o.value === value);

  return (
    <HCombobox value={value} onChange={onChange} disabled={disabled}>
      <div className={`relative ${className}`}>
        <div className="relative w-full cursor-default overflow-hidden rounded-md border border-gray-200 bg-white text-sm focus-within:border-primary-400 focus-within:ring-1 focus-within:ring-primary-300 hover:border-gray-300 transition-colors">
          <HCombobox.Input
            className="w-full border-none bg-transparent py-1.5 pl-3 pr-8 text-sm text-gray-900 placeholder-gray-400 focus:outline-none"
            displayValue={() => selected?.label ?? ''}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
          />
          <HCombobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
            <ChevronDown className="h-4 w-4 text-gray-400" aria-hidden="true" />
          </HCombobox.Button>
        </div>

        <Transition
          as={Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
          afterLeave={() => setQuery('')}
        >
          <HCombobox.Options className="absolute z-30 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-gray-100 bg-white py-1 text-sm shadow-lg ring-1 ring-black/5 focus:outline-none">
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-gray-400">No results for "{query}"</div>
            ) : (
              filtered.map((opt) => (
                <HCombobox.Option key={opt.value} value={opt.value} as={Fragment}>
                  {({ active, selected: sel }) => (
                    <li
                      className={`relative cursor-default select-none py-2 pl-8 pr-3 ${
                        active ? 'bg-primary-50 text-primary-700' : 'text-gray-700'
                      }`}
                    >
                      {sel && (
                        <span className="absolute inset-y-0 left-0 flex items-center pl-2 text-primary-600">
                          <Check className="h-3.5 w-3.5" />
                        </span>
                      )}
                      {opt.label}
                    </li>
                  )}
                </HCombobox.Option>
              ))
            )}
          </HCombobox.Options>
        </Transition>
      </div>
    </HCombobox>
  );
}
