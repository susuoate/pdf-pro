import { en } from './en';
import { th } from './th';
import { Language, TranslationSchema } from './types';

export const dictionaries: Record<Language, TranslationSchema> = { en, th };

/**
 * Resolves a dot-notation key (e.g. "tools.merge.title" or "common.save")
 * with automatic fallback: Target Lang -> English -> Key String.
 * Supports token substitution: {count}, {name}, {size}, etc.
 */
export function translate(
  lang: Language,
  path: string,
  params?: Record<string, string | number>
): string {
  const dict = dictionaries[lang] || dictionaries.en;
  const fallbackDict = dictionaries.en;

  const getNested = (obj: any, keys: string[]): any => {
    let curr = obj;
    for (const key of keys) {
      if (curr && typeof curr === 'object' && key in curr) {
        curr = curr[key];
      } else {
        return undefined;
      }
    }
    return typeof curr === 'string' ? curr : undefined;
  };

  const keys = path.split('.');
  let result = getNested(dict, keys) || getNested(fallbackDict, keys) || path;

  if (params && typeof result === 'string') {
    for (const [paramKey, paramValue] of Object.entries(params)) {
      result = result.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramValue));
    }
  }

  return result;
}
