import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import sharp from "sharp";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";
import { db } from "./firebaseAdmin.js";
import { v4 as uuidv4 } from "uuid";
import { FieldValue } from "firebase-admin/firestore"; 

const app = express();
app.use(express.json());

// --- Enable CORS for React frontend ---
app.use(cors({
  origin: "*",
  methods: "GET,POST,PUT,DELETE,OPTIONS",
  allowedHeaders: "Content-Type, Authorization"
}));


// --- Test Endpoint ---
app.get("/", (req, res) => {
  res.send("API is running!");
});

function generateTransactionId() {
  return 'TX-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
}


/* ------------------------
   TEXT SIMILARITY LOGIC
------------------------- */
function levenshteinDistance(a, b) {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function compareTextFields(text1, text2) {
  if (!text1 || !text2) return 0;
  const maxLen = Math.max(text1.length, text2.length);
  if (maxLen === 0) return 100;
  const distance = levenshteinDistance(text1.toLowerCase(), text2.toLowerCase());
  return ((maxLen - distance) / maxLen) * 100;
}

/* ------------------------
   IMAGE SIMILARITY LOGIC
------------------------- */
async function fetchImageAsPNG(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch image: ${url}`);
  const buffer = await response.arrayBuffer();
  return sharp(Buffer.from(buffer))
    .resize(100, 100)
    .png()
    .toBuffer();
}

async function compareImages(url1, url2) {
  try {
    if (!url1 || !url2) return 0;

    const [img1Buffer, img2Buffer] = await Promise.all([
      fetchImageAsPNG(url1),
      fetchImageAsPNG(url2),
    ]);

    const img1 = PNG.sync.read(img1Buffer);
    const img2 = PNG.sync.read(img2Buffer);

    const { width, height } = img1;
    const diff = new PNG({ width, height });

    const numDiffPixels = pixelmatch(img1.data, img2.data, diff.data, width, height, { threshold: 0.1 });
    const similarity = 100 - (numDiffPixels / (width * height)) * 100;

    return Math.max(0, Math.min(100, similarity));
  } catch (error) {
    console.error("Image comparison error:", error);
    return 0;
  }
}

/* ------------------------
   API ENDPOINT: found-to-lost
   Compare ONE found item against ALL lost items
------------------------- */
app.post("/api/match/found-to-lost", async (req, res) => {
  try {
    const { uidFound } = req.body;

    const foundDoc = await db.collection("foundItems").doc(uidFound).get();
    if (!foundDoc.exists) return res.status(404).json({ error: "Found item not found." });

    const foundItem = foundDoc.data();

    // Fetch all lost items
    const lostSnapshot = await db.collection("lostItems").get();
    const matches = [];

    for (const lostDoc of lostSnapshot.docs) {
      const lostItem = lostDoc.data();

      // Compute text similarity
      const nameScore = compareTextFields(lostItem.itemName || "", foundItem.itemName || "");
      const descScore = compareTextFields(lostItem.itemDescription || "", foundItem.itemDescription || "");
      const locationScore = compareTextFields(lostItem.locationLost || "", foundItem.locationFound || "");
      const categoryScore = compareTextFields(lostItem.category || "", foundItem.category || "");

      const overallTextScore =
        nameScore * 0.4 + descScore * 0.35 + locationScore * 0.15 + categoryScore * 0.1;

      // Compute image similarity
      const lostImageUrl = Array.isArray(lostItem.images) ? lostItem.images[0] : lostItem.images;
      const foundImageUrl = Array.isArray(foundItem.images) ? foundItem.images[0] : foundItem.images;

      const imageScore = (lostImageUrl && foundImageUrl)
        ? await compareImages(lostImageUrl, foundImageUrl)
        : 0;

      const overallScore = overallTextScore * 0.6 + imageScore * 0.4;

      // Prepare match result
      const matchData = {
        transactionId: generateTransactionId(),
        lostItem: { ...lostItem, id: lostDoc.id },
        foundItem: { ...foundItem, id: uidFound },
        scores: {
          nameScore: parseFloat(nameScore.toFixed(2)),
          descriptionScore: parseFloat(descScore.toFixed(2)),
          locationScore: parseFloat(locationScore.toFixed(2)),
          categoryScore: parseFloat(categoryScore.toFixed(2)),
          imageScore: parseFloat(imageScore.toFixed(2)),
          overallTextScore: parseFloat(overallTextScore.toFixed(2)),
          overallScore: parseFloat(overallScore.toFixed(2))
        },
        createdAt: new Date().toISOString()
      };

      // Save each match to Firestore
      await db.collection("matches").add(matchData);

      matches.push(matchData);
    }

    // Sort matches by overall score (optional)
    matches.sort((a, b) => b.scores.overallScore - a.scores.overallScore);

    res.json(matches);
  } catch (error) {
    console.error("Error in /api/match/found-to-lost:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});
/* ------------------------
   API ENDPOINT: lost-to-found
   Compare ONE lost item against ALL found items
------------------------- */
app.post("/api/match/lost-to-found", async (req, res) => {
  try {
    const { uidLost } = req.body;

    // Fetch the lost item
    const lostDoc = await db.collection("lostItems").doc(uidLost).get();
    if (!lostDoc.exists) return res.status(404).json({ error: "Lost item not found." });

    const lostItem = lostDoc.data();

    // Fetch all found items
    const foundSnapshot = await db.collection("foundItems").get();
    const matches = [];

    for (const foundDoc of foundSnapshot.docs) {
      const foundItem = foundDoc.data();

      // --- Compute text similarity ---
      const nameScore = compareTextFields(lostItem.itemName || "", foundItem.itemName || "");
      const descScore = compareTextFields(lostItem.itemDescription || "", foundItem.itemDescription || "");
      const locationScore = compareTextFields(lostItem.locationLost || "", foundItem.locationFound || "");
      const categoryScore = compareTextFields(lostItem.category || "", foundItem.category || "");

      const overallTextScore =
        nameScore * 0.4 + descScore * 0.35 + locationScore * 0.15 + categoryScore * 0.1;

      // --- Compute image similarity ---
      const lostImageUrl = Array.isArray(lostItem.images) ? lostItem.images[0] : lostItem.images;
      const foundImageUrl = Array.isArray(foundItem.images) ? foundItem.images[0] : foundItem.images;

      const imageScore = (lostImageUrl && foundImageUrl)
        ? await compareImages(lostImageUrl, foundImageUrl)
        : 0;

      const overallScore = overallTextScore * 0.6 + imageScore * 0.4;

      // --- Prepare match result ---
      const matchData = {
        transactionId: generateTransactionId(),
        lostItem: { ...lostItem, id: uidLost },
        foundItem: { ...foundItem, id: foundDoc.id },
        scores: {
          nameScore: parseFloat(nameScore.toFixed(2)),
          descriptionScore: parseFloat(descScore.toFixed(2)),
          locationScore: parseFloat(locationScore.toFixed(2)),
          categoryScore: parseFloat(categoryScore.toFixed(2)),
          imageScore: parseFloat(imageScore.toFixed(2)),
          overallTextScore: parseFloat(overallTextScore.toFixed(2)),
          overallScore: parseFloat(overallScore.toFixed(2)),
        },
        createdAt: new Date().toISOString()
      };

      // Save match to Firestore
      await db.collection("matches").add(matchData);

      matches.push(matchData);
    }

    // Sort matches by overall score (descending)
    matches.sort((a, b) => b.scores.overallScore - a.scores.overallScore);

    res.json(matches);
  } catch (error) {
    console.error("Error in /api/match/lost-to-found:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

/* ------------------------
   REUSABLE MATCH FUNCTION
------------------------- */
async function calculateMatchScore(lostItem, foundItem) {
  const nameScore = compareTextFields(lostItem.itemName || "", foundItem.itemName || "");
  const descScore = compareTextFields(lostItem.itemDescription || "", foundItem.itemDescription || "");
  const locationScore = compareTextFields(lostItem.locationLost || "", foundItem.locationFound || "");
  const categoryScore = compareTextFields(lostItem.category || "", foundItem.category || "");

  const overallTextScore =
    (nameScore * 0.4 +
      descScore * 0.35 +
      locationScore * 0.15 +
      categoryScore * 0.1);

  const lostImageUrl = Array.isArray(lostItem.images) ? lostItem.images[0] : lostItem.images;
  const foundImageUrl = Array.isArray(foundItem.images) ? foundItem.images[0] : foundItem.images;

  const imageScore = (lostImageUrl && foundImageUrl)
    ? await compareImages(lostImageUrl, foundImageUrl)
    : 0;

  const overallScore = (overallTextScore * 0.6 + imageScore * 0.4);

  const toPercentage = (val) => parseFloat(val.toFixed(2));

  return {
    nameScore: toPercentage(nameScore),
    descriptionScore: toPercentage(descScore),
    locationScore: toPercentage(locationScore),
    categoryScore: toPercentage(categoryScore),
    overallTextScore: toPercentage(overallTextScore),
    imageScore: toPercentage(imageScore),
    overallScore: toPercentage(overallScore),
  };
}

/* ------------------------
   START SERVER
------------------------- */
app.listen(4000, () => console.log("Server running on http://localhost:4000"));
