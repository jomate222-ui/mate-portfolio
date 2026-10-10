(() => {
  const base = new URL(".", document.currentScript.src);
  const files = ["projects.js", "i18n.js", "portfolio.js", "site.js"];

  const load = (file) => new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = new URL(file, base).href;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Unable to load ${file}.`));
    document.body.append(script);
  });

  files.reduce((chain, file) => chain.then(() => load(file)), Promise.resolve())
    .catch((error) => console.error("Portfolio initialization failed.", error));
})();
