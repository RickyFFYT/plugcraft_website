import React, { useRef, useState, useEffect } from 'react';

interface Card3DRotateProps {
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

export default function Card3DRotate({ className = '', style = {}, children }: Card3DRotateProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const rotateX = ((y - centerY) / centerY) * -8; // Max 8deg tilt
      const rotateY = ((x - centerX) / centerX) * 8;
      
      setRotation({ x: rotateX, y: rotateY });
    };

    const handleMouseLeave = () => {
      setRotation({ x: 0, y: 0 });
    };

    card.addEventListener('mousemove', handleMouseMove);
    card.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      card.removeEventListener('mousemove', handleMouseMove);
      card.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <div
      ref={cardRef}
      className={`card-3d-rotate ${className}`.trim()}
      style={{
        ...style,
        transform: `perspective(1000px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
        transition: 'transform 0.1s ease-out, box-shadow 0.3s',
      }}
    >
      {children}
    </div>
  );
}
