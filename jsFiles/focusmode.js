let timer;
let minutes = 15; //temp
let seconds = 0;
let isPaused = true;
let enteredTime = null;

function startTimer() {
    timer = setInterval(updateTimer, 1000);
    const pauseResumeButton = document.querySelector('.control-buttons button');

    if(isPaused) {
        clearInterval(timer);
        pauseResumeButton.textContent = 'resume';
    } else {
        startTimer();
        pauseResumeButton.textContent = 'pause';
    }
}

function updateTimer() {
    const timerElement = document.getElementById('timer');
    timerElement.textContent = formatTime(minutes, seconds);

    if(minutes === 0 && seconds === 0) {
        clearInterval(timer);
        alert('Time is up, it is now break time!');
    } else if(!isPaused) {
        if(seconds > 0) {
            seconds--;
        } else {
            seconds = 59;
            minutes--;
        }
    }
}

function formatTime(minutes, seconds) {
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function togglePauseResume() {
    const pauseResumeButton = document.querySelector('.control-buttons button');

    if(isPaused) {
        clearInterval(timer);
        pauseResumeButton.textContent = 'resume';
    } else {
        startTimer();
        pauseResumeButton.textContent = 'pause';
    }
}

function restartTimer() {
    clearInterval(timer);
    minutes = enteredTime || 15;
    seconds = 0;
    isPaused = false;
    const timerElement = document.getElementById('timer');
    timerElement.textContent = formatTime(minutes, seconds);
    const pauseResumeButton = document.querySelector('.control-buttons button');
    pauseResumeButton.textContent = 'pause';
    startTimer();
}

function chooseTime() {
    const newTime = prompt('Enter new time in minutes:');
    if(!isNaN(newTime) && newTime > 0) {
        enteredTime = parseInt(newTime);
        minutes = enteredTime;
        seconds = 0;
        isPaused = false;
        const timerElement = document.getElementById('timer');
        timerElement.textContent = formatTime(minutes, seconds);
        clearInterval(timer);
        const pauseResumeButton = document.querySelector('.control-buttons button');
        pauseResumeButton.textContent = 'pause';
        startTimer();
    } else {
        alert('Please enter a valid number greater than 0');
    }
}