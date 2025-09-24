// Resize canvas based on resolution setting
export function resizeCanvas(doc, configSignals) {
  const cnvs = doc?.getElementById("canvas");
  if (cnvs) {
    const currentResolution = configSignals.currentResolution.get();

    if (currentResolution === "fullscreen") {
      // Fullscreen mode
      doc?.body.classList.remove(
        "desktop-resolution",
        "resolution-400",
        "resolution-800",
      );

      cnvs.width = window.innerWidth;
      cnvs.height = window.innerHeight;
      cnvs.style.width = "100vw";
      cnvs.style.height = "100vh";

      configSignals.canvasScale.set(1);

      return;
    }

    // Fixed resolution mode
    doc.body.classList.add("desktop-resolution");
    doc.body.classList.remove("resolution-400", "resolution-800");

    const size = parseInt(currentResolution);
    cnvs.width = size;
    cnvs.height = size;
    cnvs.style.width = size + "px";
    cnvs.style.height = size + "px";

    doc.body.classList.add(`resolution-${size}`);

    // Updated scale calculation
    configSignals.canvasScale.set(size / 400);
  }
}
