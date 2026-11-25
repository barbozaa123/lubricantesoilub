/* ==========================================================================
   CONFIGURACIÓN GENERAL — Lubricantes Oilub
   --------------------------------------------------------------------------
   Aquí se cambian los datos de contacto, sedes, moneda e IDs sin tocar
   el resto del código. Los valores con [[DOBLE CORCHETE]] están PENDIENTES
   de confirmación por el cliente: no se muestran como reales.
   ========================================================================== */

window.OILUB_CONFIG = {
  /* true  = muestra etiquetas "provisional" sobre datos pendientes.
     false = producción (ocultarlas antes de publicar). */
  modoDesarrollo: true,

  marca: {
    nombre: "Lubricantes Oilub", // [[confirmar escritura exacta: Oilub / OILUB]]
    instagram: "lubricantesoilub",
    email: "oscarurdaneta2004@gmail.com" // [[confirmar si habrá correo corporativo]]
  },

  whatsapp: {
    numero: "584129493812", // 0412-9493812
    mensajeGeneral: "Hola, vengo de la página web y quiero información."
  },

  sedes: [
    {
      id: "maracaibo",
      nombre: "Maracaibo",
      imagen: "assets/img/sede-maracaibo.jpg",
      direccion: "Av. 10 con Av. Universidad",
      horario: "7:30am a 6pm",
      telefono: "0412-9493812",
      mapa: "[[ENLACE_GOOGLE_MAPS]]"
    },
    {
      id: "san-francisco",
      nombre: "San Francisco",
      imagen: "assets/img/sede-san-francisco.jpg",
      direccion: "Av. 48 vía a la Cañada de Urdaneta a 200m de la Cervecería Modelo",
      horario: "7:30am a 6pm",
      telefono: "0412-6586915",
      mapa: "[[ENLACE_GOOGLE_MAPS]]"
    }
  ],

  moneda: {
    principal: "USD",      // [[CONFIRMAR: USD / Bs.]]
    secundaria: null,      // ej. "Bs." si se muestran ambas
    tasa: null             // tasa de cambio editable si hay dos monedas
  },

  delivery: null,          // [[CONFIRMAR si hay delivery]]

  analitica: {
    ga4: "[[GA4_ID]]"      // no se carga hasta que exista un ID real
  }
};

/* Utilidad: arma un enlace de WhatsApp con el texto codificado */
window.enlaceWhatsApp = function (mensaje) {
  const cfg = window.OILUB_CONFIG.whatsapp;
  const texto = encodeURIComponent(mensaje || cfg.mensajeGeneral);
  return `https://wa.me/${cfg.numero}?text=${texto}`;
};
