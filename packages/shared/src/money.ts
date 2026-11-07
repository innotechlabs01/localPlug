// Money value object: stores integer minor units (e.g. cents) to avoid float drift.
export type CurrencyCode = 'USD' | 'COP' | 'EUR'

export class Money {
  constructor(
    public readonly minorUnits: number,
    public readonly currency: CurrencyCode = 'USD',
  ) {}

  static fromMajor(amount: number, currency: CurrencyCode = 'USD'): Money {
    return new Money(Math.round(amount * 100), currency)
  }

  get major(): number {
    return this.minorUnits / 100
  }

  add(other: Money): Money {
    if (other.currency !== this.currency) {
      throw new Error('Cannot add Money with different currencies')
    }
    return new Money(this.minorUnits + other.minorUnits, this.currency)
  }

  subtract(other: Money): Money {
    if (other.currency !== this.currency) {
      throw new Error('Cannot subtract Money with different currencies')
    }
    return new Money(this.minorUnits - other.minorUnits, this.currency)
  }

  format(locale = 'en-US'): string {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: this.currency,
    }).format(this.major)
  }
}
