<script lang="ts">
  import ImageUpload from "$lib/components/ImageUpload.svelte"
  import { imageStore } from "$lib/image-store"
  import { resizeImageForOpenAI } from "$lib/upload-utils"
  import { goto } from "$app/navigation"
  import {
    WebsiteName,
    WebsiteBaseUrl,
    WebsiteDescription,
  } from "./../../config"

  let selectedFile: File | null = null
  let imagePreview: string | null = null
  let errorMessage: string | null = null
  let uploadStatus: "idle" | "uploading" | "generating" | "success" | "error" =
    "idle"
  let generatedStickerUrl: string | null = null

  function handleFileSelected(event: CustomEvent) {
    const { file, preview } = event.detail
    selectedFile = file
    imagePreview = preview
    errorMessage = null
    uploadStatus = "idle"
    generatedStickerUrl = null
  }

  function handleError(event: CustomEvent) {
    errorMessage = event.detail.message
    uploadStatus = "error"
  }

  async function handleUpload() {
    if (!selectedFile || !imagePreview) return

    uploadStatus = "uploading"
    errorMessage = null

    try {
      // Store the image in memory
      const imageId = imageStore.storeImage(selectedFile, imagePreview)

      // Resize image for FAL AI (client-side)
      uploadStatus = "generating"
      const resizedImage = await resizeImageForOpenAI(selectedFile, 1024)

      const response = await fetch("/api/generate-sticker", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageBase64: resizedImage,
          imageId: imageId,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to generate sticker")
      }

      if (result.success) {
        generatedStickerUrl = result.generatedImageUrl
        uploadStatus = "success"

        // Store the generated sticker URL in the image store
        imageStore.storeGeneratedSticker(imageId, result.generatedImageUrl)

        // Redirect to countdown page with the image ID
        await goto(`/countdown?imageId=${imageId}`)
      } else {
        throw new Error(result.error || "Failed to generate sticker")
      }
    } catch (error: any) {
      console.error("Upload error:", error)
      errorMessage =
        error.message || "Failed to process image. Please try again."
      uploadStatus = "error"
    }
  }

  function resetUpload() {
    selectedFile = null
    imagePreview = null
    errorMessage = null
    uploadStatus = "idle"
    generatedStickerUrl = null
  }
</script>

<svelte:head>
  <title>Generate Your Own Sticker Here!</title>
  <meta
    name="description"
    content="Send personalized, cute stickers of yourself, friends, and family."
  />
  <meta property="og:title" content="Turn Yourself Into a Sticker!" />
  <meta
    property="og:description"
    content="Send personalized, cute stickers of yourself, friends, and family."
  />
  <meta property="og:url" content={WebsiteBaseUrl} />
  <meta property="og:site_name" content={WebsiteName} />
  <meta property="og:locale" content="en_US" />
  <meta property="og:type" content="website" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="Turn Yourself Into a Sticker!" />
  <meta
    name="twitter:description"
    content="Send personalized, cute stickers of yourself, friends, and family."
  />
</svelte:head>

<div
  class="min-h-screen bg-gradient-to-br from-pink-50 to-purple-100 flex items-center justify-center px-4"
>
  <div class="max-w-2xl w-full text-center">
    <h1 class="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
      Generate Your Own Sticker Here!
    </h1>
    <p class="text-lg md:text-xl text-gray-600 mb-12">
      Send personalized, cute stickers of yourself, friends, and family.
    </p>

    {#if !selectedFile}
      <div class="upload-section">
        <ImageUpload
          on:fileSelected={handleFileSelected}
          on:error={handleError}
        />
      </div>
    {:else}
      <div class="upload-preview">
        <div class="preview-container">
          <img src={imagePreview} alt="Uploaded image" class="preview-image" />
          <div class="file-info">
            <p class="file-name">{selectedFile.name}</p>
            <p class="file-size">
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        </div>

        {#if errorMessage}
          <div class="alert alert-error mb-6">
            <span>{errorMessage}</span>
          </div>
        {/if}

        <div class="action-buttons">
          <button
            class="btn btn-primary btn-lg px-8"
            on:click={handleUpload}
            disabled={uploadStatus === "uploading" ||
              uploadStatus === "generating"}
          >
            {#if uploadStatus === "uploading"}
              <span class="loading loading-spinner"></span>
              Uploading...
            {:else if uploadStatus === "generating"}
              <span class="loading loading-spinner"></span>
              Generating Sticker...
            {:else}
              Create Sticker
            {/if}
          </button>

          <button
            class="btn btn-outline btn-lg px-8"
            on:click={resetUpload}
            disabled={uploadStatus === "uploading" ||
              uploadStatus === "generating"}
          >
            Choose Different Image
          </button>
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .upload-section {
    max-width: 500px;
    margin: 0 auto;
  }

  .upload-preview {
    max-width: 600px;
    margin: 0 auto;
  }

  .preview-container {
    background: white;
    border-radius: 16px;
    padding: 2rem;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
    margin-bottom: 2rem;
  }

  .preview-image {
    max-width: 100%;
    max-height: 300px;
    border-radius: 12px;
    margin-bottom: 1rem;
    object-fit: contain;
  }

  .file-info {
    text-align: center;
  }

  .file-name {
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 0.25rem;
  }

  .file-size {
    color: #6b7280;
    font-size: 0.875rem;
  }

  .action-buttons {
    display: flex;
    gap: 1rem;
    justify-content: center;
    flex-wrap: wrap;
  }

  .btn {
    min-width: 180px;
  }

  @media (max-width: 640px) {
    .action-buttons {
      flex-direction: column;
      align-items: center;
    }

    .btn {
      width: 100%;
      max-width: 300px;
    }
  }
</style>
