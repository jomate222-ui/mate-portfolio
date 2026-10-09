(() => {
  const projects = window.PORTFOLIO_PROJECTS;
  const translations = window.PORTFOLIO_I18N;
  if (!Array.isArray(projects) || !translations) {
    throw new Error("Portfolio content was not loaded.");
  }

  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
  const t = (key, language = window.portfolioLanguage) => translations.ui[language][key] || translations.ui.hr[key] || key;
  const projectContent = (project, language) => ({
    ...project,
    ...(language === "en" ? translations.projects[project.id] : {})
  });
  const categories = {
    web: "filterWeb",
    branding: "filterBranding",
    crm: "filterCrm",
    marketing: "filterMarketing",
    ecommerce: "filterEcommerce",
    portal: "filterPortal",
    seo: "filterSeo"
  };

  const screenshotMarkup = (project, language, sourcePrefix = "", className = "case-visual", includeCardLabel = false) => {
    const ui = translations.ui[language];
    const alt = language === "hr" ? project.screenshotAltHr || project.screenshotAlt : project.screenshotAlt;
    const labels = project.comparison
      ? `<div class="comparison-labels" aria-label="${escapeHtml(ui.before)} / ${escapeHtml(ui.after)}"><span>${escapeHtml(ui.before)}</span><span>${escapeHtml(ui.after)}</span></div>`
      : "";
    const cardLabel = includeCardLabel
      ? `<span class="visual-label">${escapeHtml(project.cardLabel)}</span>`
      : "";

    if (!project.screenshot) {
      return `<div class="${className} missing-visual" role="img" aria-label="${escapeHtml(alt)}"><div class="screenshot-placeholder">${escapeHtml(project.placeholder)}</div>${cardLabel}${labels}</div>`;
    }

    return `<div class="${className}"><img alt="${escapeHtml(alt)}" loading="lazy" src="${sourcePrefix}${escapeHtml(project.screenshot)}">${cardLabel}${labels}</div>`;
  };

  const createCard = (sourceProject, language) => {
    const project = projectContent(sourceProject, language);
    const services = project.cardServices.map((service) => `<li>${escapeHtml(service)}</li>`).join("");
    const liveLink = project.liveUrl
      ? `<a class="case-action case-action-secondary" href="${escapeHtml(project.liveUrl)}" rel="noopener noreferrer" target="_blank">${escapeHtml(t("visitSite", language))}</a>`
      : `<span class="case-action case-action-secondary">${escapeHtml(t("comingSoon", language))}</span>`;

    return `<article class="project reveal" data-categories="${project.categories.map(escapeHtml).join(" ")}" data-industry="${escapeHtml(project.industry)}" data-name="${escapeHtml(project.name.toLocaleLowerCase(language))}">
      ${screenshotMarkup(project, language, "", "case-visual", true)}
      <div class="case-content">
        <h3>${escapeHtml(project.name)}</h3>
        <p class="case-description">${escapeHtml(project.companyDescription)}</p>
        <div class="card-details">
          <div class="card-details-inner">
            <span class="case-kicker">${escapeHtml(t("cardProject", language))} ${escapeHtml(project.number)}  /  ${escapeHtml(project.cardCategory)}</span>
            <ul class="case-services">${services}</ul>
            <div class="card-project-facts">
              <p><span>${escapeHtml(t("priceLabel", language))}</span><strong>${escapeHtml(project.price || t("pricePlaceholder", language))}</strong></p>
              <p><span>${escapeHtml(t("durationLabel", language))}</span><strong>${escapeHtml(project.duration)}</strong></p>
            </div>
          </div>
        </div>
        <div class="case-actions">
          <a class="case-action case-action-primary" href="${escapeHtml(project.caseUrl)}">${escapeHtml(t("moreProject", language))}</a>
          ${liveLink}
        </div>
      </div>
    </article>`;
  };

  const renderHome = (language) => {
    const projectGrid = document.querySelector(".grid");
    if (projectGrid) projectGrid.innerHTML = projects.map((project) => createCard(project, language)).join("");

    document.querySelectorAll("[data-i18n]").forEach((element) => {
      const value = t(element.dataset.i18n, language);
      if (value !== element.dataset.i18n) element.textContent = value;
    });
    document.querySelectorAll("[data-i18n-html]").forEach((element) => {
      const value = t(element.dataset.i18nHtml, language);
      if (value !== element.dataset.i18nHtml) element.innerHTML = value;
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
      element.setAttribute("placeholder", t(element.dataset.i18nPlaceholder, language));
    });
    document.querySelectorAll("[data-i18n-aria-label]").forEach((element) => {
      element.setAttribute("aria-label", t(element.dataset.i18nAriaLabel, language));
    });

    const expertiseItems = document.querySelector("#expertise-list");
    if (expertiseItems) {
      expertiseItems.innerHTML = t("expertiseItems", language)
        .map((item) => `<li>${escapeHtml(item)}</li>`).join("");
    }
    renderTimeline(language);
    const title = language === "en"
      ? "Mate Nikić — Digital, Marketing & Web"
      : "Mate Nikić — Digital, marketing i web";
    document.title = title;
    const description = document.querySelector('meta[name="description"]');
    if (description) {
      description.content = language === "en"
        ? "Mate Nikić connects web, marketing, technology, and operations to help businesses communicate their value."
        : "Mate Nikić povezuje web, marketing, tehnologiju i operacije kako bi tvrtke jasnije pokazale svoju vrijednost.";
    }
  };

  const renderTimeline = (language) => {
    const timeline = document.querySelector("#career-timeline");
    if (!timeline) return;
    timeline.innerHTML = translations.ui[language].timelineItems.map((item, index) => `
      <li class="timeline-item" data-timeline-item>
        <span class="timeline-marker" aria-hidden="true"></span>
        <article class="timeline-card">
          <p class="timeline-date">${escapeHtml(item.date)}</p>
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.description)}</p>
        </article>
      </li>`).join("");
    window.observePortfolioTimeline?.();
  };

  const renderCaseStudy = (language) => {
    const caseStudyPath = window.location.pathname.match(/\/projects\/([^/]+)/);
    if (!caseStudyPath) return;
    const projectId = caseStudyPath[1];
    const sourceProject = projects.find((item) => item.id === projectId);
    if (!sourceProject) throw new Error(`No project data found for case study "${projectId}".`);
    const project = projectContent(sourceProject, language);
    const caseStudy = document.querySelector("main > .wrap");
    if (!caseStudy) throw new Error(`Case study "${projectId}" is missing its main content wrapper.`);
    const serviceLabels = [...new Set(project.categories)]
      .map((category) => categories[category] && t(categories[category], language))
      .filter(Boolean).join(" · ");
    const liveAction = project.liveUrl
      ? `<a class="btn primary" href="${escapeHtml(project.liveUrl)}" rel="noopener noreferrer" target="_blank">${escapeHtml(t("caseVisit", language))}</a>`
      : "";
    const image = project.screenshot
      ? screenshotMarkup(project, language, "../../", "case-image reveal")
      : `<div class="case-image reveal missing-visual"><div class="screenshot-placeholder">${escapeHtml(project.name)}</div><span>${escapeHtml(t("casePlaceholder", language))}</span></div>`;

    caseStudy.innerHTML = `<section class="detail-hero">
      <a class="back" href="../../index.html#work">${escapeHtml(t("caseBack", language))}</a>
      <div class="eyebrow" style="margin-top:42px">${escapeHtml(t("caseStudyPrefix", language))} / ${escapeHtml(project.number)} · ${escapeHtml(project.caseCategory)}</div>
      <h1>${escapeHtml(project.name)}</h1>
      <p class="lead">${escapeHtml(project.lead)}</p>
      <div class="actions">${liveAction}<a class="btn" href="../../index.html#contact">${escapeHtml(t("caseContact", language))}</a></div>
      <div class="case-facts">
        <div><span>${escapeHtml(t("factIndustry", language))}</span><strong>${escapeHtml(project.industry)}</strong></div>
        <div><span>${escapeHtml(t("factRoleCase", language))}</span><strong>${escapeHtml(project.role)}</strong></div>
        <div><span>${escapeHtml(t("durationLabel", language))}</span><strong>${escapeHtml(project.duration)}</strong></div>
        <div><span>${escapeHtml(t("factServices", language))}</span><strong>${escapeHtml(serviceLabels)}</strong></div>
        <div><span>${escapeHtml(t("factValue", language))}</span><strong>${escapeHtml(project.detailPrice)}</strong></div>
      </div>
      <p class="detail-price-note">${escapeHtml(t("priceNote", language))}</p>
    </section>
    ${image}
    <div class="case-visual-caption">${escapeHtml(t("caseCaption", language))}</div>
    <section class="case-template">
      <div class="case-section reveal"><div class="case-index">${escapeHtml(t("sectionContext", language))}</div><div><h2>${escapeHtml(t("contextTitle", language))}</h2><p class="case-summary">${escapeHtml(project.caseSummary)}</p></div></div>
      <div class="case-section reveal"><div class="case-index">${escapeHtml(t("sectionGoal", language))}</div><div><h2>${escapeHtml(t("goalTitle", language))}</h2><p class="case-goal">${escapeHtml(project.goal)}</p></div></div>
      <div class="case-section reveal"><div class="case-index">${escapeHtml(t("sectionContribution", language))}</div><div><h2>${escapeHtml(t("contributionTitle", language))}</h2><ul class="checks case-contributions">${project.contributions.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></div></div>
      <div class="case-section reveal"><div class="case-index">${escapeHtml(t("sectionSolution", language))}</div><div><h2>${escapeHtml(t("solutionTitle", language))}</h2><p class="case-delivery">${escapeHtml(project.solution)}</p></div></div>
      <div class="case-section reveal"><div class="case-index">${escapeHtml(t("sectionResults", language))}</div><div><h2>${escapeHtml(t("resultsTitle", language))}</h2><p class="case-results">${escapeHtml(project.results || t("unverifiedResults", language))}</p></div></div>
    </section>
    <section class="section"><a class="back" href="../../index.html#work">${escapeHtml(t("caseBack", language))}</a></section>`;

    document.title = `${project.name} — ${language === "en" ? "Case Study" : "Studija slučaja"} | Mate Nikić`;
    const description = document.querySelector('meta[name="description"]');
    if (description) description.content = project.caseSummary;
  };

  window.renderPortfolioLanguage = (language) => {
    window.portfolioLanguage = language === "en" ? "en" : "hr";
    document.documentElement.lang = window.portfolioLanguage;
    const home = Boolean(document.querySelector(".hero"));
    if (home) renderHome(window.portfolioLanguage);
    renderCaseStudy(window.portfolioLanguage);
    window.observePortfolioReveals?.();
  };

  window.renderPortfolioLanguage(window.getPortfolioLanguage());
})();
