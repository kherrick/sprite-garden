// Device detection
export const isMobile =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  ) ||
  "ontouchstart" in window ||
  window.screen.width <= 768;
