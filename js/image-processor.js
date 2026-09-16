/**
 * Clientseitige Bildverarbeitung & Konvertierung
 * Schneidet Bilder zentriert quadratisch zu und skaliert auf 600×600 px WebP
 */

const TARGET_SIZE = 600;
const WEBP_QUALITY = 0.88;

/**
 * Konvertiert ein beliebiges Bild (Blob oder File) in ein 600×600 WebP Blob
 * @param {Blob|File} imageSource
 * @returns {Promise<Blob>}
 */
export async function processImageToSquareWebP(imageSource) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(imageSource);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      // Canvas erstellen
      const canvas = document.createElement('canvas');
      canvas.width = TARGET_SIZE;
      canvas.height = TARGET_SIZE;
      const ctx = canvas.getContext('2d');

      // Zentrum-Zuschnitt berechnen (Center Crop)
      const srcWidth = img.naturalWidth || img.width;
      const srcHeight = img.naturalHeight || img.height;
      const minDimension = Math.min(srcWidth, srcHeight);

      const srcX = (srcWidth - minDimension) / 2;
      const srcY = (srcHeight - minDimension) / 2;

      // Antialiasing / Hohe Bildqualität
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Zeichnen
      ctx.drawImage(
        img,
        srcX, srcY, minDimension, minDimension, // Source Quad
        0, 0, TARGET_SIZE, TARGET_SIZE          // Destination Quad
      );

      // Als WebP exportieren (Fallback auf JPEG falls WebP nicht unterstützt wird)
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            // Fallback auf JPEG
            canvas.toBlob((jpgBlob) => resolve(jpgBlob), 'image/jpeg', 0.9);
          }
        },
        'image/webp',
        WEBP_QUALITY
      );
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Bild konnte nicht geladen werden'));
    };

    img.src = objectUrl;
  });
}
