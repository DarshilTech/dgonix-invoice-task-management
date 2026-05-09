'use client';

import { Fragment } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { Check, ChevronDown } from 'lucide-react';

export type SelectOption = { value: string; label: string; disabled?: boolean };

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function Select({
  value,
  onChange,
  options,
  placeholder = 'Select…',
  className = '',
  disabled = false,
}: SelectProps) {
  const selected = options.find((o) => o.value === value);

  return (
    <Listbox value={value} onChange={onChange} disabled={disabled}>
      <div className={`relative ${className}`}>
        <Listbox.Button
          className={`relative w-full cursor-default rounded-md border border-gray-200 bg-white py-1.5 pl-3 pr-8 text-left text-sm transition-colors focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-300 ${
            disabled ? 'cursor-not-allowed opacity-60' : 'hover:border-gray-300'
          }`}
        >
          <span className={selected ? 'text-gray-900' : 'text-gray-400'}>
            {selected?.label ?? placeholder}
          </span>
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
            <ChevronDown className="h-4 w-4 text-gray-400" aria-hidden="true" />
          </span>
        </Listbox.Button>

        <Transition
          as={Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100 translate-y-0"
          leaveTo="opacity-0 -translate-y-1"
          enter="transition ease-out duration-100"
          enterFrom="opacity-0 -translate-y-1"
          enterTo="opacity-100 translate-y-0"
        >
          <Listbox.Options className="absolute z-30 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-gray-100 bg-white py-1 text-sm shadow-lg ring-1 ring-black/5 focus:outline-none">
            {options.map((opt) => (
              <Listbox.Option
                key={opt.value}
                value={opt.value}
                disabled={opt.disabled}
                as={Fragment}
              >
                {({ active, selected: sel }) => (
                  <li
                    className={`relative cursor-default select-none py-2 pl-8 pr-3 ${
                      active ? 'bg-primary-50 text-primary-700' : 'text-gray-700'
                    } ${opt.disabled ? 'opacity-40' : ''}`}
                  >
                    {sel && (
                      <span className="absolute inset-y-0 left-0 flex items-center pl-2 text-primary-600">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                    )}
                    {opt.label}
                  </li>
                )}
              </Listbox.Option>
            ))}
          </Listbox.Options>
        </Transition>
      </div>
    </Listbox>
  );
}
