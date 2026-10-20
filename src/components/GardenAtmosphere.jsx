import { useEffect, useState } from 'react';
import '../styles/atmosphere.css';

// A small, fixed particle count keeps the effect inexpensive on mobile.
export default function GardenAtmosphere() {
  const [paused, setPaused] = useState(false);
  const [hidden, setHidden] = useState(document.hidden);
  useEffect(() => {
    const onVisibility = () => setHidden(document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  return (
    <>
      <div className={`garden-atmosphere ${paused || hidden ? 'garden-atmosphere--paused' : ''}`} aria-hidden="true">
        {Array.from({ length: 16 }, (_, index) => (
          <span key={index} className={`garden-particle garden-particle--${index + 1}`}>
            <i className={index % 3 === 0 ? 'drifting-leaf' : 'drifting-petal'} />
          </span>
        ))}
        <span className="floating-glow floating-glow--green" />
        <span className="floating-glow floating-glow--pink" />
      </div>
      <button className="atmosphere-toggle" type="button" aria-pressed={paused} onClick={() => setPaused(!paused)}>
        <span aria-hidden="true">{paused ? '▷' : 'Ⅱ'}</span> {paused ? 'Bật hiệu ứng lá rơi' : 'Dừng hiệu ứng lá rơi'}
      </button>
    </>
  );
}
