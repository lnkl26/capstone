let timer;
let minutes = 0;
let seconds = 0;
let isPaused = true;
let isBreak = false;
let focusTime = 15;
let breakTime = 5;

const timerElement = document.getElementById('timer');
const stopBtn = document.getElementById('stopButton');
const resetBtn = document.getElementById('resetButton');

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