export interface ExtractedPalette {
  primary: string;
  primaryGlow: string;
  secondary: string;
  secondaryGlow: string;
  tertiary: string;
  tertiaryGlow: string;
  quaternary: string;
  quaternaryGlow: string;
  accent: string;
  ambientGradient: string;
}

export const DEFAULT_PALETTE: ExtractedPalette = {
  primary: 'rgb(229, 9, 20)',
  primaryGlow: 'rgba(229, 9, 20, 0.65)',
  secondary: 'rgb(59, 130, 246)',
  secondaryGlow: 'rgba(59, 130, 246, 0.55)',
  tertiary: 'rgb(168, 85, 247)',
  tertiaryGlow: 'rgba(168, 85, 247, 0.5)',
  quaternary: 'rgb(245, 158, 11)',
  quaternaryGlow: 'rgba(245, 158, 11, 0.45)',
  accent: 'rgb(234, 179, 8)',
  ambientGradient:
    'radial-gradient(circle at 20% 20%, rgba(229,9,20,0.5) 0%, transparent 60%), radial-gradient(circle at 80% 30%, rgba(59,130,246,0.45) 0%, transparent 60%), radial-gradient(circle at 30% 75%, rgba(168,85,247,0.4) 0%, transparent 60%), radial-gradient(circle at 80% 80%, rgba(245,158,11,0.35) 0%, #07090e 90%)',
};

// Genre vibrant multi-color palettes
const GENRE_PALETTES: Record<
  number,
  {
    primary: [number, number, number];
    secondary: [number, number, number];
    tertiary: [number, number, number];
    quaternary: [number, number, number];
  }
> = {
  28: {
    primary: [239, 68, 68],     // Crimson Flame
    secondary: [249, 115, 22],   // Burning Orange
    tertiary: [234, 179, 8],     // Gold Ember
    quaternary: [147, 51, 234],  // Electric Purple
  },
  12: {
    primary: [14, 165, 233],    // Ocean Cyan
    secondary: [16, 185, 129],   // Emerald Forest
    tertiary: [245, 158, 11],    // Golden Sun
    quaternary: [99, 102, 241],  // Royal Indigo
  },
  16: {
    primary: [236, 72, 153],    // Sakura Pink
    secondary: [147, 51, 234],   // Twilight Violet
    tertiary: [6, 182, 212],     // Sky Cyan
    quaternary: [251, 146, 60],  // Sunset Peach
  },
  35: {
    primary: [234, 179, 8],     // Sunny Gold
    secondary: [249, 115, 22],   // Tangerine
    tertiary: [236, 72, 153],    // Fuchsia
    quaternary: [16, 185, 129],  // Mint Green
  },
  80: {
    primary: [225, 29, 72],     // Blood Crimson
    secondary: [79, 70, 229],    // Deep Indigo
    tertiary: [148, 163, 184],   // Steel Slate
    quaternary: [180, 83, 9],    // Noir Amber
  },
  18: {
    primary: [99, 102, 241],    // Velvet Indigo
    secondary: [217, 70, 239],   // Orchid Magenta
    tertiary: [14, 165, 233],    // Horizon Blue
    quaternary: [245, 158, 11],  // Warm Glow
  },
  14: {
    primary: [168, 85, 247],    // Mystical Purple
    secondary: [59, 130, 246],   // Arcane Blue
    tertiary: [236, 72, 153],    // Fairy Pink
    quaternary: [20, 184, 166],  // Crystal Teal
  },
  27: {
    primary: [185, 28, 28],     // Dark Blood Red
    secondary: [88, 28, 135],    // Shadow Plum
    tertiary: [15, 23, 42],      // Obsidian
    quaternary: [194, 65, 12],   // Rust Orange
  },
  878: {
    primary: [6, 182, 212],     // Cyber Cyan
    secondary: [168, 85, 247],   // Neon Violet
    tertiary: [236, 72, 153],    // Laser Magenta
    quaternary: [59, 130, 246],  // Deep Space Blue
  },
  53: {
    primary: [225, 29, 72],     // Danger Red
    secondary: [147, 51, 234],   // Dark Violet
    tertiary: [249, 115, 22],    // Warning Orange
    quaternary: [15, 118, 110],  // Deep Teal
  },
};

export function getPaletteForGenre(genreId?: number): ExtractedPalette {
  if (genreId && GENRE_PALETTES[genreId]) {
    const { primary: p, secondary: s, tertiary: t, quaternary: q } = GENRE_PALETTES[genreId];
    return {
      primary: `rgb(${p[0]}, ${p[1]}, ${p[2]})`,
      primaryGlow: `rgba(${p[0]}, ${p[1]}, ${p[2]}, 0.65)`,
      secondary: `rgb(${s[0]}, ${s[1]}, ${s[2]})`,
      secondaryGlow: `rgba(${s[0]}, ${s[1]}, ${s[2]}, 0.55)`,
      tertiary: `rgb(${t[0]}, ${t[1]}, ${t[2]})`,
      tertiaryGlow: `rgba(${t[0]}, ${t[1]}, ${t[2]}, 0.5)`,
      quaternary: `rgb(${q[0]}, ${q[1]}, ${q[2]})`,
      quaternaryGlow: `rgba(${q[0]}, ${q[1]}, ${q[2]}, 0.45)`,
      accent: `rgb(${p[0]}, ${p[1]}, ${p[2]})`,
      ambientGradient: `radial-gradient(circle at 15% 20%, rgba(${p[0]},${p[1]},${p[2]},0.55) 0%, transparent 60%), radial-gradient(circle at 85% 30%, rgba(${s[0]},${s[1]},${s[2]},0.5) 0%, transparent 60%), radial-gradient(circle at 25% 70%, rgba(${t[0]},${t[1]},${t[2]},0.45) 0%, transparent 60%), radial-gradient(circle at 80% 80%, rgba(${q[0]},${q[1]},${q[2]},0.4) 0%, #07090e 90%)`,
    };
  }
  return DEFAULT_PALETTE;
}

/**
 * Extracts a rich multi-color palette (primary, secondary, tertiary, quaternary)
 * from a media backdrop image using an off-screen HTML5 canvas.
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
        const colorBuckets: Array<{ r: number; g: number; b: number; sat: number; count: number }> = [];

        for (let i = 0; i < imgData.length; i += 16) {
          const r = imgData[i];
          const g = imgData[i + 1];
          const b = imgData[i + 2];
          const brightness = (r + g + b) / 3;

          // Exclude extreme whites and extreme blacks
          if (brightness > 20 && brightness < 240) {
            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            const sat = max === 0 ? 0 : (max - min) / max;

            // Group into color buckets
            let found = false;
            for (const bucket of colorBuckets) {
              const dist = Math.abs(bucket.r - r) + Math.abs(bucket.g - g) + Math.abs(bucket.b - b);
              if (dist < 70) {
                bucket.count++;
                bucket.r = Math.round((bucket.r + r) / 2);
                bucket.g = Math.round((bucket.g + g) / 2);
                bucket.b = Math.round((bucket.b + b) / 2);
                bucket.sat = Math.max(bucket.sat, sat);
                found = true;
                break;
              }
            }
            if (!found && colorBuckets.length < 12) {
              colorBuckets.push({ r, g, b, sat, count: 1 });
            }
          }
        }

        // Sort by saturation and prominence
        colorBuckets.sort((a, b) => b.sat * 1.5 + (b.count / 100) - (a.sat * 1.5 + (a.count / 100)));

        if (colorBuckets.length < 2) {
          return resolve(defaultGenre);
        }

        const p = colorBuckets[0] || { r: 229, g: 9, b: 20 };
        const s = colorBuckets[1] || { r: 59, g: 130, b: 246 };
        const t = colorBuckets[2] || { r: Math.round((p.r + 80) % 255), g: Math.round((p.g + 40) % 255), b: 220 };
        const q = colorBuckets[3] || { r: 245, g: 158, b: 11 };

        // Boost vibrancy for radiant ambient lighting
        const boost = (val: number) => Math.min(255, Math.round(val * 1.15));

        const primary = `rgb(${boost(p.r)}, ${boost(p.g)}, ${boost(p.b)})`;
        const primaryGlow = `rgba(${boost(p.r)}, ${boost(p.g)}, ${boost(p.b)}, 0.65)`;

        const secondary = `rgb(${boost(s.r)}, ${boost(s.g)}, ${boost(s.b)})`;
        const secondaryGlow = `rgba(${boost(s.r)}, ${boost(s.g)}, ${boost(s.b)}, 0.55)`;

        const tertiary = `rgb(${boost(t.r)}, ${boost(t.g)}, ${boost(t.b)})`;
        const tertiaryGlow = `rgba(${boost(t.r)}, ${boost(t.g)}, ${boost(t.b)}, 0.5)`;

        const quaternary = `rgb(${boost(q.r)}, ${boost(q.g)}, ${boost(q.b)})`;
        const quaternaryGlow = `rgba(${boost(q.r)}, ${boost(q.g)}, ${boost(q.b)}, 0.45)`;

        const ambientGradient = `radial-gradient(circle at 15% 20%, ${primaryGlow} 0%, transparent 60%), radial-gradient(circle at 85% 30%, ${secondaryGlow} 0%, transparent 60%), radial-gradient(circle at 25% 70%, ${tertiaryGlow} 0%, transparent 60%), radial-gradient(circle at 80% 80%, ${quaternaryGlow} 0%, #07090e 90%)`;

        resolve({
          primary,
          primaryGlow,
          secondary,
          secondaryGlow,
          tertiary,
          tertiaryGlow,
          quaternary,
          quaternaryGlow,
          accent: primary,
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
