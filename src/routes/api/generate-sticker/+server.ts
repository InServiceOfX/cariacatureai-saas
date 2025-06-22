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
  // Remove data URL prefix if present
  const base64Data = base64.replace(/^data:image\/[a-z]+;base64,/, "")

  try {
    const binaryString = atob(base64Data)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    return bytes
  } catch (error) {
    console.error("Base64 decoding error:", error)
    console.error("Base64 string length:", base64Data.length)
    console.error("Base64 string preview:", base64Data.substring(0, 100))
    throw new Error("Invalid base64 data")
  }
}

// Helper function to upload image to FAL AI storage
async function uploadImageToFAL(imageBuffer: Uint8Array): Promise<string> {
  try {
    console.log("Uploading image to FAL AI storage...")

    // Convert Uint8Array to File object
    const file = new File([imageBuffer], "image.png", { type: "image/png" })

    // Upload to FAL AI storage using the correct method
    const url = await fal.storage.upload(file)
    console.log("Image uploaded successfully:", url)

    return url
  } catch (error) {
    console.error("Failed to upload image to FAL AI:", error)
    throw new Error("Failed to upload image")
  }
}

export const POST: RequestHandler = async ({ request }) => {
  const startTime = Date.now()

  try {
    console.log("=== Starting sticker generation ===")

    const { imageBase64, imageId } = await request.json()

    if (!imageBase64 || !imageId) {
      console.error("Missing required data:", {
        imageBase64: !!imageBase64,
        imageId: !!imageId,
      })
      return json({ error: "Missing image data or image ID" }, { status: 400 })
    }

    console.log("Processing image...")
    console.log("Base64 data type:", typeof imageBase64)
    console.log("Base64 data length:", imageBase64.length)
    console.log("Base64 data preview:", imageBase64.substring(0, 100))

    // Convert base64 to Uint8Array
    const imageBuffer = base64ToUint8Array(imageBase64)

    // Validate image size
    if (!(await validateImageSize(imageBuffer))) {
      console.error("Image too large")
      return json({ error: "Image size exceeds 4MB limit" }, { status: 400 })
    }

    console.log("Starting image processing...")

    // Process image (resize if needed, maintain aspect ratio)
    const processedImage = await processImageForOpenAI(imageBuffer, 1024)

    console.log("Image processed successfully")

    // Upload the processed image to FAL AI storage
    const imageUrl = await uploadImageToFAL(processedImage.buffer)

    console.log("Calling FAL AI...")

    // Use the correct FAL AI subscribe method with the proper model name
    const result = await fal.subscribe("fal-ai/flux-pro/kontext", {
      input: {
        prompt:
          "A cute chibi-style cartoon sticker of a person, full upper body visible, clean lines, soft shading, white outlined sticker border, transparent background, joyful expression, kawaii style",
        image_url: imageUrl, // Use the uploaded image URL
        num_inference_steps: 20,
        guidance_scale: 7.5,
        num_images: 1,
        image_strength: 0.8,
        prompt_strength: 0.8,
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          update.logs.map((log) => log.message).forEach(console.log)
        }
      },
    })

    console.log("FAL AI response received")
    console.log("Request ID:", result.requestId)

    // Check for NSFW content
    if (
      result.data.has_nsfw_concepts &&
      result.data.has_nsfw_concepts.some(Boolean)
    ) {
      console.error("NSFW content detected")
      return json(
        {
          error:
            "Inappropriate content detected. Please try with a different image.",
          redirectToUpload: true,
        },
        { status: 400 },
      )
    }

    if (!result.data.images || result.data.images.length === 0) {
      console.error("No images generated")
      return json({ error: "Failed to generate sticker" }, { status: 500 })
    }

    const generatedImageUrl = result.data.images[0].url
    console.log("Successfully generated image:", generatedImageUrl)

    const endTime = Date.now()
    console.log(
      `=== Sticker generation completed in ${endTime - startTime} ms ===`,
    )

    return json({
      success: true,
      imageUrl: generatedImageUrl,
      prompt: result.data.prompt,
      seed: result.data.seed,
    })
  } catch (error) {
    const endTime = Date.now()
    console.error("=== Sticker generation failed ===")
    console.error("Error after", endTime - startTime, "ms:", error)
    console.error("Error name:", error.name)
    console.error("Error message:", error.message)
    console.error("Error stack:", error.stack)

    // Log more details for validation errors
    if (error.status === 422) {
      console.error("Validation error details:", error.body)
    }

    return json(
      {
        error: "Failed to generate sticker. Please try again.",
        redirectToUpload: false,
      },
      { status: 500 },
    )
  }
}

// Helper function to convert Uint8Array to base64
function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = ""
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}
