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
  primaryGlow: 'rgba(229, 9, 20, 0.55)',
  secondary: 'rgb(59, 130, 246)',
  secondaryGlow: 'rgba(59, 130, 246, 0.45)',
  accent: 'rgb(234, 179, 8)',
  ambientGradient: 'radial-gradient(circle at 50% 25%, rgba(229,9,20,0.4) 0%, rgba(10,12,18,0.85) 60%, #07090e 100%)',
};

// Genre color presets for instant vivid aura before image finishes loading
const GENRE_PALETTES: Record<number, { primary: [number, number, number]; secondary: [number, number, number] }> = {
  28: { primary: [239, 68, 68], secondary: [249, 115, 22] },   // Action: Flame Red & Orange
  12: { primary: [16, 185, 129], secondary: [59, 130, 246] },  // Adventure: Emerald & Sky
  16: { primary: [168, 85, 247], secondary: [236, 72, 153] },  // Animation: Violet & Pink
  35: { primary: [234, 179, 8], secondary: [249, 115, 22] },   // Comedy: Gold & Amber
  80: { primary: [100, 116, 139], secondary: [225, 29, 72] },  // Crime: Slate & Crimson
  18: { primary: [99, 102, 241], secondary: [14, 165, 233] },   // Drama: Indigo & Cyan
  14: { primary: [147, 51, 234], secondary: [59, 130, 246] },  // Fantasy: Purple & Royal Blue
  27: { primary: [185, 28, 28], secondary: [88, 28, 135] },    // Horror: Blood Red & Dark Violet
  878: { primary: [6, 182, 212], secondary: [139, 92, 246] },  // Sci-Fi: Neon Cyan & Purple
  53: { primary: [217, 70, 239], secondary: [239, 68, 68] },   // Thriller: Magenta & Red
};

export function getPaletteForGenre(genreId?: number): ExtractedPalette {
  if (genreId && GENRE_PALETTES[genreId]) {
    const { primary: p, secondary: s } = GENRE_PALETTES[genreId];
    return {
      primary: `rgb(${p[0]}, ${p[1]}, ${p[2]})`,
      primaryGlow: `rgba(${p[0]}, ${p[1]}, ${p[2]}, 0.55)`,
      secondary: `rgb(${s[0]}, ${s[1]}, ${s[2]})`,
      secondaryGlow: `rgba(${s[0]}, ${s[1]}, ${s[2]}, 0.45)`,
      accent: `rgb(${p[0]}, ${p[1]}, ${p[2]})`,
      ambientGradient: `radial-gradient(circle at 50% 25%, rgba(${p[0]},${p[1]},${p[2]},0.45) 0%, rgba(${s[0]},${s[1]},${s[2]},0.25) 50%, #07090e 90%)`,
    };
  }
  return DEFAULT_PALETTE;
}

/**
 * Extracts vibrant dominant & secondary mood lighting colors from a media backdrop image.
 */
export function extractPaletteFromImage(
  imgSrc: string | null | undefined,
  genreId?: number
): Promise<ExtractedPalette> {
  const defaultGenre = getPaletteForGenre(genreId);

  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !imgSrc) {
      return resolve(defaultGenre);
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imgSrc;

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return resolve(defaultGenre);

        canvas.width = 64;
        canvas.height = 36;
        ctx.drawImage(img, 0, 0, 64, 36);

        const imgData = ctx.getImageData(0, 0, 64, 36).data;
        let rTotal = 0, gTotal = 0, bTotal = 0, count = 0;
        let dominantR = 229, dominantG = 9, dominantB = 20;
        let secR = 59, secG = 130, secB = 246;
        let maxSat = -1;

        for (let i = 0; i < imgData.length; i += 16) {
          const r = imgData[i];
          const g = imgData[i + 1];
          const b = imgData[i + 2];
          const brightness = (r + g + b) / 3;

          if (brightness > 20 && brightness < 240) {
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

        if (count > 0 && maxSat < 0.2) {
          dominantR = Math.min(255, Math.round((rTotal / count) * 1.3));
          dominantG = Math.min(255, Math.round((gTotal / count) * 1.3));
          dominantB = Math.min(255, Math.round((bTotal / count) * 1.3));
        }

        const primary = `rgb(${dominantR}, ${dominantG}, ${dominantB})`;
        const primaryGlow = `rgba(${dominantR}, ${dominantG}, ${dominantB}, 0.55)`;
        const secondary = `rgb(${secR}, ${secG}, ${secB})`;
        const secondaryGlow = `rgba(${secR}, ${secG}, ${secB}, 0.45)`;
        const accent = `rgb(${dominantR}, ${dominantG}, ${dominantB})`;

        const ambientGradient = `radial-gradient(circle at 50% 25%, rgba(${dominantR},${dominantG},${dominantB},0.5) 0%, rgba(${secR},${secG},${secB},0.3) 50%, #07090e 90%)`;

        resolve({
          primary,
          primaryGlow,
          secondary,
          secondaryGlow,
          accent,
          ambientGradient,
        });
      } catch {
        resolve(defaultGenre);
      }
    };

    img.onerror = () => {
      resolve(defaultGenre);
    };
  });
}

