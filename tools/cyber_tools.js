// Cyber Tools JavaScript
document.addEventListener("DOMContentLoaded", () => {
  // Tab functionality
  const tabButtons = document.querySelectorAll(".tab-btn");
  const tabContents = document.querySelectorAll(".tab-content");

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      // Remove active class from all buttons and contents
      tabButtons.forEach((btn) => btn.classList.remove("active"));
      tabContents.forEach((content) => content.classList.remove("active"));

      // Add active class to current button and corresponding content
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
        const fileSize = (e.target.files[0].size / (1024 * 1024)).toFixed(2); // Size in MB
        fileLabel.querySelector(
          "span"
        ).textContent = `${fileName} (${fileSize} MB)`;
      } else {
        fileLabel.querySelector("span").textContent =
          "Drop file or click to upload";
      }
    });

    // Drag and drop functionality
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
        ); // Size in MB
        fileLabel.querySelector(
          "span"
        ).textContent = `${fileName} (${fileSize} MB)`;
      }
    });
  }

  // Form submissions
  const fileForm = document.getElementById("file-form");
  const urlForm = document.getElementById("url-form");
  const hashForm = document.getElementById("hash-form");
  const shodanForm = document.getElementById("shodan-form");
  const hibpForm = document.getElementById("hibp-form");
  const dnsForm = document.getElementById("dns-form");

  // Mock API responses (in a real implementation, these would be actual API calls)
  const mockVirusTotalFile = {
    status: "completed",
    stats: {
      harmless: 60,
      suspicious: 2,
      malicious: 0,
      undetected: 8,
    },
    scan_date: new Date().toISOString(),
    verbose_msg: "File analysis complete",
    file_info: {
      name: "example.pdf",
      size: 1204304,
      type: "PDF document",
      md5: "d8e8fca2dc0f896fd7cb4cb0031ba249",
      sha1: "4db7a3c12b45e86970c9f37995069b59f7e66973",
      sha256:
        "f256df3c5dd278a732c704beecb6da73fb9c5b9274d1066207d3be47edb0c8d3",
    },
  };

  const mockVirusTotalUrl = {
    status: "completed",
    stats: {
      harmless: 58,
      suspicious: 0,
      malicious: 2,
      undetected: 10,
    },
    scan_date: new Date().toISOString(),
    url: "https://example.com/suspicious-page",
    categories: ["malware", "phishing"],
  };

  const mockVirusTotalHash = {
    status: "completed",
    stats: {
      harmless: 0,
      suspicious: 5,
      malicious: 55,
      undetected: 10,
    },
    scan_date: new Date().toISOString(),
    file_info: {
      name: "malware.exe",
      size: 2457600,
      type: "Win32 EXE",
      md5: "44d88612fea8a8f36de82e1278abb02f",
      sha1: "3395856ce81f2b7382dee72602f798b642f14140",
      sha256:
        "275a021bbfb6489e54d471899f7db9d1663fc695ec2fe2a2c4538aabf651fd0f",
    },
    tags: ["ransomware", "trojan", "win32"],
  };

  const mockShodanResults = {
    ip: "93.184.216.34",
    hostnames: ["example.com"],
    country: "United States",
    city: "Los Angeles",
    org: "Cloudflare, Inc.",
    isp: "Cloudflare, Inc.",
    last_update: new Date().toISOString(),
    ports: [80, 443, 8080],
    vulns: ["CVE-2019-0211", "CVE-2018-15473"],
    tags: ["cdn", "cloud"],
  };

  const mockHIBPResults = {
    email: "test@example.com",
    breached: true,
    breaches: [
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
    ],
    pastes: 2,
  };

  const mockHIBPSafeResults = {
    email: "safe@example.com",
    breached: false,
    breaches: [],
    pastes: 0,
  };

  const mockDNSResults = {
    domain: "example.com",
    records: {
      A: ["93.184.216.34"],
      AAAA: ["2606:2800:220:1:248:1893:25c8:1946"],
      MX: ["0 example-com.mail.protection.outlook.com"],
      TXT: ["v=spf1 include:spf.protection.outlook.com -all"],
      NS: ["a.iana-servers.net", "b.iana-servers.net"],
    },
    whois: {
      registrar: "ICANN",
      created_date: "1995-08-14T04:00:00Z",
      expiration_date: "2023-08-13T04:00:00Z",
      updated_date: "2022-08-14T04:00:00Z",
    },
  };

  // Form submission handlers
  if (fileForm) {
    fileForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const resultContainer = document.getElementById("vt-results");
      resultContainer.innerHTML = '<div class="loading-spinner"></div>';

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Display mock results
      displayVirusTotalResults(mockVirusTotalFile, resultContainer);
    });
  }

  if (urlForm) {
    urlForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const resultContainer = document.getElementById("vt-results");
      resultContainer.innerHTML = '<div class="loading-spinner"></div>';
      const url = e.target.querySelector("input").value;

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Use the URL in the mock results
      const results = { ...mockVirusTotalUrl, url: url };
      displayVirusTotalResults(results, resultContainer);
    });
  }

  if (hashForm) {
    hashForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const resultContainer = document.getElementById("vt-results");
      resultContainer.innerHTML = '<div class="loading-spinner"></div>';

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Display mock results
      displayVirusTotalResults(mockVirusTotalHash, resultContainer);
    });
  }

  if (shodanForm) {
    shodanForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const resultContainer = document.getElementById("shodan-results");
      resultContainer.innerHTML = '<div class="loading-spinner"></div>';
      const query = e.target.querySelector("input").value;

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Use the query in the mock results
      const results = { ...mockShodanResults };
      if (query.match(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/)) {
        results.ip = query;
      } else {
        results.hostnames = [query];
      }

      displayShodanResults(results, resultContainer);
    });
  }

  if (hibpForm) {
    hibpForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const resultContainer = document.getElementById("hibp-results");
      resultContainer.innerHTML = '<div class="loading-spinner"></div>';
      const email = e.target.querySelector("input").value;

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // In a real implementation, this would be an actual API call to HIBP
      // For demo purposes, we'll create a deterministic but seemingly random result
      // based on the email string to ensure consistent results for the same email
      const emailHash = simpleHash(email.toLowerCase());
      const isBreached = emailHash % 4 !== 0; // 75% of emails will show as breached for demo

      let results;
      if (isBreached) {
        // Generate breach count based on email hash
        const breachCount = (emailHash % 3) + 1; // 1-3 breaches
        const pasteCount = emailHash % 2; // 0-1 pastes

        // Create custom breach list
        const breaches = [];
        const possibleBreaches = [
          {
            name: "Adobe",
            domain: "adobe.com",
            breach_date: "2013-10-04",
            data_classes: ["Email addresses", "Password hints", "Passwords"],
          },
          {
            name: "LinkedIn",
            domain: "linkedin.com",
            breach_date: "2012-05-05",
            data_classes: ["Email addresses", "Passwords"],
          },
          {
            name: "Dropbox",
            domain: "dropbox.com",
            breach_date: "2016-08-31",
            data_classes: ["Email addresses", "Passwords", "Names"],
          },
          {
            name: "MySpace",
            domain: "myspace.com",
            breach_date: "2008-07-01",
            data_classes: ["Email addresses", "Passwords", "Usernames"],
          },
        ];

        // Select breaches based on email hash
        for (let i = 0; i < breachCount; i++) {
          breaches.push(possibleBreaches[i % possibleBreaches.length]);
        }

        results = {
          email: email,
          breached: true,
          breaches: breaches,
          pastes: pasteCount,
        };
      } else {
        results = {
          email: email,
          breached: false,
          breaches: [],
          pastes: 0,
        };
      }

      displayHIBPResults(results, resultContainer);
    });
  }

  if (dnsForm) {
    dnsForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const resultContainer = document.getElementById("dns-results");
      resultContainer.innerHTML = '<div class="loading-spinner"></div>';
      const domain = e.target.querySelector("input").value;

      // Get selected record types
      const selectedTypes = Array.from(
        e.target.querySelectorAll('input[type="checkbox"]:checked')
      ).map((cb) => cb.value);

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Filter results based on selected record types
      const results = { ...mockDNSResults, domain: domain };
      const filteredRecords = {};

      selectedTypes.forEach((type) => {
        if (results.records[type]) {
          filteredRecords[type] = results.records[type];
        }
      });

      results.records = filteredRecords;
      displayDNSResults(results, resultContainer);
    });
  }

  // Simple hash function for demo purposes
  function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  // Result display functions
  function displayVirusTotalResults(results, container) {
    // Calculate total engines
    const totalEngines =
      results.stats.harmless +
      results.stats.suspicious +
      results.stats.malicious +
      results.stats.undetected;

    // Default to clean
    let statusClass = "status-safe";
    let statusText = "Clean";

    // Only mark as malicious if actual malicious detections
    if (results.stats.malicious > 0) {
      statusClass = "status-danger";
      statusText = "Malicious";
    }
    // Only mark suspicious if significant percentage of engines (>5%) flag it
    else if (results.stats.suspicious > Math.max(3, totalEngines * 0.05)) {
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
    `;

    // Detection stats
    html += `
      <div class="result-section">
        <div class="section-title">Detection Stats</div>
        <div class="detection-stats">
          <table class="data-table">
            <tr>
              <th>Category</th>
              <th>Count</th>
            </tr>
            <tr>
              <td>Harmless</td>
              <td>${results.stats.harmless}</td>
            </tr>
            <tr>
              <td>Suspicious</td>
              <td>${results.stats.suspicious}</td>
            </tr>
            <tr>
              <td>Malicious</td>
              <td>${results.stats.malicious}</td>
            </tr>
            <tr>
              <td>Undetected</td>
              <td>${results.stats.undetected}</td>
            </tr>
          </table>
        </div>
      </div>
    `;

    // File/URL details
    if (results.file_info) {
      html += `
        <div class="result-section">
          <div class="section-title">File Details</div>
          <table class="data-table">
            <tr>
              <th>Property</th>
              <th>Value</th>
            </tr>
            <tr>
              <td>File Type</td>
              <td>${results.file_info.type}</td>
            </tr>
            <tr>
              <td>Size</td>
              <td>${(results.file_info.size / 1024).toFixed(2)} KB</td>
            </tr>
            <tr>
              <td>MD5</td>
              <td>${results.file_info.md5}</td>
            </tr>
            <tr>
              <td>SHA-1</td>
              <td>${results.file_info.sha1}</td>
            </tr>
            <tr>
              <td>SHA-256</td>
              <td>${results.file_info.sha256}</td>
            </tr>
          </table>
        </div>
      `;
    }

    // Tags
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

    // Categories for URLs
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
    `;

    // Basic information
    html += `
      <div class="result-section">
        <div class="section-title">Basic Information</div>
        <table class="data-table">
          <tr>
            <th>Property</th>
            <th>Value</th>
          </tr>
          <tr>
            <td>IP Address</td>
            <td>${results.ip}</td>
          </tr>
          <tr>
            <td>Hostnames</td>
            <td>${results.hostnames.join(", ")}</td>
          </tr>
          <tr>
            <td>Location</td>
            <td>${results.city}, ${results.country}</td>
          </tr>
          <tr>
            <td>Organization</td>
            <td>${results.org}</td>
          </tr>
          <tr>
            <td>ISP</td>
            <td>${results.isp}</td>
          </tr>
        </table>
      </div>
    `;

    // Open ports
    html += `
      <div class="result-section">
        <div class="section-title">Open Ports</div>
        <div class="tags">
          ${results.ports
            .map((port) => `<span class="tag">${port}</span>`)
            .join("")}
        </div>
      </div>
    `;

    // Vulnerabilities
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

    // Tags
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
    let statusClass = results.breached ? "status-danger" : "status-safe";
    let statusText = results.breached ? "Breached" : "Good News!";

    let html = `
      <div class="result-animation">
        <div class="result-header">
          <div class="result-title">${results.email}</div>
          <div class="result-status ${statusClass}">${
      results.breached ? "Breached" : "No Pwnage Found"
    }</div>
        </div>
        <div class="result-body">
    `;

    if (results.breached) {
      // Breached content
      html += `
        <div class="result-section">
          <div class="section-title">Breach Summary</div>
          <p>This email has been found in ${
            results.breaches.length
          } data breach${results.breaches.length !== 1 ? "es" : ""} 
             and ${results.pastes} paste${results.pastes !== 1 ? "s" : ""}.</p>
        </div>
      `;

      // Breaches detail
      if (results.breaches.length > 0) {
        html += `
          <div class="result-section">
            <div class="section-title">Breach Details</div>
            <table class="data-table">
              <tr>
                <th>Service</th>
                <th>Date</th>
                <th>Exposed Data</th>
              </tr>
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

        html += `
            </table>
          </div>
        `;
      }

      // Recommendations
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
      // Not breached - match the "Good news" messaging from HIBP
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
    `;

    // DNS Records
    html += `
      <div class="result-section">
        <div class="section-title">DNS Records</div>
    `;

    // Check if any records were selected/found
    if (Object.keys(results.records).length === 0) {
      html += `<p>No DNS records of the selected types were found for this domain.</p>`;
    } else {
      // For each record type
      Object.entries(results.records).forEach(([type, values]) => {
        html += `
          <div class="record-section">
            <h4>${type} Records</h4>
            <table class="data-table">
              <tr>
                <th>Value</th>
              </tr>
        `;

        values.forEach((value) => {
          html += `
            <tr>
              <td>${value}</td>
            </tr>
          `;
        });

        html += `
            </table>
          </div>
        `;
      });
    }

    html += `
      </div>
    `;

    // WHOIS information
    if (results.whois) {
      html += `
        <div class="result-section">
          <div class="section-title">WHOIS Information</div>
          <table class="data-table">
            <tr>
              <th>Property</th>
              <th>Value</th>
            </tr>
            <tr>
              <td>Registrar</td>
              <td>${results.whois.registrar}</td>
            </tr>
            <tr>
              <td>Created Date</td>
              <td>${new Date(
                results.whois.created_date
              ).toLocaleDateString()}</td>
            </tr>
            <tr>
              <td>Expiration Date</td>
              <td>${new Date(
                results.whois.expiration_date
              ).toLocaleDateString()}</td>
            </tr>
            <tr>
              <td>Last Updated</td>
              <td>${new Date(
                results.whois.updated_date
              ).toLocaleDateString()}</td>
            </tr>
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

  // Simple loading spinner style
  const style = document.createElement("style");
  style.textContent = `
    .loading-spinner {
      width: 50px;
      height: 50px;
      border: 5px solid rgba(0, 0, 0, 0.1);
      border-radius: 50%;
      border-top-color: var(--primary);
      animation: spin 1s ease-in-out infinite;
      margin: 50px auto;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
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
