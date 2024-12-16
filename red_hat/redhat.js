document.addEventListener("DOMContentLoaded", async () => {
  const redhatContent = document.getElementById("vulnerabilities-container");
  const timeFilter = document.getElementById("time-filter");
  const sortDropdown = document.getElementById("sort-dropdown");

  let vulnerabilities = [];

  // Fetch vulnerabilities from the server
  const fetchVulnerabilities = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/redhat");
      if (!response.ok) throw new Error("Failed to fetch vulnerabilities");

      vulnerabilities = await response.json();
      console.log("Fetched Vulnerabilities:", vulnerabilities);
      renderVulnerabilities();
    } catch (error) {
      redhatContent.innerHTML = `<p>Failed to load vulnerabilities: ${error.message}</p>`;
    }
  };

  // Filter vulnerabilities by date range
  const filterByDate = () => {
    const now = Date.now();
    const filterValue = timeFilter.value;

    return vulnerabilities.filter((vuln) => {
      const vulnDate = new Date(vuln.publicDate).getTime();

      switch (filterValue) {
        case "week":
          return now - vulnDate <= 7 * 24 * 60 * 60 * 1000; // Last 7 days
        case "month":
          return now - vulnDate <= 30 * 24 * 60 * 60 * 1000; // Last 30 days
        case "three-months":
          return now - vulnDate <= 90 * 24 * 60 * 60 * 1000; // Last 90 days
        default:
          return true;
      }
    });
  };

  // Sort vulnerabilities by the selected criteria
  const sortVulnerabilities = (data) => {
    const sortValue = sortDropdown.value;

    return [...data].sort((a, b) => {
      if (sortValue === "date")
        return new Date(b.publicDate) - new Date(a.publicDate);
      if (sortValue === "severity") return a.severity.localeCompare(b.severity);
      if (sortValue === "advisory") return a.title.localeCompare(b.title);
      return 0;
    });
  };

  // Render vulnerabilities
  const renderVulnerabilities = () => {
    const filteredData = filterByDate();
    const sortedData = sortVulnerabilities(filteredData);

    if (sortedData.length > 0) {
      redhatContent.innerHTML = sortedData
        .map(
          (vuln) => `
              <div class="vulnerability-card">
                <h3>${vuln.title}</h3>
                <p><strong>ID:</strong> ${vuln.id}</p>
                <p><strong>Severity:</strong> ${vuln.severity}</p>
                <p><strong>Public Date:</strong> ${vuln.publicDate}</p>
                <p><strong>Affected Packages:</strong> ${vuln.affectedPackages}</p>
              </div>
            `
        )
        .join("");
    } else {
      redhatContent.innerHTML =
        "<p>No vulnerabilities found for the selected filter.</p>";
    }
  };

  // Event Listeners for filtering and sorting
  timeFilter.addEventListener("change", renderVulnerabilities);
  sortDropdown.addEventListener("change", renderVulnerabilities);

  // Initial fetch
  fetchVulnerabilities();
});
