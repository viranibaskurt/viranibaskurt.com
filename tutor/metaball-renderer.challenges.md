# metaball-renderer — challenges
Challenge: metaball-renderer — parametric grid of metaballs driven by video brightness
Continues: none
Environment: WebGL 1 / GLSL ES 1.00
Reference: shaders/circles_POC.frag (vibe-coded POC — read-only reference, do not modify)

## 1. The distance field — one hard circle
- Motivation: Every shader "draws" by asking one question per pixel: am I inside? The answer comes from measuring distance to a center point. This is the foundation everything else builds on.
- Challenge: In a new file `shaders/metaball_renderer.frag`, draw a single hard-edged white circle at the screen center. Radius roughly 20% of screen height.
- Outcome: A white disc on black. You can explain what number each pixel computes and how it decides which color to output.

## 2. Grid of hard circles
- Motivation: One circle is just geometry. The whole effect depends on a regular grid of them — but the cell math that places each center is subtle and worth owning before the metaball field complicates it.
- Challenge: Fill the screen with a uniform grid of hard circles. COUNT_X and COUNT_Y control the columns and rows.
- Outcome: A regular grid of dots. You can explain how any pixel finds its cell and its circle center.

## 3. The metaball potential field
- Motivation: Hard circles can't merge — each pixel is independently inside or outside. To get blobs that fuse, you need a field: a float that every circle contributes to, summed across neighbors. This is the core metaball idea.
- Challenge: Replace the hard-circle test with `radius / (distance * distance)` accumulated across neighboring cells, then threshold the sum at 1.0 with a hard step.
- Outcome: Circles that merge into a single blob when close. You can see the "neck" appear between touching circles and explain why.

## 4. Soft blending — smoothstep threshold
- Motivation: A hard step gives a sharp, aliased edge. `smoothstep` replaces it with a soft band whose width you control — that width is the "how much they blend" parameter.
- Challenge: Replace the hard step with `smoothstep`. Expose the band width as a named constant. Try wide vs. narrow.
- Outcome: Soft, gooey blobs. You can predict what widening or narrowing the band does before you try it.

## 5. Drive radius from image brightness
- Motivation: Uniform circles produce uniform blobs. The figure emerges when circle size comes from the image — dark areas grow large circles that fuse into solid shapes, bright areas shrink to near-invisible dots.
- Challenge: Add `uniform sampler2D u_texture`. Sample it at each circle's center (not the current pixel's position). Map brightness to radius: dark → RADIUS_MAX, bright → RADIUS_MIN.
- Outcome: The image visible as a dot-matrix metaball pattern. Dark regions fuse; bright regions dissolve.

## 6. Full parametrics
- Motivation: The shader works but the parameters are hardcoded. Moving them to uniforms turns it into the reusable renderer the goal describes.
- Challenge: Expose COUNT_X, COUNT_Y, RADIUS_MIN, RADIUS_MAX, blend width, dot color, and bg color as uniforms. Keep the neighbor loop range (±5) as a compile-time constant — WebGL 1 loop bounds must be compile-time values.
- Outcome: `shaders/metaball_renderer.frag` — clean, fully parametric, no magic numbers.
