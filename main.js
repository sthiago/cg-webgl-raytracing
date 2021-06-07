// Utilitários
function radToDeg(r) { return r * 180 / Math.PI; }
function degToRad(d) { return d * Math.PI / 180; }
function rand_range(min, max) { return Math.random() * (max - min) + min; }


function gen_vertices(min, max, step=0.1) {
    const vertices = [];
    for (let i = min; i < max; i += step) {
        for (let j = min; j < max; j += step) {
            vertices.push(i, j);
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


function gen_esfera(xmin, xmax, ymin, ymax, zmin, zmax, rmin, rmax) {
    return {
        xc: rand_range(xmin, xmax),
        yc: rand_range(ymin, ymax),
        zc: rand_range(zmin, zmax),
        r: rand_range(rmin, rmax),
    }
}


function gen_n_esferas(n, xmin, xmax, ymin, ymax, zmin, zmax, rmin, rmax) {
    const esferas = [];
    for (let i = 0; i < n; i++) {
        esferas.push(gen_esfera(xmin, xmax, ymin, ymax, zmin, zmax, rmin, rmax));
    }
    return esferas;
}


function raio_intercepta_esfera(i, j, xmin, ymax, pointsize, esfera, d) {
    const { xc, yc, zc, r } = esfera;

    i = i + pointsize/2;
    j = j + pointsize/2;

    const A = (j/d)**2 + (i/d)**2 + 1;
    const B = 2*zc - 2*xc*j/d - 2*yc*i/d - 2*d;
    const C = xc**2 + yc**2 + zc**2 - r**2 + d**2 - 2*zc*d;

    const delta = B**2 - 4*A*C;

    return delta >= 0;
}


function rrrrrraios(min, max, step, esfera, d) {
    const vertices = gen_vertices(min, max, step);

    const colors = [];
    for (let i = 0; i < vertices.length; i+=2) {
        const [y, x] = vertices.slice(i, i+2);
        if (raio_intercepta_esfera(x, y, min, max, step, esfera, d)) {
            colors.push(0, 0, 0);
        } else {
            colors.push(1, 1, 1);
        }

    }
    return { vertices, colors };
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
    gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0, 0);

    const esfera = { xc: 0, yc: 0, zc: 0, r: 50 }
    const { vertices, colors } = rrrrrraios(-300, 300, pointsize, esfera, 100);

    console.log(vertices);
    console.log(colors);

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    // Carrega cores no buffer
    const a_color_buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, a_color_buf);
    gl.enableVertexAttribArray(a_color);
    gl.vertexAttribPointer(a_color, 3, gl.FLOAT, false, 0, 0)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

    // Desenhar a cena
    // Configurações iniciais para desenhar a cena
    gl.clearColor(1, 1, 1, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(program);
    gl.bindVertexArray(vao);

    gl.uniform2f(u_resolution, gl.canvas.width, gl.canvas.height);
    gl.uniform1f(u_pointsize, pointsize);

    gl.drawArrays(gl.POINTS, 0, vertices.length/2);
}

main();
