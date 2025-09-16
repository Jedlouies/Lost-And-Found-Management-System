import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import sharp from "sharp";
import { db, resend  } from "./firebaseAdmin.js";
import { v4 as uuidv4 } from "uuid";
import { pipeline } from "@xenova/transformers";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";



const app = express();
app.use(express.json());

// --- Enable CORS ---
app.use(cors({
  origin: "*",
  methods: "GET,POST,PUT,DELETE,OPTIONS",
  allowedHeaders: "Content-Type, Authorization"
}));

// --- Test Endpoint ---
app.get("/", (req, res) => {
  res.send("AI-Powered Matching API is running!");
});

app.use(cors({
  origin: 'http://localhost:5173', // or '*' for testing
}));

// --- Transaction ID Generator ---
function generateTransactionId() {
  return 'TX-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
}

// --- Item ID Generator ---
function generateItemId() {
  const part1 = Math.floor(100 + Math.random() * 900);   // 3 digits
  const part2 = Math.floor(1000 + Math.random() * 9000); // 4 digits
  const part3 = Math.floor(100 + Math.random() * 900);   // 3 digits
  return `ITM-${part1}-${part2}-${part3}`;
}

/* --------------------------------------------------
   AI MODELS FOR TEXT EMBEDDINGS
--------------------------------------------------- */
let textEmbedder = null;

async function getTextEmbedder() {
  if (!textEmbedder) {
    console.log("Loading AI text model...");
    textEmbedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }
  return textEmbedder;
}

/* --------------------------------------------------
   HELPER: Cosine Similarity
--------------------------------------------------- */
function cosineSimilarity(vecA, vecB) {
  const dot = vecA.reduce((sum, val, i) => sum + val * vecB[i], 0);
  const normA = Math.sqrt(vecA.reduce((sum, val) => sum + val * val, 0));
  const normB = Math.sqrt(vecB.reduce((sum, val) => sum + val * val, 0));
  return dot / (normA * normB);
}

/* --------------------------------------------------
   TEXT SIMILARITY (AI)
--------------------------------------------------- */
async function compareTextAI(text1, text2) {
  if (!text1 || !text2) return 0;
  const embedder = await getTextEmbedder();
  const emb1 = await embedder(text1, { pooling: 'mean', normalize: true });
  const emb2 = await embedder(text2, { pooling: 'mean', normalize: true });
  return cosineSimilarity(emb1.data, emb2.data) * 100;
}

/* --------------------------------------------------
   IMAGE SIMILARITY (Pixelmatch)
--------------------------------------------------- */
async function fetchImageAsPNG(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch image: ${url}`);
  const buffer = await response.arrayBuffer();
  return sharp(Buffer.from(buffer))
    .resize(224, 224) // normalize size
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

/* --------------------------------------------------
   MATCHING LOGIC
--------------------------------------------------- */
async function calculateMatchScore(lostItem, foundItem) {
  const nameScore = await compareTextAI(lostItem.itemName || "", foundItem.itemName || "");
  const descScore = await compareTextAI(lostItem.itemDescription || "", foundItem.itemDescription || "");
  const locationScore = await compareTextAI(lostItem.locationLost || "", foundItem.locationFound || "");

  const categoryMatch = (lostItem.category?.toLowerCase() === foundItem.category?.toLowerCase()) ? 100 : 0;

  const overallTextScore =
    (nameScore * 0.5 + descScore * 0.3 + locationScore * 0.1 + categoryMatch * 0.1);

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
    categoryScore: toPercentage(categoryMatch),
    overallTextScore: toPercentage(overallTextScore),
    imageScore: toPercentage(imageScore),
    overallScore: toPercentage(overallScore),
  };
}

/* --------------------------------------------------
   API: found-to-lost
--------------------------------------------------- */
app.post("/api/match/found-to-lost", async (req, res) => {
  try {
    const { uidFound } = req.body;
    const foundDoc = await db.collection("foundItems").doc(uidFound).get();
    if (!foundDoc.exists) return res.status(404).json({ error: "Found item not found." });

    const foundItem = foundDoc.data();

    const lostSnapshot = await db.collection("lostItems")
      .where("category", "==", foundItem.category)
      .get();

    const matches = [];
    for (const lostDoc of lostSnapshot.docs) {
      const lostItem = lostDoc.data();

      // 🔎 Skip excluded items
      if (
        lostItem.claimedStatus === "claimed" ||
        lostItem.archivedStatus === true ||
        lostItem.status === "pending" ||
        lostItem.status === "canceled"
      ) {
        continue;
      }

      const scores = await calculateMatchScore(lostItem, foundItem);

      const matchData = {
        transactionId: generateTransactionId(),
        itemId: generateItemId(),
        lostItem: { ...lostItem, id: lostDoc.id },
        foundItem: { ...foundItem, id: uidFound },
        scores,
        createdAt: new Date().toISOString()
      };

      await db.collection("matches").add(matchData);
      matches.push(matchData);
    }

    matches.sort((a, b) => b.scores.overallScore - a.scores.overallScore);
    res.json(matches);
  } catch (error) {
    console.error("Error in /api/match/found-to-lost:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

/* --------------------------------------------------
   API: lost-to-found
--------------------------------------------------- */
app.post("/api/match/lost-to-found", async (req, res) => {
  try {
    const { uidLost } = req.body;
    const lostDoc = await db.collection("lostItems").doc(uidLost).get();
    if (!lostDoc.exists) return res.status(404).json({ error: "Lost item not found." });

    const lostItem = lostDoc.data();

    const foundSnapshot = await db.collection("foundItems")
      .where("category", "==", lostItem.category)
      .get();

    const matches = [];
    for (const foundDoc of foundSnapshot.docs) {
      const foundItem = foundDoc.data();

      // 🔎 Skip excluded items
      if (
        foundItem.claimedStatus === "claimed" ||
        foundItem.archivedStatus === true ||
        foundItem.status === "pending" ||
        foundItem.status === "canceled"
      ) {
        continue;
      }

      const scores = await calculateMatchScore(lostItem, foundItem);

      const matchData = {
        transactionId: generateTransactionId(),
        itemId: generateItemId(),
        lostItem: { ...lostItem, id: uidLost },
        foundItem: { ...foundItem, id: foundDoc.id },
        scores,
        createdAt: new Date().toISOString()
      };

      await db.collection("matches").add(matchData);
      matches.push(matchData);
    }

    matches.sort((a, b) => b.scores.overallScore - a.scores.overallScore);
    res.json(matches);
  } catch (error) {
    console.error("Error in /api/match/lost-to-found:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});


/* --------------------------------------------------
   API: Email
--------------------------------------------------- */

app.post("/api/send-email", async (req, res) => {
  try {
    const { to, subject, html } = req.body;

    const { data, error } = await resend.emails.send({
      from: "Spotsync <onboarding@resend.dev>",
      to,
      subject,
      html,
    });

    if (error) {
      console.error("Resend API error:", error);
      return res.status(500).json({ error });
    }

    res.json({ success: true, data });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: err.message });
  }
});
/* --------------------------------------------------
   START SERVER
--------------------------------------------------- */
app.listen(4000, () => console.log(" Server running on http://localhost:4000"));
