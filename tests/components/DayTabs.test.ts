import { describe, it, expect, beforeEach } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useTripStore } from '~/stores/tripStore'
import { DAY_COLORS } from '~/types/trip'
import DayTabs from '~/components/DayTabs.vue'

function mountTabs() {
  const pinia = createPinia()
  setActivePinia(pinia)
  const store = useTripStore()
  // Create trip BEFORE mounting so the v-if="store.trip" renders content
  store.createTrip('Paris', '2026-06-01', '2026-06-03')
  const wrapper = shallowMount(DayTabs, {
    global: { plugins: [pinia] },
  })
  return { wrapper, store }
}

describe('DayTabs', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders a tab button for each day', () => {
    const { wrapper } = mountTabs()
    const buttons = wrapper.findAll('button[role="tab"]')
    expect(buttons).toHaveLength(3)
    expect(buttons[0].text()).toContain('Day 1')
    expect(buttons[1].text()).toContain('Day 2')
    expect(buttons[2].text()).toContain('Day 3')
  })

  it('applies backgroundColor style to the active tab', () => {
    const { wrapper } = mountTabs()
    const buttons = wrapper.findAll('button[role="tab"]')
    const activeStyle = buttons[0].attributes('style')
    expect(activeStyle).toContain('background-color')
    // The style value is set as-is from DAY_COLORS, use case-insensitive check
    expect(activeStyle!.toLowerCase()).toContain(DAY_COLORS[0].toLowerCase())
  })

  it('calls selectDay when a tab is clicked', async () => {
    const { wrapper, store } = mountTabs()
    const buttons = wrapper.findAll('button[role="tab"]')
    await buttons[2].trigger('click')
    expect(store.selectedDayIndex).toBe(2)
  })

  it('uses the correct DAY_COLOR for each active index', async () => {
    const { wrapper, store } = mountTabs()

    store.selectDay(1)
    await wrapper.vm.$nextTick()

    const buttons = wrapper.findAll('button[role="tab"]')
    const activeStyle = buttons[1].attributes('style')
    expect(activeStyle!.toLowerCase()).toContain(DAY_COLORS[1].toLowerCase())
  })
})
