import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ref } from 'vue';
import { shallowMount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import PlaceSearch from '~/components/PlaceSearch.vue';

const mockSearch = {
  query: ref(''),
  suggestions: ref<any[]>([]),
  isLoading: ref(false),
  onSearchInput: vi.fn(),
  retrievePlace: vi.fn(),
  clearSearch: vi.fn(),
};

vi.mock('~/composables/useMapboxSearch', () => ({
  useMapboxSearch: () => mockSearch,
}));

function mountSearch(pinia?: ReturnType<typeof createPinia>) {
  const p = pinia ?? createPinia();
  setActivePinia(p);
  return shallowMount(PlaceSearch, {
    global: { plugins: [p] },
  });
}

describe('PlaceSearch', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    mockSearch.query.value = '';
    mockSearch.suggestions.value = [];
    mockSearch.isLoading.value = false;
    vi.clearAllMocks();
  });

  it('renders a search input', () => {
    const wrapper = mountSearch();
    const input = wrapper.findComponent({ name: 'Input' });
    expect(input.exists()).toBe(true);
  });

  it('shows loading spinner when isLoading is true', async () => {
    mockSearch.isLoading.value = true;
    const wrapper = mountSearch();
    await wrapper.vm.$nextTick();

    // Lucide icons render as anonymous-stub in shallowMount.
    // The Loader2Icon has the animate-spin class when rendered.
    const html = wrapper.html();
    expect(html).toContain('animate-spin');
  });

  it('shows suggestions dropdown when suggestions exist and showDropdown is true', async () => {
    mockSearch.suggestions.value = [
      { mapbox_id: 'poi.1', name: 'Eiffel Tower', place_formatted: 'Paris, France', feature_type: 'poi' },
      { mapbox_id: 'poi.2', name: 'Louvre Museum', place_formatted: 'Paris, France', feature_type: 'poi' },
    ];

    const wrapper = mountSearch();
    // Trigger focus to set showDropdown = true
    const input = wrapper.findComponent({ name: 'Input' });
    await input.vm.$emit('focus');
    await wrapper.vm.$nextTick();

    const buttons = wrapper.findAll('button');
    expect(buttons.length).toBeGreaterThanOrEqual(2);
    expect(wrapper.text()).toContain('Eiffel Tower');
    expect(wrapper.text()).toContain('Louvre Museum');
  });

  it('calls onSearchInput when the input fires an input event', async () => {
    const wrapper = mountSearch();
    const input = wrapper.findComponent({ name: 'Input' });

    const inputEvent = new Event('input');
    Object.defineProperty(inputEvent, 'target', { value: { value: 'paris' } });
    await input.vm.$emit('input', inputEvent);
    await wrapper.vm.$nextTick();

    expect(mockSearch.onSearchInput).toHaveBeenCalledWith('paris');
  });

  it('onSelectSuggestion with no features does not emit', async () => {
    mockSearch.retrievePlace.mockResolvedValue({ type: 'FeatureCollection', features: [] });
    mockSearch.suggestions.value = [
      { mapbox_id: 'poi.99', name: 'Unknown', place_formatted: 'Nowhere', feature_type: 'poi' },
    ];

    const wrapper = mountSearch();
    const input = wrapper.findComponent({ name: 'Input' });
    await input.vm.$emit('focus');
    await wrapper.vm.$nextTick();

    const btn = wrapper.findAll('button').find(b => b.text().includes('Unknown'));
    expect(btn).toBeDefined();
    await btn!.trigger('mousedown');

    await vi.waitFor(() => {
      expect(wrapper.emitted('place-selected')).toBeFalsy();
    });
  });

  it('blur on input hides dropdown after timeout', async () => {
    vi.useFakeTimers();
    mockSearch.suggestions.value = [
      { mapbox_id: 'poi.1', name: 'Eiffel Tower', place_formatted: 'Paris', feature_type: 'poi' },
    ];
    const wrapper = mountSearch();
    const input = wrapper.findComponent({ name: 'Input' });

    // Focus to show dropdown
    await input.vm.$emit('focus');
    await wrapper.vm.$nextTick();
    expect((wrapper.vm as any).showDropdown).toBe(true);

    // Blur to trigger handleBlur
    await input.vm.$emit('blur');
    // Not hidden yet
    expect((wrapper.vm as any).showDropdown).toBe(true);

    // Advance timer
    vi.advanceTimersByTime(200);
    expect((wrapper.vm as any).showDropdown).toBe(false);

    vi.useRealTimers();
  });

  it('emits place-selected after selecting a suggestion', async () => {
    const { useTripStore } = await import('~/stores/tripStore');
    const pinia = createPinia();
    setActivePinia(pinia);
    const store = useTripStore();
    store.createTrip('Paris', '2026-06-01', '2026-06-03');

    const suggestion = {
      mapbox_id: 'poi.1',
      name: 'Eiffel Tower',
      place_formatted: 'Paris, France',
      feature_type: 'landmark',
    };

    mockSearch.retrievePlace.mockResolvedValue({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [2.2945, 48.8584] },
          properties: {
            name: 'Eiffel Tower',
            mapbox_id: 'poi.1',
            place_formatted: 'Paris, France',
            full_address: 'Champ de Mars, Paris, France',
          },
        },
      ],
    });

    mockSearch.suggestions.value = [suggestion];

    const wrapper = shallowMount(PlaceSearch, {
      global: { plugins: [pinia] },
    });

    const input = wrapper.findComponent({ name: 'Input' });
    await input.vm.$emit('focus');
    await wrapper.vm.$nextTick();

    const buttons = wrapper.findAll('button');
    const suggestionBtn = buttons.find(b => b.text().includes('Eiffel Tower'));
    expect(suggestionBtn).toBeDefined();
    await suggestionBtn!.trigger('mousedown');

    await vi.waitFor(() => {
      expect(wrapper.emitted('place-selected')).toBeTruthy();
    });
  });
});
