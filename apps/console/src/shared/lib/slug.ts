import { convert } from 'hangul-romanization';

/**
 * Generate a URL-friendly slug from a given text
 * - Converts Korean characters to romanized form
 * - Converts to lowercase
 * - Replaces spaces and special characters with hyphens
 * - Removes consecutive hyphens
 * - Trims hyphens from start and end
 */
export function generateSlug(text: string): string {
  if (!text) return '';

  // Convert Korean to romanized form
  const romanized = convert(text);

  // Convert to lowercase, replace spaces and special chars with hyphens
  let slug = romanized
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric chars with hyphens
    .replace(/-+/g, '-') // Replace consecutive hyphens with single hyphen
    .replace(/^-|-$/g, ''); // Remove hyphens from start and end

  // Ensure minimum length
  if (slug.length < 3) {
    return '';
  }

  // Ensure maximum length
  if (slug.length > 50) {
    slug = slug.substring(0, 50).replace(/-$/g, '');
  }

  return slug;
}
