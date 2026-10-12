(() => {
  const projects = window.PORTFOLIO_PROJECTS;
  const content = window.PORTFOLIO_I18N;
  if (!Array.isArray(projects) || !content) {
    throw new Error("Portfolio V2 content could not be loaded.");
  }

  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
  const language = () => window.portfolioLanguage || "hr";
  const translate = (key, lang = language()) => content.ui[lang]?.[key] ?? content.ui.hr[key] ?? key;
  const localizedProject = (project, lang = language()) => ({
    ...project,
    ...(lang === "en" ? content.projects[project.id] : {})
  });
  const caseUrl = (project, lang = language()) =>
    `case-study.html?id=${encodeURIComponent(project.id)}&lang=${lang}`;

  const updateUrlLanguage = (lang) => {
    const url = new URL(window.location.href);
    url.searchParams.set("lang", lang);
    window.history.replaceState(window.history.state, "", url);
  };

  const setText = (selector, value) => {
    const element = document.querySelector(selector);
    if (element) element.textContent = value;
  };

  const currentTheme = () => document.documentElement.dataset.theme === "light" ? "light" : "dark";
  const updateThemeControls = () => {
    const theme = currentTheme();
    const label = translate(theme === "dark" ? "themeToLight" : "themeToDark");
    document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
      button.setAttribute("aria-label", label);
      button.setAttribute("title", label);
      button.setAttribute("aria-pressed", String(theme === "light"));
    });
    document.querySelector('meta[name="theme-color"]')?.setAttribute(
      "content",
      theme === "light" ? "#FAF9F6" : "#080808"
    );
  };

  const applyTheme = (theme, persist = true) => {
    const selectedTheme = theme === "light" ? "light" : "dark";
    document.documentElement.dataset.theme = selectedTheme;
    updateThemeControls();
    if (!persist) return;
    try {
      window.localStorage.setItem("mate-portfolio-theme", selectedTheme);
    } catch (error) {
      console.info("Theme preference could not be saved.", error);
    }
  };

  const renderTicker = (lang) => {
    const track = document.querySelector("#ticker-track");
    if (!track) return;
    const phraseMarkup = translate("tickerPhrases", lang).map((phrase) => `
      <span class="ticker-separator" aria-hidden="true">✳</span>
      <span class="ticker-phrase">${escapeHtml(phrase)}</span>`).join("");
    const copies = track.querySelectorAll(".ticker-copy");
    copies[0].innerHTML = phraseMarkup;
    copies[1].innerHTML = phraseMarkup;

    const setSpeed = () => {
      const copyWidth = copies[0].getBoundingClientRect().width;
      if (copyWidth > 0) track.style.setProperty("--ticker-duration", `${copyWidth / 80}s`);
    };

    setSpeed();
    if ("ResizeObserver" in window) {
      tickerResizeObserver?.disconnect();
      tickerResizeObserver = new ResizeObserver(setSpeed);
      tickerResizeObserver.observe(copies[0]);
    }
  };

  const updateCommonContent = (lang) => {
    document.documentElement.lang = lang;
    document.querySelectorAll("[data-v2]").forEach((element) => {
      element.textContent = translate(`v2${element.dataset.v2[0].toUpperCase()}${element.dataset.v2.slice(1)}`, lang);
    });
    document.querySelectorAll("[data-v2-html]").forEach((element) => {
      element.innerHTML = translate(`v2${element.dataset.v2Html[0].toUpperCase()}${element.dataset.v2Html.slice(1)}`, lang);
    });
    document.querySelectorAll("[data-v2-alt]").forEach((element) => {
      element.setAttribute("alt", translate(`v2${element.dataset.v2Alt[0].toUpperCase()}${element.dataset.v2Alt.slice(1)}`, lang));
    });
    document.querySelectorAll("[data-v2-aria-label]").forEach((element) => {
      element.setAttribute("aria-label", translate(`v2${element.dataset.v2AriaLabel[0].toUpperCase()}${element.dataset.v2AriaLabel.slice(1)}`, lang));
    });
    document.querySelectorAll("[data-i18n]").forEach((element) => {
      element.textContent = translate(element.dataset.i18n, lang);
    });
    document.querySelectorAll(".navlinks [data-nav]").forEach((anchor) => {
      const key = {
        work: "navProjects",
        areas: "navExpertise",
        about: "navAbout",
        experience: "navExperience",
        contact: "navContact"
      }[anchor.dataset.nav];
      if (key) anchor.textContent = translate(key, lang);
    });
    document.querySelectorAll(".language-switch").forEach((switcher) => {
      switcher.setAttribute("aria-label", translate("language", lang));
      switcher.querySelectorAll("[data-language]").forEach((button) => {
        const active = button.dataset.language === lang;
        button.classList.toggle("active", active);
        button.setAttribute("aria-pressed", String(active));
      });
    });
    document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
      button.setAttribute("aria-label", translate(currentTheme() === "dark" ? "themeToLight" : "themeToDark", lang));
      button.setAttribute("title", translate(currentTheme() === "dark" ? "themeToLight" : "themeToDark", lang));
      button.setAttribute("aria-pressed", String(currentTheme() === "light"));
    });
    document.querySelectorAll(".section-top.reveal").forEach((heading, index) => {
      heading.style.setProperty("--reveal-delay", `${Math.min(index * 70, 280)}ms`);
    });
    const navigation = document.querySelector("#main-navigation");
    navigation?.setAttribute("aria-label", translate("mainNav", lang));
    const brand = document.querySelector(".brand");
    brand?.setAttribute("aria-label", translate("homeLabel", lang));
    document.querySelectorAll("[data-home-anchor]").forEach((anchor) => {
      anchor.setAttribute("href", `index.html?lang=${lang}#${encodeURIComponent(anchor.dataset.homeAnchor)}`);
    });
    const menu = document.querySelector("#menu-toggle");
    menu?.setAttribute("aria-label", translate("menu", lang));
    document.querySelector(".brand")?.setAttribute("aria-label", translate("logoLabel", lang));
    renderTicker(lang);
    setText("#year", String(new Date().getFullYear()));
  };

  const renderProjects = (lang) => {
    const grid = document.querySelector("#projects");
    if (!grid) return;
    grid.innerHTML = projects.map((sourceProject, index) => {
      const project = localizedProject(sourceProject, lang);
      const revealDelay = Math.min(index * 65, 390);
      const image = project.screenshot
        ? `<img src="${escapeHtml(project.screenshot)}" alt="${escapeHtml(project.screenshotAlt)}" width="2160" height="1215" loading="lazy" decoding="async">`
        : `<div class="image-fallback" role="img" aria-label="${escapeHtml(project.screenshotAlt)}">${escapeHtml(project.placeholder || translate("casePlaceholderAlt", lang))}</div>`;
      return `<article class="project reveal" style="--reveal-delay: ${revealDelay}ms">
        <a class="project-image" href="${caseUrl(project, lang)}" aria-label="${escapeHtml(`${translate("moreProject", lang)}: ${project.name}`)}">${image}</a>
        <div class="project-body">
          <div class="project-kicker">${escapeHtml(project.cardCategory)}</div>
          <h3><a href="${caseUrl(project, lang)}">${escapeHtml(project.name)}</a></h3>
          <p>${escapeHtml(project.companyDescription)}</p>
          <a class="project-link" href="${caseUrl(project, lang)}">${escapeHtml(translate("moreProject", lang))}</a>
        </div>
      </article>`;
    }).join("");
    window.observePortfolioReveals?.(grid);
  };

  const renderExpertise = (lang) => {
    const list = document.querySelector("#expertise-list");
    if (!list) return;
    list.innerHTML = translate("v2Expertise", lang).map((item, index) => `
      <article class="area reveal">
        <span class="area-number">${String(index + 1).padStart(2, "0")}</span>
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.description)}</p>
      </article>`).join("");
    window.observePortfolioReveals?.(list);
  };

  const renderTimeline = (lang) => {
    const timeline = document.querySelector("#career-timeline");
    if (!timeline) return;
    timeline.innerHTML = content.ui[lang].timelineItems.map((item) => `
      <li class="timeline-item">
        <span class="timeline-marker" aria-hidden="true"></span>
        <article class="timeline-card">
          <p class="timeline-date">${escapeHtml(item.date)}</p>
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.description)}</p>
        </article>
      </li>`).join("");
    window.observePortfolioTimeline?.();
    window.updatePortfolioTimelineProgress?.();
  };

  const setMeta = (selector, attribute, value) => {
    const element = document.querySelector(selector);
    if (element) element.setAttribute(attribute, value);
  };

  const updateMetadata = ({ title, description, image, caseId } = {}) => {
    const lang = language();
    document.title = title || (lang === "en"
      ? "Mate Nikić — Growth Marketing Operations Manager"
      : "Mate Nikić — Growth Marketing Operations Manager");
    const summary = description || (lang === "en"
      ? "Mate Nikić connects web, marketing, technology, and operations to help businesses communicate their value."
      : "Mate Nikić povezuje web, marketing, tehnologiju i operacije kako bi tvrtke jasnije pokazale svoju vrijednost.");
    const pageUrl = new URL(window.location.href);
    let canonical;
    if (caseId) {
      canonical = new URL(pageUrl.pathname, pageUrl.origin);
      canonical.searchParams.set("id", caseId);
    } else {
      canonical = new URL("./", pageUrl);
    }
    const imageUrl = new URL(image || "assets/mate-portrait.png", pageUrl).href;

    setMeta('meta[name="description"]', "content", summary);
    setMeta('meta[property="og:title"]', "content", document.title);
    setMeta('meta[property="og:description"]', "content", summary);
    setMeta('meta[property="og:url"]', "content", canonical.href);
    setMeta('meta[property="og:image"]', "content", imageUrl);
    setMeta('meta[name="twitter:image"]', "content", imageUrl);
    setMeta('link[rel="canonical"]', "href", canonical.href);
  };

  let tickerResizeObserver;
  let revealObserver;
  if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.08 });
  }

  window.observePortfolioReveals = (root = document) => {
    const elements = root.querySelectorAll(".reveal");
    if (revealObserver) elements.forEach((element) => revealObserver.observe(element));
    else elements.forEach((element) => element.classList.add("visible"));
  };

  let timelineObserver;
  let timelineFrame = 0;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const updateTimelineProgress = () => {
    const shell = document.querySelector(".timeline-shell");
    const progress = document.querySelector(".timeline-progress");
    if (!shell || !progress) return;
    if (reducedMotion.matches) {
      progress.style.height = "100%";
      return;
    }
    const bounds = shell.getBoundingClientRect();
    const markerLine = window.innerHeight * 0.58;
    const amount = Math.min(1, Math.max(0, (markerLine - bounds.top) / Math.max(bounds.height, 1)));
    progress.style.height = `${amount * 100}%`;
  };

  const scheduleTimelineProgress = () => {
    if (timelineFrame) return;
    timelineFrame = window.requestAnimationFrame(() => {
      timelineFrame = 0;
      updateTimelineProgress();
    });
  };

  window.updatePortfolioTimelineProgress = scheduleTimelineProgress;
  window.observePortfolioTimeline = () => {
    timelineObserver?.disconnect();
    const items = [...document.querySelectorAll(".career-timeline > .timeline-item")];
    if (items.length && "IntersectionObserver" in window && !reducedMotion.matches) {
      timelineObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          items.forEach((item) => item.classList.toggle("is-active", item === entry.target));
          entry.target.classList.add("is-entered");
        });
      }, { rootMargin: "-42% 0px -42% 0px", threshold: 0 });
      items.forEach((item) => timelineObserver.observe(item));
    } else {
      items.forEach((item) => {
        item.classList.add("is-entered");
        item.classList.remove("is-active");
      });
      if (items.length) items[0].classList.add("is-active");
    }
  };

  const currentCaseProject = () => {
    const id = new URLSearchParams(window.location.search).get("id");
    if (!id) return null;
    const projectById = projects.find((project) => project.id === id);
    if (projectById) return projectById;
    const projectIndex = projects.findIndex((project) => project.number === id.padStart(2, "0"));
    return projectIndex >= 0 ? projects[projectIndex] : null;
  };

  const renderCaseStudy = (lang) => {
    const main = document.querySelector("#case-content");
    if (!main) return;
    const sourceProject = currentCaseProject();
    if (!sourceProject) {
      main.innerHTML = `<div class="wrap not-found">
        <div class="eyebrow">${escapeHtml(translate("caseStudyPrefix", lang))}</div>
        <h1>${escapeHtml(translate("caseNotFoundTitle", lang))}</h1>
        <p>${escapeHtml(translate("caseNotFoundText", lang))}</p>
        <a class="btn primary" href="index.html?lang=${lang}#work">${escapeHtml(translate("caseBack", lang))}</a>
      </div>`;
      updateMetadata({
        title: `${translate("caseNotFoundTitle", lang)} — Mate Nikić`,
        description: translate("caseNotFoundText", lang)
      });
      return;
    }

    const project = localizedProject(sourceProject, lang);
    const projectIndex = projects.indexOf(sourceProject);
    const next = projects[(projectIndex + 1) % projects.length];
    const projectImage = project.screenshot
      ? `<img src="${escapeHtml(project.screenshot)}" alt="${escapeHtml(project.screenshotAlt)}" width="2160" height="1215" fetchpriority="high">`
      : `<div class="image-fallback" role="img" aria-label="${escapeHtml(translate("casePlaceholderAlt", lang))}">${escapeHtml(project.placeholder || translate("casePlaceholderAlt", lang))}</div>`;
    const contributions = project.contributions.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
    const technologies = project.technologies?.length
      ? project.technologies.map((item) => `<li>${escapeHtml(item)}</li>`).join("")
      : `<li>${escapeHtml(translate("v2TechnologyPlaceholder", lang))}</li>`;
    const liveLink = project.liveUrl
      ? `<a class="btn primary" href="${escapeHtml(project.liveUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(translate("caseVisit", lang))}</a>`
      : "";

    main.innerHTML = `<div class="wrap">
      <section class="case-hero">
        <a class="text-link" href="index.html?lang=${lang}#work">${escapeHtml(translate("caseBack", lang))}</a>
        <div class="eyebrow" style="margin-top: 38px">${escapeHtml(translate("caseStudyPrefix", lang))} / ${escapeHtml(project.number)} · ${escapeHtml(project.caseCategory)}</div>
        <h1>${escapeHtml(project.name)}</h1>
        <p class="case-lead">${escapeHtml(project.lead)}</p>
        <div class="actions">
          ${liveLink}
          <a class="btn secondary" href="index.html?lang=${lang}#contact">${escapeHtml(translate("caseContact", lang))}</a>
        </div>
        <div class="case-meta">
          <div><div class="meta-label">${escapeHtml(translate("factRoleCase", lang))}</div><div class="meta-value">${escapeHtml(project.role)}</div></div>
          <div><div class="meta-label">${escapeHtml(translate("durationLabel", lang))}</div><div class="meta-value">${escapeHtml(project.duration)}</div></div>
          <div><div class="meta-label">${escapeHtml(translate("factIndustry", lang))}</div><div class="meta-value">${escapeHtml(project.industry)}</div></div>
          <div><div class="meta-label">${escapeHtml(translate("caseTechnologies", lang))}</div><div class="meta-value">${escapeHtml(project.technologies?.join(" · ") || translate("v2TechnologyPlaceholder", lang))}</div></div>
        </div>
        <figure class="case-visual">${projectImage}</figure>
        <p class="case-visual-caption">${escapeHtml(translate("caseCaption", lang))}</p>
      </section>
      <div class="case-sections">
        <aside class="case-index">${escapeHtml(translate("caseStudyPrefix", lang))} / ${escapeHtml(project.number)}</aside>
        <div class="case-copy">
          <section><div class="case-index">${escapeHtml(translate("sectionContext", lang))}</div><h2>${escapeHtml(translate("contextTitle", lang))}</h2><p>${escapeHtml(project.caseSummary)}</p></section>
          <section><div class="case-index">${escapeHtml(translate("sectionGoal", lang))}</div><h2>${escapeHtml(translate("goalTitle", lang))}</h2><p>${escapeHtml(project.goal)}</p></section>
          <section><div class="case-index">${escapeHtml(translate("sectionContribution", lang))}</div><h2>${escapeHtml(translate("contributionTitle", lang))}</h2><ul>${contributions}</ul></section>
          <section><div class="case-index">${escapeHtml(translate("sectionSolution", lang))}</div><h2>${escapeHtml(translate("solutionTitle", lang))}</h2><p>${escapeHtml(project.solution)}</p></section>
          <section><div class="case-index">${escapeHtml(translate("sectionResults", lang))}</div><h2>${escapeHtml(translate("resultsTitle", lang))}</h2><p>${escapeHtml(project.results || translate("unverifiedResults", lang))}</p></section>
          <section><div class="case-index">${escapeHtml(translate("caseTechnologies", lang))}</div><h2>${escapeHtml(translate("caseTechnologies", lang))}</h2><ul class="technology-list">${technologies}</ul></section>
        </div>
      </div>
      <section class="next-project">
        <div class="eyebrow">${escapeHtml(translate("nextProject", lang))}</div>
        <h2><a href="${caseUrl(next, lang)}">${escapeHtml(next.name)} ↗</a></h2>
        <a class="text-link" href="index.html?lang=${lang}#work">${escapeHtml(translate("caseBack", lang))}</a>
      </section>
    </div>`;
    updateMetadata({
      title: `${project.name} — ${translate("caseStudyPrefix", lang)} | Mate Nikić`,
      description: project.caseSummary,
      image: project.screenshot || "assets/mate-portrait.png",
      caseId: project.id
    });
  };

  const render = (lang, { updateUrl = true } = {}) => {
    window.portfolioLanguage = lang === "en" ? "en" : "hr";
    const selectedLanguage = language();
    updateCommonContent(selectedLanguage);
    if (document.querySelector("#projects")) {
      renderProjects(selectedLanguage);
      renderExpertise(selectedLanguage);
      renderTimeline(selectedLanguage);
      updateMetadata();
    } else {
      renderCaseStudy(selectedLanguage);
    }
    window.observePortfolioReveals?.();
    if (updateUrl) updateUrlLanguage(selectedLanguage);
  };

  window.renderPortfolioLanguage = (lang) => render(lang);

  document.querySelectorAll(".language-switch [data-language]").forEach((button) => {
    button.addEventListener("click", () => window.setPortfolioLanguage(button.dataset.language));
  });

  document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
    button.addEventListener("click", () => applyTheme(currentTheme() === "dark" ? "light" : "dark"));
  });

  const logo = document.querySelector(".brand");
  const logoLetters = [...(logo?.querySelectorAll("[data-logo-letter]") || [])];
  const logoSeparator = logo?.querySelector("[data-logo-separator]");
  const reduceLogoMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const coarsePointer = window.matchMedia("(pointer: coarse)");
  let logoInterval;
  let logoTimeout;
  let pointerOnLogo = false;
  let separatorIsPlus = false;

  const settleLogo = () => {
    window.clearInterval(logoInterval);
    window.clearTimeout(logoTimeout);
    separatorIsPlus = false;
    logoLetters.forEach((letter) => {
      letter.textContent = letter.dataset.logoLetter;
      letter.classList.remove("is-scrambling");
    });
    if (logoSeparator) logoSeparator.textContent = "−";
  };

  const startLogoScramble = (duration = 0) => {
    settleLogo();
    if (reduceLogoMotion.matches || coarsePointer.matches || logoLetters.length !== 2) return;
    const scramble = () => {
      logoLetters.forEach((letter) => {
        letter.textContent = String.fromCharCode(65 + Math.floor(Math.random() * 26));
        letter.classList.add("is-scrambling");
      });
      separatorIsPlus = !separatorIsPlus;
      if (logoSeparator) logoSeparator.textContent = separatorIsPlus ? "+" : "−";
    };
    scramble();
    logoInterval = window.setInterval(scramble, 80);
    if (duration) {
      logoTimeout = window.setTimeout(() => {
        if (!pointerOnLogo) settleLogo();
      }, duration);
    }
  };

  logo?.addEventListener("pointerenter", (event) => {
    if (event.pointerType === "touch" || coarsePointer.matches) return;
    pointerOnLogo = true;
    startLogoScramble();
  });
  logo?.addEventListener("pointerleave", () => {
    pointerOnLogo = false;
    settleLogo();
    if (logo.matches(":focus")) startLogoScramble(640);
  });
  logo?.addEventListener("focus", () => {
    if (!pointerOnLogo) startLogoScramble(640);
  });
  logo?.addEventListener("blur", () => {
    if (!pointerOnLogo) settleLogo();
  });
  reduceLogoMotion.addEventListener?.("change", () => {
    if (reduceLogoMotion.matches) settleLogo();
  });

  const menu = document.querySelector("#menu-toggle");
  const navigation = document.querySelector("#main-navigation");
  const closeMenu = () => {
    navigation?.classList.remove("open");
    menu?.setAttribute("aria-expanded", "false");
  };
  menu?.addEventListener("click", () => {
    const open = navigation?.classList.toggle("open") || false;
    menu.setAttribute("aria-expanded", String(open));
  });
  navigation?.querySelectorAll("a").forEach((anchor) => anchor.addEventListener("click", closeMenu));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });

  window.addEventListener("scroll", scheduleTimelineProgress, { passive: true });
  window.addEventListener("resize", scheduleTimelineProgress);
  reducedMotion.addEventListener?.("change", () => {
    window.observePortfolioTimeline?.();
    scheduleTimelineProgress();
  });

  document.documentElement.classList.add("js");
  window.renderPortfolioLanguage(window.getPortfolioLanguage());
  updateThemeControls();
})();
