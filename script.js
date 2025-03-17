document.addEventListener("DOMContentLoaded", () => {
  const microsoftContent = document.getElementById("microsoft-content");
  const cisaContent = document.getElementById("cisa-content");
  const trendingSection = document.getElementById("trending-content");
  const redhatContent = document.getElementById("redhat-content");

  // Helper function to get severity class based on numeric CVSS
  const getSeverityClass = (score) => {
    const numScore = parseFloat(score);
    if (numScore >= 7) return "severe";
    if (numScore >= 4) return "high";
    if (numScore > 0) return "medium";
    return "neutral";
  };

  // Microsoft Updates
  const fetchMicrosoftUpdates = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/updates");
      const data = await response.json();

      if (!data || data.message) {
        microsoftContent.innerHTML = `<p class="error-msg">⚠️ Failed to load Microsoft updates</p>`;
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

      microsoftContent.innerHTML = sortedVulnerabilities
        .map(
          (vuln) => `
            <div class="news-card">
              <div class="score-badge ${getSeverityClass(vuln.baseScore)}">
                CVSS: ${vuln.baseScore}
              </div>
              <h4>${vuln.title}</h4>
              <div class="meta-info">
                <p>
                  <span class="status-dot ${
                    vuln.status === "Exploited" ? "exploited" : "safe"
                  }"></span>
                  ${vuln.status}
                </p>
                <p class="date-tag">📅 ${
                  vuln.date === "N/A"
                    ? "No Date"
                    : new Date(vuln.date).toLocaleDateString()
                }</p>
              </div>
            </div>
          `
        )
        .join("");
    } catch (error) {
      microsoftContent.innerHTML = `<p class="error-msg">⚠️ Error: ${error.message}</p>`;
    }
  };

  // CISA Updates
  const fetchCisaUpdates = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/cisa");
      const data = await response.json();

      if (!Array.isArray(data)) {
        cisaContent.innerHTML = `<p class="error-msg">⚠️ Failed to load CISA updates</p>`;
        return;
      }

      const sortedUpdates = data
        .map((vuln) => ({
          title: vuln.vulnerabilityName,
          date: new Date(vuln.dateAdded),
        }))
        .sort((a, b) => b.date - a.date)
        .slice(0, 3);

      cisaContent.innerHTML = sortedUpdates
        .map(
          (update) => `
            <div class="news-card">
              <h4>${update.title}</h4>
              <div class="meta-info">
                <p class="date-tag">📅 ${update.date.toLocaleDateString()}</p>
              </div>
            </div>
          `
        )
        .join("");
    } catch (error) {
      cisaContent.innerHTML = `<p class="error-msg">⚠️ Error: ${error.message}</p>`;
    }
  };

  // Red Hat Updates (NEW)
  const fetchRedHatUpdates = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/redhat");
      const data = await response.json();

      if (!Array.isArray(data)) {
        redhatContent.innerHTML = `<p class="error-msg">⚠️ Failed to load Red Hat updates</p>`;
        return;
      }

      // Show top 3 vulnerabilities
      const topRedHat = data
        .filter((v) => v.title && v.title !== "No details available")
        .slice(0, 3)
        .map((v) => ({
          title: v.title,
          baseScore: v.cvssScore === "N/A" ? "N/A" : v.cvssScore,
          severity: v.severity || "Unknown",
          date:
            v.publicDate !== "No date provided" ? new Date(v.publicDate) : null,
        }));

      redhatContent.innerHTML = topRedHat
        .map((vuln) => {
          const dateDisplay = vuln.date
            ? `📅 ${vuln.date.toLocaleDateString()}`
            : "No Date";
          return `
            <div class="news-card">
              <div class="score-badge ${getSeverityClass(vuln.baseScore)}">
                CVSS: ${vuln.baseScore}
              </div>
              <h4>${vuln.title}</h4>
              <div class="meta-info">
                <p>${vuln.severity} Severity</p>
                <p class="date-tag">${dateDisplay}</p>
              </div>
            </div>
          `;
        })
        .join("");
    } catch (error) {
      redhatContent.innerHTML = `<p class="error-msg">⚠️ Error: ${error.message}</p>`;
    }
  };

  // Trending Articles
  const fetchTrendingArticles = async () => {
    try {
      // For demonstration, we assume your API key is valid
      const apiKey = "aa46aa2754214ac295aa1e80213c829d";
      const response = await fetch(
        `https://newsapi.org/v2/everything?q=cybersecurity&apiKey=${apiKey}`
      );
      const data = await response.json();

      if (!data.articles) {
        trendingSection.innerHTML = `<p class="error-msg">⚠️ Failed to load trending articles</p>`;
        return;
      }

      const sortedArticles = data.articles
        .filter((article) => article.publishedAt)
        .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
        .slice(0, 3);

      trendingSection.innerHTML = sortedArticles
        .map((article) => {
          const description =
            article.description?.split(" ").slice(0, 12).join(" ") + "..." ||
            "No description available";
          return `
            <div class="news-card">
              <h4>${article.title}</h4>
              ${
                article.urlToImage
                  ? `<div class="image-container">
                      <img
                        src="${article.urlToImage}"
                        alt="${article.title}"
                        class="article-image"
                        loading="lazy"
                      />
                    </div>`
                  : ""
              }
              <p class="article-excerpt">${description}</p>
              <div class="meta-info">
                <span class="source-badge">${article.source?.name || ""}</span>
                <span class="date-tag">📅 ${new Date(
                  article.publishedAt
                ).toLocaleDateString()}</span>
              </div>
            </div>
          `;
        })
        .join("");
    } catch (error) {
      trendingSection.innerHTML = `<p class="error-msg">⚠️ Error: ${error.message}</p>`;
    }
  };

  // Initialize all fetchers
  const init = () => {
    fetchMicrosoftUpdates();
    fetchCisaUpdates();
    fetchRedHatUpdates(); // <--- CALL OUR NEW FUNCTION
    fetchTrendingArticles();
  };

  init();
});
