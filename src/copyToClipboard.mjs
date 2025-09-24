export async function copyToClipboard(gThis, text) {
  const nav = gThis.navigator;
  const doc = gThis.document;

  if (nav.clipboard && gThis.isSecureContext) {
    // navigator.clipboard is available and context is secure
    try {
      await nav.clipboard.writeText(text);
      // Optionally, notify user of success here
    } catch (err) {
      // Optionally, handle error here (e.g., notify user)
    }
  } else {
    // Fallback for older browsers (creates a temporary textarea)
    const textarea = doc.createElement("textarea");
    textarea.value = text;
    // Prevent scrolling to bottom
    textarea.style.position = "fixed";

    doc.body.appendChild(textarea);

    textarea.focus();
    textarea.select();

    try {
      doc.execCommand("copy");
    } catch (err) {
      // Optionally, handle error
    }

    doc.body.removeChild(textarea);
  }
}
