document.addEventListener("DOMContentLoaded", () => {
  const headerInformationDiv = document.getElementById("header-information");
  const vulnerabilitiesListDiv = document.getElementById(
    "vulnerabilities-list"
  );
  const filterDropdown = document.getElementById("filter-dropdown");
  const lastFetchDateSpan = document.getElementById("last-fetch-date");

  let vulnerabilitiesList = [];
  let originalVulnerabilities = [];

  // Fetch data from your Red Hat API endpoint
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

      // Format the vulnerabilities for display
      // Each item is shaped like: { id, title, severity, publicDate, affectedPackages, cvssScore, advisory }
      vulnerabilitiesList = data.map((vuln) => {
        // Convert the CVSS score to float
        let baseScore = "N/A";
        if (vuln.cvssScore && vuln.cvssScore !== "N/A") {
          baseScore = parseFloat(vuln.cvssScore).toFixed(1);
        }

        // Public date
        let vulnDate = "N/A";
        if (vuln.publicDate && vuln.publicDate !== "No date provided") {
          vulnDate = vuln.publicDate;
        }

        return {
          title: vuln.title,
          baseScore,
          date: vulnDate, // for sorting by date
          severity: vuln.severity,
          id: vuln.id,
          advisory: vuln.advisory,
          affectedPackages: vuln.affectedPackages,
        };
      });

      // Keep a copy of the original array for re-filtering
      originalVulnerabilities = [...vulnerabilitiesList];

      // Render the list initially
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

  // Renders the vulnerabilities into the DOM
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
            ? "severe" // red
            : score >= 4
            ? "high" // yellow
            : score > 0
            ? "medium" // green
            : "neutral";
      }

      // If baseScore is "N/A" but severity is "important" or "moderate," we can approximate
      if (vuln.baseScore === "N/A") {
        const sev = vuln.severity.toLowerCase();
        if (sev.includes("important") || sev.includes("critical")) {
          severityClass = "severe";
        } else if (sev.includes("moderate") || sev.includes("medium")) {
          severityClass = "high";
        } else if (sev.includes("low")) {
          severityClass = "medium";
        }
      }

      card.classList.add(severityClass);

      // Format date
      const displayDate =
        vuln.date === "N/A"
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
              <div class="stat-label">Base Score</div>
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
        <div class="status-badge safe">
          ${
            vuln.advisory && vuln.advisory !== "No advisory available"
              ? vuln.advisory
              : "No Advisory"
          }
        </div>
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

  // Filter / Sort functionality
  filterDropdown.addEventListener("change", (event) => {
    const filterValue = event.target.value;
    let updatedList = [...originalVulnerabilities];

    switch (filterValue) {
      case "title":
        updatedList.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "date":
        updatedList.sort((a, b) => {
          // Convert date to actual number for comparison
          const dateA = new Date(a.date).getTime() || 0;
          const dateB = new Date(b.date).getTime() || 0;
          return dateA - dateB;
        });
        break;
      case "severity":
        // Sort by numeric baseScore descending
        updatedList.sort((a, b) => {
          const scoreA = parseFloat(a.baseScore) || 0;
          const scoreB = parseFloat(b.baseScore) || 0;
          return scoreB - scoreA;
        });
        break;
      default:
        // "none" - do not sort, revert to original
        updatedList = [...originalVulnerabilities];
        break;
    }

    renderVulnerabilities(updatedList);
  });
});
