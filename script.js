function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

const storage = {
  get(key) {
    try { return localStorage.getItem(key); } catch { return null; }
  },
  set(key, value) {
    try { localStorage.setItem(key, value); } catch { }
  }
};

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

function preload(src) {
  return new Promise(resolve => {
    const probe = new Image();
    probe.onload = () => resolve(true);
    probe.onerror = () => resolve(false);
    probe.src = src;
  });
}

const ageGate = document.getElementById("age-gate");
const ageCheck = document.getElementById("age-check");
const enterBtn = document.getElementById("enter-btn");

if (ageGate) {
  ageGate.style.display = storage.get("ageVerified") ? "none" : "flex";
}

if (enterBtn) {
  enterBtn.addEventListener("click", () => {
    if (ageCheck && ageCheck.checked) {
      storage.set("ageVerified", "true");
      ageGate.style.display = "none";
    } else {
      alert("You must confirm your age before proceeding.");
    }
  });
}

const onderzoekPopup = document.getElementById("onderzoek-popup");
const onderzoekEnterBtn = document.getElementById("onderzoek-enter-btn");

if (onderzoekPopup && onderzoekEnterBtn) {
  onderzoekEnterBtn.addEventListener("click", () => {
    onderzoekPopup.style.display = "none";
  });
}

function withVariants(items, type) {
  return items.map(f => ({
    ...f,
    type,
    thumb: f.thumb || f.src.replace(`/${type}/`, `/${type}/thumb/`),
    low: f.low || f.src.replace(`/${type}/`, `/${type}/low/`)
  }));
}

async function loadImages() {
  try {
    const res = await fetch("data/public/manifest.json");
    const data = await res.json();

    const images = shuffle([
      ...withVariants(data.works, "works"),
      ...withVariants(data.sources, "sources")
    ]);

    renderImages(images);
    return images;
  } catch (err) {
    console.error("Error loading manifest.json", err);
    return [];
  }
}

async function upgradeImage(img) {
  for (const src of [img.dataset.low, img.dataset.full]) {
    if (!src) continue;
    if (!(await preload(src))) return;

    img.classList.add("fade");
    await wait(150);
    img.src = src;
    img.classList.remove("fade");
  }
}

function createProgressiveImage(imgData) {
  const img = document.createElement("img");
  img.dataset.low = imgData.low;
  img.dataset.full = imgData.src;

  img.addEventListener("load", () => upgradeImage(img), { once: true });
  img.src = imgData.thumb;

  return img;
}

const grid = document.getElementById("grid");

function renderImages(images) {
  grid.innerHTML = "";

  images.forEach(imgData => {
    const wrapper = document.createElement("div");
    wrapper.className = `img-wrapper ${imgData.type}`;

    const img = createProgressiveImage(imgData);
    img.alt = imgData.title || "Untitled";
    if (imgData.original) img.dataset.original = imgData.original;

    const caption = document.createElement("p");
    caption.textContent = imgData.title || "Untitled";

    wrapper.append(img, caption);
    grid.appendChild(wrapper);
  });
}

grid.addEventListener("click", e => {
  const img = e.target.closest("img");
  if (!img) return;

  showLightbox(
    img.dataset.low,
    img.dataset.full,
    img.alt || "Untitled",
    img.dataset.original || null
  );
});

function showLightbox(lowSrc, fullSrc, captionText, originalSrc = null) {
  document.getElementById("lightbox")?.remove();

  const overlay = document.createElement("div");
  overlay.id = "lightbox";

  const img = document.createElement("img");
  img.src = fullSrc;
  img.alt = captionText;
  img.className = "lightbox-img";
  img.style.backgroundImage = `url(${originalSrc ? fullSrc : lowSrc})`;

  const caption = document.createElement("p");
  caption.textContent = captionText;

  overlay.append(img, caption);

  if (originalSrc) {
    const originalLink = document.createElement("a");
    originalLink.href = originalSrc;
    originalLink.target = "_blank";
    originalLink.rel = "noopener";
    originalLink.textContent = "original";
    originalLink.className = "lightbox-original-link";
    overlay.appendChild(originalLink);
  } else {
    const notice = document.createElement("em");
    notice.style.whiteSpace = "pre";
    notice.textContent =
      "KENNISGEVING OVER DE INHOUD: VERWIJDERD MATERIAAL \n" +
      "Deze afbeelding is verwijderd vanwege gevoelige inhoud";
    overlay.appendChild(notice);
  }

  const close = () => {
    overlay.remove();
    document.removeEventListener("keydown", onKey);
  };
  const onKey = e => { if (e.key === "Escape") close(); };

  overlay.addEventListener("click", close);
  document.addEventListener("keydown", onKey);
  document.body.appendChild(overlay);
}

function spawnPopup(imgData) {
  const container = document.getElementById("popup-container");
  if (!container) return;

  const popup = document.createElement("div");
  popup.className = "popup";

  const caption = document.createElement("a");
  caption.textContent = imgData.title || "Untitled";

  const img = createProgressiveImage(imgData);

  popup.append(caption, img);

  const w = 200;
  const h = 220;
  popup.style.left = Math.random() * Math.max(0, window.innerWidth - w) + "px";
  popup.style.top = Math.random() * Math.max(0, window.innerHeight - h) + "px";

  popup.addEventListener("click", () => popup.remove());
  container.appendChild(popup);
}

function setupPopups(images) {
  if (!images.length) return;

  window.addEventListener("scroll", () => {
    if (Math.random() < 0.05) {
      spawnPopup(images[Math.floor(Math.random() * images.length)]);
    }
  });

  document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      document.querySelectorAll(".popup").forEach(p => p.remove());
    }
  });
}

const searchInput = document.getElementById("search");

function applyFilters() {
  const term = searchInput.value.toLowerCase();

  document.querySelectorAll(".img-wrapper").forEach(el => {
    const caption = el.querySelector("p").textContent.toLowerCase();
    el.style.display = caption.includes(term) ? "block" : "none";
  });
}

if (searchInput) {
  searchInput.addEventListener("input", applyFilters);
}

function Showlist() {
  document.getElementById("worklist").classList.toggle("show");
}

function Showbio() {
  document.getElementById("bio-container").classList.toggle("show2");
}

loadImages().then(setupPopups);