async function fetchShader(url) {
    const res = await fetch(url);
    return res.text();
}

function compileShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

function createProgram(gl, vertSrc, fragSrc) {
    const vert = compileShader(gl, gl.VERTEX_SHADER, vertSrc);
    const frag = compileShader(gl, gl.FRAGMENT_SHADER, fragSrc);
    const program = gl.createProgram();
    gl.attachShader(program, vert);
    gl.attachShader(program, frag);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Program link error:', gl.getProgramInfoLog(program));
        return null;
    }
    return program;
}

function createFBO(gl, width, height) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, null);

    return { fbo, texture };
}

function createTextTexture(gl, text) {
    const size = 1024;
    const offscreen = document.createElement('canvas');
    offscreen.width = size * 2;
    offscreen.height = size;
    const ctx = offscreen.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, offscreen.width, offscreen.height);
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `bold ${size * 0.26}px sans-serif`;
    ctx.fillText(text, offscreen.width / 2, offscreen.height / 2);

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, offscreen);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    return { texture, canvas: offscreen };
}

async function main() {
    const canvas = document.getElementById('glcanvas');
    const gl = canvas.getContext('webgl');
    if (!gl) { console.error('WebGL not supported'); return; }

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resize();

    const [vertSrc, circlesSrc, outputSrc] = await Promise.all([
        fetchShader('shaders/passthrough.vert'),
        fetchShader('shaders/circles.frag'),
        fetchShader('shaders/output.frag'),
    ]);

    const { texture: smileTexture } = createTextTexture(gl, 'COMING SOON');

    const circlesProgram = createProgram(gl, vertSrc, circlesSrc);
    const outputProgram = createProgram(gl, vertSrc, outputSrc);

    // Fullscreen quad
    const quadBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        -1, -1,  1, -1,  -1,  1,
        -1,  1,  1, -1,   1,  1,
    ]), gl.STATIC_DRAW);

    let currentFBO = createFBO(gl, canvas.width, canvas.height);

    window.addEventListener('resize', () => {
        resize();
        currentFBO = createFBO(gl, canvas.width, canvas.height);
    });

    const startTime = performance.now();

    function bindQuad(program) {
        const loc = gl.getAttribLocation(program, 'a_position');
        gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    }

    function render() {
        const time = (performance.now() - startTime) / 1000;
        const { fbo, texture } = currentFBO;
        const width = canvas.width;
        const height = canvas.height;

        // --- Pass 1: render circles into FBO ---
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.viewport(0, 0, width, height);
        gl.useProgram(circlesProgram);
        bindQuad(circlesProgram);
        gl.uniform1f(gl.getUniformLocation(circlesProgram, 'u_time'), time);
        gl.uniform2f(gl.getUniformLocation(circlesProgram, 'u_resolution'), width, height);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, smileTexture);
        gl.uniform1i(gl.getUniformLocation(circlesProgram, 'u_smile'), 1);
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        // --- Pass 2: render FBO texture to screen ---
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, width, height);
        gl.useProgram(outputProgram);
        bindQuad(outputProgram);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(gl.getUniformLocation(outputProgram, 'u_tex0'), 0);
        gl.uniform2f(gl.getUniformLocation(outputProgram, 'u_resolution'), width, height);
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        requestAnimationFrame(render);
    }

    render();
}

main();
