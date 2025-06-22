export interface ProcessedImage {
  buffer: Buffer
  width: number
  height: number
  format: string
}

export type CropPosition =
  | "center"
  | "entropy"
  | "attention"
  | "north"
  | "south"
  | "east"
  | "west"
  | "northeast"
  | "northwest"
  | "southeast"
  | "southwest"

// Helper function to convert buffer to base64 safely
function bufferToBase64(buffer: Buffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ""
  const len = bytes.byteLength
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

export async function processImageForOpenAI(
  imageBuffer: Buffer,
  maxSize: number = 1024,
  makeSquare: boolean = true,
  cropPosition: CropPosition = "attention",
): Promise<ProcessedImage> {
  try {
    const originalSize = imageBuffer.length
    console.log(`Original image size: ${originalSize} bytes`)

    // If image is already under 4MB and reasonable size, just validate and return
    if (originalSize <= 4 * 1024 * 1024 && originalSize < 1024 * 1024) {
      console.log("Image is already within acceptable size limits")
      return {
        buffer: imageBuffer,
        width: 0, // We don't know the actual dimensions without processing
        height: 0,
        format: "png",
      }
    }

    // For larger images, we need to resize
    const squareSize = Math.min(maxSize, 1024)
    console.log(`Target square size: ${squareSize} x ${squareSize}`)

    // Convert buffer to base64 safely
    const base64 = bufferToBase64(imageBuffer)
    const dataUrl = `data:image/jpeg;base64,${base64}`

    // Create image element
    const img = new Image()

    // Create a promise to wait for image to load
    const imageLoaded = new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error("Failed to load image"))
    })

    img.src = dataUrl
    await imageLoaded

    const originalWidth = img.width
    const originalHeight = img.height

    console.log(`Original dimensions: ${originalWidth} x ${originalHeight}`)

    // Create canvas
    const canvas = new OffscreenCanvas(squareSize, squareSize)
    const ctx = canvas.getContext("2d")

    if (!ctx) {
      throw new Error("Failed to get canvas context")
    }

    // Calculate crop dimensions to maintain aspect ratio
    const aspectRatio = originalWidth / originalHeight
    let cropWidth, cropHeight, cropX, cropY

    if (aspectRatio > 1) {
      // Image is wider than tall
      cropHeight = originalHeight
      cropWidth = originalHeight // Make it square
      cropY = 0
      cropX = (originalWidth - cropWidth) / 2 // Center horizontally
    } else {
      // Image is taller than wide
      cropWidth = originalWidth
      cropHeight = originalWidth // Make it square
      cropX = 0
      cropY = (originalHeight - cropHeight) / 2 // Center vertically
    }

    // Draw the cropped and resized image
    ctx.drawImage(
      img,
      cropX,
      cropY,
      cropWidth,
      cropHeight, // Source rectangle
      0,
      0,
      squareSize,
      squareSize, // Destination rectangle
    )

    // Convert canvas to blob with compression
    const blob = await canvas.convertToBlob({
      type: "image/png",
      quality: 0.8,
    })

    // Convert blob to buffer
    const arrayBuffer = await blob.arrayBuffer()
    const processedBuffer = Buffer.from(arrayBuffer)

    let finalWidth = squareSize
    let finalHeight = squareSize

    // If the processed image is still too large, reduce size further
    if (processedBuffer.length > 4 * 1024 * 1024) {
      console.log("Image still too large, reducing size further")
      const scaleFactor = Math.sqrt((4 * 1024 * 1024) / processedBuffer.length)
      const newSize = Math.max(256, Math.round(squareSize * scaleFactor)) // Minimum 256px

      // Create new canvas with smaller size
      const smallCanvas = new OffscreenCanvas(newSize, newSize)
      const smallCtx = smallCanvas.getContext("2d")

      if (!smallCtx) {
        throw new Error("Failed to get canvas context")
      }

      // Draw the cropped and resized image at smaller size
      smallCtx.drawImage(
        img,
        cropX,
        cropY,
        cropWidth,
        cropHeight, // Source rectangle
        0,
        0,
        newSize,
        newSize, // Destination rectangle
      )

      // Convert to blob with lower quality
      const smallBlob = await smallCanvas.convertToBlob({
        type: "image/png",
        quality: 0.6,
      })

      const smallArrayBuffer = await smallBlob.arrayBuffer()
      const smallBuffer = Buffer.from(smallArrayBuffer)

      finalWidth = newSize
      finalHeight = newSize

      console.log(`Final size: ${smallBuffer.length} bytes`)
      console.log(`Final dimensions: ${finalWidth} x ${finalHeight}`)

      return {
        buffer: smallBuffer,
        width: finalWidth,
        height: finalHeight,
        format: "png",
      }
    }

    console.log(`Final size: ${processedBuffer.length} bytes`)
    console.log(`Final dimensions: ${finalWidth} x ${finalHeight}`)
    console.log(`Is square: ${finalWidth === finalHeight}`)

    return {
      buffer: processedBuffer,
      width: finalWidth,
      height: finalHeight,
      format: "png",
    }
  } catch (error) {
    console.error("Image processing error:", error)
    throw new Error("Failed to process image")
  }
}

export async function validateImageSize(buffer: Buffer): Promise<boolean> {
  // FAL AI has a 4MB limit for images
  const maxSize = 4 * 1024 * 1024 // 4MB
  return buffer.length <= maxSize
}
