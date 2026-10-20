export type Fraction = Readonly<{ numerator: number; denominator: number }>;

function gcd(left: number, right: number): number {
    let a = Math.abs(left);
    let b = Math.abs(right);
    while (b !== 0) {
        const remainder = a % b;
        a = b;
        b = remainder;
    }
    return a || 1;
}

export function fraction(numerator: number, denominator = 1): Fraction {
    if (!Number.isInteger(numerator) || !Number.isInteger(denominator) || denominator === 0) {
        throw new Error('Fractions require an integer numerator and non-zero denominator.');
    }
    const sign = denominator < 0 ? -1 : 1;
    const divisor = gcd(numerator, denominator);
    return {
        numerator: (numerator / divisor) * sign,
        denominator: Math.abs(denominator / divisor),
    };
}

export function addFractions(left: Fraction, right: Fraction): Fraction {
    return fraction(
        left.numerator * right.denominator + right.numerator * left.denominator,
        left.denominator * right.denominator,
    );
}

export function subtractFractions(left: Fraction, right: Fraction): Fraction {
    return fraction(
        left.numerator * right.denominator - right.numerator * left.denominator,
        left.denominator * right.denominator,
    );
}

export function multiplyFractions(left: Fraction, right: Fraction): Fraction {
    return fraction(left.numerator * right.numerator, left.denominator * right.denominator);
}

export function divideFractions(left: Fraction, right: Fraction): Fraction {
    if (right.numerator === 0) throw new Error('Cannot divide by a zero fraction.');
    return fraction(left.numerator * right.denominator, left.denominator * right.numerator);
}

export function compareFractions(left: Fraction, right: Fraction): number {
    return left.numerator * right.denominator - right.numerator * left.denominator;
}

export const ZERO_FRACTION: Fraction = { numerator: 0, denominator: 1 };

export function isZeroFraction(value: Fraction): boolean {
    return value.numerator === 0;
}

export function fractionsEqual(left: Fraction, right: Fraction): boolean {
    return compareFractions(left, right) === 0;
}

/** The largest whole number that is not greater than the fraction. */
export function floorFraction(value: Fraction): number {
    return Math.floor(value.numerator / value.denominator);
}

/** The smallest whole number that is not less than the fraction. */
export function ceilFraction(value: Fraction): number {
    return Math.ceil(value.numerator / value.denominator);
}
