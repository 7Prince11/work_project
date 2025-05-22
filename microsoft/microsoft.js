document.addEventListener("DOMContentLoaded", () => {
  const headerInformationDiv = document.getElementById("header-information");
  const vulnerabilitiesListDiv = document.getElementById(
    "vulnerabilities-list"
  );
  const severityFilter = document.getElementById("severity-filter");
  const searchInput = document.getElementById("search-input");
  const timeFilterButtons = document.querySelectorAll(".time-filter-btn");
  const exportBtn = document.getElementById("export-btn");

  // View toggle elements
  const gridViewBtn = document.getElementById("grid-view-btn");
  const listViewBtn = document.getElementById("list-view-btn");

  // Stats counters
  const totalVulns = document.getElementById("total-vulns");
  const criticalCount = document.getElementById("critical-count");
  const highCount = document.getElementById("high-count");
  const mediumCount = document.getElementById("medium-count");
  const lowCount = document.getElementById("low-count");
  const exploitedCount = document.getElementById("exploited-count");

  let vulnerabilitiesList = [];
  let originalVulnerabilities = [];
  let filteredVulnerabilities = [];
  let selectedTimeRange = "all"; // Default time range

  // Calculate date ranges based on selected time range
  const getDateRange = (range) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today

    switch (range) {
      case "today":
        return today;
      case "3days":
        const threeDaysAgo = new Date(today);
        threeDaysAgo.setDate(today.getDate() - 3);
        return threeDaysAgo;
      case "week":
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 7);
        return weekAgo;
      case "month":
        const monthAgo = new Date(today);
        monthAgo.setMonth(today.getMonth() - 1);
        return monthAgo;
      case "3months":
        const threeMonthsAgo = new Date(today);
        threeMonthsAgo.setMonth(today.getMonth() - 3);
        return threeMonthsAgo;
      case "6months":
        const sixMonthsAgo = new Date(today);
        sixMonthsAgo.setMonth(today.getMonth() - 6);
        return sixMonthsAgo;
      default: // "all"
        return null; // No date filtering
    }
  };

  // Update statistics counters
  function updateStats(vulnList) {
    const stats = vulnList.reduce(
      (acc, vuln) => {
        acc.total++;

        // Count by severity category
        const category = vuln.severityCategory;
        if (category === "severe") acc.severe++;
        else if (category === "high") acc.high++;
        else if (category === "medium") acc.medium++;
        else acc.neutral++;

        // Count exploited vulnerabilities
        if (vuln.exploited) acc.exploited++;

        return acc;
      },
      { total: 0, severe: 0, high: 0, medium: 0, neutral: 0, exploited: 0 }
    );

    // Animate the counter changes
    animateNumber(totalVulns, stats.total);
    animateNumber(criticalCount, stats.severe);
    animateNumber(highCount, stats.high);
    animateNumber(mediumCount, stats.medium);
    animateNumber(lowCount, stats.neutral);
    animateNumber(exploitedCount, stats.exploited);
  }

  // Animate number changes
  function animateNumber(element, newValue) {
    const currentValue = parseInt(element.textContent) || 0;
    const diff = newValue - currentValue;
    const steps = 20; // Number of animation steps
    const stepValue = diff / steps;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      const value = Math.round(currentValue + stepValue * currentStep);
      element.textContent = value;

      if (currentStep >= steps) {
        clearInterval(interval);
        element.textContent = newValue;
      }
    }, 20); // ~400ms total animation time
  }

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

      // header info
      const title = data["cvrf:DocumentTitle"] || "Microsoft Security Bulletin";
      const date =
        data["cvrf:DocumentTracking"]?.["cvrf:InitialReleaseDate"] || "N/A";

      headerInformationDiv.innerHTML = `
        <h3>${title}</h3>
        <p><strong>Initial Release:</strong> ${
          date !== "N/A" ? new Date(date).toLocaleDateString() : "Not available"
        }</p>
      `;

      // map out vulnerabilities
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

          // Determine severity category based on CVSS score
          let severityCategory = "neutral"; // default
          if (baseScore !== "N/A") {
            const score = parseFloat(baseScore);
            severityCategory =
              score >= 9.0
                ? "severe" // Critical: 9.0-10.0
                : score >= 7.0
                ? "high" // High: 7.0-8.9
                : score >= 4.0
                ? "medium" // Medium: 4.0-6.9
                : "neutral"; // Low: 0.1-3.9
          }

          return {
            title: v["vuln:Title"],
            baseScore,
            temporalScore,
            exploited,
            date: revisionDate,
            severityCategory,
            publishedDate:
              revisionDate !== "N/A" ? new Date(revisionDate) : null,
          };
        });

      originalVulnerabilities = [...vulnerabilitiesList];
      filteredVulnerabilities = [...vulnerabilitiesList];
      renderVulnerabilities(vulnerabilitiesList);
      updateStats(vulnerabilitiesList);
    })
    .catch((err) => {
      vulnerabilitiesListDiv.innerHTML = `
        <div class="vulnerability-card severe">
          <h4>Data Load Error</h4>
          <p>${err.message}</p>
        </div>
      `;
    });

  // —— Render vulnerabilities with improved design ——
  function renderVulnerabilities(list) {
    filteredVulnerabilities = list;
    vulnerabilitiesListDiv.innerHTML = "";

    list.forEach((v, i) => {
      const card = document.createElement("div");

      // Apply both severity class and exploited class if applicable
      let cardClasses = "vulnerability-card " + v.severityCategory;
      if (v.exploited) {
        cardClasses += " exploited";
      }
      card.className = cardClasses;

      // Truncate title if too long
      let title = v.title;
      if (title.length > 100) {
        title = title.substring(0, 100) + "...";
      }

      // Set severity text based on category
      let severityText = "Unknown";
      switch (v.severityCategory) {
        case "severe":
          severityText = "Critical";
          break;
        case "high":
          severityText = "High";
          break;
        case "medium":
          severityText = "Medium";
          break;
        case "neutral":
          severityText = "Low";
          break;
      }

      // Status badge
      let badgeClass = "safe";
      let badgeText = "🛡️ Not Exploited";
      if (v.exploited) {
        badgeClass = "exploited";
        badgeText = "⚠️ Actively Exploited";
      }

      // Format date
      const displayDate =
        v.date === "N/A"
          ? "No Date Available"
          : new Date(v.date).toLocaleDateString();

      card.innerHTML = `
        <h4>${title}</h4>
        
        <div class="info-grid">
          <div class="info-box">
            <svg class="info-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7v10l10 5 10-5V7L12 2z"/>
              <path d="M12 15.57l-7-3.5V9l7 3.5 7-3.5v3.07l-7 3.5z"/>
            </svg>
            <span class="info-label">Base Score</span>
            <span class="info-value">${v.baseScore}</span>
          </div>
          
          <div class="info-box">
            <svg class="info-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7v10l10 5 10-5V7L12 2z"/>
              <circle cx="12" cy="12" r="3.5"/>
            </svg>
            <span class="info-label">Severity</span>
            <span class="info-value">${severityText}</span>
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
      `;

      vulnerabilitiesListDiv.appendChild(card);

      // animate in
      setTimeout(() => {
        card.style.opacity = "1";
        card.style.transform = "translateY(0)";
      }, i * 100);
    });
  }

  // Apply filters and sorting
  function applyFilters() {
    let result = [...originalVulnerabilities];

    // Apply time filter
    const dateThreshold = getDateRange(selectedTimeRange);
    if (dateThreshold) {
      result = result.filter((vuln) => {
        return vuln.publishedDate && vuln.publishedDate >= dateThreshold;
      });
    }

    // Apply severity/exploited filter
    const selectedFilter = severityFilter.value;
    if (selectedFilter !== "all") {
      if (selectedFilter === "exploited") {
        // Filter to show only exploited vulnerabilities
        result = result.filter((vuln) => vuln.exploited === true);
      } else {
        // Filter by severity category
        result = result.filter(
          (vuln) => vuln.severityCategory === selectedFilter
        );
      }
    }

    // Apply search
    const searchTerm = searchInput.value.toLowerCase().trim();
    if (searchTerm) {
      result = result.filter((vuln) => {
        return vuln.title.toLowerCase().includes(searchTerm);
      });
    }

    // Sort by date (newest first)
    result.sort((a, b) => {
      const dateA = a.publishedDate ? a.publishedDate.getTime() : 0;
      const dateB = b.publishedDate ? b.publishedDate.getTime() : 0;
      return dateB - dateA;
    });

    renderVulnerabilities(result);
    updateStats(result);
  }

  // Handle time filter button clicks
  timeFilterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      // Update active button
      timeFilterButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      // Update selected time range
      selectedTimeRange = button.dataset.time;

      // Apply filters with new time range
      applyFilters();
    });
  });

  // Event Listeners
  severityFilter.addEventListener("change", applyFilters);
  searchInput.addEventListener("input", applyFilters);

  // —— Export CSV ——
  exportBtn?.addEventListener("click", () => {
    if (filteredVulnerabilities.length === 0) {
      return alert("Nothing to export!");
    }

    const header = [
      "Title",
      "BaseScore",
      "TemporalScore",
      "Severity",
      "Exploited",
      "Date",
    ];
    const rows = filteredVulnerabilities.map((v) =>
      [
        `"${v.title.replace(/"/g, '""')}"`,
        v.baseScore,
        v.temporalScore,
        v.severityCategory,
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

  // Toggle between Grid and List
  gridViewBtn.addEventListener("click", () => {
    vulnerabilitiesListDiv.classList.remove("list-view");
    gridViewBtn.classList.add("active");
    listViewBtn.classList.remove("active");
    localStorage.setItem("microsoft-view-preference", "grid");
  });

  listViewBtn.addEventListener("click", () => {
    vulnerabilitiesListDiv.classList.add("list-view");
    listViewBtn.classList.add("active");
    gridViewBtn.classList.remove("active");
    localStorage.setItem("microsoft-view-preference", "list");
  });

  // Load saved view preference
  const savedView = localStorage.getItem("microsoft-view-preference");
  if (savedView === "list") {
    vulnerabilitiesListDiv.classList.add("list-view");
    listViewBtn.classList.add("active");
    gridViewBtn.classList.remove("active");
  } else {
    vulnerabilitiesListDiv.classList.remove("list-view");
    gridViewBtn.classList.add("active");
    listViewBtn.classList.remove("active");
  }
});
