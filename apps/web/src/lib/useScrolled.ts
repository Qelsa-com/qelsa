"use client";

import { useEffect, useState } from "react";

/**
 * Returns true once the page has scrolled past `threshold`.
 *
 * Headers stay transparent at the top of the page, then switch to a blurred
 * sticky surface so content does not fight the navigation for contrast.
 */
export function useScrolled(threshold = 8) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const update = () => {
      const next = window.scrollY > threshold;
      setScrolled((previous) => (previous === next ? previous : next));
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [threshold]);

  return scrolled;
}
