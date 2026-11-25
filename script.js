// Mobile Navigation Toggle
const menuToggle = document.getElementById("menu-toggle");
const navLinks = document.getElementById("nav-links");

if (menuToggle && navLinks) {
  menuToggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });

  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
    });
  });
}

// Toast Notification Helper
const toast = document.getElementById("toast");
let toastTimer;

function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2200);
}

// Dark / Light Theme Toggle
const themeToggle = document.getElementById("theme-toggle");
const themeLabel = document.getElementById("theme-label");

if (themeToggle && themeLabel) {
  const savedTheme = localStorage.getItem("dz_theme");
  if (savedTheme === "light") {
    document.body.setAttribute("data-theme", "light");
    themeLabel.textContent = "Dark";
  }

  themeToggle.addEventListener("click", () => {
    const isLight = document.body.getAttribute("data-theme") === "light";
    if (isLight) {
      document.body.removeAttribute("data-theme");
      themeLabel.textContent = "Light";
      localStorage.setItem("dz_theme", "dark");
    } else {
      document.body.setAttribute("data-theme", "light");
      themeLabel.textContent = "Dark";
      localStorage.setItem("dz_theme", "light");
    }
  });
}

// Interactive Laser Speckle & Blood-Flow Canvas (DCS vs Pulsed-SCOS)
const speckleCanvas = document.getElementById("speckle-canvas");
const modeButtons = document.querySelectorAll(".mode-btn");
const telemetryDetection = document.getElementById("telemetry-detection");
const telemetrySnr = document.getElementById("telemetry-snr");

let simMode = "scos";

const modeMetadata = {
  dcs: {
    detection: "Single-Mode Fiber",
    snr: "1 SPECKLE CHANNEL",
  },
  scos: {
    detection: "CMOS Camera Array",
    snr: "MULTI-SPECKLE SNR",
  },
};

modeButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    simMode = btn.dataset.mode || "scos";
    modeButtons.forEach((b) => b.classList.toggle("active", b === btn));
    const meta = modeMetadata[simMode];
    if (meta) {
      if (telemetryDetection) telemetryDetection.textContent = meta.detection;
      if (telemetrySnr) telemetrySnr.textContent = meta.snr;
    }
  });
});

if (speckleCanvas) {
  const ctx = speckleCanvas.getContext("2d");
  const particles = Array.from({ length: 84 }, (_, index) => ({
    x: ((index * 53) % 390) + 15,
    y: ((index * 37) % 130) + 14,
    radius: 1.5 + (index % 3) * 0.85,
    phase: index * 0.45,
  }));

  let time = 0;
  const renderSimulation = () => {
    if (!ctx) return;
    const width = speckleCanvas.width;
    const height = speckleCanvas.height;

    ctx.clearRect(0, 0, width, height);
    const bgGrad = ctx.createRadialGradient(width * 0.5, height * 0.35, 20, width * 0.5, height * 0.5, width * 0.72);
    bgGrad.addColorStop(0, "#091711");
    bgGrad.addColorStop(1, "#030806");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    particles.forEach((p, idx) => {
      const shimmer = 0.28 + 0.72 * Math.abs(Math.sin(time * 2.1 + p.phase));
      if (simMode === "scos") {
        const isGold = idx % 4 === 0;
        ctx.save();
        ctx.shadowBlur = 8;
        ctx.shadowColor = isGold ? "rgba(229, 185, 92, 0.55)" : "rgba(52, 211, 153, 0.55)";
        ctx.fillStyle = isGold ? `rgba(229, 185, 92, ${shimmer * 0.9})` : `rgba(52, 211, 153, ${shimmer})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else {
        const isCenterFiber = idx === 42;
        ctx.fillStyle = isCenterFiber ? "rgba(52, 211, 153, 0.95)" : "rgba(152, 174, 163, 0.14)";
        ctx.beginPath();
        ctx.arc(p.x, p.y, isCenterFiber ? 4 : p.radius * 0.8, 0, Math.PI * 2);
        ctx.fill();
        if (isCenterFiber) {
          ctx.strokeStyle = "rgba(52, 211, 153, 0.52)";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 13, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    });

    // Subtle baseline guide
    ctx.strokeStyle = "rgba(167, 243, 208, 0.08)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 190);
    ctx.lineTo(width, 190);
    ctx.stroke();

    // Pulsatile cerebral blood flow waveform
    ctx.save();
    ctx.beginPath();
    ctx.strokeStyle = simMode === "scos" ? "#34D399" : "#98AEA3";
    ctx.lineWidth = simMode === "scos" ? 2.2 : 1.4;
    if (simMode === "scos") {
      ctx.shadowBlur = 10;
      ctx.shadowColor = "rgba(52, 211, 153, 0.45)";
    }

    for (let x = 0; x < width; x += 3) {
      const cycle = ((x * 0.045 - time * 2.4) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
      const systolic = Math.exp(-Math.pow((cycle - 1.1) * 2.6, 2)) * 20;
      const dicrotic = Math.exp(-Math.pow((cycle - 2.2) * 2.3, 2)) * 8;
      const noise = simMode === "dcs" ? Math.sin(x * 0.9 + time * 12) * 3.8 : Math.sin(x * 0.7 + time * 8) * 0.5;
      const y = 190 - systolic - dicrotic + noise;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();

    time += 0.025;
    requestAnimationFrame(renderSimulation);
  };

  requestAnimationFrame(renderSimulation);
}

// Copy Email
const copyEmailBtn = document.getElementById("copy-email-btn");
const emailText = document.getElementById("email-text");
if (copyEmailBtn && emailText) {
  copyEmailBtn.addEventListener("click", async () => {
    const email = emailText.textContent.trim();
    try {
      await navigator.clipboard.writeText(email);
      showToast(`Copied ${email}`);
    } catch {
      showToast(email);
    }
  });
}

// Current Year
const yearEl = document.getElementById("year");
if (yearEl) {
  yearEl.textContent = String(new Date().getFullYear());
}

// Scroll Reveal, Progress Bar, Parallax & Active Nav Highlighting
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const revealTargets = document.querySelectorAll(".reveal");

document.querySelectorAll(".entry-list, .two-col").forEach((group) => {
  Array.from(group.children).forEach((child, idx) => {
    child.style.setProperty("--reveal-delay", `${Math.min(idx * 80, 240)}ms`);
  });
});

if (!prefersReducedMotion && "IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -30px 0px" }
  );

  revealTargets.forEach((el) => revealObserver.observe(el));
} else {
  revealTargets.forEach((el) => el.classList.add("is-visible"));
}

const scrollProgress = document.getElementById("scroll-progress");
const siteHeader = document.getElementById("site-header");
const glowPrimary = document.querySelector(".glow-primary");
const glowSecondary = document.querySelector(".glow-secondary");
const sections = Array.from(document.querySelectorAll("main section[id]"));
const navAnchors = Array.from(document.querySelectorAll(".nav-links a[href^='#']"));

let scrollTicking = false;
function handleScrollEffects() {
  const scrollY = window.scrollY;
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const progress = maxScroll > 0 ? Math.min(Math.max(scrollY / maxScroll, 0), 1) : 0;

  if (scrollProgress) {
    scrollProgress.style.transform = `scaleX(${progress})`;
  }

  if (siteHeader) {
    siteHeader.classList.toggle("is-scrolled", scrollY > 24);
  }

  if (!prefersReducedMotion) {
    if (glowPrimary) {
      glowPrimary.style.transform = `translate3d(0, ${scrollY * 0.1}px, 0)`;
    }
    if (glowSecondary) {
      glowSecondary.style.transform = `translate3d(0, ${-scrollY * 0.08}px, 0)`;
    }
  }

  const probeY = scrollY + window.innerHeight * 0.35;
  let activeId = "";
  sections.forEach((sec) => {
    if (probeY >= sec.offsetTop) {
      activeId = sec.id;
    }
  });

  navAnchors.forEach((anchor) => {
    anchor.classList.toggle("is-active", anchor.getAttribute("href") === `#${activeId}`);
  });

  scrollTicking = false;
}

window.addEventListener(
  "scroll",
  () => {
    if (!scrollTicking) {
      scrollTicking = true;
      requestAnimationFrame(handleScrollEffects);
    }
  },
  { passive: true }
);

handleScrollEffects();
