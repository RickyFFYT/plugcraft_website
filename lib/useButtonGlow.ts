import { useEffect, useRef } from 'react';

/**
 * Hook to add cursor-following glow effect to buttons
 * Sets CSS custom properties --btn-glow-x and --btn-glow-y
 */
export function useButtonGlow() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      
      element.style.setProperty('--btn-glow-x', `${x}%`);
      element.style.setProperty('--btn-glow-y', `${y}%`);
    };

    const handleMouseLeave = () => {
      element.style.setProperty('--btn-glow-x', '50%');
      element.style.setProperty('--btn-glow-y', '50%');
    };

    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return ref;
}
