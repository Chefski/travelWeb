import { describe, it, expect, beforeEach, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useTripStore } from '~/stores/tripStore'
import TripHeader from '~/components/TripHeader.vue'

function mountHeader() {
  const pinia = createPinia()
  setActivePinia(pinia)
  const store = useTripStore()
  store.createTrip('Summer in Italy', '2026-06-01', '2026-06-05')
  const wrapper = shallowMount(TripHeader, {
    global: { plugins: [pinia] },
  })
  return { wrapper, store }
}

describe('TripHeader', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders the trip name in an h2', () => {
    const { wrapper } = mountHeader()
    const h2 = wrapper.find('h2')
    expect(h2.exists()).toBe(true)
    expect(h2.text()).toBe('Summer in Italy')
  })

  it('renders the date range', () => {
    const { wrapper } = mountHeader()
    const text = wrapper.text()
    expect(text).toContain('Jun')
    expect(text).toContain('2026')
  })

  it('shows day count badge', () => {
    const { wrapper } = mountHeader()
    // The Badge component is stubbed by shallowMount as <badge-stub>.
    // Shallow stubs in @vue/test-utils v2 do NOT render slot content.
    // Verify the badge stub exists and has the correct variant prop.
    const badge = wrapper.findComponent({ name: 'Badge' })
    expect(badge.exists()).toBe(true)
    expect(badge.attributes('variant')).toBe('secondary')
    // Verify the store has 5 days (the badge text "5 days" comes from the store data)
    expect(wrapper.vm.$pinia.state.value.trip.trip.days.length).toBe(5)
  })

  it('emits new-trip and edit-trip on button clicks', async () => {
    const { wrapper } = mountHeader()

    const buttons = wrapper.findAllComponents({ name: 'Button' })
    const editBtn = buttons.find(b => b.attributes('aria-label') === 'Edit trip')
    const newBtn = buttons.find(b => b.attributes('aria-label') === 'Start new trip')

    expect(editBtn).toBeDefined()
    expect(newBtn).toBeDefined()

    await editBtn!.trigger('click')
    expect(wrapper.emitted('edit-trip')).toBeTruthy()

    await newBtn!.trigger('click')
    expect(wrapper.emitted('new-trip')).toBeTruthy()
  })

  it('emits edit-trip on Enter keydown on cover image div', async () => {
    const { wrapper } = mountHeader()
    const coverDiv = wrapper.find('[role="button"]')
    await coverDiv.trigger('keydown.enter')
    expect(wrapper.emitted('edit-trip')).toBeTruthy()
  })

  it('emits edit-trip on Space keydown on cover image div', async () => {
    const { wrapper } = mountHeader()
    const coverDiv = wrapper.find('[role="button"]')
    await coverDiv.trigger('keydown.space')
    expect(wrapper.emitted('edit-trip')).toBeTruthy()
  })

  it('shows fallback gradient when no cover image', () => {
    const { wrapper } = mountHeader()
    // Default trip has no cover image, so fallback gradient is used
    const gradientDiv = wrapper.find('[style*="linear-gradient"]')
    expect(gradientDiv.exists()).toBe(true)
  })

  it('hasImage is false when coverImage is empty string', () => {
    const { wrapper } = mountHeader()
    // Default trip has no cover image
    const vm = wrapper.vm as any
    expect(vm.hasImage).toBeFalsy()
  })

  it('hasImage is true when trip has coverImage', () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const store = useTripStore()
    store.createTrip('Italy Trip', '2026-06-01', '2026-06-05', 'https://example.com/italy.jpg')
    const wrapper = shallowMount(TripHeader, {
      global: { plugins: [pinia] },
    })
    const vm = wrapper.vm as any
    expect(vm.hasImage).toBe(true)
  })

  it('dateDisplay formats dates correctly', () => {
    const { wrapper } = mountHeader()
    const vm = wrapper.vm as any
    expect(vm.dateDisplay).toContain('Jun')
    expect(vm.dateDisplay).toContain('2026')
  })

  it('fallbackGradient returns a gradient string', () => {
    const { wrapper } = mountHeader()
    const vm = wrapper.vm as any
    expect(vm.fallbackGradient).toMatch(/linear-gradient/)
  })

  it('shows cover image when trip has coverImage', () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const store = useTripStore()
    store.createTrip('Italy Trip', '2026-06-01', '2026-06-05', 'https://example.com/italy.jpg')
    const wrapper = shallowMount(TripHeader, {
      global: { plugins: [pinia] },
    })
    const img = wrapper.find('img')
    expect(img.exists()).toBe(true)
    expect(img.attributes('src')).toBe('https://example.com/italy.jpg')
  })
})
