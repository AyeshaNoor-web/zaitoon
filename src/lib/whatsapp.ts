export interface WhatsAppPayload {
    orderNumber: string
    customerName: string
    customerPhone: string
    orderType: 'delivery' | 'takeaway' | 'dine-in'
    // Delivery fields
    deliveryAddress?: string
    deliveryLat?: number
    deliveryLng?: number
    distanceKm?: number
    branchName: string
    items: Array<{
        name: string
        size?: string | null
        quantity?: number
        qty?: number        // alias
        unitPrice?: number
        price?: number      // alias
        subtotal?: number
    }>
    subtotal: number
    deliveryFee: number
    loyaltyDiscount?: number
    tierDiscount?: number    // Rs. discount from membership tier
    customerTier?: string    // 'bronze' | 'silver' | 'gold' | 'platinum'
    baseDeliveryFee?: number // pre-perk delivery fee (to detect free-delivery perk)
    total: number
    paymentMethod: 'jazzcash' | 'cod'
    pointsEarned?: number
}

/** Badge emoji for a tier */
function tierBadge(tier: string): string {
    if (tier === 'platinum') return '💎'
    if (tier === 'gold') return '🥇'
    if (tier === 'silver') return '🥈'
    return ''
}

/** Build a plain-text WhatsApp message from an order payload */
export function buildWhatsAppMessage(payload: WhatsAppPayload): string {
    const lines: string[] = []

    lines.push(`🌿 *NEW ORDER — Zaitoon House of Shawarma & BBQ*`)
    lines.push(``)
    lines.push(`📋 *Order #${payload.orderNumber}*`)
    lines.push(`👤 *Name:*   ${payload.customerName}`)
    lines.push(`📞 *Phone:*  ${payload.customerPhone}`)

    if (payload.orderType === 'delivery') {
        lines.push(`📍 *Deliver to:*`)
        if (payload.deliveryAddress) {
            lines.push(`   ${payload.deliveryAddress}`)
        }
        if (payload.deliveryLat && payload.deliveryLng) {
            lines.push(`   🗺️ maps.google.com/?q=${payload.deliveryLat},${payload.deliveryLng}`)
        }
        if (payload.distanceKm) {
            lines.push(`   📏 ${payload.distanceKm} km from ${payload.branchName}`)
        }
    } else if (payload.orderType === 'takeaway') {
        lines.push(`🏪 *Takeaway from:* ${payload.branchName}`)
    } else {
        lines.push(`🍽️ *Dine-In at:* ${payload.branchName}`)
    }

    lines.push(``)
    lines.push(`━━━━━━━━ ITEMS ━━━━━━━━`)
    payload.items.forEach(item => {
        const sizeSuffix = item.size ? ` (${item.size})` : ''
        const count = item.quantity ?? item.qty ?? 1
        const unitPrice = item.unitPrice ?? item.price ?? 0
        const lineTotal = item.subtotal ?? unitPrice * count
        lines.push(`• ${item.name}${sizeSuffix} ×${count} — Rs. ${lineTotal.toLocaleString()}`)
    })
    lines.push(``)

    // ── Price breakdown ─────────────────────────────────────────
    lines.push(`Subtotal:        Rs. ${payload.subtotal.toLocaleString()}`)

    if ((payload.deliveryFee ?? 0) > 0) {
        lines.push(`Delivery:        Rs. ${payload.deliveryFee.toLocaleString()}`)
    }

    // Tier perk — % discount on subtotal
    if ((payload.tierDiscount ?? 0) > 0 && payload.customerTier) {
        const badge = tierBadge(payload.customerTier)
        const label = payload.customerTier.charAt(0).toUpperCase() + payload.customerTier.slice(1)
        lines.push(`🏆 ${badge} ${label} perk:  -Rs. ${payload.tierDiscount!.toLocaleString()}`)
    }

    // Tier perk — free delivery
    if (
        payload.customerTier &&
        payload.customerTier !== 'bronze' &&
        payload.deliveryFee === 0 &&
        (payload.baseDeliveryFee ?? 0) > 0
    ) {
        const label = payload.customerTier.charAt(0).toUpperCase() + payload.customerTier.slice(1)
        lines.push(`🚀 Free delivery  (${label} member)`)
    }

    // Loyalty points redemption
    if ((payload.loyaltyDiscount ?? 0) > 0) {
        lines.push(`Points:         -Rs. ${payload.loyaltyDiscount!.toLocaleString()}`)
    }

    lines.push(``)
    lines.push(`*💵 TOTAL:   Rs. ${payload.total.toLocaleString()}*`)
    lines.push(`💳 ${payload.paymentMethod === 'jazzcash' ? 'JazzCash' : 'Cash on Delivery'}`)

    if ((payload.pointsEarned ?? 0) > 0)
        lines.push(`🌟 Points earned: +${payload.pointsEarned}`)

    lines.push(``)
    lines.push(`Please confirm this order. Shukriya! 🙏`)

    return lines.join('\n')
}

/** Build a wa.me URL from an order payload */
export function buildWhatsAppURL(
    whatsappNumber: string,
    payload: WhatsAppPayload
): string {
    let clean = whatsappNumber.replace(/\D/g, '')
    if (clean.startsWith('0')) clean = '92' + clean.slice(1)
    const message = buildWhatsAppMessage(payload)
    return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`
}
