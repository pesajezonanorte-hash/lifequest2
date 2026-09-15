import { useEffect, useState } from 'react';

export function useKeyboardHeight() {
  const [kbHeight, setKbHeight] = useState(0);

  useEffect(() => {
    if (!window.visualViewport) return;

    const h = () => {
      const diff = window.innerHeight - window.visualViewport!.height;
      setKbHeight(diff > 100 ? diff : 0);
    };

    window.visualViewport.addEventListener('resize', h);
    return () => window.visualViewport!.removeEventListener('resize', h);
  }, []);

  return kbHeight;
}
