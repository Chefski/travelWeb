import { vi } from 'vitest'

// Polyfill crypto.randomUUID for happy-dom
if (!globalThis.crypto?.randomUUID) {
  const crypto = globalThis.crypto || {}
  crypto.randomUUID = () =>
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
    }) as `${string}-${string}-${string}-${string}-${string}`
  Object.defineProperty(globalThis, 'crypto', { value: crypto })
}

// Polyfill localStorage for @vueuse/core's useLocalStorage (happy-dom's
// implementation doesn't satisfy the Storage interface it expects).
if (typeof globalThis.localStorage === 'undefined' || !globalThis.localStorage?.getItem) {
  const store = new Map<string, string>()
  const storage: Storage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => { store.set(key, value) },
    removeItem: (key: string) => { store.delete(key) },
    clear: () => store.clear(),
    key: (index: number) => [...store.keys()][index] ?? null,
    get length() { return store.size },
  }
  Object.defineProperty(globalThis, 'localStorage', { value: storage, writable: true })
}

// Polyfill Element.prototype.animate for happy-dom (Web Animations API)
if (!Element.prototype.animate) {
  Element.prototype.animate = vi.fn(() => ({
    onfinish: null as (() => void) | null,
    cancel: vi.fn(),
    finished: Promise.resolve(),
  })) as any
}

// Make requestAnimationFrame synchronous for tests
vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { cb(0); return 0 })
vi.stubGlobal('cancelAnimationFrame', vi.fn())

// Default env
import.meta.env.VITE_MAPBOX_TOKEN = 'test-token'

// Default fetch mock
globalThis.fetch = vi.fn()
