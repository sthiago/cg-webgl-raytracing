// Utilitários
function radToDeg(r) { return r * 180 / Math.PI; }
function degToRad(d) { return d * Math.PI / 180; }
function rand_range(min, max) { return random() * (max - min) + min; }

/**
 * Função utilitária que gera números aleatórios baseados numa seed
 * Fonte: https://stackoverflow.com/a/19303725/1694726
 */
function random() {
    var x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
}

// Variáveis globais
let seed_inicial = Date.now();
var seed = seed_inicial;
let d = 1000;
let luz;

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
        r: rand_range(0.1, 1),
        g: rand_range(0.1, 1),
        b: rand_range(0.1, 1),
    };

    // Coefs. difuso e especular
    const kd = rand_range(0.5, 1);
    const ke = rand_range(0.5, 1);
    const n_esp = Math.floor(rand_range(50, 100));

    const rv = {
        xc: rand_range(xmin, xmax),
        yc: rand_range(ymin, ymax),
        zc: rand_range(zmin, zmax),
        r: rand_range(rmin, rmax),
        color,
        kd,
        ke,
        n_esp,
    };
    return rv;
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

function calcula_cos_alfa(centro_esf, ponto_contato, luz, eye)
{
    // Calcular a normal (normalizada)
    const n_vet = {
        x: ponto_contato.x - centro_esf.x,
        y: ponto_contato.y - centro_esf.y,
        z: ponto_contato.z - centro_esf.z,
    }
    const n_vet_mod = (n_vet.x**2 + n_vet.y**2 + n_vet.z**2)**0.5;
    const n_vet_unit = { x: n_vet.x/n_vet_mod, y: n_vet.y/n_vet_mod, z: n_vet.z/n_vet_mod};

    // Calcular o raio incidente (normalizado)
    const ri_vet = {
        x: ponto_contato.x - luz.x,
        y: ponto_contato.y - luz.y,
        z: ponto_contato.z - luz.z,
    }
    const ri_vet_mod = (ri_vet.x**2 + ri_vet.y**2 + ri_vet.z**2)**0.5;
    const ri_vet_unit = { x: ri_vet.x/ri_vet_mod, y: ri_vet.y/ri_vet_mod, z: ri_vet.z/ri_vet_mod};

    // Calcular ri escalar normal
    const ri_esc_n = n_vet_unit.x*ri_vet_unit.x + n_vet_unit.y*ri_vet_unit.y + n_vet_unit.z*ri_vet_unit.z;

    // Calcular raio refletido (já normalizado)
    const rr = {
        x: ri_vet_unit.x - 2 * n_vet_unit.x * ri_esc_n,
        y: ri_vet_unit.y - 2 * n_vet_unit.y * ri_esc_n,
        z: ri_vet_unit.z - 2 * n_vet_unit.z * ri_esc_n,
    };

    // Calcular vetor eye (normalizado)
    const eye_vet = {
        x: eye.x - ponto_contato.x,
        y: eye.y - ponto_contato.y,
        z: eye.z - ponto_contato.z,
    }
    const eye_vet_mod = (eye_vet.x**2 + eye_vet.y**2 + eye_vet.z**2)**0.5;
    const eye_vet_unit = { x: eye_vet.x/eye_vet_mod, y: eye_vet.y/eye_vet_mod, z: eye_vet.z/eye_vet_mod};

    // Calcular cos(alfa)
    const cos_alfa = eye_vet_unit.x*rr.x + eye_vet_unit.y*rr.y + eye_vet_unit.z*rr.z;

    return cos_alfa;
}

function raio_intercepta_esfera(i, j, pointsize, esfera, d)
{
    const { xc, yc, zc, r } = esfera;

    i = i + pointsize/2;
    j = j + pointsize/2;

    const A = (i/d)**2 + (j/d)**2 + 1;
    const B = 2*zc - 2*xc*i/d - 2*yc*j/d - 2*d;
    const C = xc**2 + yc**2 + zc**2 - r**2 + d**2 - 2*zc*d;

    const delta = B**2 - 4*A*C;

    if (delta >= 0) {
        // o t mais perto do COP
        return (-B - delta**(0.5)) / (2*A);
    }

    return undefined;
}


function rrrrrraios(min, max, step, esferas, d, luz, eye)
{
    const vertices = gen_vertices(min, max, step);

    const colors = [];
    for (let i = 0; i < vertices.length; i+=2) {
        const [x, y] = vertices.slice(i, i+2);

        let interceptou = false;
        let t_interceptacao = +Infinity;
        let color;
        let esf_intercep;
        for (const esfera of esferas) {
            const t = raio_intercepta_esfera(x, y, step, esfera, d);
            if (t != undefined && t < t_interceptacao) {
                interceptou = true;
                t_interceptacao = t;
                color = esfera.color;
                esf_intercep = esfera;
            }
        }

        if (interceptou) {
            const c_esf = {
                x: esf_intercep.xc,
                y: esf_intercep.yc,
                z: esf_intercep.zc,
            }
            const p_contato = {
                x: (x + step/2) * t_interceptacao / d,
                y: (y + step/2) * t_interceptacao / d,
                z: d - t_interceptacao
            }

            // cos(theta) -- para componente difusa
            const nl = calcula_n_escalar_l(c_esf, p_contato, luz);

            // cos(alfa) -- para componente especular
            const cos_alfa = calcula_cos_alfa(c_esf, p_contato, luz, eye);

            const r = (luz.ia*luz.r + luz.i*luz.r*esf_intercep.kd*nl + luz.i*luz.r*esf_intercep.ke*(cos_alfa**esf_intercep.n_esp)) * color.r;
            const g = (luz.ia*luz.g + luz.i*luz.g*esf_intercep.kd*nl + luz.i*luz.g*esf_intercep.ke*(cos_alfa**esf_intercep.n_esp)) * color.g;
            const b = (luz.ia*luz.b + luz.i*luz.b*esf_intercep.kd*nl + luz.i*luz.b*esf_intercep.ke*(cos_alfa**esf_intercep.n_esp)) * color.b;

            colors.push(r, g, b);
        } else {
            colors.push(0, 0, 0);
        }

    }
    return { vertices, colors };
}

function update_seed()
{
    seed_inicial = document.getElementById("seed").value;
    seed = seed_inicial;
    main();
}

function update_d()
{
    d = document.getElementById("dslider").value;
    document.getElementById("dvalue").textContent = d;
    main();
}

function update_luz()
{
    luz.x = document.getElementById("xluz").value;
    luz.y = document.getElementById("yluz").value;
    luz.z = document.getElementById("zluz").value;

    document.getElementById("xluzvalue").textContent = luz.x;
    document.getElementById("yluzvalue").textContent = luz.y;
    document.getElementById("zluzvalue").textContent = luz.z;

    main();
}

function setup()
{
    // Gera luz inicial aleatória
    luz = {
        // Intensidades
        ia: 0.2, //rand_range(0.2, 0.5),
        i: 1.0, //rand_range(0.5, 2.0),

        // Cor
        r: 1, g: 1, b: 1,

        // r: random(),
        // g: random(),
        // b: random(),

        // Posição
        x: Math.floor(rand_range(-2000, 2000)),
        y: Math.floor(rand_range(-2000, 2000)),
        z: Math.floor(rand_range(-2000, 2000)),
    };

    // Configura valores iniciais
    seed = seed_inicial;
    document.getElementById("seed").value = seed_inicial;
    document.getElementById("dslider").value = d;
    document.getElementById("dvalue").textContent = d;
    document.getElementById("xluz").value = luz.x;
    document.getElementById("yluz").value = luz.y;
    document.getElementById("zluz").value = luz.z;
    document.getElementById("xluzvalue").textContent = luz.x;
    document.getElementById("yluzvalue").textContent = luz.y;
    document.getElementById("zluzvalue").textContent = luz.z;

    // Binda handlers
    document.getElementById("seed").oninput = update_seed;
    document.getElementById("dslider").onchange = update_d;
    document.getElementById("xluz").onchange = update_luz;
    document.getElementById("yluz").onchange = update_luz;
    document.getElementById("zluz").onchange = update_luz;
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
    // const n = Math.floor(rand_range(3, 8));
    // const esferas = gen_n_esferas(n, -500, 500, -500, 500, -800, -1200, 100, 200);

    const esferas = [{
        xc: 200,
        yc: 200,
        zc: 0,
        r: 50,
        color: { r: 1, g: 0, b: 0},
        kd: 0.5,
        ke: 0.9,
        n_esp: 51,
    }];

    const eye = { x: 0, y: 0, z: d }
    const { vertices, colors } = rrrrrraios(-300 - pointsize, 300 + pointsize, pointsize, esferas, d, luz, eye);

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

setup();
main();
