import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "../../../../src/lib/prisma";
import { ynsClient } from "../../../../src/yns-client";
import { auth } from "../../../../auth";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-11-20.acacia", // Ensure this matches your Stripe Dashboard API version
});

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "Missing Stripe signature or webhook secret" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error: any) {
    console.error("Webhook signature verification failed.", error.message);
    return NextResponse.json({ error: `Webhook Error: ${error.message}` }, { status: 400 });
  }

  // Handle the event
  switch (event.type) {
    case "checkout.session.completed":
      const session = event.data.object as Stripe.Checkout.Session;

      if (!session.metadata?.cartId) {
        console.error("Checkout session missing cartId in metadata.", session);
        return NextResponse.json(
          { error: "Checkout session missing cartId in metadata" },
          { status: 400 }
        );
      }

      const cartId = session.metadata.cartId;
      const userId = session.metadata.userId; // Optionally stored from auth session

      // Retrieve cart from our in-memory store (or mock data)
      const cart = await ynsClient.cartGet({ cartId });

      if (!cart || cart.lineItems.length === 0) {
        console.error("Cart not found or empty for session", session);
        // Acknowledge event to Stripe even if cart is empty to prevent retries
        return NextResponse.json({ received: true }); 
      }

      try {
        const shipping = session.shipping_details;
        const address = shipping?.address;

        const order = await prisma.order.create({
          data: {
            userId: userId || null,
            stripeSessionId: session.id,
            amountTotal: session.amount_total || 0,
            currency: session.currency || "usd",
            status: "paid",
            
            // Save shipping info
            shippingName: shipping?.name,
            shippingAddressLine1: address?.line1,
            shippingAddressLine2: address?.line2,
            shippingCity: address?.city,
            shippingState: address?.state,
            shippingPostalCode: address?.postal_code,
            shippingCountry: address?.country,

            items: {
              create: cart.lineItems.map((item) => ({
                productId: item.productVariant.id,
                name: item.productVariant.product.name,
                price: parseInt(item.productVariant.price),
                quantity: item.quantity,
                image: item.productVariant.images[0] || item.productVariant.product.images[0] || null,
              })),
            },
          },
        });
        console.log("Order created:", order.id);

        // Optionally clear the cart after order creation (if using persistent cart)
        // For now, our mock cart clears on server restart.

      } catch (dbError: any) {
        console.error("Error creating order in database:", dbError);
        return NextResponse.json(
          { error: `Database error: ${dbError.message}` },
          { status: 500 }
        );
      }

      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
