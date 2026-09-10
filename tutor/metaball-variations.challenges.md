# metaball-variations — challenges
Challenge: metaball-variations — stylistic variations on the parametric metaball dot grid
Continues: metaball-renderer
Environment: WebGL 1 / GLSL ES 1.00
Reference: shaders/circles_POC.frag (still read-only, unrelated to these effects) + https://tr.pinterest.com/pin/151785449936276362/ for step 3 (not fetchable — get a description or screenshot from the user when that step starts)

## 1. Configurable dot and background color
- Motivation: `finalColor` is still flat `vec3(field)` grayscale — the field's brightness is the only thing on screen. `mix` (already used in metaball-renderer Step 5 to blend radius by brightness) can blend two colors by that same field value instead, which is what "dot color" and "background color" actually mean here.
- Challenge: Add two `uniform vec3` — a background color and a dot color. Use `field` as the blend factor between them instead of writing `field` straight into `finalColor`. Wire JS-side defaults (white dots on black, to match current behavior) before testing.
- Outcome: Same picture as before by default, but changing the two color uniforms changes the rendered colors live.

## 2. Row-parity horizontal shift
- Motivation: The grid is currently perfectly regular — every circle sits at its exact cell center. A constant per-row offset, alternating direction by row parity, turns the rigid grid into a brick-like/woven pattern — a purely positional effect, no new math primitive, just reusing the cell-index math already built.
- Challenge: For each circle, check whether its row index is odd or even. Shift the circle's center right if the row is odd, left if even, by some tunable fraction of a cell width.
- Outcome: Alternating rows visibly offset from each other, like a brick pattern. You can explain how a single per-row parity check turns into a per-circle position change.

## 3. Diagonal blend, no shading
- Motivation: metaball blending so far is radial (isotropic) — a circle's influence falls off equally in every direction, and the final threshold produces smooth grayscale transitions. The reference image shows the opposite: directional (diagonal) blending, and a flat/graphic look with no soft grayscale shading. This step's exact algorithm depends on what the reference actually shows, so it starts with describing it, not with code.
- Challenge: Get a clear description (or screenshot) of the reference image first. Then identify, in plain words, what's actually different from the current renderer: is it the field's directionality (favoring diagonal neighbors over radial distance), the final color decision (binary threshold instead of smoothstep band, "no shade"), or both. Implement whichever mechanism the reference actually calls for.
- Outcome: A variant of the pattern that reads as diagonally-blended and flat/graphic rather than radially-blended and soft-shaded, matching the reference's visual character.
