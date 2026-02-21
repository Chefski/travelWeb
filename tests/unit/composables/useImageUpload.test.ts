import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useImageUpload } from '~/composables/useImageUpload'

// ---- Mocks ----

const mockCtx = { drawImage: vi.fn() }
const mockCanvas = {
  width: 0,
  height: 0,
  getContext: vi.fn(() => mockCtx),
  toDataURL: vi.fn(() => 'data:image/jpeg;base64,abc123'),
}

let imgWidth = 2400
let imgHeight = 1200

class MockImage {
  width = imgWidth
  height = imgHeight
  onload: (() => void) | null = null
  onerror: ((err: any) => void) | null = null

  set src(_: string) {
    setTimeout(() => {
      this.width = imgWidth
      this.height = imgHeight
      this.onload?.()
    }, 0)
  }
}

function createMockFile(name = 'photo.jpg', size = 1024): File {
  const content = new Uint8Array(size)
  return new File([content], name, { type: 'image/jpeg' })
}

describe('useImageUpload', () => {
  const origCreateElement = document.createElement.bind(document)

  beforeEach(() => {
    vi.stubGlobal('Image', MockImage)
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'canvas') return mockCanvas as any
      return origCreateElement(tag)
    })
    mockCtx.drawImage.mockClear()
    mockCanvas.getContext.mockClear()
    mockCanvas.toDataURL.mockClear()
    mockCanvas.width = 0
    mockCanvas.height = 0
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns a processFile function', () => {
    const { processFile } = useImageUpload()
    expect(typeof processFile).toBe('function')
  })

  it('resizes an image wider than maxWidth', async () => {
    imgWidth = 2400
    imgHeight = 1200

    const { processFile } = useImageUpload(1200, 0.8)
    await processFile(createMockFile())

    // 2400 > 1200 so it should be scaled down:
    //   width  = 1200
    //   height = Math.round((1200 * 1200) / 2400) = 600
    expect(mockCanvas.width).toBe(1200)
    expect(mockCanvas.height).toBe(600)
    expect(mockCtx.drawImage).toHaveBeenCalledWith(
      expect.any(MockImage),
      0,
      0,
      1200,
      600,
    )
  })

  it('preserves dimensions for images narrower than maxWidth', async () => {
    imgWidth = 800
    imgHeight = 600

    const { processFile } = useImageUpload(1200, 0.8)
    await processFile(createMockFile())

    expect(mockCanvas.width).toBe(800)
    expect(mockCanvas.height).toBe(600)
    expect(mockCtx.drawImage).toHaveBeenCalledWith(
      expect.any(MockImage),
      0,
      0,
      800,
      600,
    )
  })

  it('returns a data:image/jpeg data URL', async () => {
    imgWidth = 1000
    imgHeight = 500

    const { processFile } = useImageUpload(1200, 0.8)
    const result = await processFile(createMockFile())

    expect(result).toBe('data:image/jpeg;base64,abc123')
    expect(mockCanvas.toDataURL).toHaveBeenCalledWith('image/jpeg', 0.8)
  })
})
