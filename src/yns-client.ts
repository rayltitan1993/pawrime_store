// Mock data and client to replace commerce-kit/YNS API

export type Product = {
	id: string;
	slug: string;
	name: string;
	summary?: string;
	description?: string;
	images: string[];
	variants: Variant[];
};

export type VariantValue = {
	id: string;
	value: string;
	colorValue: string | null;
	variantType: {
		id: string;
		type: "string" | "color";
		label: string;
	};
};

export type VariantCombination = {
	variantValue: VariantValue;
};

export type Variant = {
	id: string;
	price: string;
	images: string[];
	combinations: VariantCombination[];
};

export type CartLineItem = {
	quantity: number;
	productVariant: Variant & { product: Product };
};

export type Cart = {
	id: string;
	lineItems: CartLineItem[];
};

const MOCK_PRODUCTS: Product[] = [
	{
		id: "p1",
		slug: "ceramic-vase",
		name: "Minimalist Ceramic Vase",
		summary: "Handcrafted ceramic vase with a matte finish. Perfect for dried flowers or as a standalone piece.",
		images: ["https://placehold.co/600x600/e2e8f0/1e293b?text=Ceramic+Vase", "https://placehold.co/600x600/cbd5e1/1e293b?text=Vase+Detail"],
		variants: [
			{
				id: "v1",
				price: "4500", // $45.00
				images: ["https://placehold.co/600x600/e2e8f0/1e293b?text=Ceramic+Vase"],
				combinations: [],
			},
		],
	},
	{
		id: "p2",
		slug: "leather-notebook",
		name: "Premium Leather Notebook",
		summary: "Full-grain leather notebook with 200 pages of premium paper. Ages beautifully with use.",
		images: ["https://placehold.co/600x600/78350f/fffbeb?text=Leather+Notebook", "https://placehold.co/600x600/92400e/fffbeb?text=Open+Notebook"],
		variants: [
			{
				id: "v2",
				price: "3200", // $32.00
				images: ["https://placehold.co/600x600/78350f/fffbeb?text=Leather+Notebook"],
				combinations: [],
			},
		],
	},
	{
		id: "p3",
		slug: "wireless-earbuds",
		name: "Pro Wireless Earbuds",
		summary: "High-fidelity audio with active noise cancellation and 24-hour battery life.",
		images: ["https://placehold.co/600x600/0f172a/f8fafc?text=Earbuds", "https://placehold.co/600x600/1e293b/f8fafc?text=Case"],
		variants: [
			{
				id: "v3",
				price: "12900", // $129.00
				images: ["https://placehold.co/600x600/0f172a/f8fafc?text=Earbuds"],
				combinations: [],
			},
		],
	},
	{
		id: "p4",
		slug: "smart-watch",
		name: "Series 5 Smart Watch",
		summary: "Track your fitness, health, and notifications with this sleek smart watch.",
		images: ["https://placehold.co/600x600/334155/f1f5f9?text=Smart+Watch", "https://placehold.co/600x600/475569/f1f5f9?text=Watch+Face"],
		variants: [
			{
				id: "v4",
				price: "29900", // $299.00
				images: ["https://placehold.co/600x600/334155/f1f5f9?text=Smart+Watch"],
				combinations: [],
			},
		],
	},
	{
		id: "p5",
		slug: "cotton-tshirt",
		name: "Organic Cotton T-Shirt",
		summary: "Soft, breathable, and sustainable. The perfect everyday tee.",
		images: ["https://placehold.co/600x600/f1f5f9/0f172a?text=T-Shirt", "https://placehold.co/600x600/e2e8f0/0f172a?text=Fabric+Detail"],
		variants: [
			{
				id: "v5",
				price: "2500", // $25.00
				images: ["https://placehold.co/600x600/f1f5f9/0f172a?text=T-Shirt"],
				combinations: [],
			},
		],
	},
	{
		id: "p6",
		slug: "water-bottle",
		name: "Insulated Water Bottle",
		summary: "Keeps drinks cold for 24 hours or hot for 12. Durable stainless steel construction.",
		images: ["https://placehold.co/600x600/0ea5e9/f0f9ff?text=Water+Bottle", "https://placehold.co/600x600/0284c7/f0f9ff?text=Cap+Detail"],
		variants: [
			{
				id: "v6",
				price: "2800", // $28.00
				images: ["https://placehold.co/600x600/0ea5e9/f0f9ff?text=Water+Bottle"],
				combinations: [],
			},
		],
	},
];

// In-memory store for carts (reset on server restart)
// Use globalThis to persist across module reloads in dev mode
const globalForCarts = globalThis as unknown as { carts: Map<string, Cart> };
const carts = globalForCarts.carts || new Map<string, Cart>();
if (process.env.NODE_ENV !== "production") globalForCarts.carts = carts;

class MockYnsProvider {
	async productBrowse({ active, limit }: { active?: boolean; limit?: number }) {
		return {
			data: MOCK_PRODUCTS.slice(0, limit || MOCK_PRODUCTS.length),
		};
	}

	async productGet({ idOrSlug }: { idOrSlug: string }) {
		return MOCK_PRODUCTS.find((p) => p.id === idOrSlug || p.slug === idOrSlug) || null;
	}

	async cartGet({ cartId }: { cartId: string }) {
		const cart = carts.get(cartId);
		console.log(`[MockYns] cartGet: ${cartId} -> ${cart ? "Found" : "Not Found"} (${cart?.lineItems.length || 0} items)`);
		return cart || null;
	}

	async cartUpsert({
		cartId,
		variantId,
		quantity,
	}: {
		cartId?: string;
		variantId: string;
		quantity: number;
	}) {
		const id = cartId || Math.random().toString(36).substring(7);
		let cart = carts.get(id);

		console.log(`[MockYns] cartUpsert: id=${id}, variant=${variantId}, qty=${quantity}`);

		if (!cart) {
			console.log(`[MockYns] Creating new cart: ${id}`);
			cart = { id, lineItems: [] };
			carts.set(id, cart);
		}

		// Find product variant
		const product = MOCK_PRODUCTS.find((p) => p.variants.some((v) => v.id === variantId));
		const variant = product?.variants.find((v) => v.id === variantId);

		if (!product || !variant) {
			throw new Error("Product variant not found");
		}

		const existingItemIndex = cart.lineItems.findIndex((item) => item.productVariant.id === variantId);

		if (quantity === 0) {
			// Remove item
			if (existingItemIndex > -1) {
				cart.lineItems.splice(existingItemIndex, 1);
			}
		} else {
			if (existingItemIndex > -1) {
				// Update quantity (additive)
				const newQuantity = cart.lineItems[existingItemIndex].quantity + quantity;
				if (newQuantity <= 0) {
					cart.lineItems.splice(existingItemIndex, 1);
				} else {
					cart.lineItems[existingItemIndex].quantity = newQuantity;
				}
			} else {
				// Add new item
				if (quantity > 0) {
					cart.lineItems.push({
						quantity,
						productVariant: {
							...variant,
							product: product,
						},
					});
				}
			}
		}

		return cart;
	}
}

export const ynsClient = new MockYnsProvider();