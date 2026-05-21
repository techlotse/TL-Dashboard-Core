/**
 * Maps backend icon names (derived from WMO codes) to Lucide icons +
 * an appropriate colour class.
 */
import type { LucideIcon } from 'lucide-react';
import {
  Sun, Cloud, CloudSun, CloudFog, CloudDrizzle, CloudRain,
  CloudSnow, CloudLightning, Droplets,
} from 'lucide-react';

const SIZE_MAP = { sm: 16, md: 24, lg: 40, xl: 56 } as const;

interface Props {
  icon: string;
  size?: keyof typeof SIZE_MAP;
  className?: string;
}

const ICON_MAP: Record<string, { Component: LucideIcon; color: string }> = {
  'sun':                 { Component: Sun,            color: 'text-yellow-300' },
  'cloud-sun':           { Component: CloudSun,       color: 'text-yellow-200' },
  'cloud':               { Component: Cloud,          color: 'text-slate-300'  },
  'cloud-fog':           { Component: CloudFog,       color: 'text-slate-400'  },
  'cloud-drizzle':       { Component: CloudDrizzle,   color: 'text-blue-300'   },
  'cloud-rain':          { Component: CloudRain,      color: 'text-blue-400'   },
  'cloud-rain-heavy':    { Component: CloudRain,      color: 'text-blue-500'   },
  'cloud-showers':       { Component: CloudRain,      color: 'text-blue-400'   },
  'cloud-showers-heavy': { Component: CloudRain,      color: 'text-blue-600'   },
  'cloud-snow':          { Component: CloudSnow,      color: 'text-sky-200'    },
  'cloud-lightning':     { Component: CloudLightning, color: 'text-yellow-400' },
};

export default function WeatherIcon({ icon, size = 'md', className = '' }: Props) {
  const px = SIZE_MAP[size];
  const entry = ICON_MAP[icon] ?? { Component: Droplets, color: 'text-slate-400' };
  const { Component, color } = entry;
  return <Component size={px} className={`${color} ${className}`} strokeWidth={1.5} />;
}
