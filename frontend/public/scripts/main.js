// TaskWeaver Frontend Logic (CRUD + AI)

// State
let state = { projects: [], plans: [] };
let currentProjectId = null;
let currentCSV = ''; // <-- store the CSV part of the plan

// Utils
function uid(prefix='id'){ return prefix + '_' + Math.random().toString(36).slice(2,9); }
function el(tag, attrs={}, inner=''){ 
  const e = document.createElement(tag); 
  for(const k in attrs) e.setAttribute(k, attrs[k]); 
  if(inner) e.innerHTML=inner; 
  return e; 
}
function escapeHtml(s){ 
  if(!s) return ''; 
  return s.replace(/[&<>\"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); 
}

// DOM refs
const projectsList = document.getElementById('projectsList');
const projectsName = document.getElementById('projectName');
const projectsDesc = document.getElementById('projectDesc');
const createProjectBtn = document.getElementById('createProjectBtn');
const clearStorageBtn = document.getElementById('clearStorageBtn');

const detailTitle = document.getElementById('detailTitle');
const detailDesc = document.getElementById('detailDesc');
const membersCount = document.getElementById('membersCount');

const memberName = document.getElementById('memberName');
const memberSkills = document.getElementById('memberSkills');
const memberWeakness = document.getElementById('memberWeakness');
const addMemberBtn = document.getElementById('addMemberBtn');
const membersList = document.getElementById('membersList');

const generatePlanBtn = document.getElementById('generatePlanBtn');
const aiSuggestion = document.getElementById('aiSuggestion');

const plansList = document.getElementById('plansList');

const editPlanModal = document.getElementById('editPlanModal');
const modalPlanEdit = document.getElementById('modalPlanEdit');
const modalTableContainer = document.getElementById('modalTableContainer');

const viewTextBtn = document.getElementById('viewTextBtn');
const viewTableBtn = document.getElementById('viewTableBtn');

const modalSaveBtn = document.getElementById('modalSaveBtn');
const modalCancelBtn = document.getElementById('modalCancelBtn');
const closeModal = document.getElementById('closeModal');

// ======================
// Fetch Projects from Backend
// ======================
async function fetchProjects() {
  try {
    const resp = await fetch('http://localhost:3000/api/projects');
    state.projects = await resp.json();
    if (state.projects.length > 0) currentProjectId = state.projects[0]._id;
    renderAll();
  } catch (err) {
    console.error('Error fetching projects', err);
  }
}

// ======================
// Renderers
function renderProjects(){
  projectsList.innerHTML='';
  state.projects.forEach(p=>{
    const wrap = el('div',{class:'item'});
    const left = el('div', {class: 'left'}); 
    const MAX_NAME_LENGTH = 8;
    let shortName = escapeHtml(p.name || '');
    if (shortName.length > MAX_NAME_LENGTH) {
      shortName = shortName.slice(0, MAX_NAME_LENGTH) + '...';
    }
    const MAX_DESC_LENGTH = 8; 
    let shortDesc = escapeHtml(p.desc || '');
    if (shortDesc.length > MAX_DESC_LENGTH) {
      shortDesc = shortDesc.slice(0, MAX_DESC_LENGTH) + '...';
    }
    left.innerHTML = `<div style="font-weight:600">${shortName}</div><div class='muted small'>${shortDesc}</div>`;
    const right = el('div',{class:'actions'});
    const open = el('button',{},'Open'); 
    open.style.background='#446aff'; 
    open.onclick=()=>{ openProject(p._id)}
    const del = el('button',{},'Delete'); 
    del.classList.add('danger');
    del.onclick = async () => {
      if(!confirm('Delete this project?')) return;
      await fetch(`http://localhost:3000/api/projects/${p._id}`, { method:'DELETE' });
      state.projects = state.projects.filter(x => x._id !== p._id);
      if(currentProjectId === p._id) currentProjectId = null;
      renderAll();
    };
    
    right.appendChild(open);
    right.appendChild(del);
    wrap.appendChild(left);
    wrap.appendChild(right);
    projectsList.appendChild(wrap);
  });
}

function renderProjectDetail(){
  if(!currentProjectId){ 
    detailTitle.textContent='Select a Project'; 
    detailDesc.textContent='No project selected'; 
    membersCount.textContent='0 Members'; 
    membersList.innerHTML=''; 
    aiSuggestion.textContent='Press "Generate Plan (AI)" to get recommended work plans'; 
    return; 
  }
  const p = state.projects.find(x => x._id === currentProjectId);
  if(!p) return;
  
  detailTitle.textContent = p.name;
  detailDesc.textContent = p.desc || '';
  membersCount.textContent = (p.members?.length || 0) + ' Members';
  
  membersList.innerHTML = '';
  (p.members || []).forEach(m => {
    const row = el('div', { class:'item' });
    const left = el('div', { class:'member-row' });
    left.innerHTML = `<div style='font-weight:600'>${escapeHtml(m.name)}</div>
                      <div class='muted small' style='margin-left:8px'>${escapeHtml((m.skills||[]).join(', '))}</div>`;
    
    const right = el('div', { class:'actions' });
    
    const edit = el('button', {}, 'Edit');
    edit.onclick = () => editMember(m._id);
    edit.style.background='#446aff'; 
    
    const del = el('button', {}, 'Remove');
    del.classList.add('danger');
    del.onclick = async () => {
      if(!confirm('Delete this member?')) return;
      await fetch(`http://localhost:3000/api/projects/${p._id}/members/${m._id}`, { method:'DELETE' });
      p.members = p.members.filter(x => x._id !== m._id);
      renderAll();
    };
    
    right.appendChild(edit);
    right.appendChild(del);
    row.appendChild(left);
    row.appendChild(right);
    membersList.appendChild(row);
  });
}

function renderPlans() {
  plansList.innerHTML='';
  state.plans.forEach(pl => {
    const row = el('div', { class:'item' });
    row.innerHTML = `<div><div style='font-weight:600'>${escapeHtml(pl.title)}</div>
                      <div class='muted small'>${new Date(pl.createdAt).toLocaleString()}</div></div>`;
    const right = el('div', { class:'actions' });
   const view = el('button', {}, 'Edit');
   view.onclick = () => openPlanModal(pl);
   view.style.background='#446aff';
    
    const del = el('button', {}, 'Delete');
    del.classList.add('danger');
    del.onclick = async () => {
      try {
        const resp = await fetch(`http://localhost:3000/api/plans/${pl._id}`, { method: 'DELETE' });
        if (!resp.ok) throw new Error('Failed to delete plan');
        state.plans = state.plans.filter(x => x._id !== pl._id);
        renderAll();
      } catch (err) {
        alert('Error deleting plan: ' + err.message);
      }
    };
    
    right.appendChild(view);
    right.appendChild(del);
    row.appendChild(right);
    plansList.appendChild(row);
  });
}

function renderAll() {
  renderProjects();
  renderProjectDetail();
  renderPlans();
}

// ======================
// Actions
// ======================
createProjectBtn.onclick = async () => {
  const name = projectsName.value.trim();
  if(!name) return alert('Please enter a project name');
  const p = { name, desc: projectsDesc.value.trim(), members: [] };
  
  try {
    const resp = await fetch('http://localhost:3000/api/projects', {
      method:'POST', 
      headers:{ 'Content-Type':'application/json' }, 
      body: JSON.stringify(p)
    });
    const newProject = await resp.json();
    state.projects.push(newProject);
    projectsName.value='';
    projectsDesc.value='';
    renderAll();
  } catch (err) {
    alert('Error creating project');
  }
};

async function openProject(id) {
  currentProjectId = id;

  try {
    const resp = await fetch(`http://localhost:3000/api/plans/${id}`);
    state.plans = await resp.json();
  } catch (err) {
    console.error("Error fetching plans", err);
    state.plans = [];
  }

  aiSuggestion.textContent = 'Press "Generate Plan (AI)" to get recommended work plans';

  renderAll();
}

// Add member
addMemberBtn.onclick = async () => {
  if(!currentProjectId) return alert('Please select a project first');
  const p = state.projects.find(x => x._id === currentProjectId);

  const member = {
    name: memberName.value.trim(),
    skills: memberSkills.value.split(',').map(s => s.trim()).filter(Boolean),
    weakness: memberWeakness.value.split(',').map(s => s.trim()).filter(Boolean)
  };
  if(!member.name) return alert('Please enter a member name');

  try {
    const resp = await fetch(`http://localhost:3000/api/projects/${p._id}/members`, {
      method:'POST',
      headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify(member)
    });
    const updatedProject = await resp.json();
    state.projects = state.projects.map(x => x._id === updatedProject._id ? updatedProject : x);

    memberName.value = '';
    memberSkills.value = '';
    memberWeakness.value = '';
    renderAll();
  } catch (err) {
    alert('Error adding member: ' + err.message);
  }
};

// Edit member
function editMember(memberId){
  const p = state.projects.find(x => x._id === currentProjectId);
  const m = p.members.find(x => x._id === memberId);
  const name = prompt('Edit member name', m.name);
  if(name === null) return;
  const skills = prompt('Edit skills (comma separated)', m.skills.join(','));
  const weakness = prompt('Edit weaknesses (comma separated)', m.weakness.join(','));

  const updatedMember = {
    name: name.trim() || m.name,
    skills: skills ? skills.split(',').map(s => s.trim()).filter(Boolean) : m.skills,
    weakness: weakness ? weakness.split(',').map(s => s.trim()).filter(Boolean) : m.weakness
  };

  fetch(`http://localhost:3000/api/projects/${p._id}/members/${memberId}`, {
    method:'PUT',
    headers:{ 'Content-Type':'application/json' },
    body: JSON.stringify(updatedMember)
  })
    .then(r => r.json())
    .then(updatedProject => {
      state.projects = state.projects.map(x => x._id === updatedProject._id ? updatedProject : x);
      renderAll();
    })
    .catch(err => alert('Error editing member: ' + err.message));
}

// ======================
// AI Plan
// ======================
let currentAISuggestion = ''; // Stores the latest AI Plan

generatePlanBtn.onclick = async () => {
  if(!currentProjectId) return alert('Please select a project first');
  const p = state.projects.find(x => x._id === currentProjectId);

  if(!p.members || p.members.length === 0) {
    aiSuggestion.textContent = 'Please add team members first';
    return;
  }

  aiSuggestion.textContent = 'Generating AI plan...';

  try{
    const resp = await fetch('http://localhost:3000/api/generate', {
      method:'POST',
      headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify({ prompt: buildPrompt(p) })
    });

    const json = await resp.json();

    if(json.plan){
      aiSuggestion.innerHTML = `<pre style="white-space: pre-wrap;">${escapeHtml(json.plan)}</pre>`;
      currentAISuggestion = json.plan;
    } else {
      aiSuggestion.textContent = 'No result from AI';
      currentAISuggestion = '';
    }

  } catch(err){
    console.error(err);
    aiSuggestion.textContent = 'An error occurred';
    currentAISuggestion = '';
  }
};

// Save AI Suggestion
applyPlanBtn.onclick = async () => {
  if(!currentProjectId) return alert('Please select a project first');
  if(!currentAISuggestion) return alert('No AI plan to save');

  const p = state.projects.find(x => x._id === currentProjectId);
  const title = `AI Plan for ${p.name}`;

  try {
    const resp = await fetch("http://localhost:3000/api/plans", {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({
        title,
        content: currentAISuggestion,
        projectId: p._id
      })
    });
    const newPlan = await resp.json();
    state.plans.push(newPlan);
    renderPlans();
    alert('AI Plan saved successfully ✅');
  } catch(err){
    alert('Error saving plan: ' + err.message);
  }
};

function buildPrompt(project) {
  // 1. Define a more advanced AI role
  let s = `You are a Senior AI Project Manager and Strategist, an expert in breaking down high-level goals into actionable, professional work plans. You follow standard project management methodologies to ensure clarity, efficiency, and success. Your goal is to be comprehensive and realistic.\n\n`;

  // 2. Provide Full Context, including the current date for realistic planning
  s += `**CONTEXT**\n`;
  s += `You have been assigned a new project.\n\n`;
  s += `Project Name: ${project.name}\n`;
  s += `Details: ${project.desc || 'No additional details'}\n\n`;
  s += `Team Roster (${project.members.length} members):\n`;

  project.members.forEach((m, index) => {
    s += `${index + 1}. ${m.name}\n`;
    s += `   - Strengths: ${(m.skills && m.skills.length > 0) ? m.skills.join(', ') : 'Not specified'}\n`;
    s += `   - Weaknesses: ${(m.weakness && m.weakness.length > 0) ? m.weakness.join(', ') : 'Not specified'}\n\n`;
  });

  // 3. Provide a clear, step-by-step process for the AI to follow
  s += `**YOUR TASK & PROCESS**\n`;
  s += `Analyze the project details and team roster, then generate a comprehensive and professional project plan. Follow these steps in your thinking:\n`;
  s += `1.  **Analyze & Deconstruct:** First, analyze the project description to determine the primary objective, the key deliverables (the main things you need to produce), and 1-2 potential risks (e.g., skill gaps, tight deadlines).\n`;
  s += `2.  **Structure into Phases:** Break the project down into logical, professional phases (e.g., Phase 1: Planning & Discovery, Phase 2: Design & Prototyping, Phase 3: Development & Implementation, Phase 4: Testing & QA, Phase 5: Launch & Review). Define the key tasks within each phase.\n`;
  s += `3.  **Allocate & Justify Roles:** For each task, strategically assign a "Main Responsible" person based on their strengths. For tasks that are learning opportunities, also assign a "Learner/Assistant" (this value must be either a single person's name or the word "ALL" for group learning). Briefly justify your most important assignments.\n`;
  s += `4.  **Create a Realistic Timeline:** Sequence tasks logically, considering dependencies. Assign concrete start and end dates for each task.\n`;
  s += `5.  **Provide Actionable Recommendations:** Suggest a communication plan, relevant tools, and key metrics to measure the project's success.\n\n`;
  
  // 4. Specify the required output format in detail
  s += `**REQUIRED OUTPUT FORMAT**\n`;
  s += `Generate the plan in English using the exact structure below:\n\n`;

  s += `**1. Project Analysis & Strategy**\n`;
  s += `- **Project Goal:** (A single, clear sentence describing the desired outcome.)\n`;
  s += `- **Key Deliverables:** (Bulleted list of the primary outputs.)\n`;
  s += `- **Potential Risks:** (1-2 potential challenges to be aware of.)\n\n`;

  s += `**2. Roles and Responsibilities**\n`;
  s += `- **Team Lead:** (Assign one person as the overall project point-of-contact, based on their skills.)\n`;
  s += `- **Key Assignments Justification:** (Briefly explain the reasoning behind 2-3 of the most critical task assignments.)\n\n`;
  
  s += `**3. Phased Work Timeline**\n`;
  s += `- A detailed breakdown of each Phase and the tasks within it.\n\n`;

  s += `**4. Detailed Plan (CSV Format)**\n`;
  s += `(Use a comma "," as a separator. The first line must be the header. The "Learner/Assistant" column must contain either ONE name or the word "ALL".)\n`;
  s += `Phase,Task Name,Main Responsible,Learner/Assistant,Start Date,End Date,Status\n\n`;

  s += `**5. Professional Recommendations**\n`;
  s += `- **Communication Cadence:** (e.g., Daily Stand-ups at 9 AM, Weekly Sync on Fridays.)\n`;
  s += `- **Recommended Tools:** (e.g., Trello for task management, Slack for communication.)\n`;
  s += `- **Success Metrics (KPIs):** (e.g., Complete user registration feature, Achieve 95% test coverage.)\n`;

  return s;
}


// ======================
// Init
// ======================
document.addEventListener('DOMContentLoaded', fetchProjects);

// DOM refs for icons
const projectIcon = document.getElementById('projectIcon');
const memberIcon = document.getElementById('memberIcon');
const planIcon = document.getElementById('planIcon');

// Function to update icons
function updateIcons(isLightMode) {
  if (isLightMode) {
    projectIcon.src = "/icons/project.png";
    memberIcon.src = "/icons/member.png";
    planIcon.src = "/icons/plan.png";
  } else {
    projectIcon.src = "/icons/projectw.png";
    memberIcon.src = "/icons/memberw.png";
    planIcon.src = "/icons/planw.png";
  }
}

// Theme toggle
const toggleBtn = document.getElementById("toggleThemeBtn");
toggleBtn.addEventListener("click", () => {
  document.body.classList.toggle("light-mode");
  const isLightMode = document.body.classList.contains("light-mode");
  toggleBtn.textContent = isLightMode ? "☀️" : "🌙";
  updateIcons(isLightMode);
  localStorage.setItem("theme", isLightMode ? "light" : "dark");
});

// Clear All
clearStorageBtn.onclick = async () => {
  if (!confirm("Are you sure you want to delete all projects?")) return;
  try {
    await fetch("http://localhost:3000/api/projects", { method: "DELETE" });
    state.projects = [];
    state.plans = [];
    currentProjectId = null;
    renderAll();
  } catch (err) {
    alert("Error clearing all projects: " + err.message);
  }
};

// Load theme from localStorage
window.addEventListener("DOMContentLoaded", () => {
  const savedTheme = localStorage.getItem("theme");
  const isLightMode = savedTheme === "light";
  if (isLightMode) {
    document.body.classList.add("light-mode");
    toggleBtn.textContent = "☀️";
  }
  updateIcons(isLightMode);
});

let currentEditingPlan = null;

// Open modal
function openPlanModal(plan){
  currentEditingPlan = plan;
  modalPlanEdit.value = plan.content;

  // Extract CSV portion: start at "Phase,Task Name,...", end before next "**" section
  const csvStart = plan.content.indexOf("Phase,Task Name");
  let csvEnd = plan.content.indexOf("**4.", csvStart); // stop at Additional Recommendations
  if(csvEnd === -1) csvEnd = plan.content.length; // fallback if not found

  currentCSV = plan.content.slice(csvStart, csvEnd).trim();

  // Show text view by default
  modalPlanEdit.style.display = 'block';
  modalTableContainer.style.display = 'none';

  editPlanModal.style.display = 'block';
}


// Save plan from modal
modalSaveBtn.onclick = async () => {
  if(!currentEditingPlan) return;
  
  const updatedContent = modalPlanEdit.value.trim();
  if(!updatedContent) return alert('No content to save');

  try{
    const resp = await fetch(`http://localhost:3000/api/plans/${currentEditingPlan._id}`, {
      method:'PUT',
      headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify({ content: updatedContent })
    });

    if(!resp.ok){
      const errJson = await resp.json().catch(()=>({error:'Failed to save plan'}));
      throw new Error(errJson.error || 'Failed to save plan');
    }

    const updatedPlan = await resp.json();
    state.plans = state.plans.map(p => p._id === updatedPlan._id ? updatedPlan : p);

    renderAll();
    editPlanModal.style.display = 'none';
    currentEditingPlan = null;

  } catch(err){
    alert('Error saving plan: ' + err.message);
  }
};

// Cancel modal
modalCancelBtn.onclick = () => {
  editPlanModal.style.display = 'none';
  currentEditingPlan = null;
};

// Close modal on X
closeModal.onclick = () => {
  editPlanModal.style.display = 'none';
  currentEditingPlan = null;
};

// Close modal when clicking outside
window.onclick = e => {
  if(e.target === editPlanModal){
    editPlanModal.style.display = 'none';
    currentEditingPlan = null;
  }
};

function renderCSVTable(csv){
  if(!csv){
    modalTableContainer.innerHTML = '<p>No table data available</p>';
    return;
  }

  const lines = csv.trim().split('\n');
  const headers = lines[0].split(',');
  const rows = lines.slice(1);

  const table = document.createElement('table');
  table.style.width = '100%';
  table.style.borderCollapse = 'collapse';

  // Header
  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');
  headers.forEach(h => {
    const th = document.createElement('th');
    th.textContent = h;
    th.style.border = '1px solid #ccc';
    th.style.color = '1px solid #000';
    th.style.padding = '4px';
    th.style.background = '#f0f0f0';
    headRow.appendChild(th);
  });
  thead.appendChild(headRow);
  table.appendChild(thead);

  // Body
  const tbody = document.createElement('tbody');
  rows.forEach(line => {
    const tr = document.createElement('tr');
    const cols = line.split(',');
    cols.forEach(c => {
      const td = document.createElement('td');
      td.textContent = c;
      td.style.border = '1px solid #ccc';
      td.style.padding = '4px';
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);

  modalTableContainer.innerHTML = '';
  modalTableContainer.appendChild(table);
}

viewTextBtn.addEventListener('click', () => {
  modalPlanEdit.style.display = 'block';
  modalTableContainer.style.display = 'none';
});

viewTableBtn.addEventListener('click', () => {
  modalPlanEdit.style.display = 'none';
  modalTableContainer.style.display = 'block';
  renderCSVTable(currentCSV);
});