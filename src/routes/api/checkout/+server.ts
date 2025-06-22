import { json } from "@sveltejs/kit"
import type { RequestHandler } from "./$types"
import Stripe from "stripe"
import { PRIVATE_STRIPE_API_KEY } from "$env/static/private"

const stripe = new Stripe(PRIVATE_STRIPE_API_KEY, {
  apiVersion: "2023-08-16",
})

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { imageId } = await request.json()

    if (!imageId) {
      return json({ error: "Image ID is required" }, { status: 400 })
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Custom Sticker",
              description:
                "High-quality digital sticker created from your image",
              images: [], // You could add a preview image here
            },
            unit_amount: 999, // $9.99 in cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${request.headers.get("origin")}/success?session_id={CHECKOUT_SESSION_ID}&imageId=${imageId}`,
      cancel_url: `${request.headers.get("origin")}/checkout?imageId=${imageId}`,
      metadata: {
        imageId: imageId,
      },
    })

    return json({ url: session.url })
  } catch (error) {
    console.error("Checkout error:", error)
    return json({ error: "Failed to create checkout session" }, { status: 500 })
  }
}
