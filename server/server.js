import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import sharp from "sharp";
import { 
  db, 
  resend, 
  openai, 
  auth,                
  realtimeDB,       
  rtdbServerTimestamp  
} from "./firebaseAdmin.js";import session from "express-session";
import { auth } from "./firebaseAdmin.js";

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
  if (!vecA || !vecB || !vecA.length || !vecB.length) return 0; // no similarity if empty
  const dot = vecA.reduce((sum, val, i) => sum + val * vecB[i], 0);
  const normA = Math.sqrt(vecA.reduce((sum, val) => sum + val * val, 0));
  const normB = Math.sqrt(vecB.reduce((sum, val) => sum + val * val, 0));
  if (normA === 0 || normB === 0) return 0; // avoid division by zero
  return dot / (normA * normB);
}

// --- Middleware to check Firebase auth token ---
async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await auth.verifyIdToken(token);
    req.user = decodedToken; // Adds user (with uid) to the request
    next();
  } catch (error) {
    console.error("Error verifying token:", error);
    res.status(401).json({ error: 'Unauthorized' });
  }
}

// --- Realtime DB Notifier ---
async function notifyUser(uid, message, type = "item") {
  if (!uid) return;
  try {
    const notifRef = realtimeDB.ref(`notifications/${uid}`);
    const newNotifRef = notifRef.push();
    await newNotifRef.set({
      message,
      timestamp: rtdbServerTimestamp,
      type,
      read: false,
    });
    console.log(`Notification sent to ${uid}`);
  } catch (error) {
    console.error(`Failed to send notification to ${uid}:`, error);
  }
}

// --- Text Embeddings (Used for CREATING items, not matching) ---
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

// --- Image Embeddings (Used for CREATING items, not matching) ---
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

// --- Compare Images (No longer used by calculateMatchScore) ---
// You can remove this function if it's not used elsewhere.
// async function compareImagesWithFilter(lostUrls, foundUrls) {
//   let bestScore = 0;
//   for (const lostUrl of lostUrls) {
//     const lostEmb = await getImageEmbedding(lostUrl);
//     if (!lostEmb.length) continue;
//     for (const foundUrl of foundUrls) {
//       const foundEmb = await getImageEmbedding(foundUrl);
//       if (!foundEmb.length) continue;
//       const score = Math.max(0, Math.min(100, cosineSimilarity(lostEmb, foundEmb) * 100));
//       if (score > bestScore) bestScore = score;
//     }
//   }
//   return bestScore;
// }

// --- Calculate Match Score (FAST, NON-ASYNC VERSION) ---
// This function now expects items to already have embedding fields
function calculateMatchScore(lostItem, foundItem) {
  // Read pre-calculated embeddings directly from the objects
  const nameScore = cosineSimilarity(
    lostItem.nameEmbedding || [],
    foundItem.nameEmbedding || []
  ) * 100;

  const descScore = cosineSimilarity(
    lostItem.descriptionEmbedding || [],
    foundItem.descriptionEmbedding || []
  ) * 100;
  
  const locationScore = cosineSimilarity(
    lostItem.locationEmbedding || [],
    foundItem.locationEmbedding || []
  ) * 100;

  const categoryMatch =
    lostItem.category?.toLowerCase() === foundItem.category?.toLowerCase()
      ? 100
      : 0;

  const overallTextScore =
    nameScore * 0.5 + descScore * 0.3 + locationScore * 0.1 + categoryMatch * 0.1;

  // --- FASTER IMAGE SCORING ---
  // This is now just comparing arrays, not calling OpenAI
  let bestImageScore = 0;
  const lostImageEmbeddings = lostItem.imageEmbeddings || [];
  const foundImageEmbeddings = foundItem.imageEmbeddings || [];

  if (lostImageEmbeddings.length && foundImageEmbeddings.length) {
    for (const lostEmb of lostImageEmbeddings) {
      for (const foundEmb of foundImageEmbeddings) {
        const score = Math.max(0, Math.min(100, cosineSimilarity(lostEmb, foundEmb) * 100));
        if (score > bestImageScore) bestImageScore = score;
      }
    }
  }
  
  const overallScore = overallTextScore * 0.4 + bestImageScore * 0.6;
  
  const toPct = (v) => (isNaN(v) ? 0 : parseFloat(v.toFixed(2)));

  return {
    nameScore: toPct(nameScore),
    descriptionScore: toPct(descScore),
    locationScore: toPct(locationScore),
    categoryScore: toPct(categoryMatch),
    overallTextScore: toPct(overallTextScore),
    imageScore: toPct(bestImageScore),
    overallScore: toPct(overallScore),
  };
}


// --- API: Found-to-Lost (UPGRADED) ---
// --- API: ALL-IN-ONE REPORT LOST ITEM ---
app.post("/api/report-lost-item", verifyToken, async (req, res) => {
  try {
    // 1. Get Data and User
    const { itemName, dateLost, locationLost, category, itemDescription, howItemLost, images } = req.body;
    const uid = req.user.uid;
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) return res.status(404).json({ error: "User not found." });
    const userData = userDoc.data();

    console.log(`[${uid}] Creating embeddings for LOST item: ${itemName}`);
    // 2. Calculate All Embeddings
    const nameEmbedding = await getTextEmbedding(itemName || "");
    const descriptionEmbedding = await getTextEmbedding(itemDescription || "");
    const locationEmbedding = await getTextEmbedding(locationLost || "");
    const imageEmbeddings = [];
    if (images && images.length > 0) {
      for (const url of images) {
        const imgEmb = await getImageEmbedding(url);
        if (imgEmb.length) imageEmbeddings.push(imgEmb);
      }
    }
    console.log(`[${uid}] Embeddings created.`);

    // 3. Save to lostItems (with embeddings)
    const customItemId = generateItemId();
    const isoTimestamp = new Date().toISOString();
    const firestoreTimestamp = new Date(); // Use server timestamp

    const lostItemData = {
      itemId: customItemId,
      uid: uid,
      images: images || [],
      itemName, dateLost, locationLost,
      archivedStatus: false,
      founder: 'Unknown',
      owner: `${userData.firstName || ''} ${userData.lastName || ''}`,
      claimStatus: 'unclaimed',
      category, itemDescription, howItemLost,
      status: 'posted',
      personalInfo: userData,
      createdAt: firestoreTimestamp, // Use Firestore timestamp
      // --- The new, fast fields ---
      nameEmbedding,
      descriptionEmbedding,
      locationEmbedding,
      imageEmbeddings
    };
    
    const lostItemRef = await db.collection('lostItems').add(lostItemData);
    const lostItemId = lostItemRef.id;
    console.log(`[${uid}] Lost item ${lostItemId} saved.`);

    // 4. Run Matching
    const foundSnapshot = await db.collection("foundItems").where("category", "==", category).get();
    const matches = [];
    const batch = db.batch();

    for (const foundDoc of foundSnapshot.docs) {
      const foundItem = foundDoc.data();
      if (["claimed", "pending", "canceled"].includes(foundItem.status) || foundItem.archivedStatus) continue;
      const scores = calculateMatchScore(lostItemData, foundItem); 
      const matchData = {
        transactionId: generateTransactionId(),
        itemId: generateItemId(),
        lostItem: { ...lostItemData, id: lostItemId },
        foundItem: { ...foundItem, id: foundDoc.id },
        scores,
        createdAt: isoTimestamp
      };
      const newMatchRef = db.collection("matches").doc();
      batch.set(newMatchRef, matchData);
      matches.push(matchData);
    }
    await batch.commit();

    matches.sort((a, b) => b.scores.overallScore - a.scores.overallScore);
    const top4Matches = matches.filter(m => m.scores.overallScore >= 60).slice(0, 4);

    // 5. Save to itemManagement
    const createdItemManagementData = {
      itemId: customItemId,
      uid: uid,
      images: images || [],
      archivedStatus: false,
      itemName,
      dateSubmitted: isoTimestamp,
      itemDescription,
      type: "Lost",
      locationLost,
      category,
      status: "Posted",
      highestMatchingRate: top4Matches?.[0]?.scores?.overallScore ?? 0,
      topMatches: top4Matches,
      personalInfo: userData,
      createdAt: firestoreTimestamp,
    };
    await db.collection('itemManagement').add(createdItemManagementData);
    console.log(`[${uid}] ItemManagement record created.`);

    // 6. Send Notifications
    for (const match of top4Matches) {
      if (match.foundItem?.uid) {
        await notifyUser(
          match.foundItem.uid,
          `Your found item <b>${match.foundItem.itemName}</b> may possibly match a newly reported lost item: <b>${itemName}</b>.`,
          "item"
        );
        if (match.foundItem?.personalInfo?.email) {
          await resend.emails.send({
            from: "Spotsync <Onboarding@spotsync.site>",
            to: match.foundItem.personalInfo.email,
            subject: "Potential Match for Your Found Item",
            html: `<p>Hello,</p><p>Your found item <b>${match.foundItem.itemName}</b> may match a reported lost item: <b>${itemName}</b>.</p><p>Please log in to check details.</p>`,
          });
        }
      }
    }
    if (top4Matches.length > 0) {
      const topMatch = top4Matches[0];
      await notifyUser(
        uid,
        `Hello ${userData.firstName}, we found a possible match for your lost item <b>${itemName}</b>: Found item <b>${topMatch.foundItem?.itemName}</b>. Please check your matches.`,
        "item"
      );
      if (userData.email) {
        await resend.emails.send({
          from: "Spotsync <Onboarding@spotsync.site>",
          to: userData.email,
          subject: "Potential Match Found for Your Lost Item!",
          html: `<p>Hello ${userData.firstName},</p><p>We found a potential match for your lost item <b>${itemName}</b>: Found item <b>${topMatch.foundItem?.itemName}</b>.</p><p>Please log in to view more details and verify.</p>`,
        });
      }
    } else {
      await notifyUser(
        uid,
        `Hello <b>${userData.firstName}</b>, your lost item report for <b>${itemName}</b> has been submitted and posted. We'll notify you if a potential match is found.`,
        "item"
      );
    }
    console.log(`[${uid}] Notifications sent.`);

    // 7. Return final data to client
    res.status(201).json(createdItemManagementData);

  } catch (error) {
    console.error("Error in /api/report-lost-item:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});


// --- API: ALL-IN-ONE REPORT FOUND ITEM ---
app.post("/api/report-found-item", verifyToken, async (req, res) => {
  try {
    // 1. Get Data and User
    const { itemName, dateFound, locationFound, category, itemDescription, howItemFound, images } = req.body;
    const uid = req.user.uid;
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) return res.status(404).json({ error: "User not found." });
    const userData = userDoc.data();

    console.log(`[${uid}] Creating embeddings for FOUND item: ${itemName}`);
    // 2. Calculate All Embeddings
    const nameEmbedding = await getTextEmbedding(itemName || "");
    const descriptionEmbedding = await getTextEmbedding(itemDescription || "");
    const locationEmbedding = await getTextEmbedding(locationFound || "");
    const imageEmbeddings = [];
    if (images && images.length > 0) {
      for (const url of images) {
        const imgEmb = await getImageEmbedding(url);
        if (imgEmb.length) imageEmbeddings.push(imgEmb);
      }
    }
    console.log(`[${uid}] Embeddings created.`);

    // 3. Save to foundItems (with embeddings)
    const customItemId = generateItemId();
    const isoTimestamp = new Date().toISOString();
    const firestoreTimestamp = new Date(); // Use server timestamp

    const foundItemData = {
      itemId: customItemId,
      uid: uid,
      images: images || [],
      itemName, dateFound, locationFound,
      archivedStatus: false,
      remindersSent: [],
      founder: `${userData.firstName || ''} ${userData.lastName || ''}`,
      owner: 'Unknown',
      claimStatus: 'unclaimed',
      category, itemDescription, howItemFound,
      status: 'pending', // Found items start as pending
      personalInfo: userData,
      createdAt: firestoreTimestamp,
      // --- The new, fast fields ---
      nameEmbedding,
      descriptionEmbedding,
      locationEmbedding,
      imageEmbeddings
    };
    
    const foundItemRef = await db.collection('foundItems').add(foundItemData);
    const foundItemId = foundItemRef.id;
    console.log(`[${uid}] Found item ${foundItemId} saved.`);

    // 4. Run Matching
    const lostSnapshot = await db.collection("lostItems").where("category", "==", category).get();
    const matches = [];
    const batch = db.batch();

    for (const lostDoc of lostSnapshot.docs) {
      const lostItem = lostDoc.data();
      if (["claimed", "pending", "canceled"].includes(lostItem.status) || lostItem.archivedStatus) continue;
      const scores = calculateMatchScore(lostItem, foundItemData);
      const matchData = {
        transactionId: generateTransactionId(),
        itemId: generateItemId(),
        lostItem: { ...lostItem, id: lostDoc.id },
        foundItem: { ...foundItemData, id: foundItemId },
        scores,
        createdAt: isoTimestamp
      };
      const newMatchRef = db.collection("matches").doc();
      batch.set(newMatchRef, matchData);
      matches.push(matchData);
    }
    await batch.commit();

    matches.sort((a, b) => b.scores.overallScore - a.scores.overallScore);
    const top4Matches = matches.filter(m => m.scores.overallScore >= 60).slice(0, 4);

    // 5. Save to itemManagement
    const createdItemManagementData = {
      itemId: customItemId,
      uid: uid,
      images: images || [],
      archivedStatus: false,
      itemName,
      dateSubmitted: isoTimestamp,
      itemDescription,
      type: "Found",
      locationFound,
      category,
      status: "Pending", // Match the found item status
      highestMatchingRate: top4Matches?.[0]?.scores?.overallScore ?? 0,
      topMatches: top4Matches,
      personalInfo: userData,
      createdAt: firestoreTimestamp,
    };
    await db.collection('itemManagement').add(createdItemManagementData);
    console.log(`[${uid}] ItemManagement record created.`);

    // 6. Send Notifications (Only to the finder)
    await notifyUser(
      uid,
      `Hello <b>${userData.firstName}</b> Your found item <b>${itemName}</b> has been submitted. Please surrender it to the OSA for verification. The item is currently pending.`,
      "item"
    );
    if (userData.email) {
      await resend.emails.send({
        from: "Spotsync <Onboarding@spotsync.site>",
        to: userData.email,
        subject: "Instructions for Found Items",
        html: `<p>Hello ${userData.firstName},</p><p>Your found item <b>${itemName}</b> has been submitted.</p><p>Please surrender it to the OSA for verification.</p><p>The item is currently on pending status.</p>`,
      });
    }
    console.log(`[${uid}] Finder notifications sent.`);

    // 7. Return final data to client
    res.status(201).json(createdItemManagementData);

  } catch (error) {
    console.error("Error in /api/report-found-item:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

// --- API: Send Email ---
app.post("/api/send-email", async (req, res) => {
  try {
    const { to, subject, html } = req.body;

    const wrappedHtml = `
      <div style="font-family: Arial, sans-serif; text-align: center; background-color: #f9f9f9; padding: 20px;">
                <img 
          src="https://server.spotsync.site/Email-Header.png" 
          alt="SpotSync Header" 
          style="max-width: 100%; height: auto; margin-bottom: 20px;" 
        />

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
              <button type"submit">Delete Admin</button>
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
D }
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