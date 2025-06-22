export interface UploadValidationResult {
  isValid: boolean
  error?: string
}

export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/bmp",
  "image/tiff",
]

export function validateImageFile(file: File): UploadValidationResult {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
    }
  }

  // Check file type
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      isValid: false,
      error:
        "Please upload a valid image file (JPEG, PNG, GIF, WebP, BMP, or TIFF)",
    }
  }

  return { isValid: true }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes"

  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

export function createImagePreview(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      if (e.target?.result) {
        resolve(e.target.result as string)
      } else {
        reject(new Error("Failed to read file"))
      }
    }

    reader.onerror = () => reject(new Error("Failed to read file"))
    reader.readAsDataURL(file)
  })
}

// New function for client-side image resizing
export function resizeImageForOpenAI(
  file: File,
  maxSize: number = 1024,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    const img = new Image()

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img

      if (width > maxSize || height > maxSize) {
        if (width > height) {
          height = Math.round((height * maxSize) / width)
          width = maxSize
        } else {
          width = Math.round((width * maxSize) / height)
          height = maxSize
        }
      }

      // Set canvas dimensions
      canvas.width = width
      canvas.height = height

      // Draw resized image
      ctx?.drawImage(img, 0, 0, width, height)

      // Convert to base64
      const resizedBase64 = canvas.toDataURL("image/png", 0.9)
      resolve(resizedBase64)
    }

    img.onerror = () => reject(new Error("Failed to load image"))
    img.src = URL.createObjectURL(file)
  })
}
