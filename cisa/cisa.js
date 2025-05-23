document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("vulnerability-container");
  const ransomwareFilter = document.getElementById("ransomware-filter");
  const searchInput = document.getElementById("search-input");
  const timeFilterButtons = document.querySelectorAll(".time-filter-btn");
  const lastFetchDateSpan = document.getElementById("last-fetch-date");

  // View toggle elements
  const gridViewBtn = document.getElementById("grid-view-btn");
  const listViewBtn = document.getElementById("list-view-btn");

  // Stats counters
  const totalVulns = document.getElementById("total-vulns");
  const ransomwareCount = document.getElementById("ransomware-count");
  const safeCount = document.getElementById("safe-count");
  const unknownCount = document.getElementById("unknown-count");
  const recentCount = document.getElementById("recent-count");

  let vulnerabilities = [];
  let originalVulnerabilities = [];
  let filteredVulnerabilities = [];
  let selectedTimeRange = "all";
  let currentView = "grid";

  document
    .getElementById("cisa-export-btn")
    ?.addEventListener("click", exportToCSV);

  // Helper function to determine if a date is within the last 30 days
  const isWithinTimeRange = (vulnDate, days) => {
    const now = new Date();
    return now - vulnDate <= days * 86400000;
  };

  // Calculate date ranges based on selected time range
  const getDateRange = (range) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

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
      default:
        return null;
    }
  };

  // Fetch vulnerabilities from CISA
  const fetchVulnerabilities = () => {
    container.innerHTML = '<div class="loading-animation"></div>';

    fetch("http://localhost:3000/api/cisa")
      .then((response) => response.json())
      .then((data) => {
        lastFetchDateSpan.textContent = new Date().toLocaleString();

        vulnerabilities = data.map((vuln) => ({
          ...vuln,
          dateAdded: new Date(vuln.dateAdded),
          ransomwareCategory: categorizeRansomware(
            vuln.knownRansomwareCampaignUse
          ),
        }));

        originalVulnerabilities = [...vulnerabilities];
        filteredVulnerabilities = [...vulnerabilities];
        applyFilters();
      })
      .catch((error) => {
        container.innerHTML = `<div class="vulnerability-card">Error loading data: ${error.message}</div>`;
      });
  };

  // Categorize ransomware status
  const categorizeRansomware = (status) => {
    if (typeof status === "string") {
      const lower = status.toLowerCase();
      if (lower === "yes" || lower === "true") return "ransomware";
      if (lower === "no" || lower === "false") return "safe";
    }
    return "unknown";
  };

  // Update statistics counters
  function updateStats(vulnList) {
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const stats = vulnList.reduce(
      (acc, vuln) => {
        acc.total++;

        if (vuln.ransomwareCategory === "ransomware") acc.ransomware++;
        else if (vuln.ransomwareCategory === "safe") acc.safe++;
        else acc.unknown++;

        if (vuln.dateAdded >= thirtyDaysAgo) acc.recent++;

        return acc;
      },
      { total: 0, ransomware: 0, safe: 0, unknown: 0, recent: 0 }
    );

    animateNumber(totalVulns, stats.total);
    animateNumber(ransomwareCount, stats.ransomware);
    animateNumber(safeCount, stats.safe);
    animateNumber(unknownCount, stats.unknown);
    animateNumber(recentCount, stats.recent);
  }

  // Animate number changes
  function animateNumber(element, newValue) {
    const currentValue = parseInt(element.textContent) || 0;
    const diff = newValue - currentValue;
    const steps = 20;
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
    }, 20);
  }

  // Apply filters and sorting
  const applyFilters = () => {
    let result = [...originalVulnerabilities];

    // Apply time filter
    const dateThreshold = getDateRange(selectedTimeRange);
    if (dateThreshold) {
      result = result.filter((vuln) => vuln.dateAdded >= dateThreshold);
    }

    // Apply ransomware filter
    const selectedRansomware = ransomwareFilter.value;
    if (selectedRansomware !== "all") {
      if (selectedRansomware === "yes") {
        result = result.filter(
          (vuln) => vuln.ransomwareCategory === "ransomware"
        );
      } else if (selectedRansomware === "no") {
        result = result.filter((vuln) => vuln.ransomwareCategory === "safe");
      } else if (selectedRansomware === "unknown") {
        result = result.filter((vuln) => vuln.ransomwareCategory === "unknown");
      }
    }

    // Apply search
    const searchTerm = searchInput.value.toLowerCase().trim();
    if (searchTerm) {
      result = result.filter((vuln) => {
        return (
          (vuln.vulnerabilityName || "").toLowerCase().includes(searchTerm) ||
          (vuln.cveID || "").toLowerCase().includes(searchTerm) ||
          (vuln.vendorProject || "").toLowerCase().includes(searchTerm) ||
          (vuln.product || "").toLowerCase().includes(searchTerm) ||
          (vuln.shortDescription || "").toLowerCase().includes(searchTerm)
        );
      });
    }

    result.sort((a, b) => b.dateAdded - a.dateAdded);

    renderVulnerabilities(result);
    updateStats(result);
  };

  // UNIFIED rendering for both views
  const renderVulnerabilities = (vulnList) => {
    container.innerHTML = "";
    filteredVulnerabilities = vulnList;

    if (vulnList.length === 0) {
      container.innerHTML =
        '<div class="vulnerability-card">No vulnerabilities found</div>';
      return;
    }

    vulnList.forEach((vuln, index) => {
      const card = document.createElement("div");
      card.className = `vulnerability-card ${vuln.ransomwareCategory}`;

      // Adjust title length based on current view
      let title = vuln.vulnerabilityName || vuln.cveID;
      if (currentView === "list" && title.length > 100) {
        title = title.substring(0, 100) + "...";
      } else if (currentView === "grid" && title.length > 80) {
        title = title.substring(0, 80) + "...";
      }

      // Status badge
      let badgeClass = vuln.ransomwareCategory;
      let badgeText = "Unknown Status";
      if (vuln.ransomwareCategory === "ransomware") {
        badgeText = "⚠️ Known Ransomware";
      } else if (vuln.ransomwareCategory === "safe") {
        badgeText = "🛡️ No Ransomware";
      }

      // Description
      let description = vuln.shortDescription || "No description available.";
      if (currentView === "list" && description.length > 200) {
        description = description.substring(0, 200) + "...";
      } else if (currentView === "grid" && description.length > 150) {
        description = description.substring(0, 150) + "...";
      }

      // UNIFIED HTML STRUCTURE
      card.innerHTML = `
        <div class="vuln-header">
          <h3>${title}</h3>
          <div class="status-badge ${badgeClass}">${badgeText}</div>
        </div>
        
        <div class="info-section">
          <div class="info-box">
            <svg class="meta-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7v10l10 5 10-5V7L12 2zM12 19.5l-7-3.5V9.07l7 3.5 7-3.5V16l-7 3.5z"/>
            </svg>
            <div class="info-content">
              <div class="info-label">Vendor</div>
              <div class="info-value">${vuln.vendorProject || "Unknown"}</div>
            </div>
          </div>
          
          <div class="info-box">
            <svg class="meta-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
            <div class="info-content">
              <div class="info-label">Product</div>
              <div class="info-value">${vuln.product || "Unknown"}</div>
            </div>
          </div>
        </div>
        
        <div class="meta-section">
          <div class="date-info">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M3 9h18V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V10H3"/>
              <path d="M16 2v4M8 2v4M3 14h18"/>
            </svg>
            Added: ${vuln.dateAdded.toLocaleDateString()}
          </div>
          
          ${
            description && currentView === "grid"
              ? `<p class="description">${description}</p>`
              : ""
          }
          ${
            description && currentView === "list"
              ? `<div class="description-text">${description}</div>`
              : ""
          }
        </div>
      `;

      container.appendChild(card);

      setTimeout(() => {
        card.style.opacity = "1";
        card.style.transform = "translateY(0)";
      }, index * 100);
    });
  };

  function exportToCSV() {
    const data = filteredVulnerabilities || [];

    if (data.length === 0) {
      return alert("No data available to export!");
    }

    const header = [
      "CVE ID",
      "Vulnerability Name",
      "Date Added",
      "Vendor/Project",
      "Product",
      "Known Ransomware Use",
      "Required Action",
    ];

    const rows = data.map((v) =>
      [
        v.cveID || "",
        v.vulnerabilityName || "",
        v.dateAdded ? v.dateAdded.toLocaleDateString() : "",
        v.vendorProject || "",
        v.product || "",
        v.knownRansomwareCampaignUse || "",
        v.requiredAction || "",
      ]
        .map((val) => `"${String(val).replace(/"/g, '""')}"`)
        .join(",")
    );

    const csv = [header.join(","), ...rows].join("\r\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cisa_vulnerabilities.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  // Handle view toggle
  function setView(view) {
    currentView = view;

    if (view === "grid") {
      container.classList.remove("list-view");
      gridViewBtn.classList.add("active");
      listViewBtn.classList.remove("active");
    } else {
      container.classList.add("list-view");
      listViewBtn.classList.add("active");
      gridViewBtn.classList.remove("active");
    }

    renderVulnerabilities(filteredVulnerabilities);
    localStorage.setItem("cisa-view-preference", view);
  }

  // Handle time filter button clicks
  timeFilterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      timeFilterButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      selectedTimeRange = button.dataset.time;
      applyFilters();
    });
  });

  // Event Listeners
  ransomwareFilter.addEventListener("change", applyFilters);
  searchInput.addEventListener("input", applyFilters);

  // Toggle between Grid and List
  gridViewBtn.addEventListener("click", () => setView("grid"));
  listViewBtn.addEventListener("click", () => setView("list"));

  // Load saved view preference
  const savedView = localStorage.getItem("cisa-view-preference");
  if (savedView) {
    setView(savedView);
  }

  // Initial Load
  fetchVulnerabilities();
});
