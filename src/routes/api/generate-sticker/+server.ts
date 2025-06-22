import { json } from "@sveltejs/kit"
import type { RequestHandler } from "./$types"
import { fal } from "@fal-ai/client"
import { processImageForOpenAI, validateImageSize } from "$lib/image-processor"
import { FAL_KEY } from "$env/static/private"

// Configure FAL AI with your API key
fal.config({
  credentials: FAL_KEY,
})

// Helper function to convert base64 to Uint8Array
function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes
}

export const POST: RequestHandler = async ({ request }) => {
  const startTime = Date.now()

  try {
    console.log("=== Starting sticker generation ===")

    const { imageBase64, imageId } = await request.json()

    if (!imageBase64 || !imageId) {
      console.error("Missing required data:", {
        hasImageBase64: !!imageBase64,
        hasImageId: !!imageId,
      })
      return json({ error: "Image data and ID are required" }, { status: 400 })
    }

    console.log("Processing request for imageId:", imageId)
    console.log("Image base64 length:", imageBase64.length)

    // Convert base64 to Uint8Array properly
    const base64Data = imageBase64.replace(/^data:image\/[a-z]+;base64,/, "")
    const originalBuffer = base64ToUint8Array(base64Data)

    console.log("Original image size:", originalBuffer.length, "bytes")

    // Validate original image size
    if (originalBuffer.length > 10 * 1024 * 1024) {
      // 10MB limit
      console.error("Image too large:", originalBuffer.length, "bytes")
      return json(
        { error: "Image is too large. Please use an image under 10MB." },
        { status: 413 },
      )
    }

    // Process and resize the image for FAL AI - ensure it's square
    console.log("Starting image processing...")
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
      console.error(
        "Processed image still too large:",
        processedImage.buffer.length,
        "bytes",
      )
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
    const uploadStart = Date.now()
    const imageUrl = await fal.storage.upload(imageFile)
    const uploadTime = Date.now() - uploadStart
    console.log("Image uploaded to:", imageUrl, "in", uploadTime, "ms")

    // Use FAL AI flux-pro/kontext model for image generation
    console.log("Generating sticker with FAL AI...")
    const generationStart = Date.now()
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

    const generationTime = Date.now() - generationStart
    console.log("FAL AI generation completed in", generationTime, "ms")
    console.log("FAL AI result:", result.data)
    console.log("Request ID:", result.requestId)

    // Extract the generated image URL from the result
    const generatedImageUrl = result.data.images?.[0]?.url

    if (!generatedImageUrl) {
      console.error("No generated image URL in result:", result.data)
      throw new Error(
        "Failed to generate image with FAL AI - no image URL returned",
      )
    }

    const totalTime = Date.now() - startTime
    console.log(
      "Successfully generated image:",
      generatedImageUrl,
      "in",
      totalTime,
      "ms",
    )
    console.log("=== Sticker generation completed successfully ===")

    return json({
      success: true,
      generatedImageUrl,
      imageId,
      message: "Sticker generated successfully",
      processingTime: totalTime,
    })
  } catch (error: any) {
    const totalTime = Date.now() - startTime
    console.error("=== Sticker generation failed ===")
    console.error("Error after", totalTime, "ms:", error)
    console.error("Error name:", error.name)
    console.error("Error message:", error.message)
    console.error("Error stack:", error.stack)

    // Handle specific error types
    if (error.status === 401) {
      console.error("FAL AI authentication failed")
      return json(
        {
          error: "Authentication failed. Please check your FAL AI API key.",
        },
        { status: 401 },
      )
    }

    if (error.message?.includes("too large")) {
      console.error("Image size error:", error.message)
      return json(
        {
          error:
            "Image is too large. Please try a smaller image or contact support.",
        },
        { status: 413 },
      )
    }

    if (error.message?.includes("invalid")) {
      console.error("Invalid image format:", error.message)
      return json(
        {
          error: "Invalid image format. Please use JPEG, PNG, or WebP format.",
        },
        { status: 400 },
      )
    }

    if (error.message?.includes("rate limit")) {
      console.error("Rate limit exceeded:", error.message)
      return json(
        {
          error: "Rate limit exceeded. Please try again in a moment.",
        },
        { status: 429 },
      )
    }

    // Log the full error for debugging
    console.error("Unhandled error type:", typeof error)
    console.error("Full error object:", JSON.stringify(error, null, 2))

    return json(
      {
        error: "Failed to generate sticker. Please try again.",
        debug:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 },
    )
  }
}
