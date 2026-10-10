# metaball-halftone — challenges
Challenge: metaball-halftone — a 45° halftone screen whose dots, sized by tone, pull into each other like metaballs and leave round holes
Continues: metaball-variations (replaces its segment-bridge approach, Steps 3–5, which stay unfinished there)
Environment: WebGL 1 / GLSL ES 1.00, built in a new file `shaders/metaball_halftone.frag`, wired through `webgl.js`
Reference: tutor/reference/metaball-halftone-target.png (the four-panel print: (0), (6), (12), (24)) + tutor/reference/metaball-halftone.html (working implementation — spoiler key for the tutor; the user should not open it unless they choose to)

## 1. One space where a cell is one unit
- Motivation: Every later step measures distances: pixel to dot centre, dot radius, edge width. Those numbers only mean something if they're all in the same space, and that space is round (not stretched by the canvas aspect). The old renderer mixed uv space and aspect-scaled space, and that caused bugs. Starting fresh, set up the one space everything will live in.
- Challenge: Create `shaders/metaball_halftone.frag` and point `webgl.js` at it. Map each pixel into a "cell space" where the canvas height spans `u_cells` units and x is scaled so that one unit is the same number of pixels both ways. Find the cell the pixel is in and draw one hard circle (radius about 0.35 cells) at that cell's centre.
- Outcome: A regular square grid of identical round dots. They stay round when the window is resized to any shape, and changing `u_cells` changes how many fit across the height.

## 2. Turn the screen 45°
- Motivation: The reference dots don't sit in rows and columns. They form a diagonal checkerboard, like a real print screen at 45°. The old renderer faked this with a half-cell shift on odd rows, which only works for that one angle. Rotating the space is the general tool: any screen angle, and the grid stays square.
- Challenge: Rotate the pixel's position by a `u_angle` uniform before you find its cell, so the grid itself turns. Rotate around the centre of the canvas, not its corner.
- Outcome: At 45° the dots form the diagonal checkerboard from the reference. Dragging the angle spins the whole grid smoothly around the screen centre, and the dots stay round.

## 3. Tone sets each dot's size
- Motivation: Identical dots carry no picture. In a halftone each dot's area carries the darkness of the image under it. The new twist versus the old renderer: the dot centre lives in *rotated* cell space, but the image lives in normal screen space, so the centre has to be rotated back before you sample.
- Challenge: For the pixel's own cell, take the dot centre back to screen uv (undo the cell scaling and the rotation), sample the image there, turn its brightness into darkness, and map darkness to a radius between `u_rMin` and `u_rMax` (in cell units). Then check the 3×3 neighbouring cells too, so a dot bigger than half a cell isn't clipped at the cell edge.
- Outcome: A classic halftone of the image, like panel (12): small dots in light areas, big dots in dark areas, the picture readable from a distance. When dots grow past half a cell they overlap as plain circles, which gives sharp pinched corners and squarish gaps. That ugliness is expected; it's what Steps 4–5 fix.

## 4. A bump whose edge sits exactly at r
- Motivation: Hard circles can only overlap. To merge they need a *field*: a smooth value that adds up between dots. Your old renderer used one over distance squared. That kernel has two problems: a lone dot's edge does not land at its radius `r`, and its tail reaches so far that you needed an 11×11 neighbour loop. A Gaussian bump fixes both: it dies off fast, and you can scale its height so the level-1 contour lands exactly at distance `r`.
- Challenge: Give each dot a Gaussian bump with width `u_sigma` (in cell units). Scale its height so the bump equals exactly 1 at distance `r` from the centre. For now keep the *largest* bump among the neighbours (not the sum) and ink every pixel where it is at least 1.
- Outcome: The picture looks identical to Step 3. That's the proof: every lone dot still has exactly the radius its tone asked for, whatever `u_sigma` is. You can explain why the height has to grow with `r`.

## 5. Sum the bumps — dots that reach for each other
- Motivation: Taking the largest bump is still just a union of circles. Adding the bumps together is what makes metaballs: between two dots both tails contribute, so the total passes 1 *before* the circles touch, and a neck grows. In the gap between four dots the total has a smooth low point, and a smooth low point's contour is round. That's where the reference's round holes come from.
- Challenge: Replace "keep the largest" with "add them all". Then explore `u_sigma`: find a small value that looks like Step 3 and a large one that looks like panel (0). Decide, from how fast the bump dies, when the 3×3 neighbourhood is no longer enough.
- Outcome: Dots morph into each other with liquid necks, and the gaps inside merged regions are round, not pinched squares. `u_sigma` works as a "merge reach" knob.

## 6. Blank dots must add nothing
- Motivation: In white areas the radius goes toward 0, but the Step 4 scaling still gives that dot a bump of height 1 at its centre. Summed with its neighbours, an "empty" dot still pushes ink into the area around it, so light regions get swollen dots and stray specks.
- Challenge: Make a dot's bump fade to nothing as its radius goes to 0, without changing how normal-sized dots look.
- Outcome: Pure white areas stay clean paper, and a lone small dot next to blank cells keeps its intended size.

## 7. Edges one pixel wide
- Motivation: Thresholding the field with a hard step gives jagged stair-step edges. A `smoothstep` band on the raw field gives soft edges of uneven width: the field changes slowly in some places and very fast in others. A clean edge needs the *distance to the edge in pixels*. The field gives that if you divide how far it is from the threshold by how fast it is changing (its gradient). Working with the log of the field makes this estimate behave well.
- Challenge: Inside the neighbour loop, also add up each bump times its offset vector; that sum gives you the field's gradient analytically, with no extra samples. Turn the log of the field and the length of its gradient into a signed distance, convert one pixel into cell units, and use `smoothstep` across about one pixel.
- Outcome: Crisp, evenly anti-aliased edges everywhere: on lone dots, necks and holes, at any `u_cells` and window size.

## 8. Ink on paper
- Motivation: The render is now a perfect vector shape, but the reference is a print. Its edges wobble a little, the ink has pinholes and mottling, and the paper has fibre. Now that you have a real distance in pixels, wobble is just noise added to that distance.
- Challenge: Add `u_ink` and `u_paper` colours. Perturb the edge distance by a few pixels of value noise (`u_rough`). Knock pinholes and mottling out of the ink (`u_grain`). Add a faint horizontal fibre to the paper (`u_paperTex`). Size all of this texture in screen pixels, not cell units, so it doesn't change when you change `u_cells`.
- Outcome: Something that reads as ink pressed into grey-blue paper, close to the reference image.

## 9. Match the four panels
- Motivation: You built every knob. Tuning them to hit known targets proves you understand what each one does.
- Challenge: Expose all the uniforms as sliders in `webgl.js`, then find settings that reproduce each panel of the reference: (0) coarse merged blobs, (6) a finer grid with chains, (12) a classic halftone with almost no merging, (24) a fine merged halftone. Write them down as presets.
- Outcome: Four presets, and for each one you can say which knobs made the difference and why.
