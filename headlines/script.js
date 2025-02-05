document.addEventListener("DOMContentLoaded", () => {
  const fileInput = document.getElementById("fileInput");
  const analyzeButton = document.getElementById("analyzeButton");
  const resultsSection = document.getElementById("resultsSection");
  const trendingList = document.getElementById("trendingList");
  const matchingArticles = document.getElementById("matchingArticles");

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
    "cybersecurity",
    "2024",
  ]);

  let headlines = [];

  // Enable analyze button once file is selected
  fileInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (file) {
      analyzeButton.disabled = false;
    }
  });

  // Analyze headlines
  analyzeButton.addEventListener("click", () => {
    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      const content = e.target.result;
      headlines = content.split("\n").filter((line) => line.trim() !== "");
      const trendingData = analyzeHeadlines(headlines);
      displayResults(trendingData);
    };

    reader.readAsText(file);
  });

  // Analyze headlines for trending topics
  function analyzeHeadlines(headlines) {
    const wordFrequency = {};
    const topWords = {};

    // Count word occurrences, excluding stop words
    headlines.forEach((headline) => {
      const words = headline.split(" ");
      words.forEach((word) => {
        const cleanWord = word.toLowerCase().replace(/[^a-zA-Z0-9]/g, ""); // Remove punctuation
        if (cleanWord && !stopWords.has(cleanWord)) {
          wordFrequency[cleanWord] = (wordFrequency[cleanWord] || 0) + 1;
        }
      });
    });

    // Find top word(s)
    const sortedWords = Object.entries(wordFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    sortedWords.forEach(([word, count]) => {
      topWords[word] = count;
    });

    return { topWords, headlines };
  }

  // Display results
  function displayResults({ topWords, headlines }) {
    resultsSection.classList.remove("hidden");

    // Clear previous results
    trendingList.innerHTML = "";
    matchingArticles.innerHTML = "";

    // Display top topics with animations
    Object.entries(topWords).forEach(([word, count], index) => {
      const li = document.createElement("li");
      li.innerHTML = `
            <span class="trending-word">${word}</span>
            <span class="trending-count">${count} mentions</span>
        `;
      li.style.animationDelay = `${index * 100}ms`;
      trendingList.appendChild(li);
    });

    // Find and display matching articles
    const topTopic = Object.keys(topWords)[0];
    const matchingHeadlines = headlines.filter((headline) =>
      headline.toLowerCase().includes(topTopic)
    );

    matchingHeadlines.forEach((headline, index) => {
      const li = document.createElement("li");
      li.textContent = headline;
      li.style.animationDelay = `${index * 50}ms`;
      matchingArticles.appendChild(li);
    });
  }
});
