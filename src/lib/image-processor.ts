import sharp from "sharp"

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

export async function processImageForOpenAI(
  imageBuffer: Buffer,
  maxSize: number = 1024,
  makeSquare: boolean = true,
  cropPosition: CropPosition = "attention",
): Promise<ProcessedImage> {
  try {
    // Get image metadata
    const metadata = await sharp(imageBuffer).metadata()
    const originalSize = imageBuffer.length

    // Always make square for FAL AI
    const squareSize = Math.min(maxSize, 1024) // Ensure it's square and within limits

    console.log(`Original dimensions: ${metadata.width} x ${metadata.height}`)
    console.log(`Target square size: ${squareSize} x ${squareSize}`)

    // Process the image to be square
    let processedBuffer: Buffer
    let finalWidth = squareSize
    let finalHeight = squareSize

    // Always resize to square, regardless of original size
    processedBuffer = await sharp(imageBuffer)
      .resize(squareSize, squareSize, {
        fit: "cover", // This ensures it crops to square
        position: cropPosition, // Use attention for subject detection
        withoutEnlargement: false, // Allow enlargement if needed for square
      })
      .png({ compressionLevel: 9 })
      .toBuffer()

    // If the processed image is still too large, reduce quality
    if (processedBuffer.length > 4 * 1024 * 1024) {
      console.log("Image still too large, reducing size further")
      const scaleFactor = Math.sqrt((4 * 1024 * 1024) / processedBuffer.length)
      const newSize = Math.round(squareSize * scaleFactor)

      processedBuffer = await sharp(imageBuffer)
        .resize(newSize, newSize, {
          fit: "cover",
          position: cropPosition,
          withoutEnlargement: false,
        })
        .png({ compressionLevel: 9 })
        .toBuffer()

      finalWidth = newSize
      finalHeight = newSize
    }

    console.log(`Original size: ${originalSize} bytes`)
    console.log(`Final size: ${processedBuffer.length} bytes`)
    console.log(`Final dimensions: ${finalWidth} x ${finalHeight}`)
    console.log(`Crop position: ${cropPosition}`)
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
