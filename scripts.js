// TASK STUFF
//global
let tasks = [];
let currentSubtasks = []; // temporary subtasks for the task being created
let isEditing = false;
let editingTaskIndex = null;

if(document.getElementById('taskCreate-btn')) {
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
        resetTaskForm();
    });

    // close popup when clicking outside modal content
    taskModal.addEventListener('click', (e) => {
        if (e.target === taskModal) {
            taskModal.style.display = 'none';
            resetTaskForm();
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

        let taskSetting = null;
    
        if (isEditing) {
            //update existing task
            tasks[editingTaskIndex].name = taskName;
            tasks[editingTaskIndex].description = taskDesc || null;
            tasks[editingTaskIndex].subtasks = [...currentSubtasks];
            taskSetting = 'edited'
        } else {
            // TASK OBJECT IS HERE!!!
            const newTask = {
                id: Date.now(),
                name: taskName,
                description: taskDesc || null,
                subtasks: [...currentSubtasks],
                // reminderTime: null, //i.e. remind me at 7:20am
                // reminderDelay: null, //i.e. remind me in 5 minutes
                completed: false
            };
            taskSetting = 'created'
            tasks.push(newTask);
        }

        saveTasksToStorage();
        resetTaskForm();

        taskModal.style.display = 'none';

        alert(`Task "${taskName}" "${taskSetting}" successfully!`);
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
        resetTaskForm();
    });

    // close popup by clicking outside
    taskListPopup.addEventListener('click', (e) => {
        if (e.target === taskListPopup) {
            document.body.classList.remove('modal-open');
            taskListPopup.style.display = 'none';
            resetTaskForm();
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
                <button class="edit-task" data-index="${index}">
                Edit
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

        // Add edit event listeners
        document.querySelectorAll('.edit-task').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = e.target.dataset.index;
                editTask(index);
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

    function editTask(index) {
        const task = tasks[index];
        const taskName = task.name;
        const confirmed = confirm(`Are you sure you want to edit "${taskName}"?`);
        if (!confirmed) return;

        const taskModal = document.getElementById('task-modal');
        const taskInputName = document.getElementById('taskInput-name');
        const taskInputDesc = document.getElementById('taskInput-desc');
        const subtaskList = document.getElementById('subtaskList');
        const saveTaskBtn = document.getElementById('saveTask');

        taskModal.style.display = 'flex';

        taskInputName.value = task.name;
        taskInputDesc.value = task.description || '';

        //clear old subtasks in modal
        subtaskList.innerHTML = '';
        currentSubtasks = [...task.subtasks];
        currentSubtasks.forEach(st => {
            const li = document.createElement('li');
            li.textContent = st;
            subtaskList.appendChild(li);
        })

        isEditing = true;
        editingTaskIndex = index;
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

        //reset edit mode
        isEditing = false;
        editingTaskIndex = null;

        //refresh task list view
        renderTaskList();
    }
}

// ROUTINE STUFF 
if (document.getElementById('routineCreate-btn')) {
    const routineCreateBtn = document.getElementById('routineCreate-btn');
    const routineModal = document.getElementById('routine-modal');
    const routineCancelBtn = document.getElementById('cancelRoutine-btn');
    const routineSaveBtn = document.getElementById('saveRoutine-btn');
    const routineNameInput = document.getElementById('routineName-input');
    const addTaskArea = document.getElementById('addTask-area');

    const routineListPopup = document.getElementById('routine-list-popup');
    const routineList = document.getElementById('routine-list');
    const routineListBtn = document.getElementById('routineListView');
    const closeListBtn = document.getElementById('close-routine-list');

    // open routine creation modal
    routineCreateBtn.addEventListener('click', () => {
        routineModal.style.display = 'flex';
        loadTasksFromLocalStorage();
    });

    function loadTasksFromLocalStorage() {
        const storedTasks = localStorage.getItem('tasks');
        addTaskArea.innerHTML = '';

        if (!storedTasks) {
            addTaskArea.innerHTML = '<p>No tasks found.</p>';
            return;
        }

        const tasks = JSON.parse(storedTasks);

        if (tasks.length === 0) {
            addTaskArea.innerHTML = '<p>No tasks found. Create tasks first.</p>';
            return;
        }

        const header = document.createElement('h3');
        header.textContent = 'Select Existing Tasks:';
        addTaskArea.appendChild(header);

        tasks.forEach(task => {
            const label = document.createElement('label');
            label.innerHTML = `
                <input type="checkbox" value="${task.id}">
                ${task.name}
            `;
            addTaskArea.appendChild(label);
        });
    }

    // cancel routine creation
    routineCancelBtn.addEventListener('click', () => {
        routineModal.style.display = 'none';
        routineNameInput.value = '';
        addTaskArea.innerHTML = '';
    });

    // save new routine
    routineSaveBtn.addEventListener('click', () => {
        const routineName = routineNameInput.value.trim();
        const selectedTaskIds = Array.from(
            addTaskArea.querySelectorAll('input[type="checkbox"]:checked')
        ).map(cb => cb.value);

        if (!routineName) {
            alert('Please enter a routine name.');
            return;
        }

        const storedRoutines = JSON.parse(localStorage.getItem('routines')) || [];

        const newRoutine = {
            id: Date.now(),
            name: routineName,
            taskIds: selectedTaskIds,
        };

        storedRoutines.push(newRoutine);
        localStorage.setItem('routines', JSON.stringify(storedRoutines));

        alert('Routine saved successfully!');

        // close modal and reset form
        routineModal.style.display = 'none';
        routineNameInput.value = '';
        addTaskArea.innerHTML = '';
    });

    // show routine list
    routineListBtn.addEventListener('click', () => {
        renderRoutineList();
        document.body.classList.add('modal-open');
        routineListPopup.style.display = 'flex';
    });

    // close popup
    closeListBtn.addEventListener('click', () => {
        document.body.classList.remove('modal-open');
        routineListPopup.style.display = 'none';
    });

    // close popup by clicking outside
    routineListPopup.addEventListener('click', (e) => {
        if (e.target === routineListPopup) {
            document.body.classList.remove('modal-open');
            routineListPopup.style.display = 'none';
        }
    });

    // render routine list
    function renderRoutineList() {
        routineList.innerHTML = '';

        const storedRoutines = JSON.parse(localStorage.getItem('routines')) || [];
        const storedTasks = JSON.parse(localStorage.getItem('tasks')) || [];

        if (storedRoutines.length === 0) {
            const li = document.createElement('li');
            li.textContent = 'No routines created yet.';
            routineList.appendChild(li);
            return;
        }

        storedRoutines.forEach((routine, index) => {
            const routineTasks = routine.taskIds.map(taskId => storedTasks.find(task => task.id == taskId)).filter(Boolean);
            
            const taskListHTML = routineTasks.length ? `
                <ul> ${routineTasks.map(task => `
                    <li>
                        <strong>${task.name}</strong>
                        ${task.description ? `<br>
                        <em>${task.description}</em>` : ''}
                        ${task.subtasks && task.subtasks.length? `
                            <ul>${task.subtasks.map(st => `<li>${st}</li>`).join('')}
                            </ul>` : ''}
                    </li>`).join('')}
                </ul>` : '<em>No tasks linked</em>';

            const li = document.createElement('li');
            li.innerHTML = `
                <div class="routine-item">
                    <div class="routine-info">
                        <strong>${routine.name}</strong>
                        ${taskListHTML}
                    </div>
                    <div class="routine-actions">
                        <button class="delete-routine" data-index="${index}">Delete</button>
                    </div>
                </div>
            `;
            routineList.appendChild(li);
        });

        // delete routine event
        document.querySelectorAll('.delete-routine').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = e.target.dataset.index;
                deleteRoutine(index);
            });
        });
    }

    // delete routine
    function deleteRoutine(index) {
        const storedRoutines = JSON.parse(localStorage.getItem('routines')) || [];
        storedRoutines.splice(index, 1);
        localStorage.setItem('routines', JSON.stringify(storedRoutines));
        renderRoutineList();
    }
}