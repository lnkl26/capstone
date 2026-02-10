import {
  db, collection, doc, updateDoc,
  onSnapshot, query, orderBy, userReady, currentUser
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
let taskModal;
let closeTaskModal;
let firebaseTaskList;
let pomodoroTaskList;

// -------------------------
// Initialize after DOM ready
// -------------------------
window.addEventListener("DOMContentLoaded", async () => {
  await userReady;
  while (!currentUser || !currentUser.uid) {
    await new Promise(r => setTimeout(r, 10));
  }
  console.log("Final UID on load:", currentUser.uid);

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
      label.innerHTML = `<strong>${task.title}</strong>${task.description ? `<p>${task.description}</p>` : ''}`;

      const addBtn = document.createElement('button');
      addBtn.textContent = 'add to pomodoro';
      addBtn.addEventListener('click', () => addTaskToPomodoro({ id: docSnap.id, ...task }));

      li.appendChild(label);
      li.appendChild(addBtn);
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
  if (pomodoroTasks.length === 0) {
    pomodoroTaskList.innerHTML = '<li>Add tasks from "Your Tasks"</li>';
    return;
  }
  if (isBreak) {
    pomodoroTaskList.innerHTML = '<li>Break Time</li>';
    return;
  }

  pomodoroTasks.forEach((task, index) => {
    const li = document.createElement('li');
    li.classList.toggle('completed', task.completed);

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
    pomodoroTaskList.appendChild(li);
  });
}