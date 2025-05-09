document.addEventListener("DOMContentLoaded", () => {
  const headerInformationDiv = document.getElementById("header-information");
  const vulnerabilitiesListDiv = document.getElementById(
    "vulnerabilities-list"
  );
  const filterDropdown = document.getElementById("filter-dropdown");
  const exportBtn = document.getElementById("export-btn");

  let vulnerabilitiesList = [];
  let originalVulnerabilities = [];
  let displayedList = []; // ← holds whatever you just rendered

  // —— Fetch & display data ——
  fetch("http://localhost:3000/api/updates")
    .then((res) => res.json())
    .then((data) => {
      if (!data || data.message) {
        vulnerabilitiesListDiv.innerHTML = `<p class="error">${
          data.message || "No data available."
        }</p>`;
        return;
      }

      // header info (unchanged)…
      const title = data["cvrf:DocumentTitle"] || "Microsoft Security Bulletin";
      const date =
        data["cvrf:DocumentTracking"]?.["cvrf:InitialReleaseDate"] || "N/A";
      headerInformationDiv.innerHTML = `
        <h3>${title}</h3>
        <p><strong>Initial Release:</strong> ${
          date !== "N/A" ? new Date(date).toLocaleDateString() : "Not available"
        }</p>
      `;

      // map out your array
      const vulns = data["vuln:Vulnerability"] || [];
      vulnerabilitiesList = vulns
        .filter((v) => v["vuln:Title"])
        .map((v) => {
          let baseScore = "N/A";
          let temporalScore = "N/A";
          let exploited = false;
          let revisionDate = "N/A";

          const scoreSet = v["vuln:CVSSScoreSets"]?.["vuln:ScoreSet"];
          if (scoreSet) {
            const s = Array.isArray(scoreSet) ? scoreSet[0] : scoreSet;
            baseScore = s["vuln:BaseScore"] || baseScore;
            temporalScore = s["vuln:TemporalScore"] || temporalScore;
          }

          const rev = v["vuln:RevisionHistory"]?.["vuln:Revision"];
          if (rev) {
            revisionDate = Array.isArray(rev)
              ? rev[0]?.["cvrf:Date"]
              : rev["cvrf:Date"] || revisionDate;
          }

          const threats = v["vuln:Threats"]?.["vuln:Threat"] || [];
          exploited = threats.some((t) =>
            t["vuln:Description"]?.includes("Exploited:Yes")
          );

          return {
            title: v["vuln:Title"],
            baseScore,
            temporalScore,
            exploited,
            date: revisionDate,
          };
        });

      originalVulnerabilities = [...vulnerabilitiesList];
      renderVulnerabilities(vulnerabilitiesList);
    })
    .catch((err) => {
      vulnerabilitiesListDiv.innerHTML = `
        <div class="vulnerability-card severe">
          <h4>Data Load Error</h4>
          <p>${err.message}</p>
        </div>
      `;
    });

  // —— Render & track displayedList ——
  function renderVulnerabilities(list) {
    displayedList = list; // ← super important!
    vulnerabilitiesListDiv.innerHTML = "";

    list.forEach((v, i) => {
      const card = document.createElement("div");
      card.className = "vulnerability-card " + getSeverityClass(v.baseScore);
      card.innerHTML = `
        <h4>${v.title}</h4>
        <div class="stats-grid">
          <div class="stat-item">
            <svg class="stat-icon" viewBox="0 0 24 24" fill="var(--text)">
              <path d="M12 2L2 7v10l10 5 10-5V7L12 2z"/>
              <path d="M12 15.57l-7-3.5V9l7 3.5 7-3.5v3.07l-7 3.5z"/>
            </svg>
            <div>
              <div class="stat-label">Base Score</div>
              <div class="stat-value">${v.baseScore}</div>
            </div>
          </div>
          <div class="stat-item">
            <svg class="stat-icon" viewBox="0 0 24 24" fill="var(--text)">
              <path d="M12 2L2 7v10l10 5 10-5V7L12 2z"/>
              <circle cx="12" cy="12" r="3.5"/>
            </svg>
            <div>
              <div class="stat-label">Temporal Score</div>
              <div class="stat-value">${v.temporalScore}</div>
            </div>
          </div>
        </div>
        <div class="status-badge ${v.exploited ? "exploited" : "safe"}">
          ${v.exploited ? "⚠️ Actively Exploited" : "🛡️ Not Exploited"}
        </div>
        <div class="date-info">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 9h18V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V10H3"/>
            <path d="M16 2v4M8 2v4M3 14h18"/>
          </svg>
          ${
            v.date === "N/A"
              ? "No Date Available"
              : new Date(v.date).toLocaleDateString()
          }
        </div>
      `;
      vulnerabilitiesListDiv.appendChild(card);

      // animate in
      setTimeout(() => {
        card.style.opacity = "1";
        card.style.transform = "translateY(0)";
      }, i * 100);
    });
  }

  // —— Filters (unchanged) ——
  filterDropdown.addEventListener("change", (e) => {
    let sorted = [...originalVulnerabilities];
    switch (e.target.value) {
      case "name":
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "date":
        sorted.sort((a, b) => new Date(a.date) - new Date(b.date));
        break;
      case "exploitability":
        sorted = sorted.filter((v) => v.exploited);
        break;
    }
    renderVulnerabilities(sorted);
  });

  // —— Export CSV ——
  exportBtn?.addEventListener("click", () => {
    if (displayedList.length === 0) {
      return alert("Nothing to export!");
    }
    const header = ["Title", "BaseScore", "TemporalScore", "Exploited", "Date"];
    const rows = displayedList.map((v) =>
      [
        `"${v.title.replace(/"/g, '""')}"`,
        v.baseScore,
        v.temporalScore,
        v.exploited ? "Yes" : "No",
        `"${v.date}"`,
      ].join(",")
    );
    const csv = [header.join(","), ...rows].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ms_updates.csv";
    a.click();
    URL.revokeObjectURL(url);
  });

  // —— Severity helper (unchanged) ——
  function getSeverityClass(score) {
    const n = parseFloat(score);
    if (n >= 7) return "severe";
    if (n >= 4) return "high";
    if (n > 0) return "medium";
    return "neutral";
  }
});
