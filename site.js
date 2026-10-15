(function () {
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var menuBtn = document.getElementById("menu-button");
  var menu = document.getElementById("site-nav");
  var main = document.getElementById("conteudo");
  var footer = document.querySelector(".site-footer");

  function setOpen(open) {
    document.body.classList.toggle("nav-open", open);
    menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
    menuBtn.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
    if (open) {
      main.setAttribute("inert", "");
      footer.setAttribute("inert", "");
      var link = menu.querySelector("a");
      if (link) link.focus();
    } else {
      main.removeAttribute("inert");
      footer.removeAttribute("inert");
    }
  }

  menuBtn.addEventListener("click", function () {
    setOpen(menuBtn.getAttribute("aria-expanded") !== "true");
  });

  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function () {
      if (document.body.classList.contains("nav-open")) setOpen(false);
    });
  });

  document.addEventListener("keydown", function (e) {
    if (!document.body.classList.contains("nav-open")) return;
    if (e.key === "Escape") {
      setOpen(false);
      menuBtn.focus();
      return;
    }
    if (e.key !== "Tab") return;
    var nodes = [menuBtn].concat([].slice.call(menu.querySelectorAll("a")));
    var first = nodes[0];
    var last = nodes[nodes.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  var desktop = window.matchMedia("(min-width: 1040px)");
  function onDesktop(e) {
    if (e.matches) setOpen(false);
  }
  if (desktop.addEventListener) desktop.addEventListener("change", onDesktop);
  else if (desktop.addListener) desktop.addListener(onDesktop);

  var slides = [
    { id: "isabelle-07", alt: "Isabelle Corine em pé, de conjunto off-white, sorrindo em um fundo bege." },
    { id: "isabelle-17", alt: "Isabelle Corine de blusa marrom, mãos no queixo, com um sorriso calmo." },
    { id: "isabelle-11", alt: "Close do rosto de Isabelle Corine, de camisa branca, sorrindo." },
    { id: "isabelle-09", alt: "Isabelle Corine de camisa branca, braços cruzados, com um sorriso suave." },
    { id: "isabelle-16", alt: "Close de Isabelle Corine de blusa marrom, mão no queixo, sorrindo." },
    { id: "isabelle-06", alt: "Retrato de Isabelle Corine de blazer magenta, com o olhar para a câmera." },
    { id: "isabelle-05", alt: "Isabelle Corine sentada em um banco, de blazer magenta, sorrindo." },
    { id: "isabelle-03", alt: "Isabelle Corine em corpo inteiro, de blazer magenta e calça jeans, com um modelo de cérebro na mão." },
    { id: "isabelle-02", alt: "Close de Isabelle Corine de blazer magenta, segurando um modelo de cérebro junto ao rosto." },
    { id: "isabelle-18", alt: "Isabelle Corine de blazer preto, uma mão no ombro, sorrindo." }
  ];

  var index = 0;
  var layerA = document.getElementById("slide-a");
  var layerB = document.getElementById("slide-b");
  var front = layerA;
  var busy = false;
  var timer = null;
  var paused = false;
  var hold = false;
  var stage = document.getElementById("stage");
  var count = document.getElementById("slide-now");
  var pauseBtn = document.getElementById("slide-pause");
  var pauseLabel = document.getElementById("pause-label");

  function sizes() {
    return "(max-width: 899px) 92vw, 500px";
  }

  function srcOf(slide) {
    return "fotos/1000/" + slide.id + "-1000.webp";
  }

  function setOf(slide) {
    return srcOf(slide) + " 1000w, fotos/2000/" + slide.id + "-2000.webp 2000w";
  }

  function paint(img, slide) {
    var src = srcOf(slide);
    if (img.getAttribute("src") !== src) img.src = src;
    img.srcset = setOf(slide);
    img.sizes = sizes();
    img.alt = slide.alt;
    if (!reduce) {
      img.classList.remove("ken-run");
      void img.offsetWidth;
      img.classList.add("ken-run");
    }
  }

  function preload(i) {
    var slide = slides[(i + slides.length) % slides.length];
    var im = new Image();
    im.srcset = setOf(slide);
    im.sizes = sizes();
    im.src = srcOf(slide);
  }

  function pad(n) {
    return (n < 10 ? "0" : "") + n;
  }

  function show(step) {
    if (busy) return;
    var next = (index + step + slides.length) % slides.length;
    index = next;
    count.textContent = pad(index + 1);
    var incoming = front === layerA ? layerB : layerA;
    var img = incoming.querySelector("img");
    paint(img, slides[index]);
    incoming.classList.toggle("ken-alt", index % 2 === 1);
    if (reduce) {
      front.classList.remove("is-current");
      front.querySelector("img").alt = "";
      incoming.classList.add("is-current");
      front = incoming;
      preload(index + 1);
      return;
    }
    busy = true;
    ["wipe-0", "wipe-1", "wipe-2"].forEach(function (c) {
      incoming.classList.remove(c);
    });
    var wipe = "wipe-" + (index % 3);
    incoming.classList.add("is-in", wipe);
    var done = false;
    function finish() {
      if (done) return;
      done = true;
      front.classList.remove("is-current");
      front.querySelector("img").alt = "";
      incoming.classList.remove("is-in", "wipe-0", "wipe-1", "wipe-2");
      incoming.classList.add("is-current");
      front = incoming;
      busy = false;
    }
    function onEnd(e) {
      if (e.target !== incoming) return;
      if (!e.animationName || e.animationName.indexOf("mask") !== 0) return;
      incoming.removeEventListener("animationend", onEnd);
      finish();
    }
    incoming.addEventListener("animationend", onEnd);
    window.setTimeout(finish, 1900);
    preload(index + 1);
  }

  function stop() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  function start() {
    stop();
    if (paused || hold || reduce || document.hidden) return;
    timer = setInterval(function () {
      show(1);
    }, 7000);
  }

  function setPaused(value) {
    paused = value;
    stage.classList.toggle("is-paused", value);
    pauseBtn.setAttribute("aria-pressed", value ? "true" : "false");
    pauseLabel.textContent = value ? "Retomar apresentação" : "Pausar apresentação";
    pauseBtn.querySelector(".icon-pause").hidden = value;
    pauseBtn.querySelector(".icon-play").hidden = !value;
    if (value) stop();
    else start();
  }

  document.getElementById("slide-next").addEventListener("click", function () {
    show(1);
    start();
  });
  document.getElementById("slide-prev").addEventListener("click", function () {
    show(-1);
    start();
  });
  pauseBtn.addEventListener("click", function () {
    setPaused(!paused);
  });

  stage.addEventListener("mouseenter", function () {
    hold = true;
    stop();
  });
  stage.addEventListener("mouseleave", function () {
    hold = false;
    start();
  });
  stage.addEventListener("focusin", function () {
    hold = true;
    stop();
  });
  stage.addEventListener("focusout", function (e) {
    if (!stage.contains(e.relatedTarget)) {
      hold = false;
      start();
    }
  });
  stage.addEventListener("keydown", function (e) {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      show(1);
      start();
    }
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      show(-1);
      start();
    }
  });
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) stop();
    else start();
  });

  preload(1);
  if (!reduce) start();

  var revealNodes = document.querySelectorAll(".reveal, .clip");
  if (reduce || !("IntersectionObserver" in window)) {
    revealNodes.forEach(function (el) {
      el.classList.add("is-in");
    });
  } else {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.16, rootMargin: "0px 0px -6% 0px" }
    );
    revealNodes.forEach(function (el) {
      io.observe(el);
    });
  }

  var motionOk = !reduce && window.matchMedia("(pointer: fine) and (min-width: 900px)").matches;
  if (motionOk) {
    var nodes = [].slice.call(document.querySelectorAll("[data-parallax]"));
    var ticking = false;
    function update() {
      var vh = window.innerHeight || 1;
      nodes.forEach(function (el) {
        var r = el.getBoundingClientRect();
        var p = (r.top + r.height / 2 - vh / 2) / vh;
        var shift = Math.max(-16, Math.min(16, -p * 20));
        el.style.transform = "translate3d(0," + shift.toFixed(2) + "px,0)";
      });
      ticking = false;
    }
    window.addEventListener(
      "scroll",
      function () {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(update);
        }
      },
      { passive: true }
    );
    update();
  }
})();
