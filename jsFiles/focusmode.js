import {
  db, collection, doc, updateDoc,
  onSnapshot, query, orderBy, userReady, currentUser, userCollection
} from "../firebase.js";

// -------------------------
// Global Variables
// -------------------------
let state = "IDLE"; //IDLE, RUNNING_FOCUS, RUNNING_BREAK, PAUSED_FOCUS, PAUSED_BREAK
let focusTime = 15;
let breakTime = 5;

let timeRemaining = focusTime * 60; //convert to seconds
let timerInterval = null;
let pomodoroTasks = [];
let tasksCollection = null;

// DOM Elements (declared globally so accessible in all functions)
let timerElement;

let pomodoroTypeBtn;
let pause_startBtn;
let resetBtn;

let shortPomodoroBtn;
let medPomodoroBtn;
let longPomodoroBtn;

let selectionModal;
let closeSelectionModal;

let focusInput;
let breakInput;

let taskBtn;
let pomodoroTaskHeading;
let taskModal;
let closeTaskModal;
let firebaseTaskList;
let pomodoroTaskList;

//dragging
let draggedTask = null;
let draggedSubtask = null;
let lastY = 0;

// -------------------------
// Initialize after DOM ready
// -------------------------
window.addEventListener("DOMContentLoaded", async () => {
  await userReady;
  while (!currentUser || !currentUser.uid) {
    await new Promise(r => setTimeout(r, 10));
  }
  console.log("Final UID on load:", currentUser.uid);

  // get reference to user's tasks collection
  tasksCollection = userCollection("tasks");

  // Timer elements
  timerElement = document.getElementById("pomodoro-timer");

  pomodoroTypeBtn = document.getElementById("pomodoro-type-selection");
  pause_startBtn = document.getElementById("pomodoro-pause-start");
  resetBtn = document.getElementById("pomodoro-restart");

  //Pomodoro Session Elements
  selectionModal = document.getElementById("selectionModal");
  closeSelectionModal = document.getElementById("closeSelectionModal");

  focusInput = document.getElementById("focusInput");
  breakInput = document.getElementById("breakInput");

  shortPomodoroBtn = document.getElementById("short-pomodoro-setting");
  medPomodoroBtn = document.getElementById("med-pomodoro-setting");
  longPomodoroBtn = document.getElementById("long-pomodoro-setting");

  // Task modal elements
  taskBtn = document.getElementById('taskButton');
  pomodoroTaskHeading = document.getElementById('pomodoroTaskHeading');
  taskModal = document.getElementById('taskModal');
  closeTaskModal = document.getElementById('closeTaskModal');
  firebaseTaskList = document.getElementById('firebaseTaskList');
  pomodoroTaskList = document.getElementById('pomodoroTaskList');

  //Event Listeners
  pomodoroTypeBtn.addEventListener('click', () => {
    selectionModal.classList.remove("hidden"); 
  });
  closeSelectionModal.addEventListener('click', () => {
    applyPomodoroSettings();
    selectionModal.classList.add("hidden");
  })

  pause_startBtn.addEventListener('click', pauseStartTimer);
  resetBtn.addEventListener('click', resetTimer);

  shortPomodoroBtn.addEventListener('click', useShortPomodoro);
  medPomodoroBtn.addEventListener('click', useMedPomodoro);
  longPomodoroBtn.addEventListener('click', useLongPomodoro);

  taskBtn.addEventListener('click', () => {
    taskModal.classList.remove('hidden');
    loadFirebaseTasks();
  });

  closeTaskModal.addEventListener('click', () => {
    taskModal.classList.add('hidden');
  });

  renderPomodoroTasks();
});

// -------------------------
// State Machine Functions
// -------------------------

function pauseStartTimer() {
    switch (state) {
      case "IDLE":
        state = "RUNNING_FOCUS";
        timeRemaining = focusTime * 60;
        startInterval();
        pause_startBtn.textContent = '❚❚';
        break;

      case "PAUSED_FOCUS":
        state = "RUNNING_FOCUS";
        startInterval();
        pause_startBtn.textContent = '❚❚';
        break;
      
      case "PAUSED_BREAK":
        state = "RUNNING_BREAK";
        startInterval();
        pause_startBtn.textContent = '❚❚';
        break;
      
      case "RUNNING_FOCUS":
      case "RUNNING_BREAK":
        pauseTimer();
        break;
    }
}

function pauseTimer() {
  clearInterval(timerInterval);

  if (state === "RUNNING_FOCUS") state = "PAUSED_FOCUS";
  if (state === "RUNNING_BREAK") state = "PAUSED_BREAK";

  pause_startBtn.textContent = '▶︎';
}

function resetTimer() {
  clearInterval(timerInterval);

  if(state.includes("BREAK")) {
    timeRemaining = breakTime * 60;
    state = "PAUSED_BREAK";
  } else {
    timeRemaining = focusTime * 60;
    state = "PAUSED_FOCUS";
  }

  updateDisplay();
  pause_startBtn.textContent = '▶︎';
}

function startInterval() {
  clearInterval(timerInterval);

  timerInterval = setInterval(() => {
    //time counts down
    timeRemaining--;

    //switch between focus/break modes
    if(timeRemaining <= 0) {
      if (state === "RUNNING_FOCUS") {
        state = "RUNNING_BREAK";
        timeRemaining = breakTime * 60;
        startInterval();
        renderPomodoroTasks();
      }
      else if (state === "RUNNING_BREAK") {
        state = "RUNNING_FOCUS";
        timeRemaining = focusTime * 60;
        startInterval();
        renderPomodoroTasks();
      }
    }
    updateDisplay();
  }, 1000);
}

function updateDisplay() {
  const m = Math.floor(timeRemaining / 60);
  const s = timeRemaining % 60;
  timerElement.textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

// -------------------------
// Pomodoro Presets
// -------------------------

function applyPomodoroSettings() {
  const focusVal = parseInt(focusInput.value, 10);
  const breakVal = parseInt(breakInput.value, 10);

  //if values are empty, set defaults
  //clamp to minimum
  focusTime = Number.isFinite(focusVal) && focusVal >= 0 ? focusVal : 15;
  breakTime = Number.isFinite(breakVal) && breakVal >= 0 ? breakVal : 5;

  state = "IDLE";
  timeRemaining = focusTime * 60;

  updateDisplay();
  renderPomodoroTasks();
}

function useShortPomodoro() {
    focusInput.value =  15; // 15 minutes of working
    breakInput.value = 5; // 5 minutes of break
    console.log("short button");
}

function useMedPomodoro() {
    focusInput.value = 30; // 30 minutes of working
    breakInput.value = 5; // 5 minutes of break
    console.log("med button");
}

function useLongPomodoro() {
    focusInput.value = 45; // 45 minutes of working
    breakInput.value = 5; // 5 minutes of break
    console.log("long button");
}

// -------------------------
// Firebase Tasks Functions
// -------------------------
async function loadFirebaseTasks() {
  firebaseTaskList.innerHTML = '';
  while (!currentUser || !currentUser.uid) {
    await new Promise(r => setTimeout(r, 10));
  }
  
  const q = query(collection(db, "users", currentUser.uid, "tasks"), orderBy("createdAt", "desc"));

  onSnapshot(q, (snapshot) => {
    firebaseTaskList.innerHTML = '';
    snapshot.forEach(docSnap => {
      const task = docSnap.data();
      const li = document.createElement('li');
      li.classList.toggle('completed', task.completed);

      const label = document.createElement('span');
      label.innerHTML = `<strong>${task.title}</strong>`;

      const addBtn = document.createElement('button');
      addBtn.textContent = '+';
      addBtn.addEventListener('click', () => addTaskToPomodoro({ id: docSnap.id, ...task }));

      const desc = document.createElement('span');
      desc.innerHTML = `${task.description ? `<p>${task.description}</p>` : ''}`;

      li.appendChild(label);
      li.appendChild(addBtn);
      li.appendChild(desc);

      if (task.subtasks && task.subtasks.length > 0) {
        const subtaskContainer = document.createElement("ul");

        task.subtasks.forEach((sub, index) => {
          const subtaskRow = document.createElement("li");
          // subtaskRow.classList.toggle('completed', task.sub.completed);

          subtaskRow.dataset.subtaskIndex = index;

          const subtaskText = document.createElement("span");
          subtaskText.textContent = sub.text || sub;

          subtaskRow.appendChild(subtaskText);
          subtaskContainer.appendChild(subtaskRow);
        });

        li.appendChild(subtaskContainer);
      }

      firebaseTaskList.appendChild(li);
    });

    if (snapshot.empty) {
      firebaseTaskList.innerHTML = '<li>No tasks in task list</li>';
    }
  });
}

function addTaskToPomodoro(task) {
  if (pomodoroTasks.find(t => t.id === task.id)) return;
  pomodoroTasks.push(task);
  renderPomodoroTasks();
}

// -------------------------
// Render Pomodoro Tasks
// -------------------------
function renderPomodoroTasks() {
  pomodoroTaskList.innerHTML = '';
  pomodoroTaskHeading.innerHTML = 'Your Pomodoro Tasks';
  if (state.includes("BREAK")) {
    pomodoroTaskHeading.innerHTML = 'Break Time';
    pomodoroTaskList.innerHTML = '<li></li>';
    return;
  }
  if (pomodoroTasks.length === 0) {
    pomodoroTaskList.innerHTML = '<li>Add tasks from "Your Tasks"</li>';
    return;
  }
  

  pomodoroTasks.forEach((task, index) => {
    const li = document.createElement('li');
    li.classList.toggle('completed', task.completed);
    li.classList.add("task-item");
    li.draggable = "true";

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = task.completed;
    checkbox.style.marginRight = '8px'; // left-align and spacing
    checkbox.addEventListener('change', async () => {
      task.completed = checkbox.checked;
      li.classList.toggle('completed', task.completed);

      try {
        const taskRef = doc(db, "users", currentUser.uid, "tasks", task.id);
        await updateDoc(taskRef, { completed: task.completed });
      } catch (error) {
        console.error("Error updating task:", error);
      }
    });

    const label = document.createElement('span');
    label.innerHTML = `<strong>${task.title}</strong>`;

    const removeBtn = document.createElement('button');
    removeBtn.textContent = 'x';
    removeBtn.addEventListener('click', () => {
      pomodoroTasks.splice(index, 1);
      renderPomodoroTasks();
    });

    li.appendChild(checkbox);
    li.appendChild(label);
    li.appendChild(removeBtn);

    if (task.subtasks && task.subtasks.length > 0) {
        const subtaskContainer = document.createElement("ul");

        task.subtasks.forEach((sub, index) => {
          const subtaskRow = document.createElement("li");
          subtaskRow.classList.add("subtask-item");
          subtaskRow.draggable = "true";

          subtaskRow.dataset.subtaskIndex = index;
          

          const subCheckbox = document.createElement('input');
          subCheckbox.type = 'checkbox';
          subCheckbox.checked = sub.completed || false;
          subCheckbox.style.marginRight = '8px'; // left-align and spacing

          const subtaskText = document.createElement("span");
          subtaskText.textContent = sub.text || sub;
          if (subCheckbox.checked) {
            subtaskText.style.textDecoration = "line-through";
            subtaskText.style.color = "gray";
          }

          subCheckbox.addEventListener('change', async () => {
            sub.completed = subCheckbox.checked;

            try {
              await updateDoc(doc(tasksCollection, task.id), { subtasks: updatedSubtasks});
              renderPomodoroTasks();
            } catch(error) {
              console.error("Error updating subtask:", error);
            }
          });

          subtaskRow.appendChild(subCheckbox);
          subtaskRow.appendChild(subtaskText);
          subtaskContainer.appendChild(subtaskRow);
        });

        li.appendChild(subtaskContainer);
        attachDragHandlers(subtaskContainer, "li.subtask-item", () => updateSubtaskOrder(task.id, subtaskContainer));
      }

    pomodoroTaskList.appendChild(li);
  });

  attachDragHandlers(pomodoroTaskList, "li.task-item", () => updateTaskOrder());
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

  let lastMoveTime = 0;
  const MOVE_DELAY = 50; // ms between moves (tune this)
  
  container.addEventListener('dragover', e => {
  e.preventDefault();
  e.stopPropagation();

  const now = performance.now();
  if (now - lastMoveTime < MOVE_DELAY) return; // throttle
  lastMoveTime = now;

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

  // If cursor is below the last item, append to bottom
const last = items[items.length - 1];
const lastBox = last.getBoundingClientRect();
const lastMid = lastBox.top + lastBox.height / 2;

if (y > lastMid) {
  return null; // append to bottom
}

  return goingDown ? closest.nextSibling : closest;
}

// -------------------------
// Firestore: Update Task Order
// -------------------------
async function updateTaskOrder() {
  const items = pomodoroTaskList.querySelectorAll("li");
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