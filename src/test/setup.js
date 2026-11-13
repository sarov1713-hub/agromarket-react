import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, vi } from 'vitest'
import { server } from './server.js'

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterAll(() => server.close())

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  server.resetHandlers()
  localStorage.clear()
})
