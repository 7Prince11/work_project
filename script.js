document.addEventListener("DOMContentLoaded", () => {
  const mainContainer = document.getElementById("mainSections");
  const customizeLink = document.getElementById("customize-link");
  const scrollBtn = document.getElementById("scrollTopBtn");
  const bottomToolbar = document.querySelector(".bottom-toolbar");
  const iconBtns = document.querySelectorAll(".icon-btn");
  const iconPopup = document.getElementById("iconPopup");
  const popupContent = document.getElementById("popupContent");
  const popupSave = document.getElementById("popupSave");
  const popupCancel = document.getElementById("popupCancel");

  let isEditing = false;
  let originalOrder = [];
  let dragSrcEl = null;

  // Restore saved order
  const saved = JSON.parse(localStorage.getItem("sectionOrder") || "[]");
  if (saved.length) {
    saved.forEach((id) => {
      const sec = document.getElementById(id);
      if (sec) mainContainer.appendChild(sec);
    });
  }

  // Helper: insert loader into a container
  function setLoading(containerId) {
    const c = document.getElementById(containerId);
    c.innerHTML = `<div class="loader"><span></span><span></span><span></span></div>`;
  }

  // Shake & draggable toggles
  function enterEditMode() {
    document.body.classList.add("edit-mode");
    Array.from(mainContainer.children).forEach((sec) => {
      sec.setAttribute("draggable", true);
      addDragHandlers(sec);
    });
  }
  function exitEditMode() {
    document.body.classList.remove("edit-mode");
    Array.from(mainContainer.children).forEach((sec) => {
      sec.removeAttribute("draggable");
      removeDragHandlers(sec);
    });
  }

  // Drag handlers
  function handleDragStart(e) {
    dragSrcEl = e.currentTarget;
    e.currentTarget.classList.add("dragging");
    e.dataTransfer.effectAllowed = "move";
  }
  function handleDragOver(e) {
    e.preventDefault();
    const target = e.currentTarget;
    if (target === dragSrcEl) return;
    const rect = target.getBoundingClientRect();
    const next = (e.clientY - rect.top) / rect.height > 0.5;
    mainContainer.insertBefore(dragSrcEl, next ? target.nextSibling : target);
  }
  function handleDragEnd(e) {
    e.currentTarget.classList.remove("dragging");
  }
  function addDragHandlers(elem) {
    elem.addEventListener("dragstart", handleDragStart);
    elem.addEventListener("dragover", handleDragOver);
    elem.addEventListener("dragend", handleDragEnd);
  }
  function removeDragHandlers(elem) {
    elem.removeEventListener("dragstart", handleDragStart);
    elem.removeEventListener("dragover", handleDragOver);
    elem.removeEventListener("dragend", handleDragEnd);
  }

  // Enter/exit edit mode via Customize link
  customizeLink.addEventListener("click", () => {
    if (!isEditing) {
      originalOrder = Array.from(mainContainer.children).map((s) => s.id);
      customizeLink.textContent = "Save";
      // add Cancel
      const cancelLi = document.createElement("li");
      cancelLi.id = "cancelLi";
      cancelLi.innerHTML = `<a href="#">Cancel</a>`;
      cancelLi.onclick = () => {
        // revert order
        mainContainer.innerHTML = "";
        originalOrder.forEach((id) =>
          mainContainer.appendChild(document.getElementById(id))
        );
        exitEdit();
      };
      customizeLink.parentElement.after(cancelLi);

      bottomToolbar.classList.remove("hidden");
      enterEditMode();
      isEditing = true;
    } else {
      const order = Array.from(mainContainer.children).map((s) => s.id);
      localStorage.setItem("sectionOrder", JSON.stringify(order));
      exitEdit();
    }
  });

  function exitEdit() {
    isEditing = false;
    customizeLink.textContent = "Customize";
    const cancelLi = document.getElementById("cancelLi");
    if (cancelLi) cancelLi.remove();
    bottomToolbar.classList.add("hidden");
    exitEditMode();
  }

  // Scroll-to-top
  window.addEventListener("scroll", () => {
    scrollBtn.style.display = window.scrollY > 300 ? "flex" : "none";
  });
  scrollBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  // Toolbar icons
  iconBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const action = btn.dataset.action;
      switch (action) {
        case "reorder":
          popupContent.innerHTML = "<p>Drag any section to reorder.</p>";
          popupSave.textContent = "Got it";
          break;
        case "theme":
          popupContent.innerHTML = "<p>Theming options coming soon…</p>";
          popupSave.textContent = "OK";
          break;
        case "reset":
          popupContent.innerHTML = "<p>Reset layout to default?</p>";
          popupSave.textContent = "Reset";
          break;
      }
      iconPopup.classList.remove("hidden");
    });
  });
  popupSave.addEventListener("click", () => iconPopup.classList.add("hidden"));
  popupCancel.addEventListener("click", () =>
    iconPopup.classList.add("hidden")
  );

  /* ----------------------------------
     Fetch logic with preload loaders
  ---------------------------------- */

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
      const res = await fetch("http://localhost:3000/api/updates");
      const data = await res.json();
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
    } catch (e) {
      // leave loader until user starts interacting
      console.error(e);
    }
  }

  async function fetchCisaUpdates() {
    setLoading("cisa-content");
    try {
      const res = await fetch("http://localhost:3000/api/cisa");
      const data = await res.json();
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
    } catch (e) {
      console.error(e);
    }
  }

  async function fetchRedHatUpdates() {
    setLoading("redhat-content");
    try {
      const res = await fetch("http://localhost:3000/api/redhat");
      const data = await res.json();
      const list = data.filter((v) => v.title).slice(0, 3);
      document.getElementById("redhat-content").innerHTML = list
        .map(
          (v) => `
          <div class="news-card">
            <h4>${v.title}</h4>
            <div class="meta-info">
              ${
                v.publicDate !== "No date provided"
                  ? new Date(v.publicDate).toLocaleDateString()
                  : "No Date"
              }
            </div>
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
      const res = await fetch(
        `https://newsapi.org/v2/everything?q=cybersecurity&apiKey=${apiKey}`
      );
      const data = await res.json();
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
    } catch (e) {
      console.error(e);
    }
  }

  // Kick off all fetches
  fetchMicrosoftUpdates();
  fetchCisaUpdates();
  fetchRedHatUpdates();
  fetchTrendingArticles();
});
