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
  updateDoc,
  deleteDoc
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

async function sendInvite(fromUid, fromName, toUid, toName, role) {
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
    fromName,
    toUid,
    toName,
    role,
    status: "pending",
    createdAt: serverTimestamp()
  });
}

async function acceptInvite(inviteId, invite) {
  const ownerUid = invite.toUid;   //receiver
  const viewerUid = invite.fromUid; //sender
  const viewerName = invite.fromName || "Unknown User";

//get the owners profile to find their name
  const ownerSnap = await getDoc(doc(db, "users", ownerUid));
  const ownerName = ownerSnap.exists() ? (ownerSnap.data().displayName || "Unknown User") : "Unknown User";

  //permission doc under OWNER
  //users/{ownerUid}/shares/{viewerUid}
  await setDoc(doc(db, "users", ownerUid, "shares", viewerUid), {
    role: invite.role,
    userName: viewerName,
    createdAt: serverTimestamp()
  });

  //optional reverse index under VIEWER
  //users/{viewerUid}/sharedWith/{ownerUid}
  await setDoc(doc(db, "users", viewerUid, "sharedWith", ownerUid), {
    role: invite.role,
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

//manage active shares
function listenForActiveShares(myUid) {
  const q = collection(db, "users", myUid, "shares");
  onSnapshot(q, (snap) => {
    const container = document.getElementById("activeShares");
    if (!container) return;
    if (snap.empty) {
      container.innerHTML = "No one has access yet.";
      return;
    }
    container.innerHTML = "";
    snap.docs.forEach(d => {
      const data = d.data();
      const div = document.createElement("div");
      div.className = "entry";
      div.style.display = "flex";
      div.style.justifyContent = "space-between";
      div.style.alignItems = "center";
      div.style.padding = "8px 0";
      div.style.borderBottom = "1px solid #eee";
      div.innerHTML = `
        <span><strong>${data.userName}</strong> (${data.role})</span>
        <div style="display:flex; gap:5px;">
          <select class="input" style="padding:2px;" onchange="updatePermission('${myUid}', '${d.id}', this.value)">
            <option value="viewer" ${data.role === 'viewer' ? 'selected' : ''}>Viewer</option>
            <option value="editor" ${data.role === 'editor' ? 'selected' : ''}>Editor</option>
          </select>
          <button class="button" style="padding:2px 8px; font-size:12px; background:crimson;" onclick="removeShare('${myUid}', '${d.id}')">Revoke</button>
        </div>
      `;
      container.appendChild(div);
    });
  });
}

//manage accounts shared with me
function listenForSharedWithMe(myUid) {
  const q = collection(db, "users", myUid, "sharedWith");
  onSnapshot(q, (snap) => {
    const container = document.getElementById("sharedWithMe");
    if (!container) return;
    if (snap.empty) {
      container.innerHTML = "No one is sharing with you.";
      return;
    }
    container.innerHTML = "";
    snap.docs.forEach(d => {
      const data = d.data();
      const div = document.createElement("div");
      div.className = "entry";
      div.style.display = "flex";
      div.style.justifyContent = "space-between";
      div.style.alignItems = "center";
      div.style.padding = "8px 0";
      div.style.borderBottom = "1px solid #eee";
      div.innerHTML = `
        <span><strong>${data.ownerName}</strong> (${data.role})</span>
        <button class="button" style="padding:2px 8px; font-size:12px; background:crimson;" onclick="leaveShare('${myUid}', '${d.id}')">Stop Receiving</button>
      `;
      container.appendChild(div);
    });
  });
}

//manage pending sent invites
function listenForSentInvites(myUid) {
  const q = query(
    collection(db, "invites"),
    where("fromUid", "==", myUid),
    where("status", "==", "pending"),
    orderBy("createdAt", "desc")
  );
  onSnapshot(q, (snap) => {
    const container = document.getElementById("sentInvites");
    if (!container) return;
    if (snap.empty) {
      container.innerHTML = "No pending sent invites.";
      return;
    }
    container.innerHTML = "";
    snap.docs.forEach(d => {
      const data = d.data();
      const div = document.createElement("div");
      div.className = "entry";
      div.style.padding = "8px 0";
      div.style.borderBottom = "1px solid #eee";
      div.innerHTML = `
        <div style="display:flex; justify-content:space-between;">
          <span>Sent to: ${data.toName || data.toUid.slice(0, 8)}...</span>
          <span style="font-style:italic; opacity:0.6;">Pending</span>
        </div>
      `;
      container.appendChild(div);
    });
  });
}

//utility functions attached to window
window.updatePermission = async (ownerUid, viewerUid, newRole) => {
  try {
    await updateDoc(doc(db, "users", ownerUid, "shares", viewerUid), { role: newRole });
    await updateDoc(doc(db, "users", viewerUid, "sharedWith", ownerUid), { role: newRole });
    setStatus("Permissions updated.");
  } catch (e) {
    setStatus("Failed to update.", true);
  }
};

window.removeShare = async (ownerUid, viewerUid) => {
  if (!confirm("Revoke all access for this user?")) return;
  try {
    await deleteDoc(doc(db, "users", ownerUid, "shares", viewerUid));
    await deleteDoc(doc(db, "users", viewerUid, "sharedWith", ownerUid));
    setStatus("Access revoked.");
  } catch (e) {
    setStatus("Failed to revoke.", true);
  }
};

window.leaveShare = async (viewerUid, ownerUid) => {
  if (!confirm("Stop viewing this user's data?")) return;
  try {
    await deleteDoc(doc(db, "users", viewerUid, "sharedWith", ownerUid));
    await deleteDoc(doc(db, "users", ownerUid, "shares", viewerUid));
    setStatus("Removed from share.");
  } catch (e) {
    setStatus("Failed to leave share.", true);
  }
};

//ui render incoming invites
function renderIncomingInvites(invites) {
  const container = document.getElementById("incomingInvites");
  if (!container) return;

  if (invites.length === 0) {
    container.innerHTML = "No invites yet.";
    return;
  }

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
      <strong>${data.fromName || "User"}</strong>
      <div style="opacity:.8;">wants ${data.role} access</div>
    `;

    const right = document.createElement("div");
    right.style.display = "flex";
    right.style.gap = "8px";

    const acceptBtn = document.createElement("button");
    acceptBtn.className = "button";
    acceptBtn.textContent = "Accept";
    acceptBtn.style.padding = "4px 8px";

    const declineBtn = document.createElement("button");
    declineBtn.className = "button";
    declineBtn.textContent = "Decline";
    declineBtn.style.padding = "4px 8px";
    declineBtn.style.background = "#fee";
    declineBtn.style.color = "black";

    acceptBtn.addEventListener("click", async () => {
      try {
        await acceptInvite(id, data);
        setStatus("Invite accepted!");
      } catch (e) {
        setStatus("Accept failed.", true);
      }
    });

    declineBtn.addEventListener("click", async () => {
      try {
        await declineInvite(id);
        setStatus("Invite declined.");
      } catch (e) {
        setStatus("Decline failed.", true);
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
        await setDoc(doc(db, "users", user.uid), {
          displayName: newName,
          updatedAt: serverTimestamp()
        }, { merge: true });
        setStatus("Profile saved!");
      } catch (e) {
        setStatus("Save failed.", true);
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
        const roleSelected = document.getElementById("sharePermission")?.value || "viewer";
        const targetUid = await uidFromShareCode(codeEntered);

        if (!targetUid) {
          setStatus("No user found for that share code.", true);
          return;
        }

        const targetSnap = await getDoc(doc(db, "users", targetUid));
        const targetName = targetSnap.exists() ? (targetSnap.data().displayName || "User") : "User";

        const mySnap = await getDoc(doc(db, "users", user.uid));
        const myName = mySnap.exists() ? (mySnap.data().displayName || "User") : "User";

        await sendInvite(user.uid, myName, targetUid, targetName, roleSelected);
        setStatus("Invite sent!");
        document.getElementById("otherShareCode").value = "";
      } catch (e) {
        setStatus(e.message || "Invite failed.", true);
     }
    });
  }

  listenForIncomingInvites(user.uid);
  listenForActiveShares(user.uid);
  listenForSentInvites(user.uid);
  listenForSharedWithMe(user.uid);
})();