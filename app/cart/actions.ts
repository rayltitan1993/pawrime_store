"use server";

import { cookies } from "next/headers";
import { ynsClient } from "../../src/yns-client";
import { revalidatePath } from "next/cache";

export async function getCart() {
	const cookieStore = await cookies();
	const cartId = cookieStore.get("cartId")?.value;

	if (!cartId) {
		return null;
	}

	try {
		return await ynsClient.cartGet({ cartId });
	} catch {
		return null;
	}
}

// Helper to convert Domain Cart to Input Lines for Upsert
function mapCartToLines(cart: any): { productVariantId: string; quantity: number }[] {
    if (!cart || !cart.lineItems) return [];
    return cart.lineItems.map((item: any) => ({
        productVariantId: item.productVariant.id,
        quantity: item.quantity
    }));
}

export async function addToCart(variantId: string, quantity = 1) {
	const cookieStore = await cookies();
	const cartId = cookieStore.get("cartId")?.value;

    let lines: { productVariantId: string; quantity: number }[] = [];
    
    if (cartId) {
        const currentCart = await ynsClient.cartGet({ cartId });
        if (currentCart) {
            lines = mapCartToLines(currentCart);
        }
    }

    const existingItemIndex = lines.findIndex(l => l.productVariantId === variantId);
    if (existingItemIndex > -1) {
        lines[existingItemIndex].quantity += quantity;
    } else {
        lines.push({ productVariantId: variantId, quantity });
    }

	const cart = await ynsClient.cartUpsert({
		cartId,
		lines,
	});

	if (!cart) {
		return { success: false, cart: null };
	}

    // Ensure cookie is set (important for first creation)
    if (!cartId || cartId !== cart.id) {
        cookieStore.set("cartId", cart.id, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 30, // 30 days
        });
    }

    revalidatePath("/", "layout");
	return { success: true, cart };
}

export async function removeFromCart(variantId: string) {
	const cookieStore = await cookies();
	const cartId = cookieStore.get("cartId")?.value;

	if (!cartId) {
		return { success: false, cart: null };
	}

	try {
        const currentCart = await ynsClient.cartGet({ cartId });
        if (!currentCart) return { success: false, cart: null };

        // Filter out the item to remove
        const lines = mapCartToLines(currentCart).filter(l => l.productVariantId !== variantId);

		const cart = await ynsClient.cartUpsert({
			cartId,
			lines,
		});

        revalidatePath("/", "layout");
		return { success: true, cart };
	} catch {
		return { success: false, cart: null };
	}
}

export async function setCartQuantity(variantId: string, quantity: number) {
	const cookieStore = await cookies();
	const cartId = cookieStore.get("cartId")?.value;

	if (!cartId) {
		return { success: false, cart: null };
	}

	try {
		const currentCart = await ynsClient.cartGet({ cartId });
        if (!currentCart) return { success: false, cart: null };

        let lines = mapCartToLines(currentCart);
        
        if (quantity <= 0) {
            // Remove item
            lines = lines.filter(l => l.productVariantId !== variantId);
        } else {
            // Update quantity
             const existingItemIndex = lines.findIndex(l => l.productVariantId === variantId);
             if (existingItemIndex > -1) {
                 lines[existingItemIndex].quantity = quantity;
             } else {
                 // Should theoretically not happen if setting quantity of existing item, but safe to add
                 lines.push({ productVariantId: variantId, quantity });
             }
        }

		const cart = await ynsClient.cartUpsert({ cartId, lines });
        revalidatePath("/", "layout");
		return { success: true, cart };
	} catch {
		return { success: false, cart: null };
	}
}