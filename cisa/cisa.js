document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("vulnerability-container");
  const timeFilter = document.getElementById("time-filter");
  const sortDropdown = document.getElementById("sort-dropdown");

  let vulnerabilities = []; // Store all vulnerabilities
  let filteredVulnerabilities = []; // Store filtered vulnerabilities based on time

  // Helper function to calculate date differences
  const isWithinTimeRange = (vulnDate, days) => {
    const now = new Date();
    return now - vulnDate <= days * 24 * 60 * 60 * 1000; // Difference in milliseconds
  };

  // Fetch vulnerabilities from the API
  const fetchVulnerabilities = () => {
    fetch("http://localhost:3000/api/cisa")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        console.log(data);
        vulnerabilities = data.map((vuln) => ({
          ...vuln,
          dateAdded: new Date(vuln.dateAdded), // Convert dateAdded to Date object
        }));
        applyFilters("week"); // Default time filter to last week
      })
      .catch((error) => {
        console.error("Error fetching vulnerabilities:", error);
        container.innerHTML = "<p>Failed to load vulnerabilities.</p>";
      });
  };

  // Apply time filter and render
  const applyFilters = (timeRange) => {
    const daysMapping = {
      week: 7,
      month: 30,
      "three-months": 90,
    };

    const days = daysMapping[timeRange];
    if (days !== undefined) {
      filteredVulnerabilities = vulnerabilities.filter((vuln) =>
        isWithinTimeRange(vuln.dateAdded, days)
      );
    } else {
      filteredVulnerabilities = [...vulnerabilities]; // No filter, show all
    }

    renderVulnerabilities(filteredVulnerabilities); // Render filtered list
  };

  // Render vulnerabilities to the container
  const renderVulnerabilities = (vulnList) => {
    if (vulnList.length === 0) {
      container.innerHTML =
        "<p>No vulnerabilities found for the selected range.</p>";
      return;
    }

    container.innerHTML = vulnList
      .map((vuln) => {
        return `
          <div class="vulnerability-card">
            <h3>${vuln.vulnerabilityName || vuln.cveID}</h3>
            <p><strong>Vendor:</strong> ${vuln.vendorProject}</p>
            <p><strong>Product:</strong> ${vuln.product}</p>
            <p><strong>Date Added:</strong> ${vuln.dateAdded.toLocaleDateString()}</p>
            <p><strong>Status:</strong> ${
              vuln.knownRansomwareCampaignUse || "Unknown"
            }</p>
            <p><strong>Description:</strong> ${vuln.shortDescription}</p>
          </div>
        `;
      })
      .join("");
  };

  // Sort vulnerabilities
  const sortVulnerabilities = (criteria) => {
    const sorted = [...filteredVulnerabilities]; // Sort only the filtered vulnerabilities
    if (criteria === "name") {
      sorted.sort((a, b) =>
        (a.vulnerabilityName || "").localeCompare(b.vulnerabilityName || "")
      );
    } else if (criteria === "date") {
      sorted.sort((a, b) => b.dateAdded - a.dateAdded); // Sort by date (most recent first)
    } else if (criteria === "vendor") {
      sorted.sort((a, b) =>
        (a.vendorProject || "").localeCompare(b.vendorProject || "")
      );
    }
    renderVulnerabilities(sorted);
  };

  // Event listeners for filters
  timeFilter.addEventListener("change", (e) => applyFilters(e.target.value));
  sortDropdown.addEventListener("change", (e) =>
    sortVulnerabilities(e.target.value)
  );

  // Initialize data fetch and default view
  fetchVulnerabilities();
});
