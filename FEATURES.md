# Percu BrickMaster features

## Collection

- Add owned LEGO sets by Rebrickable set number and choose whether to import their spare parts.
- Each owned copy is stored separately, so duplicates can have their own assigned parts, condition, notes, and removal history.
- Add and remove wishlist sets; removal is confirmed from the opened Wishlist Set.
- SQLite storage for sets, parts, inventories, wishlist entries, individual owned-set copies, ownership counts, and notes.
- Rebrickable sync handles retry and rate-limit headers.
- Rebrickable errors are explained in-app with clear guidance for invalid keys, unavailable sets, access limits, and throttling.
- Owned Sets use image-first cards with set number, year, part count, owned quantity, category tags, missing-piece and spare-piece indicators.
- Remove actions and ownership decreases use in-app confirmation dialogs.
- Store per-copy custom labels, descriptions, purchase date and place, formatted price, storage location, notes, and reusable category tags.

## Inventory and set details

- Inventory aggregates standard and spare pieces by element ID and shows unique elements plus total owned pieces.
- Search by item number, Design ID, description, color, or category tag.
- Sort collection views by item number, Design ID, description, or total owned.
- View Owned Sets and Wishlist sets in a full-page detail screen with characteristics, notes, quantity controls, and part totals.
- Open a part to see its image, color, element and design IDs, collection-wide total, and a consolidated breakdown by every owned set.
- Part-location quantities distinguish the combined set quantity (`Qty`), owned standard quantity (`Total`), and included spare quantity (`Spare`), with spares identified in green.
- Part location lists are ordered by the largest owned quantity; in an Owned Set, the current set is highlighted and placed first.
- Track the usable quantity of every part in an Owned Set, mark unavailable pieces as Missing or Broken, and add optional notes.
- Missing and Broken pieces reduce usable ownership, show warning counts on Owned Set and part cards, and are included by missing-part filters.
- Owned Set details show missing totals and a red badge on the set image; imported spare pieces are separated from standard parts and marked in green.
- Inventory and part-location lists flag sets where a selected part is missing.
- Close any part or image modal with the Escape key.

## Wishlist and compatibility

- Wishlist completeness supports strict element matching and loose design/base-shape matching, with owned spare pieces available for both calculations.
- **Strict completion** counts only an exact LEGO element match, so the specific part variant and color must match the Wishlist requirement.
- **Loose completion** counts parts normalized to the same compatible base shape, allowing interchangeable variants or colors; parts marked as mold-specific remain restricted to their exact design.
- **Mold-specific** means a part variant has a physical shape, connection, fit, or functional difference that may make another version unsuitable. Protecting it from normalization requires the same Design ID for Loose completion instead of accepting any part in the broader base-shape group.
- Wishlist requirements remain limited to standard build-required pieces; optional spares do not increase the number of pieces needed.
- Wishlist cards show strict and loose completion percentages plus the number of pieces still missing for Strict completion.
- Sort Wishlist sets by Strict or Loose completion percentage.
- Wishlist pages show a combined unique-element and total-piece summary.
- Wishlist set parts show a red missing-count badge or a green completion check.
- Filter Wishlist set parts by all, missing, or completed parts.
- Mold-specific parts can be protected from normalization.
- Missing element IDs use `UnknownElement-{design_id}-{color_id}`.

## Images and local cache

- Part originals and 100 × 100 thumbnails are cached locally and lazy-loaded in the app.
- Set and part images are reused from the local cache when available, avoiding repeated downloads.
- Thumbnail cards open full-size cached images and set-specific part breakdowns.

## Container deployment

- A minimal multi-stage Docker image can build and run the application with persistent SQLite data and image-cache volumes.
