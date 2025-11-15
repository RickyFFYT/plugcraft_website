import React, { useState, useRef, useEffect } from 'react';

interface RippleButtonProps {
  children: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  href?: string;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
}

interface Ripple {
  x: number;
  y: number;
  size: number;
  id: number;
}

export default function RippleButton({
  children,
  className = '',
  onClick,
  href,
  type = 'button',
  disabled = false,
}: RippleButtonProps) {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const buttonRef = useRef<HTMLElement | null>(null);

  const addRipple = (e: React.MouseEvent<HTMLElement>) => {
    const button = buttonRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    const newRipple: Ripple = {
      x,
      y,
      size,
      id: Date.now(),
    };

    setRipples((prev) => [...prev, newRipple]);

    // Remove ripple after animation
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
    }, 600);

    if (onClick) {
      onClick(e as React.MouseEvent<HTMLButtonElement>);
    }
  };

  if (href) {
    return (
      <a
        ref={buttonRef as React.RefObject<HTMLAnchorElement>}
        href={href}
        className={`ripple-button ${className}`.trim()}
        onClick={addRipple}
        style={{ position: 'relative', overflow: 'hidden' }}
      >
        {children}
        {ripples.map((ripple) => (
          <span
            key={ripple.id}
            className="ripple-effect"
            style={{
              position: 'absolute',
              left: ripple.x,
              top: ripple.y,
              width: ripple.size,
              height: ripple.size,
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.5)',
              transform: 'scale(0)',
              animation: 'ripple 0.6s ease-out',
              pointerEvents: 'none',
            }}
          />
        ))}
      </a>
    );
  }

  return (
    <button
      ref={buttonRef as React.RefObject<HTMLButtonElement>}
      type={type}
      disabled={disabled}
      className={`ripple-button ${className}`.trim()}
      onClick={addRipple}
      style={{ position: 'relative', overflow: 'hidden' }}
    >
      {children}
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="ripple-effect"
          style={{
            position: 'absolute',
            left: ripple.x,
            top: ripple.y,
            width: ripple.size,
            height: ripple.size,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.5)',
            transform: 'scale(0)',
            animation: 'ripple 0.6s ease-out',
            pointerEvents: 'none',
          }}
        />
      ))}
    </button>
  );
}
