import React from 'react';

interface ScrollContainerProps {
  children: React.ReactNode;
  className?: string;
  horizontal?: boolean;
  id?: string;
}

export const ScrollContainer: React.FC<ScrollContainerProps> = ({ children, className = '', horizontal = false, id }) => {
  return (
    <div 
      id={id}
      className={`${

        horizontal ? 'overflow-x-auto overflow-y-hidden touch-pan-x' : 'overflow-y-auto overflow-x-hidden touch-pan-y'
      } overscroll-contain w-full max-w-full box-border ${className}`}
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {children}
    </div>
  );
};

export default ScrollContainer;
