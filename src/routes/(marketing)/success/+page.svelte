<script lang="ts">
  import { page } from "$app/stores"
  import { onMount } from "svelte"
  import { imageStore } from "$lib/image-store"
  import { WebsiteName } from "../../../config"

  let storedImage: any = null

  onMount(() => {
    const imageId = $page.url.searchParams.get("imageId")
    if (imageId) {
      storedImage = imageStore.getImage(imageId)
    }
  })
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

        <p class="text-lg text-gray-600 mb-8">
          Thank you for your purchase! Your custom sticker is being processed
          and will be ready for download shortly.
        </p>
      </div>

      {#if storedImage}
        <div class="mb-8">
          <img
            src={storedImage.preview}
            alt="Your sticker"
            class="w-32 h-32 object-cover rounded-lg mx-auto border-2 border-gray-200"
          />
        </div>
      {/if}

      <div class="space-y-4">
        <div class="bg-blue-50 rounded-lg p-4">
          <h3 class="font-semibold text-blue-900 mb-2">What's Next?</h3>
          <ul class="text-sm text-blue-800 space-y-1">
            <li>• Your sticker will be processed within 24 hours</li>
            <li>• You'll receive an email with download instructions</li>
            <li>• Check your spam folder if you don't see the email</li>
          </ul>
        </div>

        <a href="/" class="btn btn-primary"> Create Another Sticker </a>
      </div>
    </div>
  </div>
</div>
