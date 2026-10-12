(() => {
  const projects = window.PORTFOLIO_PROJECTS;
  const content = window.PORTFOLIO_I18N;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let projectCarouselResizeObserver;
  let tickerResizeObserver;
  let tickerAnimation = null;
  let tickerLayoutSignature = "";
  let selectedProjectCategory = "all";
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
  const projectText = (value) => Array.isArray(value) ? value.join(" ") : String(value ?? "");
  const renderParagraphs = (value) => (Array.isArray(value) ? value : value ? [value] : [])
    .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
    .join("");
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

  const updateContactLanguage = (lang) => {
    const subject = translate("contactMeetSubject", lang);
    const message = translate("contactMeetBody", lang);
    document.querySelectorAll("[data-meet-request]").forEach((link) => {
      link.href = `mailto:matenikicbiz@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
    });
    const messageField = document.querySelector("[data-contact-prefill]");
    if (messageField) {
      const previousPrefill = messageField.dataset.contactPrefill || translate("contactMessagePrefill", "hr");
      if (messageField.value === previousPrefill) {
        messageField.value = translate("contactMessagePrefill", lang);
      }
      messageField.dataset.contactPrefill = translate("contactMessagePrefill", lang);
    }
    const feedback = document.querySelector("[data-contact-feedback]");
    if (feedback?.dataset.emailFallback === "true") {
      feedback.textContent = translate("contactFormFallbackNotice", lang);
    }
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

  const getTickerProgress = () => {
    if (!tickerAnimation) return 0;
    const duration = tickerAnimation.effect?.getTiming().duration;
    return typeof duration === "number" && duration > 0
      ? (Number(tickerAnimation.currentTime || 0) % duration) / duration
      : 0;
  };

  const configureTicker = (track, ticker, copy, progress = getTickerProgress(), force = false) => {
    const copyWidth = copy.getBoundingClientRect().width;
    const signature = `${ticker.clientWidth}:${copyWidth}:${reduceMotion.matches}`;
    if (!force && signature === tickerLayoutSignature) return;
    tickerLayoutSignature = signature;
    tickerAnimation?.cancel();
    tickerAnimation = null;
    track.classList.remove("is-css-animated");
    track.replaceChildren(copy);
    copy.removeAttribute("aria-hidden");

    if (reduceMotion.matches) return;
    if (copyWidth <= 0) return;
    const groupCount = Math.max(2, Math.ceil((ticker.clientWidth + copyWidth) / copyWidth));
    for (let index = 1; index < groupCount; index += 1) {
      const duplicate = copy.cloneNode(true);
      duplicate.removeAttribute("id");
      duplicate.setAttribute("aria-hidden", "true");
      track.append(duplicate);
    }

    track.style.setProperty("--ticker-offset", `-${copyWidth}px`);
    const duration = copyWidth / 62 * 1000;
    if (typeof track.animate !== "function") {
      track.style.setProperty("--ticker-duration", `${duration}ms`);
      track.style.animationDelay = `-${progress * duration}ms`;
      track.classList.add("is-css-animated");
      tickerAnimation = track.getAnimations?.()
        .find((animation) => animation.animationName === "ticker-scroll") || null;
      if (tickerAnimation && track.matches(":hover, :focus-within")) tickerAnimation.pause();
      return;
    }
    tickerAnimation = track.animate([
      { transform: "translate3d(0, 0, 0)" },
      { transform: `translate3d(-${copyWidth}px, 0, 0)` }
    ], { duration, iterations: Infinity, easing: "linear" });
    tickerAnimation.currentTime = progress * duration;
    if (track.matches(":hover, :focus-within")) tickerAnimation.pause();
  };

  const renderTicker = (lang) => {
    const track = document.querySelector("#ticker-track");
    if (!track) return;
    const ticker = track.closest(".ticker");
    if (!ticker) return;
    const phrases = translate("tickerPhrases", lang);
    const phraseMarkup = phrases.map((phrase) => `
      <span class="ticker-separator" aria-hidden="true">✳</span>
      <span class="ticker-phrase" aria-hidden="true">${escapeHtml(phrase)}</span>`).join("");
    const progress = getTickerProgress();
    const copy = track.querySelector(".ticker-copy") || document.createElement("span");
    copy.className = "ticker-copy";
    copy.id = "ticker-copy";
    copy.innerHTML = `<span class="visually-hidden">${escapeHtml(phrases.join(", "))}</span>${phraseMarkup}`;
    configureTicker(track, ticker, copy, progress, true);
    if ("ResizeObserver" in window) {
      tickerResizeObserver?.disconnect();
      tickerResizeObserver = new ResizeObserver(() => {
        configureTicker(track, ticker, copy);
      });
      tickerResizeObserver.observe(ticker);
      tickerResizeObserver.observe(copy);
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
    document.querySelectorAll("[data-i18n-aria-label]").forEach((element) => {
      element.setAttribute("aria-label", translate(element.dataset.i18nAriaLabel, lang));
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
      element.setAttribute("placeholder", translate(element.dataset.i18nPlaceholder, lang));
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
    updateContactLanguage(lang);
    renderTicker(lang);
    setText("#year", String(new Date().getFullYear()));
  };

  const renderProjects = (lang) => {
    const grid = document.querySelector("#projects");
    if (!grid) return;
    const visibleProjects = selectedProjectCategory === "all"
      ? projects
      : projects.filter((project) => project.filterCategories?.includes(selectedProjectCategory));
    if (!visibleProjects.length) {
      grid.innerHTML = `<p class="project-empty">${escapeHtml(translate("noProjectsInCategory", lang))}</p>`;
      return;
    }
    grid.innerHTML = visibleProjects.map((sourceProject) => {
      const index = projects.indexOf(sourceProject);
      const project = localizedProject(sourceProject, lang);
      const revealDelay = Math.min(index * 65, 390);
      const cardImage = project.cardImage;
      const imageAlt = lang === "hr" ? project.cardImageAltHr || project.cardImageAlt : project.cardImageAlt;
      const image = cardImage
        ? `<a class="project-image project-image-contain" href="${caseUrl(project, lang)}" aria-label="${escapeHtml(`${translate("moreProject", lang)}: ${project.name}`)}"><img src="${escapeHtml(cardImage)}" alt="${escapeHtml(imageAlt || project.name)}" width="${project.cardImageWidth || 1536}" height="${project.cardImageHeight || 1024}" loading="lazy" decoding="async"></a>`
        : "";
      return `<article class="project reveal" style="--reveal-delay: ${revealDelay}ms">
        ${image}
        <div class="project-body">
          <div class="project-kicker">${escapeHtml(project.name)}</div>
          <h3><a href="${caseUrl(project, lang)}">${escapeHtml(project.cardTitle)}</a></h3>
          <p>${escapeHtml(project.cardDescription)}</p>
          <a class="project-link" href="${caseUrl(project, lang)}">${escapeHtml(translate("projectCardLink", lang))}</a>
        </div>
      </article>`;
    }).join("");
    window.observePortfolioReveals?.(grid);
  };

  const renderProjectFilters = (lang) => {
    const filters = document.querySelector("#project-filters");
    if (!filters) return;
    filters.setAttribute("aria-label", translate("filterGroup", lang));
    const categories = [
      ["all", "projectFilterAll"],
      ["web", "projectFilterWeb"],
      ["advertising", "projectFilterAdvertising"],
      ["design", "projectFilterDesign"],
      ["automation", "projectFilterAutomation"],
      ["lead-generation", "projectFilterLeadGeneration"]
    ];
    filters.innerHTML = categories.map(([category, key]) => {
      const active = category === selectedProjectCategory;
      return `<button class="project-filter${active ? " is-active" : ""}" type="button" data-project-filter="${category}" aria-pressed="${active}">${escapeHtml(translate(key, lang))}</button>`;
    }).join("");
    filters.querySelectorAll("[data-project-filter]").forEach((button) => {
      button.addEventListener("click", () => {
        selectedProjectCategory = button.dataset.projectFilter;
        filters.querySelectorAll("[data-project-filter]").forEach((filter) => {
          const active = filter.dataset.projectFilter === selectedProjectCategory;
          filter.classList.toggle("is-active", active);
          filter.setAttribute("aria-pressed", String(active));
        });
        renderProjects(language());
      });
    });
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
    const track = document.querySelector(".timeline-track");
    const progress = document.querySelector(".timeline-progress");
    if (!track || !progress) return;
    if (reducedMotion.matches) {
      progress.style.height = "100%";
      return;
    }
    const bounds = track.getBoundingClientRect();
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
    return (project.galleryImages || []).map((image) => ({
        src: image.src,
        width: image.width || 2160,
        height: image.height || 1215,
        alt: image.alt?.[lang] || image.alt?.hr || project.name
      }));
  };

  const renderCaseGallery = (project, lang) => {
    const slides = getGallerySlides(project, lang);
    if (!slides.length) return "";

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
        <button class="gallery-arrow gallery-arrow-previous" type="button" data-gallery-previous aria-label="${escapeHtml(translate("previousImage", lang))}"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M15 18 9 12l6-6"></path></svg></button>
        <button class="gallery-arrow gallery-arrow-next" type="button" data-gallery-next aria-label="${escapeHtml(translate("nextImage", lang))}"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m9 18 6-6-6-6"></path></svg></button>
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
      const imageSource = project.cardImage;
      const imageAlt = lang === "hr" ? project.cardImageAltHr || project.cardImageAlt : project.cardImageAlt;
      const image = imageSource
        ? `<a class="project-image project-image-contain" href="${caseUrl(project, lang)}" aria-label="${escapeHtml(`${translate("moreProject", lang)}: ${project.name}`)}"><img src="${escapeHtml(imageSource)}" alt="${escapeHtml(imageAlt || project.name)}" width="${project.cardImageWidth || 1536}" height="${project.cardImageHeight || 1024}" loading="lazy" decoding="async"></a>`
        : "";
      const href = caseUrl(project, lang);
      return `<article class="project related-project-card">
        ${image}
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
          <button class="gallery-arrow" type="button" data-project-previous aria-label="${escapeHtml(translate("previousProjects", lang))}"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M15 18 9 12l6-6"></path></svg></button>
          <button class="gallery-arrow" type="button" data-project-next aria-label="${escapeHtml(translate("nextProjects", lang))}"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m9 18 6-6-6-6"></path></svg></button>
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
        ${projectGallery ? `<p class="case-visual-caption">${escapeHtml(translate("caseCaption", lang))}</p>` : ""}
      </section>
      <div class="case-sections">
        <aside class="case-index">${escapeHtml(translate("caseStudyPrefix", lang))} / ${escapeHtml(project.number)}</aside>
        <div class="case-copy">
          <section><div class="case-index">${escapeHtml(translate("sectionContext", lang))}</div><h2>${escapeHtml(translate("contextTitle", lang))}</h2>${renderParagraphs(project.caseSummary)}</section>
          <section><div class="case-index">${escapeHtml(translate("sectionGoal", lang))}</div><h2>${escapeHtml(translate("goalTitle", lang))}</h2>${renderParagraphs(project.goal)}</section>
          <section><div class="case-index">${escapeHtml(translate("sectionContribution", lang))}</div><h2>${escapeHtml(translate("contributionTitle", lang))}</h2>${renderParagraphs(project.contributionsIntro)}<ul>${contributions}</ul></section>
          <section><div class="case-index">${escapeHtml(translate("sectionSolution", lang))}</div><h2>${escapeHtml(translate("solutionTitle", lang))}</h2>${renderParagraphs(project.solution)}</section>
          <section><div class="case-index">${escapeHtml(translate("sectionResults", lang))}</div><h2>${escapeHtml(translate("resultsTitle", lang))}</h2>${renderParagraphs(project.results || translate("unverifiedResults", lang))}</section>
          <section><div class="case-index">${escapeHtml(translate("caseTechnologies", lang))}</div><h2>${escapeHtml(translate("caseTechnologies", lang))}</h2><ul class="technology-list">${technologies}</ul></section>
        </div>
      </div>
      ${renderRelatedProjects(sourceProject, lang)}
    </div>`;
    initializeCaseGallery(main);
    initializeProjectCarousel(main);
    updateMetadata({
      title: `${project.name} — ${translate("caseStudyPrefix", lang)} | Mate Nikić`,
      description: projectText(project.caseSummary),
      image: project.cardImage || "assets/mate-portrait.png",
      caseId: project.id
    });
  };

  const render = (lang, { updateUrl = true } = {}) => {
    window.portfolioLanguage = lang === "en" ? "en" : "hr";
    const selectedLanguage = language();
    updateCommonContent(selectedLanguage);
    if (document.querySelector("#projects")) {
      renderProjectFilters(selectedLanguage);
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

  const initializeContactDialog = () => {
    const dialog = document.querySelector("#contact-dialog");
    const form = dialog?.querySelector("[data-contact-form]");
    if (!dialog || !form || typeof dialog.showModal !== "function") return;
    const closeButton = dialog.querySelector("[data-contact-dialog-close]");
    const feedback = dialog.querySelector("[data-contact-feedback]");
    const messageField = dialog.querySelector("[data-contact-prefill]");
    const focusableSelector = 'a[href], button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), [tabindex]:not([tabindex="-1"])';
    let trigger = null;
    let previousBodyOverflow = "";

    const openDialog = (event) => {
      event.preventDefault();
      if (dialog.open) return;
      trigger = event.currentTarget;
      previousBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      form.reset();
      if (messageField) {
        messageField.value = translate("contactMessagePrefill");
        messageField.dataset.contactPrefill = messageField.value;
      }
      if (feedback) {
        feedback.textContent = "";
        delete feedback.dataset.emailFallback;
      }
      dialog.showModal();
      dialog.querySelector("#contact-name")?.focus();
    };

    document.querySelectorAll("[data-contact-dialog-open]").forEach((button) => {
      button.addEventListener("click", openDialog);
    });
    closeButton?.addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });
    dialog.addEventListener("close", () => {
      document.body.style.overflow = previousBodyOverflow;
      trigger?.focus({ preventScroll: true });
      trigger = null;
    });
    dialog.addEventListener("keydown", (event) => {
      if (event.key !== "Tab") return;
      const focusable = [...dialog.querySelectorAll(focusableSelector)]
        .filter((element) => element.getClientRects().length > 0);
      if (!focusable.length) {
        event.preventDefault();
        dialog.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const values = new FormData(form);
      const subject = translate("contactFormSubject");
      const body = [
        `${translate("contactNameLabel")}: ${values.get("name")}`,
        `${translate("contactEmailLabel")}: ${values.get("email")}`,
        "",
        values.get("message")
      ].join("\n");
      if (feedback) {
        feedback.textContent = translate("contactFormFallbackNotice");
        feedback.dataset.emailFallback = "true";
      }
      window.location.href = `mailto:matenikicbiz@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    });
  };

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
  const contactNavLink = navigation?.querySelector('[data-nav="contact"]');
  const contactOptions = document.querySelector("#hero-contact-options");
  const contactButtons = contactOptions ? [...contactOptions.querySelectorAll(".contact-option")] : [];
  let contactHighlightTimer = 0;
  let contactScrollFrame = 0;
  const highlightContactOptions = () => {
    contactButtons.forEach((button) => button.classList.add("is-highlighted"));
    window.clearTimeout(contactHighlightTimer);
    contactHighlightTimer = window.setTimeout(() => {
      contactButtons.forEach((button) => button.classList.remove("is-highlighted"));
      contactHighlightTimer = 0;
    }, 1000);
  };
  contactNavLink?.addEventListener("click", (event) => {
    if (!contactOptions) return;
    event.preventDefault();
    closeMenu();

    const hash = `#${contactOptions.id}`;
    if (window.location.hash !== hash) {
      window.history.pushState(window.history.state, "", hash);
    }
    if (contactScrollFrame) window.cancelAnimationFrame(contactScrollFrame);
    window.clearTimeout(contactHighlightTimer);

    const header = document.querySelector(".header");
    const bounds = contactOptions.getBoundingClientRect();
    const fullyVisible = bounds.top >= (header?.getBoundingClientRect().bottom || 0)
      && bounds.bottom <= window.innerHeight;
    if (fullyVisible) {
      highlightContactOptions();
      return;
    }
    if (reduceMotion.matches) {
      contactOptions.scrollIntoView({ behavior: "instant", block: "center" });
      highlightContactOptions();
      return;
    }

    let previousTop = bounds.top;
    let hasMoved = false;
    let stableFrames = 0;
    contactOptions.scrollIntoView({ behavior: "smooth", block: "center" });
    const waitForScrollToSettle = () => {
      const currentTop = contactOptions.getBoundingClientRect().top;
      if (Math.abs(currentTop - previousTop) > 0.5) {
        hasMoved = true;
        stableFrames = 0;
      } else {
        stableFrames += 1;
      }
      previousTop = currentTop;
      if ((hasMoved && stableFrames >= 4) || (!hasMoved && stableFrames >= 8)) {
        contactScrollFrame = 0;
        highlightContactOptions();
        return;
      }
      contactScrollFrame = window.requestAnimationFrame(waitForScrollToSettle);
    };
    contactScrollFrame = window.requestAnimationFrame(waitForScrollToSettle);
  });
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
  initializeContactDialog();

  const tickerTrack = document.querySelector("#ticker-track");
  if (tickerTrack) {
    const pauseTicker = () => tickerAnimation?.pause();
    const resumeTicker = () => {
      if (!tickerTrack.matches(":hover, :focus-within") && !reduceMotion.matches) tickerAnimation?.play();
    };
    tickerTrack.addEventListener("pointerenter", pauseTicker);
    tickerTrack.addEventListener("pointerleave", resumeTicker);
    tickerTrack.addEventListener("focusin", pauseTicker);
    tickerTrack.addEventListener("focusout", resumeTicker);
    const reconfigureTicker = () => {
      const copy = tickerTrack.querySelector(".ticker-copy");
      const ticker = tickerTrack.closest(".ticker");
      if (copy && ticker) configureTicker(tickerTrack, ticker, copy);
    };
    if (!("ResizeObserver" in window)) window.addEventListener("resize", reconfigureTicker);
    const updateTickerMotion = () => renderTicker(language());
    if (reduceMotion.addEventListener) reduceMotion.addEventListener("change", updateTickerMotion);
    else reduceMotion.addListener?.(updateTickerMotion);
    document.fonts?.ready.then(reconfigureTicker);
  }
})();
