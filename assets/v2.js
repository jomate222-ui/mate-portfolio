(() => {
  const projects = window.PORTFOLIO_PROJECTS;
  const content = window.PORTFOLIO_I18N;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let projectCarouselResizeObserver;
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
  const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");
  let hasManualThemePreference = false;
  try {
    const savedTheme = window.localStorage.getItem("mate-portfolio-theme");
    hasManualThemePreference = savedTheme === "light" || savedTheme === "dark";
  } catch (error) {
    console.info("Theme preference could not be read.", error);
  }

  const updateThemeControls = () => {
    const theme = currentTheme();
    document.documentElement.style.colorScheme = theme;
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
    hasManualThemePreference = true;
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
      const cardImage = project.cardImage || project.screenshot;
      const imageAlt = project.cardImage
        ? lang === "hr" ? project.cardImageAltHr || project.cardImageAlt : project.cardImageAlt
        : lang === "hr" ? project.screenshotAltHr || project.screenshotAlt : project.screenshotAlt;
      const image = cardImage
        ? `<img src="${escapeHtml(cardImage)}" alt="${escapeHtml(imageAlt)}" width="${project.cardImage ? 1536 : 2160}" height="${project.cardImage ? 1024 : 1215}" loading="lazy" decoding="async">`
        : `<div class="image-fallback" role="img" aria-label="${escapeHtml(project.screenshotAlt)}">${escapeHtml(project.placeholder || translate("casePlaceholderAlt", lang))}</div>`;
      return `<article class="project reveal" style="--reveal-delay: ${revealDelay}ms">
        <a class="project-image${project.cardImage ? " project-image-contain" : ""}" href="${caseUrl(project, lang)}" aria-label="${escapeHtml(`${translate("moreProject", lang)}: ${project.name}`)}">${image}</a>
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

  const getGallerySlides = (project, lang) => {
    const slides = [];
    if (project.screenshot) {
      slides.push({
        src: project.screenshot,
        alt: lang === "hr" ? project.screenshotAltHr || project.screenshotAlt : project.screenshotAlt
      });
    }
    (project.galleryImages || []).forEach((image) => {
      slides.push({
        src: image.src,
        width: image.width || 2160,
        height: image.height || 1215,
        alt: image.alt?.[lang] || image.alt?.hr || project.name
      });
    });
    return slides;
  };

  const renderCaseGallery = (project, lang) => {
    const slides = getGallerySlides(project, lang);
    if (!slides.length) {
      return `<figure class="case-visual">
        <div class="image-fallback" role="img" aria-label="${escapeHtml(translate("casePlaceholderAlt", lang))}">${escapeHtml(project.placeholder || translate("casePlaceholderAlt", lang))}</div>
      </figure>`;
    }

    const images = slides.map((slide, index) => `
      <img src="${escapeHtml(slide.src)}" alt="${escapeHtml(slide.alt)}" width="${slide.width || 2160}" height="${slide.height || 1215}" ${index ? 'loading="lazy"' : 'fetchpriority="high"'} decoding="async" aria-hidden="${index !== 0}"${index ? " hidden" : ""}>`).join("");
    if (slides.length === 1) {
      return `<figure class="case-visual case-gallery-single">${images}</figure>`;
    }

    const positionLabel = (index) => translate("galleryImagePosition", lang)
      .replace("{current}", String(index + 1).padStart(2, "0"))
      .replace("{total}", String(slides.length).padStart(2, "0"));
    const indicators = slides.map((slide, index) => `
      <button class="gallery-indicator${index === 0 ? " is-active" : ""}" type="button" data-gallery-slide="${index}" aria-label="${escapeHtml(positionLabel(index))}" aria-pressed="${index === 0}"></button>`).join("");

    return `<figure class="case-visual case-gallery" data-case-gallery tabindex="0" role="group" aria-roledescription="carousel" aria-label="${escapeHtml(translate("caseGalleryLabel", lang))}">
      <div class="case-gallery-stage">${images}
        <button class="gallery-arrow gallery-arrow-previous" type="button" data-gallery-previous aria-label="${escapeHtml(translate("previousImage", lang))}"><span aria-hidden="true">←</span></button>
        <button class="gallery-arrow gallery-arrow-next" type="button" data-gallery-next aria-label="${escapeHtml(translate("nextImage", lang))}"><span aria-hidden="true">→</span></button>
      </div>
      <div class="case-gallery-controls">
        <div class="gallery-indicators" role="group" aria-label="${escapeHtml(translate("caseGalleryLabel", lang))}">${indicators}</div>
        <span class="gallery-counter" data-gallery-counter aria-live="polite">${escapeHtml(positionLabel(0))}</span>
      </div>
    </figure>`;
  };

  const renderRelatedProjects = (currentProject, lang) => {
    const relatedProjects = projects.filter((project) => project !== currentProject);
    const cards = relatedProjects.map((sourceProject) => {
      const project = localizedProject(sourceProject, lang);
      const imageSource = project.screenshot;
      const imageAlt = lang === "hr" ? project.screenshotAltHr || project.screenshotAlt : project.screenshotAlt;
      const image = imageSource
        ? `<img src="${escapeHtml(imageSource)}" alt="${escapeHtml(imageAlt)}" width="2160" height="1215" loading="lazy" decoding="async">`
        : `<div class="image-fallback" role="img" aria-label="${escapeHtml(project.screenshotAlt)}">${escapeHtml(project.placeholder || translate("casePlaceholderAlt", lang))}</div>`;
      const href = caseUrl(project, lang);
      return `<article class="project related-project-card">
        <a class="project-image" href="${href}" aria-label="${escapeHtml(`${translate("moreProject", lang)}: ${project.name}`)}">${image}</a>
        <div class="project-body">
          <div class="project-kicker">${escapeHtml(project.cardCategory)}</div>
          <h3><a href="${href}">${escapeHtml(project.name)}</a></h3>
          <p>${escapeHtml(project.companyDescription)}</p>
          <a class="project-link" href="${href}">${escapeHtml(translate("moreProject", lang))}</a>
        </div>
      </article>`;
    }).join("");

    return `<section class="next-project" data-project-carousel aria-labelledby="related-projects-title">
      <div class="related-project-heading">
        <div class="eyebrow">${escapeHtml(translate("exploreMoreProjects", lang))}</div>
        <div class="carousel-controls" role="group" aria-label="${escapeHtml(translate("projectCarouselLabel", lang))}">
          <button class="gallery-arrow" type="button" data-project-previous aria-label="${escapeHtml(translate("previousProjects", lang))}"><span aria-hidden="true">←</span></button>
          <button class="gallery-arrow" type="button" data-project-next aria-label="${escapeHtml(translate("nextProjects", lang))}"><span aria-hidden="true">→</span></button>
        </div>
      </div>
      <h2 id="related-projects-title" class="visually-hidden">${escapeHtml(translate("exploreMoreProjects", lang))}</h2>
      <div class="related-project-track" data-project-track tabindex="0" role="group" aria-roledescription="carousel" aria-label="${escapeHtml(translate("projectCarouselLabel", lang))}">
        ${cards}
      </div>
    </section>`;
  };

  const initializeCaseGallery = (root) => {
    const gallery = root.querySelector("[data-case-gallery]");
    if (!gallery) return;
    const images = [...gallery.querySelectorAll(".case-gallery-stage img")];
    const indicators = [...gallery.querySelectorAll("[data-gallery-slide]")];
    const counter = gallery.querySelector("[data-gallery-counter]");
    let activeIndex = 0;

    const showSlide = (index) => {
      activeIndex = (index + images.length) % images.length;
      images.forEach((image, imageIndex) => {
        image.hidden = imageIndex !== activeIndex;
        image.setAttribute("aria-hidden", String(imageIndex !== activeIndex));
      });
      indicators.forEach((indicator, indicatorIndex) => {
        const active = indicatorIndex === activeIndex;
        indicator.classList.toggle("is-active", active);
        indicator.setAttribute("aria-pressed", String(active));
      });
      if (counter) {
        counter.textContent = translate("galleryImagePosition")
          .replace("{current}", String(activeIndex + 1).padStart(2, "0"))
          .replace("{total}", String(images.length).padStart(2, "0"));
      }
    };

    gallery.querySelector("[data-gallery-previous]")?.addEventListener("click", () => showSlide(activeIndex - 1));
    gallery.querySelector("[data-gallery-next]")?.addEventListener("click", () => showSlide(activeIndex + 1));
    indicators.forEach((indicator) => indicator.addEventListener("click", () => {
      showSlide(Number(indicator.dataset.gallerySlide));
    }));
    gallery.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        showSlide(activeIndex + (event.key === "ArrowRight" ? 1 : -1));
      }
    });

    let pointerStart;
    gallery.addEventListener("pointerdown", (event) => {
      if (event.pointerType === "touch") pointerStart = { x: event.clientX, y: event.clientY };
    });
    gallery.addEventListener("pointerup", (event) => {
      if (!pointerStart) return;
      const deltaX = event.clientX - pointerStart.x;
      const deltaY = event.clientY - pointerStart.y;
      pointerStart = null;
      if (Math.abs(deltaX) > 45 && Math.abs(deltaX) > Math.abs(deltaY)) {
        showSlide(activeIndex + (deltaX < 0 ? 1 : -1));
      }
    });
    gallery.addEventListener("pointercancel", () => {
      pointerStart = null;
    });
  };

  const initializeProjectCarousel = (root) => {
    const carousel = root.querySelector("[data-project-carousel]");
    const track = carousel?.querySelector("[data-project-track]");
    if (!carousel || !track) return;
    const previous = carousel.querySelector("[data-project-previous]");
    const next = carousel.querySelector("[data-project-next]");

    const updateControls = () => {
      const maxScroll = track.scrollWidth - track.clientWidth;
      const scrollLeft = Math.max(0, track.scrollLeft);
      if (previous) previous.disabled = scrollLeft <= 1;
      if (next) next.disabled = maxScroll <= 1 || scrollLeft >= maxScroll - 1;
    };
    const scrollOneCard = (direction) => {
      const cards = [...track.querySelectorAll(".related-project-card")];
      if (!cards.length) return;
      const firstCard = cards[0].getBoundingClientRect();
      const secondCard = cards[1]?.getBoundingClientRect();
      const step = secondCard ? secondCard.left - firstCard.left : firstCard.width;
      if (step <= 0) return;
      track.scrollBy({
        left: direction * step,
        behavior: reduceMotion.matches ? "auto" : "smooth"
      });
      window.requestAnimationFrame(updateControls);
    };

    previous?.addEventListener("click", () => scrollOneCard(-1));
    next?.addEventListener("click", () => scrollOneCard(1));
    track.addEventListener("scroll", updateControls, { passive: true });
    track.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        scrollOneCard(event.key === "ArrowRight" ? 1 : -1);
      }
    });
    if ("ResizeObserver" in window) {
      projectCarouselResizeObserver?.disconnect();
      projectCarouselResizeObserver = new ResizeObserver(updateControls);
      projectCarouselResizeObserver.observe(track);
    }
    updateControls();
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
    const projectGallery = renderCaseGallery(project, lang);
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
        ${projectGallery}
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
      ${renderRelatedProjects(sourceProject, lang)}
    </div>`;
    initializeCaseGallery(main);
    initializeProjectCarousel(main);
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

  const logo = document.querySelector(".brand");
  const logoCharacters = [...(logo?.querySelectorAll("[data-logo-character]") || [])];
  const reduceLogoMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const coarsePointer = window.matchMedia("(pointer: coarse)");
  let logoInterval = null;
  let separatorIsPlus = false;

  const resetLogo = () => {
    window.clearInterval(logoInterval);
    logoInterval = null;
    separatorIsPlus = false;
    logoCharacters.forEach((character) => {
      character.textContent = character.dataset.logoCharacter;
      character.classList.remove("is-scrambling");
    });
  };

  resetLogo();

  const startLogoScramble = (event) => {
    if (
      logoInterval !== null ||
      event.pointerType !== "mouse" ||
      reduceLogoMotion.matches ||
      coarsePointer.matches ||
      logoCharacters.length !== 3
    ) return;
    const scramble = () => {
      logoCharacters[0].textContent = String.fromCharCode(65 + Math.floor(Math.random() * 26));
      logoCharacters[2].textContent = String.fromCharCode(65 + Math.floor(Math.random() * 26));
      logoCharacters[0].classList.add("is-scrambling");
      logoCharacters[2].classList.add("is-scrambling");
      separatorIsPlus = !separatorIsPlus;
      logoCharacters[1].textContent = separatorIsPlus ? "+" : "−";
    };
    scramble();
    logoInterval = window.setInterval(scramble, 80);
  };

  logo?.addEventListener("pointerenter", startLogoScramble);
  logo?.addEventListener("pointerleave", resetLogo);
  logo?.addEventListener("pointercancel", resetLogo);
  logo?.addEventListener("blur", resetLogo);
  logo?.addEventListener("click", resetLogo);
  window.addEventListener("blur", resetLogo);
  window.addEventListener("pagehide", resetLogo);
  const resetIfLogoMotionDisabled = () => {
    if (reduceLogoMotion.matches || coarsePointer.matches) resetLogo();
  };
  if (reduceLogoMotion.addEventListener) reduceLogoMotion.addEventListener("change", resetIfLogoMotionDisabled);
  else reduceLogoMotion.addListener?.(resetIfLogoMotionDisabled);
  if (coarsePointer.addEventListener) coarsePointer.addEventListener("change", resetIfLogoMotionDisabled);
  else coarsePointer.addListener?.(resetIfLogoMotionDisabled);

  document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      resetLogo();
      applyTheme(currentTheme() === "dark" ? "light" : "dark");
    });
  });

  const updateSystemTheme = (event) => {
    if (!hasManualThemePreference) {
      resetLogo();
      applyTheme(event.matches ? "dark" : "light", false);
    }
  };
  if (systemTheme.addEventListener) systemTheme.addEventListener("change", updateSystemTheme);
  else systemTheme.addListener?.(updateSystemTheme);
  window.addEventListener("storage", (event) => {
    if (event.key !== "mate-portfolio-theme") return;
    resetLogo();
    if (event.newValue === "light" || event.newValue === "dark") {
      hasManualThemePreference = true;
      applyTheme(event.newValue, false);
    } else if (event.newValue === null) {
      hasManualThemePreference = false;
      applyTheme(systemTheme.matches ? "dark" : "light", false);
    }
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
