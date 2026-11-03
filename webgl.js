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

function createVideoElement(src) {
    const video = document.createElement('video');
    video.src = src;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.autoplay = true;
    return video;
}

function createVideoTexture(gl) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 255, 255, 255]));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return texture;
}

function updateVideoTexture(gl, texture, video) {
    if (video.readyState < video.HAVE_CURRENT_DATA) return;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
}

const DEBUG = true;
const DEBUG_STORAGE_KEY = 'metaball-debug-params';

const DEFAULT_PARAMS = {
    speed: 1,
    dotCount: [100, 60],
    rMax: 5 * 0.00001,
    rMin: 2 * 0.00001,
    sumThresholdMin: 0.0,
    sumThresholdMax: 3.0,
    saturation: [0.5, 0.5, 0.5],
    backgroundColor: [0, 0, 0],
    dotColor: [1, 1, 1],
    cellSize:100,
    minDotSizeInCell:0.1,
    maxDotSizeInCell:0.5,
    k:40,
};

function loadParams() {
    const params = JSON.parse(JSON.stringify(DEFAULT_PARAMS));
    try {
        const saved = JSON.parse(localStorage.getItem(DEBUG_STORAGE_KEY));
        for (const key in params) {
            if (!saved || !(key in saved)) continue;
            if (Array.isArray(params[key])) {
                saved[key].forEach((v, i) => {
                    if (typeof v === 'number') params[key][i] = v;
                });
            } else if (typeof saved[key] === 'number') {
                params[key] = saved[key];
            }
        }
    } catch (e) {}
    return params;
}

function saveParams(params) {
    try {
        localStorage.setItem(DEBUG_STORAGE_KEY, JSON.stringify(params));
    } catch (e) {}
}

function createDebugPanel(params, playState) {
    const panel = document.createElement('div');
    panel.style.cssText = `
        position: fixed;
        top: 10px;
        left: 10px;
        z-index: 1000;
        background: rgba(0, 0, 0, 0.75);
        color: #fff;
        font: 12px monospace;
        border-radius: 6px;
        padding: 8px 10px;
        max-width: 260px;
        user-select: none;
    `;

    const header = document.createElement('div');
    header.textContent = '▾ debug';
    header.style.cssText = 'cursor: pointer; font-weight: bold; margin-bottom: 6px;';

    const content = document.createElement('div');

    const playPauseBtn = document.createElement('button');
    playPauseBtn.style.cssText = `
        display: block;
        width: 100%;
        cursor: pointer;
        background: #333;
        color: #fff;
        border: 1px solid #555;
        border-radius: 4px;
        padding: 3px 8px;
        font: 12px monospace;
        margin-bottom: 8px;
    `;
    function refreshPlayPauseBtn() {
        playPauseBtn.textContent = playState.playing ? '⏸ pause' : '▶ play';
    }
    playPauseBtn.addEventListener('click', () => {
        playState.playing = !playState.playing;
        refreshPlayPauseBtn();
    });
    refreshPlayPauseBtn();
    content.appendChild(playPauseBtn);

    addSlider('speed', 0, 3, 0.1, DEFAULT_PARAMS.speed,
        () => params.speed, v => { params.speed = v; }, { format: v => v.toFixed(1) + 'x' });

    header.addEventListener('click', () => {
        const collapsed = content.style.display === 'none';
        content.style.display = collapsed ? 'block' : 'none';
        header.textContent = (collapsed ? '▾' : '▸') + ' debug';
    });

    function addSlider(label, min, max, step, defaultValue, getValue, setValue, opts = {}) {
        const {
            format = v => v,
            toDisplay = v => v,
            fromDisplay = v => v,
        } = opts;

        const row = document.createElement('div');
        row.style.cssText = 'margin-bottom: 6px;';

        const labelRow = document.createElement('div');
        labelRow.style.cssText = 'display: flex; align-items: center; justify-content: space-between; gap: 8px;';
        const labelEl = document.createElement('span');
        labelEl.textContent = label;

        const valueGroup = document.createElement('span');
        valueGroup.style.cssText = 'display: flex; align-items: center; gap: 4px;';
        const valueEl = document.createElement('span');

        const revertBtn = document.createElement('span');
        revertBtn.textContent = '↺';
        revertBtn.title = 'Reset to default';
        revertBtn.style.cssText = 'cursor: pointer; visibility: hidden;';

        valueGroup.appendChild(valueEl);
        valueGroup.appendChild(revertBtn);
        labelRow.appendChild(labelEl);
        labelRow.appendChild(valueGroup);

        const input = document.createElement('input');
        input.type = 'range';
        input.min = min;
        input.max = max;
        input.step = step;

        function refresh() {
            const display = toDisplay(getValue());
            input.value = display;
            valueEl.textContent = format(display);
            revertBtn.style.visibility = getValue() !== defaultValue ? 'visible' : 'hidden';
        }

        input.addEventListener('input', () => {
            setValue(fromDisplay(parseFloat(input.value)));
            refresh();
            saveParams(params);
        });

        revertBtn.addEventListener('click', () => {
            setValue(defaultValue);
            refresh();
            saveParams(params);
        });

        refresh();

        row.appendChild(labelRow);
        row.appendChild(input);
        content.appendChild(row);
    }

    function addColorPicker(label, defaultValue, getValue, setValue) {
        const toHex = c => '#' + c.map(v => Math.round(v * 255).toString(16).padStart(2, '0')).join('');
        const fromHex = hex => [
            parseInt(hex.slice(1, 3), 16) / 255,
            parseInt(hex.slice(3, 5), 16) / 255,
            parseInt(hex.slice(5, 7), 16) / 255,
        ];

        const row = document.createElement('div');
        row.style.cssText = 'margin-bottom: 6px; display: flex; align-items: center; justify-content: space-between; gap: 8px;';

        const labelEl = document.createElement('span');
        labelEl.textContent = label;

        const controls = document.createElement('span');
        controls.style.cssText = 'display: flex; align-items: center; gap: 4px;';

        const input = document.createElement('input');
        input.type = 'color';
        input.style.cssText = 'width: 28px; height: 20px; padding: 0; border: none; background: none; cursor: pointer;';

        const revertBtn = document.createElement('span');
        revertBtn.textContent = '↺';
        revertBtn.title = 'Reset to default';
        revertBtn.style.cssText = 'cursor: pointer; visibility: hidden;';

        function refresh() {
            input.value = toHex(getValue());
            revertBtn.style.visibility = toHex(getValue()) !== toHex(defaultValue) ? 'visible' : 'hidden';
        }

        input.addEventListener('input', () => {
            setValue(fromHex(input.value));
            refresh();
            saveParams(params);
        });

        revertBtn.addEventListener('click', () => {
            setValue(defaultValue.slice());
            refresh();
            saveParams(params);
        });

        refresh();

        controls.appendChild(input);
        controls.appendChild(revertBtn);
        row.appendChild(labelEl);
        row.appendChild(controls);
        content.appendChild(row);
    }

    const scaledRadius = {
        toDisplay: v => Math.round(v / 0.00001),
        fromDisplay: v => v * 0.00001,
        format: v => Math.round(v),
    };

    addSlider('cellSize',0,200,1,DEFAULT_PARAMS.cellSize,
        ()=> params.cellSize,v=>{params.cellSize=v;}
    )
    addSlider('minDotSizeInCell',0,1,0.1,DEFAULT_PARAMS.minDotSizeInCell,
        ()=> params.minDotSizeInCell,v=>{params.minDotSizeInCell=v;}
    )
    addSlider('maxDotSizeInCell',0,1,0.1,DEFAULT_PARAMS.maxDotSizeInCell,
        ()=> params.maxDotSizeInCell,v=>{params.maxDotSizeInCell=v;}
    )
    addSlider('k',1,80,1,DEFAULT_PARAMS.k,
        ()=> params.k,v=>{params.k=v;}
    )


    // addSlider('dotCount.x', 0, 300, 1, DEFAULT_PARAMS.dotCount[0],
    //     () => params.dotCount[0], v => { params.dotCount[0] = v; });
    // addSlider('dotCount.y', 0, 300, 1, DEFAULT_PARAMS.dotCount[1],
    //     () => params.dotCount[1], v => { params.dotCount[1] = v; });
    // addSlider('rMax', 0, 100, 1, DEFAULT_PARAMS.rMax,
    //     () => params.rMax, v => { params.rMax = v; }, scaledRadius);
    // addSlider('rMin', 0, 100, 1, DEFAULT_PARAMS.rMin,
    //     () => params.rMin, v => { params.rMin = v; }, scaledRadius);
    // addSlider('sumThresholdMin', 0, 5, 0.01, DEFAULT_PARAMS.sumThresholdMin,
    //     () => params.sumThresholdMin, v => { params.sumThresholdMin = v; });
    // addSlider('sumThresholdMax', 0, 5, 0.01, DEFAULT_PARAMS.sumThresholdMax,
    //     () => params.sumThresholdMax, v => { params.sumThresholdMax = v; });
    // addSlider('saturation.r', 0, 1, 0.01, DEFAULT_PARAMS.saturation[0],
    //     () => params.saturation[0], v => { params.saturation[0] = v; });
    // addSlider('saturation.g', 0, 1, 0.01, DEFAULT_PARAMS.saturation[1],
    //     () => params.saturation[1], v => { params.saturation[1] = v; });
    // addSlider('saturation.b', 0, 1, 0.01, DEFAULT_PARAMS.saturation[2],
    //     () => params.saturation[2], v => { params.saturation[2] = v; });
    // addColorPicker('backgroundColor', DEFAULT_PARAMS.backgroundColor,
    //     () => params.backgroundColor, v => { params.backgroundColor = v; });
    // addColorPicker('dotColor', DEFAULT_PARAMS.dotColor,
    //     () => params.dotColor, v => { params.dotColor = v; });

    panel.appendChild(header);
    panel.appendChild(content);
    document.body.appendChild(panel);
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
        fetchShader('shaders/halftone.frag'),
        fetchShader('shaders/output.frag'),
    ]);

    const video = createVideoElement('IMG_0665_extracted.mp4');
    await video.play().catch(() => {});
    const videoTexture = createVideoTexture(gl);

    const circlesProgram = createProgram(gl, vertSrc, circlesSrc);
    const outputProgram = createProgram(gl, vertSrc, outputSrc);

    // Fullscreen quad
    const quadBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        -1, -1,  1, -1,  -1,  1,
        -1,  1,  1, -1,   1,  1,
    ]), gl.STATIC_DRAW);

    const params = loadParams();
    const playState = { playing: true };
    if (DEBUG) createDebugPanel(params, playState);

    let currentFBO = createFBO(gl, canvas.width, canvas.height);

    window.addEventListener('resize', () => {
        resize();
        currentFBO = createFBO(gl, canvas.width, canvas.height);
    });

    let animTime = 0;
    let lastTimestamp = null;
    let wasPlaying = playState.playing;

    function bindQuad(program) {
        const loc = gl.getAttribLocation(program, 'a_position');
        gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    }

    function render(now) {
        if (lastTimestamp === null) lastTimestamp = now;
        const dt = now - lastTimestamp;
        lastTimestamp = now;
        if (playState.playing) animTime += dt * params.speed;

        if (playState.playing !== wasPlaying) {
            wasPlaying = playState.playing;
            if (playState.playing) video.play().catch(() => {});
            else video.pause();
        }
        video.playbackRate = params.speed || 0.0625;

        const time = animTime / 1000;
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
        updateVideoTexture(gl, videoTexture, video);
        gl.uniform1i(gl.getUniformLocation(circlesProgram, 'u_videoFrame'), 1);
        
        gl.uniform2i(gl.getUniformLocation(circlesProgram,'u_dotCount'),params.dotCount[0],params.dotCount[1]);
        gl.uniform1f(gl.getUniformLocation(circlesProgram,'u_rMax'),params.rMax);
        gl.uniform1f(gl.getUniformLocation(circlesProgram,'u_rMin'),params.rMin);
        gl.uniform1f(gl.getUniformLocation(circlesProgram,'u_sumThresholdMin'),params.sumThresholdMin);
        gl.uniform1f(gl.getUniformLocation(circlesProgram,'u_sumThresholdMax'),params.sumThresholdMax);
        gl.uniform3f(gl.getUniformLocation(circlesProgram,'u_saturation'),params.saturation[0],params.saturation[1],params.saturation[2]);
        gl.uniform3f(gl.getUniformLocation(circlesProgram,'u_backgroundColor'),params.backgroundColor[0],params.backgroundColor[1],params.backgroundColor[2]);
        gl.uniform3f(gl.getUniformLocation(circlesProgram,'u_dotColor'),params.dotColor[0],params.dotColor[1],params.dotColor[2]);

        gl.uniform1f(gl.getUniformLocation(circlesProgram,'u_cellSize'),params.cellSize);
        gl.uniform1f(gl.getUniformLocation(circlesProgram,'u_maxDotSizeInCell'),params.maxDotSizeInCell);
        gl.uniform1f(gl.getUniformLocation(circlesProgram,'u_minDotSizeInCell'),params.minDotSizeInCell);
        gl.uniform1f(gl.getUniformLocation(circlesProgram,'u_k'),params.k);

        gl.uniform2f(gl.getUniformLocation(circlesProgram,'u_videoSize'),video.videoWidth,video.videoHeight);


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

    requestAnimationFrame(render);
}

main();
