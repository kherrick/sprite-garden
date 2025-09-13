// Resize canvas based on resolution setting
export function resizeCanvas(config, doc) {
  const canvas = doc?.getElementById("canvas");

  if (canvas) {
    const currentResolution = config.currentResolution.get();

    if (currentResolution === "fullscreen") {
      // Fullscreen mode
      doc?.body.classList.remove(
        "desktop-resolution",
        "resolution-400",
        "resolution-800",
      );

      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      canvas.style.width = "100vw";
      canvas.style.height = "100vh";

      config.canvasScale.set(1);

      return;
    }

    // Fixed resolution mode
    doc.body.classList.add("desktop-resolution");
    doc.body.classList.remove("resolution-400", "resolution-800");

    const size = parseInt(currentResolution);
    canvas.width = size;
    canvas.height = size;
    canvas.style.width = size + "px";
    canvas.style.height = size + "px";

    doc.body.classList.add(`resolution-${size}`);

    // Updated scale calculation
    config.canvasScale.set(size / 400);
  }
}
