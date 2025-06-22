interface StoredImage {
  id: string
  file: File
  preview: string
  uploadedAt: Date
  generatedStickerUrl?: string
}

class ImageStore {
  private images = new Map<string, StoredImage>()

  storeImage(file: File, preview: string): string {
    const id = this.generateId()
    const storedImage: StoredImage = {
      id,
      file,
      preview,
      uploadedAt: new Date(),
    }

    this.images.set(id, storedImage)

    // Clean up old images (older than 1 hour)
    this.cleanup()

    return id
  }

  getImage(id: string): StoredImage | undefined {
    return this.images.get(id)
  }

  removeImage(id: string): boolean {
    return this.images.delete(id)
  }

  storeGeneratedSticker(id: string, imageUrl: string): void {
    const storedImage = this.images.get(id)
    if (storedImage) {
      storedImage.generatedStickerUrl = imageUrl
    }
  }

  private generateId(): string {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    )
  }

  private cleanup() {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    for (const [id, image] of this.images.entries()) {
      if (image.uploadedAt < oneHourAgo) {
        this.images.delete(id)
      }
    }
  }
}

// Export a singleton instance
export const imageStore = new ImageStore()
