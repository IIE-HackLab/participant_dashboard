/**
 * Converts a Cloudinary raw upload URL to a browser-viewable inline URL.
 *
 * Cloudinary serves `/raw/upload/` files with `Content-Disposition: attachment`
 * which forces a download and breaks browser PDF/doc rendering.
 *
 * By replacing `/raw/upload/` with `/image/upload/` Cloudinary switches to
 * serving the file inline (works for PDF, PPT, PPTX, DOC, DOCX).
 *
 * Additionally, inserting the `fl_attachment:false` flag explicitly forces
 * inline delivery even when the preset is configured to attach.
 */
export function toInlineUrl(url: string): string {
  if (!url) return url;
  // Already an image upload URL – serve as-is
  if (!url.includes("res.cloudinary.com")) return url;

  return (
    url
      // Replace resource type: raw → image  (Cloudinary handles PDF/PPT inline this way)
      .replace("/raw/upload/", "/image/upload/fl_attachment:false/")
      // In case it was already /image/upload/ without the flag
      .replace("/image/upload/fl_attachment:false/fl_attachment:false/", "/image/upload/fl_attachment:false/")
  );
}

/**
 * Returns true if the URL points to a document that needs special handling
 * (PDF, PPT, PPTX, DOC, DOCX, or a Cloudinary raw upload).
 */
export function isDocumentUrl(url: string): boolean {
  if (!url) return false;
  return (
    url.includes("/raw/upload/") ||
    /\.(pdf|ppt|pptx|doc|docx)(\?|$)/i.test(url)
  );
}
