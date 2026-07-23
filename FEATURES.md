# Percu BrickMaster features

## Collection

- Add owned LEGO sets by Rebrickable set number.
- Add and remove wishlist sets.
- SQLite storage for sets, parts, inventories, wishlist entries, ownership counts, and notes.
- Rebrickable sync handles retry and rate-limit headers and excludes spare parts.
- Owned Sets use image-first cards with set number, year, part count, and owned quantity.

## Inventory and set details

- Inventory aggregates pieces by element ID and shows unique elements plus total owned pieces.
- Search by item number, description, or color.
- Sort collection views by item number, Design ID, description, or total owned.
- View Owned Sets and Wishlist sets in a full-page detail screen with characteristics, notes, quantity controls, and part totals.
- Open a part to see its image, color, element and design IDs, collection-wide total, and a breakdown by every owned set.
- Close any part or image modal with the Escape key.

## Wishlist and compatibility

- Wishlist completeness supports strict element matching and loose design/base-shape matching.
- Wishlist cards show strict and loose completion percentages.
- Wishlist pages show a combined unique-element and total-piece summary.
- Wishlist set parts show a red missing-count badge or a green completion check.
- Filter Wishlist set parts by all, missing, or completed parts.
- Mold-specific parts can be protected from normalization.
- Missing element IDs use `UnknownElement-{design_id}-{color_id}`.

## Images and local cache

- Part originals and 100 × 100 thumbnails are cached locally and lazy-loaded in the app.
- Set and part images are reused from the local cache when available, avoiding repeated downloads.
- Thumbnail cards open full-size cached images and set-specific part breakdowns.
