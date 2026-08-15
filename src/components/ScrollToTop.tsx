import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop() {
  let pathname = '';
  try {
    const location = useLocation();
    pathname = location?.pathname || '';
  } catch (e) {
    pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  }

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        window.scrollTo(0, 0);
        const mainContent = document.getElementById('main-content');
        if (mainContent) mainContent.scrollTop = 0;
        
        const scrollableElements = document.querySelectorAll('.overflow-y-auto');
        scrollableElements.forEach(el => {
          (el as HTMLElement).scrollTop = 0;
        });
      }
    } catch (err) {
      // ignore
    }
  }, [pathname]);

  return null;
}
