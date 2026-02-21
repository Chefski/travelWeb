import { describe, it, expect, beforeEach, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useTripStore } from '~/stores/tripStore'
import TripEditDialog from '~/components/TripEditDialog.vue'

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

const dialogStubs = {
  Dialog: { template: '<div><slot /></div>' },
  DialogContent: { template: '<div><slot /></div>' },
  DialogHeader: { template: '<div><slot /></div>' },
  DialogFooter: { template: '<div><slot /></div>' },
  DialogTitle: { template: '<span data-testid="dialog-title"><slot /></span>' },
  DialogDescription: { template: '<span><slot /></span>' },
}

function mountDialog(props: Record<string, any> = {}) {
  const pinia = createPinia()
  setActivePinia(pinia)
  const store = useTripStore()
  // Pre-create a trip so the dialog has data to pre-fill
  store.createTrip('Paris Trip', '2026-06-01', '2026-06-05')

  // Mount with open=false first, then set open=true to trigger the watch
  const wrapper = shallowMount(TripEditDialog, {
    props: {
      open: false,
      ...props,
    },
    global: {
      plugins: [pinia],
      stubs: dialogStubs,
    },
  })

  return { wrapper, store }
}

describe('TripEditDialog', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders dialog content with edit title', async () => {
    const { wrapper } = mountDialog()
    await wrapper.setProps({ open: true })
    await wrapper.vm.$nextTick()

    const title = wrapper.find('[data-testid="dialog-title"]')
    expect(title.exists()).toBe(true)
    expect(title.text()).toContain('Edit trip')
    expect(wrapper.text()).toContain('Trip name')
    expect(wrapper.text()).toContain('Travel dates')
  })

  it('pre-fills form from store trip data', async () => {
    const { wrapper } = mountDialog()
    // Trigger the watch by changing open from false to true
    await wrapper.setProps({ open: true })
    await wrapper.vm.$nextTick()

    const vm = wrapper.vm as any
    expect(vm.tripName).toBe('Paris Trip')
    expect(vm.dateRange.start).toBeDefined()
    expect(vm.dateRange.start.year).toBe(2026)
    expect(vm.dateRange.start.month).toBe(6)
    expect(vm.dateRange.start.day).toBe(1)
    expect(vm.dateRange.end.year).toBe(2026)
    expect(vm.dateRange.end.month).toBe(6)
    expect(vm.dateRange.end.day).toBe(5)
  })

  it('has save button disabled when form is incomplete', async () => {
    const { wrapper } = mountDialog()
    await wrapper.setProps({ open: true })
    await wrapper.vm.$nextTick()

    // Clear the name to make form incomplete
    const vm = wrapper.vm as any
    vm.tripName = ''
    await wrapper.vm.$nextTick()

    expect(vm.canSave).toBe(false)
  })

  it('calls store.updateTrip on save', async () => {
    const { wrapper, store } = mountDialog()
    await wrapper.setProps({ open: true })
    await wrapper.vm.$nextTick()

    const updateSpy = vi.spyOn(store, 'updateTrip')
    const vm = wrapper.vm as any

    // Modify the trip name
    vm.tripName = 'Paris Extended'
    await wrapper.vm.$nextTick()

    vm.onSave()

    expect(updateSpy).toHaveBeenCalledWith(
      'Paris Extended',
      '2026-06-01',
      '2026-06-05',
      undefined,
    )
  })

  // --- Image upload tests ---

  it('onFileSelected with non-image file shows toast error', async () => {
    const { toast } = await import('vue-sonner')
    const { wrapper } = mountDialog()
    await wrapper.setProps({ open: true })
    await wrapper.vm.$nextTick()

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
    await wrapper.setProps({ open: true })
    await wrapper.vm.$nextTick()

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
    await wrapper.setProps({ open: true })
    await wrapper.vm.$nextTick()

    const vm = wrapper.vm as any
    const file = new File(['img'], 'photo.png', { type: 'image/png' })
    await vm.onFileSelected({ target: { files: [file] } })

    expect(toast.error).toHaveBeenCalledWith('Failed to process image')
  })

  it('clearImage resets coverImage, imagePreview, and file input', async () => {
    const { wrapper } = mountDialog()
    await wrapper.setProps({ open: true })
    await wrapper.vm.$nextTick()

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
    await wrapper.setProps({ open: true })
    await wrapper.vm.$nextTick()

    const vm = wrapper.vm as any
    vm.imagePreview = 'data:image/png;base64,old'
    vm.coverImage = 'https://example.com/photo.jpg'
    await wrapper.vm.$nextTick()

    expect(vm.imagePreview).toBeNull()
  })

  it('dateLabel with only start date shows "start - ..."', async () => {
    const { wrapper } = mountDialog()
    await wrapper.setProps({ open: true })
    await wrapper.vm.$nextTick()

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
    await wrapper.setProps({ open: true })
    await wrapper.vm.$nextTick()

    const vm = wrapper.vm as any
    vm.dateRange = { start: undefined, end: undefined }
    await wrapper.vm.$nextTick()

    expect(vm.dateLabel).toBe('Pick your travel dates')
  })

  it('dateLabel with both dates shows formatted range', async () => {
    const { wrapper } = mountDialog()
    await wrapper.setProps({ open: true })
    await wrapper.vm.$nextTick()

    const vm = wrapper.vm as any
    expect(vm.dateLabel).toBe('Jun 1, 2026 - Jun 5, 2026')
  })

  it('onSave with empty coverImage passes undefined', async () => {
    const { wrapper, store } = mountDialog()
    await wrapper.setProps({ open: true })
    await wrapper.vm.$nextTick()

    const updateSpy = vi.spyOn(store, 'updateTrip')
    const vm = wrapper.vm as any
    vm.coverImage = '   '
    await wrapper.vm.$nextTick()

    vm.onSave()

    expect(updateSpy).toHaveBeenCalledWith(
      'Paris Trip',
      '2026-06-01',
      '2026-06-05',
      undefined,
    )
  })

  it('onSave does nothing when form is incomplete', async () => {
    const { wrapper, store } = mountDialog()
    await wrapper.setProps({ open: true })
    await wrapper.vm.$nextTick()

    const updateSpy = vi.spyOn(store, 'updateTrip')
    const vm = wrapper.vm as any
    vm.tripName = ''
    await wrapper.vm.$nextTick()

    vm.onSave()

    expect(updateSpy).not.toHaveBeenCalled()
  })

  it('onSave passes trimmed coverImage to store.updateTrip', async () => {
    const { wrapper, store } = mountDialog()
    await wrapper.setProps({ open: true })
    await wrapper.vm.$nextTick()

    const updateSpy = vi.spyOn(store, 'updateTrip')
    const vm = wrapper.vm as any
    vm.coverImage = '  https://example.com/img.jpg  '
    await wrapper.vm.$nextTick()

    vm.onSave()

    expect(updateSpy).toHaveBeenCalledWith(
      'Paris Trip',
      '2026-06-01',
      '2026-06-05',
      'https://example.com/img.jpg',
    )
  })
})
