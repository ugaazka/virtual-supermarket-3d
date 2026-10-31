# SuuqVerse experience

The existing site used a blue catalog-first landing page, emoji cubes, a fixed-view 3D window, cart overlays and an embedded admin. The customer journey is now explicitly a full-viewport shopping simulation. The SuuqVerse name, catalog/cart/order operations and admin entry remain. No routes or external analytics were previously configured; administration uses `#admin` for a separate view.

Design read: an explorable neighborhood supermarket for everyday shoppers, with restrained retail signage and contextual game UI. Native React/CSS plus Three.js implements this aesthetic; it does not imitate a third-party design system. Design variance 4, motion intensity 3 (camera/input only), visual density 4. The frontend skill informs the customer shell; dashboard and form layout follow task needs.

- Deep market green is the single UI accent. The scene uses neutral metal shelving, pale tiled flooring, LED strips and department signage.
- The 3D world fills the customer viewport. No catalog homepage or decorative dashboard sits above it.
- Contextual inspection, a crosshair and a small controls strip explain interaction. The product list is an explicit alternative, also useful when WebGL is unavailable.
- Mouse capture is opt-in; drag-look works without capture, including mobile and HTTP LAN connections.
- Panels pause walking and release mouse capture. Dialogs trap focus, support Escape and restore focus. Native labels and visible focus outlines remain.
- CSS tokens support the system light/dark preference for HTML panels. The supermarket itself keeps retail lighting in both modes.
- Radii: 8px controls, 12-14px panels. Layers: scene 0, HUD 1, header 2, notices 3, dialogs 4, modal notifications 5.
- Mobile: no page scroll during gameplay, left joystick, drag-look on the remaining scene, touch inspection, full-width constrained panels. Reduced-motion settings disable decorative transitions; there are no perpetual UI animations.
- GPU strategy: repeated products are batched into instanced meshes per inventory record; label textures are shared per record. Ray targeting runs at ~11 Hz. DPR is capped, shadows and antialiasing reduced on touch devices. Administration loads on demand. All scene and artwork assets work without remote font/model fetches.
