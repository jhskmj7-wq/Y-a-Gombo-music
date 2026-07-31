import React from 'react';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export const PageContainer: React.FC<PageContainerProps> = ({ children, className = '', id }) => {
  return (
    <div 
      id={id}
      className={`w-full max-w-full min-h-[100dvh] h-[100dvh] flex flex-col overflow-hidden bg-black text-white font-sans antialiased box-border ${className}`}

      style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div 
        className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain w-full max-w-full box-border p-3 sm:p-5 lg:p-6"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {children}
      </div>
    </div>
  );
};

export default PageContainer;
