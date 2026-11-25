/* ==========================================================================
   UI — menú, header con scroll, animaciones de aparición, WhatsApp y
   carga de textos desde data/contenido.json
   ========================================================================== */

(function () {
  "use strict";

  const cfg = window.OILUB_CONFIG || {};
  const doc = document.documentElement;
  doc.classList.remove("no-js");

  /* ---------- Modo desarrollo: muestra marcas de datos provisionales ---------- */
  if (cfg.modoDesarrollo) document.body.classList.add("modo-desarrollo");

  /* ---------- Enlaces de WhatsApp ----------
     Cualquier elemento con data-wa recibe el enlace correcto.
     data-wa=""             → mensaje general
     data-wa="Texto propio" → mensaje personalizado */
  document.querySelectorAll("[data-wa]").forEach((el) => {
    el.href = window.enlaceWhatsApp(el.dataset.wa || undefined);
    el.target = "_blank";
    el.rel = "noopener";
  });

  /* ---------- Textos editables (data/contenido.json) ----------
     Los elementos con data-c="ruta.a.texto" se rellenan desde el JSON.
     El HTML ya trae el texto por defecto (bueno para SEO y si falla la carga). */
  const obtener = (obj, ruta) => ruta.split(".").reduce((o, k) => (o ? o[k] : undefined), obj);
  fetch("data/contenido.json")
    .then((r) => (r.ok ? r.json() : null))
    .then((contenido) => {
      if (!contenido) return;
      document.querySelectorAll("[data-c]").forEach((el) => {
        const valor = obtener(contenido, el.dataset.c);
        if (typeof valor === "string") el.innerHTML = valor;
      });
    })
    .catch(() => { /* Si falla, se queda el texto del HTML */ });

  /* ---------- Header: borde al hacer scroll + botón volver arriba ---------- */
  const header = document.querySelector(".header");
  const volver = document.querySelector(".volver-arriba");
  const alHacerScroll = () => {
    const y = window.scrollY;
    header && header.classList.toggle("con-scroll", y > 8);
    volver && volver.classList.toggle("visible", y > 600);
  };
  window.addEventListener("scroll", alHacerScroll, { passive: true });
  alHacerScroll();
  volver && volver.addEventListener("click", () => window.scrollTo({ top: 0 }));

  /* ---------- Menú móvil a pantalla completa ---------- */
  const btnMenu = document.querySelector(".btn-menu");
  const menu = document.getElementById("menu-movil");
  if (btnMenu && menu) {
    const alternar = (abrir) => {
      btnMenu.setAttribute("aria-expanded", String(abrir));
      btnMenu.setAttribute("aria-label", abrir ? "Cerrar menú" : "Abrir menú");
      menu.classList.toggle("abierto", abrir);
      menu.setAttribute("aria-hidden", String(!abrir));
      document.body.style.overflow = abrir ? "hidden" : "";
      if (abrir) menu.querySelector("a")?.focus();
    };
    btnMenu.addEventListener("click", () => alternar(btnMenu.getAttribute("aria-expanded") !== "true"));
    menu.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => alternar(false)));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && menu.classList.contains("abierto")) { alternar(false); btnMenu.focus(); }
    });
  }

  /* ---------- Aparición suave al hacer scroll ---------- */
  /* Los elementos del hero aparecen al cargar (no esperan al scroll) */
  requestAnimationFrame(() => {
    document.querySelectorAll(".hero .revelar").forEach((el) => el.classList.add("visible"));
  });
  const elementos = document.querySelectorAll(".revelar:not(.hero .revelar)");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entradas) => {
      entradas.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("visible"); io.unobserve(e.target); }
      });
    }, { threshold: 0.15 });
    elementos.forEach((el) => io.observe(el));
  } else {
    elementos.forEach((el) => el.classList.add("visible"));
  }

  /* ---------- Google Analytics 4 (solo si hay un ID real en config.js) ---------- */
  const ga = cfg.analitica && cfg.analitica.ga4;
  if (ga && /^G-[A-Z0-9]+$/.test(ga)) {
    const s = document.createElement("script");
    s.async = true; s.src = "https://www.googletagmanager.com/gtag/js?id=" + ga;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date()); window.gtag("config", ga);
  }

  /* ---------- Año del footer ---------- */
  document.querySelectorAll("[data-anio]").forEach((el) => (el.textContent = new Date().getFullYear()));
})();
