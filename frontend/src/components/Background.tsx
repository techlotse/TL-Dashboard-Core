import { useEffect, useState } from 'react';
import { FetchState, BackgroundData } from '../types';

interface Props {
  state: FetchState<BackgroundData>;
  intervalMs?: number;
}

const FADE_MS = 800;

export default function Background({ state, intervalMs = 15000 }: Props) {
  const urls = state.status === 'success' ? state.data.images : [];

  const [idx, setIdx]         = useState(0);
  const [opacity, setOpacity] = useState(1);

  // Reset whenever the image list changes
  useEffect(() => {
    setIdx(0);
    setOpacity(1);
  }, [urls.length]);

  // Advance slideshow with a fade-out / fade-in cycle
  useEffect(() => {
    if (urls.length <= 1) return;
    const t = setInterval(() => {
      setOpacity(0);
      setTimeout(() => {
        setIdx((i) => (i + 1) % urls.length);
        setOpacity(1);
      }, FADE_MS);
    }, intervalMs);
    return () => clearInterval(t);
  }, [urls.length, intervalMs]);

  const src = urls.length > 0 ? urls[idx % urls.length] : null;

  return (
    // Gradient is always the base layer — shows through if image fails to load
    <div
      className="absolute inset-0"
      style={{
        background: 'linear-gradient(135deg, #0a0e1a 0%, #111827 50%, #0d1220 100%)',
      }}
    >
      {/* Photo layer — CSS background-image never shows broken icons;
          a 404 just leaves this div transparent, revealing the gradient */}
      {src && (
        <div
          style={{
            position:           'absolute',
            inset:              0,
            backgroundImage:    `url(${JSON.stringify(src)})`,
            backgroundSize:     'cover',
            backgroundPosition: 'center',
            transform:          'scale(1.02)',
            opacity,
            transition:         `opacity ${FADE_MS}ms ease-in-out`,
          }}
        />
      )}

      {/* Dark overlay so text stays readable */}
      <div className="absolute inset-0 bg-black/35" />

      {/* Bottom vignette */}
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/60 to-transparent" />
    </div>
  );
}
