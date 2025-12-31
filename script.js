function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

const ageGate = document.getElementById("age-gate");
const ageCheck = document.getElementById("age-check");
const enterBtn = document.getElementById("enter-btn");

if (localStorage.getItem("ageVerified")) {
  ageGate.style.display = "flex";
}

enterBtn.addEventListener("click", () => {
  if (ageCheck.checked) {
    localStorage.setItem("ageVerified", "true");
    ageGate.style.display = "none";
  } else {
    alert("You must confirm your age before proceeding.");
  }
});

async function loadImages() {
  try {
    const res = await fetch("data/public/manifest.json");
    const data = await res.json();

    const works = data.works.map(f => ({
      ...f,
      type: "works",
      thumb: f.thumb || f.src.replace("/works/", "/works/thumb/"),
      low: f.low || f.src.replace("/works/", "/works/low/")
    }));

    const sources = data.sources.map(f => ({
      ...f,
      type: "sources",
      thumb: f.thumb || f.src.replace("/sources/", "/sources/thumb/"),
      low: f.low || f.src.replace("/sources/", "/sources/low/")
    }));

    const images = shuffle([...works, ...sources]);
    renderImages(images);
    return images;
  } catch (err) {
    console.error("Error loading manifest.json", err);
  }
}

function fadeToBetterQuality(img, nextSrc) {
  const highImg = new Image();
  highImg.src = nextSrc;

  highImg.onload = () => {
    img.classList.add("fade");
    setTimeout(() => {
      img.src = nextSrc;
      img.classList.remove("fade");
    }, 150);
  };
}

function renderImages(images) {
  const grid = document.getElementById("grid");
  grid.innerHTML = "";

  images.forEach(imgData => {
    const wrapper = document.createElement("div");
    wrapper.className = `img-wrapper ${imgData.type}`;

    const img = document.createElement("img");
    img.src = imgData.thumb;
    img.dataset.low = imgData.low;
    img.dataset.full = imgData.src;
    img.alt = imgData.title || "Untitled";
    img.loading = "lazy";

    if (imgData.original) {
      img.dataset.original = imgData.original;
    }

    img.onload = () => fadeToBetterQuality(img, img.dataset.low);

    img.addEventListener("transitionend", () => {
      fadeToBetterQuality(img, img.dataset.full);
    }, { once: true });

    const caption = document.createElement("p");
    caption.textContent = imgData.title || "Untitled";

    wrapper.appendChild(img);
    wrapper.appendChild(caption);
    grid.appendChild(wrapper);
  });

  setupImageClick();
}

function setupImageClick() {
  const grid = document.getElementById("grid");

  grid.addEventListener("click", e => {
    const img = e.target.closest("img");
    if (!img) return;

    const low = img.dataset.low;
    const full = img.dataset.full;
    const captionText = img.alt || "Untitled";
    const original = img.dataset.original || null;

    showLightbox(low, full, captionText, original);
  });
}

function showLightbox(lowSrc, fullSrc, captionText, originalSrc = null) {
  const existing = document.getElementById("lightbox");
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.id = "lightbox";

  const img = document.createElement("img");
  img.src = lowSrc;
  img.alt = captionText;
  img.className = "lightbox-img";

  const caption = document.createElement("p");
  caption.textContent = captionText;

  overlay.appendChild(img);
  overlay.appendChild(caption);

  if (originalSrc) {
    const originalLink = document.createElement("a");
    originalLink.href = originalSrc;
    originalLink.target = "_blank";
    originalLink.rel = "noopener";
    originalLink.textContent = "original";
    originalLink.className = "lightbox-original-link";
    overlay.appendChild(originalLink);
  }

  document.body.appendChild(overlay);
  fadeToBetterQuality(img, fullSrc);

  overlay.addEventListener("click", () => overlay.remove());
  document.addEventListener("keydown", function escHandler(e) {
    if (e.key === "Escape") {
      overlay.remove();
      document.removeEventListener("keydown", escHandler);
    }
  });
}


function setupPopups(images) {
  window.addEventListener("scroll", () => {
    if (Math.random() < 0.05) {
      const img = images[Math.floor(Math.random() * images.length)];
      spawnPopup(img);
    }
  });
}

function spawnPopup(imgData) {
  const container = document.getElementById("popup-container");
  const popup = document.createElement("div");
  popup.className = "popup";

  const img = document.createElement("img");
  img.src = imgData.thumb;
  img.dataset.low = imgData.low;
  img.dataset.full = imgData.src;

  img.onload = () => fadeToBetterQuality(img, img.dataset.low);

  img.addEventListener("transitionend", () => {
    fadeToBetterQuality(img, img.dataset.full);
  }, { once: true });

  const caption = document.createElement("a");
  caption.textContent = imgData.title || "Untitled";

  popup.appendChild(caption);
  popup.appendChild(img);

  const w = 200;
  const h = 220;

  popup.style.left = Math.random() * (window.innerWidth - w) + "px";
  popup.style.top = Math.random() * (window.innerHeight - h) + "px";

  container.appendChild(popup);

  popup.addEventListener("click", () => popup.remove());
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") popup.remove();
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

function Showlist() {
  document.getElementById("worklist").classList.toggle("show");
}

function Showbio() {
  document.getElementById("bio-container").classList.toggle("show2");
}

searchInput.addEventListener("input", applyFilters);

loadImages().then(() => {
  fetch("data/public/manifest.json").then(r => r.json()).then(data => {
    const works = data.works.map(f => ({ ...f, type: "works" }));
    const sources = data.sources.map(f => ({ ...f, type: "sources" }));
    window.images = [...works, ...sources];
    setupPopups(window.images);
  });
});
