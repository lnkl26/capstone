import {
  db, collection, addDoc, deleteDoc, doc, updateDoc, 
  onSnapshot, query, orderBy, serverTimestamp, 
} from "../firebase.js";

let timer;
let minutes = 0;
let seconds = 0;
let isPaused = true;
let isBreak = false;
let focusTime = 15;
let breakTime = 5;
let pomodoroTasks = [];

const timerElement = document.getElementById('timer');
const stopBtn = document.getElementById('stopButton');
const resetBtn = document.getElementById('resetButton');
const shortBtn = document.getElementById('shortPomodoroBtn');
const mediumBtn = document.getElementById('mediumPomodoroBtn');
const longBtn = document.getElementById('longPomdoroBtn');

const taskButton = document.getElementById('taskButton');
const taskModal = document.getElementById('taskModal');
const closeTaskModal = document.getElementById('closeTaskModal');
const firebaseTaskList = document.getElementById('firebaseTaskList');
const pomodoroTaskList = document.getElementById('pomodoroTaskList');

stopBtn.addEventListener('click', toggleStartStop);
resetBtn.addEventListener('click', resetTimer);
shortBtn.addEventListener('click', shortPomodoro);
mediumBtn.addEventListener('click', mediumPomodoro);
longBtn.addEventListener('click', longPomodoro);

function startTimer() {
    if (timer) clearInterval(timer);
    isPaused = false;
    timer = setInterval(updateTimer, 1000);
}

function updateTimer() {
    if (!isPaused) {
        if (minutes === 0 && seconds === 0) {
            clearInterval(timer);

            if (!isBreak) {
                alert('Focus session over! Time for a break.');
                startBreak();
            } else {
                alert('Break over! Time to focus again.');
                startFocus();
            }
        } else {
            if (seconds > 0) {
                seconds--;
            } else {
                seconds = 59;
                minutes--;
            }
        }
        timerElement.textContent = formatTime(minutes, seconds);
    }
}

function formatTime(minutes, seconds) {
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function startFocus() {
    isBreak = false;
    minutes = focusTime;
    seconds = 0;
    timerElement.textContent = formatTime(minutes, seconds);
    isPaused = false;
    stopBtn.textContent = 'stop';
    startTimer();
}

function startBreak() {
    isBreak = true;
    minutes = breakTime;
    seconds = 0;
    timerElement.textContent = formatTime(minutes, seconds);
    isPaused = false;
    stopBtn.textContent = 'stop';
    startTimer();
}

function toggleStartStop() {
    if(isPaused) {
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

// POMODORO PRESETS
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

timerElement.textContent = formatTime(minutes, seconds);

//TASKS
taskButton.addEventListener('click', () => {
    taskModal.classList.remove('hidden');
    loadFirebaseTasks();
});

closeTaskModal.addEventListener('click', () => {
    taskModal.classList.add('hidden');
})

function loadFirebaseTasks() {
    firebaseTaskList.innerHTML = '';
    const q = query(collection(db, "tasks"), orderBy("createdAt", "desc"));

    onSnapshot(q, (snapshot) => {
        firebaseTaskList.innerHTML='';
        snapshot.forEach(docSnap => {
            const task = docSnap.data();
            const li = document.createElement('li');
            li.classList.toggle('completed', task.completed);

            const label = document.createElement('span');
            label.innerHTML = `<strong>${task.name}</strong? ${task.description ? `<p>${task.description}</p>` : ''}`;

            const addBtn = document.createElement('button');                
            addBtn.textContent = 'Add to Your Tasks';
            addBtn.addEventListener('click', () => {
                addTaskToPomodoro({ id: docSnap.id, ... task });
            });

            li.appendChild(label);
            li.appendChild(addBtn);
            firebaseTaskList.appendChild(li);
        });
    });
    if (firebaseTaskList.length === 0) {
        firebaseTaskList.innerHTML = '<li>No tasks in task list</li>'
    }
}

function addTaskToPomodoro(task) {
    if (pomodoroTasks.find(t => t.id === task.id)) return; //prevent duplicate tasks
    pomodoroTasks.push(task);
    renderPomodoroTasks();
}

function renderPomodoroTasks() {
    pomodoroTaskList.innerHTML = '';
    if (pomodoroTasks.length === 0) {
        pomodoroTaskList.innerHTML = '<li>No tasks selected</li>';
        return;
    }

    pomodoroTasks.forEach((task, index) => {
        const li = document.createElement('li');
        li.classList.toggle('completed', task.completed);

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = task.completed;
        checkbox.addEventListener('change', () => {
            task.completed = checkbox.checked;
            li.classList.toggle('completed', task.completed);
        });

        const label = document.createElement('span');
        label.innerHTML = `<strong>${task.name}</strong`;

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