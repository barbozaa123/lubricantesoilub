/* ==========================================================================
   CARRITO — carrito lateral, guardado en localStorage y pedido por WhatsApp
   --------------------------------------------------------------------------
   Fase 1: el pedido se envía por WhatsApp.
   Fase 2 (pasarela de pago): implementar Carrito.pagar() con la pasarela que
   indique el cliente; la lista y el total ya están disponibles en Carrito.items().
   ========================================================================== */

(function () {
  "use strict";

  const cfg = window.OILUB_CONFIG || {};
  const CLAVE = "oilub-carrito";
  const O = () => window.Oilub; // utilidades de catalogo.js

  /* ---------- Estado y guardado ---------- */
  let items = [];
  try { items = JSON.parse(localStorage.getItem(CLAVE)) || []; } catch (e) { items = []; }
  let notas = "";
  let sede = "";

  const guardar = () => { try { localStorage.setItem(CLAVE, JSON.stringify(items)); } catch (e) {} };

  /* ---------- Marcado del carrito (se inserta una sola vez en todas las páginas) ---------- */
  const opcionesSede = (cfg.sedes || []).map((s) => `<option value="${s.nombre}">Retiro en ${s.nombre}</option>`).join("")
    + (cfg.delivery ? '<option value="Delivery">Delivery</option>' : "");

  document.body.insertAdjacentHTML("beforeend", `
    <div class="carrito-fondo" data-cerrar-carrito></div>
    <aside class="carrito" id="carrito" role="dialog" aria-modal="true" aria-labelledby="carrito-titulo" aria-hidden="true">
      <div class="carrito__cabecera">
        <h2 id="carrito-titulo">Tu pedido</h2>
        <button class="btn-cerrar" type="button" data-cerrar-carrito aria-label="Cerrar carrito">
          <svg class="icono" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      </div>
      <div class="carrito__lista" id="carrito-lista" aria-live="polite"></div>
      <div class="carrito__pie" id="carrito-pie">
        <div class="carrito__total"><span>Total estimado</span><strong id="carrito-total" class="num">—</strong></div>
        <p class="carrito__nota" id="carrito-nota"></p>
        <div class="campo" id="campo-sede">
          <label for="carrito-sede">Sede de retiro *</label>
          <select class="select" id="carrito-sede" required>
            <option value="">Elige una sede</option>${opcionesSede}
          </select>
          <span class="campo__error" id="error-sede" role="alert"></span>
        </div>
        <div class="campo">
          <label for="carrito-notas">Notas (opcional)</label>
          <textarea class="textarea" id="carrito-notas" maxlength="300" placeholder="Ej.: modelo del vehículo, hora de retiro…"></textarea>
        </div>
        <button class="btn btn--whatsapp" type="button" id="carrito-enviar">
          <svg class="icono icono--relleno" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-whatsapp"/></svg>
          Enviar pedido por WhatsApp
        </button>
      </div>
    </aside>
    <div class="aviso" id="aviso" role="status" aria-live="polite">
      <svg class="icono" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg><span></span>
    </div>`);

  const $lista = document.getElementById("carrito-lista");
  const $pie = document.getElementById("carrito-pie");
  const $total = document.getElementById("carrito-total");
  const $nota = document.getElementById("carrito-nota");
  const $sede = document.getElementById("carrito-sede");
  const $notas = document.getElementById("carrito-notas");
  const $panel = document.getElementById("carrito");
  let ultimoFoco = null;

  /* ---------- Cálculos ---------- */
  const unidades = () => items.reduce((n, i) => n + i.cantidad, 0);
  const totales = () => {
    const conPrecio = items.filter((i) => i.precio != null);
    return {
      suma: conPrecio.reduce((t, i) => t + i.precio * i.cantidad, 0),
      completo: conPrecio.length === items.length,
      alguno: conPrecio.length > 0
    };
  };
  const precioTexto = (v) => { const f = O().formatoPrecio(v); return f ? f.principal + (f.secundaria ? ` (${f.secundaria})` : "") : null; };

  /* ---------- Pintado ---------- */
  function pintar() {
    const n = unidades();
    document.querySelectorAll(".btn-carrito__contador").forEach((c) => { c.textContent = n; });
    document.querySelectorAll(".btn-carrito").forEach((b) => b.setAttribute("aria-label", `Abrir carrito, ${n} ${n === 1 ? "producto" : "productos"}`));

    if (!items.length) {
      $lista.innerHTML = `<div class="carrito__vacio">
        <svg class="icono" viewBox="0 0 24 24" aria-hidden="true"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
        <p>Tu carrito está vacío.</p>
        <a class="btn btn--secundario btn--pequeno" href="catalogo.html">Ver catálogo</a>
      </div>`;
      $pie.hidden = true;
      return;
    }
    $pie.hidden = false;
    const esc = O().escapar;
    $lista.innerHTML = items.map((i) => `
      <div class="item-carrito">
        <img src="${esc(i.imagen || "assets/img/placeholder.webp")}" alt="" width="64" height="64" loading="lazy">
        <div>
          <p class="item-carrito__nombre">${esc(i.nombre)}</p>
          <p class="item-carrito__precio">${esc(precioTexto(i.precio) || "Consultar precio")}</p>
          <button type="button" class="item-carrito__quitar" data-quitar="${esc(i.id)}">Quitar</button>
        </div>
        <div class="cantidad" role="group" aria-label="Cantidad de ${esc(i.nombre)}">
          <button type="button" data-restar="${esc(i.id)}" aria-label="Restar uno">−</button>
          <span>${i.cantidad}</span>
          <button type="button" data-sumar="${esc(i.id)}" aria-label="Sumar uno">+</button>
        </div>
      </div>`).join("");

    const t = totales();
    $total.textContent = t.alguno ? precioTexto(t.suma) : "Por confirmar";
    $nota.textContent = t.completo
      ? "Precio referencial. Te confirmamos el total por WhatsApp."
      : (t.alguno ? "Algunos productos no tienen precio publicado; te lo confirmamos por WhatsApp."
                  : "Te confirmamos precios y disponibilidad por WhatsApp.");
  }

  /* ---------- Acciones públicas ---------- */
  function agregar(item, cantidad = 1) {
    const existente = items.find((i) => i.id === item.id);
    if (existente) existente.cantidad = Math.min(99, existente.cantidad + cantidad);
    else items.push({ id: item.id, nombre: item.nombre, detalle: item.detalle || "", precio: item.precio ?? null, imagen: item.imagen || "", cantidad });
    guardar(); pintar();
    aviso(`${item.nombre.replace(/\s*\(.*?muestra\)/i, "")} agregado al pedido`);
  }

  function cambiar(id, delta) {
    const it = items.find((i) => i.id === id);
    if (!it) return;
    it.cantidad += delta;
    if (it.cantidad <= 0) items = items.filter((i) => i.id !== id);
    guardar(); pintar();
  }

  function abrir() {
    ultimoFoco = document.activeElement;
    document.body.classList.add("carrito-abierto");
    $panel.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    setTimeout(() => $panel.querySelector(".btn-cerrar").focus(), 50);
  }
  function cerrar() {
    document.body.classList.remove("carrito-abierto");
    $panel.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    ultimoFoco && ultimoFoco.focus();
  }

  let tAviso;
  function aviso(texto) {
    const a = document.getElementById("aviso");
    a.querySelector("span").textContent = texto;
    a.classList.add("visible");
    clearTimeout(tAviso);
    tAviso = setTimeout(() => a.classList.remove("visible"), 2400);
  }

  /* ---------- Mensaje de pedido para WhatsApp ---------- */
  function mensajePedido() {
    const lineas = ["Hola, quiero hacer este pedido desde la página web:", ""];
    items.forEach((i, n) => {
      const p = precioTexto(i.precio);
      lineas.push(`${n + 1}. ${i.cantidad} × ${i.nombre}${i.detalle ? " (" + i.detalle + ")" : ""}`);
      lineas.push(`   ${p ? p + " c/u" : "Precio por consultar"}`);
    });
    const t = totales();
    lineas.push("");
    if (t.completo) lineas.push(`Total estimado: ${precioTexto(t.suma)}`);
    else if (t.alguno) lineas.push(`Subtotal de productos con precio: ${precioTexto(t.suma)} (resto por confirmar)`);
    else lineas.push("Total estimado: por confirmar");
    lineas.push(`Sede de retiro: ${sede}`);
    if (notas.trim()) lineas.push(`Notas: ${notas.trim()}`);
    return lineas.join("\n");
  }

  function enviar() {
    sede = $sede.value;
    notas = $notas.value;
    const campo = document.getElementById("campo-sede");
    if (!sede) {
      campo.classList.add("campo--error");
      document.getElementById("error-sede").textContent = "Elige la sede donde retirarás tu pedido.";
      $sede.focus();
      return;
    }
    campo.classList.remove("campo--error");
    document.getElementById("error-sede").textContent = "";
    const url = window.enlaceWhatsApp(mensajePedido());
    const a = document.createElement("a");
    a.href = url; a.target = "_blank"; a.rel = "noopener";
    document.body.appendChild(a); a.click(); a.remove();
  }

  /* ---------- Eventos ---------- */
  document.addEventListener("click", (e) => {
    if (e.target.closest(".btn-carrito")) { abrir(); return; }
    if (e.target.closest("[data-cerrar-carrito]")) { cerrar(); return; }
    const sumar = e.target.closest("[data-sumar]");
    if (sumar) return cambiar(sumar.dataset.sumar, 1);
    const restar = e.target.closest("[data-restar]");
    if (restar) return cambiar(restar.dataset.restar, -1);
    const quitar = e.target.closest("[data-quitar]");
    if (quitar) { items = items.filter((i) => i.id !== quitar.dataset.quitar); guardar(); pintar(); return; }

    /* Botón «Agregar» de tarjetas de producto */
    const btn = e.target.closest("[data-agregar]");
    if (btn && O()) {
      O().cargarProductos().then((lista) => {
        const p = lista.find((x) => x.id === btn.dataset.agregar);
        if (p) agregar({ id: p.id, nombre: p.nombre, detalle: O().detalleProducto(p).join(" · "), precio: p.precio, imagen: (p.imagen || "").replace(/\.webp$/, "-480.webp") });
      });
    }
  });
  document.getElementById("carrito-enviar").addEventListener("click", enviar);
  $sede.addEventListener("input", () => { document.getElementById("campo-sede").classList.remove("campo--error"); document.getElementById("error-sede").textContent = ""; });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && document.body.classList.contains("carrito-abierto")) cerrar();
    /* Mantener el foco dentro del carrito abierto */
    if (e.key === "Tab" && document.body.classList.contains("carrito-abierto")) {
      const f = $panel.querySelectorAll("button, a, select, textarea, input");
      const visibles = [...f].filter((el) => el.offsetParent !== null);
      if (!visibles.length) return;
      const primero = visibles[0], ultimo = visibles[visibles.length - 1];
      if (e.shiftKey && document.activeElement === primero) { e.preventDefault(); ultimo.focus(); }
      else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero.focus(); }
    }
  });
  /* Sincroniza si el carrito cambia en otra pestaña */
  window.addEventListener("storage", (e) => {
    if (e.key === CLAVE) { try { items = JSON.parse(e.newValue) || []; } catch (er) { items = []; } pintar(); }
  });

  pintar();

  window.Carrito = { agregar, abrir, cerrar, items: () => items.slice(), mensajePedido, aviso };
})();
