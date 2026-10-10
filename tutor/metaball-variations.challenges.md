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

## 3. Neighbor bridging via segment distance — anchor at the home dot
- Motivation: Confirmed against the reference image (four growth stages, numbered 0/6/12/24): as dots grow, neighbors that get close enough don't melt into a round blob. Instead a straight, sharp-edged neck connects exactly two dot centers and widens with growth — never a radial halo. The current field can't produce that because each neighbor's contribution only measures the pixel's *distance to that neighbor's single center point* — a measurement that's the same in every direction by construction (radial/isotropic), so any two overlapping circles can only ever fuse into a rounded union. To draw a straight neck instead, the thing being measured has to change: not distance-to-a-point, but **distance to the line segment joining two specific dot centers**. A pixel near that segment (even far from either center) reads as "closer to a dot," which is exactly what paints a bridge instead of a halo.

  First attempt at this exposed a structural problem, not a formula bug: every cell visited in the neighbor loop was drawing its own segment to *its own* diagonal neighbors, independent of which dot actually sits under the pixel being shaded. That makes every cell in the whole falloff radius paint its own little bridge regardless of relevance to this pixel, which floods the canvas with a uniform crosshatch instead of showing clean isolated dots with occasional necks. The fix is conceptual before it's code: one end of every segment must always be the *home* dot — the one directly under this pixel (the zero-offset case already sitting in the loop) — and the other end is whichever neighbor is currently being visited. The home dot's own case (offset zero) becomes a zero-length segment, which collapses naturally to plain point distance — no special-casing needed, the same formula covers both.
- Challenge: Rewrite the segment construction so each visited neighbor's distance is measured to the segment from the *home cell's* center to that neighbor's center — not between two other cells that both shift together as the loop moves.
- Outcome: Dots with no nearby neighbor render as plain, isolated round shapes again (no stray crosshatch far from any real dot). Each segment drawn connects back to the home dot specifically.

## 4. Limiting which neighbors bridge
- Motivation: Anchoring every segment at the home dot (Step 3) fixes the structural flood, but the loop still visits a wide neighborhood (every cell within the falloff radius, ~11x11). If *all* of them still draw a segment back to the home dot, you get a dot with spokes radiating out toward dozens of neighbors in every direction — not the reference's look, where each dot only ever connects to its handful of immediately adjacent neighbors.
- Challenge: Decide which neighbor offsets should actually produce a bridging segment to the home dot (think about which directions count as "adjacent" on this grid) versus which should just keep contributing the way a distant cell already does (faded out by the existing falloff, or excluded entirely). Adjust the loop so only the chosen adjacent directions build a segment to the home dot.
- Outcome: Each dot connects via a straight neck only to its true immediate neighbors when they're close enough to touch; distant cells no longer draw spurious bridges toward the home dot.

## 5. Hard threshold, flat edges
- Motivation: Even with straight, correctly-anchored bridges, the current final threshold (`smoothstep`) still produces a soft gradient band wherever `field` crosses it — a blurred, anti-aliased edge that reads as "shaded." The reference has no such band anywhere: every edge, circle or bridge, is flat ink with a hard boundary.
- Challenge: Replace the smooth threshold used to turn `field` into the blend factor with a hard cutoff — the pixel is either fully background or fully dot past the threshold, with no graduated band in between.
- Outcome: A flat, graphic silhouette — sharp edges throughout, matching the reference's ink-like look, with the bridge network from Steps 3-4 now crisp instead of blurry.
