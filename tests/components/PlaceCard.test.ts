import { describe, it, expect, beforeEach } from 'vitest'
import { mount, shallowMount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import PlaceCard from '~/components/PlaceCard.vue'
import type { Place } from '~/types/trip'

const place: Place = {
  id: 'p-1',
  mapboxId: 'poi.123',
  name: 'Eiffel Tower',
  address: 'Champ de Mars, Paris, France',
  category: 'landmark',
  coordinates: [2.2945, 48.8584],
  order: 0,
}

const placeNoCategory: Place = {
  ...place,
  id: 'p-2',
  category: '',
}

function mountCard(props: Partial<{ place: Place; color: string }> = {}) {
  return mount(PlaceCard, {
    props: {
      place: props.place ?? place,
      color: props.color ?? '#EF4444',
    },
    global: {
      plugins: [createPinia()],
      stubs: {
        GripVerticalIcon: { template: '<span />' },
        XIcon: { template: '<span />' },
      },
    },
  })
}

describe('PlaceCard', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders the place name', () => {
    const wrapper = mountCard()
    expect(wrapper.text()).toContain('Eiffel Tower')
  })

  it('renders the place address', () => {
    const wrapper = mountCard()
    expect(wrapper.text()).toContain('Champ de Mars, Paris, France')
  })

  it('renders a category badge when category is present', () => {
    const wrapper = mountCard()
    expect(wrapper.text()).toContain('landmark')

    const wrapperNoCat = mountCard({ place: placeNoCategory })
    expect(wrapperNoCat.text()).not.toContain('landmark')
  })

  it('emits click with the place when card is clicked', async () => {
    const wrapper = mountCard()
    await wrapper.find('[role="button"]').trigger('click')
    expect(wrapper.emitted('click')).toBeTruthy()
    expect(wrapper.emitted('click')![0]).toEqual([place])
  })

  it('emits remove with placeId when remove button is clicked', async () => {
    const wrapper = mountCard()
    const removeBtn = wrapper.find('button[aria-label="Remove place"]')
    await removeBtn.trigger('click')
    expect(wrapper.emitted('remove')).toBeTruthy()
    expect(wrapper.emitted('remove')![0]).toEqual(['p-1'])
  })

  it('emits click on Enter keydown', async () => {
    const wrapper = mountCard()
    await wrapper.find('[role="button"]').trigger('keydown.enter')
    expect(wrapper.emitted('click')).toBeTruthy()
    expect(wrapper.emitted('click')![0]).toEqual([place])
  })

  it('emits click on Space keydown', async () => {
    const wrapper = mountCard()
    await wrapper.find('[role="button"]').trigger('keydown.space')
    expect(wrapper.emitted('click')).toBeTruthy()
    expect(wrapper.emitted('click')![0]).toEqual([place])
  })
})
