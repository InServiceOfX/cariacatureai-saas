<script lang="ts">
  import { onMount } from "svelte"

  // Array of image paths - update these with your actual image filenames
  const images = [
    "/images/front_carousel/image.png",
    "/images/front_carousel/imagefront0.png",
    "/images/front_carousel/imagefront1.PNG",
    "/images/front_carousel/imag2e.png",
    "/images/front_carousel/imagefront3.png",
  ]

  let currentIndex = 0
  let interval: number

  onMount(() => {
    // Start the carousel
    interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % images.length
    }, 3000) // Change image every 3 seconds

    return () => {
      if (interval) clearInterval(interval)
    }
  })
</script>

<div class="carousel-container">
  <div class="carousel-wrapper">
    {#each images as image, index}
      <img
        src={image}
        alt="Example {index + 1}"
        class="carousel-image"
        class:active={index === currentIndex}
        loading="lazy"
        width="290"
        height="290"
        decoding="async"
      />
    {/each}
  </div>

  <!-- Optional: Add dots indicator -->
  <div class="carousel-dots">
    {#each images as _, index}
      <button
        class="carousel-dot"
        class:active={index === currentIndex}
        on:click={() => (currentIndex = index)}
        aria-label="Go to image {index + 1}"
      />
    {/each}
  </div>
</div>

<style>
  .carousel-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 2rem;
  }

  .carousel-wrapper {
    position: relative;
    width: 290px;
    height: 290px;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
    background: white;
  }

  .carousel-image {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: opacity 0.3s ease-in-out;
    opacity: 0;
  }

  .carousel-image.active {
    opacity: 1;
  }

  .carousel-dots {
    display: flex;
    gap: 0.5rem;
    margin-top: 1rem;
  }

  .carousel-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    border: none;
    background-color: #d1d5db;
    cursor: pointer;
    transition: background-color 0.2s ease;
  }

  .carousel-dot.active {
    background-color: #8b5cf6;
  }

  .carousel-dot:hover {
    background-color: #a78bfa;
  }

  @media (max-width: 640px) {
    .carousel-wrapper {
      width: 250px;
      height: 250px;
    }
  }
</style>
