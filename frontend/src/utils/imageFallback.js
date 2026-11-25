// When a remote photo fails to load (offline, blocked CDN), hide the broken
// image so the container's soft brand gradient shows instead of alt text.
export function handleImageFallback(event) {
  const img = event.currentTarget;
  img.classList.add("img-fallback");
  img.parentElement?.classList.add("has-img-fallback");
}
