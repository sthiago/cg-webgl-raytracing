// Utilitários
function radToDeg(r) { return r * 180 / Math.PI; }
function degToRad(d) { return d * Math.PI / 180; }

function gen_vertices(min, max, step=0.1) {
    const vertices = [];
    for (let i = min; i < max; i += step) {
        for (let j = min; j < max; j += step) {
            vertices.push(i, j, 0);
        }
    }
    return vertices;
}

function gen_colors(n) {
    const colors = [];
    for (let i = 0; i < n; i++) {
        for (const _ of [ 'R', 'G', 'B']) {
            colors.push(Math.random());
        }
    }
    return colors;
}

async function main()
{
    // Inicializa contexto WebGL2
    const canvas = document.querySelector("#canvas");
    const gl = canvas.getContext("webgl2");

    if (!gl) {
        alert("Sem suporte a WebGL 2.0");
        throw Error("Sem suporte a WebGL 2.0");
    }

    const program = initShaders(gl, "vs", "fs");

    // Configuração de atributos e uniforms
    const a_position = gl.getAttribLocation(program, "a_position");
    const a_color = gl.getAttribLocation(program, "a_color");
    const u_resolution = gl.getUniformLocation(program, "u_resolution");
    const u_pointsize = gl.getUniformLocation(program, "u_pointsize");

    const pointsize = 2.0;

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    // Carrega vértices no buffer
    const a_position_buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, a_position_buf);
    gl.enableVertexAttribArray(a_position);
    gl.vertexAttribPointer(a_position, 3, gl.FLOAT, false, 0, 0);

    const vertices = gen_vertices(-280, 280, pointsize);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    // Carrega cores no buffer
    const a_color_buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, a_color_buf);
    gl.enableVertexAttribArray(a_color);
    gl.vertexAttribPointer(a_color, 3, gl.FLOAT, false, 0, 0)
    const colors = gen_colors(vertices.length);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

    // Desenhar a cena
    // Configurações iniciais para desenhar a cena
    gl.clearColor(1, 1, 1, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(program);
    gl.bindVertexArray(vao);

    gl.uniform2f(u_resolution, gl.canvas.width, gl.canvas.height);
    gl.uniform1f(u_pointsize, pointsize);

    gl.drawArrays(gl.POINTS, 0, vertices.length/3);
}

main();
