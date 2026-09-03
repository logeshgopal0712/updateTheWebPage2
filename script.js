const menuButton = document.querySelector(".menu-button");
const mobileMenu = document.querySelector("#mobile-menu");

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const target = document.querySelector(link.getAttribute("href"));
    if (!target) {
      return;
    }
    event.preventDefault();
    document
      .querySelectorAll(".desktop-nav a, .mobile-nav a")
      .forEach((item) => {
        item.classList.toggle(
          "active",
          item.getAttribute("href") === link.getAttribute("href"),
        );
      });
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

function updateCarouselControls(carousel) {
  const track = carousel.querySelector("[data-carousel-track]");
  const previous = carousel.querySelector('[data-carousel-direction="-1"]');
  const next = carousel.querySelector('[data-carousel-direction="1"]');
  if (!track || !previous || !next) return;
  const maximumScroll = Math.max(0, track.scrollWidth - track.clientWidth);
  previous.disabled = track.scrollLeft <= 2;
  next.disabled = track.scrollLeft >= maximumScroll - 2;
}

function initializeCarousels() {
  document.querySelectorAll("[data-carousel]").forEach(updateCarouselControls);
}

document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-carousel-direction]");
  if (button && !button.disabled) {
    const carousel = button.closest("[data-carousel]");
    const track = carousel.querySelector("[data-carousel-track]");
    const firstItem = track.firstElementChild;
    const gap = Number.parseFloat(getComputedStyle(track).gap) || 0;
    const distance = (firstItem?.getBoundingClientRect().width || track.clientWidth) + gap;
    const maximumScroll = Math.max(0, track.scrollWidth - track.clientWidth);
    const target = Math.max(
      0,
      Math.min(
        maximumScroll,
        track.scrollLeft +
          distance * Number(button.dataset.carouselDirection),
      ),
    );
    track.scrollTo({
      left: target,
      behavior: "smooth",
    });
    window.setTimeout(() => updateCarouselControls(carousel), 350);
  }
});

document.addEventListener(
  "scroll",
  (event) => {
    if (event.target.matches?.("[data-carousel-track]")) {
      updateCarouselControls(event.target.closest("[data-carousel]"));
    }
  },
  true,
);

window.addEventListener("resize", initializeCarousels);

document.querySelectorAll("[data-contact-action]").forEach((button) => {
  button.addEventListener("click", () => {
    if (
      button.dataset.contactAction === "call" &&
      window.matchMedia("(hover: none) and (pointer: coarse)").matches
    ) {
      window.location.href = button.dataset.contactHref;
      return;
    }

    const details = document.querySelector(
      `#${button.getAttribute("aria-controls")}`,
    );
    const willOpen = details.hidden;
    document.querySelectorAll(".contact-action-details").forEach((item) => {
      item.hidden = true;
    });
    document.querySelectorAll("[data-contact-action]").forEach((item) => {
      item.setAttribute("aria-expanded", "false");
    });
    details.hidden = !willOpen;
    button.setAttribute("aria-expanded", String(willOpen));
  });
});

document.querySelectorAll("[data-copy-value]").forEach((button) => {
  button.addEventListener("click", async () => {
    const value = button.dataset.copyValue;
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const field = document.createElement("textarea");
      field.value = value;
      field.style.position = "fixed";
      field.style.opacity = "0";
      document.body.append(field);
      field.select();
      document.execCommand("copy");
      field.remove();
    }
    const originalText = button.textContent;
    button.textContent = "Copied";
    window.setTimeout(() => {
      button.textContent = originalText;
    }, 1400);
  });
});

if (menuButton && mobileMenu) {
  menuButton.addEventListener("click", () => {
    const isOpen = menuButton.getAttribute("aria-expanded") === "true";
    menuButton.setAttribute("aria-expanded", String(!isOpen));
    mobileMenu.hidden = isOpen;
  });

  mobileMenu.addEventListener("click", (event) => {
    if (event.target.matches("a")) {
      menuButton.setAttribute("aria-expanded", "false");
      mobileMenu.hidden = true;
    }
  });
}

const copyrightYears = document.querySelector("#copyright-years");
const currentYear = new Date().getFullYear();
const startYear = Number(copyrightYears.dataset.startYear);
copyrightYears.textContent =
  startYear < currentYear ? `${startYear}–${currentYear}` : String(currentYear);
initializeCarousels();


function escapeHtml(value) {
  return String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[character],
  );
}

async function loadJson(path) {
  if (window.location.protocol === "file:") {
    throw new Error(
      "Open this website through start.command or a web host to load JSON data.",
    );
  }
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Could not load ${path} (${response.status}).`);
  }
  return response.json();
}

function safeHttpUrl(value) {
  if (!value) return "";
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

function safeAssetUrl(value) {
  if (!value) return "";
  try {
    const url = new URL(value, window.location.href);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

function youtubeEmbedUrl(value) {
  const safeUrl = safeHttpUrl(value);
  if (!safeUrl) return "";
  const url = new URL(safeUrl);
  const host = url.hostname.replace(/^www\./, "");
  let videoId = "";
  if (host === "youtu.be") {
    videoId = url.pathname.split("/").filter(Boolean)[0] || "";
  } else if (["youtube.com", "m.youtube.com"].includes(host)) {
    if (url.pathname === "/watch") {
      videoId = url.searchParams.get("v") || "";
    } else if (
      url.pathname.startsWith("/embed/") ||
      url.pathname.startsWith("/shorts/")
    ) {
      videoId = url.pathname.split("/").filter(Boolean)[1] || "";
    }
  }
  return /^[A-Za-z0-9_-]{6,20}$/.test(videoId)
    ? `https://www.youtube-nocookie.com/embed/${videoId}`
    : "";
}

function renderServiceMedia(service) {
  const video = safeHttpUrl(service.video);
  const youtube = youtubeEmbedUrl(video);
  if (youtube) {
    return `<div class="service-media service-video"><iframe src="${escapeHtml(youtube)}" title="${escapeHtml(service.title)} video" loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`;
  }
  const host = video ? new URL(video).hostname : "";
  if (video && (host.endsWith("facebook.com") || host.endsWith("fb.watch"))) {
    const embed = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(video)}&show_text=false`;
    return `<div class="service-media service-video"><iframe src="${escapeHtml(embed)}" title="${escapeHtml(service.title)} video" loading="lazy" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe></div>`;
  }
  const image = safeAssetUrl(service.image);
  return image
    ? `<div class="service-media"><img src="${escapeHtml(image)}" alt="${escapeHtml(service.title)}" loading="lazy" /></div>`
    : "";
}

async function renderServices() {
  const list = document.querySelector("#service-list");
  const status = document.querySelector("#services-status");
  if (!list) return;
  try {
    const services = await loadJson("data/services/services.json");
    if (!Array.isArray(services)) throw new Error("services.json must contain a list.");
    list.innerHTML = services
      .map(
        (service, index) => `
          <article class="service-card">
            ${renderServiceMedia(service)}
            <div class="service-card-content">
              <span class="service-number">${String(index + 1).padStart(2, "0")}</span>
              <h3>${escapeHtml(service.title)}</h3>
              <p>${escapeHtml(service.description)}</p>
              <div class="service-card-footer">
                ${service.price ? `<strong class="service-price">${escapeHtml(service.price)}</strong>` : ""}
                ${
                  safeHttpUrl(service.link)
                    ? `<a class="service-link" href="${escapeHtml(safeHttpUrl(service.link))}" target="_blank" rel="noopener noreferrer">View service <span aria-hidden="true">↗</span></a>`
                    : ""
                }
              </div>
            </div>
          </article>`,
      )
      .join("");
    status.hidden = true;
  } catch (error) {
    status.textContent = error.message;
    status.classList.add("error");
  }
}

async function renderReviews() {
  const list = document.querySelector("#review-list");
  const status = document.querySelector("#reviews-status");
  if (!list) return;
  try {
    const reviews = await loadJson("data/reviews/reviews.json");
    if (!Array.isArray(reviews)) throw new Error("reviews.json must contain a list.");
    list.innerHTML = reviews
      .map(
        (item) => `
          <blockquote>
            <span class="quote-mark">“</span>
            <p>${escapeHtml(item.review)}</p>
            <footer>— ${escapeHtml(item.name)}</footer>
          </blockquote>`,
      )
      .join("");
    status.hidden = true;
  } catch (error) {
    status.textContent = error.message;
    status.classList.add("error");
  }
}

async function renderGallery() {
  const list = document.querySelector("#gallery-list");
  const status = document.querySelector("#gallery-status");
  if (!list) return;
  try {
    const images = await loadJson("data/gallery/gallery.json");
    if (!Array.isArray(images)) throw new Error("gallery.json must contain a list.");
    list.innerHTML = images
      .map(
        (image) => `
          <figure>
            <img src="${escapeHtml(image.src)}" alt="${escapeHtml(image.alt || "")}" loading="lazy" />
          </figure>`,
      )
      .join("");
    status.hidden = true;
  } catch (error) {
    status.textContent = error.message;
    status.classList.add("error");
  }
}

async function loadHomeSections() {
  const container = document.querySelector("#home-sections");
  if (!container) return;
  const status = document.querySelector("#home-sections-status");
  const pages = (container.dataset.pages || "").split(",").filter(Boolean);
  try {
    const pageDocuments = await Promise.all(
      pages.map(async (page) => {
        const response = await fetch(page, { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`Could not load ${page} (${response.status}).`);
        }
        const source = await response.text();
        const parsed = new DOMParser().parseFromString(source, "text/html");
        const main = parsed.querySelector("main");
        if (!main) throw new Error(`${page} does not contain a main section.`);
        return { page, content: main.innerHTML };
      }),
    );

    status.remove();
    pageDocuments.forEach(({ page, content }) => {
      const section = document.createElement("section");
      section.className = "home-page-section";
      section.id = page.replace(/\.html$/, "");
      section.innerHTML = content;
      container.append(section);
    });
  } catch (error) {
    status.textContent = error.message;
    status.classList.add("error");
  }
}

function initializeHomeNavigation() {
  const container = document.querySelector("#home-sections");
  if (!container) return;
  const targets = [
    document.querySelector("#top"),
    ...container.querySelectorAll(".home-page-section"),
  ].filter(Boolean);
  let currentId = "";
  let frameRequested = false;

  function updateActiveNavigation() {
    frameRequested = false;
    const marker = window.scrollY + 100;
    let activeTarget = targets[0];
    for (const target of targets) {
      if (target.offsetTop <= marker) {
        activeTarget = target;
      } else {
        break;
      }
    }

    if (
      window.innerHeight + window.scrollY >=
      document.documentElement.scrollHeight - 4
    ) {
      activeTarget = targets[targets.length - 1];
    }

    if (!activeTarget || activeTarget.id === currentId) return;
    currentId = activeTarget.id;
    const href = `#${currentId}`;
    document.body.dataset.currentSection = currentId;
    document
      .querySelectorAll(".desktop-nav a, .mobile-nav a")
      .forEach((link) => {
        const isActive = link.getAttribute("href") === href;
        link.classList.toggle("active", isActive);
        if (isActive) {
          link.setAttribute("aria-current", "page");
        } else {
          link.removeAttribute("aria-current");
        }
      });
  }

  function requestNavigationUpdate() {
    if (frameRequested) return;
    frameRequested = true;
    window.requestAnimationFrame(updateActiveNavigation);
  }

  window.addEventListener("scroll", requestNavigationUpdate, { passive: true });
  window.addEventListener("resize", requestNavigationUpdate);
  updateActiveNavigation();
}

async function initializeDataPages() {
  await loadHomeSections();
  await Promise.all([renderServices(), renderReviews(), renderGallery()]);
  initializeCarousels();
  initializeHomeNavigation();
  if (window.location.hash) {
    document.querySelector(window.location.hash)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }
}

initializeDataPages();
