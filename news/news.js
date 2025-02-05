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
            image: article.urlToImage, // Add image URL
          }));
          applyFilters("week");
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
      newsContainer.innerHTML =
        "<div class='news-card'>No news found for the selected range.</div>";
      return;
    }

    newsContainer.innerHTML = "";

    newsList.forEach((article, index) => {
      const card = document.createElement("div");
      card.className = "news-card";
      card.innerHTML = `
        ${
          article.image
            ? `
        <div class="news-image-container">
          <img src="${article.image}" 
               alt="${article.title}" 
               class="news-image"
               onerror="this.style.display='none'">
        </div>`
            : ""
        }
        <h3>${article.title}</h3>
        <div class="meta-info">
          <div class="meta-item">
            <svg class="meta-icon" viewBox="0 0 24 24" width="16" height="16">
              <path d="M18 2h-8l-2-2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 18H6V4h2v4h8V4h2v16z"/>
            </svg>
            ${article.source}
          </div>
          <div class="meta-item">
            <svg class="meta-icon" viewBox="0 0 24 24" width="16" height="16">
              <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8zm.5-13H11v6l5.2 3.2.8-1.3-4.5-2.7V7z"/>
            </svg>
            ${article.publishedAt.toLocaleDateString()}
          </div>
        </div>
        <p>${article.description || "No description available."}</p>
        <a href="${article.url}" target="_blank">
          Read Full Article
          <svg class="external-icon" viewBox="0 0 24 24" width="14" height="14">
            <path d="M18 13v6c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V8c0-1.1.9-2 2-2h6l2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-5l-2-2z"/>
            <path d="M17.7.3c-.4-.4-1-.4-1.4 0l-3.2 3.2L15 5.6 18.4 9l2.1-2.1c.4-.4.4-1 0-1.4L17.7.3z"/>
          </svg>
        </a>
      `;

      // Animation
      setTimeout(() => {
        card.style.opacity = "1";
        card.style.transform = "translateY(0)";
        card.style.animation = "cardEntrance 0.6s ease-out";
      }, index * 150);

      newsContainer.appendChild(card);
    });
  };

  // Analyze Bigrams
  document.getElementById("compare-button").addEventListener("click", () => {
    trendingSection.innerHTML = `
  <h3>Trending Bigrams</h3>
  <ul class="trending-list">
    ${topBigrams
      .map(
        ([bigram, data]) => `
      <li class="trending-item">
        <div class="bigram-header">
          <span class="bigram-text">${bigram}</span>
          <span class="mention-count">${data.count} mentions</span>
        </div>
        <div class="button-group">
          ${data.indexes
            .map(
              (index) => `
            <button class="show-article" data-index="${index}">
              Article ${index + 1}
            </button>
          `
            )
            .join("")}
        </div>
      </li>
    `
      )
      .join("")}
  </ul>
`;

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
            const targetCard = document.querySelectorAll(".news-card")[index];

            if (targetCard) {
              targetCard.scrollIntoView({
                behavior: "smooth",
                block: "center",
              });
              targetCard.animate(
                [
                  { backgroundColor: "rgba(255, 236, 179, 0.5)" },
                  { backgroundColor: "white" },
                ],
                {
                  duration: 1500,
                  easing: "ease-out",
                }
              );
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
