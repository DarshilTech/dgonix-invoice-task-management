'use client';

import { COUNTRIES, getStates } from '@/lib/data/regions';

type Props = {
  country: string;
  state: string;
  onCountryChange: (value: string) => void;
  onStateChange: (value: string) => void;
  required?: boolean;
};

export function RegionSelect({ country, state, onCountryChange, onStateChange, required }: Props) {
  const states = getStates(country);

  return (
    <>
      <div>
        <label className="label">Country{required ? ' *' : ''}</label>
        <select
          className="input"
          value={country}
          onChange={(e) => {
            onCountryChange(e.target.value);
            onStateChange('');
          }}
          required={required}
        >
          <option value="">Select country</option>
          {COUNTRIES.map((c) => (
            <option key={c.label} value={c.label}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label">State / Province{required ? ' *' : ''}</label>
        {states.length > 0 ? (
          <select
            className="input"
            value={state}
            onChange={(e) => onStateChange(e.target.value)}
            required={required}
          >
            <option value="">Select state</option>
            {states.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            className="input"
            value={state}
            onChange={(e) => onStateChange(e.target.value)}
            placeholder="State / Province"
          />
        )}
      </div>
    </>
  );
}
