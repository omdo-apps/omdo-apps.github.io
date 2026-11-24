// OMDO Apps — starfield, header, menu, reveals, gallery
(() => {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---- starfield: three depth layers, slow drift, twinkle, scroll parallax ----
  const sky = document.getElementById("sky");
  if (sky) {
    const ctx = sky.getContext("2d");
    let w = 0, h = 0, dpr = 1, stars = [];
    const layers = [
      { speed: 0.012, size: [0.4, 0.9], alpha: [0.25, 0.55], par: 0.03 },
      { speed: 0.025, size: [0.7, 1.3], alpha: [0.4, 0.8], par: 0.07 },
      { speed: 0.05, size: [1.1, 1.8], alpha: [0.6, 1.0], par: 0.14 },
    ];
    const rnd = (a, b) => a + Math.random() * (b - a);
    const resize = () => {
      dpr = Math.min(devicePixelRatio || 1, 2);
      w = innerWidth; h = innerHeight;
      sky.width = w * dpr; sky.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(420, Math.round((w * h) / 4200));
      stars = Array.from({ length: count }, (_, i) => {
        const L = layers[i % 3];
        return {
          x: Math.random() * w, y: Math.random() * h, L,
          r: rnd(...L.size), a: rnd(...L.alpha),
          tw: rnd(0.4, 1.6), ph: Math.random() * Math.PI * 2,
          gold: Math.random() < 0.06,
        };
      });
    };
    let t0 = performance.now();
    const draw = (now) => {
      const t = (now - t0) / 1000;
      const sy = scrollY;
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        const x = (s.x + t * s.L.speed * 60) % w;
        let y = (s.y - sy * s.L.par) % h; if (y < 0) y += h;
        const a = reduce ? s.a : s.a * (0.65 + 0.35 * Math.sin(t * s.tw + s.ph));
        ctx.globalAlpha = a;
        ctx.fillStyle = s.gold ? "#ffe27a" : "#ffffff";
        ctx.beginPath(); ctx.arc(x, y, s.r, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (!reduce) requestAnimationFrame(draw);
    };
    resize();
    addEventListener("resize", () => { resize(); if (reduce) draw(performance.now()); });
    if (reduce) { draw(performance.now()); addEventListener("scroll", () => draw(performance.now()), { passive: true }); }
    else requestAnimationFrame(draw);
  }

  // ---- header background once scrolled ----
  const header = document.querySelector(".site-header");
  const onScroll = () => header && header.classList.toggle("scrolled", scrollY > 12);
  onScroll(); addEventListener("scroll", onScroll, { passive: true });

  // ---- mobile menu ----
  const btn = document.querySelector(".menu-btn");
  if (btn && header) {
    btn.addEventListener("click", () => {
      const open = header.classList.toggle("menu-open");
      btn.setAttribute("aria-expanded", open);
    });
    header.querySelectorAll(".nav-links a").forEach(a => a.addEventListener("click", () => {
      header.classList.remove("menu-open"); btn.setAttribute("aria-expanded", "false");
    }));
  }

  // ---- reveal on scroll ----
  const els = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduce) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    els.forEach(el => io.observe(el));
  } else els.forEach(el => el.classList.add("in"));

  // ---- gameplay videos: they have preload="none" and no autoplay, so nothing downloads
  //      until a video scrolls into view; then it plays, and pauses again when it leaves ----
  document.querySelectorAll(".phone video").forEach(video => {
    if (reduce) { video.controls = true; return; } // reduced motion: the visitor presses play
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([e]) => { e.isIntersecting ? video.play().catch(() => {}) : video.pause(); }, { threshold: 0.25 }).observe(video);
    } else video.play().catch(() => {});
  });

  // ---- gallery arrows (each pair scrolls the gallery in its own section) ----
  document.querySelectorAll("[data-scroll]").forEach(b => b.addEventListener("click", () => {
    const gallery = (b.closest("section") || document).querySelector(".gallery");
    if (!gallery) return;
    const fig = gallery.querySelector("figure");
    const step = fig ? fig.getBoundingClientRect().width + 20 : 300;
    gallery.scrollBy({ left: step * Number(b.dataset.scroll), behavior: reduce ? "auto" : "smooth" });
  }));

  // ---- year ----
  document.querySelectorAll("[data-year]").forEach(el => el.textContent = new Date().getFullYear());
})();
