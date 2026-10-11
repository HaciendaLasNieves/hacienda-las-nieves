/* Hacienda Las Nieves · script.js */

(() => {
  "use strict";

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const desktopQuery = window.matchMedia("(min-width: 960px)");

  /* Navegación fija inteligente: se oculta al bajar y reaparece al subir */
  function initHeader() {
    const header = $(".site-header");
    if (!header) return;
    let lastY = window.scrollY;
    let ticking = false;

    const update = () => {
      const y = Math.max(window.scrollY, 0);
      header.classList.toggle("is-scrolled", y > 40);
      if (root.classList.contains("menu-open") || y < 120) {
        header.classList.remove("is-hidden");
        lastY = y;
      } else if (y > lastY + 6) {
        header.classList.add("is-hidden");
        lastY = y;
      } else if (y < lastY - 6) {
        header.classList.remove("is-hidden");
        lastY = y;
      }
      ticking = false;
    };

    window.addEventListener("scroll", () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }, { passive: true });
    header.addEventListener("focusin", () => header.classList.remove("is-hidden"));
    update();
  }

  /* Menú móvil y desplegable de Producción */
  function initMenu() {
    const toggle = $(".nav-toggle");
    const menu = $("#menu");
    if (!toggle || !menu) return;
    const dropdowns = $$(".dd");

    const setOpen = (open) => {
      root.classList.toggle("menu-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
    };

    const closeDropdowns = (except) => {
      dropdowns.forEach((dd) => {
        if (dd === except) return;
        dd.classList.remove("open");
        const btn = $(".dd-toggle", dd);
        if (btn) btn.setAttribute("aria-expanded", "false");
      });
    };

    toggle.addEventListener("click", () => setOpen(!root.classList.contains("menu-open")));

    $$("a", menu).forEach((link) => {
      link.addEventListener("click", () => {
        setOpen(false);
        closeDropdowns();
      });
    });

    dropdowns.forEach((dd) => {
      const button = $(".dd-toggle", dd);
      if (!button) return;
      button.addEventListener("click", () => {
        const open = !dd.classList.contains("open");
        closeDropdowns(dd);
        dd.classList.toggle("open", open);
        button.setAttribute("aria-expanded", String(open));
      });
    });

    document.addEventListener("click", (event) => {
      if (!event.target.closest(".dd")) closeDropdowns();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      closeDropdowns();
    });

    const closeOnDesktop = (event) => { if (event.matches) setOpen(false); };
    if (desktopQuery.addEventListener) {
      desktopQuery.addEventListener("change", closeOnDesktop);
    } else if (desktopQuery.addListener) {
      desktopQuery.addListener(closeOnDesktop);
    }
  }

  /* Contador animado de cifras */
  function countUp(el) {
    const target = Number(el.dataset.count);
    if (Number.isNaN(target)) return;
    const duration = 1600;
    const start = performance.now();

    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = String(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(step);
    };

    el.textContent = "0";
    requestAnimationFrame(step);
  }

  /* Aparición al hacer scroll + contadores + barras */
  function initReveal() {
    const items = $$(".reveal");
    if (!items.length) return;

    if (reduceMotion || !("IntersectionObserver" in window)) {
      items.forEach((el) => el.classList.add("in-view"));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("in-view");
        $$("[data-count]", entry.target).forEach(countUp);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -6% 0px" });

    items.forEach((el) => observer.observe(el));
  }

  /* Parallax suave de la imagen principal */
  function initParallax() {
    const hero = $(".hero");
    const media = $(".hero-media");
    if (!hero || !media || reduceMotion) return;
    let ticking = false;

    const update = () => {
      const y = window.scrollY;
      if (y <= hero.offsetHeight) media.style.setProperty("--py", `${(y * 0.12).toFixed(1)}px`);
      ticking = false;
    };

    window.addEventListener("scroll", () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }, { passive: true });
    update();
  }

  /* Iluminación que sigue el cursor y tarjetas 3D */
  function initPointerEffects() {
    if (reduceMotion || !finePointer) return;
    const hero = $(".hero");

    if (hero) {
      hero.addEventListener("pointermove", (event) => {
        const rect = hero.getBoundingClientRect();
        hero.style.setProperty("--mx", `${(((event.clientX - rect.left) / rect.width) * 100).toFixed(1)}%`);
        hero.style.setProperty("--my", `${(((event.clientY - rect.top) / rect.height) * 100).toFixed(1)}%`);
      }, { passive: true });
    }

    $$("[data-tilt]").forEach((card) => {
      card.addEventListener("pointermove", (event) => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width;
        const y = (event.clientY - rect.top) / rect.height;
        card.classList.add("is-tilting");
        card.style.setProperty("--ry", `${((x - 0.5) * 14).toFixed(2)}deg`);
        card.style.setProperty("--rx", `${((0.5 - y) * 14).toFixed(2)}deg`);
        card.style.setProperty("--gx", `${(x * 100).toFixed(1)}%`);
        card.style.setProperty("--gy", `${(y * 100).toFixed(1)}%`);
      }, { passive: true });

      card.addEventListener("pointerleave", () => {
        card.classList.remove("is-tilting");
        card.style.setProperty("--rx", "0deg");
        card.style.setProperty("--ry", "0deg");
      });
    });
  }

  /* Enlace activo del menú según la sección visible */
  function initActiveLinks() {
    if (!("IntersectionObserver" in window)) return;
    const links = $$('.menu a[href^="#"]');
    const sections = new Map();

    links.forEach((link) => {
      const href = link.getAttribute("href");
      if (!href || href === "#") return;
      const target = $(href);
      if (target) sections.set(target, link);
    });
    if (!sections.size) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((link) => link.removeAttribute("aria-current"));
        const link = sections.get(entry.target);
        if (link) link.setAttribute("aria-current", "true");
      });
    }, { rootMargin: "-45% 0px -50% 0px" });

    sections.forEach((_, section) => observer.observe(section));
  }

  /* Botón flotante de WhatsApp: aparece después del hero */
  function initWhatsappFlotante() {
    const btn = $(".wa-flotante");
    if (!btn) return;

    let ticking = false;

    const update = () => {
      const y = window.scrollY;
      const threshold = Math.max(window.innerHeight * 0.6, 400);
      btn.classList.toggle("is-visible", y > threshold);
      ticking = false;
    };

    window.addEventListener("scroll", () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }, { passive: true });
    update();
  }

  function init() {
    initHeader();
    initMenu();
    initReveal();
    initParallax();
    initPointerEffects();
    initActiveLinks();
    initWhatsappFlotante();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
