# Learner profile — shaders / GLSL

Summary of three tutoring challenges (Oct 2026), written for future agents that teach or pair with this user on shader work. The original `tutor/` journals were deleted. This file is all that remains of them.

## Who they are

- Experienced programmer, comfortable with math. Started as a shader beginner and is now **solidly past beginner**.
- Main early struggle: reading dense shader math and seeing what each equation is *for* and what picture it makes.
- Learns by building from scratch. Wants to understand an effect, not just have it work. They refactor code themselves "to understand it".
- Works in WebGL 1 / GLSL ES 1.00, with plain JS in `webgl.js`. They built a live slider and colour-picker debug panel there on their own.

## What they've covered

| Challenge | File | Status |
|---|---|---|
| metaball-renderer: grid of metaballs, radius driven by video brightness | `shaders/metaball_renderer.frag` | **Done** (6 steps + performance detour) |
| metaball-variations: colours, row-parity shift, segment-distance bridges | same file | Steps 1–2 done. Step 3 (segment bridges) **abandoned mid-way** |
| metaball-halftone | — | **Cancelled** before Step 1 |
| shades-of-halftone: follows Heckel's "Shades of Halftone" (grid → luma dots → CMYK screens → cell walls → gooey → displaced) + bonus ink on paper | `shaders/halftone.frag` | **In progress** (see `tutor/shades-of-halftone.*`) |

**Concepts they own** (they've shown they can explain these, not only use them):
- UV normalisation and aspect-ratio correction, including *why* it works (per-pixel unit mismatch)
- Per-cell grid math: cell index, cell centre, the half-cell offset
- Inverse-square metaball field: summing it, thresholding it, why edge cells fuse less (fewer neighbours)
- `smoothstep` as a two-edge band. They know descending edges are **undefined** in GLSL ES 1.00 and fix it with `1.0 - smoothstep(lo, hi, x)`
- Neighbour-window loops instead of brute force. They know truncating a slowly decaying field causes seams, and that a smooth distance taper fixes it
- The difference between two smoothstep jobs: one shapes the *field* in space, the other maps an *already-computed* value to colour. A downstream threshold can't smooth a field that already jumps
- WebGL 1 rules: loop bounds must be compile-time constants (not uniforms). Uniforms have no in-shader defaults. `mod` needs floats (no implicit int→float)
- JS ↔ shader wiring: set uniforms *before* `drawArrays`, defaults come from JS-side `gl.uniform*` calls
- Texture sampling at the dot centre (not the pixel), with a y-flip for canvas-sourced textures, kept separate from aspect-scaled space
- `mix` as a 0..1 dial (radius by brightness, colour by field)
- Per-object vs per-observer keying: each neighbour's own row parity drives its own offset
- Point-to-line vs point-to-segment (capsule) distance: project, clamp to 0..1, walk from P1, measure. They learned this but haven't finished applying it

**Not yet covered** (planned in shades-of-halftone): fract-based grids in pixel units, luma, fwidth anti-aliasing, rotating a grid and rotating back to sample, moiré, CMYK and subtractive blending, smooth-min merging, displaced cells, noise for ink and paper.

## Strengths

- **Debugging by experiment.** Their most consistent strength. They change one constant, read the picture and describe it. This is how they found most of their own bugs.
- **Hand-tracing concrete numbers.** Asked "what does this evaluate to for X = 2?", they reliably find the bug: tautological gates, divide-by-zero, reversed vectors, a missing `+P1`.
- **Finds root causes and spec rules on their own.** Examples: the y-flip mismatch, compile-time loop bounds, descending smoothstep edges. They caught these before being told.
- **Reasons about emergent effects.** They explained edge-cell fusion and the wide-band halo without help, and connect findings across steps.
- **Decomposes a reference image.** They separated "geometrically different" (directional bridges) from "stylistically different" (hard vs soft edges) before any hints.
- **Plans before building.** They like to lock the technique and syllabus first.
- **Pushes back when right.** Example: "check the current version" when a diagnosis was stale.

## Weak points

- **Coordinate-space bookkeeping.** This is the recurring failure. It shows up when a value is transformed and transformed back (position → index → position, uv ↔ texture space, aspect-scaled vs not), or when one shared line silently covers both axes. Examples: a grid filling only part of the screen, the ratio applied twice (quadratic overshoot), centering lost after an x-only edit. They fix it fast once the mismatched pair is named, but the habit of asking "which space is this value in?" isn't automatic yet.
- **Code before explanation.** They often ship correct code before they can say precisely why it's right. A vague "done" or "looks fine" is not proof of understanding. Ask for a concrete number or an explicit before/after comparison.
- **First instinct is plausible but slightly off.** Example: "return infinity" when outside the segment. They get there with a trace.
- **Reading short vector math cold.** They miss convention errors (`P1 - Pt` vs `Pt - P1`) unless told to check direction.
- **Experiments sometimes change two variables at once.** This makes results ambiguous.
- **Self-checking.** "Looks fine" at first glance can hide subtle bugs that heavy falloff hides.
- **Recurring gotcha.** They forget the JS-side wiring or defaults for new uniforms.

## How to work with them

- They **type the shader themselves**. Don't write it unless they explicitly ask. Explain the theory, ask guiding questions, give plain-language algorithms. When pointing at a bug, describe *what the code does*, not the line or variable name.
- Motivate each step by what the previous one couldn't do. Decode equations into purpose, then picture.
- Plain language and concrete analogies land best, for example "blur kernel radius". Restated algebra lands worst.
- **Don't use step numbers** after context loss. Restate the concept in plain words.
- Answer meta-questions honestly ("do you already know the answer?"). Say whether you have a hunch or certainty.
- Interactive diagrams work well. They used the "Capsule Distance" artifact (https://claude.ai/code/artifact/2bb741dc-f8ba-48cf-baca-83583a46955e) while debugging.
- Don't assume "same as before" is the goal. They override specs deliberately, for example choosing white dots on black.
- They often build ahead between sessions. Read the actual code before trusting any plan.

## Suggested next focus

1. Make "which space is this value in, and what range does it span?" an explicit check on every transform. shades-of-halftone Steps 1, 7 and 9 (pixel-unit cells, rotate and rotate back) target this.
2. Build from a target *picture* with no reference code, to practise the "ask what you see" loop.
3. GLSL ES 1.00's other compile-time-only constraints (array sizes, `#define` constants).

## Cancelled metaball-halftone approach (kept for reference)

Target: a four-panel print (0/6/12/24) of a 45° halftone. Dots are sized by tone, merge like metaballs, and leave **round** holes in merged areas. Working approach: each dot gets a Gaussian bump `exp((r² − d²)/σ²)`, which equals 1 at its tone radius r. Sum the bumps over a 3×3 neighbourhood and ink where the sum ≥ 1. Anti-alias with the log-field gradient. Key insight: a union of circles (or a smooth-min fillet) leaves pinched concave gaps that look like "imploded squares". A *summed* smooth field has a smooth minimum in the gap, so its contour is round. Tuned values: coarse ≈ cells 9, rMax 0.46, rMin 0.14, σ 0.42. Classic ≈ cells 44, rMax 0.5, rMin 0.08, σ 0.14.
