document.addEventListener("DOMContentLoaded", () => {
  const newsContainer = document.getElementById("news-container");
  const timeFilter = document.getElementById("time-filter");
  const sortDropdown = document.getElementById("sort-dropdown");
  const trendingSection = document.getElementById("trending-topics");

  // — Inject search input into control panel —
  const controlPanel = document.querySelector(".control-panel");
  const searchGroup = document.createElement("div");
  searchGroup.className = "control-group";
  searchGroup.innerHTML = `
    <label for="search-input" class="control-label">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="2"/>
        <path d="M21 21l-4.35-4.35" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
      Search
    </label>
    <input type="text" id="search-input" placeholder="Search articles..." autocomplete="off">
  `;
  controlPanel.appendChild(searchGroup);
  const searchInput = document.getElementById("search-input");

  let news = []; // All loaded articles
  let filteredNews = []; // Filtered by time

  // Stop words for bigrams
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

  // Fetch news
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
            image: article.urlToImage,
          }));
          applyFilters("week");
        } else {
          throw new Error("No articles found");
        }
      })
      .catch((error) => {
        console.error("Error fetching news:", error);
        newsContainer.innerHTML = `
          <div class="news-card">
            <div class="news-card-content">
              <h3>Failed to load news</h3>
              <p>${error.message}</p>
            </div>
          </div>`;
      });
  };

  // Apply time filter
  const applyFilters = (timeRange) => {
    const now = Date.now();
    const timeRanges = {
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000,
      "three-months": 90 * 24 * 60 * 60 * 1000,
    };

    const range = timeRanges[timeRange];
    filteredNews = range
      ? news.filter((article) => now - article.publishedAt.getTime() <= range)
      : [...news];

    renderNews(filteredNews);
  };

  // Render news cards
  const renderNews = (newsList) => {
    if (newsList.length === 0) {
      newsContainer.innerHTML = `
        <div class="news-card">
          <div class="news-card-content">
            <h3>No news found</h3>
            <p>No articles found for the selected time range.</p>
          </div>
        </div>`;
      return;
    }

    newsContainer.innerHTML = "";
    const newsGrid = document.createElement("div");
    newsGrid.className = "news-grid";

    newsList.forEach((article, index) => {
      const card = document.createElement("div");
      card.className = "news-card";
      card.style.animationDelay = `${index * 100}ms`;

      card.innerHTML = `
        ${
          article.image
            ? `
          <div class="news-image-container">
            <img src="${article.image}" alt="${article.title}" 
                 class="news-image" 
                 onerror="this.parentElement.style.display='none'">
          </div>`
            : ""
        }
        <div class="news-card-content">
          <h3>${article.title}</h3>
          <div class="meta-info">
            <div class="meta-item">
              <svg class="meta-icon" viewBox="0 0 24 24">
                <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
              </svg>
              ${article.source}
            </div>
            <div class="meta-item">
              <svg class="meta-icon" viewBox="0 0 24 24">
                <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
              </svg>
              ${article.publishedAt.toLocaleDateString()}
            </div>
          </div>
          <p>${article.description || "No description available."}</p>
          <a href="${article.url}" target="_blank" class="search-link">
            Read Full Article
            <svg class="external-icon" viewBox="0 0 24 24">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8c0-1.1.9-2 2-2h6M15 3h6v6M10 14L21 3"/>
            </svg>
          </a>
        </div>
      `;

      newsGrid.appendChild(card);
    });

    newsContainer.appendChild(newsGrid);
  };

  // Search functionality with highlighting
  searchInput.addEventListener("input", () => {
    const term = searchInput.value.trim();
    const lower = term.toLowerCase();

    if (!lower) {
      trendingSection.querySelector(".sidebar-content").innerHTML = `
        <div class="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" opacity="0.3">
            <path d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <rect x="9" y="3" width="6" height="4" rx="1" stroke="currentColor" stroke-width="2"/>
            <path d="M9 12H15M9 16H13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <p>Click "Analyze Trending Topics" to discover insights</p>
        </div>`;
      return;
    }

    // Escape special characters for RegExp
    const esc = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${esc})`, "gi");

    const matches = filteredNews.filter((a) =>
      a.title.toLowerCase().includes(lower)
    );

    let html = `<h3>Search Results</h3>`;
    if (lower.startsWith("cybersecurity")) {
      html += `<p class="search-info">Showing all cybersecurity articles. Try more specific keywords to narrow your search.</p>`;
    }
    html += `<p class="results-count">${matches.length} article${
      matches.length !== 1 ? "s" : ""
    } found</p>`;

    if (matches.length) {
      html += `<ul class="search-results">`;
      matches.forEach((a) => {
        // Highlight search terms
        const highlighted = a.title.replace(regex, "<mark>$1</mark>");
        html += `
          <li>
            <a href="${a.url}" target="_blank">
              ${highlighted}
            </a>
          </li>`;
      });
      html += `</ul>`;
    } else {
      html += `<p class="no-results">No articles match your search.</p>`;
    }

    trendingSection.querySelector(".sidebar-content").innerHTML = html;
  });

  // Analyze trends (bigrams)
  document.getElementById("compare-button").addEventListener("click", () => {
    const button = document.getElementById("compare-button");
    button.disabled = true;
    button.innerHTML = `
      <div class="loader">
        <span></span>
        <span></span>
        <span></span>
      </div>
      <span>Analyzing...</span>
    `;

    // Simulate processing time for better UX
    setTimeout(() => {
      const headlines = filteredNews.map((a) => a.title);
      const bigramCounts = {};

      headlines.forEach((title, idx) => {
        const words = title
          .toLowerCase()
          .split(/\s+/)
          .map((w) => w.replace(/[^a-z0-9]/gi, ""))
          .filter((w) => w && !stopWords.has(w));

        for (let i = 0; i < words.length - 1; i++) {
          const bigram = `${words[i]} ${words[i + 1]}`;
          if (!bigramCounts[bigram]) {
            bigramCounts[bigram] = { count: 1, indexes: [idx] };
          } else {
            bigramCounts[bigram].count++;
            bigramCounts[bigram].indexes.push(idx);
          }
        }
      });

      const topBigrams = Object.entries(bigramCounts)
        .filter(([_, d]) => d.count > 1)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 10);

      let trendingHTML = "";
      if (!topBigrams.length) {
        trendingHTML = `
          <div class="empty-state">
            <p>No trending topics found in current articles.</p>
          </div>`;
      } else {
        trendingHTML = `
          <h3>Top Trending Topics</h3>
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
                    .slice(0, 5)
                    .map(
                      (i) => `
                    <button class="show-article" data-index="${i}">
                      Article ${i + 1}
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
      }

      trendingSection.querySelector(".sidebar-content").innerHTML =
        trendingHTML;

      // Re-enable button
      button.disabled = false;
      button.innerHTML = `
        <svg class="button-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M3 3V21H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M7 16L12 11L15 14L21 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span>Analyze Trending Topics</span>
        <div class="button-glow"></div>
      `;

      // Add click handlers for article buttons
      document.querySelectorAll(".show-article").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const i = +e.currentTarget.dataset.index;
          const cards = document.querySelectorAll(".news-card");
          if (cards[i]) {
            cards[i].scrollIntoView({ behavior: "smooth", block: "center" });
            cards[i].style.animation = "highlight 2s ease-out";
            setTimeout(() => {
              cards[i].style.animation = "";
            }, 2000);
          }
        });
      });
    }, 1000);
  });

  // Sorting
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

  // Event listeners
  timeFilter.addEventListener("change", (e) => applyFilters(e.target.value));
  sortDropdown.addEventListener("change", (e) => sortNews(e.target.value));

  // Add highlight animation
  const style = document.createElement("style");
  style.textContent = `
    @keyframes highlight {
      0% { 
        box-shadow: 0 0 0 0 rgba(128, 0, 0, 0.6);
        transform: scale(1);
      }
      50% { 
        box-shadow: 0 0 20px 10px rgba(128, 0, 0, 0.3);
        transform: scale(1.02);
      }
      100% { 
        box-shadow: 0 0 0 0 rgba(128, 0, 0, 0);
        transform: scale(1);
      }
    }
    
    .search-info {
      font-style: italic;
      color: #666;
      margin-bottom: 1rem;
    }
    
    .results-count {
      font-weight: 600;
      color: var(--primary);
      margin-bottom: 1rem;
    }
    
    .no-results {
      text-align: center;
      color: #999;
      padding: 2rem;
    }
  `;
  document.head.appendChild(style);

  // Start loading news
  fetchNews();
});
