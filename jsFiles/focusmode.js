import {
  db, collection, addDoc, deleteDoc, doc, updateDoc,
  onSnapshot, query, orderBy
} from "../firebase.js";

import { userReady, currentUser } from "../firebase.js";

// // -------------------------
// // Global Variables
// // -------------------------
// let timer;
// let minutes = 0;
// let seconds = 0;
// let isPaused = true;
let isBreak = false;
// let focusTime = 15;
// let breakTime = 5;
let pomodoroTasks = [];

let focusMin;
let breakMin;
let sessionSelected = false;
let timerInterval;
let isRunning = false;
let timeRemaining;

// // DOM Elements (declared globally so accessible in all functions)
// let timerElement;
// let stopBtn;
// let resetBtn;
// let shortBtn;
// let mediumBtn;
// let longBtn;
let timerElement;
let pomodoroTypeBtn;
let pause_startBtn;
let resetBtn;
let shortPomodoroBtn;
let medPomodoroBtn;
let longPomodoroBtn;

let pomodoroSelectionModal;

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
  while (!currentUser || !currentUser.uid) {
    await new Promise(r => setTimeout(r, 10));
  }
  console.log("Final UID on load:", currentUser.uid);

  // Timer elements
  // timerElement = document.getElementById('timer');
  // stopBtn = document.getElementById('stopButton');
  // resetBtn = document.getElementById('resetButton');
  // shortBtn = document.getElementById('shortPomodoroBtn');
  // mediumBtn = document.getElementById('mediumPomodoroBtn');
  // longBtn = document.getElementById('longPomodoroBtn');
  timerElement = document.getElementById("pomodoro-timer");
  pomodoroTypeBtn = document.getElementById("pomodoro-type-selection");
  pause_startBtn = document.getElementById("pomodoro-pause-start");
  resetBtn = document.getElementById("pomodoro-restart");

  // Task modal elements
  taskButton = document.getElementById('taskButton');
  taskModal = document.getElementById('taskModal');
  closeTaskModal = document.getElementById('closeTaskModal');
  firebaseTaskList = document.getElementById('firebaseTaskList');
  pomodoroTaskList = document.getElementById('pomodoroTaskList');

  // Event listeners
  // stopBtn.addEventListener('click', toggleStartStop);
  // resetBtn.addEventListener('click', resetTimer);
  // shortBtn.addEventListener('click', shortPomodoro);
  // mediumBtn.addEventListener('click', mediumPomodoro);
  // longBtn.addEventListener('click', longPomodoro);
  pomodoroTypeBtn.addEventListener('click', openPomodoroSelectionModal);
  pause_startBtn.addEventListener('click', pauseStartTimer);
  resetBtn.addEventListener('click', resetTimer);

  taskButton.addEventListener('click', () => {
    taskModal.classList.remove('hidden');
    loadFirebaseTasks();
  });

  closeTaskModal.addEventListener('click', () => {
    taskModal.classList.add('hidden');
  });

  // Initialize timer display
  // timerElement.textContent = formatTime(minutes, seconds);

  renderPomodoroTasks();
});

// // -------------------------
// // Timer Functions
// // -------------------------
function openPomodoroSelectionModal() {
    pomodoroSelectionModal = document.querySelector(".pomodoro-selection-modal");
    if (pomodoroSelectionModal) {
        pomodoroSelectionModal.style.display = "flex";

        shortPomodoroBtn = document.getElementById("short-pomodoro-setting");
        medPomodoroBtn = document.getElementById("med-pomodoro-setting");
        longPomodoroBtn = document.getElementById("long-pomodoro-setting");

        shortPomodoroBtn.addEventListener('click', useShortPomodoro);
        medPomodoroBtn.addEventListener('click', useMedPomodoro);
        longPomodoroBtn.addEventListener('click', useLongPomodoro);
    } else {
        console.error("Modal element not found");
    }
}

function useShortPomodoro() {
    focusMin =  0.2; // 25 minutes of working
    breakMin = 5; // 5 minutes of break
    timerElement.innerHTML = '25:00';
    sessionSelected = true;
    pomodoroSelectionModal.style.display = "none";
    console.log("short button");
}

function useMedPomodoro() {
    focusMin = 30; // 30 minutes of working
    breakMin = 5; // 5 minutes of break
    timerElement.innerHTML = '30:00';
    sessionSelected = true;
    pomodoroSelectionModal.style.display = "none";
    console.log("med button");
}

function useLongPomodoro() {
    focusMin = 45; // 45 minutes of working
    breakMin = 5; // 5 minutes of break
    timerElement.innerHTML = '45:00';
    sessionSelected = true;
    pomodoroSelectionModal.style.display = "none";
    console.log("long button");
}

function pauseStartTimer() {
    if (!sessionSelected) {
        console.log("session hasn't been selected");
        return; // Exit if no session is selected
    }
    
    if (!isRunning) {
        // Start the timer
        if (timeRemaining == undefined) {
            timeRemaining = focusMin * 60;
        }
        isRunning = true;
        pause_startBtn.innerHTML = '⏸️';
        console.log("Time has started");
        
        timerInterval = setInterval(() => {
            if (timeRemaining <= 0) {
                clearInterval(timerInterval);
                timerElement.innerHTML = "00:00";
                isRunning = false;
            } else {
                console.log(timeRemaining)
                timeRemaining--;
                const minutes = Math.floor(timeRemaining / 60);
                const seconds = timeRemaining % 60;
                timerElement.innerHTML = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            }
        }, 1000);
    } else {
        // Pause the timer
        clearInterval(timerInterval);
        isRunning = false;
        pause_startBtn.innerHTML = '▶️';
        console.log("Time has paused");
    }
}

function resetTimer() {
    if (sessionSelected) {
        if (isRunning) {
            clearInterval(timerInterval);
            isRunning = false; // Update running state
            pause_startBtn.innerHTML = '▶️'; 
        }
        
        sessionSelected = false;
        focusMin = 0;
        breakMin = 0;

        // Reset timer display
        timerElement.innerHTML = '00:00'; // Reset to 00:00
        console.log("Timer reset");
        
    } else {
        console.log("No session to reset");
    }
}

// function startTimer() {
//   if (timer) clearInterval(timer);
//   isPaused = false;
//   timer = setInterval(updateTimer, 1000);
// }

// function updateTimer() {
//   if (!isPaused) {
//     if (minutes === 0 && seconds === 0) {
//       clearInterval(timer);
//       if (!isBreak) startBreak();
//       else startFocus();
//     } else {
//       if (seconds > 0) seconds--;
//       else {
//         seconds = 59;
//         minutes--;
//       }
//     }
//     timerElement.textContent = formatTime(minutes, seconds);
//   }
// }

// function formatTime(m, s) {
//   return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
// }

// function startFocus() {
//   isBreak = false;
//   minutes = focusTime;
//   seconds = 0;
//   timerElement.textContent = formatTime(minutes, seconds);
//   isPaused = false;
//   stopBtn.textContent = 'stop';
//   startTimer();
//   renderPomodoroTasks();
// }

// function startBreak() {
//   isBreak = true;
//   minutes = breakTime;
//   seconds = 0;
//   timerElement.textContent = formatTime(minutes, seconds);
//   isPaused = false;
//   stopBtn.textContent = 'stop';
//   startTimer();
//   renderPomodoroTasks();
// }

// function toggleStartStop() {
//   if (isPaused) {
//     startTimer();
//     stopBtn.textContent = 'stop';
//   } else {
//     isPaused = true;
//     clearInterval(timer);
//     stopBtn.textContent = 'start';
//   }
// }

// function resetTimer() {
//   clearInterval(timer);
//   isPaused = true;
//   stopBtn.textContent = 'stop';
//   minutes = isBreak ? breakTime : focusTime;
//   seconds = 0;
//   timerElement.textContent = formatTime(minutes, seconds);
// }

// // -------------------------
// // Pomodoro Presets
// // -------------------------
// function shortPomodoro() {
//   focusTime = 15;
//   breakTime = 5;
//   startFocus();
// }

// function mediumPomodoro() {
//   focusTime = 25;
//   breakTime = 5;
//   startFocus();
// }

// function longPomodoro() {
//   focusTime = 45;
//   breakTime = 15;
//   startFocus();
// }

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