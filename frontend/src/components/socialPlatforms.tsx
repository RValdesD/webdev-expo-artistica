import type { ReactNode } from 'react';
import { socialKeys, type SocialKey } from '../types/artist';

interface SocialPlatform {
  label: string;
  inputLabel: string;
  placeholder: string;
  icon: ReactNode;
}

const iconProps = {
  width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
  strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true,
} as const;

// Typed as a full Record so adding a key to socialKeys fails to compile until it is described here.
const platforms: Record<SocialKey, SocialPlatform> = {
  instagram: {
    label: 'Instagram', inputLabel: 'Instagram URL', placeholder: 'https://instagram.com/...',
    icon: (
      <svg {...iconProps}>
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
      </svg>
    ),
  },
  website: {
    label: 'Sitio web', inputLabel: 'Sitio web personal', placeholder: 'https://...',
    icon: (
      <svg {...iconProps}>
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
  },
  twitter: {
    label: 'X / Twitter', inputLabel: 'X / Twitter URL', placeholder: 'https://x.com/...',
    icon: (
      <svg {...iconProps}>
        <path d="M4 4l11.733 16h4.267l-11.733 -16z" />
        <path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772" />
      </svg>
    ),
  },
  behance: {
    label: 'Behance', inputLabel: 'Behance URL', placeholder: 'https://behance.net/...',
    icon: (
      <svg {...iconProps}>
        <path d="M3 8h5a3 3 0 0 1 0 6H3V8z" />
        <path d="M3 14h5.5a3.5 3.5 0 0 1 0 7H3V14z" />
        <path d="M15 13a4 4 0 1 0 7.5 -1.5" />
        <line x1="15" y1="9" x2="22" y2="9" />
      </svg>
    ),
  },
};

// Every place that lists an artist's social links iterates this, in display order.
export const socialPlatforms = socialKeys.map(key => ({ key, ...platforms[key] }));
