import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ChatWidget from '@/app/components/chat/ChatWidget'
import { I18nProvider } from '@/lib/i18n'

describe('ChatWidget Accessibility & UX', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    Element.prototype.scrollIntoView = vi.fn()
    global.fetch = vi.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, messages: [] }),
      }),
    ) as unknown as typeof fetch
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders trigger button with correct ARIA attributes and toggles on click', () => {
    render(
      <I18nProvider>
        <ChatWidget />
      </I18nProvider>,
    )

    const triggerBtn = screen.getByRole('button', {
      name: /open chat|abrir chat/i,
    })
    expect(triggerBtn).toHaveAttribute('aria-expanded', 'false')
    expect(triggerBtn).toHaveAttribute('aria-haspopup', 'dialog')

    fireEvent.click(triggerBtn)

    expect(triggerBtn).toHaveAttribute('aria-expanded', 'true')
    const dialog = screen.getByRole('dialog')
    expect(dialog).toBeInTheDocument()
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAttribute('aria-labelledby', 'chat-widget-title')
  })

  it('closes dialog on Escape key and restores focus to trigger button', () => {
    render(
      <I18nProvider>
        <ChatWidget />
      </I18nProvider>,
    )

    const triggerBtn = screen.getByRole('button', {
      name: /open chat|abrir chat/i,
    })
    fireEvent.click(triggerBtn)

    expect(screen.getByRole('dialog')).toBeInTheDocument()

    fireEvent.keyDown(window, { key: 'Escape' })

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(triggerBtn).toHaveAttribute('aria-expanded', 'false')
    expect(document.activeElement).toBe(triggerBtn)
  })

  it('includes aria-live="polite" on the messages container', () => {
    render(
      <I18nProvider>
        <ChatWidget />
      </I18nProvider>,
    )

    const triggerBtn = screen.getByRole('button', {
      name: /open chat|abrir chat/i,
    })
    fireEvent.click(triggerBtn)

    const dialog = screen.getByRole('dialog')
    const liveContainer = dialog.querySelector('[aria-live="polite"]')
    expect(liveContainer).toBeInTheDocument()
  })
})
