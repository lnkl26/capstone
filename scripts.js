// DOM elements
const taskModal = document.getElementById('task-modal');
const taskArea = document.getElementById('task-area');
const taskInputName = document.getElementById('taskInput-name');
const taskInputDesc = document.getElementById('taskInput-desc');
const taskListPopup = document.getElementById('task-list-popup');
const taskList = document.getElementById('task-list');

const taskCreateBtn = document.getElementById('taskCreate-btn');
const cancelTaskBtn = document.getElementById('cancelTask');
const taskListBtn = document.getElementById('taskListView');
const closeListBtn = document.getElementById('close-task-list');
const saveTaskBtn = document.getElementById('saveTask');

// subtask elements
const subtaskInput = document.getElementById('subtaskInput');
const addSubtaskBtn = document.getElementById('addSubtask');
const subtaskList = document.getElementById('subtaskList');

// store all tasks
let tasks = [];
let currentSubtasks = []; // temporary subtasks for the task being created

// load tasks from localStorage on startup
window.addEventListener('load', () => {
    const storedTasks = localStorage.getItem('tasks');
    if (storedTasks) {
        tasks = JSON.parse(storedTasks);
    }
});

// save tasks to localStorage
function saveTasksToStorage() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

// toggle task input area
taskCreateBtn.addEventListener('click', () => {
    taskModal.style.display = 'flex';
});

cancelTaskBtn.addEventListener('click', () => {
    taskModal.style.display = 'none';
});

// close popup when clicking outside modal content
taskModal.addEventListener('click', (e) => {
    if (e.target === taskModal) {
        taskModal.style.display = 'none';
    }
})

// add subtask
addSubtaskBtn.addEventListener('click', () => {
    const subtaskName = subtaskInput.value.trim();

    if (!subtaskName) return;

    currentSubtasks.push(subtaskName);

    const li = document.createElement('li');
    li.textContent = subtaskName;

    // optionally allow deleting subtasks
    const removeBtn = document.createElement('button');
    removeBtn.textContent = 'x';
    removeBtn.style.marginLeft = '10px';
    removeBtn.addEventListener('click', () => {
        subtaskList.removeChild(li);
        currentSubtasks = currentSubtasks.filter(st => st !== subtaskName);
    });

    li.appendChild(removeBtn);
    subtaskList.appendChild(li);

    subtaskInput.value = '';
    subtaskInput.focus();
});

// save a new task
saveTaskBtn.addEventListener('click', () => {
    const taskName = taskInputName.value.trim();
    const taskDesc = taskInputDesc.value.trim();

    if (!taskName) {
        alert('Task name is required.');
        return;
    }

    // TASK OBJECT IS HERE!!!
    const newTask = {
        name: taskName,
        description: taskDesc || null,
        subtasks: [...currentSubtasks],
        // reminderTime: null, //i.e. remind me at 7:20am
        // reminderDelay: null, //i.e. remind me in 5 minutes
        completed: false
    };

    tasks.push(newTask);
    saveTasksToStorage();

    // reset form
    taskInputName.value = '';
    taskInputDesc.value = '';
    subtaskList.innerHTML = '';
    currentSubtasks = [];

    taskModal.style.display = 'none';

    alert(`Task "${taskName}" created successfully!`);
});

// show all tasks
taskListBtn.addEventListener('click', () => {
    renderTaskList();
    document.body.classList.add('modal-open');
    taskListPopup.style.display = 'flex';
});

// close popup
closeListBtn.addEventListener('click', () => {
    document.body.classList.remove('modal-open');
    taskListPopup.style.display = 'none';
});

// close popup by clicking outside
taskListPopup.addEventListener('click', (e) => {
    if (e.target === taskListPopup) {
        document.body.classList.remove('modal-open');
        taskListPopup.style.display = 'none';
    }
});

function renderTaskList() {
    taskList.innerHTML = '';

    if (tasks.length === 0) {
        const li = document.createElement('li');
        li.textContent = 'No tasks created yet.';
        taskList.appendChild(li);
        return;
    }

    tasks.forEach((task, index) => {
    const li = document.createElement('li');
    li.innerHTML = `
        <div class="task-item ${task.completed ? 'completed' : ''}">
        <div class="task-info">
            <strong>${task.name}</strong><br>
            ${task.description ? `<em>${task.description}</em><br>` : ''}
            ${task.subtasks.length
            ? `<ul>${task.subtasks.map(st => `<li>${st}</li>`).join('')}</ul>`
            : ''}
        </div>
        <div class="task-actions">
            <button class="complete-task" data-index="${index}">
            ${task.completed ? '↩ Undo' : '✔ Done'}
            </button>
            <button class="delete-task" data-index="${index}">×</button>
        </div>
        </div>
    `;
    taskList.appendChild(li);
    });

    // Add delete event listeners
    document.querySelectorAll('.delete-task').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = e.target.dataset.index;
            deleteTask(index);
        });
    });

    // Add complete/undo event listeners
    document.querySelectorAll('.complete-task').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = e.target.dataset.index;
            toggleTaskCompletion(index);
        });
    });
}

function deleteTask(index) {
    const taskName = tasks[index].name;
    const confirmed = confirm(`Are you sure you want to delete "${taskName}"?`);
    if (!confirmed) return;

    tasks.splice(index, 1); // remove task
    saveTasksToStorage();   // update storage
    renderTaskList();       // refresh the view
}

function toggleTaskCompletion(index) {
    tasks[index].completed = !tasks[index].completed;
    saveTasksToStorage();
    renderTaskList(); // re-render to update UI
}

function resetTaskForm() {
    // clear inputs, not the structure
    taskInputName.value = '';
    taskInputDesc.value = '';
    subtaskInput.value = '';
    subtaskList.innerHTML = ''; // only clears list content
    currentSubtasks = [];
}