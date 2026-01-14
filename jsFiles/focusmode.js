import {
  db, collection, addDoc, deleteDoc, doc, updateDoc,
  onSnapshot, query, orderBy
} from "../firebase.js";

import { userReady, currentUser } from "../firebase.js";

// -------------------------
// Global Variables
// -------------------------
let timer;
let minutes = 0;
let seconds = 0;
let isPaused = true;
let isBreak = false;
let focusTime = 15;
let breakTime = 5;
let pomodoroTasks = [];

// DOM Elements (declared globally so accessible in all functions)
let timerElement;
let stopBtn;
let resetBtn;
let shortBtn;
let mediumBtn;
let longBtn;

let taskButton;
let taskModal;
let closeTaskModal;
let firebaseTaskList;
let pomodoroTaskList;

// -------------------------
// Initialize after DOM ready
// -------------------------
window.addEventListener("DOMContentLoaded", async () => {
  await userReady;
  console.log("Final UID on load:", currentUser.uid);

  // Timer elements
  timerElement = document.getElementById('timer');
  stopBtn = document.getElementById('stopButton');
  resetBtn = document.getElementById('resetButton');
  shortBtn = document.getElementById('shortPomodoroBtn');
  mediumBtn = document.getElementById('mediumPomodoroBtn');
  longBtn = document.getElementById('longPomodoroBtn');

  // Task modal elements
  taskButton = document.getElementById('taskButton');
  taskModal = document.getElementById('taskModal');
  closeTaskModal = document.getElementById('closeTaskModal');
  firebaseTaskList = document.getElementById('firebaseTaskList');
  pomodoroTaskList = document.getElementById('pomodoroTaskList');

  // Event listeners
  stopBtn.addEventListener('click', toggleStartStop);
  resetBtn.addEventListener('click', resetTimer);
  shortBtn.addEventListener('click', shortPomodoro);
  mediumBtn.addEventListener('click', mediumPomodoro);
  longBtn.addEventListener('click', longPomodoro);

  taskButton.addEventListener('click', () => {
    taskModal.classList.remove('hidden');
    loadFirebaseTasks();
  });

  closeTaskModal.addEventListener('click', () => {
    taskModal.classList.add('hidden');
  });

  // Initialize timer display
  timerElement.textContent = formatTime(minutes, seconds);

  renderPomodoroTasks();
});

// -------------------------
// Timer Functions
// -------------------------
function startTimer() {
  if (timer) clearInterval(timer);
  isPaused = false;
  timer = setInterval(updateTimer, 1000);
}

function updateTimer() {
  if (!isPaused) {
    if (minutes === 0 && seconds === 0) {
      clearInterval(timer);
      if (!isBreak) startBreak();
      else startFocus();
    } else {
      if (seconds > 0) seconds--;
      else {
        seconds = 59;
        minutes--;
      }
    }
    timerElement.textContent = formatTime(minutes, seconds);
  }
}

function formatTime(m, s) {
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

function startFocus() {
  isBreak = false;
  minutes = focusTime;
  seconds = 0;
  timerElement.textContent = formatTime(minutes, seconds);
  isPaused = false;
  stopBtn.textContent = 'stop';
  startTimer();
  renderPomodoroTasks();
}

function startBreak() {
  isBreak = true;
  minutes = breakTime;
  seconds = 0;
  timerElement.textContent = formatTime(minutes, seconds);
  isPaused = false;
  stopBtn.textContent = 'stop';
  startTimer();
  renderPomodoroTasks();
}

function toggleStartStop() {
  if (isPaused) {
    startTimer();
    stopBtn.textContent = 'stop';
  } else {
    isPaused = true;
    clearInterval(timer);
    stopBtn.textContent = 'start';
  }
}

function resetTimer() {
  clearInterval(timer);
  isPaused = true;
  stopBtn.textContent = 'stop';
  minutes = isBreak ? breakTime : focusTime;
  seconds = 0;
  timerElement.textContent = formatTime(minutes, seconds);
}

// -------------------------
// Pomodoro Presets
// -------------------------
function shortPomodoro() {
  focusTime = 15;
  breakTime = 5;
  startFocus();
}

function mediumPomodoro() {
  focusTime = 25;
  breakTime = 5;
  startFocus();
}

function longPomodoro() {
  focusTime = 45;
  breakTime = 15;
  startFocus();
}

// -------------------------
// Firebase Tasks Functions
// -------------------------
function loadFirebaseTasks() {
  firebaseTaskList.innerHTML = '';
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
      addBtn.textContent = 'Add to Your Tasks';
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
    pomodoroTaskList.innerHTML = '<li>No tasks selected</li>';
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