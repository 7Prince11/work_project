document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("vulnerability-container");
  const severityFilter = document.getElementById("severity-filter");
  const sortDropdown = document.getElementById("sort-dropdown");
  const searchInput = document.getElementById("search-input");
  const timeFilterButtons = document.querySelectorAll(".time-filter-btn");

  // Stats elements
  const totalCves = document.getElementById("total-cves");
  const criticalCount = document.getElementById("critical-count");
  const highCount = document.getElementById("high-count");
  const mediumCount = document.getElementById("medium-count");
  const lowCount = document.getElementById("low-count");

  document
    .getElementById("nvd-export-btn")
    ?.addEventListener("click", exportToCSV);

  let vulnerabilities = [];
  let filteredVulnerabilities = [];
  let selectedTimeRange = "all"; // Default time range

  // Calculate severity from CVSS score
  const getSeverity = (score) => {
    if (score === "N/A") return "low";
    const num = parseFloat(score);
    if (num >= 9.0) return "critical";
    if (num >= 7.0) return "high";
    if (num >= 4.0) return "medium";
    return "low";
  };

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

  // Fetch vulnerabilities from NVD
  const fetchVulnerabilities = async () => {
    container.innerHTML = '<div class="loading-animation"></div>';

    try {
      const response = await fetch("http://localhost:3000/api/nvd");
      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Check if data is in the new structured format or the old array format
      if (data.vulnerabilities) {
        // New format - use the pre-calculated stats
        vulnerabilities = data.vulnerabilities.map((vuln) => ({
          ...vuln,
          publishedDate: new Date(vuln.publishedDate),
          severity: vuln.severity?.toLowerCase() || getSeverity(vuln.cvssScore),
          tags: vuln.tags || [],
        }));

        // Will be updated dynamically in applyFiltersAndSort
      } else {
        // Old array format - process as before
        vulnerabilities = data.map((vuln) => ({
          id: vuln.id,
          description: vuln.description,
          cvssScore: vuln.cvssScore,
          severity: getSeverity(vuln.cvssScore),
          publishedDate: new Date(vuln.publishedDate),
          tags: vuln.tags || [],
          references: vuln.references || [],
        }));
      }

      applyFiltersAndSort();
    } catch (error) {
      container.innerHTML = `<div class="vulnerability-card">Error loading data: ${error.message}</div>`;
    }
  };

  // Update statistics
  const updateStats = (filteredData) => {
    const stats = filteredData.reduce(
      (acc, vuln) => {
        acc.total++;
        acc[vuln.severity]++;
        return acc;
      },
      { total: 0, critical: 0, high: 0, medium: 0, low: 0 }
    );

    // Animate the number changes
    animateNumber(totalCves, stats.total);
    animateNumber(criticalCount, stats.critical);
    animateNumber(highCount, stats.high);
    animateNumber(mediumCount, stats.medium);
    animateNumber(document.getElementById("low-count"), stats.low);
  };

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

  // Apply filters and sorting
  const applyFiltersAndSort = () => {
    let result = [...vulnerabilities];

    // Apply time filter
    const dateThreshold = getDateRange(selectedTimeRange);
    if (dateThreshold) {
      result = result.filter((vuln) => vuln.publishedDate >= dateThreshold);
    }

    // Apply severity filter
    const selectedSeverity = severityFilter.value;
    if (selectedSeverity !== "all") {
      result = result.filter((vuln) => vuln.severity === selectedSeverity);
    }

    // Apply search
    const searchTerm = searchInput.value.toLowerCase().trim();
    if (searchTerm) {
      result = result.filter(
        (vuln) =>
          vuln.id.toLowerCase().includes(searchTerm) ||
          vuln.description.toLowerCase().includes(searchTerm) ||
          (vuln.tags &&
            vuln.tags.some((tag) => tag.toLowerCase().includes(searchTerm)))
      );
    }

    // Apply sorting
    const sortBy = sortDropdown.value;
    switch (sortBy) {
      case "date":
        result.sort((a, b) => b.publishedDate - a.publishedDate);
        break;
      case "score":
        result.sort((a, b) => {
          const scoreA = parseFloat(a.cvssScore) || 0;
          const scoreB = parseFloat(b.cvssScore) || 0;
          return scoreB - scoreA;
        });
        break;
      case "cve":
        result.sort((a, b) => a.id.localeCompare(b.id));
        break;
    }

    // Update the stats based on filtered results
    updateStats(result);

    filteredVulnerabilities = result;
    renderVulnerabilities();
  };

  // Render vulnerability cards
  const renderVulnerabilities = () => {
    container.innerHTML = "";

    if (filteredVulnerabilities.length === 0) {
      container.innerHTML =
        '<div class="vulnerability-card">No vulnerabilities found</div>';
      return;
    }

    filteredVulnerabilities.forEach((vuln, index) => {
      const card = document.createElement("div");
      card.className = `vulnerability-card ${vuln.severity}`;

      // Truncate description if too long
      const description =
        vuln.description.length > 200
          ? vuln.description.substring(0, 200) + "..."
          : vuln.description;

      card.innerHTML = `
        <div class="cve-header">
          <span class="cve-id">${vuln.id}</span>
          <span class="cvss-badge ${vuln.severity}">
            CVSS: ${vuln.cvssScore}
          </span>
        </div>
        
        <p class="description">${description}</p>
        
        <div class="meta-tags">
          ${(vuln.tags || [])
            .map((tag) => `<span class="tag">${tag}</span>`)
            .join("")}
        </div>
        
        <div class="date-info">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M3 9h18V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V10H3"/>
            <path d="M16 2v4M8 2v4M3 14h18"/>
          </svg>
          ${vuln.publishedDate.toLocaleDateString()}
          ${
            vuln.references && vuln.references.length > 0
              ? `| <a href="${vuln.references[0]}" target="_blank">Reference</a>`
              : ""
          }
        </div>
      `;

      container.appendChild(card);

      // Add animation delay
      setTimeout(() => {
        card.style.opacity = "1";
        card.style.transform = "translateY(0)";
      }, index * 100);
    });
  };

  function exportToCSV() {
    // Get the currently filtered vulnerabilities
    const data = filteredVulnerabilities || [];

    if (data.length === 0) {
      return alert("No data available to export!");
    }

    // Define CSV headers
    const header = [
      "CVE ID",
      "CVSS Score",
      "Severity",
      "Published Date",
      "Description",
      "Tags",
    ];

    // Create CSV rows
    const rows = data.map((vuln) => {
      return [
        vuln.id,
        vuln.cvssScore,
        vuln.severity,
        vuln.publishedDate.toLocaleDateString(),
        `"${vuln.description.replace(/"/g, '""')}"`,
        (vuln.tags || []).join(", "),
      ]
        .map((val) => `"${String(val).replace(/"/g, '""')}"`)
        .join(",");
    });

    // Combine headers and rows
    const csv = [header.join(","), ...rows].join("\r\n");

    // Create download link
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "nvd_vulnerabilities.csv";
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
      applyFiltersAndSort();
    });
  });

  // Event listeners
  severityFilter.addEventListener("change", applyFiltersAndSort);
  sortDropdown.addEventListener("change", applyFiltersAndSort);
  searchInput.addEventListener("input", applyFiltersAndSort);

  // Initial load
  fetchVulnerabilities();
});
