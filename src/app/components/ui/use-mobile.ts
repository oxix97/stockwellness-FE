import * as React from "react";

const MOBILE_BREAKPOINT = 768;
const DESKTOP_BREAKPOINT = 1024;

export type ViewportType = "mobile" | "tablet" | "desktop";

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(
    undefined,
  );

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}

export function useViewportType(): ViewportType {
  const [viewport, setViewport] = React.useState<ViewportType>("mobile");

  React.useEffect(() => {
    const mobileQuery = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const desktopQuery = window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT}px)`);

    const updateViewport = () => {
      if (desktopQuery.matches) {
        setViewport("desktop");
        return;
      }

      if (mobileQuery.matches) {
        setViewport("mobile");
        return;
      }

      setViewport("tablet");
    };

    mobileQuery.addEventListener("change", updateViewport);
    desktopQuery.addEventListener("change", updateViewport);
    updateViewport();

    return () => {
      mobileQuery.removeEventListener("change", updateViewport);
      desktopQuery.removeEventListener("change", updateViewport);
    };
  }, []);

  return viewport;
}
