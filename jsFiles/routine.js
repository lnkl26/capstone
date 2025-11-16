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
const routineNameInput = document.getElementById("routineNameInput");

// Open modal + load tasks
routineCreateBtn.addEventListener("click", () => {
    routineModal.style.display = "block";
    loadTasksForRoutine();
});

// Close modal
cancelRoutineBtn.addEventListener("click", () => {
    routineModal.style.display = "none";
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

    const newRoutine = {
        id: Date.now(),
        name: routineName,
        tasks: taskIds
    };

    routines.push(newRoutine);
    saveRoutines(routines);

    alert("Routine saved!");

    // Reset modal
    routineModal.style.display = "none";
    routineNameInput.value = "";
    routineTaskList.innerHTML = "";
});

const routineListViewBtn = document.getElementById("routineListView");
const routineListModal = document.getElementById("routineListModal");
const routineList = document.getElementById("routineList");
const closeRoutineListBtn = document.getElementById("closeRoutineList");

// Open routine list modal
routineListViewBtn.addEventListener("click", () => {
    routineList.innerHTML = ""; // Clear previous output
    routineListModal.style.display = "block";

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
        `;

        routineList.appendChild(li);
    });
});

// Close routine list modal
closeRoutineListBtn.addEventListener("click", () => {
    routineListModal.style.display = "none";
});
