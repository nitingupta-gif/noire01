"use client";

import { useEffect } from "react";

const scrollDuration = 900;

export function SmoothScroll() {
  useEffect(() => {
    const handleAnchorClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest("a");
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname !== window.location.pathname || !url.hash) return;

      const destination = document.querySelector(url.hash);
      if (!destination) return;

      event.preventDefault();
      const start = window.scrollY;
      const end = start + destination.getBoundingClientRect().top;
      const startedAt = performance.now();

      const animate = (now: number) => {
        const progress = Math.min((now - startedAt) / scrollDuration, 1);
        const easedProgress = progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;

        window.scrollTo(0, start + (end - start) * easedProgress);
        if (progress < 1) requestAnimationFrame(animate);
      };

      history.pushState(null, "", url.hash);
      requestAnimationFrame(animate);
    };

    document.addEventListener("click", handleAnchorClick);
    return () => document.removeEventListener("click", handleAnchorClick);
  }, []);

  return null;
}
