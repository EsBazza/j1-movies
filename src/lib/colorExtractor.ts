export interface ExtractedPalette {
  primary: string;
  primaryGlow: string;
  secondary: string;
  secondaryGlow: string;
  accent: string;
  ambientGradient: string;
}

export const DEFAULT_PALETTE: ExtractedPalette = {
  primary: 'rgb(229, 9, 20)',
  primaryGlow: 'rgba(229, 9, 20, 0.45)',
  secondary: 'rgb(59, 130, 246)',
  secondaryGlow: 'rgba(59, 130, 246, 0.35)',
  accent: 'rgb(234, 179, 8)',
  ambientGradient: 'radial-gradient(circle at 50% 25%, rgba(229,9,20,0.3) 0%, rgba(10,12,18,0.85) 60%, #07090e 100%)',
};

/**
 * Extracts vibrant dominant & secondary mood lighting colors from a media backdrop image.
 * Uses an off-screen HTML5 canvas to sample pixels in <10ms.
 */
export function extractPaletteFromImage(imgSrc: string | null | undefined): Promise<ExtractedPalette> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !imgSrc) {
      return resolve(DEFAULT_PALETTE);
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imgSrc;

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return resolve(DEFAULT_PALETTE);

        // Downscale to 64x36 for instant performance
        canvas.width = 64;
        canvas.height = 36;
        ctx.drawImage(img, 0, 0, 64, 36);

        const imgData = ctx.getImageData(0, 0, 64, 36).data;
        let rTotal = 0, gTotal = 0, bTotal = 0, count = 0;
        let dominantR = 229, dominantG = 9, dominantB = 20;
        let secR = 59, secG = 130, secB = 246;
        let maxSat = -1;

        // Sample color distribution
        for (let i = 0; i < imgData.length; i += 16) {
          const r = imgData[i];
          const g = imgData[i + 1];
          const b = imgData[i + 2];
          const brightness = (r + g + b) / 3;

          // Filter out near black and near white
          if (brightness > 25 && brightness < 235) {
            rTotal += r;
            gTotal += g;
            bTotal += b;
            count++;

            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            const sat = max === 0 ? 0 : (max - min) / max;

            if (sat > maxSat) {
              secR = dominantR;
              secG = dominantG;
              secB = dominantB;
              maxSat = sat;
              dominantR = r;
              dominantG = g;
              dominantB = b;
            }
          }
        }

        if (count > 0 && maxSat < 0.15) {
          // If low saturation overall, use average color boosted slightly
          dominantR = Math.min(255, Math.round((rTotal / count) * 1.2));
          dominantG = Math.min(255, Math.round((gTotal / count) * 1.2));
          dominantB = Math.min(255, Math.round((bTotal / count) * 1.2));
        }

        const primary = `rgb(${dominantR}, ${dominantG}, ${dominantB})`;
        const primaryGlow = `rgba(${dominantR}, ${dominantG}, ${dominantB}, 0.45)`;
        const secondary = `rgb(${secR}, ${secG}, ${secB})`;
        const secondaryGlow = `rgba(${secR}, ${secG}, ${secB}, 0.35)`;
        const accent = `rgb(${dominantR}, ${dominantG}, ${dominantB})`;

        const ambientGradient = `radial-gradient(circle at 50% 25%, rgba(${dominantR},${dominantG},${dominantB},0.45) 0%, rgba(${secR},${secG},${secB},0.2) 40%, #07090e 85%)`;

        resolve({
          primary,
          primaryGlow,
          secondary,
          secondaryGlow,
          accent,
          ambientGradient,
        });
      } catch {
        resolve(DEFAULT_PALETTE);
      }
    };

    img.onerror = () => {
      resolve(DEFAULT_PALETTE);
    };
  });
}
