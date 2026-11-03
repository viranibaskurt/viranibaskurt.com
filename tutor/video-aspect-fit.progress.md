# video-aspect-fit — progress (append-only journal)
Challenge: video-aspect-fit — show the video with its true shape (no stretch) under the halftone
Continues: shades-of-halftone
Environment: WebGL 1 / GLSL ES 1.00, plain JS in webgl.js
Reference: none
Skill: /Users/srknvrnbskrt/.claude/skills/vshader-tutor/SKILL.md

## Protocol reminder (kept here so it survives compaction)
- Never write the shader; the user types every line. Climb the help ladder; code only if they explicitly ask.
- When making them investigate their own code, NEVER name the line or the variable — describe what the code does and let them find it.
- After every finished step: append an entry below → compact the conversation → re-read this whole file → continue.
- Teaching is build-up: each step is motivated by what the last couldn't do; decode every equation into purpose → picture.
- Define before use: never use a term before defining it in plain words. Terms already defined are logged in the Learning lines below (and in shades-of-halftone.progress.md).
- This challenge's files are all prefixed `video-aspect-fit.` — only ever touch these; never overwrite another challenge's files.
- If the protocol feels fuzzy after a compaction, re-read the SKILL.md at the path above.
- Output style: after every compaction, re-read /Users/srknvrnbskrt/.claude/output-styles/vshader-tutor.md and follow it for every reply (the user is dyslexic: short, easy to scan, visual).

## Journal
---
### Entry 1 — Step 1 "Tell the shader the video's size" — explaining (0 tries)
- Happened: Created challenge as a detour from shades-of-halftone (gooey step 12 is built in code: smooth min over 3×3, u_k slider, colour blend). Before this, in chat, I explained the cause: canvas 0–1 used as video 0–1 → 1080×1920 video stretched ~3.2× wide on a 16:9 window; listed cover vs contain and the JS wiring.
- Off at first: —
- Clicked when: —
- Learning: Terms defined: aspect ratio (width ÷ height), cover, contain (defined in chat before the challenge).
- About the user: See LEARNER_PROFILE.md: coordinate-space bookkeeping is the main weak spot; forgets JS wiring for new uniforms; numeric traces + one step per turn work best.
- Next: Teach step 1. Ask them to add the video-size uniform + JS wiring and prove it with a debug tint.
---
### Entry 2 — Step 1 "Tell the shader the video's size" — DONE (2 tries)
- Happened: User asked how to get the size in JS → told them videoWidth/videoHeight (px of the file; 0 before loadedmetadata), two options (listener vs every frame). They chose every frame: uniform2f in the render loop next to the other uniforms. Then declared the vec2 uniform in the shader. Skipped the red-tint debug test ("skip it").
- Off at first: forgot the shader-side declaration at first (JS only) — the known "wiring" gotcha, but in reverse.
- Clicked when: —
- Learning: Told them unused uniforms get removed by the compiler → no location → silent loss. Not verified on screen (test skipped); Step 3 will prove it anyway. Terms defined: videoWidth/videoHeight, loadedmetadata.
- About the user: Wants to move fast on plumbing; skips debug checks when the code looks right. Don't force tests for wiring; let the next visual step prove it.
- Next: Teach step 2: aspect of canvas vs video, one scale number. Numeric question with 1920×1080 window and 1080×1920 video.
---
### Entry 3 — Steps 2+3 "Compare shapes" + "Contain" — DONE (~7 tries)
- Happened: video aspect (fixed: comma instead of ÷, then divided by its own result). Canvas aspect: first used the old per-pixel value (pixel x ÷ pixel y) → fixed to screen width ÷ height. Compare = video ÷ canvas = 0.316 (stored as (0.316, 1)). Taught "shrink the picture = stretch the coordinates" (divide by 0.316 to read). Divided → right shape but anchored left; they flipped to multiply once, then back to divide. Taught pivot scaling (shift −0.5 → ÷ → +0.5), same pattern as rotation. Their line: (flipped uv + (−0.5, 0)) ÷ compare + (0.5, 0). Correct. Placed after the y-flip; fine because y scale is 1.
- Off at first: per-pixel ratio vs screen ratio (space confusion again); multiply vs divide direction; "uv should be scaled down" (picture vs coordinate inversion).
- Clicked when: numeric tables screen x → video x.
- Learning: Why skip y-shift: they said "width bigger than height" — partly right (that's why only x needs scaling); the real reason = y is ×1 so shift/scale/unshift on y is a no-op. Breaks when window is taller (in shape) than the video → step 5/6. Terms defined: pivot scaling (shift, scale, shift back), "shrink picture = stretch coordinates".
- About the user: Iterates quickly with "now?" — short one-issue checks with a trace table work. Sometimes asks me to edit ("put it back") but often does it before I can. Dead line still: the old rescale line (pixel × video aspect).
- Next: Step 4: outside 0–1 → empty dot.
---
### Entry 4 — Step 4 "Empty outside the video" — DONE (4 tries)
- Happened: Tries: (1) clamp the read position → same as the texture's clamp-to-edge, smear; (2) step tests ADDED → 2 inside, 1 outside; (3) multiplied → correct switch but applied to the POSITION (outside → 0 → reads left edge column); (4) applied to colour but stored a pair in one float (compile error). Final: pair of step tests (≥0 × <1), x part × y part → one number, colour × it. Correct. Asked "what else than step?" → if+compare, lessThan/greaterThan+any/all, one step on abs distance to 0.5, smoothstep for soft bar edges.
- Off at first: clamp vs mask; add vs multiply for AND; position vs colour target; vec2 vs float.
- Clicked when: trace tables per read x; "1×1=1, 1×0=0" for AND; "but then how to use it?" → two-line table build vs use.
- Learning: Solid: 0/1 switches combine by multiplying (AND); mask the result, not the coordinate. Terms defined: step (hard 0/1 switch), clamp (pin to nearest edge), AND via multiply, any/all.
- About the user: Asks for alternatives after solving — curiosity about the toolbox. "how to use X?" means they need the build vs use split spelled out.
- Next: Ask them to explain why the bars are black now (one line). Then Step 5 cover + toggle.
---
