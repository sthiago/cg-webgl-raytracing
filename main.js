// Utilitários
function radToDeg(r) { return r * 180 / Math.PI; }
function degToRad(d) { return d * Math.PI / 180; }
function rand_range(min, max) { return random() * (max - min) + min; }

/**
 * Função utilitária que gera números aleatórios baseados numa seed
 * Fonte: https://stackoverflow.com/a/19303725/1694726
 */
 var seed = Date.now(); // global
 function random() {
     var x = Math.sin(seed++) * 10000;
     return x - Math.floor(x);
 }


function gen_vertices(min, max, step=0.1) {
    const vertices = [];
    for (let i = min; i < max; i += step) {
        for (let j = min; j < max; j += step) {
            vertices.push(i, j);
        }
    }
    return vertices;
}


function gen_esfera(xmin, xmax, ymin, ymax, zmin, zmax, rmin, rmax)
{
    // Coef. ambiente
    const color = {
        r: random(),
        g: random(),
        b: random()
    };

    // Coefs. difuso e especular
    const kd = rand_range(0.2, 1.2);
    const ke = rand_range(0.2, 1.2);

    return {
        xc: rand_range(xmin, xmax),
        yc: rand_range(ymin, ymax),
        zc: rand_range(zmin, zmax),
        r: rand_range(rmin, rmax),
        color,
        kd,
        ke,
    }
}


function gen_n_esferas(n, xmin, xmax, ymin, ymax, zmin, zmax, rmin, rmax)
{
    const esferas = [];
    for (let i = 0; i < n; i++) {
        esferas.push(gen_esfera(xmin, xmax, ymin, ymax, zmin, zmax, rmin, rmax));
    }
    return esferas;
}


function calcula_n_escalar_l(centro_esf, ponto_contato, luz)
{
    const n_vet = {
        x: ponto_contato.x - centro_esf.x,
        y: ponto_contato.y - centro_esf.y,
        z: ponto_contato.z - centro_esf.z,
    }

    const l_vet = {
        x: luz.x - ponto_contato.x,
        y: luz.y - ponto_contato.y,
        z: luz.z - ponto_contato.z,
    }

    const n_vet_mod = (n_vet.x**2 + n_vet.y**2 + n_vet.z**2)**0.5;
    const l_vet_mod = (l_vet.x**2 + l_vet.y**2 + l_vet.z**2)**0.5;

    const n_vet_unit = { x: n_vet.x/n_vet_mod, y: n_vet.y/n_vet_mod, z: n_vet.z/n_vet_mod};
    const l_vet_unit = { x: l_vet.x/l_vet_mod, y: l_vet.y/l_vet_mod, z: l_vet.z/l_vet_mod};

    return n_vet_unit.x*l_vet_unit.x + n_vet_unit.y*l_vet_unit.y + n_vet_unit.z*l_vet_unit.z;
}


function raio_intercepta_esfera(i, j, pointsize, esfera, d, luz)
{
    const { xc, yc, zc, r } = esfera;

    i = i + pointsize/2;
    j = j + pointsize/2;

    const A = (j/d)**2 + (i/d)**2 + 1;
    const B = 2*zc - 2*xc*j/d - 2*yc*i/d - 2*d;
    const C = xc**2 + yc**2 + zc**2 - r**2 + d**2 - 2*zc*d;

    const delta = B**2 - 4*A*C;

    if (delta >= 0) {
        // o t mais perto do COP
        return (-B - delta**(0.5)) / (2*A);
    }

    return undefined;
}


function rrrrrraios(min, max, step, esferas, d, luz)
{
    const vertices = gen_vertices(min, max, step);

    const colors = [];
    for (let i = 0; i < vertices.length; i+=2) {
        const [x, y] = vertices.slice(i, i+2);

        let interceptou = false;
        let t_interceptacao = +Infinity;
        let color;
        let esfera_interceptacao;
        for (const esfera of esferas) {
            const t = raio_intercepta_esfera(x, y, step, esfera, d, luz);
            if (t != undefined && t < t_interceptacao) {
                interceptou = true;
                t_interceptacao = t;
                color = esfera.color;
                esfera_interceptacao = esfera;
            }
        }

        if (interceptou) {
            const c_esf = {
                x: esfera_interceptacao.xc,
                y: esfera_interceptacao.yc,
                z: esfera_interceptacao.zc,
            }
            const p_contato = {
                x: (x + step/2) * t_interceptacao / d,
                y: (y + step/2) * t_interceptacao / d,
                z: d - t_interceptacao
            }

            const nl = calcula_n_escalar_l(c_esf, p_contato, luz);

            const r = luz.ia*luz.r * color.r + luz.id*luz.r*esfera_interceptacao.kd*nl;
            const g = luz.ia*luz.g * color.g + luz.id*luz.g*esfera_interceptacao.kd*nl;
            const b = luz.ia*luz.b * color.b + luz.id*luz.b*esfera_interceptacao.kd*nl;

            colors.push(r, g, b);
        } else {
            colors.push(0, 0, 0);
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

    const pointsize = 1.0;

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    // Carrega vértices no buffer
    const a_position_buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, a_position_buf);
    gl.enableVertexAttribArray(a_position);
    gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0, 0);

    // Gera esferas aleatórias
    const n = Math.floor(rand_range(3, 8));
    const esferas = gen_n_esferas(n, -500, 500, -500, 500, -800, -1200, 100, 200);

    // Gera luz aleatória
    const luz = {
        // Intensidades
        ia: rand_range(0.2, 0.5),
        id: rand_range(0.5, 2.0),
        // ia: 0.3,
        // id: 1.5,

        // Cor
        r: 1, g: 1, b: 1,

        // r: random(),
        // g: random(),
        // b: random(),

        // Posição
        x: rand_range(-1000, 1000),
        y: rand_range(-1000, 1000),
        z: rand_range(-1000, 1000),

        // x: 0, y: 0, z: 1000
    };

    const { vertices, colors } = rrrrrraios(-300 - pointsize, 300 + pointsize, pointsize, esferas, 1000, luz);

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
