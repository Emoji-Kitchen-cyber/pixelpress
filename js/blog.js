/**
 * PixelPress System Blog Controller Module
 * Pure Vanilla JavaScript Client-Side Engine
 */

document.addEventListener("DOMContentLoaded", () => {
  initializeLanguageEngine();
  initializeReadingProgressBar();
  initializeFaqAccordions();
  initializeSearchAndFilters();
});

// Structural Multi-Lingual Architecture Mapping
function initializeLanguageEngine() {
  const langBtn = document.getElementById("langSwitcherBtn");
  if (!langBtn) return;

  langBtn.addEventListener("click", () => {
    const currentDir = document.body.getAttribute("dir") || "ltr";
    if (currentDir === "ltr") {
      document.body.setAttribute("dir", "rtl");
      document.body.classList.add("rtl-mode");
      langBtn.innerHTML = '<i class="fa-solid fa-globe"></i> English';
      mutateUIDirections("ar");
    } else {
      document.body.setAttribute("dir", "ltr");
      document.body.classList.remove("rtl-mode");
      langBtn.innerHTML = '<i class="fa-solid fa-globe"></i> العربية';
      mutateUIDirections("en");
    }
  });
}

function mutateUIDirections(lang) {
  // Localization updates for static UI components if active in DOM view
  const searchInput = document.querySelector(".search-input");
  if (searchInput) {
    searchInput.placeholder = lang === "ar" ? "ابحث عن المقالات أو الأدوات..." : "Search articles or tools...";
  }
}

// Progressive Reading Flow Matrix Tracker
function initializeReadingProgressBar() {
  const pBar = document.getElementById("readingProgressIndicator");
  if (!pBar) return;

  window.addEventListener("scroll", () => {
    const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = height > 0 ? (winScroll / height) * 100 : 0;
    pBar.style.width = scrolled + "%";
  });
}

// Accessible Accordions Logic Pipeline
function initializeFaqAccordions() {
  const triggers = document.querySelectorAll(".faq-trigger");
  triggers.forEach(trigger => {
    trigger.addEventListener("click", () => {
      const targetId = trigger.getAttribute("data-target");
      const contentBox = document.getElementById(targetId);
      if (!contentBox) return;

      const isOpen = contentBox.style.display === "block";
      
      // Close sibling groups securely
      document.querySelectorAll(".faq-content").forEach(c => c.style.display = "none");
      document.querySelectorAll(".faq-trigger i").forEach(icon => {
        icon.className = "fa-solid fa-chevron-down";
      });

      if (!isOpen) {
        contentBox.style.display = "block";
        trigger.querySelector("i").className = "fa-solid fa-chevron-up";
      }
    });
  });
}

// Live High-Performance Client Search & Categorization Engine
function initializeSearchAndFilters() {
  const searchInput = document.getElementById("blogSearchField");
  const badges = document.querySelectorAll(".cat-badge");
  const articles = document.querySelectorAll(".article-card");

  if (!searchInput && badges.length === 0) return;

  let searchFilterTerm = "";
  let currentSelectedCategory = "all";

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      searchFilterTerm = e.target.value.toLowerCase().trim();
      executeCombinedFiltering();
    });
  }

  badges.forEach(badge => {
    badge.addEventListener("click", () => {
      badges.forEach(b => b.classList.remove("active"));
      badge.classList.add("active");
      currentSelectedCategory = badge.getAttribute("data-cat");
      executeCombinedFiltering();
    });
  });

  function executeCombinedFiltering() {
    articles.forEach(article => {
      const title = article.querySelector(".card-title").innerText.toLowerCase();
      const excerpt = article.querySelector(".card-excerpt").innerText.toLowerCase();
      const cat = article.getAttribute("data-category");

      const matchSearch = title.includes(searchFilterTerm) || excerpt.includes(searchFilterTerm);
      const matchCategory = currentSelectedCategory === "all" || cat === currentSelectedCategory;

      if (matchSearch && matchCategory) {
        article.style.display = "flex";
      } else {
        article.style.display = "none";
      }
    });
  }
}
