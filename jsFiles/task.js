import {
  db, addDoc, deleteDoc, doc, updateDoc,
  onSnapshot, query, orderBy, serverTimestamp,
  userReady, currentUser, userCollection
} from "../firebase.js";

console.log("task.js loaded");

let tasks = [];
let tasksCollection = null;
let currentSubtasks = []; // store subtasks before saving

window.addEventListener("DOMContentLoaded", async () => {
  await userReady;
  console.log("User ready in task.js:", currentUser?.uid);

  // Get reference to user's "tasks" collection
  tasksCollection = userCollection("tasks");

  // Start listening for live updates
  startTaskSnapshotListener();

  // Wire button and form events
  wireEventListeners();
});

// -------------------------
// Event Listeners
// -------------------------
function wireEventListeners() {
  const taskCreateBtn = document.getElementById("taskCreate-btn");
  const taskModal = document.getElementById("taskModal");
  const taskInputName = document.getElementById("taskInput-name");
  const taskInputDesc = document.getElementById("taskInput-desc");
  const saveTaskBtn = document.getElementById("saveTask");
  const cancelTaskBtn = document.getElementById("cancelTask");
  const subtaskInput = document.getElementById("subtaskInput");
  const addSubtaskBtn = document.getElementById("addSubtask");
  const subtaskList = document.getElementById("subtaskList");

  // Open modal
  taskCreateBtn.addEventListener("click", () => {
    taskModal.classList.add("active");
    taskInputName.value = "";
    taskInputDesc.value = "";
    currentSubtasks = [];
    renderSubtasks();
  });

  // Cancel modal
  cancelTaskBtn.addEventListener("click", () => {
    taskModal.classList.remove("active");
  });

  // Add subtask
  addSubtaskBtn.addEventListener("click", () => {
    const val = subtaskInput.value.trim();
    if (val) {
      currentSubtasks.push(val);
      subtaskInput.value = "";
      renderSubtasks();
    }
  });

  function renderSubtasks() {
    subtaskList.innerHTML = "";
    currentSubtasks.forEach((sub, index) => {
      const li = document.createElement("li");
      li.textContent = sub;

      // delete subtask button
      const delBtn = document.createElement("button");
      delBtn.textContent = "x";
      delBtn.style.marginLeft = "5px";
      delBtn.addEventListener("click", () => {
        currentSubtasks.splice(index, 1);
        renderSubtasks();
      });

      li.appendChild(delBtn);
      subtaskList.appendChild(li);
    });
  }

  // Save task
  saveTaskBtn.addEventListener("click", async () => {
    const title = taskInputName.value.trim();
    const desc = taskInputDesc.value.trim();

    if (!title) {
      alert("Task name is required!");
      return;
    }

    const task = {
      title,
      description: desc,
      subtasks: currentSubtasks,
      completed: false,
      createdAt: serverTimestamp()
    };

    await addTask(task);
    taskModal.classList.remove("active");
  });
}

// -------------------------
// Firestore: Add Task
// -------------------------
async function addTask(task) {
  try {
    await addDoc(tasksCollection, task);
    console.log("Task added:", task.title);
  } catch (error) {
    console.error("Error adding task:", error);
  }
}

// -------------------------
// Firestore: Snapshot Listener
// -------------------------
function startTaskSnapshotListener() {
  const q = query(tasksCollection, orderBy("createdAt", "desc"));

  onSnapshot(q, (snapshot) => {
    tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderTasks();
  });
}

// -------------------------
// Render Tasks to HTML
// -------------------------
function renderTasks() {
  const currentTasksDiv = document.getElementById("currentTasks");
  currentTasksDiv.innerHTML = "";

  if (tasks.length === 0) {
    currentTasksDiv.innerHTML = "<p>No tasks yet.</p>";
    return;
  }

  tasks.forEach(task => {
    const taskEl = document.createElement("div");
    taskEl.classList.add("task-item");

    // Task title
    const taskTextContainer = document.createElement("div");
    taskTextContainer.style.flex = "1"; // take remaining space
    taskTextContainer.style.display = "flex";
    taskTextContainer.style.flexDirection = "column";

    const taskTitle = document.createElement("span");
    taskTitle.textContent = task.title;
    if (task.completed) {
      taskTitle.style.textDecoration = "line-through";
      taskTitle.style.color = "gray";
    }
    taskTextContainer.appendChild(taskTitle);

    // Optional: task description
    if (task.description) {
      const taskDesc = document.createElement("span");
      taskDesc.textContent = task.description;
      taskDesc.style.fontSize = "0.85rem";
      taskDesc.style.opacity = "0.75";
      taskTextContainer.appendChild(taskDesc);
    }

    // Subtasks
    if (task.subtasks && task.subtasks.length > 0) {
      const subtaskUl = document.createElement("ul");
      subtaskUl.style.listStyle = "disc";
      subtaskUl.style.margin = "4px 0 0 16px";
      subtaskUl.style.padding = "0";
      subtaskUl.style.fontSize = "0.85rem";
      subtaskUl.style.opacity = "0.8";

      task.subtasks.forEach(sub => {
        const li = document.createElement("li");
        li.textContent = sub;
        subtaskUl.appendChild(li);
      });
      taskTextContainer.appendChild(subtaskUl);
    }

    taskEl.appendChild(taskTextContainer);

    // Buttons container
    const btnGroup = document.createElement("div");
    btnGroup.classList.add("task-buttons");

    const editBtn = document.createElement("button");
    editBtn.textContent = "...";
    editBtn.title = "Edit Task";
    editBtn.addEventListener("click", () => startInlineEdit(taskEl, task));
    btnGroup.appendChild(editBtn);

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "x";
    deleteBtn.title = "Delete Task";
    deleteBtn.addEventListener("click", () => deleteTask(task.id));
    btnGroup.appendChild(deleteBtn);

    const completeBtn = document.createElement("button");
    completeBtn.textContent = "o";
    completeBtn.title = task.completed ? "Mark as Incomplete" : "Mark Complete";
    completeBtn.addEventListener("click", () => toggleTaskComplete(task.id, task.completed));
    btnGroup.appendChild(completeBtn);

    taskEl.appendChild(btnGroup);
    currentTasksDiv.appendChild(taskEl);
  });
}

// -------------------------
// Firestore: Delete Task
// -------------------------
async function deleteTask(taskId) {
  try {
    await deleteDoc(doc(tasksCollection, taskId));
    console.log("Task deleted:", taskId);
  } catch (error) {
    console.error("Error deleting task:", error);
  }
}

// -------------------------
// Toggle Complete
// -------------------------
async function toggleTaskComplete(taskId, isCompleted) {
  try {
    const taskDoc = doc(tasksCollection, taskId);
    await updateDoc(taskDoc, { completed: !isCompleted });
    console.log(`Task ${isCompleted ? "marked incomplete" : "completed"}`);
    tasks = tasks.map(t => t.id === taskId ? { ...t, completed: !isCompleted } : t);
    renderTasks();
  } catch (error) {
    console.error("Error toggling task completion:", error);
  }
}

// -------------------------
// Inline Edit
// -------------------------
function startInlineEdit(taskEl, task) {
  // Find the container div that holds title, description, and subtasks
  const taskContainer = taskEl.querySelector("div"); // first div inside taskEl
  const taskTitleSpan = taskContainer.querySelector("span"); // title span
  const originalTitle = task.title;

  // Replace title span with input
  const input = document.createElement("input");
  input.type = "text";
  input.value = originalTitle;
  input.style.width = "200px";

  taskContainer.replaceChild(input, taskTitleSpan);
  input.focus();

  input.addEventListener("keydown", async (e) => {
    if (e.key === "Enter") {
      const newTitle = input.value.trim();
      if (newTitle && newTitle !== originalTitle) {
        try {
          const taskDoc = doc(tasksCollection, task.id);
          await updateDoc(taskDoc, { title: newTitle });
          console.log("Task updated:", newTitle);
        } catch (error) {
          console.error("Error updating task:", error);
        }
      }
      renderTasks();
    } else if (e.key === "Escape") {
      renderTasks();
    }
  });

  input.addEventListener("blur", () => renderTasks());
}