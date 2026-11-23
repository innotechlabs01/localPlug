import { Money } from './money'

export { Money }
export type { CurrencyCode } from './money'

// Percentage value object: stores an integer basis-point value (0-10000) or a 0-1 ratio.
export class Percentage {
  constructor(public readonly ratio: number) {
    if (ratio < 0 || ratio > 1) {
      throw new Error('Percentage ratio must be between 0 and 1')
    }
  }

  static fromBasisPoints(bp: number): Percentage {
    return new Percentage(bp / 10000)
  }

  static fromWhole(whole: number): Percentage {
    return new Percentage(whole / 100)
  }

  get basisPoints(): number {
    return Math.round(this.ratio * 10000)
  }

  get whole(): number {
    return this.ratio * 100
  }

  apply(amount: Money): Money {
    const applied = Math.round(amount.minorUnits * this.ratio)
    return new Money(applied, amount.currency)
  }
}
