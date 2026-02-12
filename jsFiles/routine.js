import {
  db, addDoc, deleteDoc, doc, updateDoc,
  onSnapshot, query, orderBy,
  userReady, currentUser, userCollection
} from "../firebase.js";

console.log("routine.js LOADED");
let tasksCollection = null;
let routinesCollection = null;
let editingRoutineId = null; // Track the routine being edited
let tasks = []; // Array to hold tasks

window.addEventListener("load", async () => {
  await userReady;
  while (!currentUser || !currentUser.uid) {
    await new Promise(r => setTimeout(r, 10));
  }
  console.log("Final UID on load:", currentUser.uid);

  // Get reference to user's "tasks" and "routines" collections
  tasksCollection = userCollection("tasks");
  routinesCollection = userCollection("routines");

  // Start listening for live updates on routines
  startRoutineSnapshotListener();
  
  // Initialize button and form events
  initializeEventListeners();
});

function initializeEventListeners() {
  const routineModal = document.getElementById("routineModal");
  const routineCreateBtn = document.getElementById("routineCreate-btn");
  const saveRoutineBtn = document.getElementById("saveRoutine");
  const cancelRoutineBtn = document.getElementById("cancelRoutine");
  const routineTaskList = document.getElementById("routineTaskList");
  const routineNameInput = document.getElementById("routineInput-name");

  // Open modal + load tasks
  routineCreateBtn.addEventListener("click", async () => {
    routineModal.classList.add("active");
    await loadTasksForRoutine();
  });

  // Close modal
  cancelRoutineBtn.addEventListener("click", () => {
    routineModal.classList.remove("active");
    routineNameInput.value = "";
    routineTaskList.innerHTML = "";
  });

  // Save routine
  saveRoutineBtn.addEventListener("click", saveRoutine);
}

async function loadTasksForRoutine() {
  tasks = await fetchTasks();

  const routineTaskList = document.getElementById("routineTaskList");
  routineTaskList.innerHTML = "";

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
        ${task.title}
      </label>
    `;

    routineTaskList.appendChild(li);
  });
}

async function fetchTasks() {
  let fetchedTasks = [];
  const tasksQuery = query(tasksCollection, orderBy("createdAt", "desc"));
  const snapshot = await new Promise(resolve => {
    onSnapshot(tasksQuery, (snap) => {
      fetchedTasks = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      resolve(fetchedTasks);
    });
  });

  return fetchedTasks;
}

async function saveRoutine() {
  const routineNameInput = document.getElementById("routineInput-name");
  const routineTaskList = document.getElementById("routineTaskList");
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

  if (editingRoutineId) {
    // Editing existing routine
    const routineDocRef = doc(routinesCollection, editingRoutineId);
    await updateDoc(routineDocRef, { name: routineName, tasks: taskIds });
    alert("Routine updated!");
    editingRoutineId = null; // Reset
  } else {
    // Creating new routine
    const newRoutine = {
      name: routineName,
      tasks: taskIds,
      createdAt: new Date().toISOString()
    };
    await addDoc(routinesCollection, newRoutine);
    alert("Routine saved!");
  }

  // Reset modal
  const routineModal = document.getElementById("routineModal");
  routineModal.classList.remove("active");
  routineNameInput.value = "";
  routineTaskList.innerHTML = "";

  renderRoutineList(); // Update routine list view
}

function startRoutineSnapshotListener() {
  const routinesQuery = query(routinesCollection, orderBy("createdAt", "desc"));
  
  onSnapshot(routinesQuery, (snapshot) => {
    const routines = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderRoutineList(routines);
  });
}

function renderRoutineList(routines) {
  const routineList = document.getElementById("routineList");
  routineList.innerHTML = ""; // Clear previous output

  if (routines.length === 0) {
    routineList.innerHTML = "<p>No routines created yet.</p>";
    return;
  }

  routines.forEach(routine => {
    const li = document.createElement("li");
    li.classList.add("routine-item");

    const routineTasks = routine.tasks
      .map(id => tasks.find(t => t.id === id)?.title || "(Deleted Task)")
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
      const idToDelete = e.target.dataset.id;
      deleteRoutine(idToDelete);
    });
  });

  // Add click listeners for edit buttons
  const editButtons = document.querySelectorAll(".editRoutineBtn");
  editButtons.forEach(btn => {
    btn.addEventListener("click", (e) => {
      const idToEdit = e.target.dataset.id;
      openRoutineForEdit(idToEdit);
    });
  });
}

async function deleteRoutine(id) {
  try {
    const routineDocRef = doc(routinesCollection, id);
    await deleteDoc(routineDocRef);
    alert("Routine deleted!");
  } catch (error) {
    console.error("Error deleting routine:", error);
  }
}

async function openRoutineForEdit(id) {
  const routines = []; // To be fetched from Firestore
  const routine = routines.find(r => r.id === id);
  if (!routine) return alert("Routine not found!");

  const routineModal = document.getElementById("routineModal");
  routineModal.classList.add("active");

  // Set editing ID
  editingRoutineId = id;
  const routineModalHeader = routineModal.querySelector("h2");
  routineModalHeader.textContent = "Update Your Routine";

  // Pre-fill routine modal
  const routineNameInput = document.getElementById("routineInput-name");
  routineNameInput.value = routine.name;

  await loadTasksForRoutine();
}
