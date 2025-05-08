// theme.js
(function applyTheme() {
  function init() {
    const theme = localStorage.getItem("theme");
    if (theme === "dark") {
      document.body.classList.add("dark-mode");
    }
  }

  if (document.readyState === "loading") {
    // not yet parsed → wait for DOMContentLoaded
    document.addEventListener("DOMContentLoaded", init);
  } else {
    // already parsed
    init();
  }
})();
