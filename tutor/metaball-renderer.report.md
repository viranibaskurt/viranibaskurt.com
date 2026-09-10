# metaball-renderer — final report

Challenge: parametric grid of metaballs driven by video brightness, built from scratch in `shaders/metaball_renderer.frag`, using the vibe-coded `circles_POC.frag` as a read-only reference.

All 6 syllabus steps are done. One off-syllabus detour (performance rewrite: brute-force grid → windowed neighbor loop) was also completed and understood. Dot/background color, the last piece of "full parametrics," was deliberately deferred into the next challenge rather than dropped — noted below.

## Level

Solidly past "beginner with shaders." You came in comfortable with programming and math, and by the end of this challenge you were independently catching real GLSL-spec constraints (compile-time loop bounds, `smoothstep` edge ordering) before being told about them, not just fixing bugs after they were pointed out. That's a meaningfully different level from where Step 1 started.

## Strengths

- **Distance fields and thresholding.** One-shot on Step 1: distance-to-center, compare to radius, `step` for a binary mask. Fully understood the aspect-ratio fix too — you derived *why* scaling one axis re-equalizes per-pixel units, not just applied the known trick.
- **Debugging by experiment.** From Step 2 onward, your default move when something looked wrong was to change one constant (`COUNT_X`, `R`, `NeighborEffect`) and read the resulting picture — this is exactly how you found the grid range bug, the seam bug, and the hard-line bug. This was your most consistent strength across the whole challenge.
- **Reading emergent effects.** Step 3: you correctly explained on your own why edge circles in a finite grid fuse less than interior ones (fewer neighbors summing in). Step 4: you connected that same edge effect to a new "halo" symptom from widening the smoothstep band, unprompted.
- **`smoothstep` as a real tool, not a black box.** You used it correctly as a two-edge blend in Step 4, then later caught yourself when you called it with descending edges (undefined behavior in the GLSL ES 1.00 spec) during the neighbor-taper work — a genuinely subtle spec detail, not a typo.
- **Root-causing without being walked to it.** Step 5's vertical-flip bug ("our bottom-left is 0,0 but for the texture it's 0,1") and Step 6's loop-bound constraint (uniforms can't drive `for` loop ranges, because WebGL 1 unrolls loops at compile time) were both things you worked out yourself, not things I had to name.
- **Knowing when to push back.** When my diagnosis of a reported console error turned out to be stale, you said so directly ("I see no problem, check the current version") — and you were right.

## Weak points

- **Coordinate-space bookkeeping under compounding.** This was the recurring failure mode, and it showed up at increasing difficulty: Step 2's grid only filled part of the screen because a cell-size formula used the wrong UV range; later, the neighbor-loop rewrite's cell-index formula mixed an aspect-corrected coordinate with a plain one on the same axis pair, which — because the same ratio got applied *twice* in a position→index→position round trip — produced a quadratic overshoot, not a linear one. Each individual instance you fixed fast once it was named, but it took the worked numeric example (Entry 7) for the compounding mechanism itself to land, not just the fix.
- **Verbalizing before code, not just after.** A few times (Step 2's cell-offset explanation, Step 6's "fix the js side" ask) the working code arrived before a precise verbal account of *why* it was right — the "what number does this actually evaluate to" nudge was needed to pin the explanation down even when the implementation was already correct.
- **Isolating variables under time pressure.** In the "hard line" investigation (Entries 8–9) you changed the threshold band *and* `NeighborEffect` in the same test — it happened to still be diagnosable, but it's worth flagging as a habit to watch, since it can make a real result ambiguous.

## Theory: the concepts that needed the most repetition

**Why loop bounds must be compile-time in WebGL 1.** A `for` loop in GLSL ES 1.00 has to be fully unrolled by the compiler before the program ever runs — there's no runtime loop counter on this hardware target the way there is on a CPU. That means the loop's start, end, and step all have to be values the compiler can resolve while compiling, which rules out anything that could change between draw calls — including uniforms. This is why `NeighborEffect` had to stay a `const` even after everything else around it became a `uniform`.

**Why doubling a scale factor compounds, not adds.** When a position gets converted to an index and then back to a position, and the same correction factor (here, the aspect `ratio`) gets applied at both steps instead of once, the result isn't "a bit more stretched" — it's stretched by the *square* of the factor. A `ratio = 2` case: multiply once, you're off by 2x; multiply again on the way back, you're off by 4x. That's why the broken grid didn't just extend past the edge, it collapsed into a compressed strip — past a certain point the doubly-scaled index was so far out of range that no valid circle was ever found there.

**Why a hard cutoff can't be fixed downstream by widening it.** The final `smoothstep(sumThresholdMin, sumThresholdMax, field)` only remaps a value that's *already been computed* — it can soften how that value maps to color, but it cannot invent smoothness in the underlying field if the field itself jumps sharply from one pixel to the next. That's why widening the threshold band didn't fix the hard line: the real fix had to change how smoothly the field *itself* varied in space (the neighbor-taper's fade-out radius), not how that field got colored afterward. Two different `smoothstep` calls, two different jobs — conflating them costs real debugging time.

## Focus next

- **Practice separating "which space is this value in" as an explicit habit**, especially any time a value gets transformed and then transformed back (position → index → position; UV → texture-space → UV). Before trusting a formula, ask what range each side actually spans, not just what it's named.
- **Try one shader from scratch with no POC/reference at all** — everything here had `circles_POC.frag` as ground truth to compare against. Building something with only a target *picture* in mind (no reference code) will exercise the "ask what you see" debugging loop instead of the "diff against reference" one, which is a different skill.
- **Read up on GLSL ES 1.00's other compile-time-only constructs** (array sizes, `#define`-based constants) — the loop-bound constraint you found is one instance of a broader "this GPU target needs static shapes" theme that will keep showing up.

## What's next

Three new items are queued as the next challenge (continuing this one): a row-parity offset on the dot grid, a diagonal no-shading blend effect (referencing an external image), and the deferred dot/background color uniforms. See `tutor/metaball-variations.challenges.md`.
