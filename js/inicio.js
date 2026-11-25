/* ==========================================================================
   INICIO — productos destacados, combos, sedes y formulario de flotas
   ========================================================================== */

(function () {
  "use strict";

  const cfg = window.OILUB_CONFIG || {};
  const O = window.Oilub;
  const esc = O.escapar;
  const dev = !!cfg.modoDesarrollo;

  /* ---------- Productos destacados (máx. 8) ---------- */
  const $destacados = document.getElementById("destacados-grid");
  if ($destacados) {
    O.cargarProductos()
      .then((lista) => {
        const destacados = lista.filter((p) => p.destacado).slice(0, 8);
        const relleno = lista.filter((p) => !p.destacado).slice(0, Math.max(0, 8 - destacados.length));
        $destacados.innerHTML = destacados.concat(relleno).map(O.tarjetaProducto).join("");
        O.revelar($destacados);
      })
      .catch(() => {
        $destacados.innerHTML = `<p class="catalogo__vacio">Catálogo no disponible por el momento. Escríbenos por WhatsApp.</p>`;
      });
  }

  /* ---------- Combos (data/combos.json) ---------- */
  const $combos = document.getElementById("combos-lista");
  if ($combos) {
    fetch("data/combos.json")
      .then((r) => r.json())
      .then((d) => {
        const combos = (d.combos || []).filter((c) => c.activo !== false);
        if (!combos.length) { document.getElementById("combos").hidden = true; return; }
        $combos.innerHTML = combos.map((c, i) => {
          const precio = O.formatoPrecio(c.precio);
          const antes = O.formatoPrecio(c.precio_separado);
          const msg = `Hola, me interesa el ${c.nombre} (${c.incluye.join(" + ")}). ¿Me pueden dar precio y disponibilidad?`;
          const imgPeq = (c.imagen || "").replace(/\.webp$/, "-480.webp");
          return `
          <article class="combo revelar" style="--retraso:${i * 80}ms">
            <div class="combo__media">
              <img src="${esc(c.imagen)}" srcset="${esc(imgPeq)} 480w, ${esc(c.imagen)} 960w" sizes="(max-width: 560px) 100vw, 240px"
                   width="960" height="960" loading="lazy" decoding="async" alt="${esc(c.nombre)}: ${esc(c.incluye.join(" y "))}">
              <span class="combo__etiqueta">COMBO</span>
            </div>
            <div class="combo__cuerpo">
              <div>
                <h3>${esc(c.nombre)}</h3>
                ${c.ejemplo ? '<span class="marca-dev" style="margin-top:.5rem">Datos de muestra</span>' : ""}
              </div>
              <ul class="combo__incluye">
                ${c.incluye.map((x) => `<li><svg class="icono" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>${esc(x)}</li>`).join("")}
              </ul>
              <div class="combo__precios">
                ${precio ? `<span class="combo__precio">${esc(precio.principal)}</span>` : '<span class="combo__precio combo__precio--consultar">Consultar precio</span>'}
                ${precio && antes ? `<span class="combo__antes">${esc(antes.principal)}</span>` : ""}
              </div>
              <div class="combo__acciones">
                <button type="button" class="btn btn--primario" data-combo="${esc(c.id)}">Agregar</button>
                <a class="btn btn--whatsapp" href="${esc(window.enlaceWhatsApp(msg))}" target="_blank" rel="noopener">
                  <svg class="icono icono--relleno" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-whatsapp"/></svg>Pedir combo
                </a>
              </div>
            </div>
          </article>`;
        }).join("");
        O.revelar($combos);
        $combos.addEventListener("click", (e) => {
          const b = e.target.closest("[data-combo]");
          if (!b) return;
          const c = combos.find((x) => x.id === b.dataset.combo);
          window.Carrito.agregar({ id: c.id, nombre: c.nombre, detalle: c.incluye.join(" + "), precio: c.precio, imagen: (c.imagen || "").replace(/\.webp$/, "-480.webp") });
        });
      })
      .catch(() => { document.getElementById("combos").hidden = true; });
  }

  /* ---------- Sedes (desde js/config.js) ---------- */
  const $sedes = document.getElementById("sedes-grid");
  if ($sedes) {
    const ICONOS = {
      direccion: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
      horario: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
      telefono: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>'
    };
    const NOMBRES = { direccion: "Dirección", horario: "Horario", telefono: "Teléfono" };
    /* Un dato pendiente solo se ve (como aviso) en modo desarrollo */
    const fila = (tipo, valor) => {
      if (O.pendiente(valor) || !valor) {
        return dev ? `<li><svg class="icono" viewBox="0 0 24 24" aria-hidden="true">${ICONOS[tipo]}</svg><span class="marca-dev">${NOMBRES[tipo]} pendiente</span></li>` : "";
      }
      const contenido = tipo === "telefono" ? `<a href="tel:${esc(valor.replace(/[^\d+]/g, ""))}">${esc(valor)}</a>` : esc(valor);
      return `<li><svg class="icono" viewBox="0 0 24 24" aria-hidden="true">${ICONOS[tipo]}</svg><span><span class="solo-lectores">${NOMBRES[tipo]}: </span>${contenido}</span></li>`;
    };

    $sedes.innerHTML = (cfg.sedes || []).map((s, i) => {
      const mapa = O.pendiente(s.mapa)
        ? "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent("Lubricantes Oilub " + s.nombre + " Zulia")
        : s.mapa;
      const msg = `Hola, quiero información de la sede ${s.nombre}.`;
      const media = s.imagen
        ? `<img src="${esc(s.imagen)}" loading="lazy" decoding="async" alt="Fachada de la sede ${esc(s.nombre)} de Lubricantes Oilub">`
        : `<img src="assets/img/sede-${esc(s.id)}.webp" srcset="assets/img/sede-${esc(s.id)}-480.webp 480w, assets/img/sede-${esc(s.id)}.webp 1280w"
               sizes="(max-width: 760px) 100vw, 590px" width="1280" height="800" loading="lazy" decoding="async" alt="Fachada de la sede ${esc(s.nombre)} de Lubricantes Oilub">
          <span class="marca-dev">Foto real pendiente</span>`;
      return `
      <article class="sede revelar" style="--retraso:${i * 80}ms">
        <div class="sede__media">
          ${media}
        </div>
        <div class="sede__cuerpo">
          <h3>${esc(s.nombre)}</h3>
          <ul class="sede__datos">${fila("direccion", s.direccion)}${fila("horario", s.horario)}${fila("telefono", s.telefono)}</ul>
          <div class="sede__acciones">
            <a class="btn btn--secundario" href="${esc(mapa)}" target="_blank" rel="noopener">
              <svg class="icono" viewBox="0 0 24 24" aria-hidden="true"><path d="m3 11 19-9-9 19-2-8-8-2z"/></svg>Cómo llegar
            </a>
            <a class="btn btn--whatsapp" href="${esc(window.enlaceWhatsApp(msg))}" target="_blank" rel="noopener">
              <svg class="icono icono--relleno" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-whatsapp"/></svg>WhatsApp
            </a>
          </div>
        </div>
      </article>`;
    }).join("");
    O.revelar($sedes);
  }

  /* ---------- Formulario de flotas → WhatsApp ---------- */
  const $form = document.getElementById("form-flotas");
  if ($form) {
    const reglas = {
      empresa:  (v) => v.trim().length >= 2 || "Escribe el nombre de la empresa.",
      vehiculos:(v) => v.trim().length >= 2 || "Indica el tipo de vehículos.",
      cantidad: (v) => (Number(v) >= 1 && Number(v) <= 10000) || "Indica una cantidad válida.",
      telefono: (v) => v.replace(/\D/g, "").length >= 10 || "Escribe un teléfono válido (ej.: 0414-1234567)."
    };
    $form.addEventListener("submit", (e) => {
      e.preventDefault();
      /* Campo señuelo: si lo llenó un robot, no se envía */
      if ($form.elements.sitio_web.value) return;
      let valido = true;
      Object.entries(reglas).forEach(([nombre, regla]) => {
        const input = $form.elements[nombre];
        const res = regla(input.value);
        const campo = input.closest(".campo");
        const error = campo.querySelector(".campo__error");
        if (res !== true) {
          valido = false; campo.classList.add("campo--error"); error.textContent = res; input.setAttribute("aria-invalid", "true");
        } else {
          campo.classList.remove("campo--error"); error.textContent = ""; input.removeAttribute("aria-invalid");
        }
      });
      if (!valido) { $form.querySelector("[aria-invalid]").focus(); return; }
      const f = $form.elements;
      const mensaje = [
        "Hola, quiero una cotización para mi flota:",
        "",
        `Empresa: ${f.empresa.value.trim()}`,
        `Tipo de vehículos: ${f.vehiculos.value.trim()}`,
        `Cantidad de vehículos: ${f.cantidad.value}`,
        `Teléfono de contacto: ${f.telefono.value.trim()}`
      ].join("\n");
      const a = document.createElement("a");
      a.href = window.enlaceWhatsApp(mensaje); a.target = "_blank"; a.rel = "noopener";
      document.body.appendChild(a); a.click(); a.remove();
    });
  }
})();
