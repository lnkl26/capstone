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
    taskEl.style.display = "flex";
    taskEl.style.justifyContent = "space-between";
    taskEl.style.alignItems = "flex-start";

    // -------- Task text container --------
    const taskTextContainer = document.createElement("div");
    taskTextContainer.style.flex = "1";
    taskTextContainer.style.display = "flex";
    taskTextContainer.style.flexDirection = "column";

    // Task title
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
      const subtaskContainer = document.createElement("div");
      subtaskContainer.style.display = "flex";
      subtaskContainer.style.flexDirection = "column";
      subtaskContainer.style.marginTop = "4px";

      task.subtasks.forEach((sub, index) => {
        const subtaskRow = document.createElement("div");
        subtaskRow.style.display = "flex";
        //subtaskRow.style.alignItems = "center";
        subtaskRow.style.fontSize = "0.85rem";
        subtaskRow.style.opacity = "0.85";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = sub.completed || false;

        const subtaskText = document.createElement("span");
        subtaskText.textContent = sub.text || sub;
        if (checkbox.checked) {
          subtaskText.style.textDecoration = "line-through";
          subtaskText.style.color = "gray";
        }

        // Toggle subtask completion
        checkbox.addEventListener("change", async () => {
          const updatedSubtasks = task.subtasks.map((s, i) =>
            i === index ? { text: s.text || s, completed: checkbox.checked } : s
          );
          try {
            await updateDoc(doc(tasksCollection, task.id), { subtasks: updatedSubtasks });
            renderTasks();
          } catch (error) {
            console.error("Error updating subtask:", error);
          }
        });

        subtaskRow.appendChild(checkbox);
        subtaskRow.appendChild(subtaskText);
        subtaskContainer.appendChild(subtaskRow);
      });

      taskTextContainer.appendChild(subtaskContainer);
    }


    taskEl.appendChild(taskTextContainer);

    // -------- Buttons container --------
    const btnGroup = document.createElement("div");
    btnGroup.classList.add("task-buttons");
    btnGroup.style.display = "flex";
    btnGroup.style.gap = "6px";
    btnGroup.style.marginLeft = "12px";

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

// OLD CODE
// import {
//   db, addDoc, deleteDoc, doc, updateDoc,
//   onSnapshot, query, orderBy, serverTimestamp,
//   userReady, currentUser, userCollection
// } from "../firebase.js";

// console.log("task.js loaded");

// let tasks = [];
// let currentSubTask = [];
// let editingTaskIndex = null;
// let tasksCollection = null;

// window.addEventListener("DOMContentLoaded", async () => {
//   await userReady;
//   console.log("User ready in task.js:", currentUser?.uid);
//   tasksCollection = userCollection("tasks");
//   startTaskSnapshotListener();
//   wireEventListeners();
// });

// const taskModal = document.getElementById('taskModal');
// const openTaskBtn = document.getElementById('taskCreate-btn');
// const closeTaskBtn = document.getElementById('cancelTask');

// const saveTaskBtn = document.getElementById('saveTask');
// const taskNameInput = document.getElementById('taskInput-name');
// const taskDescInput = document.getElementById('taskInput-desc');
// const subTaskInput = document.getElementById('subtaskInput');
// const addSubTaskBtn = document.getElementById('addSubtask');
// const subTaskList = document.getElementById('subtaskList');

// const taskListModal = document.getElementById('taskListModal');
// const openTaskListBtn = document.getElementById('taskListView');
// const closeTaskListBtn = document.getElementById('closeTaskList');
// const taskListEl = document.getElementById('taskList');

// function wireEventListeners() {
//   const taskModal = document.getElementById('taskModal');
//   const openTaskBtn = document.getElementById('taskCreate-btn');
//   const closeTaskBtn = document.getElementById('cancelTask');

//   openTaskBtn.addEventListener('click', () => {
//     taskNameInput.value = '';
//     taskDescInput.value = '';
//     currentSubTask = [];
//     renderSubTasks(currentSubTask, subTaskList);
//     editingTaskIndex = null;
//     taskModal.querySelector('h2').textContent = 'Create New Task';
//     saveTaskBtn.textContent = 'Save';
//     taskModal.classList.add('active');
//   });

//   closeTaskBtn.addEventListener('click', () => {
//     taskModal.classList.remove('active');
//   });

//   saveTaskBtn.addEventListener('click', saveTask);
//   addSubTaskBtn.addEventListener('click', addSubtask);
// }

// function startTaskSnapshotListener() {
//   if (!tasksCollection) return;

//   onSnapshot(
//     query(tasksCollection, orderBy("createdAt", "desc")),
//     (snapshot) => {
//       tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
//       renderTaskList();
//       renderCurrentTasks(tasks);
//     }
//   );
// }

// function saveTask() {
//   const name = taskNameInput.value.trim();
//   const description = taskDescInput.value.trim();

//   if (!name) {
//     alert("Please enter a task name!");
//     return;
//   }

//   const newTask = {
//     name,
//     description,
//     subtask: [...currentSubTask],
//     createdAt: serverTimestamp(),
//     completed: editingTaskIndex !== null ? tasks[editingTaskIndex].completed : false
//   };

//   if (editingTaskIndex !== null) {
//     const taskId = tasks[editingTaskIndex].id;
//     const taskRef = doc(tasksCollection, taskId);
//     updateDoc(taskRef, newTask).then(() => {
//       editingTaskIndex = null;
//       resetTaskModal();
//     });
//   } else {
//     addDoc(tasksCollection, newTask).then(() => {
//       resetTaskModal();
//     });
//   }
// }

// function resetTaskModal() {
//   taskNameInput.value = "";
//   taskDescInput.value = "";
//   subTaskList.innerHTML = "";
//   currentSubTask = [];
//   taskModal.classList.remove("active");
// }

// function addSubtask() {
//   const subtaskName = subTaskInput.value.trim();
//   if (!subtaskName) return;
//   currentSubTask.push({ name: subtaskName, completed: false });
//   renderSubTasks(currentSubTask, subTaskList);
//   subTaskInput.value = "";
// }

// if (openTaskListBtn) {
//   openTaskListBtn.addEventListener('click', () => {
//     renderTaskList();
//     taskListModal.classList.add('active');
//   });
// }

// if (closeTaskListBtn) {
//   closeTaskListBtn.addEventListener('click', () => {
//     taskListModal.classList.remove('active');
//   });
// }

// function renderTaskList() {
//   taskListEl.innerHTML = '';

//   if (tasks.length === 0) {
//     taskListEl.innerHTML = '<li>You have no tasks yet!</li>';
//     return;
//   }

//   tasks.forEach((task, index) => {
//     const li = document.createElement('li');
//     li.classList.toggle('completed', task.completed);

//     const taskCheckbox = document.createElement('input');
//     taskCheckbox.type = 'checkbox';
//     taskCheckbox.checked = task.completed;

//     taskCheckbox.addEventListener('change', () => {
//       task.completed = taskCheckbox.checked;
//       task.subtask.forEach(st => st.completed = task.completed);
//       renderTaskList();
//     });

//     const taskLabel = document.createElement('span');
//     taskLabel.innerHTML = `<strong>${task.name}</strong> ${task.description ? `<p>${task.description}</p>` : ''}`;

//     li.appendChild(taskCheckbox);
//     li.appendChild(taskLabel);

//     if (task.subtask.length) {
//       const ul = document.createElement('ul');
//       renderSubTasks(task.subtask, ul, index);
//       li.appendChild(ul);
//     }

//     const actions = document.createElement('div');
//     actions.className = 'task-actions';

//     const editBtn = document.createElement('button');
//     editBtn.textContent = 'Edit';
//     editBtn.className = 'edit-btn';

//     editBtn.addEventListener('click', () => {
//       taskNameInput.value = task.name;
//       taskDescInput.value = task.description;
//       currentSubTask = task.subtask.map(st => ({ name: st.name, completed: st.completed }));
//       renderSubTasks(currentSubTask, subTaskList);
//       taskListModal.classList.remove('active');
//       editingTaskIndex = index;
//       taskModal.querySelector('h2').textContent = 'Edit Task';
//       saveTaskBtn.textContent = 'Save Changes';
//       taskModal.classList.add('active');
//     });

//     const deleteBtn = document.createElement('button');
//     deleteBtn.textContent = 'Delete';

//     deleteBtn.addEventListener('click', async () => {
//       if (confirm(`Delete "${task.name}"?`)) {
//         const taskRef = doc(tasksCollection, task.id);
//         await deleteDoc(taskRef);
//       }
//     });

//     actions.appendChild(editBtn);
//     actions.appendChild(deleteBtn);
//     li.appendChild(actions);

//     taskListEl.appendChild(li);
//   });
// }

// function renderSubTasks(subtasks, container, taskIndex = null) {
//   container.innerHTML = '';

//   subtasks.forEach((st, i) => {
//     const li = document.createElement('li');
//     li.classList.toggle('completed', st.completed);

//     const checkbox = document.createElement('input');
//     checkbox.type = 'checkbox';
//     checkbox.checked = st.completed;

//     checkbox.addEventListener('change', () => {
//       st.completed = checkbox.checked;
//       li.classList.toggle('completed', st.completed);
//       if (taskIndex !== null) {
//         const allDone = subtasks.every(s => s.completed);
//         tasks[taskIndex].completed = allDone;
//         renderTaskList();
//       }
//     });

//     const span = document.createElement('span');
//     span.textContent = st.name;
//     span.style.cursor = 'pointer';

//     span.addEventListener('click', () => {
//       const input = document.createElement('input');
//       input.type = 'text';
//       input.value = st.name;
//       li.replaceChild(input, span);
//       input.focus();

//       const saveEdit = () => {
//         const newName = input.value.trim();
//         if (newName) {
//           st.name = newName;
//           renderSubTasks(subtasks, container, taskIndex);
//           if (taskIndex !== null) renderTaskList();
//         } else {
//           input.focus();
//         }
//       };

//       input.addEventListener('blur', saveEdit);
//       input.addEventListener('keydown', (e) => {
//         if (e.key === 'Enter') saveEdit();
//       });
//     });

//     const removeBtn = document.createElement('button');
//     removeBtn.textContent = '×';

//     removeBtn.addEventListener('click', () => {
//       subtasks.splice(i, 1);
//       if (taskIndex !== null) {
//         const allDone = subtasks.every(s => s.completed);
//         tasks[taskIndex].completed = allDone;
//       }
//       renderSubTasks(subtasks, container, taskIndex);
//       if (taskIndex !== null) renderTaskList();
//     });

//     li.appendChild(checkbox);
//     li.appendChild(span);
//     li.appendChild(removeBtn);
//     container.appendChild(li);
//   });
// }

// function escapeHtml(str = "") {
//   return String(str)
//     .replace(/&/g, "&amp;")
//     .replace(/</g, "&lt;")
//     .replace(/>/g, "&gt;");
// }

// function renderCurrentTasks(summaryTasks) {
//   const box = document.getElementById("currentTasks");
//   if (!box) return;

//   if (!summaryTasks || !summaryTasks.length) {
//     box.innerHTML = '<div class="empty">No tasks yet.</div>';
//     return;
//   }

//   box.innerHTML = summaryTasks.map(t => `
//     <div class="summary-item${t.completed ? " completed" : ""}">
//       <strong>${escapeHtml(t.name || "")}</strong>
//       ${t.description ? `<div class="summary-sub">${escapeHtml(t.description)}</div>` : ""}
//     </div>
//   `).join("");
// }

// function renderCurrentRoutines(routines) {
//   const box = document.getElementById("currentRoutines");
//   if (!box) return;

//   if (!routines || !routines.length) {
//     box.innerHTML = '<div class="empty">No routines yet.</div>';
//     return;
//   }

//   box.innerHTML = routines.map(r => `
//     <div class="summary-item">
//       <strong>${escapeHtml(r.name || "")}</strong>
//       ${Array.isArray(r.tasks) && r.tasks.length
//         ? `<div class="summary-sub">${r.tasks.length} step${r.tasks.length > 1 ? "s" : ""}</div>`
//         : ""}
//     </div>
//   `).join("");
// }

// window.renderCurrentTasks = renderCurrentTasks;
// window.renderCurrentRoutines = renderCurrentRoutines;