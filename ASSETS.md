# Asset provenance

All supermarket fixtures, shelving, checkout counters, trolley, plants, lighting and product meshes are original procedural geometry authored in this repository. No downloaded GLB, GLTF, branded product photography, stock photography or third-party textures are bundled.

- `src/game/World.jsx`: store geometry and canvas-generated signs.
- `src/game/ProductModel.jsx`: bottle, carton, can, bag, box, fruit, pump and roll geometry; canvas-generated packaging labels. Repeated facings use instanced meshes.
- `shared/artwork.js`, `scripts/product-images.js`, `public/products/`: original vector packaging illustrations for the 24 seed products; run `node scripts/product-images.js` to regenerate.
- `public/favicon.svg`: original SuuqVerse initial.
- UI icons: Lucide, ISC license, supplied by `lucide-react`.
- Runtime libraries retain their respective licenses in `node_modules` / package distributions.
- User-uploaded product images are supplied by the store administrator. The administrator must have rights to those images. They are stored in `data/uploads`, excluded from source control, and should be backed up on persistent storage.

The generated product visuals are stylized representations, not photographs of real commercial brands. Licensed models and photos can replace them in a later art pass without changing inventory IDs or shopping behavior.
