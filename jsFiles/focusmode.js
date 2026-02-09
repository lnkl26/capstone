import {
  db, collection, doc, updateDoc,
  onSnapshot, query, orderBy, userReady, currentUser
} from "../firebase.js";

// -------------------------
// Global Variables
// -------------------------
let timerElement;
let minutes = 15;
let seconds = 0;
let isPaused = true;
let isBreak = false;
let focusTime = 15;
let breakTime = 5;
let pomodoroTasks = [];
let startedTimer = false;

let focusMin;
let breakMin;
let sessionSelected = false;
let timerInterval;
let isRunning = false;
let timeRemaining;

// // DOM Elements (declared globally so accessible in all functions)
let stopBtn;
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

// // -------------------------
// // Timer Functions
// // -------------------------

function updateTimer() {
  if (isPaused) return; //safety
  if (!isPaused) {
    if (minutes === 0 && seconds === 0) {
      clearInterval(timer);
      if (!isBreak) startBreak();
      else startFocus();
    } else {
        console.error("Modal element not found");
    }
    updateTimeset(minutes, seconds);
  }
}

function updateTimeset(m, s) {
  timerElement.textContent = formatTime(m, s);
}

function formatTime(m, s) {
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

function startFocus() {
  isBreak = false;
  minutes = focusTime;
  seconds = 0;
  updateTimeset(minutes, seconds);

  //auto start only after first manual start
  if(startedTimer) {
    isPaused = false;
    stopBtn.textContent = 'stop';
  } else { //wait for user to begin timer
    isPaused = true;
    stopBtn.textContent = 'start';
  }
  renderPomodoroTasks();
}

function startBreak() {
  isBreak = true;
  minutes = breakTime;
  seconds = 0;
  updateTimeset(minutes, seconds);
  isPaused = false;
  stopBtn.textContent = 'stop';
  startTimer();
  renderPomodoroTasks();
}

function toggleStartStop() {
  if (isPaused) {
    startedTimer = true;
    startTimer();
    stopBtn.textContent = 'stop';
  } else {
    isPaused = true;
    clearInterval(timer);
    stopBtn.textContent = 'start';
  }
}

// function resetTimer() {
//   //stop timer
//   clearInterval(timer);

//   //pause
//   isPaused = true;
//   stopBtn.textContent = 'start';

//   //reset time
//   minutes = isBreak ? breakTime : focusTime;
//   seconds = 0;
//   updateTimeset(minutes, seconds);
// }

// -------------------------
// Pomodoro Presets
// -------------------------

function customPomodoro() {
  const focusVal = parseInt(focusInput.value, 10);
  const breakVal = parseInt(breakInput.value, 10);

  //if values are empty, set defaults
  //clamp to minimum
  focusTime = Number.isFinite(focusVal) && focusVal >= 0 ? focusVal : 15;
  breakTime = Number.isFinite(breakVal) && breakVal >= 0 ? breakVal : 5;

  seconds = 0;
  startedTimer = false;
  startFocus();
}

function useShortPomodoro() {
    focusMin =  0.2; // 25 minutes of working
    breakMin = 5; // 5 minutes of break
    timerElement.innerHTML = '25:00';
    sessionSelected = true;
    selectionModal.style.display = "none";
    console.log("short button");
}

function useMedPomodoro() {
    focusMin = 30; // 30 minutes of working
    breakMin = 5; // 5 minutes of break
    timerElement.innerHTML = '30:00';
    sessionSelected = true;
    selectionModal.style.display = "none";
    console.log("med button");
}

function useLongPomodoro() {
    focusMin = 45; // 45 minutes of working
    breakMin = 5; // 5 minutes of break
    timerElement.innerHTML = '45:00';
    sessionSelected = true;
    selectionModal.style.display = "none";
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