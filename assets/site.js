(() => {
  const translations = window.PORTFOLIO_I18N.ui;
  const nav = document.querySelector(".nav");
  const toggle = document.querySelector(".navbtn");
  let category = "all";
  let timelineObserver;
  let currentTimelineItems = [];

  const language = () => window.portfolioLanguage || "hr";
  const t = (key) => translations[language()][key] || translations.hr[key] || key;

  if (nav && !nav.querySelector(".language-switch")) {
    const switcher = document.createElement("div");
    switcher.className = "language-switch";
    switcher.setAttribute("role", "group");
    switcher.innerHTML = '<button type="button" data-language="hr">HR</button><span aria-hidden="true">/</span><button type="button" data-language="en">EN</button>';
    nav.append(switcher);
  }

  const updateLanguageControls = () => {
    document.documentElement.lang = language();
    nav?.setAttribute("aria-label", t("mainNav"));
    nav?.querySelector(".logo")?.setAttribute("aria-label", t("homeLabel"));
    document.querySelectorAll(".language-switch").forEach((switcher) => {
      switcher.setAttribute("aria-label", t("language"));
      switcher.querySelectorAll("[data-language]").forEach((button) => {
        const active = button.dataset.language === language();
        button.setAttribute("aria-pressed", String(active));
        button.classList.toggle("active", active);
      });
    });
    if (toggle && !toggle.querySelector("span")) toggle.innerHTML = "☰ <span></span>";
    const menuLabel = toggle?.querySelector("span");
    if (menuLabel) menuLabel.textContent = t("menuLabel");
    if (toggle) toggle.setAttribute("aria-label", t("menu"));
    document.querySelectorAll(".navlinks a").forEach((anchor) => {
      const href = anchor.getAttribute("href") || "";
      const contactLink = href.includes("#contact") || href.includes("#hero-contact-options");
      const key = href.includes("#work") ? "navProjects"
        : href.includes("#expertise") ? "navExpertise"
          : href.includes("#about") ? "navAbout"
            : contactLink ? "navContact" : null;
      if (key) {
        anchor.textContent = t(key);
        if (key === "navContact") {
          const home = window.location.pathname.includes("/projects/") ? "../../index.html" : "index.html";
          anchor.href = `${home}?lang=${language()}#hero-contact-options`;
        }
      }
    });
  };

  document.querySelectorAll(".language-switch [data-language]").forEach((button) => {
    button.addEventListener("click", () => {
      window.setPortfolioLanguage(button.dataset.language);
      updateLanguageControls();
      if (window.location.pathname.includes("/projects/")) {
        const footerText = document.querySelectorAll(".foot-inner span");
        if (footerText[0]) footerText[0].textContent = t("caseCopyright");
        if (footerText[1]) footerText[1].textContent = t("footerFocus");
      }
      window.updateProjectFilters?.();
    });
  });
  updateLanguageControls();

  if (toggle) toggle.addEventListener("click", () => {
    const menu = document.querySelector(".navlinks");
    const open = menu.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
  });
  document.querySelectorAll(".navlinks a").forEach((anchor) => anchor.addEventListener("click", () => {
    document.querySelector(".navlinks")?.classList.remove("open");
    toggle?.setAttribute("aria-expanded", "false");
  }));

  let revealObserver;
  if ("IntersectionObserver" in window) {
    revealObserver = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      }
    }), { threshold: 0.07 });
  }
  window.observePortfolioReveals = (root = document) => {
    if (revealObserver) root.querySelectorAll(".reveal").forEach((element) => revealObserver.observe(element));
    else root.querySelectorAll(".reveal").forEach((element) => element.classList.add("visible"));
  };
  window.observePortfolioReveals();

  const categorySelect = document.querySelector("#project-category");
  const input = document.querySelector("#project-search");
  const counter = document.querySelector("#project-count");
  const empty = document.querySelector("#no-projects");

  window.updateProjectFilters = () => {
    const cards = [...document.querySelectorAll(".project[data-categories]")];
    if (!cards.length || !counter || !empty) return;
    category = categorySelect?.value || "all";
    const query = (input?.value || "").trim().toLocaleLowerCase(language());
    let count = 0;
    cards.forEach((card) => {
      const matches = (category === "all" || card.dataset.categories.split(" ").includes(category))
        && (!query || card.textContent.toLocaleLowerCase(language()).includes(query));
      card.hidden = !matches;
      if (matches) count++;
    });
    const noun = count === 1 ? t("projectSingular")
      : count >= 2 && count <= 4 ? t("projectFew") : t("projectMany");
    counter.textContent = `${count} ${noun}`;
    empty.hidden = count !== 0;
    const filtersActive = category !== "all" || Boolean(query);
    const reset = document.querySelector("#reset-filters");
    if (reset) reset.hidden = !filtersActive;
  };

  categorySelect?.addEventListener("change", window.updateProjectFilters);
  input?.addEventListener("input", window.updateProjectFilters);
  document.querySelector("#reset-filters")?.addEventListener("click", () => {
    if (input) input.value = "";
    if (categorySelect) categorySelect.value = "all";
    window.updateProjectFilters();
  });
  window.updateProjectFilters();

  const timeline = document.querySelector(".timeline-shell");
  const progress = document.querySelector(".timeline-progress");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let timelineFrame = 0;
  const updateTimelineProgress = () => {
    if (!timeline || !progress) return;
    if (reducedMotion.matches) {
      progress.style.height = "100%";
      return;
    }
    const bounds = timeline.getBoundingClientRect();
    const midpoint = window.innerHeight * 0.58;
    const amount = Math.min(1, Math.max(0, (midpoint - bounds.top) / Math.max(bounds.height, 1)));
    progress.style.height = `${amount * 100}%`;
  };
  const scheduleTimelineProgress = () => {
    if (timelineFrame) return;
    timelineFrame = window.requestAnimationFrame(() => {
      timelineFrame = 0;
      updateTimelineProgress();
    });
  };

  window.observePortfolioTimeline = () => {
    timelineObserver?.disconnect();
    currentTimelineItems = [...document.querySelectorAll(".career-timeline > .timeline-item")];
    if (currentTimelineItems.length && "IntersectionObserver" in window && !reducedMotion.matches) {
      timelineObserver = new IntersectionObserver((entries) => entries.forEach((entry) => {
        if (entry.isIntersecting) {
          currentTimelineItems.forEach((item) => item.classList.toggle("is-active", item === entry.target));
          entry.target.classList.add("is-entered");
        }
      }), { rootMargin: "-42% 0px -42% 0px", threshold: 0 });
      currentTimelineItems.forEach((item) => timelineObserver.observe(item));
    } else {
      currentTimelineItems.forEach((item) => item.classList.add("is-entered"));
    }
  };
  window.observePortfolioTimeline();
  window.addEventListener("scroll", scheduleTimelineProgress, { passive: true });
  window.addEventListener("resize", scheduleTimelineProgress);
  reducedMotion.addEventListener?.("change", scheduleTimelineProgress);
  updateTimelineProgress();
  document.documentElement.classList.add("js");
})();
