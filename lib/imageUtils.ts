/**
 * Supabase Image Transformation Utilities
 * Uses Supabase Storage image transformations for optimized images
 */

/**
 * Get optimized image URL from Supabase Storage
 * @param imageUrl - Original image URL from Supabase Storage
 * @param options - Transformation options
 * @returns Optimized image URL
 */
export function getOptimizedImageUrl(
  imageUrl: string | null | undefined,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'jpg' | 'png';
    resize?: 'cover' | 'contain' | 'fill';
  } = {}
): string {
  // If no image URL, return placeholder
  if (!imageUrl) {
    return 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&h=300&fit=crop';
  }

  // If it's already an Unsplash URL, return as-is
  if (imageUrl.includes('unsplash.com') || imageUrl.includes('http://') || imageUrl.includes('https://')) {
    // For Unsplash, we can add query params for optimization
    if (imageUrl.includes('unsplash.com')) {
      const url = new URL(imageUrl);
      if (options.width) url.searchParams.set('w', options.width.toString());
      if (options.height) url.searchParams.set('h', options.height.toString());
      if (options.quality) url.searchParams.set('q', options.quality.toString());
      return url.toString();
    }
    return imageUrl;
  }

  // For Supabase Storage URLs, use transformation API
  // Supabase Storage transformation format: /storage/v1/object/public/{bucket}/{path}?transform={options}
  const baseUrl = imageUrl.split('?')[0]; // Remove existing query params
  const params = new URLSearchParams();

  // Add transformation parameters
  if (options.width) params.append('width', options.width.toString());
  if (options.height) params.append('height', options.height.toString());
  if (options.quality) params.append('quality', options.quality.toString());
  if (options.format) params.append('format', options.format);
  if (options.resize) params.append('resize', options.resize);

  // If we have transformation params, add them
  if (params.toString()) {
    return `${baseUrl}?${params.toString()}`;
  }

  return imageUrl;
}

/**
 * Get responsive image URLs for different screen sizes
 * @param imageUrl - Original image URL
 * @returns Object with different size URLs
 */
export function getResponsiveImageUrls(imageUrl: string | null | undefined) {
  return {
    thumbnail: getOptimizedImageUrl(imageUrl, { width: 150, height: 150, quality: 80, format: 'webp' }),
    small: getOptimizedImageUrl(imageUrl, { width: 400, height: 300, quality: 85, format: 'webp' }),
    medium: getOptimizedImageUrl(imageUrl, { width: 800, height: 600, quality: 85, format: 'webp' }),
    large: getOptimizedImageUrl(imageUrl, { width: 1200, height: 900, quality: 90, format: 'webp' }),
    original: imageUrl || 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&h=300&fit=crop',
  };
}

/**
 * Get optimized project cover image
 * @param imageUrl - Project cover image URL
 * @param size - Size variant ('thumbnail' | 'card' | 'detail')
 * @returns Optimized image URL
 */
export function getProjectImage(
  imageUrl: string | null | undefined,
  size: 'thumbnail' | 'card' | 'detail' = 'card'
): string {
  const sizes = {
    thumbnail: { width: 200, height: 150, quality: 80 },
    card: { width: 400, height: 300, quality: 85 },
    detail: { width: 800, height: 600, quality: 90 },
  };

  return getOptimizedImageUrl(imageUrl, {
    ...sizes[size],
    format: 'webp',
    resize: 'cover',
  });
}

