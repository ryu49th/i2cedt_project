// TaskWeaver Frontend Logic (CRUD + AI)

// State
let state = { projects: [], plans: [] };
let currentProjectId = null;

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
// ======================
function renderProjects() {
  projectsList.innerHTML = '';
  state.projects.forEach(p => {
    const wrap = el('div', { class:'item' });
    const left = el('div');
    left.innerHTML = `<div style="font-weight:600">${escapeHtml(p.name)}</div><div class='muted small'>${escapeHtml(p.desc||'')}</div>`;
    const right = el('div',{class:'actions'});
    const open = el('button',{},'Open'); 
    open.style.background='#446aff'; 
    open.onclick=()=>{ openProject(p._id)}
    const del = el('button',{},'Delete'); 
    del.classList.add('danger');
    del.onclick = async () => {
      if(!confirm('ลบโปรเจกต์?')) return;
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

function renderProjectDetail() {
  if (!currentProjectId) {
    detailTitle.textContent = 'เลือกโปรเจกต์'; 
    detailDesc.textContent = 'ไม่มีโปรเจกต์ที่เลือก'; 
    membersCount.textContent = '0 สมาชิก'; 
    membersList.innerHTML = ''; 
    aiSuggestion.textContent = 'กด "Generate Plan (AI)" เพื่อให้ระบบแนะนำแผนแบ่งงาน';
    return;
  }
  const p = state.projects.find(x => x._id === currentProjectId);
  if(!p) return;
  
  detailTitle.textContent = p.name;
  detailDesc.textContent = p.desc || '';
  membersCount.textContent = (p.members?.length || 0) + ' สมาชิก';
  
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
      if(!confirm('ลบสมาชิก?')) return;
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
  if(!name) return alert('กรุณาใส่ชื่อโปรเจกต์');
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

  aiSuggestion.textContent = 'กด "Generate Plan (AI)" เพื่อให้ระบบแนะนำแผนแบ่งงาน';

  renderAll();
}

// Add member
addMemberBtn.onclick = async () => {
  if(!currentProjectId) return alert('เลือกโปรเจกต์ก่อน');
  const p = state.projects.find(x => x._id === currentProjectId);

  const member = {
    name: memberName.value.trim(),
    skills: memberSkills.value.split(',').map(s => s.trim()).filter(Boolean),
    weakness: memberWeakness.value.split(',').map(s => s.trim()).filter(Boolean)
  };
  if(!member.name) return alert('ใส่ชื่อสมาชิก');

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
  const name = prompt('แก้ไขชื่อสมาชิก', m.name);
  if(name === null) return;
  const skills = prompt('แก้ไข skills (คั่นด้วย comma)', m.skills.join(','));
  const weakness = prompt('แก้ไข weakness (คั่นด้วย comma)', m.weakness.join(','));

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
let currentAISuggestion = ''; // เก็บ AI Plan ล่าสุด

generatePlanBtn.onclick = async () => {
  if(!currentProjectId) return alert('เลือกโปรเจกต์ก่อน');
  const p = state.projects.find(x => x._id === currentProjectId);

  if(!p.members || p.members.length === 0) {
    aiSuggestion.textContent = 'กรุณาเพิ่มสมาชิกก่อน';
    return;
  }

  aiSuggestion.textContent = 'กำลังสร้างแผนด้วย AI...';

  try{
    const resp = await fetch('http://localhost:3000/api/generate', {
      method:'POST',
      headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify({ prompt: buildPrompt(p) })
    });

    const json = await resp.json();

    if(json.plan){
      // แสดงใน div
      aiSuggestion.innerHTML = `<pre style="white-space: pre-wrap;">${escapeHtml(json.plan)}</pre>`;
      // เก็บ content เพื่อ Save
      currentAISuggestion = json.plan;
    } else {
      aiSuggestion.textContent = 'ไม่มีผลลัพธ์จาก AI';
      currentAISuggestion = '';
    }

  } catch(err){
    console.error(err);
    aiSuggestion.textContent = 'เกิดข้อผิดพลาด';
    currentAISuggestion = '';
  }
};

// ปุ่ม Save AI Suggestion
applyPlanBtn.onclick = async () => {
  if(!currentProjectId) return alert('เลือกโปรเจกต์ก่อน');
  if(!currentAISuggestion) return alert('ไม่มี AI Plan ให้บันทึก');

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
    alert('AI Plan ถูกบันทึกเรียบร้อย ✅');
  } catch(err){
    alert('เกิดข้อผิดพลาดในการบันทึกแผน: ' + err.message);
  }
};
  

function buildPrompt(project) {
  let s = `คุณคือผู้จัดการโปรเจกต์ AI ที่เชี่ยวชาญในการวางแผนและกระจายงาน\n\n`;
  s += `สร้างแผนการทำงานสำหรับโปรเจกต์:\nชื่อโปรเจกต์: ${project.name}\nรายละเอียด: ${project.desc || 'ไม่มีรายละเอียด'}\n\n`;
  s += `สมาชิกในทีม (${project.members.length} คน):\n`;
  project.members.forEach((m, index)=>{
    s += `${index + 1}. ${m.name}\n   จุดแข็ง: ${(m.skills||[]).join(', ') || 'ไม่ระบุ'}\n   จุดอ่อน: ${(m.weakness||[]).join(', ') || 'ไม่ระบุ'}\n\n`;
  });
  s += `สร้างแผนตามจุดแข็งและการเรียนรู้ของสมาชิก โดยตอบเป็นภาษาไทย\n`;
  return s;
}

// ======================
// Init
// ======================
document.addEventListener('DOMContentLoaded', fetchProjects);

// DOM refs สำหรับ icons
const projectIcon = document.getElementById('projectIcon');
const memberIcon = document.getElementById('memberIcon');
const planIcon = document.getElementById('planIcon');

// ฟังก์ชันสำหรับสลับไอคอน
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

// โค้ดเดิมสำหรับสลับธีม
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
  if (!confirm("ลบโปรเจกต์ทั้งหมดจริงหรือ?")) return;
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

// โหลดธีมจาก localStorage
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

// เปิด modal
function openPlanModal(plan){
  currentEditingPlan = plan;
  modalPlanEdit.value = plan.content;
  editPlanModal.style.display = 'block';
}

// Save plan จาก modal
modalSaveBtn.onclick = async () => {
  if(!currentEditingPlan) return;

  const updatedContent = modalPlanEdit.value.trim();
  if(!updatedContent) return alert('ไม่มีเนื้อหาให้บันทึก');

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

// ปิด modal เมื่อคลิก X
closeModal.onclick = () => {
  editPlanModal.style.display = 'none';
  currentEditingPlan = null;
};

// ปิด modal เมื่อคลิกนอก modal
window.onclick = e => {
  if(e.target === editPlanModal){
    editPlanModal.style.display = 'none';
    currentEditingPlan = null;
  }
};
