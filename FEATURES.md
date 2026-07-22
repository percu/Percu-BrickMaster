# Percu BrickMaster features

## Collection

- Add owned LEGO sets by Rebrickable set number.
- Add and remove wishlist sets.
- SQLite storage for sets, parts, inventories, wishlist entries, ownership counts, and notes.
- Rebrickable sync handles rate limits and excludes spare parts.

## Inventory and set details

- Aggregate pieces by element ID or design ID.
- Search by item number, description, or color.
- Sort sets and parts by item number, description, or total owned.
- View an owned set in a full-page detail screen with notes and editable quantity.
- Open a part to see color, collection-wide total, and a breakdown by every owned set.

## Compatibility and images

- Wishlist completeness supports strict element matching and loose design/base-shape matching.
- Mold-specific parts can be protected from normalization.
- Missing element IDs use `UnknownElement-{design_id}-{color_id}`.
- Part originals and 100 × 100 thumbnails are cached locally and lazy-loaded in the app.
