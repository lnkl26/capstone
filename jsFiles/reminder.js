import {
    db,
    collection,
    addDoc,
    deleteDoc,
    doc,
    onSnapshot,
    updateDoc,
} from "../firebase.js";

import { userReady, currentUser } from "../firebase.js";

window.addEventListener("load", async () => {
  await userReady;
  console.log("Final UID on load:", currentUser.uid);
});

(function () {
    if (!document.body || document.body.id !== "reminder-page") return;

    const $ = (id) => document.getElementById(id);

    // Elements
    const modal = $("reminder-modal");
    const createBtn = $("reminderCreate-btn");
    const cancelBtn = $("reminder-cancel-btn");

    const form = $("reminder-form");
    const titleEl = $("reminder-title");
    const dueEl = $("reminder-due");
    const notesEl = $("reminder-notes");
    const editIndexEl = $("reminder-edit-index");

    const tbody = $("reminder-tbody");
    const clearAllBtn = $("reminder-clear-all");

    const clearAllModal = $("clearall-modal");
    const clearAllConfirm = $("clearall-confirm");
    const clearAllCancel = $("clearall-cancel");

    const confirmModal = $("confirm-modal");
    const confirmDeleteBtn = $("confirm-delete");
    const confirmCancelBtn = $("confirm-cancel");

    const thead = document.querySelector("#reminder-table thead");
    let sortState = { key: "due", dir: "asc" };

    // Firestore collection
    const remindersCol = collection(db, "reminders");

    // State
    let reminders = [];

    // Modal helpers
    function openModal(el) {
        el.style.display = "flex";
        document.body.classList.add("no-scroll");
    }
    function closeModal(el) {
        el.style.display = "none";
        document.body.classList.remove("no-scroll");
    }

    createBtn?.addEventListener("click", () => {
        clearForm();
        openModal(modal);
    });

    cancelBtn?.addEventListener("click", () => {
        clearForm();
        closeModal(modal);
    });

    modal?.addEventListener("click", (e) => {
        if (!e.target.closest(".task-modal-content")) closeModal(modal);
    });

    function toLocalInputValue(dt) {
        const pad = (n) => String(n).padStart(2, "0");
        return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(
            dt.getDate()
        )}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
    }

    function clearForm() {
        form.reset();
        editIndexEl.value = "";
        const now = new Date();
        now.setMinutes(now.getMinutes() + 60);
        dueEl.value = toLocalInputValue(now);
    }

    function readForm() {
        return {
            title: (titleEl.value || "").trim(),
            due: dueEl.value || "",
            notes: (notesEl.value || "").trim(),
            done: false,
        };
    }

    function escapeHtml(s) {
        return String(s).replace(/</g, "&lt;");
    }

    function ensureCreatedAt(item) {
        if (!item.createdAt) item.createdAt = Date.now();
        return item;
    }

    // Split date into (dayStartUTC, secondsInDay)
    function getDueParts(due) {
        if (!due) return [0, 0];
        const d = new Date(due);
        const dayUTC = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
        const secs = d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();
        return [dayUTC, secs];
    }

    // Delete Confirm Modal
    let pendingDeleteIndex = null;

    function openConfirm(i) {
        pendingDeleteIndex = i;
        confirmModal.style.display = "block";
        document.body.classList.add("no-scroll");
    }
    function closeConfirm() {
        confirmModal.style.display = "none";
        document.body.classList.remove("no-scroll");
        pendingDeleteIndex = null;
    }

    // Close confirm on Cancel / backdrop / Escape
    confirmCancelBtn?.addEventListener("click", closeConfirm);
    confirmModal?.addEventListener("click", (e) => {
        if (e.target === confirmModal) closeConfirm();
    });
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && confirmModal?.style.display === "block") {
            closeConfirm();
        }
    });

    async function deleteReminderByIndex(i) {
        const r = reminders[i];
        if (!r || !r.id) return;
        await deleteDoc(doc(remindersCol, r.id));
    }

    confirmDeleteBtn?.addEventListener("click", async () => {
        if (
            pendingDeleteIndex != null &&
            pendingDeleteIndex >= 0 &&
            pendingDeleteIndex < reminders.length
        ) {
            try {
                await deleteReminderByIndex(pendingDeleteIndex);
            } catch (err) {
                console.error("Failed to delete reminder:", err);
                alert("Error deleting reminder. Please try again.");
            }
        }
        closeConfirm();
    });

    // Clear All Modal
    function openClearAll() {
        clearAllModal.style.display = "block";
        document.body.classList.add("no-scroll");
    }
    function closeClearAll() {
        clearAllModal.style.display = "none";
        document.body.classList.remove("no-scroll");
    }

    clearAllCancel?.addEventListener("click", closeClearAll);
    clearAllModal?.addEventListener("click", (e) => {
        if (e.target === clearAllModal) closeClearAll();
    });
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && clearAllModal?.style.display === "block") {
            closeClearAll();
        }
    });

    clearAllConfirm?.addEventListener("click", async () => {
        try {
            const snapshotReminders = [...reminders];
            await Promise.all(
                snapshotReminders.map((r) =>
                    r.id
                        ? deleteDoc(doc(remindersCol, r.id))
                        : Promise.resolve()
                )
            );
        } catch (err) {
            console.error("Failed to clear reminders:", err);
            alert("Error clearing reminders. Please try again.");
        }
        closeClearAll();
    });

    clearAllBtn?.addEventListener("click", openClearAll);

    // Rendering & sorting
    function render() {
        reminders = reminders.map(ensureCreatedAt);

        let rows = reminders.map((r, i) => ({ ...r, _i: i }));

        rows.sort((a, b) => {
            const { key, dir } = sortState;
            const mul = dir === "asc" ? 1 : -1;

            if (key === "due") {
                // Compare by day, then by time-of-day, then by createdAt
                const [ad, at] = getDueParts(a.due);
                const [bd, bt] = getDueParts(b.due);
                if (ad !== bd) return (ad - bd) * mul;
                if (at !== bt) return (at - bt) * mul;
                return ((a.createdAt || 0) - (b.createdAt || 0)) * mul;
            }

            if (key === "title") {
                const cmp = (a.title || "").localeCompare(b.title || "");
                if (cmp) return cmp * mul;
                const [ad, at] = getDueParts(a.due);
                const [bd, bt] = getDueParts(b.due);
                if (ad !== bd) return (ad - bd) * mul;
                if (at !== bt) return (at - bt) * mul;
                return ((a.createdAt || 0) - (b.createdAt || 0)) * mul;
            }

            if (key === "notes") {
                const cmp = (a.notes || "").localeCompare(b.notes || "");
                if (cmp) return cmp * mul;
                const [ad, at] = getDueParts(a.due);
                const [bd, bt] = getDueParts(b.due);
                if (ad !== bd) return (ad - bd) * mul;
                if (at !== bt) return (at - bt) * mul;
                return ((a.createdAt || 0) - (b.createdAt || 0)) * mul;
            }

            return 0;
        });

        // Update header sort arrows
        thead.querySelectorAll("th.sortable").forEach((th) => {
            th.setAttribute(
                "aria-sort",
                th.dataset.key === sortState.key
                    ? sortState.dir === "asc"
                        ? "ascending"
                        : "descending"
                    : "none"
            );
        });

        // Render
        tbody.innerHTML = "";
        rows.forEach((r) => {
            const tr = document.createElement("tr");
            if (r.done) tr.classList.add("is-done");
            tr.innerHTML = `
        <td>${r.due ? new Date(r.due).toLocaleString() : ""}</td>
        <td>${escapeHtml(r.title || "")}</td>
        <td>${escapeHtml(r.notes || "")}</td>
        <td>
          <button type="button" class="button button--small btn-secondary" data-done="${
              r._i
          }">
            ${r.done ? "Undo" : "Done"}
          </button>
          <button type="button" class="button button--small btn-secondary" data-edit="${
              r._i
          }">
            Edit
          </button>
          <button type="button" class="button button--small btn-secondary" data-del="${
              r._i
          }">
            Delete
          </button>
        </td>`;
            tbody.appendChild(tr);
        });
    }

    // Click-to-sort headers
    thead?.addEventListener("click", (e) => {
        const th = e.target.closest("th.sortable");
        if (!th) return;
        const key = th.dataset.key;
        sortState =
            sortState.key === key
                ? { key, dir: sortState.dir === "asc" ? "desc" : "asc" }
                : { key, dir: "asc" };
        render();
    });

    // Firestore live sync
    onSnapshot(remindersCol, (snapshot) => {
        reminders = snapshot.docs.map((d) => {
            const data = d.data() || {};
            return {
                id: d.id,
                title: data.title || "",
                notes: data.notes || "",
                due: data.due || "",
                done: !!data.done,
                createdAt: data.createdAt || Date.now(),
            };
        });
        render();
    });

    // Save
    form.addEventListener("submit", async (ev) => {
        ev.preventDefault();
        ev.stopPropagation();

        const data = readForm();
        if (!data.title) {
            alert("Please enter a title.");
            return;
        }
        if (!data.due) {
            alert("Please choose a due date/time.");
            return;
        }

        try {
            try {
                data.due = new Date(data.due).toISOString();
            } catch {
                // leave as-is if failed
            }

            const idx =
                editIndexEl.value !== "" ? Number(editIndexEl.value) : -1;

            if (idx >= 0 && idx < reminders.length) {
                // update existing doc
                const r = reminders[idx];
                if (r && r.id) {
                    await updateDoc(doc(remindersCol, r.id), {
                        title: data.title,
                        notes: data.notes,
                        due: data.due,
                        done: r.done || false,
                        createdAt: r.createdAt || Date.now(),
                    });
                }
            } else {
                // create new doc
                await addDoc(remindersCol, {
                    title: data.title,
                    notes: data.notes,
                    due: data.due,
                    done: false,
                    createdAt: Date.now(),
                });
            }

            clearForm();
            closeModal(modal);
        } catch (err) {
            console.error("Failed to save reminder:", err);
            alert("Error saving reminder. Please try again.");
        }
    });

    // Row actions (edit / delete / done)
    tbody.addEventListener("click", (e) => {
        const del = e.target.closest("[data-del]");
        const edt = e.target.closest("[data-edit]");
        const mark = e.target.closest("[data-done]");

        if (mark) {
            const i = +mark.dataset.done;
            if (Number.isInteger(i) && i >= 0 && i < reminders.length) {
                const r = reminders[i];
                if (!r || !r.id) return;
                updateDoc(doc(remindersCol, r.id), { done: !r.done }).catch(
                    (err) => {
                        console.error("Failed to toggle reminder:", err);
                        alert("Error updating reminder. Please try again.");
                    }
                );
            }
            return;
        }

        if (del) {
            const i = +del.dataset.del;
            if (Number.isInteger(i) && i >= 0 && i < reminders.length) {
                openConfirm(i);
            }
            return;
        }

        if (edt) {
            const i = +edt.dataset.edit;
            if (Number.isInteger(i) && i >= 0 && i < reminders.length) {
                const v = reminders[i];
                editIndexEl.value = String(i);
                titleEl.value = v.title || "";
                notesEl.value = v.notes || "";
                try {
                    dueEl.value = toLocalInputValue(new Date(v.due));
                } catch {
                    dueEl.value = "";
                }
                openModal(modal);
            }
        }
    });

    // Alert when reminder is due
    setInterval(() => {
        const now = Date.now();
        reminders.forEach((r) => {
            if (!r || r.done || !r.due) return;
            const dueMs = +new Date(r.due);
            if (dueMs && now - dueMs >= 0 && now - dueMs < 30000) {
                alert(`Reminder due: ${r.title}`);
                if (r.id) {
                    updateDoc(doc(remindersCol, r.id), { done: true }).catch(
                        console.error
                    );
                }
            }
        });
    }, 30000);
})();
