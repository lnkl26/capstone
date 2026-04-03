import {
  db, addDoc, deleteDoc, doc, updateDoc,
  onSnapshot, query, orderBy, serverTimestamp,
  userReady, currentUser, userCollection
} from "../firebase.js";

console.log("task.js loaded");

let tasks = [];
let tasksCollection = null;
let currentSubtasks = []; // store subtasks before saving
let draggedTask = null;
let draggedSubtask = null;
let taskList = null;
let lastY = 0;

window.addEventListener("DOMContentLoaded", async () => {
  await userReady;
  while (!currentUser || !currentUser.uid) {
    await new Promise(r => setTimeout(r, 10));
  }
  console.log("User ready in task.js:", currentUser?.uid);

  // Initialize large task selector
  initLargeTaskSelector();

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
  taskList = document.getElementById("currentTasks");

  // Open modal
  taskCreateBtn.addEventListener("click", () => {
    taskModal.classList.add("active");
    taskInputName.value = "";
    taskInputDesc.value = "";
    currentSubtasks = [];
    renderSubtasks();

    // Initialize large task selector in the modal when opened
    initLargeTaskSelector();
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
      createdAt: serverTimestamp(),
      order: tasks.length
    };

    await addTask(task);
    taskModal.classList.remove("active");
  });

  const suggestBtn = document.getElementById("suggestSubtasksBtn");
  const AItaskInputName = document.getElementById("taskInput-name");

  suggestBtn.addEventListener("click", () => {
    const taskName = AItaskInputName.value.trim();
    if (taskName) {
      fetchAISuggestions(taskName);
    } else {
      alert("Please enter a task name first!");
    }
  });
}

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
  console.log("start snapshot called");
  const q = query(tasksCollection, orderBy("order", "asc"));

  onSnapshot(q, (snapshot) => {
    tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderTasks();
    // console.log("Tasks from Firestore:");
    tasks.forEach(t => console.log(t.title, "->", t.order));
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
    const taskEl = document.createElement("li");
    taskEl.draggable = "true";
    taskEl.classList.add("task-item");
    taskEl.dataset.id = task.id;
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
      const subtaskContainer = document.createElement("ul");
      subtaskContainer.style.display = "flex";
      subtaskContainer.style.flexDirection = "column";
      subtaskContainer.style.marginTop = "4px";

      task.subtasks.forEach((sub, index) => {
        const subtaskRow = document.createElement("li");
        subtaskRow.style.display = "flex";
        //subtaskRow.style.alignItems = "center";
        subtaskRow.classList.add("subtask-item");
        subtaskRow.style.fontSize = "0.85rem";
        subtaskRow.style.opacity = "0.85";
        subtaskRow.draggable = "true";
        
        subtaskRow.dataset.subtaskIndex = index;

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
      attachDragHandlers(subtaskContainer, "li.subtask-item", () => updateSubtaskOrder(task.id, subtaskContainer));
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
  attachDragHandlers(taskList, "li.task-item", () => updateTaskOrder());
}

// -------------------------
// Drag List Items
// -------------------------

function attachDragHandlers(container, itemSelector, onDragEnd) {
  container.querySelectorAll(itemSelector).forEach(item=>{
    item.addEventListener('dragstart', e=>{
      e.stopPropagation();
      if (itemSelector === "li.task-item") draggedTask = item;
      else draggedSubtask = item;
      item.classList.add('dragging');
      lastY = e.clientY; //reset direction tracking
    });
    item.addEventListener('dragend', async ()=>{
      item.classList.remove('dragging');
      if (itemSelector === "li.task-item") draggedTask = null;
      else draggedSubtask = null;
      await onDragEnd();
      // console.log("Saving order to Firestone");
    });
    item.addEventListener('dragover', e=>{
      // console.log("draggedItem in dragover:", draggedItem);
      e.preventDefault();
      e.stopPropagation();
    });
  });
  
  container.addEventListener('dragover', e => {
    e.preventDefault();
    e.stopPropagation();

    const draggedItem = itemSelector === "li.task-item" ? draggedTask : draggedSubtask;
      if (!draggedItem) return;

      const goingDown = e.clientY > lastY;
      lastY = e.clientY;

      const after = getDragAfterElement(container, e.clientY, itemSelector, goingDown);
      container.insertBefore(draggedItem, after);
  });
}

function getDragAfterElement(container, y, selector, goingDown) {
  const dragged = selector === "li.task-item" ? draggedTask : draggedSubtask;

  const items = [...container.querySelectorAll(selector)].filter (el => el !== dragged);
  
  if (items.length === 0) return null;

  let closest = null;
  let closestDistance = Infinity;

  for (const item of items) {
    const box = item.getBoundingClientRect();
    const midpoint = box.top + box.height / 2;
    const distance = Math.abs(y - midpoint);

    if (distance < closestDistance) {
      closestDistance = distance;
      closest = item;
    }
  }

  if (!closest) return null;

  return goingDown ? closest.nextSibling : closest;
}

// -------------------------
// Firestore: Update Task Order
// -------------------------
async function updateTaskOrder() {
  const items = taskList.querySelectorAll("li");
  // console.log("updateTaskOrder items:", items.length);
  items.forEach((li, index)=> {
    const id = li.dataset.id;
    if (!id) return;

    const ref = doc(tasksCollection, id);
    updateDoc(ref, {order: Number(index)});
  });
}

async function updateSubtaskOrder(taskId, container) {
  const items = container.querySelectorAll("li.subtask-item");

  const newSubtasks = [ ...items].map((el, index) => {
    const checkbox = el.querySelector("input[type='checkbox']");
    const text = el.querySelector("span").textContent;

    return {
      text,
      completed: checkbox.checked,
      order: index
    };
  });

  await updateDoc(doc(tasksCollection, taskId), {
    subtasks: newSubtasks
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

// Function to load subtasks from a JSON file
async function loadTasksFromJSON() {
  try {
    const response = await fetch('../jsFiles/tasks.json'); // Ensure the correct path to tasks.json
    if (!response.ok) throw new Error('Network response was not ok');
    return await response.json();
  } catch (error) {
    console.error('Error loading tasks JSON:', error);
    return {};
  }
}

// Function to decompose large task into subtasks
async function decomposeLargeTask(largeTask) {
  const tasksFromJSON = await loadTasksFromJSON();
  const subtasks = tasksFromJSON[largeTask] || [];

  if (subtasks.length === 0) {
    console.warn(`No subtasks found for: ${largeTask}`);
    return;
  }

  // Autofill the task name
  const taskInputName = document.getElementById("taskInput-name");
  taskInputName.value = largeTask.replace("_", " "); // Replace underscore with space for better user readability

  currentSubtasks = []; // Clear existing subtasks
  currentSubtasks.push(...subtasks); // Add new subtasks
  renderSubtasks(); // Render the new subtasks
}


// Hook the decompose function into the UI
function initLargeTaskSelector() {
  const existingSelect = document.getElementById("largeTaskSelect");
  if (existingSelect) {
    return;
  }

  const largeTaskSelect = document.createElement("select");
  largeTaskSelect.id = "largeTaskSelect";

  largeTaskSelect.innerHTML = `
    <option value="">Select a Large Task</option>
    <option value="get_ready">Get Ready</option>
    <option value="go_shopping">Go Shopping</option>
    <option value="clean_house">Clean House</option>
    <option value="clean_kitchen">Clean Kitchen</option>
    <option value="clean_bathroom">Clean Bathroom</option>
    <option value="do_laundry">Do Laundry</option>
    <option value="study">Study</option>
    <option value="exercise">Exercise</option>
    <option value="plan_trip">Plan Trip</option>
    <option value="cook_dinner">Cook Dinner</option>
    <option value="prepare_presentation">Prepare Presentation</option>
    <option value="organize_room">Organize Room</option>
    <option value="write_blog_post">Write Blog Post</option>
    <option value="start_project">Start Project</option>
    <option value="apply_for_job">Apply For Job</option>
    <option value="prepare_for_exam">Prepare For Exam</option>
    <option value="budget_finances">Budget Finances</option>
    <option value="morning_routine">Morning Routine</option>
    <option value="evening_routine">Evening Routine</option>
    <option value="host_guests">Host Guests</option>
    <option value="move_apartment">Move Apartment</option>
    <option value="start_business">Start Business</option>
    <option value="improve_health">Improve Health</option>
    <option value="learn_skill">Learn Skill</option>
    <option value="network_professionally">Network Professionally</option>
    <option value="fix_bug">Fix Bug</option>
    <option value="build_website">Build Website</option>
    <option value="declutter">Declutter</option>
    <option value="plan_week">Plan Week</option>
    <option value="read_book">Read Book</option>
    <option value="meal_prep">Meal Prep</option>
    <option value="start_workday">Start Workday</option>
    <option value="end_workday">End Workday</option>
    <option value="organize_files">Organize Files</option>
    <option value="car_maintenance">Car Maintenance</option>
    <option value="self_care">Self Care</option>
    <option value="prepare_meeting">Prepare Meeting</option>
    <option value="launch_product">Launch Product</option>
    <option value="improve_productivity">Improve Productivity</option>
    <option value="plan_event">Plan Event</option>
    <option value="write_report">Write Report</option>
    <option value="renovate_room">Renovate Room</option>
    <option value="save_money">Save Money</option>
    <option value="improve_diet">Improve Diet</option>
    <option value="practice_mindfulness">Practice Mindfulness</option>
    <option value="create_portfolio">Create Portfolio</option>
    <option value="update_resume">Update Resume</option>
    <option value="deep_clean">Deep Clean</option>
    <option value="prepare_interview">Prepare Interview</option>
  `;

  const inputArea = document.querySelector(".input-area");
  inputArea.prepend(largeTaskSelect);

  largeTaskSelect.addEventListener("change", (event) => {
    if (event.target.value) {
      decomposeLargeTask(event.target.value);
    }
  });
}

async function fetchAISuggestions(taskName) {
  const suggestionList = document.getElementById("aiSuggestionList");
  const container = document.getElementById("aiSuggestionContainer");

  const functionUrl = "https://suggestsubtasks-ie3j3rv3yq-uc.a.run.app";

  //show loading state
  suggestionList.innerHTML = "<span style='font-style:italic; color:#666;'>Gemini is thinking...</span>";
  container.style.display = "block";

  try {
    //call Firebase function
    const response = await fetch(`${functionUrl}?taskName=${encodeURIComponent(taskName)}`);

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const data = await response.json();
    suggestionList.innerHTML = ""; // clear loading text

    //handle the array of subtasks returned by gemini
    if (data.subtasks && data.subtasks.length > 0) {
      data.subtasks.forEach(sub => {
        const pill = document.createElement("div");
        pill.className = "ai-pill";

        //keep the same look and logic
        pill.innerHTML = `
                    <span>${sub}</span>
                    <button type="button" class="accept-suggestion">+</button>
                `;

        pill.querySelector("button").addEventListener("click", () => {
          //add to groups global subtask array
          if (typeof currentSubtasks !== 'undefined') {
            currentSubtasks.push(sub);

            //call groups function that draws the list on the screen
            renderSubtasks();

            //visual feedback
            pill.style.backgroundColor = "#4ade80";
            setTimeout(() => pill.remove(), 200);
          } else {
            console.error("The variable 'currentSubtasks' isn't defined in your group's code!");
          }
        });

        suggestionList.appendChild(pill);
      });
    } else {
      suggestionList.innerHTML = "<span>No suggestions found. Try a different task name.</span>";
    }

  } catch (error) {
    console.error("AI Error:", error);
    suggestionList.innerHTML = "<span style='color:red;'>Failed to reach AI. Check console.</span>";
  }
}