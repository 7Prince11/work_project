document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("vulnerability-container");
  const severityFilter = document.getElementById("severity-filter");
  const sortDropdown = document.getElementById("sort-dropdown");
  const searchInput = document.getElementById("search-input");

  // Stats elements
  const totalCves = document.getElementById("total-cves");
  const criticalCount = document.getElementById("critical-count");
  const highCount = document.getElementById("high-count");
  const mediumCount = document.getElementById("medium-count");
  const lowCount = document.getElementById("low-count");

  let vulnerabilities = [];
  let filteredVulnerabilities = [];

  // Calculate severity from CVSS score
  const getSeverity = (score) => {
    if (score === "N/A") return "low";
    const num = parseFloat(score);
    if (num >= 9.0) return "critical";
    if (num >= 7.0) return "high";
    if (num >= 4.0) return "medium";
    return "low";
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

      vulnerabilities = data.map((vuln) => ({
        id: vuln.id,
        description: vuln.description,
        cvssScore: vuln.cvssScore,
        severity: getSeverity(vuln.cvssScore),
        publishedDate: new Date(vuln.publishedDate),
        tags: vuln.tags,
        references: vuln.references,
      }));

      updateStats();
      applyFiltersAndSort();
    } catch (error) {
      container.innerHTML = `<div class="vulnerability-card">Error loading data: ${error.message}</div>`;
    }
  };

  // Update statistics
  // Update statistics
  const updateStats = () => {
    const stats = vulnerabilities.reduce(
      (acc, vuln) => {
        acc.total++;
        acc[vuln.severity]++;
        return acc;
      },
      { total: 0, critical: 0, high: 0, medium: 0, low: 0 }
    );

    totalCves.textContent = stats.total;
    criticalCount.textContent = stats.critical;
    highCount.textContent = stats.high;
    mediumCount.textContent = stats.medium;
    document.getElementById("low-count").textContent = stats.low;
  };

  // Apply filters and sorting
  const applyFiltersAndSort = () => {
    let result = [...vulnerabilities];

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
          vuln.tags.some((tag) => tag.toLowerCase().includes(searchTerm))
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
          ${vuln.tags.map((tag) => `<span class="tag">${tag}</span>`).join("")}
        </div>
        
        <div class="date-info">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M3 9h18V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V10H3"/>
            <path d="M16 2v4M8 2v4M3 14h18"/>
          </svg>
          ${vuln.publishedDate.toLocaleDateString()}
          ${
            vuln.references.length > 0
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

  // Event listeners
  severityFilter.addEventListener("change", applyFiltersAndSort);
  sortDropdown.addEventListener("change", applyFiltersAndSort);
  searchInput.addEventListener("input", applyFiltersAndSort);

  // Initial load
  fetchVulnerabilities();
});
