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

export const CalendarIcon = (p: Props) => (
  <StrokeIcon {...p}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 10h18M8 3v4M16 3v4" />
  </StrokeIcon>
);

export const CameraIcon = (p: Props) => (
  <StrokeIcon {...p}>
    <path d="M3 8.5A1.5 1.5 0 0 1 4.5 7H7l1.6-2.2A1 1 0 0 1 9.4 4.4h5.2a1 1 0 0 1 .8.4L17 7h2.5A1.5 1.5 0 0 1 21 8.5v9A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5v-9Z" />
    <circle cx="12" cy="13" r="3.5" />
  </StrokeIcon>
);

export const StarIcon = (p: Props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="m12 3 2.7 5.5 6 .9-4.4 4.2 1 6-5.3-2.8-5.3 2.8 1-6L3.3 9.4l6-.9L12 3Z" />
  </svg>
);

export const ExternalLinkIcon = (p: Props) => (
  <StrokeIcon {...p}>
    <path d="M14 4h6v6" />
    <path d="m20 4-9 9" />
    <path d="M19 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4" />
  </StrokeIcon>
);

export const InfoIcon = (p: Props) => (
  <StrokeIcon {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8h.01M11 12h1v5h1" />
  </StrokeIcon>
);

export const NavigationIcon = (p: Props) => (
  <StrokeIcon {...p}>
    <path d="m3 11 18-8-8 18-2-8-8-2Z" />
  </StrokeIcon>
);
