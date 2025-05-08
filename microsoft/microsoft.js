document.addEventListener("DOMContentLoaded", () => {
  const headerInformationDiv = document.getElementById("header-information");
  const vulnerabilitiesListDiv = document.getElementById(
    "vulnerabilities-list"
  );
  const filterDropdown = document.getElementById("filter-dropdown");

  let vulnerabilitiesList = [];
  let originalVulnerabilities = [];

  // Fetch and display data
  fetch("http://localhost:3000/api/updates")
    .then((response) => response.json())
    .then((data) => {
      if (!data || data.message) {
        vulnerabilitiesListDiv.innerHTML = `<p class="error">${
          data.message || "No data available."
        }</p>`;
        return;
      }

      // Header information
      const documentTitle =
        data["cvrf:DocumentTitle"] || "Microsoft Security Bulletin";
      const initialReleaseDate =
        data["cvrf:DocumentTracking"]?.["cvrf:InitialReleaseDate"] || "N/A";

      headerInformationDiv.innerHTML = `
        <h3>${documentTitle}</h3>
        <p><strong>Initial Release:</strong> ${
          initialReleaseDate !== "N/A"
            ? new Date(initialReleaseDate).toLocaleDateString()
            : "Not available"
        }</p>
      `;

      // Process vulnerabilities
      const vulnerabilities = data["vuln:Vulnerability"] || [];
      vulnerabilitiesList = vulnerabilities
        .filter((vuln) => vuln["vuln:Title"])
        .map((vuln) => {
          let baseScore = "N/A";
          let temporalScore = "N/A";
          let exploited = false;
          let revisionDate = "N/A";

          // Extract scores
          const scoreSet = vuln["vuln:CVSSScoreSets"]?.["vuln:ScoreSet"];
          if (scoreSet) {
            const scores = Array.isArray(scoreSet) ? scoreSet[0] : scoreSet;
            baseScore = scores["vuln:BaseScore"] || "N/A";
            temporalScore = scores["vuln:TemporalScore"] || "N/A";
          }

          // Extract revision date
          const revision = vuln["vuln:RevisionHistory"]?.["vuln:Revision"];
          if (revision) {
            revisionDate = Array.isArray(revision)
              ? revision[0]?.["cvrf:Date"]
              : revision["cvrf:Date"] || "N/A";
          }

          // Check exploit status
          const threats = vuln["vuln:Threats"]?.["vuln:Threat"] || [];
          exploited = threats.some((threat) =>
            threat["vuln:Description"]?.includes("Exploited:Yes")
          );

          return {
            title: vuln["vuln:Title"],
            baseScore,
            temporalScore,
            exploited,
            date: revisionDate,
          };
        });

      originalVulnerabilities = [...vulnerabilitiesList];
      renderVulnerabilities(vulnerabilitiesList);
    })
    .catch((error) => {
      vulnerabilitiesListDiv.innerHTML = `
        <div class="vulnerability-card severe">
          <h4>Data Load Error</h4>
          <p>${error.message}</p>
        </div>
      `;
    });

  // Render vulnerabilities with animations
  const renderVulnerabilities = (vulnerabilities) => {
    vulnerabilitiesListDiv.innerHTML = "";

    vulnerabilities.forEach((vuln, index) => {
      const card = document.createElement("div");
      card.className = "vulnerability-card";

      // Determine severity class
      let severityClass = "neutral";
      if (vuln.baseScore !== "N/A") {
        const score = parseFloat(vuln.baseScore);
        severityClass =
          score >= 7
            ? "severe"
            : score >= 4
            ? "high"
            : score > 0
            ? "medium"
            : "neutral";
      }
      card.classList.add(severityClass);

      card.innerHTML = `
        <h4>${vuln.title}</h4>
        <div class="stats-grid">
          <div class="stat-item">
            <svg class="stat-icon" viewBox="0 0 24 24" fill="var(--text);">
              <path d="M12 2L2 7v10l10 5 10-5V7L12 2zM12 19.5l-7-3.5V9.07l7 3.5 7-3.5V16l-7 3.5z"/>
              <path d="M12 15.57l-7-3.5V9l7 3.5 7-3.5v3.07l-7 3.5z"/>
            </svg>
            <div>
              <div class="stat-label">Base Score</div>
              <div class="stat-value">${vuln.baseScore}</div>
            </div>
          </div>
          <div class="stat-item">
            <svg class="stat-icon" viewBox="0 0 24 24" fill="var(--text)">
              <path d="M12 2L2 7v10l10 5 10-5V7L12 2z"/>
              <circle cx="12" cy="12" r="3.5"/>
            </svg>
            <div>
              <div class="stat-label">Temporal Score</div>
              <div class="stat-value">${vuln.temporalScore}</div>
            </div>
          </div>
        </div>
        <div class="status-badge ${vuln.exploited ? "exploited" : "safe"}">
          ${vuln.exploited ? "⚠️ Actively Exploited" : "🛡️ Not Exploited"}
        </div>
        <div class="date-info">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 9h18V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V10H3"/>
            <path d="M16 2v4M8 2v4M3 14h18"/>
          </svg>
          ${
            vuln.date === "N/A"
              ? "No Date Available"
              : new Date(vuln.date).toLocaleDateString()
          }
        </div>
      `;

      vulnerabilitiesListDiv.appendChild(card);

      // Animate card entry
      setTimeout(() => {
        card.style.opacity = "1";
        card.style.transform = "translateY(0)";
      }, index * 150);
    });
  };

  // Filter functionality
  filterDropdown.addEventListener("change", (event) => {
    const filterValue = event.target.value;
    let sorted = [...originalVulnerabilities];

    switch (filterValue) {
      case "name":
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "date":
        sorted.sort((a, b) => new Date(a.date) - new Date(b.date));
        break;
      case "exploitability":
        sorted = sorted.filter((vuln) => vuln.exploited);
        break;
    }

    renderVulnerabilities(sorted);
  });
});
