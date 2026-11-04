import type { Ad } from '../../domain/types'

/*
 * Mock ad pool for the gallery wall (OQ-10: the real ad source is still open).
 * placeholder_1–3 were supplied by the project owner; 4–8 are abstract SVG
 * placeholders. Sizes are the files' real pixel sizes. Advertisers are fictional.
 *
 * Shapes: 5:4 landscape (1, 4, 5, 8), 4:5 portrait (2, 6, 7), roughly square (3).
 */
export const MOCK_ADS: readonly Ad[] = [
  {
    id: 'ad-prism-studio',
    advertiser: 'Prism Studio',
    image: {
      src: '/ads/placeholder_1.png',
      alt: 'Abstract painting of translucent crystal shapes and sweeping red, yellow and blue ribbons on a black ground',
      width: 500,
      height: 400,
    },
    href: 'https://example.com/prism-studio',
  },
  {
    id: 'ad-westside-museum',
    advertiser: 'Westside Museum of Art',
    image: {
      src: '/ads/placeholder_2.webp',
      alt: 'Abstract painting of overlapping translucent green, red, yellow and blue crystal forms on a dark ground',
      width: 959,
      height: 1200,
    },
    caption: 'Join us at the Westside Museum',
    href: 'https://example.com/westside-museum',
  },
  {
    id: 'ad-canyon-galleries',
    advertiser: 'Canyon Galleries',
    image: {
      src: '/ads/placeholder_3.webp',
      alt: 'Abstract painting of red and violet rock-like forms rising toward a pale sky full of soft yellow clouds',
      width: 1200,
      height: 1183,
    },
    caption: 'Now showing: Irregular Forms',
    href: 'https://example.com/canyon-galleries',
  },
  {
    id: 'ad-orbit-coffee',
    advertiser: 'Orbit Coffee',
    image: {
      src: '/ads/placeholder_4.svg',
      alt: 'Orange, yellow and teal circles and a square over a wavy blue horizon on navy',
      width: 1000,
      height: 800,
    },
    href: 'https://example.com/orbit-coffee',
  },
  {
    id: 'ad-blockprint-books',
    advertiser: 'Blockprint Books',
    image: {
      src: '/ads/placeholder_5.svg',
      alt: 'Color-block grid of red, teal, mustard and blue rectangles on cream, with a cream circle on the red block',
      width: 1000,
      height: 800,
    },
    caption: 'Stories worth the shelf space',
    href: 'https://example.com/blockprint-books',
  },
  {
    id: 'ad-dusk-trails',
    advertiser: 'Dusk Trails Outfitters',
    image: {
      src: '/ads/placeholder_6.svg',
      alt: 'A yellow sun setting behind layered purple mountain ridges under a violet-to-pink sky',
      width: 800,
      height: 1000,
    },
    href: 'https://example.com/dusk-trails',
  },
  {
    id: 'ad-ripple-records',
    advertiser: 'Ripple Records',
    image: {
      src: '/ads/placeholder_7.svg',
      alt: 'Concentric yellow, orange and coral rings around a small teal dot on dark teal',
      width: 800,
      height: 1000,
    },
    caption: 'New pressings every Friday',
    href: 'https://example.com/ripple-records',
  },
  {
    id: 'ad-fieldnote-gardens',
    advertiser: 'Fieldnote Gardens',
    image: {
      src: '/ads/placeholder_8.svg',
      alt: 'Overlapping green, amber and navy triangles on pale mint',
      width: 1000,
      height: 800,
    },
    href: 'https://example.com/fieldnote-gardens',
  },
]
