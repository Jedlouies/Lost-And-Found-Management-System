import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import sharp from "sharp";
import { db, resend, openai } from "./firebaseAdmin.js";
import { v4 as uuidv4 } from "uuid";
import session from "express-session";
import bcrypt from "bcrypt";
import { auth } from "./firebaseAdmin.js"; // make sure firebaseAdmin.js exports both

// --- Server Setup ---
const app = express();
app.use(express.json());
app.use(express.static("public"));

app.use(express.urlencoded({ extended: true }));
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
  if (!vecA.length || !vecB.length) return 0; // no similarity if empty
  const dot = vecA.reduce((sum, val, i) => sum + val * vecB[i], 0);
  const normA = Math.sqrt(vecA.reduce((sum, val) => sum + val * val, 0));
  const normB = Math.sqrt(vecB.reduce((sum, val) => sum + val * val, 0));
  if (normA === 0 || normB === 0) return 0; // avoid division by zero
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
    const visionRes = await openai.chat.completions.create({
      model: "gpt-4o-mini",
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

async function detectObjects(url) {
  return [url]; // placeholder
}

// --- Check Relevance ---
async function isRelevantObject(itemName, detectedObjects) {
  const itemEmb = await getTextEmbedding(itemName);
  for (const obj of detectedObjects) {
    const objEmb = await getTextEmbedding(obj);
    const sim = cosineSimilarity(itemEmb, objEmb);
    if (sim >= 0.5) return true;
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
  const nameScore = cosineSimilarity(
    await getTextEmbedding(lostItem.itemName || ""),
    await getTextEmbedding(foundItem.itemName || "")
  ) * 100;

  const descScore = cosineSimilarity(
    await getTextEmbedding(lostItem.itemDescription || ""),
    await getTextEmbedding(foundItem.itemDescription || "")
  ) * 100;

  const locationScore = cosineSimilarity(
    await getTextEmbedding(lostItem.locationLost || ""),
    await getTextEmbedding(foundItem.locationFound || "")
  ) * 100;

  const categoryMatch =
    lostItem.category?.toLowerCase() === foundItem.category?.toLowerCase()
      ? 100
      : 0;

  const overallTextScore =
    nameScore * 0.5 + descScore * 0.3 + locationScore * 0.1 + categoryMatch * 0.1;

  const lostUrls = Array.isArray(lostItem.images) ? lostItem.images : [lostItem.images].filter(Boolean);
  const foundUrls = Array.isArray(foundItem.images) ? foundItem.images : [foundItem.images].filter(Boolean);
  const imageScore = await compareImagesWithFilter(lostUrls, foundUrls);

  const overallScore = overallTextScore * 0.4 + imageScore * 0.6;

  const toPct = (v) => (isNaN(v) ? 0 : parseFloat(v.toFixed(2)));

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

    const wrappedHtml = `
      <div style="font-family: Arial, sans-serif; text-align: center; background-color: #f9f9f9; padding: 20px;">
        <!-- Header -->
        <img 
          src="https://server.spotsync.site/Email-Header.png" 
          alt="SpotSync Header" 
          style="max-width: 100%; height: auto; margin-bottom: 20px;" 
        />

        <!-- Dynamic Content -->
        <div style="background: white; padding: 25px; border-radius: 10px; margin: 0 auto; max-width: 600px;">
          ${html}
        </div>

        <p style="font-size: 12px; color: #888; margin-top: 10px;">
          &copy; ${new Date().getFullYear()} SpotSync. All rights reserved.
        </p>
      </div>
    `;

    const { data, error } = await resend.emails.send({
      from: "SpotSync <Onboarding@spotsync.site>",
      to,
      subject,
      html: wrappedHtml, 
    });

    if (error) return res.status(500).json({ error });
    res.json({ success: true, data });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.use(
  session({
    secret: "supersecretkey",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

// --- Middleware to check admin auth ---
function requireLogin(req, res, next) {
  if (req.session && req.session.isAdmin) {
    return next();
  }
  return res.status(401).send("Unauthorized");
}

// --- Login Route ---
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (username === "admin" && password === "admin123") {
    req.session.isAdmin = true;
    res.redirect("/server");
  } else {
    res.status(401).send("Invalid credentials");
  }
});

// --- Admin Dashboard Route ---
app.get("/server", requireLogin, async (req, res) => {
  try {
    const snapshot = await db.collection("users").where("role", "==", "admin").get();
    const admins = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    let tableRows = admins.map(
      (a, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${a.email || "N/A"}</td>
          <td>${a.firstName || ""} ${a.lastName || ""}</td>
          <td>${a.contactNumber}</td>
          <td>
            <form method="POST" action="/server/delete-admin">
              <input type="hidden" name="userId" value="${a.id}" />
              <button type="submit">Delete Admin</button>
            </form>
          </td>
        </tr>
      `
    ).join("");

    res.send(`
      <h2>Admin Dashboard</h2>
      <a href="/logout"><button>Logout</button></a>
      <br/><br/>
      <table border="1" cellpadding="5" cellspacing="0">
        <thead>
          <tr>
            <th>#</th>
            <th>Email</th>
            <th>Name</th>
            <th>Contact Number</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows || "<tr><td colspan='4'>No admins found</td></tr>"}
        </tbody>
      </table>

      <h3>Create Admin</h3>
      <form method="POST" action="/server/create-admin">
        <input type="text" name="studentId" placeholder="Enter User ID" required />
        <input type="password" name="password" placeholder="Enter Password" required />
        <button type="submit">Create Admin</button>
      </form>
    `);

  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).send("Error loading dashboard");
  }
});

app.post("/server/create-admin", requireLogin, async (req, res) => {
  try {
    const { studentId, password } = req.body;

    if (!studentId || !password) {
      return res.status(400).send("Student ID and password are required.");
    }

    const userRecord = await auth.createUser({
      password: password,
    });

    await db.collection("users").doc(userRecord.uid).set({
      uid: userRecord.uid,
      email: userRecord.email,
      studentId,
      role: "admin",
      contactNumber: "",
      firstName: "",
      lastName: "",
      profileURL: "",
      coverURL: "",
      designation: "",
      address: "",
      yearsOfService: "",
      middleName: "",
      gender: "",
      educationalAttainment: "",
      bio: "",
      createdAt: new Date().toISOString(),
    });

    await db.collection("studentIndex").doc(String(studentId)).set({
      uid: userRecord.uid,
    });

    res.send(`
      <h2>Admin Created</h2>
      <p>Admin ${studentId}</p>
      <a href="/server">Back to Dashboard</a>
    `);

  } catch (err) {
    console.error("Error creating admin:", err);
    res.status(500).send("Error creating admin: " + err.message);
  }
});

// --- Delete Admin ---
app.post("/server/delete-admin", requireLogin, async (req, res) => {
  try {
    const { userId } = req.body;
    await db.collection("users").doc(userId).update({ role: "user" });
    res.send(`
      <h2> Admin Deleted</h2>
      <a href="/server">Back to Dashboard</a>
    `);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Logout Route ---
app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).send("Could not log out.");
    }
    res.clearCookie("connect.sid");
    res.redirect("/");
  });
});

// --- Root Route ---
app.get("/", (req, res) => {
  res.send(`
    <h2>Spotsync Server</h2>
    <form method="POST" action="/login">
      <input type="text" name="username" placeholder="Username" />
      <br/>
      <input type="password" name="password" placeholder="Password" />
      <br/>
      <button type="submit">Login</button>
    </form>
  `);
});

// ------------------ Reminders ------------------

function toMillis(createdAt) {
  if (!createdAt) return null;
  if (typeof createdAt === "object" && typeof createdAt.toMillis === "function") {
    try { return createdAt.toMillis(); } catch (e) {}
  }
  if (typeof createdAt === "object" && typeof createdAt.seconds === "number") {
    return createdAt.seconds * 1000 + (createdAt.nanoseconds ? Math.floor(createdAt.nanoseconds / 1e6) : 0);
  }
  if (typeof createdAt === "number") return createdAt;
  const parsed = Date.parse(String(createdAt));
  return isNaN(parsed) ? null : parsed;
}

const THRESHOLDS = [
  { key: 24, label: "24 hours remaining", ms: 24 * 60 * 60 * 1000 },
  { key: 1, label: "1 hour remaining", ms: 1 * 60 * 60 * 1000 },
  { key: 0.5, label: "30 minutes remaining", ms: 30 * 60 * 1000 },
];

async function checkFoundItems() {
  try {
    const snapshot = await db.collection("foundItems").get();
    const now = Date.now();

    console.log(`[checkFoundItems] ${snapshot.size} foundItems loaded at ${new Date(now).toISOString()}`);

    for (const doc of snapshot.docs) {
      const id = doc.id;
      const item = doc.data();

      // Skip invalid or non-pending items
      if (!item || item.status !== "pending") continue;
      if (!item.createdAt) {
        console.warn(`[checkFoundItems] doc ${id} missing createdAt, skipping`);
        continue;
      }

      const createdMs = toMillis(item.createdAt);
      if (!createdMs) {
        console.warn(`[checkFoundItems] doc ${id} has invalid createdAt (${JSON.stringify(item.createdAt)})`);
        continue;
      }

      const deadlineMs = createdMs + 24 * 60 * 60 * 1000;
      const timeRemainingMs = deadlineMs - now;
      const hoursElapsed = (now - createdMs) / (1000 * 60 * 60);
      const hoursRemaining = timeRemainingMs / (1000 * 60 * 60);

      let remindersSent = Array.isArray(item.remindersSent) ? item.remindersSent.slice() : [];

      console.log(`[checkFoundItems] ${id} email=${item.personalInfo?.email || "N/A"} status=${item.status} hoursElapsed=${hoursElapsed.toFixed(3)} hoursRemaining=${hoursRemaining.toFixed(3)} remindersSent=${JSON.stringify(remindersSent)}`);

      // ========== SEND REMINDERS ==========
      for (const t of THRESHOLDS) {
        try {
          if (timeRemainingMs <= t.ms && !remindersSent.includes(t.key)) {
            const reminderMessage = `You have ${t.label} to confirm your found item.`;

            if (item.personalInfo?.email) {
              console.log(`[checkFoundItems] Sending "${t.label}" reminder for ${id} to ${item.personalInfo.email}`);
              try {
                await resend.emails.send({
                  from: "Spotsync <Onboarding@spotsync.site>",
                  to: item.personalInfo.email,
                  subject: `Reminder: ${t.label}`,
                  html: `<p>${reminderMessage}</p><p>Item: ${item.itemName || "N/A"}</p><p>Posted: ${new Date(createdMs).toISOString()}</p>`,
                });
                console.log(`[checkFoundItems] Email sent for ${id} (${t.key})`);
              } catch (sendErr) {
                console.error(`[checkFoundItems] Email send failed for ${id} (${t.key}):`, sendErr);
                continue;
              }
            } else {
              console.warn(`[checkFoundItems] doc ${id} has no personalInfo.email; skipping send for ${t.key}`);
            }

            remindersSent.push(t.key);
            await db.collection("foundItems").doc(id).update({ remindersSent });
            console.log(`[checkFoundItems] updated remindersSent for ${id}: ${JSON.stringify(remindersSent)}`);
          }
        } catch (innerErr) {
          console.error(`[checkFoundItems] error handling threshold ${t.key} for ${id}:`, innerErr);
        }
      }

      // ========== AUTO-CANCEL AFTER 24 HOURS ==========
      if (timeRemainingMs <= 0 && item.status === "pending") {
        try {
          const foundRef = db.collection("foundItems").doc(id);
          await foundRef.update({ status: "cancelled" });
          console.log(`[checkFoundItems] Auto-cancelled found item ${id}`);

          // Only update itemManagement if the status actually changed
          const imRef = db.collection("itemManagement").doc(id);
          const imDoc = await imRef.get();
          if (imDoc.exists && imDoc.data().status !== "cancelled") {
            await imRef.update({ status: "cancelled" });
            console.log(`[checkFoundItems] itemManagement status updated to "cancelled" for ${id}`);
          }
        } catch (cancelErr) {
          console.error(`[checkFoundItems] Failed to auto-cancel ${id}:`, cancelErr);
        }
      }
    }

  } catch (err) {
    console.error("[checkFoundItems] full job error:", err);
  }
}

// Run once at startup, then every 5 minutes
checkFoundItems().catch(e => console.error("Initial checkFoundItems error:", e));
const CHECK_INTERVAL_MS = 5 * 60 * 1000;
setInterval(checkFoundItems, CHECK_INTERVAL_MS);

// --- Start Server ---
const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
