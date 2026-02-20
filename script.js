// ============================================
// Global Variables
// ============================================
let assignments = [];
let currentEditIndex = -1;
let completionChart = null;
let draggedElement = null;

// ============================================
// Login Functionality
// ============================================
function login() {
  const name = document.getElementById("username").value.trim();
  
  if (name === "") {
    alert("Please enter your name");
    return;
  }

  // Store username in localStorage
  localStorage.setItem("studentName", name);
  
  // Redirect to dashboard
  window.location.href = "dashboard.html";
}

// ============================================
// Dashboard Initialization
// ============================================
document.addEventListener("DOMContentLoaded", function() {
  // Check if user is logged in
  if (document.getElementById("welcome")) {
    const name = localStorage.getItem("studentName");
    
    if (!name) {
      // Redirect to login if not logged in
      window.location.href = "index.html";
      return;
    }

    // Display welcome message
    document.getElementById("welcome").innerText = `Welcome, ${name}! 👋`;
    
    // Initialize dark mode
    initializeDarkMode();
    
    // Load assignments from localStorage
    loadAssignmentsFromStorage();
    
    // Initialize chart
    initializeChart();
    
    // Update progress
    updateProgress();
    
    // Populate subject filter
    populateSubjectFilter();
    
    // Initialize drag and drop
    initializeDragAndDrop();
  }
});

// ============================================
// Dark Mode Functionality
// ============================================
function initializeDarkMode() {
  const savedTheme = localStorage.getItem("theme") || "light";
  document.documentElement.setAttribute("data-theme", savedTheme);
  updateDarkModeToggle(savedTheme);
}

function toggleDarkMode() {
  const currentTheme = document.documentElement.getAttribute("data-theme");
  const newTheme = currentTheme === "dark" ? "light" : "dark";
  
  document.documentElement.setAttribute("data-theme", newTheme);
  localStorage.setItem("theme", newTheme);
  updateDarkModeToggle(newTheme);
}

function updateDarkModeToggle(theme) {
  const toggle = document.getElementById("darkModeToggle");
  if (toggle) {
    const icon = toggle.querySelector(".toggle-icon");
    const text = toggle.querySelector(".toggle-text");
    
    if (theme === "dark") {
      icon.textContent = "☀️";
      text.textContent = "Light Mode";
    } else {
      icon.textContent = "🌙";
      text.textContent = "Dark Mode";
    }
  }
}

// ============================================
// Assignment Management Functions
// ============================================
function addAssignment() {
  const title = document.getElementById("assignmentTitle").value.trim();
  const subject = document.getElementById("assignmentSubject").value.trim();
  const deadline = document.getElementById("deadline").value;
  const priority = document.getElementById("priority").value;

  // Validation
  if (title === "" || subject === "" || deadline === "" || priority === "") {
    alert("Please fill in all fields");
    return;
  }

  // Create assignment object
  const assignment = {
    id: Date.now(), // Unique ID for drag and drop
    title: title,
    subject: subject,
    deadline: deadline,
    priority: priority,
    completed: false,
    createdAt: new Date().toISOString()
  };

  // Add to assignments array
  assignments.push(assignment);

  // Save to localStorage
  saveAssignmentsToStorage();

  // Clear form
  document.getElementById("assignmentForm").reset();

  // Reload assignments display
  loadAssignments();
  
  // Update progress
  updateProgress();
  
  // Update subject filter
  populateSubjectFilter();
  
  // Update chart
  updateChart();
}

function loadAssignmentsFromStorage() {
  const stored = localStorage.getItem("assignments");
  if (stored) {
    assignments = JSON.parse(stored);
  } else {
    assignments = [];
  }
  loadAssignments();
}

function saveAssignmentsToStorage() {
  localStorage.setItem("assignments", JSON.stringify(assignments));
}

function loadAssignments() {
  const listContainer = document.getElementById("assignmentList");
  const emptyState = document.getElementById("emptyState");
  
  if (!listContainer) return;

  // Clear existing assignments
  listContainer.innerHTML = "";

  // Get filtered assignments
  const filteredAssignments = getFilteredAssignments();

  // Show/hide empty state
  if (filteredAssignments.length === 0) {
    emptyState.classList.remove("hidden");
  } else {
    emptyState.classList.add("hidden");
  }

  // Create assignment items
  filteredAssignments.forEach((assignment, index) => {
    const originalIndex = assignments.findIndex(a => a.id === assignment.id);
    const assignmentItem = createAssignmentElement(assignment, originalIndex);
    listContainer.appendChild(assignmentItem);
  });
}

function createAssignmentElement(assignment, index) {
  const li = document.createElement("div");
  li.className = "assignment-item";
  li.draggable = true;
  li.dataset.index = index;
  
  // Add status classes
  if (assignment.completed) {
    li.classList.add("completed");
  }
  
  // Check deadline status
  const deadlineStatus = getDeadlineStatus(assignment.deadline);
  if (deadlineStatus === "overdue" && !assignment.completed) {
    li.classList.add("overdue");
  } else if (deadlineStatus === "today" && !assignment.completed) {
    li.classList.add("due-today");
  }

  // Format deadline
  const formattedDeadline = formatDate(assignment.deadline);
  const deadlineIcon = deadlineStatus === "overdue" ? "⚠️" : "📅";

  // Build HTML
  li.innerHTML = `
    <div class="assignment-header">
      <div class="assignment-title">${assignment.title}</div>
      <div class="assignment-badges">
        <span class="badge badge-subject">${assignment.subject}</span>
        <span class="badge badge-priority-${assignment.priority.toLowerCase()}">${assignment.priority}</span>
        ${assignment.completed ? '<span class="badge badge-status">✓ Completed</span>' : ''}
      </div>
    </div>
    <div class="assignment-details">
      <div class="assignment-deadline">
        ${deadlineIcon} <strong>Due:</strong> ${formattedDeadline}
        ${deadlineStatus === "overdue" && !assignment.completed ? '<span style="color: var(--overdue);"> (Overdue!)</span>' : ''}
        ${deadlineStatus === "today" && !assignment.completed ? '<span style="color: var(--due-today);"> (Due Today!)</span>' : ''}
      </div>
    </div>
    <div class="assignment-actions">
      ${!assignment.completed ? `
        <button class="action-btn btn-complete" onclick="toggleComplete(${index})">
          ✓ Mark Complete
        </button>
      ` : `
        <button class="action-btn btn-complete" onclick="toggleComplete(${index})">
          ↻ Mark Pending
        </button>
      `}
      <button class="action-btn btn-edit" onclick="openEditModal(${index})">
        ✏️ Edit
      </button>
      <button class="action-btn btn-delete" onclick="deleteAssignment(${index})">
        🗑️ Delete
      </button>
    </div>
  `;

  return li;
}

function toggleComplete(index) {
  if (index < 0 || index >= assignments.length) return;
  
  assignments[index].completed = !assignments[index].completed;
  saveAssignmentsToStorage();
  loadAssignments();
  updateProgress();
  updateChart();
}

function deleteAssignment(index) {
  if (confirm("Are you sure you want to delete this assignment?")) {
    assignments.splice(index, 1);
    saveAssignmentsToStorage();
    loadAssignments();
    updateProgress();
    populateSubjectFilter();
    updateChart();
  }
}

// ============================================
// Edit Assignment Functionality
// ============================================
function openEditModal(index) {
  if (index < 0 || index >= assignments.length) return;
  
  currentEditIndex = index;
  const assignment = assignments[index];
  
  document.getElementById("editTitle").value = assignment.title;
  document.getElementById("editSubject").value = assignment.subject;
  document.getElementById("editDeadline").value = assignment.deadline;
  document.getElementById("editPriority").value = assignment.priority;
  
  const modal = document.getElementById("editModal");
  modal.classList.add("show");
}

function closeEditModal() {
  const modal = document.getElementById("editModal");
  modal.classList.remove("show");
  currentEditIndex = -1;
}

function saveEdit() {
  if (currentEditIndex < 0 || currentEditIndex >= assignments.length) return;
  
  const title = document.getElementById("editTitle").value.trim();
  const subject = document.getElementById("editSubject").value.trim();
  const deadline = document.getElementById("editDeadline").value;
  const priority = document.getElementById("editPriority").value;

  if (title === "" || subject === "" || deadline === "" || priority === "") {
    alert("Please fill in all fields");
    return;
  }

  assignments[currentEditIndex].title = title;
  assignments[currentEditIndex].subject = subject;
  assignments[currentEditIndex].deadline = deadline;
  assignments[currentEditIndex].priority = priority;

  saveAssignmentsToStorage();
  loadAssignments();
  populateSubjectFilter();
  closeEditModal();
}

// Close modal when clicking outside
window.onclick = function(event) {
  const modal = document.getElementById("editModal");
  if (event.target === modal) {
    closeEditModal();
  }
}

// ============================================
// Search and Filter Functions
// ============================================
function getFilteredAssignments() {
  const searchTerm = document.getElementById("searchInput")?.value.toLowerCase() || "";
  const statusFilter = document.getElementById("statusFilter")?.value || "all";
  const subjectFilter = document.getElementById("subjectFilter")?.value || "all";
  const priorityFilter = document.getElementById("priorityFilter")?.value || "all";

  return assignments.filter(assignment => {
    // Search filter
    const matchesSearch = searchTerm === "" || 
      assignment.title.toLowerCase().includes(searchTerm) ||
      assignment.subject.toLowerCase().includes(searchTerm);

    // Status filter
    const matchesStatus = statusFilter === "all" ||
      (statusFilter === "completed" && assignment.completed) ||
      (statusFilter === "pending" && !assignment.completed);

    // Subject filter
    const matchesSubject = subjectFilter === "all" ||
      assignment.subject === subjectFilter;

    // Priority filter
    const matchesPriority = priorityFilter === "all" ||
      assignment.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesSubject && matchesPriority;
  });
}

function filterAssignments() {
  loadAssignments();
}

function populateSubjectFilter() {
  const subjectFilter = document.getElementById("subjectFilter");
  if (!subjectFilter) return;

  // Get all unique subjects
  const subjects = [...new Set(assignments.map(a => a.subject))].sort();
  
  // Save current selection
  const currentValue = subjectFilter.value;
  
  // Clear and rebuild options (keep "All Subjects")
  subjectFilter.innerHTML = '<option value="all">All Subjects</option>';
  
  subjects.forEach(subject => {
    const option = document.createElement("option");
    option.value = subject;
    option.textContent = subject;
    subjectFilter.appendChild(option);
  });
  
  // Restore selection if still valid
  if (currentValue && subjects.includes(currentValue)) {
    subjectFilter.value = currentValue;
  }
}

// ============================================
// Progress Tracking Functions
// ============================================
function updateProgress() {
  const total = assignments.length;
  const completed = assignments.filter(a => a.completed).length;
  const pending = total - completed;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Update counts
  const totalCountEl = document.getElementById("totalCount");
  const completedCountEl = document.getElementById("completedCount");
  const pendingCountEl = document.getElementById("pendingCount");
  const progressPercentageEl = document.getElementById("progressPercentage");
  const progressFillEl = document.getElementById("progressFill");

  if (totalCountEl) totalCountEl.textContent = total;
  if (completedCountEl) completedCountEl.textContent = completed;
  if (pendingCountEl) pendingCountEl.textContent = pending;
  if (progressPercentageEl) progressPercentageEl.textContent = `${percentage}%`;
  if (progressFillEl) {
    progressFillEl.style.width = `${percentage}%`;
    progressFillEl.textContent = percentage > 0 ? `${percentage}%` : "";
  }
}

// ============================================
// Chart.js Integration
// ============================================
function initializeChart() {
  const ctx = document.getElementById("completionChart");
  if (!ctx) return;

  completionChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Completed', 'Pending'],
      datasets: [{
        data: [0, 0],
        backgroundColor: [
          '#10b981',
          '#f59e0b'
        ],
        borderWidth: 2,
        borderColor: 'var(--bg-card)'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: 'var(--text-primary)',
            padding: 15,
            font: {
              size: 12
            }
          }
        },
        tooltip: {
          backgroundColor: 'var(--bg-card)',
          titleColor: 'var(--text-primary)',
          bodyColor: 'var(--text-primary)',
          borderColor: 'var(--border-color)',
          borderWidth: 1
        }
      }
    }
  });

  updateChart();
}

function updateChart() {
  if (!completionChart) return;

  const completed = assignments.filter(a => a.completed).length;
  const pending = assignments.length - completed;

  completionChart.data.datasets[0].data = [completed, pending];
  completionChart.update();
}

// ============================================
// Date Utility Functions
// ============================================
function formatDate(dateString) {
  const date = new Date(dateString + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}

function getDeadlineStatus(deadline) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const dueDate = new Date(deadline + 'T00:00:00');
  dueDate.setHours(0, 0, 0, 0);
  
  const diffTime = dueDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return "overdue";
  } else if (diffDays === 0) {
    return "today";
  } else if (diffDays <= 3) {
    return "soon";
  } else {
    return "upcoming";
  }
}

// ============================================
// Drag and Drop Functionality
// ============================================
function initializeDragAndDrop() {
  const listContainer = document.getElementById("assignmentList");
  if (!listContainer) return;

  // Add event listeners to the container (event delegation)
  listContainer.addEventListener('dragstart', handleDragStart);
  listContainer.addEventListener('dragover', handleDragOver);
  listContainer.addEventListener('drop', handleDrop);
  listContainer.addEventListener('dragend', handleDragEnd);
}

function handleDragStart(e) {
  if (!e.target.classList.contains('assignment-item')) {
    // If clicking on a child element, find the parent assignment-item
    draggedElement = e.target.closest('.assignment-item');
  } else {
    draggedElement = e.target;
  }
  
  if (!draggedElement) return;
  
  draggedElement.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/html', draggedElement.innerHTML);
}

function handleDragOver(e) {
  if (e.preventDefault) {
    e.preventDefault();
  }
  
  e.dataTransfer.dropEffect = 'move';
  
  const target = e.target.closest('.assignment-item');
  if (!target || target === draggedElement) return;

  const listContainer = document.getElementById("assignmentList");
  const afterElement = getDragAfterElement(listContainer, e.clientY);
  
  if (afterElement == null) {
    listContainer.appendChild(draggedElement);
  } else {
    listContainer.insertBefore(draggedElement, afterElement);
  }
}

function handleDrop(e) {
  if (e.stopPropagation) {
    e.stopPropagation();
  }
  
  return false;
}

function handleDragEnd(e) {
  if (draggedElement) {
    draggedElement.classList.remove('dragging');
    
    // Get new order from DOM
    const listContainer = document.getElementById("assignmentList");
    const items = Array.from(listContainer.querySelectorAll('.assignment-item'));
    
    // Get filtered assignments to map DOM order back to full array
    const filteredAssignments = getFilteredAssignments();
    
    // Map DOM order to assignment IDs
    const newOrderIds = items.map(item => {
      const domIndex = parseInt(item.dataset.index);
      return filteredAssignments[domIndex]?.id;
    }).filter(id => id !== undefined);
    
    // If we have a valid reorder, update the assignments array
    if (newOrderIds.length > 0) {
      // Create a map of assignments by ID
      const assignmentMap = new Map(assignments.map(a => [a.id, a]));
      
      // Get assignments in new order (only those that were visible/filtered)
      const reorderedFiltered = newOrderIds.map(id => assignmentMap.get(id)).filter(Boolean);
      
      // Get assignments that weren't in the filtered view
      const unfiltered = assignments.filter(a => !newOrderIds.includes(a.id));
      
      // Combine: reordered filtered items first, then unfiltered items
      assignments = [...reorderedFiltered, ...unfiltered];
      
      // Save to localStorage
      saveAssignmentsToStorage();
      
      // Reload to reflect changes
      loadAssignments();
    }
  }
  
  draggedElement = null;
}

function getDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll('.assignment-item:not(.dragging)')];
  
  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    
    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// ============================================
// Storage & Persistence Helpers
// ============================================
function saveToLocal(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function loadFromLocal(key, fallback) {
  const v = localStorage.getItem(key);
  return v ? JSON.parse(v) : fallback;
}

// ============================================
// Study Suggestions (Smart) — days left + daily study time
// ============================================
function updateStudySuggestions() {
  const container = document.getElementById('studySuggestions');
  if (!container) return;

  // Default time estimates by priority (hours)
  const estimateByPriority = { High: 5, Medium: 3, Low: 1 };

  const pending = assignments.filter(a => !a.completed);
  if (pending.length === 0) {
    container.innerHTML = '<p class="no-suggestions">No pending assignments. Great job! 🎉</p>';
    return;
  }

  // Compute suggestions
  const items = pending.map(a => {
    const today = new Date(); today.setHours(0,0,0,0);
    const due = new Date(a.deadline + 'T00:00:00'); due.setHours(0,0,0,0);
    const diffMs = due - today;
    const daysLeft = Math.max(1, Math.ceil(diffMs / (1000*60*60*24)));
    const estHours = estimateByPriority[a.priority] || 2;
    const daily = Math.max(0.25, +(estHours / daysLeft).toFixed(2));
    return { id: a.id, title: a.title, subject: a.subject, daysLeft, estHours, daily, deadline: a.deadline };
  });

  // Sort by daysLeft ascending (urgent first)
  items.sort((x,y) => x.daysLeft - y.daysLeft || y.estHours - x.estHours);

  container.innerHTML = '';
  items.forEach(it => {
    const el = document.createElement('div');
    el.className = 'suggestion-item';
    el.innerHTML = `
      <div class="suggestion-title">${it.title} <span style="font-weight:500;color:var(--text-secondary);">(${it.subject})</span></div>
      <div class="suggestion-details">Due: ${formatDate(it.deadline)} — ${it.daysLeft} day(s) left</div>
      <div class="suggestion-time">Suggested: ${it.daily} hrs/day (total ${it.estHours} hrs)</div>
    `;
    container.appendChild(el);
  });
}

// ============================================
// Pomodoro Timer (25/5) — start, pause, reset
// ============================================
const pomodoro = {
  workSec: 25 * 60,
  breakSec: 5 * 60,
  remaining: 25 * 60,
  mode: 'work', // 'work' or 'break'
  running: false,
  intervalId: null
};

function updatePomodoroUI() {
  const display = document.getElementById('timerDisplay');
  const modeEl = document.getElementById('timerMode');
  const startBtn = document.getElementById('startBtn');
  const pauseBtn = document.getElementById('pauseBtn');
  const resetBtn = document.getElementById('resetBtn');
  if (display) {
    const m = Math.floor(pomodoro.remaining / 60).toString().padStart(2,'0');
    const s = (pomodoro.remaining % 60).toString().padStart(2,'0');
    display.textContent = `${m}:${s}`;
  }
  if (modeEl) modeEl.textContent = pomodoro.mode === 'work' ? 'Work Session' : 'Short Break';
  if (startBtn) startBtn.disabled = pomodoro.running;
  if (pauseBtn) pauseBtn.disabled = !pomodoro.running;
  if (resetBtn) resetBtn.disabled = false;
}

function startPomodoro() {
  if (pomodoro.running) return;
  pomodoro.running = true;
  pomodoro.intervalId = setInterval(() => {
    pomodoro.remaining -= 1;
    if (pomodoro.remaining <= 0) {
      // switch mode
      if (pomodoro.mode === 'work') {
        pomodoro.mode = 'break';
        pomodoro.remaining = pomodoro.breakSec;
        // small notification
        try { new Notification('Pomodoro', { body: 'Work session complete — time for a break!' }); } catch(e){}
      } else {
        pomodoro.mode = 'work';
        pomodoro.remaining = pomodoro.workSec;
        try { new Notification('Pomodoro', { body: 'Break finished — back to work!' }); } catch(e){}
      }
    }
    updatePomodoroUI();
  }, 1000);
  updatePomodoroUI();
}

function pausePomodoro() {
  if (!pomodoro.running) return;
  clearInterval(pomodoro.intervalId);
  pomodoro.intervalId = null;
  pomodoro.running = false;
  updatePomodoroUI();
}

function resetPomodoro() {
  pausePomodoro();
  pomodoro.mode = 'work';
  pomodoro.remaining = pomodoro.workSec;
  updatePomodoroUI();
}

// ============================================
// Productivity Score & Streaks
// ============================================
let productivity = loadFromLocal('productivity', { score: 0, streak: 0, lastProductive: null });

function saveProductivity() {
  saveToLocal('productivity', productivity);
  renderProductivityUI();
}

function renderProductivityUI() {
  const scoreEl = document.getElementById('productivityScore');
  const streakEl = document.getElementById('streakCount');
  if (scoreEl) scoreEl.textContent = productivity.score || 0;
  if (streakEl) streakEl.textContent = productivity.streak || 0;
}

function recordCompletionResult(onTime) {
  // onTime: boolean — true if completed on or before deadline
  if (onTime) {
    productivity.score = (productivity.score || 0) + 10;

    // handle streaks: a productive day is any on-time completion
    const todayStr = new Date().toISOString().slice(0,10);
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate()-1);
    const yStr = yesterday.toISOString().slice(0,10);

    if (productivity.lastProductive === todayStr) {
      // already counted today
    } else if (productivity.lastProductive === yStr) {
      productivity.streak = (productivity.streak || 0) + 1;
      productivity.lastProductive = todayStr;
    } else {
      productivity.streak = 1;
      productivity.lastProductive = todayStr;
    }
  } else {
    productivity.score = Math.max(0, (productivity.score || 0) - 5);
    // breaking streak
    productivity.streak = 0;
  }

  saveProductivity();
}

// ============================================
// Export Data as JSON
// ============================================
function exportData() {
  const data = {
    assignments,
    goals: loadFromLocal('goals', []),
    productivity: productivity
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `student-dashboard-data-${new Date().toISOString().slice(0,10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ============================================
// Goals System
// ============================================
let goals = loadFromLocal('goals', []);

function openAddGoalModal() {
  document.getElementById('addGoalModal')?.classList.add('show');
}

function closeAddGoalModal() {
  document.getElementById('addGoalModal')?.classList.remove('show');
}

function addGoal() {
  const title = document.getElementById('goalTitle').value.trim();
  if (!title) return alert('Please enter a goal title');

  const goal = {
    id: Date.now(),
    title,
    description: document.getElementById('goalDescription').value.trim(),
    target: Number(document.getElementById('goalTarget').value) || 1,
    current: Number(document.getElementById('goalCurrent').value) || 0,
    deadline: document.getElementById('goalDeadline').value || null,
    createdAt: new Date().toISOString()
  };

  goals.push(goal);
  saveToLocal('goals', goals);
  closeAddGoalModal();
  renderGoals();
}

function renderGoals() {
  const container = document.getElementById('goalsList');
  if (!container) return;
  if (!goals || goals.length === 0) {
    container.innerHTML = '<p class="no-goals">No goals yet. Add your first goal to track progress!</p>';
    return;
  }
  container.innerHTML = '';
  goals.forEach(g => {
    const percent = Math.min(100, Math.round((g.current / g.target) * 100));
    const el = document.createElement('div');
    el.className = 'goal-item';
    el.innerHTML = `
      <div class="goal-header">
        <div class="goal-title">${g.title}</div>
        <div class="goal-actions">
          <button class="goal-btn btn-edit-goal" onclick="editGoal(${g.id})">Edit</button>
          <button class="goal-btn btn-delete-goal" onclick="deleteGoal(${g.id})">Delete</button>
        </div>
      </div>
      <div class="goal-description">${g.description || ''}</div>
      <div class="goal-progress-container">
        <div class="goal-progress-label"><span>Progress</span><span>${percent}%</span></div>
        <div class="goal-progress-bar">
          <div class="goal-progress-fill" style="width:${percent}%">${g.current}/${g.target}</div>
        </div>
      </div>
      <div class="goal-meta">
        <div>Created: ${formatDate(g.createdAt)}</div>
        ${g.deadline ? `<div>Target: ${formatDate(g.deadline)}</div>` : ''}
      </div>
    `;
    container.appendChild(el);
  });
}

function deleteGoal(id) {
  if (!confirm('Delete this goal?')) return;
  goals = goals.filter(g => g.id !== id);
  saveToLocal('goals', goals);
  renderGoals();
}

function editGoal(id) {
  const g = goals.find(x => x.id === id);
  if (!g) return;
  // Reuse add modal for simplicity
  document.getElementById('goalTitle').value = g.title;
  document.getElementById('goalDescription').value = g.description || '';
  document.getElementById('goalTarget').value = g.target;
  document.getElementById('goalCurrent').value = g.current;
  document.getElementById('goalDeadline').value = g.deadline || '';
  deleteGoal(id);
  openAddGoalModal();
}

// ============================================
// Mood / Theme Handling
// ============================================
function changeMoodTheme() {
  const mood = document.getElementById('moodSelector')?.value || 'default';
  if (mood === 'default') {
    document.documentElement.removeAttribute('data-mood');
    localStorage.removeItem('mood');
  } else {
    document.documentElement.setAttribute('data-mood', mood);
    localStorage.setItem('mood', mood);
  }
}

function initializeMood() {
  const saved = localStorage.getItem('mood');
  if (saved) {
    document.documentElement.setAttribute('data-mood', saved);
    const sel = document.getElementById('moodSelector');
    if (sel) sel.value = saved;
  }
}

// ============================================
// Auto-sort assignments by urgency (used on load)
// ============================================
function sortAssignmentsByUrgency() {
  const urgencyRank = { overdue: 0, today: 1, soon: 2, upcoming: 3 };
  assignments.sort((a,b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1; // incomplete first
    const sa = urgencyRank[getDeadlineStatus(a.deadline)] ?? 3;
    const sb = urgencyRank[getDeadlineStatus(b.deadline)] ?? 3;
    if (sa !== sb) return sa - sb;
    // tie-breaker: priority (High -> Low)
    const pr = { High: 0, Medium: 1, Low: 2 };
    const pa = pr[a.priority] ?? 1;
    const pb = pr[b.priority] ?? 1;
    if (pa !== pb) return pa - pb;
    // finally by deadline
    return new Date(a.deadline) - new Date(b.deadline);
  });
}

// Enhance existing flows: hook into save/load to update suggestions, productivity UI, goals
const _old_loadAssignments = loadAssignments;
loadAssignments = function() {
  sortAssignmentsByUrgency();
  _old_loadAssignments();
  updateStudySuggestions();
  renderGoals();
  renderProductivityUI();
};

// Wire completion to productivity: wrap toggleComplete to record results
const _old_toggleComplete = toggleComplete;
toggleComplete = function(index) {
  if (index < 0 || index >= assignments.length) return;
  const wasCompleted = assignments[index].completed;
  _old_toggleComplete(index);

  // if we just marked completed (was false -> true) evaluate timing
  if (!wasCompleted && assignments[index].completed) {
    const today = new Date(); today.setHours(0,0,0,0);
    const due = new Date(assignments[index].deadline + 'T00:00:00'); due.setHours(0,0,0,0);
    const onTime = due >= today;
    recordCompletionResult(onTime);
  }
};

// Initialize small pieces on startup
document.addEventListener('DOMContentLoaded', () => {
  initializeMood();
  // initialize pomodoro UI
  resetPomodoro();
  // load productivity state
  productivity = loadFromLocal('productivity', productivity);
  renderProductivityUI();
  // load goals
  goals = loadFromLocal('goals', goals);
  renderGoals();
});
