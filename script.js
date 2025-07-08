// Adding colorful toasts

function showToast(message, type = 'info') {
	const container = document.getElementById('toast-container');
	const toast = document.createElement('div');
	toast.className = `toast toast-${type}`;
	toast.textContent = message;
	container.appendChild(toast);

	// Remove toast after animation
	setTimeout(() => {
		toast.remove();
	}, 3000);
}

// Closure: Task Manager Module
const TaskManager = (function () {
	let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

	function saveTasks() {
		localStorage.setItem('tasks', JSON.stringify(tasks));
	}

	return {
		addTask(name, id = Date.now()) {
			if (name.length < 3) {
				throw new Error('Task name must be at least 3 characters long');
			}
			tasks.push({ id, name, completed: false });
			saveTasks();
		},
		getTasks() {
			return tasks;
		},
		toggleTask(id) {
			let toggledTask;
			tasks = tasks.map((task) => {
				if (task.id === id) {
					const updated = { ...task, completed: !task.completed };
					toggledTask = updated;
					return updated;
				}
				return task;
			});
			saveTasks();
			return toggledTask;
		},
		searchTasks(pattern) {
			const regex = new RegExp(pattern, 'i');
			return tasks.filter((task) => regex.test(task.name));
		},
	};
})();

function syncTaskInstances() {
	const tasks = TaskManager.getTasks();
	tasks.forEach((task) => {
		task.instance = new Task(task.id, task.name, task.completed);
	});
}

// Prototypes and Inheritance: Task Constructor
function Task(id, name, completed) {
	this.id = id;
	this.name = name;
	this.completed = completed;
}

Task.prototype.toggleComplete = function () {
	this.completed = !this.completed;
};

Task.prototype.getStatus = function () {
	return this.completed ? 'Completed' : 'Pending';
};

Task.prototype.displayInfo = function () {
	console.log(`Task: ${this.name}, Status: ${this.getStatus()}`);
};
const boundDisplayInfo = Task.prototype.displayInfo.bind;

// Promises: Mock API
function fetchTasksFromAPI() {
	return new Promise((resolve, reject) => {
		setTimeout(() => {
			const mockTasks = [
				{ id: 1, name: 'Learn JavaScript', completed: false },
				{ id: 2, name: 'Build Task Manager', completed: true },
				{ id: 3, name: 'Add More Features Daily', completed: false },
			];
			if (Math.random() > 0.9) {
				reject(new Error('Failed to fetch tasks from API'));
			} else {
				resolve(mockTasks);
			}
		}, 1000);
	});
}

// Async/Await and Error Handling
async function initializeTasks() {
	try {
		// Only fetch and add mock tasks if there are no tasks yet
		if (TaskManager.getTasks().length === 0) {
			const apiTasks = await fetchTasksFromAPI();
			apiTasks.forEach((task) => {
				try {
					TaskManager.addTask(task.name, task.id);
					const taskInstance = new Task(task.id, task.name, task.completed);
					const taskInManager = TaskManager.getTasks().find(
						(t) => t.id === task.id
					);
					if (taskInManager) {
						taskInManager.instance = taskInstance;
					} else {
						console.warn(`Task with id ${task.id} not found in TaskManager`);
					}
				} catch (error) {
					displayError(error.message);
				}
			});
		}
		displayTasks(TaskManager.getTasks());
		updateTaskChart();
	} catch (error) {
		displayError(error.message);
	}
}

// Asynchronous Iteration
async function displayTasks(tasks) {
	const taskList = document.getElementById('taskList');
	taskList.innerHTML = '';

	async function* taskGenerator(tasks) {
		for (const task of tasks) {
			await new Promise((resolve) => setTimeout(resolve, 200));
			yield task;
		}
	}

	for await (const task of taskGenerator(tasks)) {
		const taskDiv = document.createElement('div');
		taskDiv.className = 'task';
		taskDiv.innerHTML = `
  <span class="task-content" title="${task.name}">
    ${task.name} - ${
			task.instance && typeof task.instance.getStatus === 'function'
				? task.instance.getStatus()
				: task.completed
				? 'Completed'
				: 'Pending'
		}
  </span>
  <span class="task-buttons">
    <button onclick="handleToggleTask(${task.id})">Toggle</button>
    <button onclick="TaskManager.getTasks().find(t => t.id === ${
			task.id
		})?.instance?.displayInfo()">Log Info</button>
  </span>
`;
		taskList.appendChild(taskDiv);
	}
}

// Anonymous and Callback Functions
document.getElementById('taskForm').addEventListener('submit', function (e) {
	e.preventDefault();
	const taskInput = document.getElementById('taskInput');
	const taskName = taskInput.value.trim();

	if (taskName) {
		try {
			TaskManager.addTask(taskName);
			const newTask = new Task(Date.now(), taskName, false);
			const taskInManager = TaskManager.getTasks().find(
				(t) => t.id === newTask.id
			);
			if (taskInManager) {
				taskInManager.instance = newTask;
			} else {
				console.warn(`Task with id ${newTask.id} not found in TaskManager`);
			}
			displayTasks(TaskManager.getTasks());
			updateTaskChart();
			taskInput.value = '';
			showToast('Task added!', 'success');
		} catch (error) {
			displayError(error.message);
			showToast(error.message, 'error');
		}
	} else {
		displayError('Task name cannot be empty');
		showToast('Task name cannot be empty', 'error');
	}
});

// Search tasks with regex
document.getElementById('searchInput')?.addEventListener('input', function () {
	const searchTerm = this.value.trim();
	const tasks = searchTerm
		? TaskManager.searchTasks(searchTerm)
		: TaskManager.getTasks();
	displayTasks(tasks);
});

// Filter tasks with a callback
function filterTasks(status) {
	const tasks = TaskManager.getTasks();
	const filtered = tasks.filter((task) => {
		if (status === 'all') return true;
		return task.completed === (status === 'completed');
	});
	displayTasks(filtered);
	updateTaskChart();
}

function displayError(message) {
	const errorDiv = document.getElementById('errorMessage');
	errorDiv.textContent = message;
	setTimeout(() => (errorDiv.textContent = ''), 3000);
}

// Chart: Visualize completed vs. pending tasks
function updateTaskChart() {
	const tasks = TaskManager.getTasks();
	const completed = tasks.filter((task) => task.completed).length;
	const pending = tasks.length - completed;

	const ctx = document.getElementById('taskChart')?.getContext('2d');
	if (!ctx) return;

	// Destroy previous chart instance if it exists
	if (window.taskChartInstance) {
		window.taskChartInstance.destroy();
	}

	window.taskChartInstance = new Chart(ctx, {
		type: 'pie',
		data: {
			labels: ['Completed', 'Pending'],
			datasets: [
				{
					data: [completed, pending],
					backgroundColor: ['#36A2EB', '#FF6384'],
					borderColor: ['#2E8BC0', '#D81E5B'],
					borderWidth: 1,
				},
			],
		},
		options: {
			responsive: true,
			plugins: {
				legend: { position: 'top' },
				title: { display: true, text: 'Task Status Distribution' },
			},
		},
	});
}

function handleToggleTask(id) {
	const toggled = TaskManager.toggleTask(id);
	syncTaskInstances();
	displayTasks(TaskManager.getTasks());
	updateTaskChart();
	showToast(
		toggled.completed ? 'Task marked as completed!' : 'Task marked as pending!',
		toggled.completed ? 'success' : 'info'
	);
}

window.addEventListener('DOMContentLoaded', initializeTasks);
