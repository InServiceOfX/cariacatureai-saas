<script lang="ts">
  import { createEventDispatcher } from "svelte"
  import {
    validateImageFile,
    formatFileSize,
    createImagePreview,
  } from "../upload-utils"

  const dispatch = createEventDispatcher<{
    fileSelected: { file: File; preview: string }
    error: { message: string }
  }>()

  let fileInput: HTMLInputElement
  let isDragOver = false
  let isUploading = false

  function handleFileSelect(event: Event) {
    const target = event.target as HTMLInputElement
    const file = target.files?.[0]

    if (file) {
      processFile(file)
    }
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault()
    isDragOver = true
  }

  function handleDragLeave(event: DragEvent) {
    event.preventDefault()
    isDragOver = false
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault()
    isDragOver = false

    const files = event.dataTransfer?.files
    if (files && files.length > 0) {
      processFile(files[0])
    }
  }

  async function processFile(file: File) {
    isUploading = true

    try {
      // Validate file
      const validation = validateImageFile(file)
      if (!validation.isValid) {
        dispatch("error", { message: validation.error! })
        return
      }

      // Create preview
      const preview = await createImagePreview(file)

      // Dispatch success event
      dispatch("fileSelected", { file, preview })
    } catch (error) {
      dispatch("error", { message: "Failed to process image file" })
    } finally {
      isUploading = false
    }
  }

  function openFileDialog() {
    fileInput?.click()
  }
</script>

<div
  class="upload-container"
  class:drag-over={isDragOver}
  on:dragover={handleDragOver}
  on:dragleave={handleDragLeave}
  on:drop={handleDrop}
  role="button"
  tabindex="0"
  on:keydown={(e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      openFileDialog()
    }
  }}
>
  <input
    bind:this={fileInput}
    type="file"
    accept="image/*"
    on:change={handleFileSelect}
    style="display: none;"
  />

  <div class="upload-content">
    {#if isUploading}
      <div class="loading">
        <div class="spinner"></div>
        <p>Processing image...</p>
      </div>
    {:else}
      <div class="upload-icon">
        <svg
          width="64"
          height="64"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7,10 12,15 17,10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      </div>

      <h3 class="upload-title">Upload Your Image</h3>
      <p class="upload-description">
        Click to upload or drag and drop your image here
      </p>
      <p class="upload-requirements">
        Supports: JPEG, PNG, GIF, WebP, BMP, TIFF (Max: 10MB)
      </p>

      <button
        class="btn btn-primary btn-lg"
        on:click={openFileDialog}
        disabled={isUploading}
      >
        Click Here to Upload!
      </button>
    {/if}
  </div>
</div>

<style>
  .upload-container {
    border: 3px dashed #d1d5db;
    border-radius: 12px;
    padding: 3rem 2rem;
    text-align: center;
    transition: all 0.3s ease;
    background: #f9fafb;
    min-height: 300px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    outline: none;
  }

  .upload-container:hover {
    border-color: #3b82f6;
    background: #f0f9ff;
  }

  .upload-container.drag-over {
    border-color: #3b82f6;
    background: #eff6ff;
    transform: scale(1.02);
  }

  .upload-container:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .upload-content {
    max-width: 400px;
  }

  .upload-icon {
    color: #6b7280;
    margin-bottom: 1rem;
  }

  .upload-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 0.5rem;
  }

  .upload-description {
    color: #6b7280;
    margin-bottom: 0.5rem;
  }

  .upload-requirements {
    font-size: 0.875rem;
    color: #9ca3af;
    margin-bottom: 1.5rem;
  }

  .loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #e5e7eb;
    border-top: 4px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  .btn {
    font-weight: 600;
    padding: 0.75rem 2rem;
    border-radius: 8px;
    transition: all 0.2s ease;
  }

  .btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
</style>
