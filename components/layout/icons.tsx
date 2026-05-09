import type { SVGProps } from 'react';

type Props = SVGProps<SVGSVGElement>;

function StrokeIcon({ children, ...props }: Props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {children}
    </svg>
  );
}

export const SearchIcon = (p: Props) => (
  <StrokeIcon {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </StrokeIcon>
);

export const BookmarkIcon = (p: Props) => (
  <StrokeIcon {...p}>
    <path d="M6 4h12v17l-6-4-6 4z" />
  </StrokeIcon>
);

export const UserIcon = (p: Props) => (
  <StrokeIcon {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c1.8-4.5 5-6 8-6s6.2 1.5 8 6" />
  </StrokeIcon>
);

export const MapPinIcon = (p: Props) => (
  <StrokeIcon {...p}>
    <path d="M12 21s-7-7-7-12a7 7 0 0 1 14 0c0 5-7 12-7 12Z" />
    <circle cx="12" cy="9" r="2.5" />
  </StrokeIcon>
);

export const FlowerIcon = (p: Props) => (
  <StrokeIcon {...p}>
    <circle cx="12" cy="12" r="2" />
    <circle cx="12" cy="6.5" r="2.4" />
    <circle cx="17" cy="9.8" r="2.4" />
    <circle cx="15" cy="15.8" r="2.4" />
    <circle cx="9" cy="15.8" r="2.4" />
    <circle cx="7" cy="9.8" r="2.4" />
  </StrokeIcon>
);

export const MenuIcon = (p: Props) => (
  <StrokeIcon {...p}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </StrokeIcon>
);

export const ArrowRightIcon = (p: Props) => (
  <StrokeIcon {...p}>
    <path d="M5 12h14m-5-6 6 6-6 6" />
  </StrokeIcon>
);

export const LogoutIcon = (p: Props) => (
  <StrokeIcon {...p}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="m16 17 5-5-5-5" />
    <path d="M21 12H9" />
  </StrokeIcon>
);

export const ShieldIcon = (p: Props) => (
  <StrokeIcon {...p}>
    <path d="M12 3 4 6v6c0 4.5 3.4 8.5 8 9 4.6-.5 8-4.5 8-9V6l-8-3Z" />
  </StrokeIcon>
);
