import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { ynsClient } from "../../../src/yns-client";
import { auth } from "../../../auth";

export async function POST(request: Request) {
	if (!process.env.STRIPE_SECRET_KEY) {
		console.error("Error: Missing STRIPE_SECRET_KEY");
		return NextResponse.json(
			{ error: "Missing STRIPE_SECRET_KEY environment variable" },
			{ status: 500 },
		);
	}

	try {
		const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
			// apiVersion: "2024-11-20.acacia", 
		});

		const cookieStore = await cookies();
		const cartId = cookieStore.get("cartId")?.value;
		console.log("Checkout request for cartId:", cartId);

		if (!cartId) {
			console.error("Error: No cartId in cookies");
			return NextResponse.json({ error: "Cart not found" }, { status: 400 });
		}

		// Retrieve cart from our in-memory store
		const cart = await ynsClient.cartGet({ cartId });
		console.log("Cart retrieved:", cart ? `ID: ${cart.id}, Items: ${cart.lineItems.length}` : "null");

		if (!cart || cart.lineItems.length === 0) {
			console.error("Error: Cart is empty or null");
			return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
		}

		// Map cart items to Stripe line items
		const lineItems = cart.lineItems.map((item) => {
			return {
				price_data: {
					currency: "usd",
					product_data: {
						name: item.productVariant.product.name,
						description: item.productVariant.product.summary,
						images: item.productVariant.images.length > 0 
                            ? item.productVariant.images 
                            : item.productVariant.product.images,
					},
					unit_amount: parseInt(item.productVariant.price), // Assuming price is in cents as string
				},
				quantity: item.quantity,
			};
		});

		const origin = request.headers.get("origin") || "http://localhost:3000";

		const session = await auth();
		const userId = session?.user?.id;

		// Create Stripe Session
		console.log("Creating Stripe session...");
		const stripeSession = await stripe.checkout.sessions.create({
			line_items: lineItems,
			mode: "payment",
			success_url: `${origin}/checkout/success`,
			cancel_url: `${origin}/`,
			metadata: {
				cartId: cart.id,
				...(userId && { userId }),
			},
			shipping_address_collection: {
				allowed_countries: ["US", "CA", "GB", "AU", "DE", "FR"], // Add more as needed
			},
		});
		console.log("Stripe session created:", stripeSession.url);

		return NextResponse.json({ url: stripeSession.url });
	} catch (err: any) {
		console.error("Stripe Checkout Error (Full):", err);
		return NextResponse.json(
			{ error: err.message || "Internal Server Error", details: String(err) },
			{ status: 500 },
		);
	}
}
