import {
    addDoc,
    deleteDoc,
    doc,
    onSnapshot,
    updateDoc,
} from "../firebase.js";

import { userReady, currentUser, userCollection } from "../firebase.js";

window.addEventListener("load", async () => {
    await userReady;
    console.log("Final UID on load:", currentUser.uid);
});

(async function () {
    if (document.body.id !== "diet-log-page") return;

    await userReady;

    const $ = (id) => document.getElementById(id);

    const dietModal = $("diet-modal");
    const dietCreateBtn = $("dietCreate-btn");
    const dietCancelBtn = $("diet-cancel-btn");
    const filterModal = $("diet-filter-modal");
    const toolsModal = $("diet-tools-modal");
    const filterOpenBtn = $("dietFilter-open-btn");
    const toolsOpenBtn = $("dietTools-open-btn");
    const filterCloseBtn = $("diet-close-filter");
    const toolsCloseBtn = $("diet-close-tools");

    const form = $("diet-form");
    const dateEl = $("diet-date");
    const mealEl = $("diet-meal");
    const foodEl = $("diet-food");
    const searchBtn = $("diet-search-btn");
    const searchResultsEl = $("diet-search-results");
    const servingsEl = $("diet-servings");
    const servingInfoEl = $("diet-serving-info");
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

    const confirmModal = $("diet-confirm-modal");
    const confirmDeleteBtn = $("diet-confirm-delete");
    const confirmCancelBtn = $("diet-confirm-cancel");

    const clearAllModal = $("diet-clearall-modal");
    const clearAllConfirmBtn = $("diet-clearall-confirm");
    const clearAllCancelBtn = $("diet-clearall-cancel");

    // Firestore collection — scoped to the signed-in user
    const dietCol = userCollection("dietLog");

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

    filterOpenBtn?.addEventListener("click", () => openModal(filterModal));
    toolsOpenBtn?.addEventListener("click", () => openModal(toolsModal));

    filterCloseBtn?.addEventListener("click", () => closeModal(filterModal));
    toolsCloseBtn?.addEventListener("click", () => closeModal(toolsModal));

    filterModal?.addEventListener("click", (e) => {
        if (!e.target.closest(".task-modal-content")) closeModal(filterModal);
    });

    toolsModal?.addEventListener("click", (e) => {
        if (!e.target.closest(".task-modal-content")) closeModal(toolsModal);
    });

    function clearForm() {
        form.reset();
        editIndexEl.value = "";
        if (!dateEl.value) dateEl.value = today();
        if (safeEl) safeEl.checked = false;
        if (servingsEl) {
            servingsEl.value = "1";
            delete servingsEl.dataset.baseCal;
            delete servingsEl.dataset.baseProtein;
            delete servingsEl.dataset.baseCarbs;
            delete servingsEl.dataset.baseFat;
            delete servingsEl.dataset.baseGrams;
            delete servingsEl.dataset.baseHousehold;
            delete servingsEl.dataset.baseUnit;
        }
        if (servingInfoEl) servingInfoEl.textContent = "";
    }

    // Delete confirm modal
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

    confirmCancelBtn?.addEventListener("click", closeConfirm);
    confirmModal?.addEventListener("click", (e) => {
        if (e.target === confirmModal) closeConfirm();
    });

    confirmDeleteBtn?.addEventListener("click", async () => {
        if (pendingDeleteIndex != null) {
            const v = entries[pendingDeleteIndex];
            if (v && v.id) {
                try {
                    await deleteDoc(doc(dietCol, v.id));
                } catch (err) {
                    console.error("Failed to delete diet entry:", err);
                }
            }
        }
        closeConfirm();
    });

    // Clear-all confirm modal
    function openClearAll() {
        clearAllModal.style.display = "block";
        document.body.classList.add("no-scroll");
    }
    function closeClearAll() {
        clearAllModal.style.display = "none";
        document.body.classList.remove("no-scroll");
    }

    clearAllCancelBtn?.addEventListener("click", closeClearAll);
    clearAllModal?.addEventListener("click", (e) => {
        if (e.target === clearAllModal) closeClearAll();
    });

    clearAllConfirmBtn?.addEventListener("click", async () => {
        try {
            const snapshotEntries = [...entries];
            await Promise.all(
                snapshotEntries.map((ent) =>
                    ent.id ? deleteDoc(doc(dietCol, ent.id)) : Promise.resolve(),
                ),
            );
        } catch (err) {
            console.error("Failed to clear diet log:", err);
        }
        closeClearAll();
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            if (confirmModal?.style.display === "block") closeConfirm();
            if (clearAllModal?.style.display === "block") closeClearAll();
        }
    });

    function readForm() {
        const qty = parseFloat(servingsEl?.value) || 1;
        const baseGrams = parseFloat(servingsEl?.dataset.baseGrams);
        const unit = servingsEl?.dataset.baseUnit || "g";
        const plural = qty === 1 ? "serving" : "servings";
        const servingDisplay = baseGrams
            ? `${qty} ${plural} (${+(baseGrams * qty).toFixed(1)}${unit})`
            : "";
        return {
            date: dateEl.value || "",
            meal: mealEl.value || "",
            food: (foodEl.value || "").trim(),
            cal: Math.round(Number(calEl.value || 0)),
            protein: Number(proteinEl.value || 0),
            carbs: Number(carbsEl.value || 0),
            fat: Number(fatEl.value || 0),
            serving: servingDisplay,
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
          <td>${(e.serving || "").replace(/</g, "&lt;")}</td>
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
        totalProtein.textContent = +totals.p.toFixed(3);
        totalCarbs.textContent = +totals.c.toFixed(3);
        totalFat.textContent = +totals.f.toFixed(3);
    }

    // Food search integration
    function updateServingLabel(qty) {
        if (!servingInfoEl || !servingsEl?.dataset.baseGrams) return;
        const baseGrams = parseFloat(servingsEl.dataset.baseGrams);
        const household = servingsEl.dataset.baseHousehold || "";
        const unit = servingsEl.dataset.baseUnit || "g";
        const totalGrams = +(baseGrams * qty).toFixed(1);
        const plural = qty === 1 ? "serving" : "servings";
        if (qty === 1) {
            servingInfoEl.textContent = household
                ? `1 serving = ${household} (${baseGrams}${unit})`
                : `1 serving = ${baseGrams}${unit}`;
        } else {
            servingInfoEl.textContent = `${qty} ${plural} = ${totalGrams}${unit}`;
        }
    }

    function showSearchResults(foods) {
        if (!searchResultsEl) return;
        searchResultsEl.innerHTML = "";
        if (!foods || !foods.length) {
            searchResultsEl.style.display = "none";
            return;
        }

        foods.slice(0, 10).forEach((f) => {
            const li = document.createElement("li");
            li.style.padding = "8px";
            li.style.borderBottom = "1px solid #eee";
            li.style.cursor = "pointer";
            const desc = f.description || f.foodName || "(no description)";
            const sub = f.brandOwner ? ` — ${f.brandOwner}` : "";
            li.textContent = desc + sub;

            // store data for quick access
            li.dataset.fdcId = f.fdcId || f.fdcId;
            li.dataset.description = desc;

            // extract serving size — branded foods have explicit servingSize; others are per 100g
            const servingSize = f.servingSize || 100;
            const servingUnit = (f.servingSizeUnit || "g").toLowerCase();
            const servingLabel = f.householdServingFullText
                ? `${f.householdServingFullText} (${servingSize}${servingUnit})`
                : `${servingSize}${servingUnit}`;
            li.dataset.servingLabel = servingLabel;
            // nutrients from search endpoint are per 100g; scale to actual serving size for branded foods
            const scale = f.servingSize ? f.servingSize / 100 : 1;

            // extract nutrients (values in search results are per 100g)
            const nutrients = {};
            (f.foodNutrients || []).forEach((n) => {
                const name = (n.nutrientName || "").toLowerCase();
                const val = n.value;
                if (!val && val !== 0) return;
                if (/protein/.test(name)) nutrients.protein = val;
                else if (/carbohydrate|carb/.test(name)) nutrients.carbs = val;
                else if (/fat|lipid/.test(name)) nutrients.fat = val;
                else if (/energy|calor/.test(name)) nutrients.cal = val;
            });

            // store base values scaled to 1 serving
            li.dataset.cal = nutrients.cal != null ? +(nutrients.cal * scale).toFixed(1) : "";
            li.dataset.protein = nutrients.protein != null ? +(nutrients.protein * scale).toFixed(2) : "";
            li.dataset.carbs = nutrients.carbs != null ? +(nutrients.carbs * scale).toFixed(2) : "";
            li.dataset.fat = nutrients.fat != null ? +(nutrients.fat * scale).toFixed(2) : "";

            li.dataset.baseGrams = servingSize;
            li.dataset.baseHousehold = f.householdServingFullText || "";
            li.dataset.baseUnit = servingUnit;

            li.addEventListener("click", () => {
                foodEl.value = li.dataset.description || "";
                if (servingsEl) {
                    servingsEl.value = "1";
                    servingsEl.dataset.baseCal = li.dataset.cal;
                    servingsEl.dataset.baseProtein = li.dataset.protein;
                    servingsEl.dataset.baseCarbs = li.dataset.carbs;
                    servingsEl.dataset.baseFat = li.dataset.fat;
                    servingsEl.dataset.baseGrams = li.dataset.baseGrams;
                    servingsEl.dataset.baseHousehold = li.dataset.baseHousehold;
                    servingsEl.dataset.baseUnit = li.dataset.baseUnit;
                }
                updateServingLabel(1);
                calEl.value = li.dataset.cal || "";
                proteinEl.value = li.dataset.protein || "";
                carbsEl.value = li.dataset.carbs || "";
                fatEl.value = li.dataset.fat || "";
                searchResultsEl.style.display = "none";
            });

            searchResultsEl.appendChild(li);
        });

        searchResultsEl.style.display = "block";
    }

    async function doFoodSearch(query) {
        if (!query || query.trim().length < 2) {
            alert("Please enter at least 2 characters to search.");
            return;
        }

        try {
            // simple explicit search via GET
            const res = await fetch(
                `/api/searchFoods?query=${encodeURIComponent(query)}`,
            );
            if (!res.ok) throw new Error(`Search failed: ${res.status}`);
            const data = await res.json();
            // FDC search results
            const foods = data.foods || data || [];
            showSearchResults(foods);
        } catch (err) {
            console.error("Food search failed", err);
            alert("Food search failed. See console for details.");
        }
    }

    // Button + Enter handling
    searchBtn?.addEventListener("click", (e) => {
        e.preventDefault();
        doFoodSearch((foodEl.value || "").trim());
    });

    foodEl?.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            doFoodSearch((foodEl.value || "").trim());
        }
    });

    // rescale nutrients and serving label when servings count changes
    servingsEl?.addEventListener("input", () => {
        const qty = parseFloat(servingsEl.value);
        if (!qty || qty <= 0 || !servingsEl.dataset.baseCal) return;
        calEl.value = servingsEl.dataset.baseCal ? +(+servingsEl.dataset.baseCal * qty).toFixed(1) : "";
        proteinEl.value = servingsEl.dataset.baseProtein ? +(+servingsEl.dataset.baseProtein * qty).toFixed(2) : "";
        carbsEl.value = servingsEl.dataset.baseCarbs ? +(+servingsEl.dataset.baseCarbs * qty).toFixed(2) : "";
        fatEl.value = servingsEl.dataset.baseFat ? +(+servingsEl.dataset.baseFat * qty).toFixed(2) : "";
        updateServingLabel(qty);
    });

    // click outside to close results
    document.addEventListener("click", (e) => {
        if (!searchResultsEl) return;
        if (
            e.target === searchResultsEl ||
            searchResultsEl.contains(e.target) ||
            e.target === searchBtn ||
            e.target === foodEl
        )
            return;
        searchResultsEl.style.display = "none";
    });

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
                serving: data.serving || "",
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
                    serving: data.serving,
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
                openConfirm(i);
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
        closeModal(filterModal);
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
        closeModal(toolsModal);

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
                        typeof v === "string" && /[",\n]/.test(v)
                            ? `"${v}"`
                            : v,
                    )
                    .join(","),
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
        closeModal(toolsModal);

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

        closeModal(toolsModal);

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
                "Importing will add these entries to your diet log in Firebase. Continue?",
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
                    }),
                ),
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
    clearAllBtn?.addEventListener("click", (e) => {
        e.preventDefault();
        closeModal(toolsModal);
        openClearAll();
    });

    // Initialize defaults
    clearForm();
})();
