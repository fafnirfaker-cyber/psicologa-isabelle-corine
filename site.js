(function () {
  var root = document.documentElement;
  var key = "isabelle-theme";
  var toggle = document.getElementById("theme-toggle");
  var meta = document.querySelector('meta[name="theme-color"]');
  var menuButton = document.getElementById("menu-button");
  var nav = document.getElementById("site-nav");

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    root.style.colorScheme = theme;
    if (meta) meta.setAttribute("content", theme === "dark" ? "#1A1210" : "#FBF4EC");
    if (!toggle) return;
    var dark = theme === "dark";
    toggle.setAttribute("aria-pressed", dark ? "true" : "false");
    toggle.setAttribute("aria-label", dark ? "Ativar tema claro" : "Ativar tema escuro");
  }

  applyTheme(root.getAttribute("data-theme") || "light");

  if (toggle) {
    toggle.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      try {
        localStorage.setItem(key, next);
      } catch (e) {}
      applyTheme(next);
    });
  }

  var scheme = window.matchMedia("(prefers-color-scheme: dark)");
  if (scheme.addEventListener) {
    scheme.addEventListener("change", function (event) {
      var saved = null;
      try {
        saved = localStorage.getItem(key);
      } catch (e) {}
      if (saved === "light" || saved === "dark") return;
      applyTheme(event.matches ? "dark" : "light");
    });
  }

  function closeMenu() {
    if (!menuButton || !nav) return false;
    var wasOpen = menuButton.getAttribute("aria-expanded") === "true";
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "Abrir menu");
    nav.classList.remove("is-open");
    return wasOpen;
  }

  function openMenu() {
    menuButton.setAttribute("aria-expanded", "true");
    menuButton.setAttribute("aria-label", "Fechar menu");
    nav.classList.add("is-open");
    var first = nav.querySelector("a");
    if (first) first.focus();
  }

  if (menuButton && nav) {
    menuButton.addEventListener("click", function () {
      if (menuButton.getAttribute("aria-expanded") === "true") {
        closeMenu();
        menuButton.focus();
      } else {
        openMenu();
      }
    });

    nav.addEventListener("click", function (event) {
      var link = event.target.closest("a");
      if (!link) return;
      var href = link.getAttribute("href") || "";
      closeMenu();
      if (href.charAt(0) === "#") {
        var target = document.getElementById(href.slice(1));
        if (target) {
          target.setAttribute("tabindex", "-1");
          target.focus({ preventScroll: true });
        }
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && menuButton.getAttribute("aria-expanded") === "true") {
        closeMenu();
        menuButton.focus();
      }
    });

    document.addEventListener("click", function (event) {
      if (menuButton.getAttribute("aria-expanded") !== "true") return;
      if (nav.contains(event.target) || menuButton.contains(event.target)) return;
      closeMenu();
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth >= 860) closeMenu();
    });
  }

  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    if (nav && nav.contains(link)) return;
    link.addEventListener("click", function () {
      var id = (link.getAttribute("href") || "").slice(1);
      var target = document.getElementById(id);
      if (!target) return;
      target.setAttribute("tabindex", "-1");
      window.setTimeout(function () {
        target.focus({ preventScroll: true });
      }, 0);
    });
  });

  if (!window.gsap || !window.ScrollTrigger) return;

  var gsap = window.gsap;
  var ScrollTrigger = window.ScrollTrigger;
  gsap.registerPlugin(ScrollTrigger);
  gsap.defaults({ ease: "power2.out", duration: 0.8 });

  function refreshTriggers() {
    ScrollTrigger.refresh();
  }

  window.addEventListener("load", refreshTriggers);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refreshTriggers);

  var mm = gsap.matchMedia();

  mm.add(
    {
      motion: "(prefers-reduced-motion: no-preference)",
      reduce: "(prefers-reduced-motion: reduce)",
      fine: "(hover: hover) and (pointer: fine)",
      desktop: "(min-width: 960px)"
    },
    function (context) {
      var c = context.conditions;
      var cleanups = [];
      var motion = !c.reduce && c.motion;

      mountHero(motion, cleanups);
      mountSteps(motion, cleanups);

      if (motion) {
        var intro = gsap.timeline({ defaults: { ease: "power3.out", duration: 0.9 } });
        intro
          .from("[data-intro]", { autoAlpha: 0, y: 22, stagger: 0.08 }, 0);

        gsap.utils.toArray(".float-blob").forEach(function (blob, i) {
          gsap.to(blob, {
            y: i % 2 ? 16 : -18,
            duration: 4.2 + i * 0.4,
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1
          });
        });

        var reveals = gsap.utils.toArray("[data-reveal]");
        gsap.set(reveals, { autoAlpha: 0, y: 28 });
        ScrollTrigger.batch("[data-reveal]", {
          start: "top 86%",
          once: true,
          onEnter: function (batch) {
            gsap.to(batch, {
              autoAlpha: 1,
              y: 0,
              duration: 0.85,
              stagger: 0.12,
              ease: "power2.out",
              overwrite: true
            });
          }
        });

        if (c.desktop) {
          gsap.to(".blob-a", {
            y: -70,
            ease: "none",
            scrollTrigger: {
              trigger: ".hero",
              start: "top top",
              end: "bottom top",
              scrub: 0.6
            }
          });
          gsap.to(".blob-d", {
            y: 40,
            ease: "none",
            scrollTrigger: {
              trigger: "#atendimento",
              start: "top bottom",
              end: "bottom top",
              scrub: 0.8
            }
          });
        }

        mountMarquee(cleanups);

        if (c.fine) mountHover(cleanups);
      }

      return function () {
        cleanups.forEach(function (fn) {
          fn();
        });
      };
    }
  );

  function mountHero(motion, cleanups) {
    var rootEl = document.querySelector("[data-hero-carousel]");
    if (!rootEl) return;
    var slides = gsap.utils.toArray(rootEl.querySelectorAll(".hero-slide"));
    var images = slides.map(function (slide) {
      return slide.querySelector("img");
    });
    var count = slides.length;
    if (!count) return;
    var index = 0;
    var timer = null;
    var ken = null;
    var transition = null;
    var hold = 5.2;

    function setSlideState(active) {
      slides.forEach(function (slide, i) {
        var on = i === active;
        slide.classList.toggle("is-current", on);
      });
    }

    function playKen(img) {
      if (ken) ken.kill();
      ken = null;
      if (!motion || !img) return;
      ken = gsap.fromTo(
        img,
        { scale: 1.08 },
        { scale: 1.02, duration: 6.2, ease: "none" }
      );
    }

    function disarm() {
      if (timer) timer.kill();
      timer = null;
    }

    function arm() {
      disarm();
      if (!motion || count < 2) return;
      timer = gsap.delayedCall(hold, function () {
        go(index + 1);
        arm();
      });
    }

    function go(next) {
      next = (next + count) % count;
      if (next === index) return;
      var prev = index;
      index = next;
      setSlideState(index);
      if (transition) transition.kill();
      if (!motion) {
        gsap.set(slides, { autoAlpha: 0 });
        gsap.set(slides[index], { autoAlpha: 1 });
        return;
      }
      transition = gsap.timeline({ defaults: { ease: "power2.inOut", overwrite: "auto" } });
      transition
        .to(slides[prev], { autoAlpha: 0, duration: 1.15 }, 0)
        .fromTo(slides[index], { autoAlpha: 0 }, { autoAlpha: 1, duration: 1.15 }, 0);
      playKen(images[index]);
    }

    gsap.set(slides, { autoAlpha: 0 });
    gsap.set(slides[0], { autoAlpha: 1 });
    setSlideState(0);
    rootEl.classList.add("is-ready");

    if (motion) {
      playKen(images[0]);
      arm();
    }

    cleanups.push(function () {
      disarm();
      if (ken) ken.kill();
      if (transition) transition.kill();
    });
  }

  function mountSteps(motion, cleanups) {
    var rootEl = document.querySelector("[data-steps-carousel]");
    if (!rootEl) return;
    var viewport = rootEl.querySelector(".steps-viewport");
    var track = rootEl.querySelector(".steps-track");
    var cards = gsap.utils.toArray(track.children);
    var dotsWrap = rootEl.querySelector("[data-step-dots]");
    var live = rootEl.querySelector("[data-steps-live]");
    var index = 0;

    cards.forEach(function (card, i) {
      var dot = document.createElement("button");
      dot.type = "button";
      dot.setAttribute("role", "tab");
      var title = card.querySelector("h3");
      dot.setAttribute("aria-label", "Passo " + (i + 1) + " de " + cards.length + (title ? ": " + title.textContent : ""));
      dot.addEventListener("click", function () {
        go(i);
      });
      dotsWrap.appendChild(dot);
    });

    function offsetFor(i) {
      var gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap) || 0;
      return i * (viewport.getBoundingClientRect().width + gap);
    }

    function paint(i, animate, announce) {
      index = Math.max(0, Math.min(cards.length - 1, i));
      var x = -offsetFor(index);
      if (motion && animate) {
        gsap.to(track, { x: x, duration: 0.65, ease: "power3.out", overwrite: true });
      } else {
        gsap.set(track, { x: x });
      }
      cards.forEach(function (card, n) {
        card.setAttribute("aria-hidden", n === index ? "false" : "true");
      });
      gsap.utils.toArray(dotsWrap.children).forEach(function (dot, n) {
        dot.setAttribute("aria-selected", n === index ? "true" : "false");
      });
      var prev = rootEl.querySelector("[data-step-prev]");
      var next = rootEl.querySelector("[data-step-next]");
      prev.disabled = index === 0;
      next.disabled = index === cards.length - 1;
      var title = cards[index].querySelector("h3");
      if (announce && live && title) {
        live.textContent = "Passo " + (index + 1) + " de " + cards.length + ": " + title.textContent;
      }
    }

    function go(i) {
      paint(i, true, true);
    }

    rootEl.classList.add("is-ready");
    paint(0, false, false);

    function onPrev() {
      go(index - 1);
    }
    function onNext() {
      go(index + 1);
    }
    function onKey(event) {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        go(index + 1);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        go(index - 1);
      }
    }
    var startX = 0;
    var tracking = false;
    function onDown(event) {
      if (event.target.closest("button, a")) return;
      tracking = true;
      startX = event.clientX;
    }
    function onUp(event) {
      if (!tracking) return;
      tracking = false;
      var dx = event.clientX - startX;
      if (dx < -42) go(index + 1);
      else if (dx > 42) go(index - 1);
    }
    function onResize() {
      paint(index, false);
    }

    rootEl.querySelector("[data-step-prev]").addEventListener("click", onPrev);
    rootEl.querySelector("[data-step-next]").addEventListener("click", onNext);
    rootEl.addEventListener("keydown", onKey);
    viewport.addEventListener("pointerdown", onDown);
    viewport.addEventListener("pointerup", onUp);
    window.addEventListener("resize", onResize);

    cleanups.push(function () {
      rootEl.classList.remove("is-ready");
      rootEl.querySelector("[data-step-prev]").removeEventListener("click", onPrev);
      rootEl.querySelector("[data-step-next]").removeEventListener("click", onNext);
      rootEl.removeEventListener("keydown", onKey);
      viewport.removeEventListener("pointerdown", onDown);
      viewport.removeEventListener("pointerup", onUp);
      window.removeEventListener("resize", onResize);
      dotsWrap.innerHTML = "";
      gsap.set(track, { clearProps: "transform" });
    });
  }

  function mountMarquee(cleanups) {
    var marquee = document.querySelector("[data-marquee]");
    if (!marquee) return;
    var track = marquee.querySelector(".marquee-track");
    marquee.classList.add("is-ready");
    void track.offsetWidth;
    var tween = gsap.to(track, {
      xPercent: -50,
      ease: "none",
      duration: 28,
      repeat: -1
    });
    function pause() {
      tween.pause();
    }
    function play() {
      tween.play();
    }
    marquee.addEventListener("pointerenter", pause);
    marquee.addEventListener("pointerleave", play);
    marquee.addEventListener("focusin", pause);
    marquee.addEventListener("focusout", play);
    cleanups.push(function () {
      marquee.classList.remove("is-ready");
      marquee.removeEventListener("pointerenter", pause);
      marquee.removeEventListener("pointerleave", play);
      marquee.removeEventListener("focusin", pause);
      marquee.removeEventListener("focusout", play);
    });
  }

  function mountHover(cleanups) {
    gsap.utils.toArray(".lift").forEach(function (el) {
      var xTo = gsap.quickTo(el, "x", { duration: 0.45, ease: "power3.out" });
      var yTo = gsap.quickTo(el, "y", { duration: 0.45, ease: "power3.out" });
      function move(event) {
        var rect = el.getBoundingClientRect();
        xTo((event.clientX - rect.left) / rect.width * 12 - 6);
        yTo((event.clientY - rect.top) / rect.height * 10 - 5);
      }
      function leave() {
        xTo(0);
        yTo(0);
      }
      el.addEventListener("pointermove", move);
      el.addEventListener("pointerleave", leave);
      cleanups.push(function () {
        el.removeEventListener("pointermove", move);
        el.removeEventListener("pointerleave", leave);
      });
    });

    gsap.utils.toArray(".btn").forEach(function (el) {
      var yTo = gsap.quickTo(el, "y", { duration: 0.35, ease: "power3.out" });
      function enter() {
        yTo(-3);
      }
      function leave() {
        yTo(0);
      }
      el.addEventListener("pointerenter", enter);
      el.addEventListener("pointerleave", leave);
      cleanups.push(function () {
        el.removeEventListener("pointerenter", enter);
        el.removeEventListener("pointerleave", leave);
      });
    });

    gsap.utils.toArray(".zoom").forEach(function (fig) {
      var img = fig.querySelector("img");
      if (!img) return;
      function enter() {
        gsap.to(img, { scale: 1.06, duration: 0.6, ease: "power2.out", overwrite: "auto" });
      }
      function leave() {
        gsap.to(img, { scale: 1, duration: 0.6, ease: "power2.out", overwrite: "auto" });
      }
      fig.addEventListener("pointerenter", enter);
      fig.addEventListener("pointerleave", leave);
      cleanups.push(function () {
        fig.removeEventListener("pointerenter", enter);
        fig.removeEventListener("pointerleave", leave);
      });
    });
  }
})();
