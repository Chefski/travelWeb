import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useMapboxSearch } from '~/composables/useMapboxSearch';

// Mock useDebounceFn to call immediately (no delay)
vi.mock('@vueuse/core', async () => {
  const actual = await vi.importActual('@vueuse/core');
  return { ...actual, useDebounceFn: (fn: Function) => fn };
});

const mockFetch = globalThis.fetch as ReturnType<typeof vi.fn>;

/** Flush all pending microtasks so fire-and-forget promises settle. */
function flushPromises(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

beforeEach(() => {
  mockFetch.mockReset();
});

// ---- fetchSuggestions (via onSearchInput since fetchSuggestions is not exported) ----

describe('fetchSuggestions', () => {
  it('calls Mapbox suggest API with correct params', async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => ({
        suggestions: [{ name: 'Paris', mapbox_id: 'abc', place_formatted: 'France', feature_type: 'place' }],
      }),
    });

    const { onSearchInput, suggestions } = useMapboxSearch();
    onSearchInput('Paris');
    await flushPromises();

    expect(mockFetch).toHaveBeenCalledOnce();
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain('https://api.mapbox.com/search/searchbox/v1/suggest');
    expect(url).toContain('q=Paris');
    expect(url).toContain('access_token=test-token');
    expect(url).toContain('limit=5');
    expect(suggestions.value).toHaveLength(1);
    expect(suggestions.value[0].name).toBe('Paris');
  });

  it('returns empty suggestions for a query shorter than 2 characters', async () => {
    const { onSearchInput, suggestions } = useMapboxSearch();
    onSearchInput('P');
    await flushPromises();

    expect(mockFetch).not.toHaveBeenCalled();
    expect(suggestions.value).toEqual([]);
  });

  it('sets isLoading to false after fetch completes', async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => ({ suggestions: [] }),
    });

    const { onSearchInput, isLoading } = useMapboxSearch();
    onSearchInput('Berlin');
    await flushPromises();

    expect(isLoading.value).toBe(false);
  });

  it('handles fetch error gracefully', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { onSearchInput, suggestions, isLoading } = useMapboxSearch();
    onSearchInput('Tokyo');
    await flushPromises();

    expect(suggestions.value).toEqual([]);
    expect(isLoading.value).toBe(false);
    consoleSpy.mockRestore();
  });
});

// ---- retrievePlace ----

describe('retrievePlace', () => {
  it('returns the retrieved result', async () => {
    const mockResult = {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [2.35, 48.86] },
        properties: { name: 'Paris', mapbox_id: 'abc', place_formatted: 'France', feature_type: 'place' },
      }],
    };
    mockFetch.mockResolvedValueOnce({ json: async () => mockResult });

    const { retrievePlace } = useMapboxSearch();
    const result = await retrievePlace('abc');

    expect(result).toEqual(mockResult);
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain('/retrieve/abc');
    expect(url).toContain('access_token=test-token');
  });

  it('rotates the session token after a successful retrieve', async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => ({ type: 'FeatureCollection', features: [] }),
    });

    const { retrievePlace } = useMapboxSearch();

    // Capture the initial session token from the first call
    await retrievePlace('id1');
    const firstUrl = mockFetch.mock.calls[0][0] as string;
    const firstSessionToken = new URL(firstUrl).searchParams.get('session_token');

    // Second call should use a new session token
    mockFetch.mockResolvedValueOnce({
      json: async () => ({ type: 'FeatureCollection', features: [] }),
    });
    await retrievePlace('id2');
    const secondUrl = mockFetch.mock.calls[1][0] as string;
    const secondSessionToken = new URL(secondUrl).searchParams.get('session_token');

    expect(firstSessionToken).not.toBe(secondSessionToken);
  });

  it('returns null on fetch error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { retrievePlace } = useMapboxSearch();
    const result = await retrievePlace('bad-id');

    expect(result).toBeNull();
    consoleSpy.mockRestore();
  });
});

// ---- clearSearch ----

describe('clearSearch', () => {
  it('resets query and suggestions', async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => ({
        suggestions: [{ name: 'Rome', mapbox_id: 'r1', place_formatted: 'Italy', feature_type: 'place' }],
      }),
    });

    const { onSearchInput, clearSearch, query, suggestions } = useMapboxSearch();
    onSearchInput('Rome');
    await flushPromises();
    expect(query.value).toBe('Rome');
    expect(suggestions.value).toHaveLength(1);

    clearSearch();

    expect(query.value).toBe('');
    expect(suggestions.value).toEqual([]);
  });
});
