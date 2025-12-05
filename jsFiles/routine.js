import { userReady, currentUser } from "../firebase.js";

window.addEventListener("load", async () => {
  await userReady;
  console.log("Final UID on load:", currentUser.uid);
});

let editingRoutineId = null; // Track the routine being edited

function getRoutines() {
    return JSON.parse(localStorage.getItem("routines")) || [];
}

function saveRoutines(routines) {
    localStorage.setItem("routines", JSON.stringify(routines));
}

function getTasks() {
    return JSON.parse(localStorage.getItem("tasks")) || [];
}

const routineModal = document.getElementById("routineModal");
const routineCreateBtn = document.getElementById("routineCreate-btn");
const saveRoutineBtn = document.getElementById("saveRoutine");
const cancelRoutineBtn = document.getElementById("cancelRoutine");

const routineTaskList = document.getElementById("routineTaskList");
const routineNameInput = document.getElementById("routineInput-name");

const routineTaskInput = document.getElementById("routineTaskInput");

// Open modal + load tasks
routineCreateBtn.addEventListener("click", () => {
    routineModal.classList.add("active");
    loadTasksForRoutine();
});

// Close modal
cancelRoutineBtn.addEventListener("click", () => {
    routineModal.classList.remove("active");
    routineNameInput.value = "";
    routineTaskList.innerHTML = "";
});

// Load tasks as checkbox list
function loadTasksForRoutine() {
    routineTaskList.innerHTML = "";

    const tasks = getTasks();

    if (tasks.length === 0) {
        routineTaskList.innerHTML = "<p>No tasks available. Create tasks first.</p>";
        return;
    }

    tasks.forEach(task => {
        const li = document.createElement("li");
        li.classList.add("routine-task-item");

        li.innerHTML = `
            <label>
                <input type="checkbox" class="routine-task-checkbox" value="${task.id}">
                ${task.name}
            </label>
        `;

        routineTaskList.appendChild(li);
    });
}

// Save routine
saveRoutineBtn.addEventListener("click", () => {
    const routineName = routineNameInput.value.trim();
    const selectedCheckboxes = document.querySelectorAll(".routine-task-checkbox:checked");

    if (!routineName) {
        alert("Routine name is required.");
        return;
    }

    if (selectedCheckboxes.length === 0) {
        alert("Please select at least one task.");
        return;
    }

    const taskIds = Array.from(selectedCheckboxes).map(cb => cb.value);

    const routines = getRoutines();

    if (editingRoutineId) {
        // Editing existing routine
        const index = routines.findIndex(r => r.id === editingRoutineId);
        if (index !== -1) {
            routines[index].name = routineName;
            routines[index].tasks = taskIds;
        }
        editingRoutineId = null; // Reset
        alert("Routine updated!");
    } else {
        // Creating new routine
        const newRoutine = {
            id: Date.now(),
            name: routineName,
            tasks: taskIds
        };
        routines.push(newRoutine);
        alert("Routine saved!");
    }

    saveRoutines(routines);

    // Reset modal
    routineModal.classList.remove("active");
    routineNameInput.value = "";
    routineTaskList.innerHTML = "";

    renderRoutineList(); // Update routine list view
});

const routineListViewBtn = document.getElementById("routineListView");
const routineListModal = document.getElementById("routineListModal");
const routineList = document.getElementById("routineList");
const closeRoutineListBtn = document.getElementById("closeRoutineList");

const addRoutineTaskBtn = document.getElementById("addRoutineTask-Btn");

const routineModalHeader = routineModal.querySelector("h2");

// Open routine list modal
routineListViewBtn.addEventListener("click", () => {
    routineListModal.classList.add("active");
    renderRoutineList();
});

addRoutineTaskBtn.addEventListener('click', () => {
    const taskName = routineTaskInput.value.trim();
    if(!taskName) return alert("Task name cannot be empty!");

    const tasks = getTasks();

    const newTask = {
        id: Date.now(),
        name: taskName,
        description: ""
    };

    tasks.push(newTask);
    localStorage.setItem("tasks", JSON.stringify(tasks));

    routineTaskInput.value = "";

    loadTasksForRoutine();
});

function renderRoutineList() {
    routineList.innerHTML = ""; // Clear previous output

    const routines = getRoutines();
    const tasks = getTasks();

    if (routines.length === 0) {
        routineList.innerHTML = "<p>No routines created yet.</p>";
        return;
    }

    routines.forEach(routine => {
        const li = document.createElement("li");
        li.classList.add("routine-item");

        const routineTasks = routine.tasks
            .map(id => tasks.find(t => t.id == id)?.name || "(Deleted Task)")
            .join(", ");

        li.innerHTML = `
            <strong>${routine.name}</strong><br>
            <small>${routineTasks}</small>
            <button class="editRoutineBtn" data-id="${routine.id}">Edit</button>
            <button class="deleteRoutineBtn" data-id="${routine.id}">Delete</button>
        `;

        routineList.appendChild(li);
    });

    // Add click listeners for delete buttons
    const deleteButtons = document.querySelectorAll(".deleteRoutineBtn");
    deleteButtons.forEach(btn => {
        btn.addEventListener("click", (e) => {
            const idToDelete = Number(e.target.dataset.id);
            deleteRoutine(idToDelete);
        });
    });

    // Add click listeners for edit buttons
    const editButtons = document.querySelectorAll(".editRoutineBtn");
    editButtons.forEach(btn => {
        btn.addEventListener("click", (e) => {
            const idToEdit = Number(e.target.dataset.id);
            openRoutineForEdit(idToEdit);
        });
    });
}

// Close routine list modal
closeRoutineListBtn.addEventListener("click", () => {
    routineListModal.classList.remove("active");
});

function deleteRoutine(id) {
    let routines = getRoutines();
    routines = routines.filter(routine => routine.id !== id);
    saveRoutines(routines);
    renderRoutineList(); // Re-render the list after deletion
    alert("Routine deleted!");
}

function openRoutineForEdit(id) {
    const routines = getRoutines();
    const routine = routines.find(r => r.id === id);
    if (!routine) return alert("Routine not found!");

    routineListModal.classList.remove("active");

    // Set editing ID
    editingRoutineId = id;

    routineModalHeader.textContent = "Update Your Routine";

    // Pre-fill routine modal
    routineNameInput.value = routine.name;
    routineModal.classList.add("active");

    // Load tasks and mark those included in this routine as checked
    routineTaskList.innerHTML = "";
    const tasks = getTasks();
    if (tasks.length === 0) {
        routineTaskList.innerHTML = "<p>No tasks available. Create tasks first.</p>";
        return;
    }

    tasks.forEach(task => {
        const li = document.createElement("li");
        li.classList.add("routine-task-item");

        li.innerHTML = `
            <label>
                <input type="checkbox" class="routine-task-checkbox" value="${task.id}" ${routine.tasks.includes(task.id.toString()) ? "checked" : ""}>
                ${task.name}
            </label>
        `;

        routineTaskList.appendChild(li);
    });
}
