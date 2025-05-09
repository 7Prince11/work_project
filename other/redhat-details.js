document.addEventListener("DOMContentLoaded", async () => {
  const detailsContainer = document.getElementById("details-container");

  // 1) Get ?url= from the query string
  const params = new URLSearchParams(window.location.search);
  const resourceUrl = params.get("url");

  if (!resourceUrl) {
    detailsContainer.innerHTML =
      "<p class='error'>No resource URL provided.</p>";
    return;
  }

  try {
    // 2) Fetch the resource JSON
    const response = await fetch(resourceUrl);
    if (!response.ok) {
      throw new Error("Failed to fetch details from Red Hat resource URL.");
    }
    const data = await response.json();

    // 3) Summarize the data
    // We'll pick out some fields: threat_severity, public_date, bugzilla, cvss3, cwe, details, references...
    const severity = data.threat_severity || "Unknown";
    const pubDate = data.public_date || "No date provided";
    const bugzillaDesc =
      data.bugzilla?.description || "No bugzilla description";
    const cwe = data.cwe || "N/A";
    const detailText =
      data.details && data.details.length > 0
        ? data.details.join("<br/>")
        : "No details available";
    const references =
      data.references && data.references.length > 0
        ? data.references.join("<br/>")
        : "No references";
    const cvss3Score = data.cvss3?.cvss3_base_score || "N/A";
    const cvss3Vector = data.cvss3?.cvss3_scoring_vector || "N/A";

    // 4) Show a simple summary
    detailsContainer.innerHTML = `
        <div class="vulnerability-summary">
          <h2>${data.name || "No CVE Name"}</h2>
          <p><strong>Threat Severity:</strong> ${severity}</p>
          <p><strong>Public Date:</strong> ${pubDate}</p>
          <p><strong>Bugzilla Description:</strong> ${bugzillaDesc}</p>
          <p><strong>CWE:</strong> ${cwe}</p>
          <p><strong>CVSS v3 Score:</strong> ${cvss3Score} <br/>
             <strong>Vector:</strong> ${cvss3Vector}</p>
          <h3>Details</h3>
          <p>${detailText}</p>
          <h3>References</h3>
          <p>${references}</p>
        </div>
      `;

    // If you want to summarize package_state, you could do something like:
    if (Array.isArray(data.package_state)) {
      let packageList = data.package_state
        .map(
          (pkg) => `
          <li><strong>Product:</strong> ${pkg.product_name}, 
              <strong>Fix State:</strong> ${pkg.fix_state}, 
              <strong>Package:</strong> ${pkg.package_name}</li>
        `
        )
        .join("");
      detailsContainer.innerHTML += `
          <h3>Package State</h3>
          <ul>${packageList}</ul>
        `;
    }
  } catch (error) {
    detailsContainer.innerHTML = `<p class='error'>Error: ${error.message}</p>`;
  }
});
