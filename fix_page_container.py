import re

def fix_file(filename):
    with open(filename, 'r') as f:
        content = f.read()

    # We make PageContainer simply return a flex container
    # Or just return children directly if we don't need any wrapper.
    # But it says "Il devient uniquement un conteneur flex."
    
    new_content = """import React from 'react';

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
"""
    with open(filename, 'w') as f:
        f.write(new_content)

fix_file('src/components/common/PageContainer.tsx')
