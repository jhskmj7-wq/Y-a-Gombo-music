
import { safeStringify } from "../jsonUtils";

/**
 * AFRIGOMBO ELITE - AVATAR CACHE SYSTEM
 * Optimizes performance by caching rendered SVGs and item data.
 */
export const AvatarCache = {
  _cache: new Map<string, string>(),

  set(key: string, value: string) {
    if (this._cache.size > 200) {
      // Simple LRU: clear oldest
      const firstKey = this._cache.keys().next().value;
      if (firstKey !== undefined) this._cache.delete(firstKey);
    }
    this._cache.set(key, value);
  },

  get(key: string): string | undefined {
    return this._cache.get(key);
  },

  clear() {
    this._cache.clear();
  },

  generateKey(config: any): string {
    return safeStringify(config);
  }
};
