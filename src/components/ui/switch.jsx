import React from 'react';

/** Fixed-size toggle aligned in settings rows (see `.pof-switch` in pof-components.css). */
export function Switch({ checked = false, onCheckedChange, className = '' }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange?.(!checked)}
      className={`pof-switch shrink-0 ${className}`.trim()}
    >
      <span />
    </button>
  );
}
