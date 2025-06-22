<script lang="ts">
  import { page } from "$app/stores"
  import { onMount } from "svelte"
  import { goto } from "$app/navigation"
  import { imageStore } from "$lib/image-store"
  import { WebsiteName } from "../../../config"

  let storedImage: any = null
  let isProcessing = false

  onMount(() => {
    const imageId = $page.url.searchParams.get("imageId")
    if (!imageId) {
      goto("/")
      return
    }

    storedImage = imageStore.getImage(imageId)
    if (!storedImage) {
      goto("/")
      return
    }
  })

  async function handleCheckout() {
    if (!storedImage) return

    isProcessing = true

    try {
      const imageId = $page.url.searchParams.get("imageId")
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageId: imageId,
        }),
      })

      if (response.ok) {
        const { url } = await response.json()
        window.location.href = url
      } else {
        throw new Error("Failed to create checkout session")
      }
    } catch (error) {
      console.error("Checkout error:", error)
      alert("Failed to process checkout. Please try again.")
    } finally {
      isProcessing = false
    }
  }
</script>

<svelte:head>
  <title>Complete Your Order - {WebsiteName}</title>
  <meta name="description" content="Complete your sticker order" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link
    href="https://fonts.googleapis.com/css2?family=Fredoka:wght@300;400;500;600;700&display=swap"
    rel="stylesheet"
  />
</svelte:head>

<div
  class="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 flex items-center justify-center"
>
  <div class="max-w-4xl mx-auto p-8">
    {#if storedImage}
      <div class="bg-white rounded-2xl shadow-xl p-8">
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-gray-900 mb-4">
            Complete Your Order
          </h1>
          <p class="text-lg text-gray-600">
            Your custom sticker is ready! Complete your purchase to receive your
            sticker.
          </p>
        </div>

        <!-- Image Comparison Section -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <!-- Original Image -->
          <div class="text-center">
            <h3 class="text-lg font-semibold text-gray-900 mb-3">
              Your Original Photo
            </h3>
            <div class="relative">
              <img
                src={storedImage.preview}
                alt="Your original photo"
                class="w-full h-64 object-cover rounded-lg border-2 border-gray-200"
              />
            </div>
          </div>

          <!-- Generated Sticker Preview -->
          <div class="text-center">
            <h3 class="text-lg font-semibold text-gray-900 mb-3">
              Your Generated Sticker
            </h3>
            <div class="relative inline-block">
              {#if storedImage.generatedStickerUrl}
                <img
                  src={storedImage.generatedStickerUrl}
                  alt="Your generated sticker preview"
                  class="w-64 h-64 object-contain mx-auto border-2 border-gray-200 rounded-lg"
                />

                <!-- Watermark Overlay -->
                <div
                  class="absolute inset-0 flex items-center justify-center pointer-events-none"
                >
                  <div
                    class="backdrop-blur-sm bg-white bg-opacity-30 rounded-lg w-full h-full flex items-center justify-center relative"
                  >
                    <!-- Watermark Text -->
                    <div
                      class="text-purple-600 text-lg font-bold transform -rotate-45 opacity-70 absolute inset-0 flex items-center justify-center"
                      style="font-family: 'Fredoka', cursive;"
                    >
                      PREVIEW
                    </div>

                    <!-- Lock Icon -->
                    <div
                      class="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow-lg"
                    >
                      🔒
                    </div>
                  </div>
                </div>
              {:else}
                <div
                  class="w-64 h-64 bg-gray-100 rounded-lg border-2 border-gray-200 flex items-center justify-center"
                >
                  <p class="text-gray-500">Sticker preview not available</p>
                </div>
              {/if}
            </div>
          </div>
        </div>

        <!-- Features Section -->
        <div
          class="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 mb-8"
        >
          <h3 class="text-xl font-semibold text-gray-900 mb-4 text-center">
            What You'll Get
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="flex items-start space-x-3">
              <div
                class="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mt-1"
              >
                <svg
                  class="w-4 h-4 text-white"
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
              <div>
                <h4 class="font-semibold text-gray-900">
                  High-quality sticker generation
                </h4>
                <p class="text-sm text-gray-600">
                  Professional AI-powered transformation
                </p>
              </div>
            </div>

            <div class="flex items-start space-x-3">
              <div
                class="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mt-1"
              >
                <svg
                  class="w-4 h-4 text-white"
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
              <div>
                <h4 class="font-semibold text-gray-900">
                  Perfect quality for all messaging apps
                </h4>
                <p class="text-sm text-gray-600">
                  Optimized for WhatsApp, Telegram, iMessage
                </p>
              </div>
            </div>

            <div class="flex items-start space-x-3">
              <div
                class="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mt-1"
              >
                <svg
                  class="w-4 h-4 text-white"
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
              <div>
                <h4 class="font-semibold text-gray-900">Perfect for sharing</h4>
                <p class="text-sm text-gray-600">
                  Multiple formats for any platform
                </p>
              </div>
            </div>

            <div class="flex items-start space-x-3">
              <div
                class="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mt-1"
              >
                <svg
                  class="w-4 h-4 text-white"
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
              <div>
                <h4 class="font-semibold text-gray-900">
                  A magical gift for friends & family
                </h4>
                <p class="text-sm text-gray-600">
                  Create personalized memories
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Instant Delivery Banner -->
        <div
          class="bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl p-4 mb-8 text-center"
        >
          <div class="flex items-center justify-center space-x-2 mb-2">
            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clip-rule="evenodd"
              />
            </svg>
            <span class="text-lg font-semibold">Instant delivery</span>
          </div>
          <p class="text-sm opacity-90">
            No more waiting - it's ready for you!
          </p>
        </div>

        <!-- Pricing Section -->
        <div class="bg-gray-50 rounded-lg p-6 mb-8">
          <div class="flex justify-between items-center">
            <div>
              <span class="text-lg font-semibold text-gray-900"
                >Custom Sticker Package</span
              >
              <p class="text-sm text-gray-600">
                High-quality digital sticker with instant download
              </p>
            </div>
            <span class="text-3xl font-bold text-green-600">$9.99</span>
          </div>
        </div>

        <div class="space-y-4">
          <button
            on:click={handleCheckout}
            disabled={isProcessing}
            class="btn btn-primary btn-lg w-full"
          >
            {#if isProcessing}
              <span class="loading loading-spinner"></span>
              Processing...
            {:else}
              Pay Securely With Card
            {/if}
          </button>

          <div
            class="flex items-center justify-center space-x-2 text-sm text-gray-500"
          >
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                clip-rule="evenodd"
              />
            </svg>
            <span>Secure payment powered by Stripe</span>
          </div>
        </div>
      </div>
    {:else}
      <div class="bg-white rounded-2xl shadow-xl p-8 text-center">
        <h1 class="text-2xl font-bold text-gray-900 mb-4">Order Not Found</h1>
        <p class="text-gray-600 mb-6">
          The order could not be found. Please try uploading your image again.
        </p>
        <a href="/" class="btn btn-primary"> Start Over </a>
      </div>
    {/if}
  </div>
</div>
