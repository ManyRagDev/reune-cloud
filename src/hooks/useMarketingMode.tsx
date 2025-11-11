import { useState, useEffect } from "react";

export const useMarketingMode = () => {
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    // Listen for keyboard shortcut: Ctrl/Cmd + Shift + M
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'M') {
        e.preventDefault();
        setIsEnabled(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  return {
    isEnabled,
    toggle: () => setIsEnabled(prev => !prev)
  };
};
