import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// Client-side route changes don't reset scroll position on their own —
// this watches the URL and jumps to the top every time it changes.
const ScrollToTop = () => {
  const { pathname, search } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname, search]);

  return null;
};

export default ScrollToTop;
