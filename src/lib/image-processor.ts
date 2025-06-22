export interface ProcessedImage {
  buffer: Uint8Array
  width: number
  height: number
  format: string
}

// Helper function to convert base64 to Uint8Array
function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes
}

// Helper function to convert Uint8Array to base64
function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = ""
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

export async function processImageForOpenAI(
  imageBuffer: Uint8Array,
  maxSize: number = 1024,
): Promise<ProcessedImage> {
  try {
    const originalSize = imageBuffer.length
    console.log(`Original image size: ${originalSize} bytes`)

    // If image is already under 4MB, just validate and return
    if (originalSize <= 4 * 1024 * 1024) {
      console.log("Image is already within acceptable size limits")
      return {
        buffer: imageBuffer,
        width: 0,
        height: 0,
        format: "png",
      }
    }

    // For larger images, we need to resize
    console.log(`Target max dimension: ${maxSize}`)

    // Convert Uint8Array to base64 safely
    const base64 = uint8ArrayToBase64(imageBuffer)
    const dataUrl = `data:image/jpeg;base64,${base64}`

    // Create image element using createImageBitmap for Cloudflare Workers
    const response = await fetch(dataUrl)
    const blob = await response.blob()
    const img = await createImageBitmap(blob)

    const originalWidth = img.width
    const originalHeight = img.height

    console.log(`Original dimensions: ${originalWidth} x ${originalHeight}`)

    // Calculate new dimensions while maintaining aspect ratio
    let newWidth = originalWidth
    let newHeight = originalHeight

    if (originalWidth > maxSize || originalHeight > maxSize) {
      if (originalWidth > originalHeight) {
        newWidth = maxSize
        newHeight = Math.round((originalHeight * maxSize) / originalWidth)
      } else {
        newHeight = maxSize
        newWidth = Math.round((originalWidth * maxSize) / originalHeight)
      }
    }

    console.log(`New dimensions: ${newWidth} x ${newHeight}`)

    // Create canvas
    const canvas = new OffscreenCanvas(newWidth, newHeight)
    const ctx = canvas.getContext("2d")

    if (!ctx) {
      throw new Error("Failed to get canvas context")
    }

    // Draw the resized image maintaining aspect ratio
    ctx.drawImage(
      img,
      0,
      0,
      originalWidth,
      originalHeight, // Source rectangle
      0,
      0,
      newWidth,
      newHeight, // Destination rectangle
    )

    // Convert canvas to blob with compression
    const processedBlob = await canvas.convertToBlob({
      type: "image/png",
      quality: 0.8,
    })

    // Convert blob to Uint8Array
    const arrayBuffer = await processedBlob.arrayBuffer()
    const processedBuffer = new Uint8Array(arrayBuffer)

    // If the processed image is still too large, reduce quality further
    if (processedBuffer.length > 4 * 1024 * 1024) {
      console.log("Image still too large, reducing quality further")

      const lowerQualityBlob = await canvas.convertToBlob({
        type: "image/jpeg",
        quality: 0.6,
      })

      const lowerQualityArrayBuffer = await lowerQualityBlob.arrayBuffer()
      const lowerQualityBuffer = new Uint8Array(lowerQualityArrayBuffer)

      console.log(`Final size: ${lowerQualityBuffer.length} bytes`)
      console.log(`Final dimensions: ${newWidth} x ${newHeight}`)

      return {
        buffer: lowerQualityBuffer,
        width: newWidth,
        height: newHeight,
        format: "jpeg",
      }
    }

    console.log(`Final size: ${processedBuffer.length} bytes`)
    console.log(`Final dimensions: ${newWidth} x ${newHeight}`)

    return {
      buffer: processedBuffer,
      width: newWidth,
      height: newHeight,
      format: "png",
    }
  } catch (error) {
    console.error("Image processing error:", error)
    throw new Error("Failed to process image")
  }
}

export async function validateImageSize(buffer: Uint8Array): Promise<boolean> {
  const maxSize = 4 * 1024 * 1024 // 4MB
  return buffer.length <= maxSize
}

// Helper function to check if image is too dark
export async function isImageTooDark(imageUrl: string): Promise<boolean> {
  try {
    const response = await fetch(imageUrl)
    const blob = await response.blob()
    const img = await createImageBitmap(blob)

    const canvas = new OffscreenCanvas(img.width, img.height)
    const ctx = canvas.getContext("2d")

    if (!ctx) return false

    ctx.drawImage(img, 0, 0)
    const imageData = ctx.getImageData(0, 0, img.width, img.height)
    const data = imageData.data

    let totalBrightness = 0
    const pixelCount = data.length / 4

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      const brightness = (r + g + b) / 3
      totalBrightness += brightness
    }

    const averageBrightness = totalBrightness / pixelCount
    console.log(`Average brightness: ${averageBrightness}`)

    // Consider image too dark if average brightness is less than 30
    return averageBrightness < 30
  } catch (error) {
    console.error("Error checking image brightness:", error)
    return false
  }
}
