Dev Panel split modules
-----------------------
Include in your HTML:
  <script src="./javascripts/astrocore.js"></script>
  <script type="module" src="./javascripts/dev/boot.js"></script>

Files:
  - state.js        : shared state and persistence
  - ui.js           : DOM helpers and minimise/restore
  - hips.js         : HiPS load logic
  - tap.js          : TAP loading and footprint helpers
  - catalogueManager.js : table rendering + per-row controls (Visible / Delete / Size by)
  - goto.js         : RA/Dec goTo wiring
  - boot.js         : entrypoint wiring everything

Adjust extractTapMetadataColumnNames() in catalogueManager.js if your TapMetadataList shape differs.
