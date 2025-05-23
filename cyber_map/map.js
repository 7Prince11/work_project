// Global Cyber Threat Map JavaScript
(function () {
  "use strict";

  // Map configuration
  const MAP_CENTER = [20, 0];
  const MAP_ZOOM = 1.5;
  const MAX_ATTACKS = 100;
  const ATTACK_DURATION = 3000; // milliseconds

  // Initialize map
  const map = L.map("threat-map", {
    center: MAP_CENTER,
    zoom: MAP_ZOOM,
    minZoom: 2,
    maxZoom: 15,
    worldCopyJump: true,
    preferCanvas: true,
  });

  // Custom dark map style
  L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
    attribution: "© OpenStreetMap contributors © CARTO",
    subdomains: "abcd",
    maxZoom: 19,
  }).addTo(map);

  // Country coordinates (major cities for more realistic attack patterns)
  const locations = {
    "United States": {
      lat: 38.8951,
      lng: -77.0364,
      name: "United States",
      code: "US",
    },
    China: { lat: 39.9042, lng: 116.4074, name: "China", code: "CN" },
    Russia: { lat: 55.7558, lng: 37.6173, name: "Russia", code: "RU" },
    "United Kingdom": {
      lat: 51.5074,
      lng: -0.1278,
      name: "United Kingdom",
      code: "GB",
    },
    Germany: { lat: 52.52, lng: 13.405, name: "Germany", code: "DE" },
    Japan: { lat: 35.6762, lng: 139.6503, name: "Japan", code: "JP" },
    India: { lat: 28.6139, lng: 77.209, name: "India", code: "IN" },
    Brazil: { lat: -15.8267, lng: -47.9218, name: "Brazil", code: "BR" },
    Canada: { lat: 45.4215, lng: -75.6972, name: "Canada", code: "CA" },
    Australia: { lat: -35.2809, lng: 149.13, name: "Australia", code: "AU" },
    France: { lat: 48.8566, lng: 2.3522, name: "France", code: "FR" },
    "South Korea": {
      lat: 37.5665,
      lng: 126.978,
      name: "South Korea",
      code: "KR",
    },
    Netherlands: { lat: 52.3676, lng: 4.9041, name: "Netherlands", code: "NL" },
    Singapore: { lat: 1.3521, lng: 103.8198, name: "Singapore", code: "SG" },
    Sweden: { lat: 59.3293, lng: 18.0686, name: "Sweden", code: "SE" },
  };

  // Attack types configuration
  const attackTypes = {
    malware: { color: "#8b5cf6", name: "Malware", weight: 30 },
    ddos: { color: "#3b82f6", name: "DDoS", weight: 25 },
    phishing: { color: "#f59e0b", name: "Phishing", weight: 25 },
    ransomware: { color: "#ef4444", name: "Ransomware", weight: 20 },
  };

  // State management
  const state = {
    attacks: [],
    stats: {
      total: 0,
      countries: new Set(),
      critical: 0,
      types: {
        malware: 0,
        ddos: 0,
        phishing: 0,
        ransomware: 0,
      },
    },
    countryStats: {},
  };

  // Create curved path between two points
  function createCurvedPath(start, end) {
    const midLat = (start.lat + end.lat) / 2;
    const midLng = (start.lng + end.lng) / 2;

    // Calculate curve offset based on distance
    const distance = Math.sqrt(
      Math.pow(end.lat - start.lat, 2) + Math.pow(end.lng - start.lng, 2)
    );
    const offset = Math.min(distance * 0.3, 15);

    // Create control point for quadratic bezier curve
    const controlLat = midLat + offset;
    const controlLng = midLng;

    // Generate curve points
    const points = [];
    for (let t = 0; t <= 1; t += 0.05) {
      const lat =
        Math.pow(1 - t, 2) * start.lat +
        2 * (1 - t) * t * controlLat +
        Math.pow(t, 2) * end.lat;
      const lng =
        Math.pow(1 - t, 2) * start.lng +
        2 * (1 - t) * t * controlLng +
        Math.pow(t, 2) * end.lng;
      points.push([lat, lng]);
    }

    return points;
  }

  // Generate random attack
  function generateAttack() {
    const locationKeys = Object.keys(locations);
    const sourceKey =
      locationKeys[Math.floor(Math.random() * locationKeys.length)];
    let targetKey =
      locationKeys[Math.floor(Math.random() * locationKeys.length)];

    // Ensure source and target are different
    while (targetKey === sourceKey) {
      targetKey = locationKeys[Math.floor(Math.random() * locationKeys.length)];
    }

    const source = locations[sourceKey];
    const target = locations[targetKey];

    // Select attack type based on weights
    const typeKey = weightedRandom(attackTypes);
    const type = attackTypes[typeKey];

    // Determine severity
    const severity =
      Math.random() < 0.1
        ? "critical"
        : Math.random() < 0.3
        ? "high"
        : Math.random() < 0.6
        ? "medium"
        : "low";

    return {
      id: Date.now() + Math.random(),
      source,
      target,
      type: typeKey,
      typeInfo: type,
      severity,
      timestamp: new Date(),
    };
  }

  // Weighted random selection
  function weightedRandom(options) {
    const weights = Object.entries(options).map(([key, val]) => val.weight);
    const total = weights.reduce((sum, w) => sum + w, 0);
    let random = Math.random() * total;

    let i = 0;
    for (const [key, val] of Object.entries(options)) {
      random -= val.weight;
      if (random <= 0) return key;
      i++;
    }

    return Object.keys(options)[0];
  }

  // Animate attack on map
  function animateAttack(attack) {
    const path = createCurvedPath(attack.source, attack.target);

    // Create path line
    const pathLine = L.polyline(path, {
      color: attack.typeInfo.color,
      weight: 2,
      opacity: 0.8,
      className: "attack-path",
    }).addTo(map);

    // Create moving marker
    const marker = L.circleMarker([attack.source.lat, attack.source.lng], {
      radius: 4,
      color: attack.typeInfo.color,
      fillColor: attack.typeInfo.color,
      fillOpacity: 1,
      className: "attack-marker",
    }).addTo(map);

    // Animate marker along path
    let currentIndex = 0;
    const animationInterval = setInterval(() => {
      if (currentIndex >= path.length) {
        // Attack reached target
        createImpactEffect(attack.target, attack.severity);
        clearInterval(animationInterval);

        // Clean up
        setTimeout(() => {
          map.removeLayer(pathLine);
          map.removeLayer(marker);
        }, 1000);

        return;
      }

      marker.setLatLng(path[currentIndex]);
      currentIndex++;
    }, ATTACK_DURATION / path.length);

    // Store attack info
    attack.pathLine = pathLine;
    attack.marker = marker;
    state.attacks.push(attack);

    // Clean up old attacks
    if (state.attacks.length > MAX_ATTACKS) {
      const oldAttack = state.attacks.shift();
      if (oldAttack.pathLine) map.removeLayer(oldAttack.pathLine);
      if (oldAttack.marker) map.removeLayer(oldAttack.marker);
    }
  }

  // Create impact effect at target
  function createImpactEffect(location, severity) {
    const colors = {
      low: "#22c55e",
      medium: "#f59e0b",
      high: "#ef4444",
      critical: "#dc2626",
    };

    const radius =
      severity === "critical"
        ? 20
        : severity === "high"
        ? 15
        : severity === "medium"
        ? 12
        : 10;

    const impact = L.circleMarker([location.lat, location.lng], {
      radius: radius,
      color: colors[severity],
      fillColor: colors[severity],
      fillOpacity: 0.6,
      weight: 2,
    }).addTo(map);

    // Pulse animation
    let animRadius = radius;
    const pulseInterval = setInterval(() => {
      animRadius += 2;
      impact.setRadius(animRadius);
      impact.setStyle({
        fillOpacity: Math.max(0, 0.6 - (animRadius - radius) * 0.03),
      });

      if (animRadius > radius + 20) {
        clearInterval(pulseInterval);
        map.removeLayer(impact);
      }
    }, 50);
  }

  // Update statistics
  function updateStats(attack) {
    state.stats.total++;
    state.stats.countries.add(attack.source.code);
    state.stats.countries.add(attack.target.code);
    state.stats.types[attack.type]++;

    if (attack.severity === "critical") {
      state.stats.critical++;
    }

    // Update country stats
    if (!state.countryStats[attack.target.code]) {
      state.countryStats[attack.target.code] = {
        name: attack.target.name,
        count: 0,
      };
    }
    state.countryStats[attack.target.code].count++;

    // Update UI
    document.getElementById("total-attacks").textContent = state.stats.total;
    document.getElementById("countries-affected").textContent =
      state.stats.countries.size;
    document.getElementById("critical-threats").textContent =
      state.stats.critical;

    updateAttackTypes();
    updateTopCountries();
  }

  // Update attack type distribution
  function updateAttackTypes() {
    const total = Object.values(state.stats.types).reduce(
      (sum, count) => sum + count,
      0
    );

    Object.entries(state.stats.types).forEach(([type, count]) => {
      const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
      const bar = document.querySelector(`.type-fill.${type}`);
      const percent =
        bar.parentElement.parentElement.querySelector(".type-percent");

      bar.style.width = `${percentage}%`;
      percent.textContent = `${percentage}%`;
    });
  }

  // Update top targeted countries
  function updateTopCountries() {
    const sorted = Object.entries(state.countryStats)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5);

    const container = document.getElementById("top-countries");
    container.innerHTML = sorted
      .map(([code, data], index) => {
        const percentage = ((data.count / state.stats.total) * 100).toFixed(1);
        return `
                <div class="country-item">
                    <div class="country-flag" style="background: linear-gradient(45deg, #666, #888)"></div>
                    <div class="country-info">
                        <div class="country-name">${data.name}</div>
                        <div class="country-attacks">${data.count} attacks</div>
                    </div>
                    <div class="country-bar">
                        <div class="country-bar-fill" style="width: ${percentage}%"></div>
                    </div>
                </div>
            `;
      })
      .join("");
  }

  // Add attack to live feed
  function addToFeed(attack) {
    const feed = document.getElementById("live-feed");

    // Remove placeholder if exists
    const placeholder = feed.querySelector(".feed-placeholder");
    if (placeholder) placeholder.remove();

    const feedItem = document.createElement("div");
    feedItem.className = "feed-item";
    feedItem.innerHTML = `
            <div class="feed-header">
                <span class="feed-type ${attack.type}">${
      attack.typeInfo.name
    }</span>
                <span class="feed-time">${attack.timestamp.toLocaleTimeString()}</span>
            </div>
            <div class="feed-route">
                ${attack.source.name} <span class="feed-arrow">→</span> ${
      attack.target.name
    }
            </div>
        `;

    feed.insertBefore(feedItem, feed.firstChild);

    // Keep only last 10 items
    while (feed.children.length > 10) {
      feed.removeChild(feed.lastChild);
    }
  }

  // Start simulation
  function startSimulation() {
    // Generate initial attacks
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        const attack = generateAttack();
        animateAttack(attack);
        updateStats(attack);
        addToFeed(attack);
      }, i * 500);
    }

    // Continue generating attacks
    setInterval(() => {
      const attack = generateAttack();
      animateAttack(attack);
      updateStats(attack);
      addToFeed(attack);
    }, 2000 + Math.random() * 3000);
  }

  // Initialize
  startSimulation();

  // Handle window resize
  window.addEventListener("resize", () => {
    map.invalidateSize();
  });
})();
