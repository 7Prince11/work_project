document.addEventListener("DOMContentLoaded", () => {
  const vulnerabilitiesListDiv = document.getElementById(
    "vulnerabilities-list"
  );
  const filterDropdown = document.getElementById("filter-dropdown");
  const lastFetchDateSpan = document.getElementById("last-fetch-date");

  // NEW: search input reference
  const searchInput = document.getElementById("search-input");

  let vulnerabilitiesList = [];
  let originalVulnerabilities = [];

  // Fetch data from Red Hat API endpoint
  fetch("http://localhost:3000/api/redhat")
    .then((response) => response.json())
    .then((data) => {
      if (!data || data.message) {
        vulnerabilitiesListDiv.innerHTML = `
          <p class="error">${data.message || "No data available."}</p>`;
        return;
      }

      // Set "Last Fetch" date/time
      lastFetchDateSpan.textContent = new Date().toLocaleString();

      // Format vulnerabilities
      vulnerabilitiesList = data.map((vuln) => {
        let baseScore = "N/A";
        if (vuln.cvssScore && vuln.cvssScore !== "N/A") {
          baseScore = parseFloat(vuln.cvssScore).toFixed(1);
        }

        // Decide "isExploited" logic
        // e.g., if there's a non-default advisory, treat it as exploited
        const isExploited = vuln.advisory !== "No advisory available";

        return {
          title: vuln.title,
          baseScore,
          date: vuln.publicDate,
          severity: vuln.severity,
          id: vuln.id,
          advisory: vuln.advisory,
          affectedPackages: vuln.affectedPackages,
          isExploited,
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

  // -------------------------------
  // RENDER VULNERABILITIES FUNCTION
  // -------------------------------
  function renderVulnerabilities(vulnerabilities) {
    vulnerabilitiesListDiv.innerHTML = "";

    vulnerabilities.forEach((vuln, index) => {
      const card = document.createElement("div");
      card.className = "vulnerability-card";

      // Determine severity style
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

      // If isExploited, override to "exploited" style if you prefer
      if (vuln.isExploited) {
        severityClass = "exploited";
      }
      card.classList.add(severityClass);

      // Status badge logic
      let badgeClass = "safe";
      let badgeText = "🛡️ Not Exploited";
      if (vuln.isExploited) {
        badgeClass = "exploited";
        badgeText = "⚠️ Actively Exploited";
      } else if (vuln.advisory !== "No advisory available") {
        badgeClass = "has-advisory";
        badgeText = `🔒 ${vuln.advisory}`;
      }

      // Format date
      const displayDate =
        vuln.date === "No date provided"
          ? "No Date Available"
          : new Date(vuln.date).toLocaleDateString();

      card.innerHTML = `
        <h4>${vuln.title}</h4>
        <div class="stats-grid">
          <div class="stat-item">
            <svg class="stat-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7v10l10 5 10-5V7L12 2zM12 19.5l-7-3.5V9.07l7 3.5 7-3.5V16l-7 3.5z"/>
            </svg>
            <div>
              <div class="stat-label">CVSS Score</div>
              <div class="stat-value">${vuln.baseScore}</div>
            </div>
          </div>
          <div class="stat-item">
            <svg class="stat-icon" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2"/>
            </svg>
            <div>
              <div class="stat-label">Severity</div>
              <div class="stat-value">${vuln.severity}</div>
            </div>
          </div>
        </div>
        <div class="status-badge ${badgeClass}">${badgeText}</div>
        <div class="date-info">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 9h18V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V10H3"/>
            <path d="M16 2v4M8 2v4M3 14h18"/>
          </svg>
          ${displayDate}
        </div>
        <p style="margin-top: 1rem; font-size: 0.9rem;">
          <strong>ID:</strong> ${vuln.id}<br/>
          <strong>Affected Packages:</strong> ${vuln.affectedPackages}
        </p>
      `;

      vulnerabilitiesListDiv.appendChild(card);

      // Animate card entry
      setTimeout(() => {
        card.style.opacity = "1";
        card.style.transform = "translateY(0)";
      }, index * 120);
    });
  }

  // -------------------------------------
  // FILTER & SEARCH (COMBINED) FUNCTION
  // -------------------------------------
  function applyFilters() {
    // 1) Start with original array
    let updatedList = [...originalVulnerabilities];

    // 2) Apply search filter
    const query = searchInput.value.toLowerCase().trim();
    if (query) {
      updatedList = updatedList.filter((vuln) => {
        // Check multiple fields for a match
        return (
          vuln.title.toLowerCase().includes(query) ||
          vuln.id.toLowerCase().includes(query) ||
          vuln.severity.toLowerCase().includes(query) ||
          vuln.advisory.toLowerCase().includes(query) ||
          vuln.affectedPackages.toLowerCase().includes(query)
        );
      });
    }

    // 3) Apply sorting or exploit filtering
    const filterValue = filterDropdown.value;
    switch (filterValue) {
      case "title":
        updatedList.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "date":
        updatedList.sort((a, b) => {
          const dateA = new Date(a.date).getTime() || 0;
          const dateB = new Date(b.date).getTime() || 0;
          return dateB - dateA; // descending by date
        });
        break;
      case "severity":
        updatedList.sort((a, b) => {
          const scoreA = parseFloat(a.baseScore) || 0;
          const scoreB = parseFloat(b.baseScore) || 0;
          return scoreB - scoreA; // descending by CVSS
        });
        break;
      case "exploited":
        updatedList = updatedList.filter((vuln) => vuln.isExploited);
        break;
      default:
        // "none" - do nothing special
        break;
    }

    // 4) Render results
    renderVulnerabilities(updatedList);
  }

  // -------------------------------------
  // EVENT LISTENERS
  // -------------------------------------
  filterDropdown.addEventListener("change", applyFilters);

  // NEW: "input" event for live searching
  searchInput.addEventListener("input", applyFilters);
});
