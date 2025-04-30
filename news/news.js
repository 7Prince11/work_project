document.addEventListener("DOMContentLoaded", () => {
  const newsContainer = document.getElementById("news-container");
  const timeFilter = document.getElementById("time-filter");
  const sortDropdown = document.getElementById("sort-dropdown");
  const trendingSection = document.getElementById("trending-topics");

  // — Inject search input into control panel —
  const controlPanel = document.querySelector(".control-panel");
  const searchGroup = document.createElement("div");
  searchGroup.className = "filter-group";
  searchGroup.innerHTML = `
    <label for="search-input" class="control-label">Search:</label>
    <input type="text" id="search-input" class="control-dropdown" placeholder="Type to search titles...">
  `;
  controlPanel.appendChild(searchGroup);
  const searchInput = document.getElementById("search-input");

  let news = []; // Все загруженные статьи
  let filteredNews = []; // Отфильтрованные по времени

  // Стоп–слова для биграмм
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

  // Загрузка новостей
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
        newsContainer.innerHTML = "<p>Failed to load news.</p>";
      });
  };

  // Применить фильтр по времени
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

  // Отрисовка карточек новостей
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
            <img src="${article.image}" alt="${article.title}"
                 class="news-image" onerror="this.style.display='none'">
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
        <a href="${article.url}" target="_blank" class="search-link">
          Read Full Article
          <svg class="external-icon" viewBox="0 0 24 24" width="14" height="14">
            <path d="M18 13v6c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V8c0-1.1.9-2 2-2h6l2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-5l-2-2z"/>
            <path d="M17.7.3c-.4-.4-1-.4-1.4 0l-3.2 3.2L15 5.6 18.4 9l2.1-2.1c.4-.4.4-1 0-1.4L17.7.3z"/>
          </svg>
        </a>
      `;
      // Анимация появления
      setTimeout(() => {
        card.style.opacity = "1";
        card.style.transform = "translateY(0)";
        card.style.animation = "cardEntrance 0.6s ease-out";
      }, index * 150);

      newsContainer.appendChild(card);
    });
  };

  // Поиск по заголовкам с подсветкой и улучшенным стилем ссылок
  searchInput.addEventListener("input", () => {
    const term = searchInput.value.trim();
    const lower = term.toLowerCase();
    if (!lower) {
      trendingSection.innerHTML = "";
      return;
    }

    // Экранируем специальные символы для RegExp
    const esc = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${esc})`, "gi");

    const matches = filteredNews.filter((a) =>
      a.title.toLowerCase().includes(lower)
    );

    let html = `<h3>Search Results for “${term}”</h3>`;
    if (lower.startsWith("cybersecurity")) {
      html += `<p>Showing all cybersecurity articles. Try more specific keywords to narrow your search.</p>`;
    }
    html += `<p>${matches.length} article${
      matches.length !== 1 ? "s" : ""
    } found.</p>`;

    if (matches.length) {
      html += `<ul class="search-results">`;
      matches.forEach((a) => {
        // Подсветка вхождений
        const highlighted = a.title.replace(regex, "<mark>$1</mark>");
        html += `
          <li>
            <a
              href="${a.url}"
              target="_blank"
              class="search-link"
              style="color: var(--accent); text-decoration: none; font-weight: 600;"
            >
              ${highlighted}
            </a>
          </li>`;
      });
      html += `</ul>`;
    } else {
      html += `<p>No articles match your search.</p>`;
    }

    trendingSection.innerHTML = html;
  });

  // Анализ трендов (биграммы и кнопка Analyze по-прежнему работают)
  document.getElementById("compare-button").addEventListener("click", () => {
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
      .sort((a, b) => b[1].count - a[1].count);

    let trendingHTML = "";
    if (!topBigrams.length) {
      trendingHTML = "<p>No common topics found.</p>";
    } else {
      trendingHTML = `
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

    trendingSection.innerHTML = trendingHTML;

    document.querySelectorAll(".show-article").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const i = +e.currentTarget.dataset.index;
        const card = document.querySelectorAll(".news-card")[i];
        if (card) {
          card.scrollIntoView({ behavior: "smooth", block: "center" });
          card.animate(
            [
              { backgroundColor: "rgba(255,236,179,0.5)" },
              { backgroundColor: "white" },
            ],
            { duration: 3500, easing: "ease-out" }
          );
        }
      });
    });
  });

  // Сортировка
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

  // Стартуем!
  fetchNews();
});
