// script.js
document.addEventListener("DOMContentLoaded", () => {
  // —— Sidebar toggle
  const sidebarNav = document.querySelector(".portal-nav");
  const sidebarToggle = document.getElementById("sidebarToggle");
  sidebarToggle.addEventListener("click", () => {
    sidebarNav.classList.toggle("collapsed");
  });

  // —— The rest of your existing logic…
  const mainContainer = document.getElementById("mainSections");
  const navList = document.querySelector(".portal-nav ul");
  const settingsBtn = document.getElementById("settingsBtn");
  const topToolbar = document.querySelector(".top-toolbar");
  const iconBtns = document.querySelectorAll(
    ".top-toolbar .icon-btn[data-action]"
  );
  const iconPopup = document.getElementById("iconPopup");
  const popupContent = document.getElementById("popupContent");
  const popupSave = document.getElementById("popupSave");
  const popupCancel = document.getElementById("popupCancel");
  const scrollBtn = document.getElementById("scrollTopBtn");

  let draggingMode = false,
    dragSrcEl = null,
    originalNodes = [];

  // — Helpers —
  function syncMenuToSections() {
    Array.from(mainContainer.children).forEach((sec) => {
      const li = navList.querySelector(
        `li a[href="#${sec.id}"]`
      )?.parentElement;
      if (li) navList.appendChild(li);
    });
  }
  function setLoading(id) {
    document.getElementById(id).innerHTML =
      '<div class="loader"><span></span><span></span><span></span></div>';
  }

  // — Drag & Drop Handlers —
  function handleDragStart(e) {
    dragSrcEl = this;
    this.classList.add("dragging");
    e.dataTransfer.effectAllowed = "move";
  }
  function handleDragOver(e) {
    e.preventDefault();
    const target = this;
    if (target === dragSrcEl) return;
    const rect = target.getBoundingClientRect();
    const after = (e.clientY - rect.top) / rect.height > 0.5;
    mainContainer.insertBefore(dragSrcEl, after ? target.nextSibling : target);
  }
  function handleDragEnd() {
    this.classList.remove("dragging");
    syncMenuToSections();
  }
  function addDragHandlers(sec) {
    sec.addEventListener("dragstart", handleDragStart);
    sec.addEventListener("dragover", handleDragOver);
    sec.addEventListener("dragend", handleDragEnd);
  }
  function removeDragHandlers(sec) {
    sec.removeEventListener("dragstart", handleDragStart);
    sec.removeEventListener("dragover", handleDragOver);
    sec.removeEventListener("dragend", handleDragEnd);
  }

  function enterDragMode() {
    draggingMode = true;
    originalNodes = Array.from(mainContainer.children);

    document.body.classList.add("edit-mode");
    iconBtns.forEach((b) => b.classList.add("hidden"));

    // ✅ Save
    const saveBtn = document.createElement("button");
    saveBtn.id = "saveReorderBtn";
    saveBtn.className = "icon-btn save-icon";
    saveBtn.innerHTML = `<span>✅</span><small>Save</small>`;
    saveBtn.onclick = () => {
      exitDragMode();
      const order = Array.from(mainContainer.children).map((s) => s.id);
      localStorage.setItem("sectionOrder", JSON.stringify(order));
      syncMenuToSections();
    };

    // ❌ Cancel
    const cancelBtn = document.createElement("button");
    cancelBtn.id = "cancelReorderBtn";
    cancelBtn.className = "icon-btn cancel-icon";
    cancelBtn.innerHTML = `<span>❌</span><small>Cancel</small>`;
    cancelBtn.onclick = () => {
      mainContainer.innerHTML = "";
      originalNodes.forEach((n) => mainContainer.appendChild(n));
      syncMenuToSections();
      exitDragMode();
    };

    topToolbar.appendChild(saveBtn);
    topToolbar.appendChild(cancelBtn);

    Array.from(mainContainer.children).forEach((sec) => {
      sec.setAttribute("draggable", true);
      sec.classList.add("editing");
      addDragHandlers(sec);
    });
  }

  function exitDragMode() {
    draggingMode = false;
    document.body.classList.remove("edit-mode");
    iconBtns.forEach((b) => b.classList.remove("hidden"));
    document.getElementById("saveReorderBtn")?.remove();
    document.getElementById("cancelReorderBtn")?.remove();

    Array.from(mainContainer.children).forEach((sec) => {
      sec.removeAttribute("draggable");
      sec.classList.remove("editing", "dragging");
      removeDragHandlers(sec);
    });
  }

  // — Settings / Toolbar —
  settingsBtn.addEventListener("click", () => {
    topToolbar.classList.toggle("visible");
  });

  iconBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const action = btn.dataset.action;
      iconPopup.classList.add("hidden");

      if (action === "reorder" && !draggingMode) {
        popupContent.innerHTML = "<p>Click ✅ to save or ❌ to cancel.</p>";
        popupSave.textContent = "Start";
        popupSave.onclick = () => {
          iconPopup.classList.add("hidden");
          enterDragMode();
        };
        iconPopup.classList.remove("hidden");
      } else if (action === "theme") {
        popupContent.innerHTML = "<p>Theming options coming soon…</p>";
        popupSave.textContent = "OK";
        popupSave.onclick = () => iconPopup.classList.add("hidden");
        iconPopup.classList.remove("hidden");
      } else if (action === "reset") {
        popupContent.innerHTML = "<p>Reset to default?</p>";
        popupSave.textContent = "Reset";
        popupSave.onclick = () => {
          localStorage.removeItem("sectionOrder");
          location.reload();
        };
        iconPopup.classList.remove("hidden");
      }
    });
  });

  popupCancel.addEventListener("click", () => {
    iconPopup.classList.add("hidden");
  });

  // — Scroll to Top —
  window.addEventListener("scroll", () => {
    scrollBtn.style.display = window.scrollY > 300 ? "flex" : "none";
  });
  scrollBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  // — CVSS Severity Helper —
  const getSeverityClass = (score) => {
    const n = parseFloat(score);
    if (n >= 7) return "severe";
    if (n >= 4) return "high";
    if (n > 0) return "medium";
    return "neutral";
  };

  // — Fetch & Render —
  async function fetchMicrosoftUpdates() {
    setLoading("microsoft-content");
    try {
      const data = await (
        await fetch("http://localhost:3000/api/updates")
      ).json();
      const list = (data["vuln:Vulnerability"] || [])
        .filter((v) => v["vuln:Title"])
        .map((v) => ({
          title: v["vuln:Title"],
          baseScore:
            v["vuln:CVSSScoreSets"]?.["vuln:ScoreSet"]?.[0]?.[
              "vuln:BaseScore"
            ] || "N/A",
          status: (
            v["vuln:Threats"]?.["vuln:Threat"]?.[0]?.["vuln:Description"] || ""
          ).includes("Exploited:Yes")
            ? "Exploited"
            : "Not Exploited",
          date:
            v["vuln:RevisionHistory"]?.["vuln:Revision"]?.[0]?.["cvrf:Date"] ||
            "N/A",
        }))
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 3);

      document.getElementById("microsoft-content").innerHTML = list
        .map(
          (v) => `
          <div class="news-card">
            <div class="score-badge ${getSeverityClass(v.baseScore)}">
              CVSS: ${v.baseScore}
            </div>
            <h4>${v.title}</h4>
            <div class="meta-info">
              <span class="status-dot ${
                v.status === "Exploited" ? "exploited" : "safe"
              }"></span>${v.status}
              <span>📅${
                v.date === "N/A"
                  ? "No Date"
                  : new Date(v.date).toLocaleDateString()
              }</span>
            </div>
          </div>
        `
        )
        .join("");
    } catch (e) {
      console.error(e);
    }
  }

  async function fetchCisaUpdates() {
    setLoading("cisa-content");
    try {
      const data = await (await fetch("http://localhost:3000/api/cisa")).json();
      const list = data
        .map((v) => ({
          title: v.vulnerabilityName,
          date: new Date(v.dateAdded),
        }))
        .sort((a, b) => b.date - a.date)
        .slice(0, 3);

      document.getElementById("cisa-content").innerHTML = list
        .map(
          (u) => `
          <div class="news-card">
            <h4>${u.title}</h4>
            <div class="meta-info">📅${u.date.toLocaleDateString()}</div>
          </div>
        `
        )
        .join("");
    } catch (e) {
      console.error(e);
    }
  }

  async function fetchRedHatUpdates() {
    setLoading("redhat-content");
    try {
      const data = await (
        await fetch("http://localhost:3000/api/redhat")
      ).json();
      const list = data.filter((v) => v.title).slice(0, 3);
      document.getElementById("redhat-content").innerHTML = list
        .map(
          (v) => `
          <div class="news-card">
            <h4>${v.title}</h4>
            <div class="meta-info">${
              v.publicDate !== "No date provided"
                ? new Date(v.publicDate).toLocaleDateString()
                : "No Date"
            }</div>
          </div>
        `
        )
        .join("");
    } catch (e) {
      console.error(e);
    }
  }

  async function fetchTrendingArticles() {
    setLoading("trending-content");
    try {
      const apiKey = "aa46aa2754214ac295aa1e80213c829d";
      const data = await (
        await fetch(
          `https://newsapi.org/v2/everything?q=cybersecurity&apiKey=${apiKey}`
        )
      ).json();
      const list = (data.articles || [])
        .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
        .slice(0, 3);

      document.getElementById("trending-content").innerHTML = list
        .map(
          (a) => `
          <div class="news-card">
            <h4>${a.title}</h4>
            <div class="meta-info">📅${new Date(
              a.publishedAt
            ).toLocaleDateString()}</div>
          </div>
        `
        )
        .join("");
    } catch (e) {
      console.error(e);
    }
  }

  // — Initialize —
  const saved = JSON.parse(localStorage.getItem("sectionOrder") || "[]");
  if (saved.length) {
    saved.forEach((id) => {
      const sec = document.getElementById(id);
      if (sec) mainContainer.appendChild(sec);
    });
  }
  syncMenuToSections();
  fetchMicrosoftUpdates();
  fetchCisaUpdates();
  fetchRedHatUpdates();
  fetchTrendingArticles();
});
