# metaball-halftone — progress (append-only journal)
Challenge: metaball-halftone — a 45° halftone screen whose dots, sized by tone, pull into each other like metaballs and leave round holes
Continues: metaball-variations (that challenge stopped mid-Step 3, segment bridges; it is left untouched and unfinished)
Environment: WebGL 1 / GLSL ES 1.00 — new file `shaders/metaball_halftone.frag`, wired through `webgl.js`
Reference: tutor/reference/metaball-halftone-target.png (target image) + tutor/reference/metaball-halftone.html (tutor's spoiler key: a working implementation; compare the user's code against its fragment shader when checking steps; never paste from it unless the user explicitly asks)
Skill: /Users/srknvrnbskrt/.claude/skills/vshader-tutor/SKILL.md

## Protocol reminder (kept here so it survives compaction)
- Never write the shader; the user types every line. Climb the help ladder; code only if they explicitly ask.
- No code expressions in explanations. Naming GLSL functions is fine for vocabulary; writing expressions to illustrate logic is not.
- When making them investigate their own code, NEVER name the line or the variable — describe what the code does and let them find it.
- One ask per turn.
- After every finished step: append an entry below → compact the conversation → re-read this whole file → continue.
- Teaching is build-up: each step is motivated by what the last couldn't do; decode every equation into purpose → picture.
- This challenge's files are all prefixed `metaball-halftone.` — only ever touch these; never overwrite `metaball-renderer.*` or `metaball-variations.*`.
- There IS a reference for this challenge, so checking = compare the user's code to the reference's fragment shader (in tutor/reference/metaball-halftone.html) and describe differences by what each piece does. Equivalent-but-different is fine; only real behaviour differences are bugs.
- If the protocol feels fuzzy after a compaction, re-read the SKILL.md at the path above.

## Background — how this challenge came about
The user shared a four-panel print, labelled (0) (6) (12) (24): a 45° halftone where dots sized by tone morph into each other like metaballs, with round holes in merged regions. In the same conversation (before tutoring), Claude built a working artifact of it without looking at the user's code. Version 1 used a smooth-min union of circle SDFs. The user pointed out two flaws: dots overlapped instead of morphing, and the gaps looked like "imploded squares". The user asked Claude to rethink the algorithm, not just patch it. Version 2, now the reference, uses a sum of Gaussian bumps per dot, each weighted to hit 1 at its tone radius: exp((r² − d²)/σ²). Ink goes where the sum ≥ 1, and edges are anti-aliased with the log-field gradient. Key insight to teach: a union of circles (or a smin fillet) leaves concave-arc gaps; a summed smooth field has a smooth minimum in the gap, whose contour is round. Tuned values (verified by an offline render): coarse preset ≈ cells 9, rMax 0.46, rMin 0.14, σ 0.42; classic ≈ cells 44, rMax 0.5, rMin 0.08, σ 0.14.

## Carried-forward user profile (from metaball-renderer + metaball-variations journals)
Experienced programmer; past beginner with shaders after two challenges. Implements fast, often ahead of prompts; also prepares things between sessions, like a live slider debug panel in webgl.js. Strongest tool: running real experiments and reading the picture, and hand-tracing concrete numbers through a formula once asked "what does this evaluate to for X". Recurring weak spot: coordinate-space bookkeeping when a value is transformed and transformed back (position→index→position, uv↔texture space, aspect-scaled vs not). The old renderer still measures distance in unscaled uv. Step 1 here deliberately attacks that. Sometimes ships correct code before they can say precisely why it works; a concrete "what number" question reveals whether they really understand. Has hit the "forgot the JS-side default / uniform wiring" gotcha several times. Likes to lock the plan into syllabus structure before diving in. Asks candid meta-questions ("do you already know the answer?"); answer them honestly. Already knows: per-cell grid math, neighbour loops with compile-time bounds, sampling a texture at the dot centre with a y-flip, mix for blending, an inverse-square metaball field, smoothstep thresholds, and point-to-segment distance.

## Journal
---
### Entry 1 — Setup — DONE (0 tries)
- Happened: The user asked to turn the metaball-halftone algorithm into a challenge to implement themselves. The existing metaball-variations challenge targets the same reference image with a different (segment-bridge) approach, stopped at Step 3. The user chose: a new challenge (continues metaball-variations) in a new file, shaders/metaball_halftone.frag, leaving metaball_renderer.frag and its segment experiment untouched. There is also an untracked shaders/halftone_dots.frag in the repo. It is a smin-based halftone with a staggered lattice, probably AI-generated earlier, not part of this challenge. Don't build on it or point the user at it. Saved the target image and reference implementation to tutor/reference/. Wrote the 9-step syllabus.
- Off at first: —
- Clicked when: —
- Learning: —
- About the user: See the carried-forward profile above.
- Next: Teach Step 1 "One space where a cell is one unit". Motivate it with their history of space mix-ups (the old renderer measured distance in stretched uv). Build the mental model: one unit = one cell in both x and y, the height spans u_cells, x is scaled by aspect, floor gives the cell, and the centre is the cell plus a half. They must also wire the new file into webgl.js (point the shader fetch at it, send u_cells). Ask them to describe the mapping before coding. Then check against the reference, which uses a centred square instead of the full canvas height; that difference is fine.
---
