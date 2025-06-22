import { json } from "@sveltejs/kit"
import type { RequestHandler } from "./$types"
import { fal } from "@fal-ai/client"
import { processImageForOpenAI, validateImageSize } from "$lib/image-processor"
import { FAL_KEY } from "$env/static/private"

// Configure FAL AI with your API key
fal.config({
  credentials: FAL_KEY,
})

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { imageBase64, imageId } = await request.json()

    if (!imageBase64 || !imageId) {
      return json({ error: "Image data and ID are required" }, { status: 400 })
    }

    // Convert base64 to buffer properly
    const base64Data = imageBase64.replace(/^data:image\/[a-z]+;base64,/, "")
    const originalBuffer = Buffer.from(base64Data, "base64")

    console.log("Original image size:", originalBuffer.length, "bytes")

    // Process and resize the image for FAL AI - ensure it's square
    const processedImage = await processImageForOpenAI(
      originalBuffer,
      1024, // maxSize
      true, // makeSquare = true
      "attention", // cropPosition = "attention" for subject detection
    )

    console.log("Processed image size:", processedImage.buffer.length, "bytes")
    console.log(
      "Processed dimensions:",
      processedImage.width,
      "x",
      processedImage.height,
    )

    // Validate the processed image size
    if (!(await validateImageSize(processedImage.buffer))) {
      return json(
        {
          error:
            "Image is still too large after processing. Please try a smaller image.",
        },
        { status: 400 },
      )
    }

    // Create a File object for FAL AI upload
    const imageFile = new File([processedImage.buffer], "image.png", {
      type: "image/png",
    })

    // Upload the image to FAL AI storage
    console.log("Uploading image to FAL AI storage...")
    const imageUrl = await fal.storage.upload(imageFile)
    console.log("Image uploaded to:", imageUrl)

    // Use FAL AI flux-pro/kontext model for image generation
    console.log("Generating sticker with FAL AI...")
    const result = await fal.subscribe("fal-ai/flux-pro/kontext", {
      input: {
        prompt:
          "Turn the uploaded image into a cute chibi-style cartoon sticker inspired by Guibly. Use soft pastel colors, clean black outlines, and a thick white border. The character(s) should have big eyes, rounded facial features, and joyful expressions. Keep the full upper body visible, in a friendly pose. Place everything on a light peach background and make sure it looks like a high-quality digital sticker",
        image_url: imageUrl,
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          update.logs.map((log) => log.message).forEach(console.log)
        }
      },
    })

    console.log("FAL AI result:", result.data)
    console.log("Request ID:", result.requestId)

    // Extract the generated image URL from the result
    const generatedImageUrl = result.data.images?.[0]?.url

    if (!generatedImageUrl) {
      throw new Error("Failed to generate image with FAL AI")
    }

    console.log("Successfully generated image:", generatedImageUrl)

    return json({
      success: true,
      generatedImageUrl, // This is now a direct URL from FAL AI
      imageId,
      message: "Sticker generated successfully",
    })
  } catch (error: any) {
    console.error("FAL AI error:", error)

    // Handle specific error types
    if (error.status === 401) {
      return json(
        {
          error: "Authentication failed. Please check your FAL AI API key.",
        },
        { status: 401 },
      )
    }

    if (error.message?.includes("too large")) {
      return json(
        {
          error:
            "Image is too large. Please try a smaller image or contact support.",
        },
        { status: 413 },
      )
    }

    if (error.message?.includes("invalid")) {
      return json(
        {
          error: "Invalid image format. Please use JPEG, PNG, or WebP format.",
        },
        { status: 400 },
      )
    }

    if (error.message?.includes("rate limit")) {
      return json(
        {
          error: "Rate limit exceeded. Please try again in a moment.",
        },
        { status: 429 },
      )
    }

    return json(
      {
        error: "Failed to generate sticker. Please try again.",
      },
      { status: 500 },
    )
  }
}
