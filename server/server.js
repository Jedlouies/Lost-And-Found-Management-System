import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import sharp from "sharp";
import { db, resend, openai } from "./firebaseAdmin.js";
import { v4 as uuidv4 } from "uuid";

// --- Server Setup ---
const app = express();
app.use(express.json());
app.use(cors({ origin: "*" }));

// --- Transaction & Item ID ---
function generateTransactionId() {
  return 'TX-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
}
function generateItemId() {
  return `ITM-${Math.floor(100 + Math.random() * 900)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(100 + Math.random() * 900)}`;
}

// --- Cosine Similarity ---
function cosineSimilarity(vecA, vecB) {
  const dot = vecA.reduce((sum, val, i) => sum + val * vecB[i], 0);
  const normA = Math.sqrt(vecA.reduce((sum, val) => sum + val * val, 0));
  const normB = Math.sqrt(vecB.reduce((sum, val) => sum + val * val, 0));
  return dot / (normA * normB);
}

// --- Text Embeddings ---
async function getTextEmbedding(text) {
  if (!text) return [];
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
    });
    return response.data[0].embedding;
  } catch (err) {
    console.error("Text embedding error:", err);
    return [];
  }
}

// --- Image Preprocessing & Embedding ---
async function preprocessImage(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch image: ${url}`);
  const buffer = await response.arrayBuffer();
  const processed = await sharp(Buffer.from(buffer))
    .resize(224, 224, { fit: "cover" })
    .png()
    .toBuffer();
  return Buffer.from(processed).toString("base64");
}

async function getImageEmbedding(url) {
  try {
    // Ask GPT-5 to describe the image
    const visionRes = await openai.chat.completions.create({
      model: "gpt-4o-mini", // GPT-5 capable of vision
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Describe this image in a short, detailed phrase suitable for matching lost & found items." },
            { type: "image_url", image_url: { url } }
          ]
        }
      ]
    });

    const description = visionRes.choices[0].message.content || "";

    // Get an embedding of that description
    const embedRes = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: description
    });

    return embedRes.data[0].embedding;
  } catch (err) {
    console.error("Image embedding error:", err);
    return [];
  }
}

// --- Object Detection Replacement ---
// No GPT chat. Just return the URL so we can use embeddings for relevance.
async function detectObjects(url) {
  return [url]; // placeholder for embedding comparison
}

// --- Check Relevance ---
async function isRelevantObject(itemName, detectedObjects) {
  const itemEmb = await getTextEmbedding(itemName);
  for (const obj of detectedObjects) {
    const objEmb = await getTextEmbedding(obj);
    const sim = cosineSimilarity(itemEmb, objEmb);
    if (sim >= 0.5) return true; // relevance threshold
  }
  return false;
}

// --- Compare Images ---
async function compareImagesWithFilter(lostUrls, foundUrls) {
  let bestScore = 0;
  for (const lostUrl of lostUrls) {
    const lostEmb = await getImageEmbedding(lostUrl);
    if (!lostEmb.length) continue;

    for (const foundUrl of foundUrls) {
      const foundEmb = await getImageEmbedding(foundUrl);
      if (!foundEmb.length) continue;

      const score = Math.max(0, Math.min(100, cosineSimilarity(lostEmb, foundEmb) * 100));
      if (score > bestScore) bestScore = score;
    }
  }
  return bestScore;
}


// --- Calculate Match Score ---
async function calculateMatchScore(lostItem, foundItem) {
  const nameScore = cosineSimilarity(await getTextEmbedding(lostItem.itemName || ""), await getTextEmbedding(foundItem.itemName || "")) * 100;
  const descScore = cosineSimilarity(await getTextEmbedding(lostItem.itemDescription || ""), await getTextEmbedding(foundItem.itemDescription || "")) * 100;
  const locationScore = cosineSimilarity(await getTextEmbedding(lostItem.locationLost || ""), await getTextEmbedding(foundItem.locationFound || "")) * 100;
  const categoryMatch = (lostItem.category?.toLowerCase() === foundItem.category?.toLowerCase()) ? 100 : 0;
  const overallTextScore = nameScore * 0.5 + descScore * 0.3 + locationScore * 0.1 + categoryMatch * 0.1;

  const lostUrls = Array.isArray(lostItem.images) ? lostItem.images : [lostItem.images];
  const foundUrls = Array.isArray(foundItem.images) ? foundItem.images : [foundItem.images];
  const imageScore = await compareImagesWithFilter(lostUrls, foundUrls);

  const overallScore = overallTextScore * 0.4 + imageScore * 0.6;
  const toPct = (v) => parseFloat(v.toFixed(2));

  return {
    nameScore: toPct(nameScore),
    descriptionScore: toPct(descScore),
    locationScore: toPct(locationScore),
    categoryScore: toPct(categoryMatch),
    overallTextScore: toPct(overallTextScore),
    imageScore: toPct(imageScore),
    overallScore: toPct(overallScore),
  };
}

// --- API: Found-to-Lost ---
app.post("/api/match/found-to-lost", async (req, res) => {
  try {
    const { uidFound } = req.body;
    const foundDoc = await db.collection("foundItems").doc(uidFound).get();
    if (!foundDoc.exists) return res.status(404).json({ error: "Found item not found." });
    const foundItem = foundDoc.data();

    const lostSnapshot = await db.collection("lostItems").where("category", "==", foundItem.category).get();
    const matches = [];

    for (const lostDoc of lostSnapshot.docs) {
      const lostItem = lostDoc.data();
      if (["claimed", "pending", "canceled"].includes(lostItem.status) || lostItem.archivedStatus) continue;

      const lostUrls = Array.isArray(lostItem.images) ? lostItem.images : [lostItem.images];
      const foundUrls = Array.isArray(foundItem.images) ? foundItem.images : [foundItem.images];
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
    const filteredMatches = matches.filter(m => m.scores.overallScore >= 60);
    res.json(filteredMatches);

  } catch (error) {
    console.error("Error in /api/match/found-to-lost:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

// --- API: Lost-to-Found ---
app.post("/api/match/lost-to-found", async (req, res) => {
  try {
    const { uidLost } = req.body;
    const lostDoc = await db.collection("lostItems").doc(uidLost).get();
    if (!lostDoc.exists) return res.status(404).json({ error: "Lost item not found." });
    const lostItem = lostDoc.data();

    const foundSnapshot = await db.collection("foundItems").where("category", "==", lostItem.category).get();
    const matches = [];

    for (const foundDoc of foundSnapshot.docs) {
      const foundItem = foundDoc.data();
      if (["claimed", "pending", "canceled"].includes(foundItem.status) || foundItem.archivedStatus) continue;

      const lostUrls = Array.isArray(lostItem.images) ? lostItem.images : [lostItem.images];
      const foundUrls = Array.isArray(foundItem.images) ? foundItem.images : [foundItem.images];
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
    const filteredMatches = matches.filter(m => m.scores.overallScore >= 60);
    res.json(filteredMatches);
  } catch (error) {
    console.error("Error in /api/match/lost-to-found:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

// --- API: Send Email ---
app.post("/api/send-email", async (req, res) => {
  try {
    const { to, subject, html } = req.body;

    

    const { data, error } = await resend.emails.send({
      from: "Spotsync <Onboarding@spotsync.site>",
      to,
      subject,
      html,
    });
    if (error) return res.status(500).json({ error });
    res.json({ success: true, data });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: err.message });
  }
});

// --- Start Server ---
const PORT = 4000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

