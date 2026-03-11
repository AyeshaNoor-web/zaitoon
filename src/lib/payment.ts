export const ADVANCE_THRESHOLD = 10000
export const ADVANCE_PERCENTAGE = 0.5

export function getPaymentRequirements(orderTotal: number) {
    if (orderTotal >= ADVANCE_THRESHOLD) {
        const advance = Math.ceil(orderTotal * ADVANCE_PERCENTAGE)
        return {
            requiresAdvance: true,
            advanceAmount: advance,
            remainingAmount: orderTotal - advance,
            message: `Orders above Rs. 10,000 require 50% advance (Rs. ${advance.toLocaleString()}).`
        }
    }
    return { requiresAdvance: false, advanceAmount: 0, remainingAmount: orderTotal, message: null }
}

export function formatPrice(amount: number): string {
    return `Rs. ${amount.toLocaleString('en-PK')}`
}
