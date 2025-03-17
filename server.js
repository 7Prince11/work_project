import express from "express";
import fetch from "node-fetch";
import cors from "cors"; // Import the CORS package
import { parseStringPromise } from "xml2js";

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
    const formattedVulnerabilities = data
      .map((vuln) => ({
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
      }))
      // Filter out entries with missing critical information
      .filter(
        (vuln) =>
          vuln.title !== "No details available" &&
          vuln.affectedPackages !== "No affected packages" &&
          vuln.severity !== "Unknown"
      );

    res.json(formattedVulnerabilities);
  } catch (error) {
    console.error("Red Hat API Error:", error);
    res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
