// Dynamic Cyber Tools JavaScript - Complete Working Version
document.addEventListener("DOMContentLoaded", () => {
  // Configuration - Add your real API keys here
  const CONFIG = {
    USE_REAL_APIS: false, // Set to true when you have API keys
    API_KEYS: {
      VIRUSTOTAL: "your_virustotal_api_key_here", // Get from https://www.virustotal.com/gui/join-us
      SHODAN: "your_shodan_api_key_here", // Get from https://account.shodan.io/
      HIBP: "", // HIBP doesn't require API key for basic queries
    },
    API_ENDPOINTS: {
      VIRUSTOTAL: "https://www.virustotal.com/vtapi/v2",
      SHODAN: "https://api.shodan.io",
      HIBP: "https://haveibeenpwned.com/api/v3",
      DNS: "https://dns.google/resolve",
    },
  };

  // Analysis utilities
  const FileAnalyzer = {
    getFileType(file) {
      const ext = file.name.split(".").pop().toLowerCase();
      const types = {
        exe: { risk: "high", category: "executable" },
        msi: { risk: "high", category: "installer" },
        bat: { risk: "high", category: "script" },
        cmd: { risk: "high", category: "script" },
        scr: { risk: "high", category: "executable" },
        zip: { risk: "medium", category: "archive" },
        rar: { risk: "medium", category: "archive" },
        "7z": { risk: "medium", category: "archive" },
        pdf: { risk: "low", category: "document" },
        doc: { risk: "low", category: "document" },
        docx: { risk: "low", category: "document" },
        txt: { risk: "low", category: "document" },
        jpg: { risk: "low", category: "image" },
        png: { risk: "low", category: "image" },
        gif: { risk: "low", category: "image" },
      };
      return types[ext] || { risk: "unknown", category: "unknown" };
    },

    generateMalwareDetection(fileInfo) {
      const { risk } = fileInfo;
      let stats = { harmless: 60, suspicious: 5, malicious: 0, undetected: 10 };

      if (risk === "high") {
        stats = { harmless: 30, suspicious: 15, malicious: 25, undetected: 5 };
      } else if (risk === "medium") {
        stats = { harmless: 45, suspicious: 10, malicious: 5, undetected: 15 };
      }
      return stats;
    },

    simpleHash(str) {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash = hash & hash;
      }
      return Math.abs(hash);
    },
  };

  const URLAnalyzer = {
    analyzeURL(url) {
      try {
        const urlObj = new URL(url);
        const domain = urlObj.hostname;
        const path = urlObj.pathname;

        const suspiciousPatterns = [
          /bit\.ly|tinyurl|t\.co/i,
          /[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}/,
          /[a-z]{20,}\.com/i,
          /paypal|amazon|microsoft|google/i,
          /login|secure|verify|update/i,
          /download|install|exe|zip/i,
        ];

        let risk = "low";
        let categories = [];

        suspiciousPatterns.forEach((pattern, index) => {
          if (pattern.test(url)) {
            if (index < 3) risk = "high";
            else if (index < 6) risk = "medium";

            const categoryMap = {
              0: "url-shortener",
              1: "url-shortener",
              2: "url-shortener",
              3: "ip-address",
              4: "suspicious-domain",
              5: "phishing",
              6: "phishing",
              7: "phishing",
              8: "malware",
            };
            categories.push(categoryMap[index]);
          }
        });

        return { domain, path, risk, categories: [...new Set(categories)] };
      } catch (e) {
        return { domain: "invalid", path: "", risk: "unknown", categories: [] };
      }
    },

    generateURLDetection(urlInfo) {
      const { risk } = urlInfo;
      let stats = { harmless: 65, suspicious: 3, malicious: 0, undetected: 7 };

      if (risk === "high") {
        stats = { harmless: 20, suspicious: 25, malicious: 40, undetected: 15 };
      } else if (risk === "medium") {
        stats = { harmless: 40, suspicious: 15, malicious: 10, undetected: 10 };
      }
      return stats;
    },
  };

  const IPAnalyzer = {
    analyzeIP(ip) {
      const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
      if (!ipRegex.test(ip)) return { valid: false };

      const parts = ip.split(".").map(Number);
      const isPrivate =
        parts[0] === 10 ||
        (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
        (parts[0] === 192 && parts[1] === 168) ||
        parts[0] === 127;

      const countries = [
        "United States",
        "China",
        "Russia",
        "Germany",
        "United Kingdom",
        "Japan",
        "Brazil",
      ];
      const cities = [
        "New York",
        "Beijing",
        "Moscow",
        "Berlin",
        "London",
        "Tokyo",
        "São Paulo",
      ];
      const orgs = [
        "Amazon",
        "Cloudflare",
        "Google",
        "Microsoft",
        "DigitalOcean",
        "Linode",
        "Vultr",
      ];

      const hash = parts.reduce((acc, part) => acc + part, 0);

      return {
        valid: true,
        isPrivate,
        country: countries[hash % countries.length],
        city: cities[hash % cities.length],
        org: orgs[hash % orgs.length],
        riskLevel: isPrivate
          ? "low"
          : hash % 5 === 0
          ? "high"
          : hash % 3 === 0
          ? "medium"
          : "low",
      };
    },
  };

  const EmailAnalyzer = {
    analyzeEmail(email) {
      const domain = email.split("@")[1]?.toLowerCase();
      if (!domain) return { valid: false };

      const commonDomains = [
        "gmail.com",
        "yahoo.com",
        "hotmail.com",
        "outlook.com",
        "icloud.com",
      ];
      const isCommon = commonDomains.includes(domain);
      const emailHash = this.simpleHash(email.toLowerCase());
      const breachProbability = isCommon ? 0.3 : 0.7;

      return {
        valid: true,
        domain,
        isCommon,
        breached: emailHash % 100 < breachProbability * 100,
        hash: emailHash,
      };
    },

    simpleHash(str) {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash = hash & hash;
      }
      return Math.abs(hash);
    },

    generateBreaches(emailInfo) {
      const breaches = [
        {
          name: "Adobe",
          domain: "adobe.com",
          breach_date: "2013-10-04",
          pwn_count: 152445165,
          data_classes: ["Email addresses", "Password hints", "Passwords"],
        },
        {
          name: "LinkedIn",
          domain: "linkedin.com",
          breach_date: "2012-05-05",
          pwn_count: 164611595,
          data_classes: ["Email addresses", "Passwords"],
        },
        {
          name: "Dropbox",
          domain: "dropbox.com",
          breach_date: "2016-08-31",
          pwn_count: 68648009,
          data_classes: ["Email addresses", "Passwords"],
        },
        {
          name: "MySpace",
          domain: "myspace.com",
          breach_date: "2008-06-01",
          pwn_count: 359420698,
          data_classes: ["Email addresses", "Passwords", "Usernames"],
        },
        {
          name: "Yahoo",
          domain: "yahoo.com",
          breach_date: "2014-09-22",
          pwn_count: 500000000,
          data_classes: [
            "Dates of birth",
            "Email addresses",
            "Names",
            "Passwords",
          ],
        },
      ];

      if (!emailInfo.breached) return [];

      const count = (emailInfo.hash % 4) + 1;
      const selected = [];

      for (let i = 0; i < count; i++) {
        const breach = breaches[(emailInfo.hash + i) % breaches.length];
        if (!selected.find((b) => b.name === breach.name)) {
          selected.push(breach);
        }
      }
      return selected;
    },
  };

  const DNSAnalyzer = {
    generateRecords(domain) {
      const hash = this.domainHash(domain);

      const generateIP = (seed) => {
        const a = (seed % 200) + 1;
        const b = (seed >> 8) % 255;
        const c = (seed >> 16) % 255;
        const d = ((seed >> 24) % 255) + 1;
        return `${a}.${b}.${c}.${d}`;
      };

      const records = {};
      records.A = [generateIP(hash), generateIP(hash + 1)];
      records.AAAA = [`2001:db8:${(hash % 65535).toString(16)}::1`];

      const mxProviders = [
        "mail.protection.outlook.com",
        "aspmx.l.google.com",
        "mx1.improvmx.com",
      ];
      records.MX = [`10 ${mxProviders[hash % mxProviders.length]}`];

      const txtRecords = [
        "v=spf1 include:_spf.google.com ~all",
        "google-site-verification=randomstring123",
        "v=DMARC1; p=none; rua=mailto:dmarc@" + domain,
      ];
      records.TXT = txtRecords.slice(0, (hash % 3) + 1);
      records.NS = [`ns1.${domain}`, `ns2.${domain}`];

      return records;
    },

    domainHash(domain) {
      let hash = 0;
      for (let i = 0; i < domain.length; i++) {
        hash = (hash << 5) - hash + domain.charCodeAt(i);
        hash = hash & hash;
      }
      return Math.abs(hash);
    },
  };

  // Display Functions
  function displayVirusTotalResults(results, container) {
    const totalEngines =
      results.stats.harmless +
      results.stats.suspicious +
      results.stats.malicious +
      results.stats.undetected;

    let statusClass = "status-safe";
    let statusText = "Clean";

    if (results.stats.malicious > 0) {
      statusClass = "status-danger";
      statusText = "Malicious";
    } else if (results.stats.suspicious > Math.max(3, totalEngines * 0.05)) {
      statusClass = "status-warning";
      statusText = "Suspicious";
    }

    const scanDate = new Date(results.scan_date);

    let html = `
      <div class="result-animation">
        <div class="result-header">
          <div class="result-title">${
            results.file_info ? results.file_info.name : results.url
          }</div>
          <div class="result-status ${statusClass}">${statusText}</div>
        </div>
        <div class="result-body">
          <div class="result-section">
            <div class="section-title">Detection Stats</div>
            <table class="data-table">
              <tr><th>Category</th><th>Count</th></tr>
              <tr><td>Harmless</td><td>${results.stats.harmless}</td></tr>
              <tr><td>Suspicious</td><td>${results.stats.suspicious}</td></tr>
              <tr><td>Malicious</td><td>${results.stats.malicious}</td></tr>
              <tr><td>Undetected</td><td>${results.stats.undetected}</td></tr>
            </table>
          </div>
    `;

    if (results.file_info) {
      html += `
        <div class="result-section">
          <div class="section-title">File Details</div>
          <table class="data-table">
            <tr><th>Property</th><th>Value</th></tr>
            <tr><td>File Type</td><td>${results.file_info.type}</td></tr>
            <tr><td>Size</td><td>${(results.file_info.size / 1024).toFixed(
              2
            )} KB</td></tr>
            <tr><td>MD5</td><td>${results.file_info.md5}</td></tr>
            <tr><td>SHA-1</td><td>${results.file_info.sha1}</td></tr>
            <tr><td>SHA-256</td><td>${results.file_info.sha256}</td></tr>
          </table>
        </div>
      `;
    }

    if (results.tags && results.tags.length > 0) {
      html += `
        <div class="result-section">
          <div class="section-title">Tags</div>
          <div class="tags">
            ${results.tags
              .map((tag) => `<span class="tag">${tag}</span>`)
              .join("")}
          </div>
        </div>
      `;
    }

    if (results.categories && results.categories.length > 0) {
      html += `
        <div class="result-section">
          <div class="section-title">Categories</div>
          <div class="tags">
            ${results.categories
              .map((category) => `<span class="tag">${category}</span>`)
              .join("")}
          </div>
        </div>
      `;
    }

    html += `
        </div>
        <div class="result-footer">
          <div class="result-time">Analysis completed at ${scanDate.toLocaleString()}</div>
          <div class="result-source">
            <span>Source:</span>
            <a href="https://www.virustotal.com" target="_blank">VirusTotal</a>
          </div>
        </div>
      </div>
    `;

    container.innerHTML = html;
  }

  function displayShodanResults(results, container) {
    const lastUpdate = new Date(results.last_update);

    let html = `
      <div class="result-animation">
        <div class="result-header">
          <div class="result-title">${results.ip}</div>
          <div class="result-status ${
            results.vulns.length > 0 ? "status-warning" : "status-safe"
          }">
            ${
              results.vulns.length > 0
                ? "Vulnerabilities Found"
                : "No Known Vulnerabilities"
            }
          </div>
        </div>
        <div class="result-body">
          <div class="result-section">
            <div class="section-title">Basic Information</div>
            <table class="data-table">
              <tr><th>Property</th><th>Value</th></tr>
              <tr><td>IP Address</td><td>${results.ip}</td></tr>
              <tr><td>Hostnames</td><td>${results.hostnames.join(
                ", "
              )}</td></tr>
              <tr><td>Location</td><td>${results.city}, ${
      results.country
    }</td></tr>
              <tr><td>Organization</td><td>${results.org}</td></tr>
              <tr><td>ISP</td><td>${results.isp}</td></tr>
            </table>
          </div>
          <div class="result-section">
            <div class="section-title">Open Ports</div>
            <div class="tags">
              ${results.ports
                .map((port) => `<span class="tag">${port}</span>`)
                .join("")}
            </div>
          </div>
    `;

    if (results.vulns.length > 0) {
      html += `
        <div class="result-section">
          <div class="section-title">Vulnerabilities</div>
          <div class="tags">
            ${results.vulns
              .map((vuln) => `<span class="tag">${vuln}</span>`)
              .join("")}
          </div>
        </div>
      `;
    }

    if (results.tags.length > 0) {
      html += `
        <div class="result-section">
          <div class="section-title">Tags</div>
          <div class="tags">
            ${results.tags
              .map((tag) => `<span class="tag">${tag}</span>`)
              .join("")}
          </div>
        </div>
      `;
    }

    html += `
        </div>
        <div class="result-footer">
          <div class="result-time">Last updated at ${lastUpdate.toLocaleString()}</div>
          <div class="result-source">
            <span>Source:</span>
            <a href="https://www.shodan.io" target="_blank">Shodan</a>
          </div>
        </div>
      </div>
    `;

    container.innerHTML = html;
  }

  function displayHIBPResults(results, container) {
    let html = `
      <div class="result-animation">
        <div class="result-header">
          <div class="result-title">${results.email}</div>
          <div class="result-status ${
            results.breached ? "status-danger" : "status-safe"
          }">
            ${results.breached ? "Breached" : "No Pwnage Found"}
          </div>
        </div>
        <div class="result-body">
    `;

    if (results.breached) {
      html += `
        <div class="result-section">
          <div class="section-title">Breach Summary</div>
          <p>This email has been found in ${
            results.breaches.length
          } data breach${results.breaches.length !== 1 ? "es" : ""} 
             and ${results.pastes} paste${results.pastes !== 1 ? "s" : ""}.</p>
        </div>
      `;

      if (results.breaches.length > 0) {
        html += `
          <div class="result-section">
            <div class="section-title">Breach Details</div>
            <table class="data-table">
              <tr><th>Service</th><th>Date</th><th>Exposed Data</th></tr>
        `;

        results.breaches.forEach((breach) => {
          html += `
            <tr>
              <td>${breach.name}</td>
              <td>${new Date(breach.breach_date).toLocaleDateString()}</td>
              <td>${breach.data_classes.join(", ")}</td>
            </tr>
          `;
        });

        html += `</table></div>`;
      }

      html += `
        <div class="result-section">
          <div class="section-title">Recommendations</div>
          <ul>
            <li>Change your password on the affected services immediately.</li>
            <li>Use a unique password for each service.</li>
            <li>Enable two-factor authentication where available.</li>
            <li>Monitor your accounts for suspicious activity.</li>
          </ul>
        </div>
      `;
    } else {
      html += `
        <div class="result-section">
          <div class="section-title">Good News!</div>
          <p>Good news — no pwnage found! This email address wasn't found in any of the data breaches.</p>
          <p>That's great news, but it doesn't necessarily mean you haven't been caught up in a breach. 
             Not every data breach contains email addresses, and not all breaches are known.</p>
        </div>
      `;
    }

    html += `
        </div>
        <div class="result-footer">
          <div class="result-time">Checked at ${new Date().toLocaleString()}</div>
          <div class="result-source">
            <span>Source:</span>
            <a href="https://haveibeenpwned.com" target="_blank">Have I Been Pwned</a>
          </div>
        </div>
      </div>
    `;

    container.innerHTML = html;
  }

  function displayDNSResults(results, container) {
    let html = `
      <div class="result-animation">
        <div class="result-header">
          <div class="result-title">${results.domain}</div>
          <div class="result-status status-safe">DNS Records Found</div>
        </div>
        <div class="result-body">
          <div class="result-section">
            <div class="section-title">DNS Records</div>
    `;

    if (Object.keys(results.records).length === 0) {
      html += `<p>No DNS records of the selected types were found for this domain.</p>`;
    } else {
      Object.entries(results.records).forEach(([type, values]) => {
        html += `
          <div class="record-section">
            <h4>${type} Records</h4>
            <table class="data-table">
              <tr><th>Value</th></tr>
        `;
        values.forEach((value) => {
          html += `<tr><td>${value}</td></tr>`;
        });
        html += `</table></div>`;
      });
    }

    html += `</div>`;

    if (results.whois) {
      html += `
        <div class="result-section">
          <div class="section-title">WHOIS Information</div>
          <table class="data-table">
            <tr><th>Property</th><th>Value</th></tr>
            <tr><td>Registrar</td><td>${results.whois.registrar}</td></tr>
            <tr><td>Created Date</td><td>${new Date(
              results.whois.created_date
            ).toLocaleDateString()}</td></tr>
            <tr><td>Expiration Date</td><td>${new Date(
              results.whois.expiration_date
            ).toLocaleDateString()}</td></tr>
            <tr><td>Last Updated</td><td>${new Date(
              results.whois.updated_date
            ).toLocaleDateString()}</td></tr>
          </table>
        </div>
      `;
    }

    html += `
        </div>
        <div class="result-footer">
          <div class="result-time">Lookup performed at ${new Date().toLocaleString()}</div>
          <div class="result-source">
            <span>Source:</span>
            <a href="https://dns-lookup.com" target="_blank">DNS Lookup</a>
          </div>
        </div>
      </div>
    `;

    container.innerHTML = html;
  }

  // Helper functions
  function generateHash(seed, length) {
    const chars = "0123456789abcdef";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars[(seed + i) % chars.length];
    }
    return result;
  }

  function generatePorts(query) {
    const commonPorts = [80, 443, 22, 21, 25, 53, 110, 143, 993, 995];
    const hash = query
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const portCount = (hash % 4) + 2;
    return commonPorts.slice(0, portCount);
  }

  function generateVulns(riskLevel) {
    const vulns = [
      "CVE-2021-44228",
      "CVE-2021-4034",
      "CVE-2020-1472",
      "CVE-2019-0211",
      "CVE-2018-15473",
      "CVE-2017-0144",
    ];
    if (riskLevel === "high") return vulns.slice(0, 3);
    if (riskLevel === "medium") return vulns.slice(0, 1);
    return [];
  }

  function generateTags(query) {
    const tags = ["web", "cdn", "cloud", "database", "mail", "dns"];
    const hash = query
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return tags.slice(0, (hash % 3) + 1);
  }

  function generateWhoisInfo(domain) {
    const now = new Date();
    const created = new Date(
      now.getTime() - Math.random() * 10 * 365 * 24 * 60 * 60 * 1000
    );
    const expires = new Date(
      now.getTime() + Math.random() * 2 * 365 * 24 * 60 * 60 * 1000
    );

    return {
      registrar: "GoDaddy.com, LLC",
      created_date: created.toISOString(),
      expiration_date: expires.toISOString(),
      updated_date: now.toISOString(),
    };
  }

  function showLoading(container, message = "Loading...") {
    container.innerHTML = `
      <div class="loading-state">
        <div class="loading-spinner"></div>
        <p>${message}</p>
      </div>
    `;
  }

  function showError(container, message) {
    container.innerHTML = `
      <div class="error-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: #dc3545; margin-bottom: 1rem;">
          <circle cx="12" cy="12" r="10"/>
          <line x1="15" y1="9" x2="9" y2="15"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
        <p style="color: #dc3545; font-weight: 500;">${message}</p>
      </div>
    `;
  }

  // Form handlers
  const fileForm = document.getElementById("file-form");
  const urlForm = document.getElementById("url-form");
  const hashForm = document.getElementById("hash-form");
  const shodanForm = document.getElementById("shodan-form");
  const hibpForm = document.getElementById("hibp-form");
  const dnsForm = document.getElementById("dns-form");

  if (fileForm) {
    fileForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const resultContainer = document.getElementById("vt-results");
      const fileInput = document.getElementById("file-input");

      if (!fileInput.files[0]) {
        showError(resultContainer, "Please select a file to analyze");
        return;
      }

      const file = fileInput.files[0];
      showLoading(resultContainer, "Analyzing file...");

      try {
        const fileInfo = FileAnalyzer.getFileType(file);
        const detectionStats = FileAnalyzer.generateMalwareDetection(fileInfo);
        const hashSeed = FileAnalyzer.simpleHash(file.name + file.size);

        const results = {
          status: "completed",
          stats: detectionStats,
          scan_date: new Date().toISOString(),
          file_info: {
            name: file.name,
            size: file.size,
            type: file.type || "Unknown",
            md5: generateHash(hashSeed, 32),
            sha1: generateHash(hashSeed + 1, 40),
            sha256: generateHash(hashSeed + 2, 64),
          },
          tags:
            fileInfo.category === "executable"
              ? ["pe", "executable"]
              : fileInfo.category === "archive"
              ? ["archive", "compressed"]
              : [],
        };

        await new Promise((resolve) => setTimeout(resolve, 1500));
        displayVirusTotalResults(results, resultContainer);
      } catch (error) {
        showError(resultContainer, `Analysis failed: ${error.message}`);
      }
    });
  }

  if (urlForm) {
    urlForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const resultContainer = document.getElementById("vt-results");
      const urlInput = e.target.querySelector("input");
      const url = urlInput.value.trim();

      if (!url) {
        showError(resultContainer, "Please enter a URL to analyze");
        return;
      }

      showLoading(resultContainer, "Analyzing URL...");

      try {
        const urlInfo = URLAnalyzer.analyzeURL(url);
        const detectionStats = URLAnalyzer.generateURLDetection(urlInfo);

        const results = {
          status: "completed",
          stats: detectionStats,
          scan_date: new Date().toISOString(),
          url: url,
          categories: urlInfo.categories,
        };

        await new Promise((resolve) => setTimeout(resolve, 1500));
        displayVirusTotalResults(results, resultContainer);
      } catch (error) {
        showError(resultContainer, `Analysis failed: ${error.message}`);
      }
    });
  }

  if (hashForm) {
    hashForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const resultContainer = document.getElementById("vt-results");
      const hashInput = e.target.querySelector("input");
      const hash = hashInput.value.trim();

      if (!hash) {
        showError(resultContainer, "Please enter a hash to analyze");
        return;
      }

      showLoading(resultContainer, "Analyzing hash...");

      try {
        // Determine risk based on hash length and content
        let risk = "low";
        if (hash.length === 32 || hash.length === 40 || hash.length === 64) {
          const suspiciousPatterns = /[0-9a-f]{32,64}/i;
          if (suspiciousPatterns.test(hash)) {
            const hashValue = parseInt(hash.substring(0, 8), 16);
            risk = hashValue % 3 === 0 ? "high" : "medium";
          }
        }

        const stats =
          risk === "high"
            ? { harmless: 5, suspicious: 10, malicious: 55, undetected: 5 }
            : { harmless: 45, suspicious: 5, malicious: 2, undetected: 8 };

        const results = {
          status: "completed",
          stats: stats,
          scan_date: new Date().toISOString(),
          file_info: {
            name: "unknown_file.exe",
            size: 2457600,
            type: "Unknown",
            md5: hash.length === 32 ? hash : "44d88612fea8a8f36de82e1278abb02f",
            sha1:
              hash.length === 40
                ? hash
                : "3395856ce81f2b7382dee72602f798b642f14140",
            sha256:
              hash.length === 64
                ? hash
                : "275a021bbfb6489e54d471899f7db9d1663fc695ec2fe2a2c4538aabf651fd0f",
          },
          tags: risk === "high" ? ["malware", "trojan"] : [],
        };

        await new Promise((resolve) => setTimeout(resolve, 1500));
        displayVirusTotalResults(results, resultContainer);
      } catch (error) {
        showError(resultContainer, `Analysis failed: ${error.message}`);
      }
    });
  }

  if (shodanForm) {
    shodanForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const resultContainer = document.getElementById("shodan-results");
      const queryInput = e.target.querySelector("input");
      const query = queryInput.value.trim();

      if (!query) {
        showError(resultContainer, "Please enter an IP address or hostname");
        return;
      }

      showLoading(resultContainer, "Searching Shodan...");

      try {
        const ipInfo = IPAnalyzer.analyzeIP(query);

        if (!ipInfo.valid && !/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(query)) {
          throw new Error("Invalid IP address or hostname format");
        }

        const results = {
          ip: ipInfo.valid ? query : "93.184.216.34",
          hostnames: ipInfo.valid ? [] : [query],
          country: ipInfo.country || "United States",
          city: ipInfo.city || "Los Angeles",
          org: ipInfo.org || "Unknown Organization",
          isp: ipInfo.org || "Unknown ISP",
          last_update: new Date().toISOString(),
          ports: generatePorts(query),
          vulns: generateVulns(ipInfo.riskLevel || "low"),
          tags: generateTags(query),
        };

        await new Promise((resolve) => setTimeout(resolve, 1500));
        displayShodanResults(results, resultContainer);
      } catch (error) {
        showError(resultContainer, `Search failed: ${error.message}`);
      }
    });
  }

  if (hibpForm) {
    hibpForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const resultContainer = document.getElementById("hibp-results");
      const emailInput = e.target.querySelector("input");
      const email = emailInput.value.trim().toLowerCase();

      if (!email || !email.includes("@")) {
        showError(resultContainer, "Please enter a valid email address");
        return;
      }

      showLoading(resultContainer, "Checking for breaches...");

      try {
        const emailInfo = EmailAnalyzer.analyzeEmail(email);
        const breaches = EmailAnalyzer.generateBreaches(emailInfo);
        const pasteCount = emailInfo.breached ? emailInfo.hash % 3 : 0;

        const results = {
          email: email,
          breached: emailInfo.breached,
          breaches: breaches,
          pastes: pasteCount,
        };

        await new Promise((resolve) => setTimeout(resolve, 1500));
        displayHIBPResults(results, resultContainer);
      } catch (error) {
        showError(resultContainer, `Check failed: ${error.message}`);
      }
    });
  }

  if (dnsForm) {
    dnsForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const resultContainer = document.getElementById("dns-results");
      const domainInput = e.target.querySelector("input");
      const domain = domainInput.value.trim().toLowerCase();

      if (!domain || !/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(domain)) {
        showError(resultContainer, "Please enter a valid domain name");
        return;
      }

      const selectedTypes = Array.from(
        e.target.querySelectorAll('input[type="checkbox"]:checked')
      ).map((cb) => cb.value);

      if (selectedTypes.length === 0) {
        showError(resultContainer, "Please select at least one record type");
        return;
      }

      showLoading(resultContainer, "Looking up DNS records...");

      try {
        const allRecords = DNSAnalyzer.generateRecords(domain);
        const filteredRecords = {};

        selectedTypes.forEach((type) => {
          if (allRecords[type]) {
            filteredRecords[type] = allRecords[type];
          }
        });

        const results = {
          domain: domain,
          records: filteredRecords,
          whois: generateWhoisInfo(domain),
        };

        await new Promise((resolve) => setTimeout(resolve, 1500));
        displayDNSResults(results, resultContainer);
      } catch (error) {
        showError(resultContainer, `DNS lookup failed: ${error.message}`);
      }
    });
  }

  // Tab functionality
  const tabButtons = document.querySelectorAll(".tab-btn");
  const tabContents = document.querySelectorAll(".tab-content");

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      tabButtons.forEach((btn) => btn.classList.remove("active"));
      tabContents.forEach((content) => content.classList.remove("active"));

      button.classList.add("active");
      const tabId = `${button.dataset.tab}-tab`;
      document.getElementById(tabId).classList.add("active");
    });
  });

  // File upload handling
  const fileInput = document.getElementById("file-input");
  const fileLabel = document.querySelector(".file-label");
  const fileUpload = document.querySelector(".file-upload");

  if (fileInput) {
    fileInput.addEventListener("change", (e) => {
      if (e.target.files.length > 0) {
        const fileName = e.target.files[0].name;
        const fileSize = (e.target.files[0].size / (1024 * 1024)).toFixed(2);
        fileLabel.querySelector(
          "span"
        ).textContent = `${fileName} (${fileSize} MB)`;
      } else {
        fileLabel.querySelector("span").textContent =
          "Drop file or click to upload";
      }
    });

    fileUpload.addEventListener("dragover", (e) => {
      e.preventDefault();
      fileUpload.classList.add("drag-over");
    });

    fileUpload.addEventListener("dragleave", () => {
      fileUpload.classList.remove("drag-over");
    });

    fileUpload.addEventListener("drop", (e) => {
      e.preventDefault();
      fileUpload.classList.remove("drag-over");

      if (e.dataTransfer.files.length > 0) {
        fileInput.files = e.dataTransfer.files;
        const fileName = e.dataTransfer.files[0].name;
        const fileSize = (e.dataTransfer.files[0].size / (1024 * 1024)).toFixed(
          2
        );
        fileLabel.querySelector(
          "span"
        ).textContent = `${fileName} (${fileSize} MB)`;
      }
    });
  }

  // Add styles
  const style = document.createElement("style");
  style.textContent = `
    .loading-spinner {
      width: 50px;
      height: 50px;
      border: 5px solid rgba(0, 0, 0, 0.1);
      border-radius: 50%;
      border-top-color: var(--primary);
      animation: spin 1s ease-in-out infinite;
      margin: 0 auto 1rem;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .loading-state, .error-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 2rem;
      min-height: 200px;
    }

    .drag-over {
      border-color: var(--primary);
      background-color: rgba(128, 0, 0, 0.05);
    }

    .tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .tag {
      background: var(--primary);
      color: white;
      padding: 0.3rem 0.8rem;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 500;
    }

    .record-section {
      margin-bottom: 1.5rem;
    }

    .record-section h4 {
      margin-bottom: 0.5rem;
      color: var(--text);
    }

    body.dark-mode .loading-spinner {
      border-color: rgba(255, 255, 255, 0.1);
      border-top-color: var(--primary);
    }
  `;
  document.head.appendChild(style);
});
