document.addEventListener("DOMContentLoaded", () => {
  const vulnerabilitiesListDiv = document.getElementById(
    "vulnerabilities-list"
  );
  const lastFetchDateSpan = document.getElementById("last-fetch-date");
  const searchInput = document.getElementById("search-input");
  const severityFilter = document.getElementById("severity-filter");
  const timeFilterButtons = document.querySelectorAll(".time-filter-btn");

  // View toggle elements
  const gridViewBtn = document.getElementById("grid-view-btn");
  const listViewBtn = document.getElementById("list-view-btn");

  // Stats counters
  const totalVulns = document.getElementById("total-vulns");
  const criticalCount = document.getElementById("critical-count");
  const highCount = document.getElementById("high-count");
  const mediumCount = document.getElementById("medium-count");
  const lowCount = document.getElementById("low-count");

  let vulnerabilitiesList = [];
  let originalVulnerabilities = [];
  let filteredVulnerabilities = [];
  let selectedTimeRange = "all"; // Default time range

  document
    .getElementById("redhat-export-btn")
    ?.addEventListener("click", exportToCSV);

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

        const isExploited = vuln.advisory !== "No advisory available";

        // Determine severity category
        let severityCategory = "neutral"; // default
        if (baseScore !== "N/A") {
          const score = parseFloat(baseScore);
          severityCategory =
            score >= 9.0
              ? "severe"
              : score >= 7.0
              ? "high"
              : score >= 4.0
              ? "medium"
              : "neutral";
        }

        return {
          title: vuln.title,
          baseScore,
          date: vuln.publicDate,
          severity: vuln.severity,
          severityCategory: severityCategory,
          id: vuln.id,
          advisory: vuln.advisory,
          affectedPackages: vuln.affectedPackages,
          isExploited,
          publishedDate: new Date(vuln.publicDate), // Add proper date object for filtering
        };
      });

      originalVulnerabilities = [...vulnerabilitiesList];
      filteredVulnerabilities = [...vulnerabilitiesList];
      renderVulnerabilities(vulnerabilitiesList);
      updateStats(vulnerabilitiesList);
    })
    .catch((error) => {
      vulnerabilitiesListDiv.innerHTML = `
        <div class="vulnerability-card severe">
          <h4>Data Load Error</h4>
          <p>${error.message}</p>
        </div>
      `;
    });

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
        const category = vuln.severityCategory;
        if (category === "severe") acc.severe++;
        else if (category === "high") acc.high++;
        else if (category === "medium") acc.medium++;
        else acc.neutral++;
        return acc;
      },
      { total: 0, severe: 0, high: 0, medium: 0, neutral: 0 }
    );

    // Animate the counter changes
    animateNumber(totalVulns, stats.total);
    animateNumber(criticalCount, stats.severe);
    animateNumber(highCount, stats.high);
    animateNumber(mediumCount, stats.medium);
    animateNumber(lowCount, stats.neutral);
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

  // Render Vulnerabilities
  function renderVulnerabilities(vulnerabilities) {
    vulnerabilitiesListDiv.innerHTML = "";
    filteredVulnerabilities = vulnerabilities;

    vulnerabilities.forEach((vuln, index) => {
      const card = document.createElement("div");
      card.className = "vulnerability-card";

      // Determine severity style
      let severityClass = vuln.severityCategory || "neutral";

      // If isExploited, override to "exploited"
      if (vuln.isExploited) {
        severityClass = "exploited";
      }
      card.classList.add(severityClass);

      // Status badge
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

  // Apply filters and sorting
  function applyFilters() {
    let result = [...originalVulnerabilities];

    // Apply time filter
    const dateThreshold = getDateRange(selectedTimeRange);
    if (dateThreshold) {
      result = result.filter((vuln) => {
        // Handle invalid dates
        const vulnDate = vuln.publishedDate;
        return vulnDate && vulnDate >= dateThreshold;
      });
    }

    // Apply severity filter
    const selectedSeverity = severityFilter.value;
    if (selectedSeverity !== "all") {
      result = result.filter(
        (vuln) => vuln.severityCategory === selectedSeverity
      );
    }

    // Apply search
    const searchTerm = searchInput.value.toLowerCase().trim();
    if (searchTerm) {
      result = result.filter((vuln) => {
        return (
          vuln.title.toLowerCase().includes(searchTerm) ||
          vuln.id.toLowerCase().includes(searchTerm) ||
          vuln.severity.toLowerCase().includes(searchTerm) ||
          vuln.advisory.toLowerCase().includes(searchTerm) ||
          vuln.affectedPackages.toLowerCase().includes(searchTerm)
        );
      });
    }

    // By default, sort by date (newest first)
    result.sort((a, b) => {
      const dateA = a.publishedDate ? a.publishedDate.getTime() : 0;
      const dateB = b.publishedDate ? b.publishedDate.getTime() : 0;
      return dateB - dateA;
    });

    renderVulnerabilities(result);
    updateStats(result);
  }

  function exportToCSV() {
    // Get the current filtered/displayed vulnerabilities
    const data = filteredVulnerabilities || [];

    if (data.length === 0) {
      return alert("No data available to export!");
    }

    // Define CSV headers
    const header = [
      "ID",
      "Title",
      "Severity",
      "CVSS Score",
      "Date",
      "Exploited",
      "Affected Packages",
    ];

    // Create CSV rows
    const rows = data.map((v) =>
      [
        v.id || "",
        v.title || "",
        v.severity || "",
        v.baseScore || "",
        v.date || "",
        v.isExploited ? "Yes" : "No",
        v.affectedPackages || "",
      ]
        .map((val) => `"${String(val).replace(/"/g, '""')}"`)
        .join(",")
    );

    // Combine headers and rows
    const csv = [header.join(","), ...rows].join("\r\n");

    // Create download link
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "redhat_vulnerabilities.csv";
    a.click();
    URL.revokeObjectURL(url);
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

  // Toggle between Grid and List
  gridViewBtn.addEventListener("click", () => {
    vulnerabilitiesListDiv.classList.remove("list-view");
    gridViewBtn.classList.add("active");
    listViewBtn.classList.remove("active");
    localStorage.setItem("redhat-view-preference", "grid");
  });

  listViewBtn.addEventListener("click", () => {
    vulnerabilitiesListDiv.classList.add("list-view");
    listViewBtn.classList.add("active");
    gridViewBtn.classList.remove("active");
    localStorage.setItem("redhat-view-preference", "list");
  });

  // Load saved view preference
  const savedView = localStorage.getItem("redhat-view-preference");
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
