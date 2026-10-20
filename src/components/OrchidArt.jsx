// Hình minh họa hoa lan bằng SVG (không cần ảnh ngoài -> CSP chỉ cho phép img-src 'self').
const HEX = /^#[0-9a-fA-F]{6}$/;
const safeColor = (c, fallback) => (HEX.test(c ?? '') ? c : fallback);

export default function OrchidArt({ color, accent, size = 160, stem = false, className = '' }) {
  const petal = safeColor(color, '#c2569b');
  const center = safeColor(accent, '#f2c94c');
  const height = stem ? size * 1.5 : size;

  return (
    <svg
      className={className}
      width={size}
      height={height}
      viewBox={stem ? '0 0 100 150' : '0 0 100 100'}
      role="img"
      aria-hidden="true"
    >
      {stem && (
        <g>
          <path d="M50 70 C 52 100, 46 120, 50 148" stroke="#5f8f4e" strokeWidth="3" fill="none" />
          <path d="M50 128 C 30 120, 18 132, 10 146 C 30 146, 44 140, 50 132 Z" fill="#6fa05c" />
          <path d="M50 132 C 70 122, 84 132, 92 146 C 72 146, 56 140, 50 136 Z" fill="#7cb067" />
        </g>
      )}
      <g transform="translate(50 50)">
        {/* hai cánh đài sau */}
        <ellipse rx="13" ry="30" fill={petal} opacity="0.75" transform="rotate(-35) translate(0 -18)" />
        <ellipse rx="13" ry="30" fill={petal} opacity="0.75" transform="rotate(35) translate(0 -18)" />
        <ellipse rx="12" ry="28" fill={petal} opacity="0.75" transform="rotate(180) translate(0 -16)" />
        {/* hai cánh hoa lớn */}
        <ellipse rx="22" ry="26" fill={petal} transform="rotate(-80) translate(0 -20)" />
        <ellipse rx="22" ry="26" fill={petal} transform="rotate(80) translate(0 -20)" />
        {/* môi hoa */}
        <path d="M-10 4 C -14 22, 14 22, 10 4 C 6 12, -6 12, -10 4 Z" fill={center} />
        <circle r="6" fill={center} />
        <circle r="2.5" fill="#ffffff" opacity="0.8" />
      </g>
    </svg>
  );
}
