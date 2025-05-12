import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import { parseStringPromise } from "xml2js";
import fs from "fs";
import https from "https";
import zlib from "zlib";
import path from "path";
import { fileURLToPath } from "url";
import schedule from "node-schedule";

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Enable CORS
app.use(cors());

// Route for CISA vulnerabilities
app.get("/api/cisa", async (req, res) => {
  try {
    const response = await fetch(
      "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json"
    );

    if (!response.ok) {
      console.error("Failed to fetch CISA data:", response.statusText);
      return res.status(500).json({ message: "Failed to fetch CISA data" });
    }

    const data = await response.json();

    // Ensure the data has vulnerabilities
    if (!data.vulnerabilities || !Array.isArray(data.vulnerabilities)) {
      return res.status(500).json({ message: "Invalid CISA data format." });
    }

    // Send all vulnerabilities to the frontend
    res.json(data.vulnerabilities);
  } catch (error) {
    console.error("Error in /api/cisa route:", error.message);
    res.status(500).send("Server Error");
  }
});

// Route for MSRC updates
app.get("/api/updates", async (req, res) => {
  try {
    const response = await fetch("https://api.msrc.microsoft.com/updates");
    if (!response.ok) {
      console.error("Failed to fetch MSRC updates:", response.statusText);
      return res.status(500).json({ message: "Failed to fetch MSRC updates" });
    }

    const data = await response.json();

    // Get last month's updates
    const now = new Date();
    const lastMonth = now.getMonth() - 1; // Last month
    const lastMonthYear = now.getFullYear() - (lastMonth < 0 ? 1 : 0);
    const normalizedMonth = (lastMonth + 12) % 12;

    const lastMonthUpdates = data.value.filter((update) => {
      const releaseDate = new Date(update.InitialReleaseDate);
      return (
        releaseDate.getMonth() === normalizedMonth &&
        releaseDate.getFullYear() === lastMonthYear
      );
    });

    if (lastMonthUpdates.length === 0) {
      console.log("No updates available for the last month.");
      return res.json({ message: "No updates available for the last month." });
    }

    // Fetch XML from CvrfUrl
    const cvrfUrl = lastMonthUpdates[0].CvrfUrl;
    console.log("Fetching CVRF data from URL:", cvrfUrl);

    const xmlResponse = await fetch(cvrfUrl);
    if (!xmlResponse.ok) {
      console.error("Failed to fetch CVRF data:", xmlResponse.statusText);
      return res.status(500).json({ message: "Failed to fetch CVRF data" });
    }

    const xmlText = await xmlResponse.text();

    // Parse XML to JSON
    const jsonData = await parseStringPromise(xmlText, {
      explicitArray: false,
    });

    // Validate structure
    if (!jsonData || !jsonData["cvrf:cvrfdoc"]) {
      console.error("Invalid XML structure:", jsonData);
      return res.status(500).json({ message: "Invalid XML structure." });
    }

    // Send parsed JSON
    res.json(jsonData["cvrf:cvrfdoc"]);
  } catch (error) {
    console.error("Error in /api/updates route:", error.message);
    res.status(500).send("Server Error");
  }
});

app.get("/api/redhat", async (req, res) => {
  try {
    const response = await fetch(
      "https://access.redhat.com/hydra/rest/securitydata/cve.json",
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3",
        },
      }
    );

    if (!response.ok) {
      console.error("Red Hat API Error:", response.status, response.statusText);
      return res.status(502).json({
        message: "Failed to fetch from Red Hat API",
        status: response.status,
      });
    }

    const data = await response.json();

    // Map and filter data
    const formattedVulnerabilities = data.map((vuln) => ({
      id: vuln.CVE || "No ID Provided",
      title:
        vuln.bugzilla_description ||
        vuln.bugzilla?.description ||
        "No details available",
      severity: vuln.severity || vuln.threat_severity || "Unknown",
      publicDate: vuln.public_date || "No date provided",
      affectedPackages:
        vuln.affected_packages && vuln.affected_packages.length > 0
          ? vuln.affected_packages.join(", ")
          : "No affected packages",
      cvssScore: vuln.cvss3_score || "N/A",
      advisory: vuln.advisories?.[0] || "No advisory available",
    }));

    res.json(formattedVulnerabilities);
  } catch (error) {
    console.error("Red Hat API Error:", error);
    res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
});

// NVD data handling
const DOWNLOAD_DIR = path.join(__dirname, "nvd_data");
const NVD_FEED_URL =
  "https://nvd.nist.gov/feeds/json/cve/1.1/nvdcve-1.1-2025.json.gz";
const PROCESSED_JSON_PATH = path.join(
  __dirname,
  "public/data/nvd_2025_vulnerabilities.json"
);

function downloadAndProcessNvdData() {
  console.log(`Starting NVD update: ${new Date()}`);

  // Create download directory if it doesn't exist
  if (!fs.existsSync(DOWNLOAD_DIR)) {
    fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
  }

  const gzFilePath = path.join(DOWNLOAD_DIR, "nvdcve-1.1-2025.json.gz");
  const file = fs.createWriteStream(gzFilePath);

  https
    .get(NVD_FEED_URL, (response) => {
      response.pipe(file);

      file.on("finish", () => {
        file.close(() => {
          console.log(`Downloaded NVD data to ${gzFilePath}`);

          // Extract and process the data
          const gunzip = zlib.createGunzip();
          const fileContents = fs.createReadStream(gzFilePath).pipe(gunzip);
          let data = "";

          fileContents.on("data", (chunk) => {
            data += chunk;
          });

          fileContents.on("end", () => {
            try {
              const jsonData = JSON.parse(data);
              const processedData = [];

              for (const item of jsonData.CVE_Items || []) {
                const cve = item.cve || {};
                const impact = item.impact || {};

                // Extract CVSS score
                let cvssScore = "N/A";
                if (impact.baseMetricV3) {
                  cvssScore = impact.baseMetricV3.cvssV3.baseScore;
                } else if (impact.baseMetricV2) {
                  cvssScore = impact.baseMetricV2.cvssV2.baseScore;
                }

                // Get description
                let description = "No description available";
                if (cve.description && cve.description.description_data) {
                  for (const desc of cve.description.description_data) {
                    if (desc.lang === "en") {
                      description = desc.value || description;
                      break;
                    }
                  }
                }

                // Get severity based on CVSS score
                let severity = "N/A";
                if (cvssScore !== "N/A") {
                  const score = parseFloat(cvssScore);
                  if (score >= 9.0) severity = "Critical";
                  else if (score >= 7.0) severity = "High";
                  else if (score >= 4.0) severity = "Medium";
                  else severity = "Low";
                }

                // Build final object
                processedData.push({
                  id: cve.CVE_data_meta?.ID || "Unknown",
                  description,
                  cvssScore: String(cvssScore),
                  severity,
                  publishedDate: item.publishedDate,
                  lastModifiedDate: item.lastModifiedDate,
                  references: (cve.references?.reference_data || [])
                    .slice(0, 3)
                    .map((ref) => ref.url)
                    .filter(Boolean),
                });
              }

              // Save processed data
              if (!fs.existsSync(path.dirname(PROCESSED_JSON_PATH))) {
                fs.mkdirSync(path.dirname(PROCESSED_JSON_PATH), {
                  recursive: true,
                });
              }

              fs.writeFileSync(
                PROCESSED_JSON_PATH,
                JSON.stringify(processedData, null, 2)
              );

              console.log(
                `Processed ${processedData.length} vulnerabilities and saved to ${PROCESSED_JSON_PATH}`
              );
            } catch (error) {
              console.error("Error processing NVD data:", error);
            }
          });
        });
      });
    })
    .on("error", (err) => {
      console.error("Error downloading file:", err);
    });
}

// Run immediately
downloadAndProcessNvdData();

// Schedule to run on the 1st of every month at 2 AM
schedule.scheduleJob("0 2 1 * *", downloadAndProcessNvdData);

console.log("Scheduled monthly NVD data updates");

app.get("/api/nvd", (req, res) => {
  try {
    // Check if the file exists first
    if (!fs.existsSync(PROCESSED_JSON_PATH)) {
      return res.status(404).json({
        error: "NVD data not yet available",
        message:
          "The data file has not been generated yet. Please try again later.",
      });
    }

    const data = fs.readFileSync(PROCESSED_JSON_PATH, "utf8");
    res.json(JSON.parse(data));
  } catch (error) {
    console.error("Error serving NVD data:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
