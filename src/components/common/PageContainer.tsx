import React from 'react';
import { motion } from 'motion/react';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
  noPadding?: boolean;
}

export const PageContainer: React.FC<PageContainerProps> = ({ children, className = '', id, noPadding = false }) => {
  return (
    <div 
      id={id}
      className={`flex flex-col w-full h-full bg-afri-bg text-afri-text font-sans antialiased box-border select-none ${className}`}
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        paddingLeft: 'env(safe-area-inset-left, 0px)',
        paddingRight: 'env(safe-area-inset-right, 0px)',
      }}
    >
      <motion.div 
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className={`flex flex-col flex-1 w-full max-w-full box-border ${
          noPadding ? 'p-0' : 'p-3 sm:p-5 lg:p-6 pb-20 sm:pb-24'
        }`}
      >
        {children}
      </motion.div>
    </div>
  );
};

export default PageContainer;

