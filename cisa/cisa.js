document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("vulnerability-container");
  const timeFilter = document.getElementById("time-filter");
  const sortDropdown = document.getElementById("sort-dropdown");

  let vulnerabilities = [];
  let filteredVulnerabilities = [];

  const isWithinTimeRange = (vulnDate, days) => {
    const now = new Date();
    return now - vulnDate <= days * 86400000;
  };

  const fetchVulnerabilities = () => {
    container.innerHTML = '<div class="loading-animation"></div>';

    fetch("http://localhost:3000/api/cisa")
      .then((response) => response.json())
      .then((data) => {
        vulnerabilities = data.map((vuln) => ({
          ...vuln,
          dateAdded: new Date(vuln.dateAdded),
        }));
        applyFilters("week");
      })
      .catch((error) => {
        container.innerHTML = `<div class="vulnerability-card">Error loading data: ${error.message}</div>`;
      });
  };

  const applyFilters = (timeRange) => {
    const daysMapping = { week: 7, month: 30, "three-months": 90 };
    filteredVulnerabilities = vulnerabilities.filter((vuln) =>
      daysMapping[timeRange]
        ? isWithinTimeRange(vuln.dateAdded, daysMapping[timeRange])
        : true
    );
    renderVulnerabilities(filteredVulnerabilities);
  };

  const renderVulnerabilities = (vulnList) => {
    container.innerHTML = "";

    if (vulnList.length === 0) {
      container.innerHTML =
        '<div class="vulnerability-card">No vulnerabilities found</div>';
      return;
    }

    vulnList.forEach((vuln, index) => {
      const card = document.createElement("div");
      card.className = "vulnerability-card";
      card.innerHTML = `
        <h3>${vuln.vulnerabilityName || vuln.cveID}</h3>
        <div class="meta-grid">
          <div class="meta-item">
            <svg class="meta-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7v10l10 5 10-5V7L12 2zM12 19.5l-7-3.5V9.07l7 3.5 7-3.5V16l-7 3.5z"/>
            </svg>
            <div>${vuln.vendorProject}</div>
          </div>
          <div class="meta-item">
            <svg class="meta-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
            <div>${vuln.product}</div>
          </div>
        </div>
        <div class="status-badge ${
          vuln.knownRansomwareCampaignUse ? "exploited" : "unknown"
        }">
          ${vuln.knownRansomwareCampaignUse || "Unknown"}
        </div>
        <div class="date-info">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M3 9h18V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V10H3"/>
            <path d="M16 2v4M8 2v4M3 14h18"/>
          </svg>
          ${vuln.dateAdded.toLocaleDateString()}
        </div>
        ${
          vuln.shortDescription
            ? `<p class="description">${vuln.shortDescription}</p>`
            : ""
        }
      `;

      container.appendChild(card);

      // Animation with delay
      setTimeout(() => {
        card.style.opacity = "1";
        card.style.transform = "translateY(0)";
      }, index * 150);
    });
  };

  const sortVulnerabilities = (criteria) => {
    const sorted = [...filteredVulnerabilities];
    switch (criteria) {
      case "name":
        sorted.sort((a, b) =>
          (a.vulnerabilityName || "").localeCompare(b.vulnerabilityName || "")
        );
        break;
      case "date":
        sorted.sort((a, b) => b.dateAdded - a.dateAdded);
        break;
      case "vendor":
        sorted.sort((a, b) =>
          (a.vendorProject || "").localeCompare(b.vendorProject || "")
        );
        break;
    }
    renderVulnerabilities(sorted);
  };

  // Event Listeners
  timeFilter.addEventListener("change", (e) => applyFilters(e.target.value));
  sortDropdown.addEventListener("change", (e) =>
    sortVulnerabilities(e.target.value)
  );

  // Add this near your other event listeners
  document.getElementById("cisa-export-btn")?.addEventListener("click", () => {
    exportCisaToCSV();
  });

  // Add this function to your JavaScript
  function exportCisaToCSV() {
    // Get the current filtered/displayed vulnerabilities
    const data = filteredVulnerabilities || [];

    if (data.length === 0) {
      return alert("No data available to export!");
    }

    // Define CSV headers
    const header = [
      "CVE ID",
      "Vulnerability Name",
      "Date Added",
      "Required Action",
    ];

    // Create CSV rows
    const rows = data.map((v) =>
      [
        v.cveID || "",
        v.vulnerabilityName || "",
        v.dateAdded ? new Date(v.dateAdded).toLocaleDateString() : "",
        v.requiredAction || "",
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
    a.download = "cisa_vulnerabilities.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  // Initial Load
  fetchVulnerabilities();
});
