# Changelog

All notable changes to Percu BrickMaster are documented in this file.

The project follows the [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) format. Add changes to **Unreleased** during development, then move them into a versioned section when creating a GitHub release.

## [Unreleased]

## [1.0.1] - 2026-07-23

### Added

- Design ID as an Inventory sort option.
- Wishlist missing-part badges: red count when parts are missing, green check when complete.
- Search and sort controls for sets and parts.
- Full-page set detail screens with notes, quantity controls, inventory totals, and per-part collection breakdowns.
- Local image cache, thumbnails, and Rebrickable rate-limit-aware synchronization.
- `README.md` and `FEATURES.md` project documentation.
- A release-oriented `CHANGELOG.md`.
- Wishlist-wide required-piece summary and set-detail inventory filtering for all, missing, or completed parts.
- Escape-key support for every modal.
- Local disk image caching with lazy-loaded thumbnails and full-size part previews.

### Changed

- Inventory now uses a single element-based view; the Group by control is hidden.
- Owned Set and Wishlist cards use a consistent image-first layout.
- Wishlist completion scores use a dedicated, non-overlapping metadata row.
- Rebrickable spare parts are excluded from new set imports.
- Inventory summary now shows unique elements and total owned pieces in the same compact inventory format used in set details.
- Wishlist set details retain Wishlist navigation context and include matching color information in part modals.
- README setup instructions now use Bash and include cloning the public repository.

### Fixed

- Inventory part modal totals are derived from the displayed set breakdown.
- Item-number, Design ID, and total-owned sorting reapplies after Inventory and set-part cards render.
- Wishlist total-owned sorting and completion-score layout.
- Synthetic element IDs now correctly retain their color, Design ID, and missing-part status.
- Part-card color and missing-count labels remain correct after sorting.

## [1.0.0] - 2026-07-23

### Added

- Initial public release of Percu BrickMaster.
- SQLite-backed LEGO collection, inventory, wishlist, and compatibility calculator.
- Strict element matching and loose design/base-shape matching.
