/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import Fuse from 'fuse.js';
import { mockSearchData, SearchItem } from '../data/mockSearchData';

export function useFuzzySearch(query: string) {
  const [results, setResults] = useState<SearchItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fuse = new Fuse(mockSearchData, {
    keys: ['title', 'subtitle', 'id'],
    threshold: 0.3,
    includeMatches: true,
  });

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const timeoutId = setTimeout(() => {
      const fuseResults = fuse.search(query).map(r => r.item);
      setResults(fuseResults);
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  return { results, isLoading };
}
