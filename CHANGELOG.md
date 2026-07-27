# Changelog

All notable changes to Percu BrickMaster are documented in this file.

The project follows the [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) format. Add changes to **Unreleased** during development, then move them into a versioned section when creating a GitHub release.

## [1.1.0] - 2026-07-27

### Added

- Owned Sets are now tracked as individual physical items, so duplicate copies keep separate part condition, spare-part, and deletion records.
- Per-set details for custom label, description, purchase date and place, price, storage location, notes, and category tags.
- Reusable category tags with existing-tag suggestions, visible tags on Owned Set cards, and category-aware search.
- Optional spare-part import when adding a set, plus spare sections and green spare-count indicators in Owned Set cards and detail views.
- Missing-piece totals and a red set-image badge in Owned Set details.
- Wishlist-only sorting by Strict or Loose completion percentage.

### Changed

- Owned Set detail pages use the available space for editable set details instead of a redundant individual-item status panel.
- Price accepts formatted currency values such as `€49.99` or `$49.99`.
- Wishlist removal now happens from the opened Wishlist Set with a confirmation dialog, matching the Owned Set workflow.
- Wishlist detail quantity is labelled “Quantity wanted.”
- Search help text now includes category tags, and the search control is wider.
- Collection filter and sort controls have aligned, stable desktop positioning.

## [1.0.2] - 2026-07-24

### Added

- Per-part ownership tracking for Owned Sets, including usable quantity, Missing/Broken condition, and optional notes.
- Missing-part counts and filters on the Owned Sets page and within an Owned Set.
- Missing-part indicators in Owned Set cards, part cards, Inventory breakdowns, and Owned Set part-location lists.
- In-app confirmation dialogs for Wishlist removal and reducing an Owned Set quantity.
- In-app error dialog for Rebrickable set-sync failures.
- Wishlist part modals now show the collection-wide total owned for the selected part.
- Docker support with a production-ready `Dockerfile` and `.dockerignore`.

### Changed

- Inventory, collection totals, and Wishlist completeness now use each part's actual usable quantity rather than assuming every owned set is complete.
- Inventory location lists are ordered by the highest owned quantity first.
- Part-location modals identify the currently opened Owned Set, move it to the top, highlight it, and show both set-specific and collection-wide totals.
- Search now supports Design ID in every part view.
- Rebrickable API errors now use clear status-specific messages for invalid requests, invalid API keys, access errors, missing sets, and throttling.

### Fixed

- Missing-part counts remain visible after partially restoring a part quantity.
- Missing-part warning badges no longer overlap required part quantities or Inventory totals.
- Owned Set missing-parts filtering remains stable after sorting and UI refreshes.
- Prevented modal observer loops that could make the interface unresponsive.

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
