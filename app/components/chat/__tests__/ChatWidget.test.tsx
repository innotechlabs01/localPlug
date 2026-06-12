import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act, waitFor, cleanup } from '@testing-library/react'
import en from '@/lib/i18n/locales/en'

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/'),
}))

vi.mock('@/lib/i18n', () => ({
  useI18n: () => ({
    t: en,
    lang: 'en' as const,
  }),
  I18nProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('@/app/components/ratings/RatingForm', () => ({
  default: ({ onSubmitted }: { onSubmitted: () => void }) => (
    <button onClick={onSubmitted} data-testid="mock-rating-submit">Submit Rating</button>
  ),
}))

import ChatWidget from '../ChatWidget'

const mockFetch = vi.fn()

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetch)
  Element.prototype.scrollIntoView = vi.fn()
  localStorage.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
  cleanup()
  vi.useRealTimers()
})

function renderWidget() {
  return render(<ChatWidget />)
}

function openChat() {
  const openBtn = screen.getAllByLabelText(en.chatWidget.open)[0]
  fireEvent.click(openBtn)
}

function fillForm() {
  fireEvent.change(screen.getByPlaceholderText(en.chatWidget.formNamePlaceholder), { target: { value: 'John Doe' } })
  fireEvent.change(screen.getByPlaceholderText(en.chatWidget.formEmailPlaceholder), { target: { value: 'john@example.com' } })
  fireEvent.change(screen.getByPlaceholderText(en.chatWidget.formPhonePlaceholder), { target: { value: '+573001234567' } })
  fireEvent.change(screen.getByDisplayValue(en.chatWidget.formCountryPlaceholder), { target: { value: 'Colombia' } })
  fireEvent.change(screen.getByDisplayValue(en.chatWidget.formCountryCodePlaceholder), { target: { value: '+57' } })
}

function mockStartConversation() {
  mockFetch.mockImplementation((url: string) => {
    if (url === '/api/chat/start') {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, conversationId: 42 }),
      })
    }
    if (url.includes('/api/chat/messages')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, messages: [] }),
      })
    }
    return Promise.reject(new Error('Unknown URL: ' + url))
  })
}

describe('ChatWidget', () => {
  it('renders closed state initially with open button', () => {
    renderWidget()
    const buttons = screen.getAllByLabelText(en.chatWidget.open)
    expect(buttons.length).toBeGreaterThanOrEqual(1)
  })

  it('opens to show FormScreen with form fields', () => {
    renderWidget()
    openChat()
    const titles = screen.getAllByText(en.chatWidget.title)
    expect(titles.length).toBeGreaterThanOrEqual(1)
    expect(screen.getByPlaceholderText(en.chatWidget.formNamePlaceholder)).toBeTruthy()
    expect(screen.getByPlaceholderText(en.chatWidget.formEmailPlaceholder)).toBeTruthy()
    expect(screen.getByPlaceholderText(en.chatWidget.formPhonePlaceholder)).toBeTruthy()
  })

  it('disables submit button when form fields are empty', () => {
    renderWidget()
    openChat()
    expect(screen.getByText(en.chatWidget.formSubmit)).toBeDisabled()
  })

  it('submits form with valid data and transitions to ChatScreen', async () => {
    mockStartConversation()
    renderWidget()
    openChat()
    fillForm()

    await act(async () => {
      fireEvent.click(screen.getByText(en.chatWidget.formSubmit))
    })

    await waitFor(() => {
      expect(screen.getByPlaceholderText(en.chatWidget.inputPlaceholder)).toBeTruthy()
    })
  })

  it('sends message via POST /api/chat/send', async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url === '/api/chat/start') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, conversationId: 42 }),
        })
      }
      if (url.includes('/api/chat/messages')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, messages: [] }),
        })
      }
      if (url === '/api/chat/send') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            conversationId: 42,
            response: { sender: 'ai', content: 'I can help you!', type: 'text' },
          }),
        })
      }
      return Promise.reject(new Error('Unknown URL: ' + url))
    })

    renderWidget()
    openChat()
    fillForm()

    await act(async () => {
      fireEvent.click(screen.getByText(en.chatWidget.formSubmit))
    })

    await waitFor(() => {
      expect(screen.getByPlaceholderText(en.chatWidget.inputPlaceholder)).toBeTruthy()
    })

    const input = screen.getByPlaceholderText(en.chatWidget.inputPlaceholder)
    fireEvent.change(input, { target: { value: 'Hello' } })

    await act(async () => {
      fireEvent.keyDown(input, { key: 'Enter', shiftKey: false })
    })

    await waitFor(() => {
      const sendCalls = mockFetch.mock.calls.filter((c: any) => c[0] === '/api/chat/send')
      expect(sendCalls.length).toBeGreaterThanOrEqual(1)
      const body = JSON.parse(sendCalls[0][1].body)
      expect(body.message).toBe('Hello')
    })
  })

  it('polls for more messages using setInterval', async () => {
    mockStartConversation()
    vi.useFakeTimers()
    renderWidget()
    openChat()
    fillForm()

    await act(async () => {
      fireEvent.click(screen.getByText(en.chatWidget.formSubmit))
    })

    const messagesCalls = () => mockFetch.mock.calls.filter((c: any) => c[0].includes('/api/chat/messages'))
    const before = messagesCalls().length

    await act(async () => {
      vi.advanceTimersByTime(5000)
    })

    const after = messagesCalls().length
    expect(after).toBeGreaterThan(before)
    vi.useRealTimers()
  })

  it('shows inactivity warning after 60s of no activity', async () => {
    vi.useFakeTimers()

    mockFetch.mockImplementation((url: string) => {
      if (url === '/api/chat/start') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, conversationId: 42 }),
        })
      }
      if (url === '/api/chat/send') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            conversationId: 42,
            response: { sender: 'ai', content: 'Hello!', type: 'text' },
          }),
        })
      }
      if (url.includes('/api/chat/messages')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: false, messages: [] }),
        })
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })
    })

    renderWidget()
    openChat()
    fillForm()

    await act(async () => {
      fireEvent.click(screen.getByText(en.chatWidget.formSubmit))
    })
    await act(async () => {})

    // Send a message to trigger resetInactivityTimer which sets the 60s timeout
    const input = screen.getByPlaceholderText(en.chatWidget.inputPlaceholder)
    fireEvent.change(input, { target: { value: 'Hi' } })

    await act(async () => {
      fireEvent.keyDown(input, { key: 'Enter', shiftKey: false })
    })
    await act(async () => {})

    await act(async () => {
      vi.advanceTimersByTime(60000)
    })

    expect(screen.getByText(en.chatWidget.inactivityWarning)).toBeTruthy()
    vi.useRealTimers()
  })
})
