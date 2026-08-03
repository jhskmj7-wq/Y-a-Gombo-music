import React from 'react';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
  noPadding?: boolean;
}

export const PageContainer: React.FC<PageContainerProps> = ({ children, className = '', id, noPadding = false }) => {
  return (
    <div id={id} className={`flex flex-col w-full ${noPadding ? 'p-0' : 'p-3'} ${className}`}>
      {children}
    </div>
  );
};

export default PageContainer;
