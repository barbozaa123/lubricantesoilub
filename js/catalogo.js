/* ==========================================================================
   CATÁLOGO — carga de productos, tarjeta de producto, filtros y búsqueda
   --------------------------------------------------------------------------
   - Los productos se leen de data/productos.json (el cliente lo edita).
   - window.Oilub expone utilidades que usan también inicio.js y carrito.js.
   ========================================================================== */

(function () {
  "use strict";

  const cfg = window.OILUB_CONFIG || {};

  /* ---------- Textos visibles de categorías y valores de filtros ---------- */
  const CATEGORIAS = {
    "aceites-motor": "Aceites de motor",
    "filtros": "Filtros",
    "baterias": "Baterías",
    "fluidos": "Fluidos y otros lubricantes"
  };

  const ETIQUETAS = {
    mineral: "Mineral", semisintetico: "Semisintético", sintetico: "Sintético",
    gasolina: "Gasolina", diesel: "Diésel",
    aceite: "Aceite", aire: "Aire", combustible: "Combustible", cabina: "Cabina",
    refrigerante: "Refrigerante", frenos: "Frenos", direccion: "Dirección hidráulica",
    transmision: "Transmisión automática", caja: "Caja y diferencial"
  };
  const etiqueta = (v) => ETIQUETAS[v] || v;

  /* ---------- Filtros disponibles según la categoría ---------- */
  const FILTROS = {
    todas:          [{ campo: "marca", titulo: "Marca" }],
    "aceites-motor":[{ campo: "marca", titulo: "Marca" }, { campo: "tipo", titulo: "Tipo" },
                     { campo: "combustible", titulo: "Combustible" }, { campo: "viscosidad", titulo: "Viscosidad" },
                     { campo: "presentacion", titulo: "Presentación" }],
    filtros:        [{ campo: "tipo_filtro", titulo: "Tipo de filtro" }],
    baterias:       [{ campo: "grupo", titulo: "Grupo / tamaño", formato: (v) => "Grupo " + v },
                     { campo: "amperaje", titulo: "Capacidad" }],
    fluidos:        [{ campo: "marca", titulo: "Marca" }, { campo: "tipo_fluido", titulo: "Tipo" },
                     { campo: "presentacion", titulo: "Presentación" }]
  };

  /* ---------- Utilidades ---------- */
  const escapar = (t) => String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const normalizar = (t) => String(t ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const pendiente = (v) => typeof v === "string" && v.startsWith("[[");

  /* Formato de precio según la moneda configurada */
  function formatoPrecio(valor) {
    if (valor == null) return null;
    const m = cfg.moneda || {};
    const principal = m.principal === "USD"
      ? "$ " + Number(valor).toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : (m.principal || "") + " " + Number(valor).toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    let secundaria = null;
    if (m.secundaria && m.tasa) {
      secundaria = m.secundaria + " " + (valor * m.tasa).toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return { principal, secundaria };
  }

  /* Imagen con srcset (archivo base 800 px + versión -480) */
  function imagenProducto(p, cargaDiferida = true) {
    const src = p.imagen || "assets/img/placeholder.webp";
    const peq = src.replace(/\.webp$/, "-480.webp");
    return `<img src="${escapar(src)}" srcset="${escapar(peq)} 480w, ${escapar(src)} 800w"
      sizes="(max-width: 760px) 50vw, (max-width: 1024px) 33vw, 290px"
      width="800" height="800" ${cargaDiferida ? 'loading="lazy"' : ""} decoding="async"
      alt="${escapar(p.nombre)}" onerror="this.onerror=null;this.src='assets/img/placeholder.webp';this.removeAttribute('srcset')">`;
  }

  /* Detalle corto para chips y para el mensaje de WhatsApp */
  function detalleProducto(p) {
    const partes = [];
    if (p.viscosidad) partes.push(p.viscosidad);
    if (p.tipo) partes.push(etiqueta(p.tipo));
    if (p.tipo_filtro) partes.push("Filtro de " + etiqueta(p.tipo_filtro).toLowerCase());
    if (p.tipo_fluido) partes.push(etiqueta(p.tipo_fluido));
    if (p.grupo) partes.push("Grupo " + p.grupo);
    if (p.amperaje) partes.push(p.amperaje);
    if (p.presentacion) partes.push(p.presentacion);
    return partes;
  }

  /* ---------- Tarjeta de producto ---------- */
  function tarjetaProducto(p, i = 0) {
    const precio = formatoPrecio(p.precio);
    const chips = detalleProducto(p).slice(0, 3).map((c) => `<span class="chip">${escapar(c)}</span>`).join("");
    const mensaje = `Hola, quiero consultar el precio y disponibilidad de: ${p.nombre}${p.marca ? " (" + p.marca + ")" : ""}.`;
    const precioHTML = precio
      ? `<p class="producto__precio">${escapar(precio.principal)}${precio.secundaria ? `<small>${escapar(precio.secundaria)}</small>` : ""}</p>`
      : `<p class="producto__precio producto__precio--consultar">Consultar precio</p>`;

    return `
      <article class="producto revelar" style="--retraso:${(i % 4) * 60}ms">
        <div class="producto__media">
          ${imagenProducto(p)}
          ${p.ejemplo ? '<span class="producto__ejemplo marca-dev">Ejemplo</span>' : ""}
          ${p.disponible === false ? '<span class="producto__agotado">Agotado</span>' : ""}
        </div>
        <div class="producto__cuerpo">
          ${p.marca ? `<span class="chip chip--marca producto__marca">${escapar(p.marca)}</span>` : ""}
          <h3 class="producto__nombre">${escapar(p.nombre)}</h3>
          <div class="producto__chips">${chips}</div>
          ${precioHTML}
          <div class="producto__acciones">
            <button class="btn btn--primario" type="button" data-agregar="${escapar(p.id)}" ${p.disponible === false ? "disabled" : ""}>
              <svg class="icono" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>Agregar
            </button>
            <a class="btn-wa-icono" href="${escapar(window.enlaceWhatsApp(mensaje))}" target="_blank" rel="noopener"
               aria-label="Consultar ${escapar(p.nombre)} por WhatsApp" title="Consultar por WhatsApp">
              <svg class="icono icono--relleno" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-whatsapp"/></svg>
            </a>
          </div>
        </div>
      </article>`;
  }

  /* ---------- Carga de datos (una sola vez) ---------- */
  let promesaProductos = null;
  function cargarProductos() {
    if (!promesaProductos) {
      promesaProductos = fetch("data/productos.json")
        .then((r) => { if (!r.ok) throw new Error("No se pudo cargar el catálogo"); return r.json(); })
        .then((d) => (d.productos || []));
    }
    return promesaProductos;
  }

  /* Activa la animación de aparición en tarjetas recién insertadas */
  function revelar(contenedor) {
    const els = contenedor.querySelectorAll(".revelar:not(.visible)");
    if (!("IntersectionObserver" in window)) { els.forEach((e) => e.classList.add("visible")); return; }
    const io = new IntersectionObserver((entradas) => entradas.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("visible"); io.unobserve(e.target); }
    }), { threshold: 0.1 });
    els.forEach((e) => io.observe(e));
  }

  /* Datos estructurados Product (solo productos reales con precio) */
  function jsonLdProductos(productos) {
    const reales = productos.filter((p) => !p.ejemplo && p.precio != null);
    if (!reales.length) return;
    const data = reales.map((p) => ({
      "@context": "https://schema.org",
      "@type": "Product",
      name: p.nombre,
      image: new URL(p.imagen, location.href).href,
      description: p.descripcion_corta || undefined,
      brand: p.marca ? { "@type": "Brand", name: p.marca } : undefined,
      sku: p.id,
      offers: {
        "@type": "Offer",
        price: p.precio,
        priceCurrency: (cfg.moneda && cfg.moneda.principal === "Bs.") ? "VES" : "USD",
        availability: p.disponible === false ? "https://schema.org/OutOfStock" : "https://schema.org/InStock"
      }
    }));
    const s = document.createElement("script");
    s.type = "application/ld+json";
    s.textContent = JSON.stringify(data);
    document.head.appendChild(s);
  }

  /* Exponer utilidades */
  window.Oilub = Object.assign(window.Oilub || {}, {
    CATEGORIAS, etiqueta, escapar, pendiente, formatoPrecio, detalleProducto,
    tarjetaProducto, cargarProductos, revelar, imagenProducto
  });

  /* ======================================================================
     PÁGINA DE CATÁLOGO (solo si existe #catalogo-app)
     ====================================================================== */
  const app = document.getElementById("catalogo-app");
  if (!app) return;

  const $grid = document.getElementById("catalogo-grid");
  const $conteo = document.getElementById("catalogo-conteo");
  const $filtros = document.getElementById("filtros-dinamicos");
  const $buscar = document.getElementById("catalogo-buscar");
  const $orden = document.getElementById("catalogo-orden");
  const $tabs = document.querySelectorAll("[data-categoria]");
  const $panel = document.getElementById("filtros");
  const $titulo = document.getElementById("catalogo-titulo");
  const $miga = document.getElementById("miga-categoria");

  const estado = { categoria: "todas", filtros: {}, busqueda: "", orden: "destacados" };
  let productos = [];

  /* Lee la categoría desde #hash o ?categoria= */
  function categoriaInicial() {
    const desdeHash = location.hash.replace("#", "");
    const desdeQuery = new URLSearchParams(location.search).get("categoria");
    const c = desdeHash || desdeQuery;
    return CATEGORIAS[c] ? c : "todas";
  }

  function pintarTabs() {
    $tabs.forEach((t) => t.setAttribute("aria-pressed", String(t.dataset.categoria === estado.categoria)));
    const nombre = CATEGORIAS[estado.categoria];
    $titulo.textContent = nombre || "Catálogo";
    $miga.textContent = nombre || "Todos los productos";
    document.title = (nombre ? nombre + " | " : "Catálogo | ") + "Lubricantes Oilub · Maracaibo y San Francisco";
  }

  function pintarFiltros() {
    const base = productos.filter((p) => estado.categoria === "todas" || p.categoria === estado.categoria);
    const grupos = FILTROS[estado.categoria] || FILTROS.todas;
    $filtros.innerHTML = grupos.map((g) => {
      const valores = [...new Set(base.map((p) => p[g.campo]).filter((v) => v && !pendiente(v)))]
        .sort((a, b) => String(a).localeCompare(String(b), "es", { numeric: true }));
      if (!valores.length) return "";
      const activos = estado.filtros[g.campo] || new Set();
      return `<div class="filtros__grupo" role="group" aria-label="${escapar(g.titulo)}">
        <span>${escapar(g.titulo)}</span>
        <div class="filtros__opciones">
          ${valores.map((v) => `<button type="button" class="chip-btn" data-campo="${escapar(g.campo)}" data-valor="${escapar(v)}"
              aria-pressed="${activos.has(String(v))}">${escapar(g.formato ? g.formato(v) : etiqueta(v))}</button>`).join("")}
        </div>
      </div>`;
    }).join("");
  }

  function filtrar() {
    const q = normalizar(estado.busqueda.trim());
    let lista = productos.filter((p) => {
      if (estado.categoria !== "todas" && p.categoria !== estado.categoria) return false;
      for (const [campo, valores] of Object.entries(estado.filtros)) {
        if (valores.size && !valores.has(String(p[campo]))) return false;
      }
      if (q) {
        const texto = normalizar([p.nombre, p.marca, p.viscosidad, p.presentacion, etiqueta(p.tipo), etiqueta(p.tipo_filtro),
          etiqueta(p.tipo_fluido), p.grupo && "grupo " + p.grupo, p.amperaje, CATEGORIAS[p.categoria], p.descripcion_corta,
          pendiente(p.compatibilidad) ? "" : p.compatibilidad].join(" "));
        if (!q.split(/\s+/).every((palabra) => texto.includes(palabra))) return false;
      }
      return true;
    });

    const porNombre = (a, b) => a.nombre.localeCompare(b.nombre, "es");
    const precio = (p, alto) => (p.precio == null ? (alto ? -Infinity : Infinity) : p.precio);
    switch (estado.orden) {
      case "precio-asc":  lista.sort((a, b) => precio(a) - precio(b) || porNombre(a, b)); break;
      case "precio-desc": lista.sort((a, b) => precio(b, true) - precio(a, true) || porNombre(a, b)); break;
      case "marca":       lista.sort((a, b) => (a.marca || "~").localeCompare(b.marca || "~", "es") || porNombre(a, b)); break;
      default:            lista.sort((a, b) => (b.destacado === true) - (a.destacado === true) || porNombre(a, b));
    }
    return lista;
  }

  function pintarProductos() {
    const lista = filtrar();
    $conteo.textContent = lista.length === 1 ? "1 producto" : `${lista.length} productos`;
    if (!lista.length) {
      $grid.innerHTML = "";
      document.getElementById("catalogo-vacio").hidden = false;
      return;
    }
    document.getElementById("catalogo-vacio").hidden = true;
    $grid.innerHTML = lista.map(tarjetaProducto).join("");
    revelar($grid);
  }

  function actualizar({ filtros = false } = {}) {
    pintarTabs();
    if (filtros) pintarFiltros();
    pintarProductos();
  }

  /* ---------- Eventos ---------- */
  $tabs.forEach((t) => t.addEventListener("click", () => {
    estado.categoria = t.dataset.categoria;
    estado.filtros = {};
    try { history.replaceState(null, "", estado.categoria === "todas" ? location.pathname : "#" + estado.categoria); } catch (e) {}
    actualizar({ filtros: true });
  }));

  $filtros.addEventListener("click", (e) => {
    const b = e.target.closest("[data-campo]");
    if (!b) return;
    const { campo, valor } = b.dataset;
    const set = estado.filtros[campo] || (estado.filtros[campo] = new Set());
    set.has(valor) ? set.delete(valor) : set.add(valor);
    b.setAttribute("aria-pressed", String(set.has(valor)));
    pintarProductos();
  });

  document.querySelectorAll("[data-limpiar-filtros]").forEach((b) => b.addEventListener("click", () => {
    estado.filtros = {}; estado.busqueda = ""; $buscar.value = "";
    actualizar({ filtros: true });
  }));

  let espera;
  $buscar.addEventListener("input", () => {
    clearTimeout(espera);
    espera = setTimeout(() => { estado.busqueda = $buscar.value; pintarProductos(); }, 120);
  });
  $orden.addEventListener("change", () => { estado.orden = $orden.value; pintarProductos(); });

  window.addEventListener("hashchange", () => {
    const c = categoriaInicial();
    if (c !== estado.categoria) { estado.categoria = c; estado.filtros = {}; actualizar({ filtros: true }); }
  });

  /* Panel de filtros en móvil */
  const abrirPanel = (abrir) => {
    $panel.classList.toggle("abierto", abrir);
    document.body.style.overflow = abrir ? "hidden" : "";
    document.querySelector(".btn-filtros").setAttribute("aria-expanded", String(abrir));
    if (abrir) $panel.querySelector("button")?.focus();
  };
  document.querySelector(".btn-filtros").addEventListener("click", () => abrirPanel(true));
  document.querySelectorAll("[data-cerrar-filtros]").forEach((b) => b.addEventListener("click", () => abrirPanel(false)));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && $panel.classList.contains("abierto")) abrirPanel(false); });

  /* ---------- Inicio ---------- */
  estado.categoria = categoriaInicial();
  pintarTabs();
  cargarProductos()
    .then((lista) => {
      productos = lista;
      actualizar({ filtros: true });
      jsonLdProductos(productos);
    })
    .catch(() => {
      $grid.innerHTML = "";
      $conteo.textContent = "";
      const vacio = document.getElementById("catalogo-vacio");
      vacio.hidden = false;
      vacio.querySelector("p").textContent = "No pudimos cargar el catálogo. Escríbenos por WhatsApp y te atendemos.";
    });
})();
