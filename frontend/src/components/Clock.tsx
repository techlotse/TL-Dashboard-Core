import { useState, useEffect } from 'react';
import { format, toZonedTime } from 'date-fns-tz';
import { AppConfig } from '../types';

interface Props {
  config: AppConfig;
}

export default function Clock({ config }: Props) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const tz = config.timezone || 'Europe/Zurich';
  const zoned = toZonedTime(now, tz);

  const timeStr = format(zoned, 'HH:mm', { timeZone: tz });
  const secsStr = format(zoned, 'ss', { timeZone: tz });
  const dateStr = format(zoned, 'EEEE, d MMMM yyyy', { timeZone: tz });

  return (
    <div className="flex flex-col items-end select-none">
      {/* Time */}
      <div className="flex items-baseline gap-1">
        <span className="text-7xl font-light tabular-nums tracking-tight leading-none text-white">
          {timeStr}
        </span>
        <span className="text-3xl font-light tabular-nums text-white/40 w-[2.4rem]">
          {secsStr}
        </span>
      </div>
      {/* Date */}
      <div className="text-lg font-normal text-white/60 mt-1 tracking-wide">
        {dateStr}
      </div>
    </div>
  );
}
