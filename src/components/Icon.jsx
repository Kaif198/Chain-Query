import React from 'react';

export default function Icon({ name, size, className = '', fill = false, weight }) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={{
        fontSize: size || 20,
        fontVariationSettings: `'FILL' ${fill ? 1 : 0}, 'wght' ${weight || 300}, 'GRAD' 0, 'opsz' 20`
      }}
    >{name}</span>
  );
}
