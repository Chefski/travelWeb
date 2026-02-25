import { describe, it, expect, beforeEach, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { useTripStore } from '~/stores/tripStore';
import { SAMPLE_PLACE, SAMPLE_PLACE_2 } from '../helpers/fixtures';
import PlaceList from '~/components/PlaceList.vue';
import PlaceCard from '~/components/PlaceCard.vue';

vi.mock('vue-draggable-plus', () => ({
  VueDraggable: {
    name: 'VueDraggable',
    template: '<div><slot /></div>',
    props: ['modelValue'],
  },
}));

function mountList(withPlaces = false) {
  const pinia = createPinia();
  setActivePinia(pinia);
  const store = useTripStore();
  store.createTrip('Paris', '2026-06-01', '2026-06-03');
  if (withPlaces) {
    store.addPlace(SAMPLE_PLACE);
    store.addPlace(SAMPLE_PLACE_2);
  }
  const wrapper = shallowMount(PlaceList, {
    global: {
      plugins: [pinia],
      stubs: {
        // Register PlaceCard as a known stub so shallowMount creates <place-card-stub>
        PlaceCard: true,
        // Don't shallow-stub VueDraggable -- let the mock render its slot
        VueDraggable: false,
      },
    },
  });
  return { wrapper, store };
}

describe('PlaceList', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('shows empty state when no places exist', () => {
    const { wrapper } = mountList(false);
    expect(wrapper.text()).toContain('No places added yet');
  });

  it('renders a PlaceCard for each place', () => {
    const { wrapper } = mountList(true);
    const cards = wrapper.findAllComponents({ name: 'PlaceCard' });
    expect(cards).toHaveLength(2);
  });

  it('emits place-clicked when PlaceCard emits click', async () => {
    const { wrapper, store } = mountList(true);
    const card = wrapper.findComponent({ name: 'PlaceCard' });
    const addedPlace = store.currentDay!.places[0];
    card.vm.$emit('click', addedPlace);
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('place-clicked')).toBeTruthy();
    expect(wrapper.emitted('place-clicked')![0]).toEqual([addedPlace]);
  });

  it('calls store.reorderPlaces when drag ends', async () => {
    const { wrapper, store } = mountList(true);
    const reorderSpy = vi.spyOn(store, 'reorderPlaces');

    const vm = wrapper.vm as any;
    vm.onDragEnd();

    expect(reorderSpy).toHaveBeenCalledWith(
      store.selectedDayIndex,
      expect.any(Array),
    );
  });

  it('calls store.removePlace when PlaceCard emits remove', async () => {
    const { wrapper, store } = mountList(true);
    const placeId = store.currentDay!.places[0].id;
    const removeSpy = vi.spyOn(store, 'removePlace');

    const card = wrapper.findComponent({ name: 'PlaceCard' });
    card.vm.$emit('remove', placeId);
    await wrapper.vm.$nextTick();

    expect(removeSpy).toHaveBeenCalledWith(store.selectedDayIndex, placeId);
  });
});
