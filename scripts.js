// TASK STUFF
//global
let tasks = [];
let currentSubtasks = []; // temporary subtasks for the task being created
let isEditing = false;
let editingTaskIndex = null;

if(document.getElementById('taskCreate-btn')) {
    const taskModal = document.getElementById('task-modal');
    const taskArea = document.getElementById('task-area');
    const taskInputName = document.getElementById('taskInput-name');
    const taskInputDesc = document.getElementById('taskInput-desc');
    const taskListPopup = document.getElementById('task-list-popup');
    const taskList = document.getElementById('task-list');

    const taskCreateBtn = document.getElementById('taskCreate-btn');
    const cancelTaskBtn = document.getElementById('cancelTask');
    const taskListBtn = document.getElementById('taskListView');
    const closeListBtn = document.getElementById('close-task-list');
    const saveTaskBtn = document.getElementById('saveTask');

    // subtask elements
    const subtaskInput = document.getElementById('subtaskInput');
    const addSubtaskBtn = document.getElementById('addSubtask');
    const subtaskList = document.getElementById('subtaskList');

    // load tasks from localStorage on startup
    window.addEventListener('load', () => {
        const storedTasks = localStorage.getItem('tasks');
        if (storedTasks) {
            tasks = JSON.parse(storedTasks);
        }
    });

    // save tasks to localStorage
    function saveTasksToStorage() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    // toggle task input area
    taskCreateBtn.addEventListener('click', () => {
        taskModal.style.display = 'flex';
    });

    cancelTaskBtn.addEventListener('click', () => {
        taskModal.style.display = 'none';
    });

    // close popup when clicking outside modal content
    taskModal.addEventListener('click', (e) => {
        if (e.target === taskModal) {
            taskModal.style.display = 'none';
        }
    })

    // add subtask
    addSubtaskBtn.addEventListener('click', () => {
        const subtaskName = subtaskInput.value.trim();

        if (!subtaskName) return;

        currentSubtasks.push(subtaskName);

        const li = document.createElement('li');
        li.textContent = subtaskName;

        // optionally allow deleting subtasks
        const removeBtn = document.createElement('button');
        removeBtn.textContent = 'x';
        removeBtn.style.marginLeft = '10px';
        removeBtn.addEventListener('click', () => {
            subtaskList.removeChild(li);
            currentSubtasks = currentSubtasks.filter(st => st !== subtaskName);
        });

        li.appendChild(removeBtn);
        subtaskList.appendChild(li);

        subtaskInput.value = '';
        subtaskInput.focus();
    });

    // save a new task
    saveTaskBtn.addEventListener('click', () => {
        const taskName = taskInputName.value.trim();
        const taskDesc = taskInputDesc.value.trim();

        if (!taskName) {
            alert('Task name is required.');
            return;
        }

        let taskSetting = null;
    
        if (isEditing) {
            //update existing task
            tasks[editingTaskIndex].name = taskName;
            tasks[editingTaskIndex].description = taskDesc || null;
            tasks[editingTaskIndex].subtasks = [...currentSubtasks];
            taskSetting = 'edited'
        } else {
            // TASK OBJECT IS HERE!!!
            const newTask = {
                name: taskName,
                description: taskDesc || null,
                subtasks: [...currentSubtasks],
                // reminderTime: null, //i.e. remind me at 7:20am
                // reminderDelay: null, //i.e. remind me in 5 minutes
                completed: false
            };
            taskSetting = 'created'
            tasks.push(newTask);
        }

        saveTasksToStorage();
        resetTaskForm();

        taskModal.style.display = 'none';

        alert(`Task "${taskName}" "${taskSetting}" successfully!`);
    });

    // show all tasks
    taskListBtn.addEventListener('click', () => {
        renderTaskList();
        document.body.classList.add('modal-open');
        taskListPopup.style.display = 'flex';
    });

    // close popup
    closeListBtn.addEventListener('click', () => {
        document.body.classList.remove('modal-open');
        taskListPopup.style.display = 'none';
    });

    // close popup by clicking outside
    taskListPopup.addEventListener('click', (e) => {
        if (e.target === taskListPopup) {
            document.body.classList.remove('modal-open');
            taskListPopup.style.display = 'none';
        }
    });

    function renderTaskList() {
        taskList.innerHTML = '';

        if (tasks.length === 0) {
            const li = document.createElement('li');
            li.textContent = 'No tasks created yet.';
            taskList.appendChild(li);
            return;
        }

        tasks.forEach((task, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <div class="task-item ${task.completed ? 'completed' : ''}">
            <div class="task-info">
                <strong>${task.name}</strong><br>
                ${task.description ? `<em>${task.description}</em><br>` : ''}
                ${task.subtasks.length
                ? `<ul>${task.subtasks.map(st => `<li>${st}</li>`).join('')}</ul>`
                : ''}
            </div>
            <div class="task-actions">
                <button class="complete-task" data-index="${index}">
                ${task.completed ? '↩ Undo' : '✔ Done'}
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
        document.querySelectorAll('.delete-task').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = e.target.dataset.index;
                deleteTask(index);
            });
        });

        // Add edit event listeners
        document.querySelectorAll('.edit-task').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = e.target.dataset.index;
                editTask(index);
            });
        });

        // Add complete/undo event listeners
        document.querySelectorAll('.complete-task').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = e.target.dataset.index;
                toggleTaskCompletion(index);
            });
        });
    }

    function editTask(index) {
        const task = tasks[index];
        const taskName = task.name;
        const confirmed = confirm(`Are you sure you want to edit "${taskName}"?`);
        if (!confirmed) return;

        const taskModal = document.getElementById('task-modal');
        const taskInputName = document.getElementById('taskInput-name');
        const taskInputDesc = document.getElementById('taskInput-desc');
        const subtaskList = document.getElementById('subtaskList');
        const saveTaskBtn = document.getElementById('saveTask');

        taskModal.style.display = 'flex';

        taskInputName.value = task.name;
        taskInputDesc.value = task.description || '';

        //clear old subtasks in modal
        subtaskList.innerHTML = '';
        currentSubtasks = [...task.subtasks];
        currentSubtasks.forEach(st => {
            const li = document.createElement('li');
            li.textContent = st;
            subtaskList.appendChild(li);
        })

        isEditing = true;
        editingTaskIndex = index;
    }

    function deleteTask(index) {
        const taskName = tasks[index].name;
        const confirmed = confirm(`Are you sure you want to delete "${taskName}"?`);
        if (!confirmed) return;

        tasks.splice(index, 1); // remove task
        saveTasksToStorage();   // update storage
        renderTaskList();       // refresh the view
    }

    function toggleTaskCompletion(index) {
        tasks[index].completed = !tasks[index].completed;
        saveTasksToStorage();
        renderTaskList(); // re-render to update UI
    }

    function resetTaskForm() {
        // clear inputs, not the structure
        taskInputName.value = '';
        taskInputDesc.value = '';
        subtaskInput.value = '';
        subtaskList.innerHTML = ''; // only clears list content
        currentSubtasks = [];

        //reset edit mode
        isEditing = false;
        editingTaskIndex = null;

        //refresh task list view
        renderTaskList();
    }
}

// ROUTINE STUFF 
if(document.getElementById('routineCreate-btn')) {
    const routineCreateBtn = document.getElementById('routineCreate-btn');
    const routineModal = document.getElementById('routine-modal');
    const routineCancelBtn = document.getElementById('cancelRoutine-btn');
    const routineSaveBtn = document.getElementById('saveRoutine-btn');
    const routineNameInput = document.getElementById('routineName-input');
    const addTaskArea = document.getElementById('addTask-area');

    routineCreateBtn.addEventListener('click', () => {
        routineModal.style.display = 'block';
        loadTaskFromLocalStorage();
    });

    function loadTaskFromLocalStorage() {
        const storedTasks = localStorage.getItem('tasks');
        addTaskArea.innerHTML = '';

        if(!storedTasks) {
            addTaskArea.innerHTML = 'No tasks found.';
            return;
        }

        const tasks = JSON.parse(storedTasks);

        if (tasks.length === 0) {
            addTaskArea.innerHTML = '<p>No tasks found. Create tasks first.</p>';
            return;
        }

        const header = document.createElement('h3');
        header.textContent = 'Select Existing Tasks:';
        addTaskArea.appendChild(header);

        tasks.forEach(task => {
            const label = document.createElement('label');
            label.innerHTML = `
                <input type="checkbox" value="${task.id}">
                ${task.name}
            `;
            addTaskArea.appendChild(label);
        });
    }

    routineCancelBtn.addEventListener('click', () => {
        routineModal.style.display = 'none';
        routineNameInput.value = '';
        addTaskArea.innerHTML = '';
    })

    routineSaveBtn.addEventListener('click', () => {
        const routineName = routineNameInput.value.trim();
        const selectedTaskIds = Array.from(addTaskArea.querySelectorAll('input[type="checkbox"]:checked'))
            .map(cb => cb.value);

        if (!routineName) {
            alert('Please enter a routine name.');
            return;
        }

        const storedRoutines = JSON.parse(localStorage.getItem('routines')) || [];

        const newRoutine = {
            id: Date.now(),
            name: routineName,
            taskIds: selectedTaskIds,
        };

        storedRoutines.push(newRoutine);
        localStorage.setItem('routines', JSON.stringify(storedRoutines));

        alert('Routine saved successfully!');

        // close modal and reset form
        routineModal.style.display = 'none';
        routineNameInput.value = '';
        addTaskArea.innerHTML = '';
    });
}

(() => {
    const pageRoot = document.body;
    if (!pageRoot || pageRoot.id !== "diet-log-page") return;

    const LS_KEY = "dietLog";

    // Elements
    const form = document.getElementById("diet-form");
    const dateEl = document.getElementById("diet-date");
    const mealEl = document.getElementById("diet-meal");
    const foodEl = document.getElementById("diet-food");
    const calEl = document.getElementById("diet-cal");
    const proteinEl = document.getElementById("diet-protein");
    const carbsEl = document.getElementById("diet-carbs");
    const fatEl = document.getElementById("diet-fat");
    const notesEl = document.getElementById("diet-notes");
    const editIndexEl = document.getElementById("diet-edit-index");
    const safeEl = document.getElementById("diet-safe");

    const tbody = document.getElementById("diet-tbody");

    const totalCal = document.getElementById("total-cal");
    const totalProtein = document.getElementById("total-protein");
    const totalCarbs = document.getElementById("total-carbs");
    const totalFat = document.getElementById("total-fat");

    const filterFromEl = document.getElementById("diet-filter-from");
    const filterToEl = document.getElementById("diet-filter-to");
    const filterMealEl = document.getElementById("diet-filter-meal");
    const applyFilterBtn = document.getElementById("diet-apply-filter");
    const resetFilterBtn = document.getElementById("diet-reset-filter");

    const exportCsvBtn = document.getElementById("diet-export-csv");
    const exportJsonBtn = document.getElementById("diet-export-json");
    const importJsonInput = document.getElementById("diet-import-json");
    const clearAllBtn = document.getElementById("diet-clear-all");
    const clearFormBtn = document.getElementById("diet-clear-btn");

    let entries = load();
    let view = { from: "", to: "", meal: "" };

    if (!dateEl.value) {
        const today = new Date().toISOString().slice(0, 10);
        dateEl.value = today;
    }

    function load() {
        try {
        return JSON.parse(localStorage.getItem(LS_KEY) || "[]");
        } catch {
        return [];
        }
    }
    function save() {
        localStorage.setItem(LS_KEY, JSON.stringify(entries));
    }

    function withinFilter(e) {
        const eDate = e.date || "";
        const from = view.from;
        const to = view.to;

        if (from && eDate < from) return false;
        if (to && eDate > to) return false;
        if (view.meal && e.meal !== view.meal) return false;
        return true;
    }

    function render() {
        tbody.innerHTML = "";
        let totals = { cal: 0, p: 0, c: 0, f: 0 };

        entries
        .map((e, i) => ({ ...e, _i: i }))
        .filter(withinFilter)
        .sort((a, b) => a.date.localeCompare(b.date))
        .forEach((e) => {
            totals.cal += Number(e.cal || 0);
            totals.p += Number(e.protein || 0);
            totals.c += Number(e.carbs || 0);
            totals.f += Number(e.fat || 0);

            const tr = document.createElement("tr");
            tr.innerHTML = `
            <td>${e.date || ""}</td>
            <td>${e.meal || ""}</td>
            <td>${e.food || ""}</td>
            <td>${e.cal || 0}</td>
            <td>${e.protein || 0}</td>
            <td>${e.carbs || 0}</td>
            <td>${e.fat || 0}</td>
            <td>${(e.notes || "").replace(/</g,"&lt;")}</td>
            <td>${e.safe ? "✓" : ""}</td>
            <td>
                <button type="button" class="button button--small" data-edit="${e._i}">Edit</button>
                <button type="button" class="button button--small" data-del="${e._i}">Delete</button>
            </td>
            `;
            tbody.appendChild(tr);
        });

        totalCal.textContent = Math.round(totals.cal);
        totalProtein.textContent = +totals.p.toFixed(1);
        totalCarbs.textContent = +totals.c.toFixed(1);
        totalFat.textContent = +totals.f.toFixed(1);
    }

    function clearForm() {
        form.reset();
        editIndexEl.value = "";
        safeEl.checked = false;
        // resets to today if cleared
        if (!dateEl.value) dateEl.value = new Date().toISOString().slice(0, 10);
    }

    function readForm() {
        return {
        date: dateEl.value || "",
        meal: mealEl.value || "",
        food: foodEl.value.trim(),
        cal: Number(calEl.value || 0),
        protein: Number(proteinEl.value || 0),
        carbs: Number(carbsEl.value || 0),
        fat: Number(fatEl.value || 0),
        notes: notesEl.value.trim(),
        safe: Boolean(safeEl.checked),
        };
    }

    function populateForm(e) {
        dateEl.value = e.date || "";
        mealEl.value = e.meal || "Lunch";
        foodEl.value = e.food || "";
        calEl.value = e.cal ?? "";
        proteinEl.value = e.protein ?? "";
        carbsEl.value = e.carbs ?? "";
        fatEl.value = e.fat ?? "";
        notesEl.value = e.notes || "";
        safeEl.checked = Boolean(e.safe);
    }

    // Events
    form.addEventListener("submit", (ev) => {
        ev.preventDefault();
        const data = readForm();
        if (!data.food) {
        alert("Please enter a food name.");
        return;
        }

        const idx = editIndexEl.value === "" ? -1 : Number(editIndexEl.value);
        if (idx >= 0 && idx < entries.length) {
        entries[idx] = data;
        } else {
        entries.push(data);
        }
        save();
        clearForm();
        render();
    });

    clearFormBtn.addEventListener("click", clearForm);

    tbody.addEventListener("click", (ev) => {
        const delBtn = ev.target.closest("[data-del]");
        const editBtn = ev.target.closest("[data-edit]");

        if (delBtn) {
            const raw = delBtn.getAttribute("data-del");
            const idx = Number.parseInt(raw, 10);
            if (Number.isNaN(idx) || idx < 0 || idx >= entries.length) return;

            if (confirm("Delete this entry?")) {
            entries.splice(idx, 1);
            save();
            render();
            }
            return;
        }

        if (editBtn) {
            const raw = editBtn.getAttribute("data-edit");
            const idx = Number.parseInt(raw, 10);
            if (Number.isNaN(idx) || idx < 0 || idx >= entries.length) return;

            const entry = entries[idx];
            populateForm(entry);
            editIndexEl.value = String(idx);
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    });

    applyFilterBtn.addEventListener("click", () => {
        view = {
        from: filterFromEl.value || "",
        to: filterToEl.value || "",
        meal: filterMealEl.value || "",
        };
        render();
    });

    resetFilterBtn.addEventListener("click", () => {
        filterFromEl.value = "";
        filterToEl.value = "";
        filterMealEl.value = "";
        view = { from: "", to: "", meal: "" };
        render();
    });

    exportCsvBtn.addEventListener("click", () => {
        const rows = [
        ["date","meal","food","calories","protein","carbs","fat","notes","safe"],
        ...entries.map(e => [
            e.date, e.meal, e.food,
            e.cal, e.protein, e.carbs, e.fat,
            (e.notes || "").replace(/"/g, '""'),
            e.safe ? "true" : "false"
        ])
        ];
        const csv = rows.map(r =>
        r.map(v => typeof v === "string" && /[",\n]/.test(v) ? `"${v}"` : v).join(",")
        ).join("\n");

        const blob = new Blob([csv], { type: "text/csv" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `diet-log-${new Date().toISOString().slice(0,10)}.csv`;
        a.click();
        URL.revokeObjectURL(a.href);
    });

    exportJsonBtn.addEventListener("click", () => {
        const blob = new Blob([JSON.stringify(entries, null, 2)], { type: "application/json" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `diet-log-${new Date().toISOString().slice(0,10)}.json`;
        a.click();
        URL.revokeObjectURL(a.href);
    });

    importJsonInput.addEventListener("change", () => {
        const file = importJsonInput.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
        try {
            const data = JSON.parse(String(reader.result));
            if (!Array.isArray(data)) throw new Error("Invalid JSON format");
            entries = data.map(e => ({
            date: e.date || "",
            meal: e.meal || "Lunch",
            food: e.food || "",
            cal: Number(e.cal || 0),
            protein: Number(e.protein || 0),
            carbs: Number(e.carbs || 0),
            fat: Number(e.fat || 0),
            notes: e.notes || "",
            safe: Boolean(e.safe),
            }));
            save();
            render();
            alert("Import complete.");
        } catch (err) {
            alert("Import failed: " + err.message);
        } finally {
            importJsonInput.value = "";
        }
        };
        reader.readAsText(file);
    });

    clearAllBtn.addEventListener("click", () => {
        if (!entries.length) return;
        if (confirm("Clear ALL diet log entries?")) {
        entries = [];
        save();
        render();
        }
    });

    render();
})();
