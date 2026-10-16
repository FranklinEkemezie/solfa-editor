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

export function compareFractions(left: Fraction, right: Fraction): number {
    return left.numerator * right.denominator - right.numerator * left.denominator;
}

export function fractionToNumber(value: Fraction): number {
    return value.numerator / value.denominator;
}
