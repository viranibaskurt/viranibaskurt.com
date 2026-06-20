# Project Context

Personal website with three motivations:
1. **Learning shaders** — experimenting with GLSL and WebGL
2. **Displaying personal projects** — generative art, juggling, lost and found
3. **Blogging**

Plain static HTML/CSS/JS, no build tools, no bundlers, no npm. Structure is subject to change.

## Conventions

- No frameworks, no transpilation — vanilla ES6+ in the browser.
- Shaders use WebGL 1 / GLSL ES 1.00 (`precision highp float`, `texture2D`, `gl_FragColor`).
- Nav is injected via `nav.js` into every page using `document.body.prepend(nav)`.
