<script lang="ts">
  import { page } from "$app/stores"
  import { onMount } from "svelte"
  import { imageStore } from "$lib/image-store"
  import { WebsiteName } from "../../../config"

  let storedImage: any = null
  let generatedStickerUrl: string | null = null
  let countdown = 5
  let showSticker = false
  let timer: NodeJS.Timeout

  onMount(() => {
    const imageId = $page.url.searchParams.get("imageId")
    const stickerUrl = $page.url.searchParams.get("stickerUrl")
    
    if (imageId) {
      storedImage = imageStore.getImage(imageId)
    }
    
    if (stickerUrl) {
      generatedStickerUrl = decodeURIComponent(stickerUrl)
    }
    
    // Start countdown
    timer = setInterval(() => {
      countdown--
      if (countdown <= 0) {
        clearInterval(timer)
        showSticker = true
      }
    }, 1000)

    return () => {
      if (timer) clearInterval(timer)
    }
  })

  function formatTime(seconds: number): string {
    return seconds.toString()
  }
</script>

<svelte:head>
  <title>Payment Successful - {WebsiteName}</title>
  <meta name="description" content="Your payment was successful!" />
</svelte:head>

<div
  class="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 flex items-center justify-center"
>
  <div class="max-w-2xl mx-auto text-center p-8">
    <div class="bg-white rounded-2xl shadow-xl p-8">
      <div class="mb-6">
        <div
          class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
        >
          <svg
            class="w-8 h-8 text-green-600"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fill-rule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clip-rule="evenodd"
            />
          </svg>
        </div>

        <h1 class="text-3xl font-bold text-gray-900 mb-4">
          Payment Successful!
        </h1>

        {#if !showSticker}
          <p class="text-lg text-gray-600 mb-8">
            Thank you for your purchase! Your custom sticker is being prepared...
          </p>

          <!-- Countdown Section -->
          <div class="mb-8">
            <div class="text-6xl font-bold text-green-600 mb-4">
              {formatTime(countdown)}
            </div>
            <p class="text-gray-500">Preparing your sticker...</p>
          </div>
        {:else}
          <p class="text-lg text-gray-600 mb-8">
            Your custom sticker is ready! Here's your generated sticker:
          </p>
        {/if}
      </div>

      {#if storedImage}
        <div class="mb-8">
          <h3 class="text-lg font-semibold text-gray-900 mb-3">Your Original Photo</h3>
          <img
            src={storedImage.preview}
            alt="Your original photo"
            class="w-32 h-32 object-cover rounded-lg mx-auto border-2 border-gray-200"
          />
        </div>
      {/if}

      {#if showSticker && generatedStickerUrl}
        <!-- Generated Sticker Display -->
        <div class="mb-8">
          <h3 class="text-xl font-semibold text-gray-900 mb-4">Your Generated Sticker</h3>
          <div class="relative inline-block">
            <img
              src={generatedStickerUrl}
              alt="Your generated sticker"
              class="w-80 h-80 object-contain mx-auto border-2 border-gray-200 rounded-lg shadow-lg"
            />
          </div>
          
          <!-- Download Section -->
          <div class="mt-6 space-y-4">
            <div class="bg-green-50 rounded-lg p-4">
              <h3 class="font-semibold text-green-900 mb-2">Download Your Sticker</h3>
              <p class="text-sm text-green-800 mb-3">
                Right-click on the image above and select "Save image as..." to download your sticker.
              </p>
              <a 
                href={generatedStickerUrl} 
                download="my-custom-sticker.png"
                class="btn btn-primary btn-sm"
                target="_blank"
                rel="noopener noreferrer"
              >
                Download Sticker
              </a>
            </div>
          </div>
        </div>
      {/if}

      <div class="space-y-4">
        {#if !showSticker}
          <div class="bg-blue-50 rounded-lg p-4">
            <h3 class="font-semibold text-blue-900 mb-2">What's happening?</h3>
            <ul class="text-sm text-blue-800 space-y-1">
              <li>• Processing your uploaded image</li>
              <li>• Generating your custom sticker</li>
              <li>• Preparing for download</li>
            </ul>
          </div>
        {:else}
          <div class="bg-green-50 rounded-lg p-4">
            <h3 class="font-semibold text-green-900 mb-2">All Done!</h3>
            <ul class="text-sm text-green-800 space-y-1">
              <li>• Your sticker is ready for download</li>
              <li>• Use it in any messaging app</li>
              <li>• Share with friends and family</li>
            </ul>
          </div>
        {/if}

        <a href="/" class="btn btn-primary"> Create Another Sticker </a>
      </div>
    </div>
  </div>
</div>
