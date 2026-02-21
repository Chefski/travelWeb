import { describe, it, expect, beforeEach, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useTripStore } from '~/stores/tripStore'
import TripSetupDialog from '~/components/TripSetupDialog.vue'

const mockProcessFile = vi.fn()
vi.mock('~/composables/useImageUpload', () => ({
  useImageUpload: () => ({ processFile: mockProcessFile }),
}))

vi.mock('vue-sonner', () => ({
  toast: Object.assign(vi.fn(), { error: vi.fn() }),
}))

vi.mock('@internationalized/date', () => ({
  CalendarDate: class CalendarDate {
    year: number
    month: number
    day: number
    constructor(year: number, month: number, day: number) {
      this.year = year
      this.month = month
      this.day = day
    }
  },
}))

function mountDialog(props: Record<string, any> = {}) {
  const pinia = createPinia()
  setActivePinia(pinia)
  return {
    wrapper: shallowMount(TripSetupDialog, {
      props: {
        open: true,
        ...props,
      },
      global: {
        plugins: [pinia],
        stubs: {
          Dialog: { template: '<div><slot /></div>' },
          DialogContent: { template: '<div><slot /></div>' },
          DialogHeader: { template: '<div><slot /></div>' },
          DialogFooter: { template: '<div><slot /></div>' },
          DialogTitle: { template: '<span data-testid="dialog-title"><slot /></span>' },
          DialogDescription: { template: '<span><slot /></span>' },
        },
      },
    }),
    store: useTripStore(),
  }
}

describe('TripSetupDialog', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders dialog content with title and form fields', () => {
    const { wrapper } = mountDialog()

    const title = wrapper.find('[data-testid="dialog-title"]')
    expect(title.exists()).toBe(true)
    expect(title.text()).toContain('Plan a new trip')
    expect(wrapper.text()).toContain('Trip name')
    expect(wrapper.text()).toContain('Travel dates')
  })

  it('has create button disabled when form is incomplete', () => {
    const { wrapper } = mountDialog()

    // With shallowMount + custom Dialog stubs, Button stubs are still shallow.
    // Check via vm.canCreate computed property instead
    const vm = wrapper.vm as any
    expect(vm.canCreate).toBe(false)
  })

  it('calls store.createTrip on create when form is valid', async () => {
    const { wrapper, store } = mountDialog()
    const createSpy = vi.spyOn(store, 'createTrip')

    const vm = wrapper.vm as any
    vm.tripName = 'Summer in Italy'
    vm.dateRange = {
      start: { year: 2026, month: 6, day: 1 },
      end: { year: 2026, month: 6, day: 5 },
    }
    await wrapper.vm.$nextTick()

    vm.onCreate()

    expect(createSpy).toHaveBeenCalledWith(
      'Summer in Italy',
      '2026-06-01',
      '2026-06-05',
      undefined,
    )
  })

  it('emits created after successful creation', async () => {
    const { wrapper } = mountDialog()

    const vm = wrapper.vm as any
    vm.tripName = 'Tokyo Trip'
    vm.dateRange = {
      start: { year: 2026, month: 7, day: 10 },
      end: { year: 2026, month: 7, day: 15 },
    }
    await wrapper.vm.$nextTick()

    vm.onCreate()
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('created')).toBeTruthy()
  })

  // --- Image upload tests ---

  it('onFileSelected with non-image file shows toast error', async () => {
    const { toast } = await import('vue-sonner')
    const { wrapper } = mountDialog()
    const vm = wrapper.vm as any

    const event = {
      target: {
        files: [new File([''], 'doc.pdf', { type: 'application/pdf' })],
      },
    }
    await vm.onFileSelected(event)

    expect(toast.error).toHaveBeenCalledWith('Please select an image file')
  })

  it('onFileSelected with valid image sets coverImage and imagePreview', async () => {
    mockProcessFile.mockResolvedValue('data:image/png;base64,abc123')

    const { wrapper } = mountDialog()
    const vm = wrapper.vm as any

    const file = new File(['img'], 'photo.png', { type: 'image/png' })
    const event = { target: { files: [file] } }
    await vm.onFileSelected(event)

    expect(vm.coverImage).toBe('data:image/png;base64,abc123')
    expect(vm.imagePreview).toBe('data:image/png;base64,abc123')
  })

  it('onFileSelected when processFile rejects shows toast error', async () => {
    const { toast } = await import('vue-sonner')
    mockProcessFile.mockRejectedValue(new Error('fail'))

    const { wrapper } = mountDialog()
    const vm = wrapper.vm as any

    const file = new File(['img'], 'photo.png', { type: 'image/png' })
    await vm.onFileSelected({ target: { files: [file] } })

    expect(toast.error).toHaveBeenCalledWith('Failed to process image')
  })

  it('clearImage resets coverImage, imagePreview, and file input', async () => {
    const { wrapper } = mountDialog()
    const vm = wrapper.vm as any

    vm.coverImage = 'data:image/png;base64,abc'
    vm.imagePreview = 'data:image/png;base64,abc'
    await wrapper.vm.$nextTick()

    vm.clearImage()

    expect(vm.coverImage).toBe('')
    expect(vm.imagePreview).toBeNull()
  })

  it('coverImage watcher clears imagePreview for non-data: URLs', async () => {
    const { wrapper } = mountDialog()
    const vm = wrapper.vm as any

    vm.imagePreview = 'data:image/png;base64,old'
    vm.coverImage = 'https://example.com/photo.jpg'
    await wrapper.vm.$nextTick()

    expect(vm.imagePreview).toBeNull()
  })

  it('dateLabel with only start date shows "start - ..."', async () => {
    const { wrapper } = mountDialog()
    const vm = wrapper.vm as any

    vm.dateRange = {
      start: { year: 2026, month: 6, day: 1 },
      end: undefined,
    }
    await wrapper.vm.$nextTick()

    expect(vm.dateLabel).toBe('Jun 1, 2026 - ...')
  })

  it('dateLabel with no dates shows default text', async () => {
    const { wrapper } = mountDialog()
    const vm = wrapper.vm as any
    vm.dateRange = { start: undefined, end: undefined }
    await wrapper.vm.$nextTick()

    expect(vm.dateLabel).toBe('Pick your travel dates')
  })

  it('dateLabel with both dates shows formatted range', async () => {
    const { wrapper } = mountDialog()
    const vm = wrapper.vm as any
    vm.dateRange = {
      start: { year: 2026, month: 8, day: 10 },
      end: { year: 2026, month: 8, day: 15 },
    }
    await wrapper.vm.$nextTick()

    expect(vm.dateLabel).toBe('Aug 10, 2026 - Aug 15, 2026')
  })

  it('onCreate does nothing when form is incomplete', async () => {
    const { wrapper, store } = mountDialog()
    const createSpy = vi.spyOn(store, 'createTrip')
    const vm = wrapper.vm as any
    // tripName is empty by default, canCreate should be false
    vm.onCreate()
    expect(createSpy).not.toHaveBeenCalled()
  })

  it('onCreate passes coverImage to store.createTrip', async () => {
    const { wrapper, store } = mountDialog()
    const createSpy = vi.spyOn(store, 'createTrip')
    const vm = wrapper.vm as any
    vm.tripName = 'Beach Trip'
    vm.dateRange = {
      start: { year: 2026, month: 7, day: 1 },
      end: { year: 2026, month: 7, day: 5 },
    }
    vm.coverImage = 'https://example.com/beach.jpg'
    await wrapper.vm.$nextTick()
    vm.onCreate()

    expect(createSpy).toHaveBeenCalledWith(
      'Beach Trip',
      '2026-07-01',
      '2026-07-05',
      'https://example.com/beach.jpg',
    )
  })

  it('onCreate resets all form fields after creation', async () => {
    const { wrapper } = mountDialog()
    const vm = wrapper.vm as any

    vm.tripName = 'Summer Trip'
    vm.dateRange = {
      start: { year: 2026, month: 6, day: 1 },
      end: { year: 2026, month: 6, day: 5 },
    }
    vm.coverImage = 'https://example.com/img.jpg'
    vm.imagePreview = 'https://example.com/img.jpg'
    await wrapper.vm.$nextTick()

    vm.onCreate()
    await wrapper.vm.$nextTick()

    expect(vm.tripName).toBe('')
    expect(vm.dateRange.start).toBeUndefined()
    expect(vm.dateRange.end).toBeUndefined()
    expect(vm.coverImage).toBe('')
    expect(vm.imagePreview).toBeNull()
  })
})
