// script.js

document.addEventListener("DOMContentLoaded", () => {
  const mainContainer = document.getElementById("mainSections");
  const navList = document.querySelector(".portal-nav ul");
  const customizeLink = document.getElementById("customize-link");
  const scrollBtn = document.getElementById("scrollTopBtn");
  const bottomToolbar = document.querySelector(".bottom-toolbar");
  const iconBtns = document.querySelectorAll(".icon-btn");
  const iconPopup = document.getElementById("iconPopup");
  const popupContent = document.getElementById("popupContent");
  const popupSave = document.getElementById("popupSave");
  const popupCancel = document.getElementById("popupCancel");

  let customizingMode = false;
  let draggingMode = false;
  let originalNodes = [];
  let dragSrcEl = null;

  // Move the Customize <li> to the bottom of the sidebar
  function moveCustomizeToBottom() {
    const li = customizeLink.parentElement;
    navList.appendChild(li);
  }

  // Reorder the side‐menu items to match the sections order
  function syncMenuToSections() {
    const order = Array.from(mainContainer.children).map((sec) => sec.id);
    order.forEach((id) => {
      const li = navList.querySelector(`li a[href="#${id}"]`)?.parentElement;
      if (li) navList.appendChild(li);
    });
    // always keep Customize last
    moveCustomizeToBottom();
  }

  // Insert three‐dot loader into a container
  function setLoading(id) {
    document.getElementById(id).innerHTML =
      '<div class="loader"><span></span><span></span><span></span></div>';
  }

  // --- Drag & Drop ---------------------------------------

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
    document.body.classList.add("edit-mode");
    Array.from(mainContainer.children).forEach((sec) => {
      sec.setAttribute("draggable", true);
      sec.classList.add("editing");
      addDragHandlers(sec);
    });
  }

  function exitDragMode() {
    draggingMode = false;
    document.body.classList.remove("edit-mode");
    Array.from(mainContainer.children).forEach((sec) => {
      sec.removeAttribute("draggable");
      sec.classList.remove("editing", "dragging");
      removeDragHandlers(sec);
    });
  }

  // --- Customize Mode -----------------------------------

  function enterCustomizeMode() {
    customizingMode = true;
    originalNodes = Array.from(mainContainer.children);
    customizeLink.textContent = "Save";

    const cancelLi = document.createElement("li");
    cancelLi.id = "cancelLi";
    cancelLi.innerHTML = `<a href="#">Cancel</a>`;
    cancelLi.addEventListener("click", (e) => {
      e.preventDefault();
      // restore original DOM nodes
      mainContainer.innerHTML = "";
      originalNodes.forEach((node) => mainContainer.appendChild(node));
      syncMenuToSections();
      exitCustomizeMode();
    });
    customizeLink.parentElement.after(cancelLi);

    bottomToolbar.classList.remove("hidden");
  }

  function exitCustomizeMode() {
    customizingMode = false;
    customizeLink.textContent = "Customize";
    document.getElementById("cancelLi")?.remove();
    bottomToolbar.classList.add("hidden");
    exitDragMode();
    // ensure Customize remains last
    moveCustomizeToBottom();
  }

  customizeLink.addEventListener("click", (e) => {
    e.preventDefault();
    if (!customizingMode) {
      enterCustomizeMode();
    } else {
      // save new order
      const order = Array.from(mainContainer.children).map((sec) => sec.id);
      localStorage.setItem("sectionOrder", JSON.stringify(order));
      exitCustomizeMode();
    }
  });

  // --- Toolbar Icon Actions -----------------------------

  iconBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const action = btn.dataset.action;
      if (action === "reorder") {
        popupContent.innerHTML = "<p>Drag sections to reorder them.</p>";
        popupSave.textContent = "Got it";
        popupSave.onclick = () => {
          iconPopup.classList.add("hidden");
          if (customizingMode && !draggingMode) enterDragMode();
        };
      } else if (action === "theme") {
        popupContent.innerHTML = "<p>Theming options coming soon…</p>";
        popupSave.textContent = "OK";
        popupSave.onclick = () => iconPopup.classList.add("hidden");
      } else if (action === "reset") {
        popupContent.innerHTML = "<p>Reset layout to default?</p>";
        popupSave.textContent = "Reset";
        popupSave.onclick = () => {
          localStorage.removeItem("sectionOrder");
          location.reload();
        };
      }
      iconPopup.classList.remove("hidden");
    });
  });

  popupCancel.addEventListener("click", () => {
    iconPopup.classList.add("hidden");
  });

  // --- Scroll-to-Top ------------------------------------

  window.addEventListener("scroll", () => {
    scrollBtn.style.display = window.scrollY > 300 ? "flex" : "none";
  });
  scrollBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  // --- CVSS Severity Helper -----------------------------

  const getSeverityClass = (score) => {
    const n = parseFloat(score);
    if (n >= 7) return "severe";
    if (n >= 4) return "high";
    if (n > 0) return "medium";
    return "neutral";
  };

  // --- Fetch & Render -----------------------------------

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
          <div class="score-badge ${getSeverityClass(v.baseScore)}">CVSS: ${
            v.baseScore
          }</div>
          <h4>${v.title}</h4>
          <div class="meta-info">
            <span class="status-dot ${
              v.status === "Exploited" ? "exploited" : "safe"
            }"></span>${v.status}
            <span>📅 ${
              v.date === "N/A"
                ? "No Date"
                : new Date(v.date).toLocaleDateString()
            }</span>
          </div>
        </div>
      `
        )
        .join("");
    } catch (err) {
      console.error(err);
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
          <div class="meta-info">📅 ${u.date.toLocaleDateString()}</div>
        </div>
      `
        )
        .join("");
    } catch (err) {
      console.error(err);
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
    } catch (err) {
      console.error(err);
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
          <div class="meta-info">📅 ${new Date(
            a.publishedAt
          ).toLocaleDateString()}</div>
        </div>
      `
        )
        .join("");
    } catch (err) {
      console.error(err);
    }
  }

  // --- Initialization -----------------------------------

  // Restore saved sections order
  const saved = JSON.parse(localStorage.getItem("sectionOrder") || "[]");
  if (saved.length) {
    saved.forEach((id) => {
      const sec = document.getElementById(id);
      if (sec) mainContainer.appendChild(sec);
    });
  }

  // Sync menu and Ensure Customize at bottom
  syncMenuToSections();

  // Kick off fetches
  fetchMicrosoftUpdates();
  fetchCisaUpdates();
  fetchRedHatUpdates();
  fetchTrendingArticles();
});
