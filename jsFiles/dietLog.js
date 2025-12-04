import {
    db,
    collection,
    addDoc,
    deleteDoc,
    doc,
    onSnapshot,
    updateDoc,
} from "../firebase.js";

(function () {
    if (document.body.id !== "diet-log-page") return;

    const $ = (id) => document.getElementById(id);

    const dietModal = $("diet-modal");
    const dietCreateBtn = $("dietCreate-btn");
    const dietCancelBtn = $("diet-cancel-btn");

    const form = $("diet-form");
    const dateEl = $("diet-date");
    const mealEl = $("diet-meal");
    const foodEl = $("diet-food");
    const calEl = $("diet-cal");
    const proteinEl = $("diet-protein");
    const carbsEl = $("diet-carbs");
    const fatEl = $("diet-fat");
    const notesEl = $("diet-notes");
    const safeEl = $("diet-safe");
    const editIndexEl = $("diet-edit-index");

    const tbody = $("diet-tbody");
    const totalCal = $("total-cal");
    const totalProtein = $("total-protein");
    const totalCarbs = $("total-carbs");
    const totalFat = $("total-fat");

    const filterFromEl = $("diet-filter-from");
    const filterToEl = $("diet-filter-to");
    const filterMealEl = $("diet-filter-meal");
    const applyFilterBtn = $("diet-apply-filter");
    const resetFilterBtn = $("diet-reset-filter");

    const exportCsvBtn = $("diet-export-csv");
    const exportJsonBtn = $("diet-export-json");
    const importJsonInput = $("diet-import-json");
    const clearAllBtn = $("diet-clear-all");

    // Firestore collection
    const dietCol = collection(db, "dietLog");

    // State
    let entries = [];

    let view = { from: "", to: "", meal: "" };
    const today = () => new Date().toISOString().slice(0, 10);

    // Modal helpers
    function openModal(el) {
        el.style.display = "flex";
        document.body.classList.add("no-scroll");
    }
    function closeModal(el) {
        el.style.display = "none";
        document.body.classList.remove("no-scroll");
    }

    dietCreateBtn?.addEventListener("click", () => openModal(dietModal));

    dietCancelBtn?.addEventListener("click", () => {
        clearForm();
        closeModal(dietModal);
    });

    dietModal?.addEventListener("click", (e) => {
        if (!e.target.closest(".task-modal-content")) closeModal(dietModal);
    });

    function clearForm() {
        form.reset();
        editIndexEl.value = "";
        if (!dateEl.value) dateEl.value = today();
        if (safeEl) safeEl.checked = false;
    }

    function readForm() {
        return {
            date: dateEl.value || "",
            meal: mealEl.value || "",
            food: (foodEl.value || "").trim(),
            cal: Number(calEl.value || 0),
            protein: Number(proteinEl.value || 0),
            carbs: Number(carbsEl.value || 0),
            fat: Number(fatEl.value || 0),
            notes: (notesEl.value || "").trim(),
            safe: !!(safeEl && safeEl.checked),
            createdAt: Date.now(),
        };
    }

    function within(e) {
        if (view.from && e.date < view.from) return false;
        if (view.to && e.date > view.to) return false;
        if (view.meal && e.meal !== view.meal) return false;
        return true;
    }

    function render() {
        tbody.innerHTML = "";
        let totals = { cal: 0, p: 0, c: 0, f: 0 };

        entries
            .map((e, i) => ({ ...e, _i: i }))
            .filter(within)
            .sort((a, b) => a.date.localeCompare(b.date))
            .forEach((e) => {
                totals.cal += +e.cal || 0;
                totals.p += +e.protein || 0;
                totals.c += +e.carbs || 0;
                totals.f += +e.fat || 0;

                const tr = document.createElement("tr");
                tr.innerHTML = `
          <td>${e.date || ""}</td>
          <td>${e.meal || ""}</td>
          <td>${e.food || ""}</td>
          <td>${e.cal || 0}</td>
          <td>${e.protein || 0}</td>
          <td>${e.carbs || 0}</td>
          <td>${e.fat || 0}</td>
          <td>${(e.notes || "").replace(/</g, "&lt;")}</td>
          <td>${e.safe ? "✓" : ""}</td>
          <td>
            <button type="button" class="button button--small btn-secondary" data-edit="${
                e._i
            }">Edit</button>
            <button type="button" class="button button--small btn-secondary" data-del="${
                e._i
            }">Delete</button>
          </td>
        `;
                tbody.appendChild(tr);
            });

        totalCal.textContent = Math.round(totals.cal);
        totalProtein.textContent = +totals.p.toFixed(1);
        totalCarbs.textContent = +totals.c.toFixed(1);
        totalFat.textContent = +totals.f.toFixed(1);
    }

    // Firestore live sync
    onSnapshot(dietCol, (snapshot) => {
        entries = snapshot.docs.map((d) => {
            const data = d.data() || {};
            return {
                id: d.id,
                date: data.date || "",
                meal: data.meal || "",
                food: data.food || "",
                cal: data.cal ?? 0,
                protein: data.protein ?? 0,
                carbs: data.carbs ?? 0,
                fat: data.fat ?? 0,
                notes: data.notes || "",
                safe: !!data.safe,
                createdAt: data.createdAt || Date.now(),
            };
        });
        render();
    });

    // Form submit (create / update)
    form.addEventListener("submit", async (ev) => {
        ev.preventDefault();
        ev.stopPropagation();

        const data = readForm();
        if (!data.food) {
            alert("Please enter a food name.");
            return;
        }

        const idx = editIndexEl.value !== "" ? Number(editIndexEl.value) : -1;

        try {
            if (idx >= 0 && idx < entries.length) {
                const existing = entries[idx];
                if (!existing || !existing.id) return;

                await updateDoc(doc(dietCol, existing.id), {
                    date: data.date,
                    meal: data.meal,
                    food: data.food,
                    cal: data.cal,
                    protein: data.protein,
                    carbs: data.carbs,
                    fat: data.fat,
                    notes: data.notes,
                    safe: data.safe,
                    createdAt: existing.createdAt || Date.now(),
                });
            } else {
                await addDoc(dietCol, data);
            }

            view = { from: "", to: "", meal: "" };
            filterFromEl.value = "";
            filterToEl.value = "";
            filterMealEl.value = "";

            clearForm();
            closeModal(dietModal);
            console.log("[Diet] saved", data);
        } catch (err) {
            console.error("Failed to save diet entry:", err);
            alert("Error saving entry. Please try again.");
        }
    });

    // Edit/Delete row actions
    tbody.addEventListener("click", async (e) => {
        const del = e.target.closest("[data-del]");
        const edt = e.target.closest("[data-edit]");

        if (del) {
            const i = +del.dataset.del;
            if (Number.isInteger(i) && i >= 0 && i < entries.length) {
                if (confirm("Delete this entry?")) {
                    const v = entries[i];
                    if (v && v.id) {
                        try {
                            await deleteDoc(doc(dietCol, v.id));
                        } catch (err) {
                            console.error("Failed to delete diet entry:", err);
                            alert("Error deleting entry. Please try again.");
                        }
                    }
                }
            }
        }

        if (edt) {
            const i = +edt.dataset.edit;
            if (Number.isInteger(i) && i >= 0 && i < entries.length) {
                const v = entries[i];
                editIndexEl.value = String(i);
                dateEl.value = v.date || "";
                mealEl.value = v.meal || "Lunch";
                foodEl.value = v.food || "";
                calEl.value = v.cal ?? "";
                proteinEl.value = v.protein ?? "";
                carbsEl.value = v.carbs ?? "";
                fatEl.value = v.fat ?? "";
                notesEl.value = v.notes || "";
                if (safeEl) safeEl.checked = !!v.safe;
                openModal(dietModal);
            }
        }
    });

    // Filters
    applyFilterBtn?.addEventListener("click", (e) => {
        e.preventDefault();
        view = {
            from: filterFromEl.value || "",
            to: filterToEl.value || "",
            meal: filterMealEl.value || "",
        };
        render();
    });

    resetFilterBtn?.addEventListener("click", (e) => {
        e.preventDefault();
        filterFromEl.value = "";
        filterToEl.value = "";
        filterMealEl.value = "";
        view = { from: "", to: "", meal: "" };
        render();
    });

    // Export CSV
    exportCsvBtn?.addEventListener("click", (e) => {
        e.preventDefault();

        const rows = [
            [
                "date",
                "meal",
                "food",
                "calories",
                "protein",
                "carbs",
                "fat",
                "notes",
                "safe",
            ],
            ...(entries || []).map((e) => [
                e.date ?? "",
                e.meal ?? "",
                e.food ?? "",
                e.cal ?? 0,
                e.protein ?? 0,
                e.carbs ?? 0,
                e.fat ?? 0,
                String(e.notes ?? "").replace(/"/g, '""'),
                e.safe ? "true" : "false",
            ]),
        ];

        const csv = rows
            .map((r) =>
                r
                    .map((v) =>
                        typeof v === "string" && /[",\n]/.test(v) ? `"${v}"` : v
                    )
                    .join(",")
            )
            .join("\n");

        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `diet-log-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 0);
    });

    // Export JSON
    exportJsonBtn?.addEventListener("click", (e) => {
        e.preventDefault();

        const data = Array.isArray(entries)
            ? entries.map((e) => {
                  const { id, ...rest } = e;
                  return rest;
              })
            : [];

        const blob = new Blob([JSON.stringify(data, null, 2)], {
            type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `diet-log-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 0);
    });

    // Import JSON → Firestore
    importJsonInput?.addEventListener("change", async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const text = await file.text();
        let data;
        try {
            data = JSON.parse(text);
        } catch {
            alert("Invalid JSON file.");
            return;
        }

        if (!Array.isArray(data)) {
            alert("JSON must be an array of entries.");
            return;
        }

        if (
            !confirm(
                "Importing will add these entries to your diet log in Firebase. Continue?"
            )
        )
            return;

        try {
            await Promise.all(
                data.map((entry) =>
                    addDoc(dietCol, {
                        date: entry.date || "",
                        meal: entry.meal || "",
                        food: entry.food || "",
                        cal: Number(entry.cal || 0),
                        protein: Number(entry.protein || 0),
                        carbs: Number(entry.carbs || 0),
                        fat: Number(entry.fat || 0),
                        notes: entry.notes || "",
                        safe: !!entry.safe,
                        createdAt: entry.createdAt || Date.now(),
                    })
                )
            );
            alert("Import complete.");
        } catch (err) {
            console.error("Failed to import diet entries:", err);
            alert("Error importing entries. Please try again.");
        } finally {
            importJsonInput.value = "";
        }
    });

    // Clear all
    clearAllBtn?.addEventListener("click", async (e) => {
        e.preventDefault();
        if (!confirm("This will delete ALL diet entries. Continue?")) return;

        try {
            const snapshotEntries = [...entries];
            await Promise.all(
                snapshotEntries.map((ent) =>
                    ent.id ? deleteDoc(doc(dietCol, ent.id)) : Promise.resolve()
                )
            );
        } catch (err) {
            console.error("Failed to clear diet log:", err);
            alert("Error clearing entries. Please try again.");
        }
    });

    // Initialize defaults
    clearForm();
})();
