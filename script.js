document.addEventListener("DOMContentLoaded", () => {
  const microsoftContent = document.getElementById("microsoft-content");
  const cisaContent = document.getElementById("cisa-content");
  const trendingSection = document.getElementById("trending-content");

  // Fetch Microsoft updates
  const fetchMicrosoftUpdates = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/updates");
      const data = await response.json();

      if (!data || data.message) {
        microsoftContent.innerHTML = `<p>Failed to load Microsoft updates.</p>`;
        return;
      }

      const sortedVulnerabilities = (data["vuln:Vulnerability"] || [])
        .filter((vuln) => vuln["vuln:Title"])
        .map((vuln) => ({
          title: vuln["vuln:Title"],
          baseScore:
            vuln["vuln:CVSSScoreSets"]?.["vuln:ScoreSet"]?.[0]?.[
              "vuln:BaseScore"
            ] || "N/A",
          temporalScore:
            vuln["vuln:CVSSScoreSets"]?.["vuln:ScoreSet"]?.[0]?.[
              "vuln:TemporalScore"
            ] || "N/A",
          status: vuln["vuln:Threats"]?.["vuln:Threat"]?.[0]?.[
            "vuln:Description"
          ]?.includes("Exploited:Yes")
            ? "Exploited"
            : "Not Exploited",
          date:
            vuln["vuln:RevisionHistory"]?.["vuln:Revision"]?.[0]?.[
              "cvrf:Date"
            ] || "N/A",
        }))
        .sort(
          (a, b) =>
            new Date(b.date || "1970-01-01") - new Date(a.date || "1970-01-01")
        )
        .slice(0, 3);

      // Render vulnerabilities in a row
      microsoftContent.innerHTML = `
          <div style="display: flex; gap: 10px; flex-wrap: wrap;">
            ${sortedVulnerabilities
              .map((vuln) => {
                let bgColor = "#90a4ae";
                const score = parseFloat(vuln.baseScore);
                if (score >= 7) bgColor = "#d32f2f";
                else if (score >= 4) bgColor = "#f9a825";
                else if (score > 0) bgColor = "#388e3c";

                return `
                  <div style="
                    background-color: ${bgColor};
                    color: white;
                    padding: 15px;
                    border-radius: 8px;
                    flex: 1 1 calc(25% - 10px); /* Adjust for 4 items per row */
                  ">
                    <h4>${vuln.title}</h4>
                    <p><strong>Base Score:</strong> ${vuln.baseScore}</p>
                    <p><strong>Temporal Score:</strong> ${
                      vuln.temporalScore
                    }</p>
                    <p><strong>Status:</strong> ${vuln.status}</p>
                    <p><strong>Date:</strong> ${
                      vuln.date === "N/A"
                        ? "No Date Provided"
                        : new Date(vuln.date).toLocaleDateString()
                    }</p>
                  </div>
                `;
              })
              .join("")}
          </div>
        
        `;
    } catch (error) {
      microsoftContent.innerHTML = `<p>Failed to load Microsoft updates: ${error.message}</p>`;
    }
  };

  // Fetch CISA updates
  const fetchCisaUpdates = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/cisa");
      const data = await response.json();

      const sortedUpdates = data
        .map((vuln) => ({
          title: vuln.vulnerabilityName,
          date: new Date(vuln.dateAdded),
        }))
        .sort((a, b) => b.date - a.date)
        .slice(0, 3);

      cisaContent.innerHTML = `
          <div style="display: flex; gap: 10px; flex-wrap: wrap;">
            ${sortedUpdates
              .map(
                (update) => `
                  <div style="flex: 1 1 calc(25% - 10px); padding: 10px; border: 1px solid #ddd; border-radius: 8px;">
                    <h4>${update.title}</h4>
                    <p><strong>Date:</strong> ${update.date.toLocaleDateString()}</p>
                  </div>
                `
              )
              .join("")}
          </div>
         
        `;
    } catch (error) {
      cisaContent.innerHTML = `<p>Failed to load CISA updates: ${error.message}</p>`;
    }
  };

  // Fetch trending articles
  const fetchTrendingArticles = async () => {
    try {
      const apiKey = "aa46aa2754214ac295aa1e80213c829d";
      const response = await fetch(
        `https://newsapi.org/v2/everything?q=cybersecurity&apiKey=${apiKey}`
      );
      const data = await response.json();

      // Filter and sort articles by date (most recent first)
      const sortedArticles = data.articles
        .filter((article) => article.publishedAt) // Ensure articles have a published date
        .sort(
          (a, b) =>
            new Date(b.publishedAt).getTime() -
            new Date(a.publishedAt).getTime()
        );

      // Render the most recent 4 articles
      trendingSection.innerHTML = sortedArticles
        .slice(0, 3) // Display the top 4 articles
        .map((article) => {
          const description =
            article.description?.split(" ").slice(0, 6).join(" ") + "..." ||
            "No description available.";

          return `
            <div class="news-card" style="padding: 15px; border: 1px solid #ddd; border-radius: 8px; margin-bottom: 15px; background-color: #fff; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
              <h4 style="margin: 0 0 10px; font-size: 1.2rem; color: #800000;">${
                article.title
              }</h4>
              <p style="margin: 0 0 5px; color: #555; font-size: 0.9rem;"><strong>Published:</strong> ${new Date(
                article.publishedAt
              ).toLocaleDateString()}</p>
              <p style="margin: 0; color: #333;">${description}</p>
              
            </div>
          `;
        })
        .join("");
    } catch (error) {
      trendingSection.innerHTML = `<p>Failed to load trending topics: ${error.message}</p>`;
    }
  };

  // Call functions
  fetchMicrosoftUpdates();
  fetchCisaUpdates();
  fetchTrendingArticles();
});
