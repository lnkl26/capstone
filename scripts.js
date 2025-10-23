/*
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        //sw debugging 
        const reg = await navigator.serviceWorker.register('/service-worker.js', {scope: '/'});
        console.log('sw registered:', reg.scope);
      } catch (err) {
        console.error('sw registration failed:', err);
      }
    });
  }
*/
// TASK STUFF
//global
let tasks = [];
let currentSubtasks = []; // temporary subtasks for the task being created
let isEditing = false;
let editingTaskIndex = null;
let editingSubtaskIndex = null;

if (document.getElementById("taskCreate-btn")) {
    const taskModal = document.getElementById("task-modal");
    const taskArea = document.getElementById("task-area");
    const taskInputName = document.getElementById("taskInput-name");
    const taskInputDesc = document.getElementById("taskInput-desc");
    const taskListPopup = document.getElementById("task-list-popup");
    const taskList = document.getElementById("task-list");

    const taskCreateBtn = document.getElementById("taskCreate-btn");
    const cancelTaskBtn = document.getElementById("cancelTask");
    const taskListBtn = document.getElementById("taskListView");
    const closeListBtn = document.getElementById("close-task-list");
    const saveTaskBtn = document.getElementById("saveTask");

    // subtask elements
    const subtaskInput = document.getElementById("subtaskInput");
    const addSubtaskBtn = document.getElementById("addSubtask");
    const subtaskList = document.getElementById("subtaskList");

    // load tasks from localStorage on startup
    window.addEventListener("load", () => {
        const storedTasks = localStorage.getItem("tasks");
        if (storedTasks) {
            tasks = JSON.parse(storedTasks);
        }
    });

    // save tasks to localStorage
    function saveTasksToStorage() {
        localStorage.setItem("tasks", JSON.stringify(tasks));
    }

    // toggle task input area
    taskCreateBtn.addEventListener("click", () => {
        taskModal.style.display = "flex";
    });

    cancelTaskBtn.addEventListener("click", () => {
        taskModal.style.display = "none";
        resetTaskForm();
    });

    // close popup when clicking outside modal content
    taskModal.addEventListener("click", (e) => {
        if (e.target === taskModal) {
            taskModal.style.display = "none";
            resetTaskForm();
        }
    });

    // add subtask
    addSubtaskBtn.addEventListener("click", () => {
        const subtaskName = subtaskInput.value.trim();

        if (!subtaskName) return;

        if (isEditing) {
            //update existing subtask
            tasks.editingTaskIndex.subtaskList[editingSubtaskIndex].name = subtaskName;
        }
        // SUBTASK OBJECT IS HERE!!!
            const newSubtask = {
                id: Date.now(),
                name: subtaskName,
                // reminderTime: null, //i.e. remind me at 7:20am
                // reminderDelay: null, //i.e. remind me in 5 minutes
                completed: false,
            };

        currentSubtasks.push(newSubtask);

        const li = document.createElement("li");
        li.textContent = subtaskName;

        // optionally allow deleting subtasks
        const removeBtn = document.createElement("button");
        removeBtn.textContent = "x";
        removeBtn.style.marginLeft = "10px";
        removeBtn.addEventListener("click", () => {
            subtaskList.removeChild(li);
            currentSubtasks = currentSubtasks.filter(
                (st) => st !== subtaskName
            );
        });

        li.appendChild(removeBtn);
        subtaskList.appendChild(li);

        subtaskInput.value = "";
        subtaskInput.focus();
    });

    // save a new task
    saveTaskBtn.addEventListener("click", () => {
        const taskName = taskInputName.value.trim();
        const taskDesc = taskInputDesc.value.trim();

        if (!taskName) {
            alert("Task name is required.");
            return;
        }

        let taskSetting = null;

        if (isEditing) {
            //update existing task
            tasks[editingTaskIndex].name = taskName;
            tasks[editingTaskIndex].description = taskDesc || null;
            tasks[editingTaskIndex].subtasks = [...currentSubtasks];
            taskSetting = "edited";
        } else {
            // TASK OBJECT IS HERE!!!
            const newTask = {
                id: Date.now(),
                name: taskName,
                description: taskDesc || null,
                subtasks: [...currentSubtasks],
                // reminderTime: null, //i.e. remind me at 7:20am
                // reminderDelay: null, //i.e. remind me in 5 minutes
                completed: false,
            };
            taskSetting = "created";
            tasks.push(newTask);
        }

        saveTasksToStorage();
        resetTaskForm();

        taskModal.style.display = "none";

        alert(`Task "${taskName}" "${taskSetting}" successfully!`);
    });

    // show all tasks
    taskListBtn.addEventListener("click", () => {
        renderTaskList();
        document.body.classList.add("modal-open");
        taskListPopup.style.display = "flex";
    });

    // close popup
    closeListBtn.addEventListener("click", () => {
        document.body.classList.remove("modal-open");
        taskListPopup.style.display = "none";
        resetTaskForm();
    });

    // close popup by clicking outside
    taskListPopup.addEventListener("click", (e) => {
        if (e.target === taskListPopup) {
            document.body.classList.remove("modal-open");
            taskListPopup.style.display = "none";
            resetTaskForm();
        }
    });

    function renderTaskList() {
        taskList.innerHTML = "";

        if (tasks.length === 0) {
            const li = document.createElement("li");
            li.textContent = "No tasks created yet.";
            taskList.appendChild(li);
            return;
        }

        tasks.forEach((task, index) => {
            const li = document.createElement("li");
            li.innerHTML = `
            <div class="task-item ${task.completed ? "completed" : ""}">
            <div class="task-info">
                <strong>${task.name}</strong><br>
                ${task.description ? `<em>${task.description}</em><br>` : ""}
                ${
                    task.subtasks.length
                        ? `<ul>${task.subtasks
                              .map((st) => `<li>${st}</li>`)
                              .join("")}</ul>`
                        : ""
                }
            </div>
            <div class="task-actions">
                <button class="complete-task" data-index="${index}">
                ${task.completed ? "↩ Undo" : "✔ Done"}
                </button>
                <button class="edit-task" data-index="${index}">
                Edit
                </button>
                <button class="delete-task" data-index="${index}">×</button>
            </div>
            </div>
        `;
            taskList.appendChild(li);
        });

        // Add delete event listeners
        document.querySelectorAll(".delete-task").forEach((btn) => {
            btn.addEventListener("click", (e) => {
                const index = e.target.dataset.index;
                deleteTask(index);
            });
        });

        // Add edit event listeners
        document.querySelectorAll(".edit-task").forEach((btn) => {
            btn.addEventListener("click", (e) => {
                const index = e.target.dataset.index;
                editTask(index);
            });
        });

        // Add complete/undo event listeners
        document.querySelectorAll(".complete-task").forEach((btn) => {
            btn.addEventListener("click", (e) => {
                const index = e.target.dataset.index;
                toggleTaskCompletion(index);
            });
        });
    }

    function editTask(index) {
        const task = tasks[index];
        const taskName = task.name;
        const confirmed = confirm(
            `Are you sure you want to edit "${taskName}"?`
        );
        if (!confirmed) return;

        const taskModal = document.getElementById("task-modal");
        const taskInputName = document.getElementById("taskInput-name");
        const taskInputDesc = document.getElementById("taskInput-desc");
        const subtaskList = document.getElementById("subtaskList");
        const saveTaskBtn = document.getElementById("saveTask");

        taskModal.style.display = "flex";

        taskInputName.value = task.name;
        taskInputDesc.value = task.description || "";

        //clear old subtasks in modal
        subtaskList.innerHTML = "";
        currentSubtasks = [...task.subtasks];
        currentSubtasks.forEach((st) => {
            const li = document.createElement("li");
            li.textContent = st;
            subtaskList.appendChild(li);
        });

        isEditing = true;
        editingTaskIndex = index;
    }

    function deleteTask(index) {
        const taskName = tasks[index].name;
        const confirmed = confirm(
            `Are you sure you want to delete "${taskName}"?`
        );
        if (!confirmed) return;

        tasks.splice(index, 1); // remove task
        saveTasksToStorage(); // update storage
        renderTaskList(); // refresh the view
    }

    function toggleTaskCompletion(index) {
        tasks[index].completed = !tasks[index].completed;
        saveTasksToStorage();
        renderTaskList(); // re-render to update UI
    }

    function resetTaskForm() {
        // clear inputs, not the structure
        taskInputName.value = "";
        taskInputDesc.value = "";
        subtaskInput.value = "";
        subtaskList.innerHTML = ""; // only clears list content
        currentSubtasks = [];

        //reset edit mode
        isEditing = false;
        editingTaskIndex = null;

        //refresh task list view
        renderTaskList();
    }
}

// ROUTINE STUFF
if (document.getElementById("routineCreate-btn")) {
    const routineCreateBtn = document.getElementById("routineCreate-btn");
    const routineModal = document.getElementById("routine-modal");
    const routineCancelBtn = document.getElementById("cancelRoutine-btn");
    const routineSaveBtn = document.getElementById("saveRoutine-btn");
    const routineNameInput = document.getElementById("routineName-input");
    const addTaskArea = document.getElementById("addTask-area");

    const routineListPopup = document.getElementById("routine-list-popup");
    const routineList = document.getElementById("routine-list");
    const routineListBtn = document.getElementById("routineListView");
    const closeListBtn = document.getElementById("close-routine-list");

    // open routine creation modal
    routineCreateBtn.addEventListener("click", () => {
        routineModal.style.display = "flex";
        loadTasksFromLocalStorage();
    });

    function loadTasksFromLocalStorage() {
        const storedTasks = localStorage.getItem("tasks");
        addTaskArea.innerHTML = "";

        if (!storedTasks) {
            addTaskArea.innerHTML = "<p>No tasks found.</p>";
            return;
        }

        const tasks = JSON.parse(storedTasks);

        if (tasks.length === 0) {
            addTaskArea.innerHTML =
                "<p>No tasks found. Create tasks first.</p>";
            return;
        }

        const header = document.createElement("h3");
        header.textContent = "Select Existing Tasks:";
        addTaskArea.appendChild(header);

        tasks.forEach((task) => {
            const label = document.createElement("label");
            label.innerHTML = `
                <input type="checkbox" value="${task.id}">
                ${task.name}
            `;
            addTaskArea.appendChild(label);
        });
    }

    // cancel routine creation
    routineCancelBtn.addEventListener("click", () => {
        routineModal.style.display = "none";
        routineNameInput.value = "";
        addTaskArea.innerHTML = "";
    });

    // save new routine
    routineSaveBtn.addEventListener("click", () => {
        const routineName = routineNameInput.value.trim();
        const selectedTaskIds = Array.from(
            addTaskArea.querySelectorAll('input[type="checkbox"]:checked')
        ).map((cb) => cb.value);

        if (!routineName) {
            alert("Please enter a routine name.");
            return;
        }

        const storedRoutines =
            JSON.parse(localStorage.getItem("routines")) || [];

        const newRoutine = {
            id: Date.now(),
            name: routineName,
            taskIds: selectedTaskIds,
        };

        storedRoutines.push(newRoutine);
        localStorage.setItem("routines", JSON.stringify(storedRoutines));

        alert("Routine saved successfully!");

        // close modal and reset form
        routineModal.style.display = "none";
        routineNameInput.value = "";
        addTaskArea.innerHTML = "";
    });

    // show routine list
    routineListBtn.addEventListener("click", () => {
        renderRoutineList();
        document.body.classList.add("modal-open");
        routineListPopup.style.display = "flex";
    });

    // close popup
    closeListBtn.addEventListener("click", () => {
        document.body.classList.remove("modal-open");
        routineListPopup.style.display = "none";
    });

    // close popup by clicking outside
    routineListPopup.addEventListener("click", (e) => {
        if (e.target === routineListPopup) {
            document.body.classList.remove("modal-open");
            routineListPopup.style.display = "none";
        }
    });

    // render routine list
    function renderRoutineList() {
        routineList.innerHTML = "";

        const storedRoutines =
            JSON.parse(localStorage.getItem("routines")) || [];
        const storedTasks = JSON.parse(localStorage.getItem("tasks")) || [];

        if (storedRoutines.length === 0) {
            const li = document.createElement("li");
            li.textContent = "No routines created yet.";
            routineList.appendChild(li);
            return;
        }

        storedRoutines.forEach((routine, index) => {
            const routineTasks = routine.taskIds
                .map((taskId) => storedTasks.find((task) => task.id == taskId))
                .filter(Boolean);

            const taskListHTML = routineTasks.length
                ? `
                <ul> ${routineTasks
                    .map(
                        (task) => `
                    <li>
                        <strong>${task.name}</strong>
                        ${
                            task.description
                                ? `<br>
                        <em>${task.description}</em>`
                                : ""
                        }
                        ${
                            task.subtasks && task.subtasks.length
                                ? `
                            <ul>${task.subtasks
                                .map((st) => `<li>${st}</li>`)
                                .join("")}
                            </ul>`
                                : ""
                        }
                    </li>`
                    )
                    .join("")}
                </ul>`
                : "<em>No tasks linked</em>";

            const li = document.createElement("li");
            li.innerHTML = `
                <div class="routine-item">
                    <div class="routine-info">
                        <strong>${routine.name}</strong>
                        ${taskListHTML}
                    </div>
                    <div class="routine-actions">
                        <button class="delete-routine" data-index="${index}">Delete</button>
                    </div>
                </div>
            `;
            routineList.appendChild(li);
        });

        // delete routine event
        document.querySelectorAll(".delete-routine").forEach((btn) => {
            btn.addEventListener("click", (e) => {
                const index = e.target.dataset.index;
                deleteRoutine(index);
            });
        });
    }

    // delete routine
    function deleteRoutine(index) {
        const storedRoutines =
            JSON.parse(localStorage.getItem("routines")) || [];
        storedRoutines.splice(index, 1);
        localStorage.setItem("routines", JSON.stringify(storedRoutines));
        renderRoutineList();
    }
}

function openModal(el) {
    el.style.display = "flex";
    document.body.classList.add("no-scroll");
}
function closeModal(el) {
    el.style.display = "none";
    document.body.classList.remove("no-scroll");
}

/* =Reminders */
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

    const LS_KEY = "quickReminders";

    // State
    let reminders = [];
    try {
        reminders = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
    } catch {
        reminders = [];
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

    function clearForm() {
        form.reset();
        editIndexEl.value = "";
        const now = new Date();
        now.setMinutes(now.getMinutes() + 60);
        dueEl.value = toLocalInputValue(now);
    }

    function toLocalInputValue(dt) {
        const pad = (n) => String(n).padStart(2, "0");
        return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(
            dt.getDate()
        )}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
    }

    function readForm() {
        return {
            title: (titleEl.value || "").trim(),
            due: dueEl.value || "",
            notes: (notesEl.value || "").trim(),
            done: false,
        };
    }

    function saveLS() {
        localStorage.setItem(LS_KEY, JSON.stringify(reminders));
    }

    function escapeHtml(s) {
        return String(s).replace(/</g, "&lt;");
    }

    function render() {
        tbody.innerHTML = "";
        reminders
            .map((r, i) => ({ ...r, _i: i }))
            .sort((a, b) => (a.due || "").localeCompare(b.due || ""))
            .forEach((r) => {
                const tr = document.createElement("tr");
                tr.innerHTML = `
          <td>${r.due ? new Date(r.due).toLocaleString() : ""}</td>
          <td>${escapeHtml(r.title)}</td>
          <td>${escapeHtml(r.notes || "")}</td>
          <td>
            <button type="button" class="button button--small btn-secondary" data-edit="${
                r._i
            }">Edit</button>
            <button type="button" class="button button--small btn-secondary" data-del="${
                r._i
            }">Delete</button>
          </td>`;
                tbody.appendChild(tr);
            });
    }

    // Save
    form.addEventListener("submit", (ev) => {
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
            data.due = new Date(data.due).toISOString();
        } catch {}

        const idx = editIndexEl.value !== "" ? Number(editIndexEl.value) : -1;
        if (idx >= 0 && idx < reminders.length) reminders[idx] = data;
        else reminders.push(data);

        saveLS();
        clearForm();
        render();
        closeModal(modal);
    });

    // Edit/Delete
    tbody.addEventListener("click", (e) => {
        const del = e.target.closest("[data-del]");
        const edt = e.target.closest("[data-edit]");
        if (del) {
            const i = +del.dataset.del;
            if (Number.isInteger(i) && i >= 0 && i < reminders.length) {
                if (confirm("Delete this reminder?")) {
                    reminders.splice(i, 1);
                    saveLS();
                    render();
                }
            }
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

    // Clear All
    clearAllBtn?.addEventListener("click", (e) => {
        e.preventDefault();
        if (!reminders.length) {
            alert("There are no reminders to clear.");
            return;
        }
        if (confirm("Clear ALL reminders? This cannot be undone.")) {
            reminders = [];
            saveLS();
            render();
        }
    });

    // Alert when reminder is due
    setInterval(() => {
        const now = Date.now();
        let changed = false;
        reminders.forEach((r) => {
            if (!r || r.done || !r.due) return;
            const dueMs = +new Date(r.due);
            if (dueMs && now - dueMs >= 0 && now - dueMs < 30000) {
                alert(`Reminder due: ${r.title}`);
                r.done = true;
                changed = true;
            }
        });
        if (changed) saveLS();
    }, 30000);

    render();
})();

// Diet Log
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

    dietCreateBtn?.addEventListener("click", () => openModal(dietModal));
    dietCancelBtn?.addEventListener("click", () => {
        clearForm();
        closeModal(dietModal);
    });
    dietModal?.addEventListener("click", (e) => {
        if (!e.target.closest(".task-modal-content")) closeModal(dietModal);
    });

    const LS_KEY = "dietLog";
    let entries = [];
    try {
        entries = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
    } catch {}

    let view = { from: "", to: "", meal: "" };
    const today = () => new Date().toISOString().slice(0, 10);

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
        };
    }
    function saveLS() {
        localStorage.setItem(LS_KEY, JSON.stringify(entries));
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
        <td>${e.date || ""}</td><td>${e.meal || ""}</td><td>${e.food || ""}</td>
        <td>${e.cal || 0}</td><td>${e.protein || 0}</td><td>${
                    e.carbs || 0
                }</td><td>${e.fat || 0}</td>
        <td>${(e.notes || "").replace(/</g, "&lt;")}</td><td>${
                    e.safe ? "✓" : ""
                }</td>
        <td>
          <button type="button" class="button button--small btn-secondary" data-edit="${
              e._i
          }">Edit</button>
          <button type="button" class="button button--small btn-secondary" data-del="${
              e._i
          }">Delete</button>
        </td>`;
                tbody.appendChild(tr);
            });
        totalCal.textContent = Math.round(totals.cal);
        totalProtein.textContent = +totals.p.toFixed(1);
        totalCarbs.textContent = +totals.c.toFixed(1);
        totalFat.textContent = +totals.f.toFixed(1);
    }

    form.addEventListener("submit", (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        const data = readForm();
        if (!data.food) {
            alert("Please enter a food name.");
            return;
        }
        const idx = editIndexEl.value !== "" ? Number(editIndexEl.value) : -1;
        if (idx >= 0 && idx < entries.length) entries[idx] = data;
        else entries.push(data);
        saveLS();
        view = { from: "", to: "", meal: "" };
        filterFromEl.value = "";
        filterToEl.value = "";
        filterMealEl.value = "";
        clearForm();
        render();
        closeModal(dietModal);
        console.log("[Diet] saved", data);
    });

    // Edit/Delete
    tbody.addEventListener("click", (e) => {
        const del = e.target.closest("[data-del]");
        const edt = e.target.closest("[data-edit]");
        if (del) {
            const i = +del.dataset.del;
            if (Number.isInteger(i) && i >= 0 && i < entries.length) {
                if (confirm("Delete this entry?")) {
                    entries.splice(i, 1);
                    saveLS();
                    render();
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

        if (!Array.isArray(entries) || entries.length === 0) {
            if (!confirm("No entries found. Export an empty CSV anyway?"))
                return;
        }

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

        const data = Array.isArray(entries) ? entries : [];
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

    // Clear All
    clearAllBtn?.addEventListener("click", (e) => {
        e.preventDefault();
        if (!entries?.length) {
            alert("There are no entries to clear.");
            return;
        }
        if (confirm("Clear diet log entries?")) {
            entries = [];
            localStorage.setItem("dietLog", JSON.stringify(entries));
            render();
        }
    });

    // Init
    if (!dateEl.value) dateEl.value = today();
    render();
})();

// show routine list
routineListBtn.addEventListener("click", () => {
    renderRoutineList();
    document.body.classList.add("modal-open");
    routineListPopup.style.display = "flex";
});

// close popup
closeListBtn.addEventListener("click", () => {
    document.body.classList.remove("modal-open");
    routineListPopup.style.display = "none";
});

// close popup by clicking outside
routineListPopup.addEventListener("click", (e) => {
    if (e.target === routineListPopup) {
        document.body.classList.remove("modal-open");
        routineListPopup.style.display = "none";
    }
});

// render routine list
function renderRoutineList() {
    routineList.innerHTML = "";

    const storedRoutines = JSON.parse(localStorage.getItem("routines")) || [];
    const storedTasks = JSON.parse(localStorage.getItem("tasks")) || [];

    if (storedRoutines.length === 0) {
        const li = document.createElement("li");
        li.textContent = "No routines created yet.";
        routineList.appendChild(li);
        return;
    }

    storedRoutines.forEach((routine, index) => {
        const routineTasks = routine.taskIds
            .map((taskId) => storedTasks.find((task) => task.id == taskId))
            .filter(Boolean);

        const taskListHTML = routineTasks.length
            ? `
                <ul> ${routineTasks
                    .map(
                        (task) => `
                    <li>
                        <strong>${task.name}</strong>
                        ${
                            task.description
                                ? `<br>
                        <em>${task.description}</em>`
                                : ""
                        }
                        ${
                            task.subtasks && task.subtasks.length
                                ? `
                            <ul>${task.subtasks
                                .map((st) => `<li>${st}</li>`)
                                .join("")}
                            </ul>`
                                : ""
                        }
                    </li>`
                    )
                    .join("")}
                </ul>`
            : "<em>No tasks linked</em>";

        const li = document.createElement("li");
        li.innerHTML = `
                <div class="routine-item">
                    <div class="routine-info">
                        <strong>${routine.name}</strong>
                        ${taskListHTML}
                    </div>
                    <div class="routine-actions">
                        <button class="delete-routine" data-index="${index}">Delete</button>
                    </div>
                </div>
            `;
        routineList.appendChild(li);
    });

    // delete routine event
    document.querySelectorAll(".delete-routine").forEach((btn) => {
        btn.addEventListener("click", (e) => {
            const index = e.target.dataset.index;
            deleteRoutine(index);
        });
    });
}

// delete routine
function deleteRoutine(index) {
    const storedRoutines = JSON.parse(localStorage.getItem("routines")) || [];
    storedRoutines.splice(index, 1);
    localStorage.setItem("routines", JSON.stringify(storedRoutines));
    renderRoutineList();
}
