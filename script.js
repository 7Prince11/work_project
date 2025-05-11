document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("theme") === "dark")
    document.body.classList.add("dark-mode");

  const sidebarNav = document.querySelector(".portal-nav");
  const sidebarToggle = document.getElementById("sidebarToggle");
  sidebarToggle.addEventListener("click", () =>
    sidebarNav.classList.toggle("collapsed")
  );

  const themeToggle = document.getElementById("themeToggle");
  const themeLabel = document.querySelector(".theme-label");

  // initialize from localStorage
  const isDark = localStorage.getItem("theme") === "dark";
  themeToggle.checked = isDark;
  document.body.classList.toggle("dark-mode", isDark);
  themeLabel.textContent = `Theme: ${isDark ? "Dark" : "Light"}`;

  // on user toggle
  themeToggle.addEventListener("change", (e) => {
    const dark = e.target.checked;
    document.body.classList.toggle("dark-mode", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
    themeLabel.textContent = `Theme: ${dark ? "Dark" : "Light"}`;
  });

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

  settingsBtn.addEventListener("click", () =>
    topToolbar.classList.toggle("visible")
  );

  iconBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      iconPopup.classList.add("hidden");
      const action = btn.dataset.action;
      if (action === "theme") {
        const isDark = document.body.classList.toggle("dark-mode");
        localStorage.setItem("theme", isDark ? "dark" : "light");
        return;
      }
      if (action === "reorder") {
        if (!draggingMode) {
          popupContent.innerHTML = "<p>Click ✅ to save or ❌ to cancel.</p>";
          popupSave.textContent = "Start";
          popupSave.onclick = () => {
            iconPopup.classList.add("hidden");
            enterDragMode();
          };
          iconPopup.classList.remove("hidden");
        }
      } else if (action === "reset") {
        popupContent.innerHTML = "<p>Reset to default?</p>";
        popupSave.textContent = "Reset";
        popupSave.onclick = () => {
          localStorage.clear();
          location.reload();
        };
        iconPopup.classList.remove("hidden");
      }
    });
  });

  popupCancel.addEventListener("click", () =>
    iconPopup.classList.add("hidden")
  );

  window.addEventListener("scroll", () => {
    scrollBtn.style.display = window.scrollY > 300 ? "flex" : "none";
  });
  scrollBtn.addEventListener("click", () =>
    window.scrollTo({ top: 0, behavior: "smooth" })
  );

  // default menu order
  const defaultMenuOrder = [
    "#about",
    "#microsoft-news",
    "#cisa-news",
    "#redhat-news",
    "#nvd-news", // Add this line
    "#trending-news",
  ];

  let draggedMenuItem = null;
  let dragState = { origin: null, index: -1 };

  function initializeMenuDragDrop() {
    const usingList = document.getElementById("usingList");
    const notUsingList = document.getElementById("notUsingList");
    let state = JSON.parse(localStorage.getItem("menuState"));

    // First check if state exists
    if (!state) {
      state = { using: [...defaultMenuOrder], notUsing: [] };
    }

    // Then check for missing NVD
    if (
      !state.using.includes("#nvd-news") &&
      !state.notUsing.includes("#nvd-news")
    ) {
      state.using.push("#nvd-news");
    }

    // Sort by default order
    state.using.sort(
      (a, b) => defaultMenuOrder.indexOf(a) - defaultMenuOrder.indexOf(b)
    );
    state.notUsing.sort(
      (a, b) => defaultMenuOrder.indexOf(a) - defaultMenuOrder.indexOf(b)
    );

    // Save sorted state
    localStorage.setItem("menuState", JSON.stringify(state));

    // Clear and rebuild lists
    usingList.innerHTML = "";
    notUsingList.innerHTML = "";
    state.using.forEach((href) => usingList.appendChild(createMenuItem(href)));
    state.notUsing.forEach((href) =>
      notUsingList.appendChild(createMenuItem(href))
    );

    updateListStates();
    updateSectionVisibility();

    // Add event listeners
    document
      .querySelectorAll(".draggable-list li:not(.placeholder)")
      .forEach((item) => {
        item.addEventListener("dragstart", handleMenuDragStart);
        item.addEventListener("dragend", handleMenuDragEnd);
      });

    [usingList, notUsingList].forEach((list) => {
      list.addEventListener("dragover", handleMenuDragOver);
      list.addEventListener("drop", handleMenuDrop);
    });
  }

  function handleMenuDragStart(e) {
    draggedMenuItem = this;
    const parent = this.parentElement;
    dragState.origin = parent.id;
    const items = Array.from(parent.querySelectorAll("li:not(.placeholder)"));
    dragState.index = items.indexOf(this);
    setTimeout(() => this.classList.add("dragging"), 0);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleMenuDragEnd() {
    this.classList.remove("dragging");
    saveMenuState();
    updateSectionVisibility();
  }

  function handleMenuDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function handleMenuDrop(e) {
    e.preventDefault();
    if (!draggedMenuItem) return;
    const targetList = this;
    if (targetList === draggedMenuItem.parentElement) return;
    // clear placeholder
    if (targetList.querySelector(".placeholder")) targetList.innerHTML = "";
    const clone = draggedMenuItem.cloneNode(true);
    clone.addEventListener("dragstart", handleMenuDragStart);
    clone.addEventListener("dragend", handleMenuDragEnd);

    if (targetList.id === "usingList") {
      if (dragState.origin === "usingList") {
        // internal reorder: insert at original index
        const present = Array.from(
          targetList.querySelectorAll("li:not(.placeholder)")
        );
        const ref = present[dragState.index] || null;
        targetList.insertBefore(clone, ref);
      } else {
        // coming back from notUsing: insert by defaultMenuOrder
        const href = clone.querySelector("a").getAttribute("href");
        const defaultIdx = defaultMenuOrder.indexOf(href);
        const siblings = Array.from(
          targetList.querySelectorAll("li:not(.placeholder)")
        );
        let inserted = false;
        for (let sib of siblings) {
          const sibHref = sib.querySelector("a").getAttribute("href");
          const sibIdx = defaultMenuOrder.indexOf(sibHref);
          if (sibIdx > defaultIdx) {
            targetList.insertBefore(clone, sib);
            inserted = true;
            break;
          }
        }
        if (!inserted) targetList.appendChild(clone);
      }
    } else {
      // always append to notUsing
      targetList.appendChild(clone);
    }

    draggedMenuItem.remove();
    updateListStates();
  }

  function updateListStates() {
    ["usingList", "notUsingList"].forEach((id) => {
      const list = document.getElementById(id);
      if (list.children.length === 0) {
        const ph = document.createElement("li");
        ph.className = "placeholder";
        ph.textContent = "Nothing here";
        list.appendChild(ph);
      } else {
        const ph = list.querySelector(".placeholder");
        if (ph && list.children.length > 1) ph.remove();
      }
    });
  }

  function saveMenuState() {
    const using = Array.from(document.querySelectorAll("#usingList a")).map(
      (a) => a.getAttribute("href")
    );
    const notUsing = Array.from(
      document.querySelectorAll("#notUsingList a")
    ).map((a) => a.getAttribute("href"));
    localStorage.setItem("menuState", JSON.stringify({ using, notUsing }));
  }

  function updateSectionVisibility() {
    const visible = Array.from(document.querySelectorAll("#usingList a")).map(
      (a) => a.getAttribute("href").substring(1)
    );
    document.querySelectorAll(".news-section").forEach((sec) => {
      sec.style.display = visible.includes(sec.id) ? "block" : "none";
    });
  }

  function createMenuItem(href) {
    const li = document.createElement("li");
    li.draggable = true;
    const a = document.createElement("a");
    a.href = href;
    let text = href.replace("#", "").replace("-news", "").replace(/-/g, " ");
    text = text.charAt(0).toUpperCase() + text.slice(1);
    a.textContent = text;
    li.appendChild(a);
    return li;
  }

  // Section drag-and-drop reordering
  let draggingMode = false;
  let dragSrcEl = null;
  let originalNodes = [];
  const mainContainer = document.getElementById("mainSections");

  function syncMenuToSections() {
    const navUl = document.querySelector(".portal-nav ul");
    Array.from(mainContainer.children).forEach((sec) => {
      const li = navUl.querySelector(`li a[href="#${sec.id}"]`);
      if (li && li.parentElement) navUl.appendChild(li.parentElement);
    });
  }

  function setLoading(id) {
    document.getElementById(id).innerHTML =
      '<div class="loader"><span></span><span></span><span></span></div>';
  }

  function handleSectionDragStart(e) {
    dragSrcEl = this;
    this.classList.add("dragging");
    e.dataTransfer.effectAllowed = "move";
  }

  function handleSectionDragOver(e) {
    e.preventDefault();
    if (this === dragSrcEl) return;
    const rect = this.getBoundingClientRect();
    const after = (e.clientY - rect.top) / rect.height > 0.5;
    mainContainer.insertBefore(dragSrcEl, after ? this.nextSibling : this);
  }

  function handleSectionDragEnd() {
    this.classList.remove("dragging");
    syncMenuToSections();
  }

  function addSectionDragHandlers(sec) {
    sec.addEventListener("dragstart", handleSectionDragStart);
    sec.addEventListener("dragover", handleSectionDragOver);
    sec.addEventListener("dragend", handleSectionDragEnd);
  }

  function removeSectionDragHandlers(sec) {
    sec.removeEventListener("dragstart", handleSectionDragStart);
    sec.removeEventListener("dragover", handleSectionDragOver);
    sec.removeEventListener("dragend", handleSectionDragEnd);
  }

  function enterDragMode() {
    draggingMode = true;
    originalNodes = Array.from(mainContainer.children);
    document.body.classList.add("edit-mode");
    iconBtns.forEach((b) => b.classList.add("hidden"));

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
      addSectionDragHandlers(sec);
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
      removeSectionDragHandlers(sec);
    });
  }

  const getSeverityClass = (score) => {
    const n = parseFloat(score);
    if (n >= 7) return "severe";
    if (n >= 4) return "high";
    if (n > 0) return "medium";
    return "neutral";
  };

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
          exploited: (v["vuln:Threats"]?.["vuln:Threat"] || []).some((t) =>
            t["vuln:Description"]?.includes("Exploited:Yes")
          ),
          date:
            v["vuln:RevisionHistory"]?.["vuln:Revision"]?.[0]?.["cvrf:Date"] ||
            "N/A",
        }))
        .slice(0, 4);
      document.getElementById("microsoft-content").innerHTML = list
        .map(
          (v) => `
          <div class="news-card">
            <div class="score-badge ${getSeverityClass(v.baseScore)}">CVSS: ${
            v.baseScore
          }</div>
            <h4>${v.title}</h4>
            <div class="meta-info">
              <span class="status-dot ${
                v.exploited ? "exploited" : "safe"
              }"></span>
              ${v.exploited ? "Exploited" : "Not Exploited"}
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
        .slice(0, 4);
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
      const list = data.filter((v) => v.title).slice(0, 4);
      document.getElementById("redhat-content").innerHTML = list
        .map(
          (v) => `
          <div class="news-card">
            <h4>${v.title}</h4>
            <div class="meta-info">📅${
              v.publicDate
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
      const list = (data.articles || []).slice(0, 4);
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

  async function fetchNvdUpdates() {
    setLoading("nvd-content");
    try {
      const data = await (await fetch("http://localhost:3000/api/nvd")).json();
      const list = data.slice(0, 4).map((vuln) => ({
        id: vuln.id,
        description: vuln.description.substring(0, 100) + "...",
        cvssScore: vuln.cvssScore,
        severity: getSeverity(vuln.cvssScore),
        date: new Date(vuln.publishedDate),
      }));

      document.getElementById("nvd-content").innerHTML = list
        .map(
          (vuln) => `
        <div class="news-card">
          <div class="score-badge ${vuln.severity}">${vuln.id}</div>
          <h4>${vuln.description}</h4>
          <div class="meta-info">
            <span>CVSS: ${vuln.cvssScore}</span>
            <span>📅 ${vuln.date.toLocaleDateString()}</span>
          </div>
        </div>
      `
        )
        .join("");
    } catch (e) {
      console.error(e);
      document.getElementById("nvd-content").innerHTML =
        '<div class="news-card">Error loading NVD data</div>';
    }
  }

  // apply saved section order
  const savedOrder = JSON.parse(localStorage.getItem("sectionOrder") || "[]");
  if (savedOrder.length) {
    savedOrder.forEach((id) => {
      const sec = document.getElementById(id);
      if (sec) mainContainer.appendChild(sec);
    });
  }
  // Helper function for severity
  const getSeverity = (score) => {
    if (score === "N/A") return "neutral";
    const n = parseFloat(score);
    if (n >= 9.0) return "severe";
    if (n >= 7.0) return "high";
    if (n >= 4.0) return "medium";
    return "neutral";
  };
  initializeMenuDragDrop();
  updateSectionVisibility();
  fetchMicrosoftUpdates();
  fetchCisaUpdates();
  fetchRedHatUpdates();
  fetchNvdUpdates();
  fetchTrendingArticles();
});
