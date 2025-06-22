<script lang="ts">
  import { page } from "$app/stores"
  import { onMount } from "svelte"
  import { goto } from "$app/navigation"
  import { imageStore } from "$lib/image-store"
  import { WebsiteName } from "../../../config"

  let storedImage: any = null
  let timeLeft = 120 // 2 minutes in seconds
  let timer: NodeJS.Timeout
  let showOverlay = false
  let overlayTimeout: NodeJS.Timeout
  let countdownFinished = false

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

    // Start countdown timer
    timer = setInterval(() => {
      timeLeft--
      if (timeLeft <= 0) {
        clearInterval(timer)
        countdownFinished = true
        // Show the unlock overlay when countdown finishes
        showUnlockOverlay()
      }
    }, 1000)

    // Prevent right-click context menu
    const preventContextMenu = (e: MouseEvent) => {
      e.preventDefault()
      if (countdownFinished) {
        showUnlockOverlay()
      }
    }

    // Prevent keyboard shortcuts
    const preventKeyboardShortcuts = (e: KeyboardEvent) => {
      // Prevent Ctrl+C, Ctrl+S, Ctrl+A, F12, etc.
      if (
        (e.ctrlKey &&
          (e.key === "c" || e.key === "s" || e.key === "a" || e.key === "u")) ||
        e.key === "F12" ||
        e.key === "F5"
      ) {
        e.preventDefault()
        if (countdownFinished) {
          showUnlockOverlay()
        }
      }
    }

    // Prevent drag and drop
    const preventDrag = (e: DragEvent) => {
      e.preventDefault()
      if (countdownFinished) {
        showUnlockOverlay()
      }
    }

    // Add event listeners
    document.addEventListener("contextmenu", preventContextMenu)
    document.addEventListener("keydown", preventKeyboardShortcuts)
    document.addEventListener("dragstart", preventDrag)
    document.addEventListener("selectstart", (e) => e.preventDefault())

    return () => {
      if (timer) clearInterval(timer)
      if (overlayTimeout) clearTimeout(overlayTimeout)
      document.removeEventListener("contextmenu", preventContextMenu)
      document.removeEventListener("keydown", preventKeyboardShortcuts)
      document.removeEventListener("dragstart", preventDrag)
    }
  })

  function showUnlockOverlay() {
    if (!countdownFinished) return
    showOverlay = true
    if (overlayTimeout) clearTimeout(overlayTimeout)
    overlayTimeout = setTimeout(() => {
      showOverlay = false
    }, 5000) // Show overlay for 5 seconds
  }

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  function handleCheckout() {
    const imageId = $page.url.searchParams.get("imageId")
    if (imageId) {
      goto(`/checkout?imageId=${imageId}`)
    }
  }

  function handleStickerInteraction() {
    if (countdownFinished) {
      showUnlockOverlay()
    }
  }
</script>

<svelte:head>
  <title>Processing Your Sticker - {WebsiteName}</title>
  <meta name="description" content="Your sticker is being processed" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link
    href="https://fonts.googleapis.com/css2?family=Fredoka:wght@300;400;500;600;700&display=swap"
    rel="stylesheet"
  />
</svelte:head>

<div
  class="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center px-4"
>
  <div class="max-w-2xl mx-auto text-center p-8">
    {#if storedImage}
      <div class="bg-white rounded-2xl shadow-xl p-8 mb-8">
        <div class="mb-6">
          <img
            src={storedImage.preview}
            alt="Your uploaded image"
            class="w-32 h-32 object-cover rounded-full mx-auto border-4 border-purple-200"
          />
        </div>

        <h1 class="text-3xl font-bold text-gray-900 mb-4">
          Your Sticker is Ready!
        </h1>

        <p class="text-lg text-gray-600 mb-8">
          We've successfully generated your custom sticker. Complete your
          purchase to download it!
        </p>

        {#if storedImage.generatedStickerUrl}
          <div class="mb-8 relative">
            <!-- Protected Sticker Container -->
            <div
              class="relative inline-block cursor-pointer"
              on:click={handleStickerInteraction}
              on:mouseenter={handleStickerInteraction}
              on:touchstart={handleStickerInteraction}
            >
              <img
                src={storedImage.generatedStickerUrl}
                alt="Your generated sticker"
                class="w-48 h-48 object-contain mx-auto border-2 border-gray-200 rounded-lg select-none pointer-events-none"
                draggable="false"
                style="user-select: none; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none;"
              />

              <!-- Less Aggressive Overlay - Covers only 2/3 of the image -->
              <div class="absolute inset-0 pointer-events-none">
                <!-- Semi-transparent overlay covering bottom 2/3 -->
                <div
                  class="absolute bottom-0 left-0 right-0 h-2/3 bg-gradient-to-t from-black/40 to-transparent rounded-lg"
                ></div>

                <!-- Floating "Unlock" badge -->
                <div
                  class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                >
                  <span
                    class="relative z-10 inline-block px-4 py-2 bg-white rounded-lg text-black border-2 border-black transform -rotate-2 shadow-lg"
                    style="font-family: 'Fredoka', cursive; font-weight: 600; font-size: 0.875rem;"
                  >
                    unlock your<br />sticker now!
                  </span>
                </div>

                <!-- Lock Icon -->
                <div
                  class="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow-lg"
                >
                  🔒
                </div>
              </div>
            </div>

            <p class="text-sm text-gray-500 mt-2">
              Preview of your generated sticker - Click to unlock
            </p>
          </div>
        {/if}

        <div class="mb-8">
          <div class="text-6xl font-bold text-purple-600 mb-4">
            {formatTime(timeLeft)}
          </div>
          <p class="text-gray-500">Time remaining to secure your order</p>
        </div>

        <div class="flex gap-4 justify-center">
          <button class="btn btn-primary btn-lg" on:click={handleCheckout}>
            Pay Securely With Card
          </button>
        </div>
      </div>
    {:else}
      <div class="bg-white rounded-2xl shadow-xl p-8">
        <h1 class="text-2xl font-bold text-gray-900 mb-4">Image Not Found</h1>
        <p class="text-gray-600 mb-6">
          The uploaded image could not be found. Please try uploading again.
        </p>
        <a href="/" class="btn btn-primary"> Upload New Image </a>
      </div>
    {/if}
  </div>
</div>

<!-- Unlock Overlay - Only shows when countdown is finished -->
{#if showOverlay && countdownFinished}
  <div
    class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
  >
    <div class="bg-white rounded-2xl p-8 max-w-md mx-4 text-center shadow-2xl">
      <div class="text-6xl mb-4">🔒</div>
      <h2
        class="text-3xl font-bold text-purple-600 mb-4 unlock-text"
        style="font-family: 'Fredoka', cursive;"
      >
        Unlock your sticker now!
      </h2>
      <p class="text-gray-600 mb-6">
        Complete your purchase to download your custom sticker without any
        watermarks.
      </p>
      <button class="btn btn-primary btn-lg w-full" on:click={handleCheckout}>
        Pay Securely With Card
      </button>
    </div>
  </div>
{/if}

<style>
  .animate-spin {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  .unlock-text {
    background: linear-gradient(45deg, #8b5cf6, #ec4899);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  /* Prevent text selection */
  * {
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
  }

  /* Allow text selection for specific elements */
  p,
  h1,
  h2,
  h3,
  span,
  div {
    -webkit-user-select: text;
    -moz-user-select: text;
    -ms-user-select: text;
    user-select: text;
  }

  /* Prevent image dragging */
  img {
    -webkit-user-drag: none;
    -khtml-user-drag: none;
    -moz-user-drag: none;
    -o-user-drag: none;
    user-drag: none;
  }
</style>
