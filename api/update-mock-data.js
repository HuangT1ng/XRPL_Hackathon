const fs = require('fs');
const path = require('path');

// Usage: POST /api/update-mock-data with { newCampaign }
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', () => {
    try {
      const { newCampaign } = JSON.parse(body);
      const mockDataPath = path.join(__dirname, '../src/data/mockData.ts');
      let fileContent = fs.readFileSync(mockDataPath, 'utf-8');

      // Extract the array using a regex
      const arrayMatch = fileContent.match(/export const mockCampaigns: SMECampaign\[] = (\[.*\]);/s);
      if (!arrayMatch) {
        res.status(500).json({ error: 'mockData.ts format error' });
        return;
      }
      // Parse the array (remove new Date and fix keys for JSON.parse)
      const campaignsArray = JSON.parse(
        arrayMatch[1]
          .replace(/new Date\(([^)]+)\)/g, 'null') // Remove new Date() for JSON.parse
          .replace(/([a-zA-Z0-9_]+):/g, '"$1":') // Add quotes to keys
          .replace(/'/g, '"') // Single to double quotes
      );

      // Append the new campaign
      campaignsArray.push(newCampaign);

      // Write back to file, preserving the export statement
      const newContent =
        fileContent.replace(
          /export const mockCampaigns: SMECampaign\[] = \[.*\];/s,
          `export const mockCampaigns: SMECampaign[] = ${JSON.stringify(campaignsArray, null, 2)};`
        );
      fs.writeFileSync(mockDataPath, newContent, 'utf-8');
      res.status(200).json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
}; 