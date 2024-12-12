document.addEventListener("DOMContentLoaded", () => {
  const newsContainer = document.getElementById("news-container");
  const timeFilter = document.getElementById("time-filter");
  const sortDropdown = document.getElementById("sort-dropdown");
  const trendingSection = document.getElementById("trending-topics");

  let news = []; // Store all fetched news
  let filteredNews = []; // Store news filtered by time range

  // Stop words list
  const stopWords = new Set([
    "a",
    "an",
    "and",
    "the",
    "is",
    "in",
    "on",
    "at",
    "of",
    "for",
    "to",
    "with",
    "by",
    "as",
    "it",
    "this",
    "that",
    "these",
    "those",
    "from",
    "but",
    "or",
    "be",
    "are",
    "was",
    "were",
    "has",
    "have",
    "had",
    "not",
    "can",
    "will",
    "you",
    "we",
    "they",
    "he",
    "she",
    "i",
    "their",
    "our",
    "your",
    "its",
    "cybersecurity",
    "",
  ]);

  // Fetch news from the API
  const fetchNews = () => {
    const apiKey = "aa46aa2754214ac295aa1e80213c829d";
    fetch(`https://newsapi.org/v2/everything?q=cybersecurity&apiKey=${apiKey}`)
      .then((response) => response.json())
      .then((data) => {
        if (data.articles) {
          news = data.articles.map((article) => ({
            title: article.title,
            source: article.source.name,
            publishedAt: new Date(article.publishedAt),
            description: article.description,
            url: article.url,
          }));
          applyFilters("week"); // Default filter to last week
        } else {
          throw new Error("No articles found");
        }
      })
      .catch((error) => {
        console.error("Error fetching news:", error);
        newsContainer.innerHTML = "<p>Failed to load news.</p>";
      });
  };

  // Filter news by time range
  const applyFilters = (timeRange) => {
    const now = new Date();
    const timeRanges = {
      week: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
      month: 30 * 24 * 60 * 60 * 1000, // 30 days
      "three-months": 90 * 24 * 60 * 60 * 1000, // 90 days
    };

    const range = timeRanges[timeRange];
    if (range) {
      filteredNews = news.filter(
        (article) => now - article.publishedAt <= range
      );
    } else {
      filteredNews = [...news]; // Show all news
    }
    renderNews(filteredNews);
  };

  // Render news to the page
  const renderNews = (newsList) => {
    if (newsList.length === 0) {
      newsContainer.innerHTML = "<p>No news found for the selected range.</p>";
      return;
    }

    newsContainer.innerHTML = newsList
      .map(
        (article) => `
          <div class="news-card">
              <h3>${article.title}</h3>
              <p><strong>Source:</strong> ${article.source}</p>
              <p><strong>Published:</strong> ${article.publishedAt.toLocaleDateString()}</p>
              <p>${article.description || "No description available."}</p>
              <a href="${article.url}" target="_blank">Read more</a>
          </div>
      `
      )
      .join("");
  };

  // Analyze Bigrams
  document.getElementById("compare-button").addEventListener("click", () => {
    trendingSection.innerHTML = "<p>Analyzing headlines...</p>";

    setTimeout(() => {
      const headlines = filteredNews.map((article) => article.title);
      const bigramCounts = {};

      headlines.forEach((headline, index) => {
        const words = headline
          .toLowerCase()
          .split(" ")
          .map((word) => word.replace(/[^a-zA-Z0-9]/g, ""))
          .filter((word) => word && !stopWords.has(word));

        for (let i = 0; i < words.length - 1; i++) {
          const bigram = `${words[i]} && ${words[i + 1]}`;
          if (!bigramCounts[bigram]) {
            bigramCounts[bigram] = { count: 1, indexes: [index] };
          } else {
            bigramCounts[bigram].count++;
            bigramCounts[bigram].indexes.push(index);
          }
        }
      });

      const topBigrams = Object.entries(bigramCounts)
        .filter(([_, data]) => data.count > 1) // Only keep bigrams with more than 1 mention
        .sort((a, b) => b[1].count - a[1].count);

      if (topBigrams.length === 0) {
        trendingSection.innerHTML = "<p>No common topics found.</p>";
      } else {
        trendingSection.innerHTML = `
          <h3>Trending Bigrams</h3>
          <ul>
            ${topBigrams
              .map(
                ([bigram, data]) => `
                  <li>
                    ${bigram} (${data.count} mentions)
                    <div class="button-group">
                      ${data.indexes
                        .map(
                          (index) => `
                          <button class="show-article" data-index="${index}">Show Article</button>`
                        )
                        .join("")}
                    </div>
                  </li>
              `
              )
              .join("")}
          </ul>
        `;

        document.querySelectorAll(".show-article").forEach((button) => {
          button.addEventListener("click", (e) => {
            const index = e.target.dataset.index;
            const target = document.querySelectorAll(".news-card")[index];

            if (target) {
              target.scrollIntoView({ behavior: "smooth", block: "center" });
              target.style.transition = "background-color 0.5s ease";
              target.style.backgroundColor = "#ffecb3";

              setTimeout(() => {
                target.style.backgroundColor = "white";
              }, 2000);
            }
          });
        });
      }
    }, 1000);
  });

  // Sort news
  const sortNews = (criteria) => {
    const sorted = [...filteredNews];
    if (criteria === "date") {
      sorted.sort((a, b) => b.publishedAt - a.publishedAt);
    } else if (criteria === "source") {
      sorted.sort((a, b) => a.source.localeCompare(b.source));
    } else if (criteria === "title") {
      sorted.sort((a, b) => a.title.localeCompare(b.title));
    }
    renderNews(sorted);
  };

  timeFilter.addEventListener("change", (e) => applyFilters(e.target.value));
  sortDropdown.addEventListener("change", (e) => sortNews(e.target.value));

  fetchNews();
});
