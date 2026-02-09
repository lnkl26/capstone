import {
  userReady,
  db,
  doc,
  setDoc,
  serverTimestamp
} from "../firebase.js";

import {
  getDoc,
  addDoc,
  collection,
  query,
  where,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  updateDoc
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

//share code creation
function makeCode(len = 6) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

async function ensureShareCode(uid) {
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);

  let shareCode = snap.exists() ? snap.data().shareCode : null;

  if (!shareCode) {
    shareCode = makeCode();

    await setDoc(
      userRef,
      { shareCode, updatedAt: serverTimestamp() },
      { merge: true }
    );

    await setDoc(doc(db, "shareCodes", shareCode), {
      uid,
      createdAt: serverTimestamp()
    });
  }

  return shareCode;
}

//send/accept/decline
function setStatus(msg, isError = false) {
  const s = document.getElementById("status");
  if (!s) return;
  s.textContent = msg;
  s.style.color = isError ? "crimson" : "";
}

async function uidFromShareCode(code) {
  const cleaned = (code || "").trim().toUpperCase();
  if (!cleaned) return null;
  const snap = await getDoc(doc(db, "shareCodes", cleaned));
  if (!snap.exists()) return null;

  return snap.data().uid;
}

async function sendInvite(fromUid, toUid) {
  if (fromUid === toUid) throw new Error("You can’t invite yourself.");

  //prevent duplicate pending invites
  const dupQ = query(
    collection(db, "invites"),
    where("fromUid", "==", fromUid),
    where("toUid", "==", toUid),
    where("status", "==", "pending"),
    limit(1)
  );

  const dupSnap = await getDocs(dupQ);
  if (!dupSnap.empty) throw new Error("Invite already pending for this user.");

  await addDoc(collection(db, "invites"), {
    fromUid,
    toUid,
    status: "pending",
    createdAt: serverTimestamp()
  });
}

async function acceptInvite(inviteId, invite) {
  const ownerUid = invite.toUid;   //receiver
  const viewerUid = invite.fromUid; //sender

//get the owners profile to find their name
  const ownerSnap = await getDoc(doc(db, "users", ownerUid));
  const ownerName = ownerSnap.exists() ? (ownerSnap.data().displayName || "Unknown User") : "Unknown User";

  //permission doc under OWNER
  //users/{ownerUid}/shares/{viewerUid}
  await setDoc(doc(db, "users", ownerUid, "shares", viewerUid), {
    role: "viewer",
    createdAt: serverTimestamp()
  });

  //optional reverse index under VIEWER
  //users/{viewerUid}/sharedWith/{ownerUid}
  await setDoc(doc(db, "users", viewerUid, "sharedWith", ownerUid), {
    role: "viewer",
    ownerName: ownerName,
    createdAt: serverTimestamp()
  });

  //mark invite accepted
  await updateDoc(doc(db, "invites", inviteId), {
    status: "accepted",
    respondedAt: serverTimestamp()
  });
}
async function declineInvite(inviteId) {
  await updateDoc(doc(db, "invites", inviteId), {
    status: "declined",
    respondedAt: serverTimestamp()
  });
}
//ui render incoming invites

function renderIncomingInvites(invites) {
  const container = document.getElementById("incomingInvites");
  if (!container) return;

  if (invites.length === 0) {
    container.classList.add("empty");
    container.innerHTML = "No invites yet.";
    return;
  }

  container.classList.remove("empty");
  container.innerHTML = "";

  invites.forEach(({ id, data }) => {
    const row = document.createElement("div");
    row.style.display = "grid";
    row.style.gridTemplateColumns = "1fr auto";
    row.style.alignItems = "center";
    row.style.gap = "10px";
    row.style.padding = "10px 0";
    row.style.borderBottom = "1px solid #eee";

    const left = document.createElement("div");
    left.innerHTML = `
      <strong>Invite request</strong>
      <div style="opacity:.8;">From: ${data.fromUid.slice(0, 6)}…</div>
    `;

    const right = document.createElement("div");
    right.style.display = "flex";
    right.style.gap = "8px";

    const acceptBtn = document.createElement("button");
    acceptBtn.className = "pop-button";
    acceptBtn.textContent = "Accept";
    acceptBtn.style.margin = "0";

    const declineBtn = document.createElement("button");
    declineBtn.className = "pop-button";
    declineBtn.textContent = "Decline";
    declineBtn.style.margin = "0";
    declineBtn.style.background = "#fee";

    acceptBtn.addEventListener("click", async () => {
      try {
        acceptBtn.disabled = true;
        declineBtn.disabled = true;
        await acceptInvite(id, data);
        setStatus("Invite accepted. Sharing enabled!");
      } catch (e) {
        setStatus(e.message || "Accept failed.", true);
      } finally {
        acceptBtn.disabled = false;
        declineBtn.disabled = false;
      }
    });

    declineBtn.addEventListener("click", async () => {
      try {
        acceptBtn.disabled = true;
        declineBtn.disabled = true;
        await declineInvite(id);
        setStatus("Invite declined.");
      } catch (e) {
        setStatus(e.message || "Decline failed.", true);
      } finally {
        acceptBtn.disabled = false;
        declineBtn.disabled = false;
      }
    });

    right.appendChild(acceptBtn);
    right.appendChild(declineBtn);

    row.appendChild(left);
    row.appendChild(right);
    container.appendChild(row);
  });
}

function listenForIncomingInvites(myUid) {
  const qInv = query(
    collection(db, "invites"),
    where("toUid", "==", myUid),
    where("status", "==", "pending"),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(qInv, (snap) => {
    const invites = snap.docs.map(d => ({ id: d.id, data: d.data() }));
    renderIncomingInvites(invites);
  });
}
//main bootstrap

(async () => {
  const user = await userReady;

  const saveBtn = document.getElementById("saveProfile");
  const nameInput = document.getElementById("displayName");

  //load existing name if it exists
  const userSnap = await getDoc(doc(db, "users", user.uid));
  if (userSnap.exists() && userSnap.data().displayName) {
    nameInput.value = userSnap.data().displayName;
  }

  if (saveBtn){
    saveBtn.addEventListener("click", async () => {
    try {
    const newName = nameInput.value.trim();
        if (!newName) {
          setStatus("Please enter a name.", true);
          return;
        }
        //update the user document with the display name
        await setDoc(doc(db, "users", user.uid), {
          displayName: newName,
          updatedAt: serverTimestamp()
        }, { merge: true });

        setStatus("Profile saved!");
      } catch (e) {
        setStatus(e.message || "Save failed.", true);
      }
  });
  }

  //show/share code
  const code = await ensureShareCode(user.uid);
  const shareCodeInput = document.getElementById("shareCode");
  if (shareCodeInput) shareCodeInput.value = code;

  //send invite button
  const sendBtn = document.getElementById("sendInvite");
  if (sendBtn) {
    sendBtn.addEventListener("click", async () => {
    try {
        const codeEntered = document.getElementById("otherShareCode")?.value || "";
        const targetUid = await uidFromShareCode(codeEntered);

        if (!targetUid) {
          setStatus("No user found for that share code.", true);
          return;
        }
        await sendInvite(user.uid, targetUid);
        setStatus("Invite sent!");
        const otherInput = document.getElementById("otherShareCode");
        if (otherInput) otherInput.value = "";
      } catch (e) {
        setStatus(e.message || "Invite failed.", true);
     }
    });
  }
  //live incoming invite list
  listenForIncomingInvites(user.uid);
})();