document.addEventListener("DOMContentLoaded", () => {
  const headerInformationDiv = document.getElementById("header-information");
  const vulnerabilitiesListDiv = document.getElementById(
    "vulnerabilities-list"
  );
  const filterDropdown = document.getElementById("filter-dropdown");

  let vulnerabilitiesList = [];
  let originalVulnerabilities = [];

  // Fetch and display data
  fetch("http://localhost:3000/api/updates")
    .then((response) => response.json())
    .then((data) => {
      if (!data || data.message) {
        vulnerabilitiesListDiv.innerHTML = `<p>${
          data.message || "No data available."
        }</p>`;
        return;
      }

      // Extract header information
      const documentTitle = data["cvrf:DocumentTitle"] || "No Title Available";
      const initialReleaseDate =
        data["cvrf:DocumentTracking"]?.["cvrf:InitialReleaseDate"] || "N/A";

      // Update header dynamically
      headerInformationDiv.innerHTML = `
        <h3>${documentTitle}</h3>
        <p><strong>Initial Release Date:</strong> ${
          initialReleaseDate !== "N/A"
            ? new Date(initialReleaseDate).toLocaleDateString()
            : "No Date Provided"
        }</p>
      `;

      // Extract vulnerabilities
      const vulnerabilities = data["vuln:Vulnerability"] || [];
      vulnerabilitiesList = vulnerabilities
        .filter((vuln) => vuln["vuln:Title"]) // Only include vulnerabilities with a title
        .map((vuln) => {
          let baseScore = "N/A";
          let temporalScore = "N/A";
          let exploited = false;
          let revisionDate = "N/A";

          // Extract scores
          if (
            vuln["vuln:CVSSScoreSets"] &&
            vuln["vuln:CVSSScoreSets"]["vuln:ScoreSet"]
          ) {
            const scoreSet = vuln["vuln:CVSSScoreSets"]["vuln:ScoreSet"];
            if (Array.isArray(scoreSet)) {
              for (const set of scoreSet) {
                if (set["vuln:BaseScore"] && baseScore === "N/A") {
                  baseScore = set["vuln:BaseScore"];
                }
                if (set["vuln:TemporalScore"] && temporalScore === "N/A") {
                  temporalScore = set["vuln:TemporalScore"];
                }
                if (baseScore !== "N/A" && temporalScore !== "N/A") break;
              }
            } else {
              if (scoreSet["vuln:BaseScore"]) {
                baseScore = scoreSet["vuln:BaseScore"];
              }
              if (scoreSet["vuln:TemporalScore"]) {
                temporalScore = scoreSet["vuln:TemporalScore"];
              }
            }
          }

          // Extract revision date
          if (
            vuln["vuln:RevisionHistory"] &&
            vuln["vuln:RevisionHistory"]["vuln:Revision"]
          ) {
            const revision = vuln["vuln:RevisionHistory"]["vuln:Revision"];
            if (Array.isArray(revision)) {
              revisionDate = revision[0]["cvrf:Date"] || "N/A";
            } else {
              revisionDate = revision["cvrf:Date"] || "N/A";
            }
          }

          // Check for Exploited:Yes in vuln:Threats
          if (vuln["vuln:Threats"] && vuln["vuln:Threats"]["vuln:Threat"]) {
            const threats = vuln["vuln:Threats"]["vuln:Threat"];
            if (Array.isArray(threats)) {
              const exploitStatus = threats
                .map((threat) => threat["vuln:Description"])
                .find((desc) => desc?.includes("Exploited:Yes"));
              if (exploitStatus) exploited = true;
            }
          }

          return {
            title: vuln["vuln:Title"],
            baseScore: baseScore,
            temporalScore: temporalScore,
            exploited: exploited,
            date: revisionDate,
          };
        });

      originalVulnerabilities = [...vulnerabilitiesList];
      renderVulnerabilities(vulnerabilitiesList);
    })
    .catch((error) => {
      vulnerabilitiesListDiv.innerHTML = `<p>Failed to load updates: ${error.message}</p>`;
    });

  // Render vulnerabilities
  const renderVulnerabilities = (vulnerabilities) => {
    vulnerabilitiesListDiv.innerHTML = vulnerabilities
      .map((vuln) => {
        let bgColor = "#90a4ae"; // Default gray for missing BaseScore
        if (vuln.baseScore !== "N/A") {
          const score = parseFloat(vuln.baseScore);
          if (score < 4) {
            bgColor = "#388e3c"; // Green for low severity
          } else if (score < 7) {
            bgColor = "#f9a825"; // Yellow for medium severity
          } else {
            bgColor = "#d32f2f"; // Red for high severity
          }
        }

        return `
        <div style="
          background-color: ${bgColor};
          color: white;
          padding: 15px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          margin: 10px 0;
        ">
          <h4>${vuln.title}</h4>
          <p><strong>Base Score:</strong> ${vuln.baseScore}</p>
          <p><strong>Temporal Score:</strong> ${vuln.temporalScore}</p>
          <p><strong>Status:</strong> ${
            vuln.exploited ? "Exploited" : "Not Exploited"
          }</p>
          <p><strong>Date:</strong> ${
            vuln.date === "N/A"
              ? "No Date Provided"
              : new Date(vuln.date).toLocaleDateString()
          }</p>
        </div>`;
      })
      .join("");
  };

  // Filter dropdown functionality
  filterDropdown.addEventListener("change", (event) => {
    const filterValue = event.target.value;
    let sortedVulnerabilities = [...originalVulnerabilities];

    if (filterValue === "name") {
      sortedVulnerabilities.sort((a, b) => a.title.localeCompare(b.title));
    } else if (filterValue === "date") {
      sortedVulnerabilities.sort((a, b) => new Date(a.date) - new Date(b.date));
    } else if (filterValue === "exploitability") {
      sortedVulnerabilities = sortedVulnerabilities.filter(
        (vuln) => vuln.exploited
      );
    }

    renderVulnerabilities(sortedVulnerabilities);
  });
});
