import { describe, it, expect, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import WorldMap from '~/components/WorldMap.vue';

const mockMapInstance = {
  on: vi.fn(),
  off: vi.fn(),
  remove: vi.fn(),
};

vi.mock('mapbox-gl', () => {
  const MockMap = vi.fn().mockImplementation(function (this: any) {
    Object.assign(this, mockMapInstance);
  });
  return { default: { Map: MockMap, accessToken: '' } };
});

vi.mock('mapbox-gl/dist/mapbox-gl.css', () => ({}));

function mountMap() {
  const pinia = createPinia();
  setActivePinia(pinia);
  return shallowMount(WorldMap, {
    global: { plugins: [pinia] },
  });
}

describe('WorldMap', () => {
  it('mounts without error', () => {
    const wrapper = mountMap();
    expect(wrapper.exists()).toBe(true);
    expect(wrapper.find('#map-container').exists()).toBe(true);
  });

  it('exposes a map ref via vm', () => {
    const wrapper = mountMap();
    const vm = wrapper.vm as any;
    // The component defines `defineExpose({ map })`, so map should be accessible
    expect(vm.map).toBeDefined();
  });
});
