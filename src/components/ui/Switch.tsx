'use client';

import { Switch as HSwitch } from '@headlessui/react';

interface SwitchProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  size?: 'sm' | 'md';
}

export function Switch({ checked, onChange, label, size = 'md' }: SwitchProps) {
  const track = size === 'sm'
    ? 'h-5 w-9'
    : 'h-6 w-11';
  const thumb = size === 'sm'
    ? 'h-4 w-4'
    : 'h-5 w-5';
  const translate = size === 'sm'
    ? 'translate-x-4'
    : 'translate-x-5';

  const btn = (
    <HSwitch
      checked={checked}
      onChange={onChange}
      className={`relative inline-flex ${track} shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1 ${
        checked ? 'bg-primary-600' : 'bg-gray-200'
      }`}
    >
      <span
        aria-hidden="true"
        className={`${thumb} inline-block rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ease-in-out ${
          checked ? translate : 'translate-x-0'
        }`}
      />
    </HSwitch>
  );

  if (!label) return btn;

  return (
    <HSwitch.Group as="div" className="flex items-center gap-3">
      {btn}
      <HSwitch.Label className="text-sm text-gray-700 cursor-pointer select-none">{label}</HSwitch.Label>
    </HSwitch.Group>
  );
}
