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
const planEdit = document.getElementById('planEdit');
const savePlanBtn = document.getElementById('savePlanBtn');

// ======================
// Fetch Projects from Backend
// ======================
async function fetchProjects() {
  try {
    const resp = await fetch('http://localhost:3000/api/projects');
    state.projects = await resp.json();
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
  if(!currentProjectId) {
    detailTitle.textContent='เลือกโปรเจกต์'; 
    detailDesc.textContent='ไม่มีโปรเจกต์ที่เลือก'; 
    membersCount.textContent='0 สมาชิก'; 
    membersList.innerHTML=''; 
    aiSuggestion.textContent='กด "Generate Plan (AI)" เพื่อให้ระบบแนะนำแผนแบ่งงาน';
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
      // update local state
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
    const view = el('button', {}, 'View');
    view.onclick = () => { planEdit.value = pl.content; };
    view.style.background='#446aff';
    const del = el('button', {}, 'Delete');
    del.classList.add('danger');
    del.onclick = () => {
      state.plans = state.plans.filter(x => x._id !== pl._id);
      renderAll();
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

function openProject(id) { currentProjectId = id; renderAll(); }

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

// Delete member
function deleteMember(memberId){
  const p = state.projects.find(x => x._id === currentProjectId);
  fetch(`http://localhost:3000/api/projects/${p._id}/members/${memberId}`, { method:'DELETE' })
    .then(r => r.json())
    .then(updatedProject => {
      state.projects = state.projects.map(x => x._id === updatedProject._id ? updatedProject : x);
      renderAll();
    })
    .catch(err => alert('Error deleting member: ' + err.message));
}

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
// AI Plan with Better Error Handling
// ======================
generatePlanBtn.onclick = async () => {
  if(!currentProjectId) return alert('เลือกโปรเจกต์ก่อน');
  const p = state.projects.find(x => x._id === currentProjectId);
  
  // Check if project has members
  if(!p.members || p.members.length === 0) {
    aiSuggestion.textContent = 'กรุณาเพิ่มสมาชิกในโปรเจกต์ก่อนสร้างแผน';
    return;
  }
  
  aiSuggestion.textContent = 'กำลังสร้างแผนด้วย AI... (อาจใช้เวลา 10-30 วินาที)';
  const prompt = buildPrompt(p);
  
  try {
    console.log('Sending AI request...');
    console.log('Prompt:', prompt);
    
    const resp = await fetch('http://localhost:3000/api/generate', {
      method:'POST', 
      headers:{ 
        'Content-Type':'application/json',
        'Accept': 'application/json'
      }, 
      body: JSON.stringify({prompt})
    });
    
    console.log('Response status:', resp.status);
    console.log('Response headers:', [...resp.headers.entries()]);
    
    const responseText = await resp.text();
    console.log('Raw response:', responseText);
    
    if (!resp.ok) {
      let errorMessage = `HTTP ${resp.status}`;
      try {
        const errorJson = JSON.parse(responseText);
        errorMessage = errorJson.error || errorMessage;
        console.log('Error details:', errorJson);
      } catch (e) {
        console.log('Could not parse error as JSON');
      }
      throw new Error(errorMessage);
    }
    
    const json = JSON.parse(responseText);
    
    if (json.plan) {
      aiSuggestion.innerHTML = `<div style="white-space: pre-wrap; font-family: inherit;">${escapeHtml(json.plan)}</div>`;
    } else {
      aiSuggestion.textContent = 'ไม่มีผลลัพธ์จาก AI';
    }
    
  } catch (error) {
    console.error('AI generation error:', error);
    
    // More detailed error messages
    let errorMsg = 'เกิดข้อผิดพลาดในการสร้างแผน: ';
    
    if (error.message.includes('Failed to fetch')) {
      errorMsg += 'ไม่สามารถเชื่อมต่อกับ server ได้ (ตรวจสอบว่า backend server กำลังทำงานอยู่)';
    } else if (error.message.includes('quota')) {
      errorMsg += 'API quota หมด - ตรวจสอบ billing';
    } else if (error.message.includes('API key')) {
      errorMsg += 'API key ไม่ถูกต้อง';
    } else {
      errorMsg += error.message;
    }
    
    aiSuggestion.innerHTML = `<div style="color: #ff6b6b; padding: 10px; background: rgba(255,107,107,0.1); border-radius: 4px;">${errorMsg}</div>`;
  }
};

// Enhanced prompt building with better formatting
function buildPrompt(project) {
  let s = `สร้างแผนการทำงานสำหรับโปรเจกต์:\n\n`;
  s += `ชื่อโปรเจกต์: ${project.name}\n`;
  s += `รายละเอียด: ${project.desc || 'ไม่มีรายละเอียดเพิ่มเติม'}\n\n`;
  s += `สมาชิกในทีม (${project.members.length} คน):\n`;

  project.members.forEach((m, index) => {
    s += `${index + 1}. ${m.name}\n`;
    s += `   จุดแข็ง: ${(m.skills && m.skills.length > 0) ? m.skills.join(', ') : 'ไม่ระบุ'}\n`;
    s += `   จุดอ่อน: ${(m.weakness && m.weakness.length > 0) ? m.weakness.join(', ') : 'ไม่ระบุ'}\n\n`;
  });

  s += `กรุณาสร้างแผนการทำงานที่:\n`;
  s += `1. แบ่งหน้าที่ให้แต่ละคนตามจุดแข็ง\n`;
  s += `2. หลีกเลี่ยงงานที่ตรงกับจุดอ่อนของแต่ละคน\n`;
  s += `3. มีไทม์ไลน์ชัดเจน จำนวนขั้นตอนตามความเหมาะสม\n`;
  s += `4. อธิบายเหตุผลในการแบ่งงาน\n`;
  s += `5. ตอบเป็นภาษาไทย\n\n`;
  s += `รูปแบบที่ต้องการ:\n`;
  s += `- การแบ่งหน้าที่แต่ละคน\n`;
  s += `- ไทม์ไลน์การทำงาน (อธิบายเป็นขั้นตอน)\n`;
  s += `- ตารางแผนการทำงานในรูปแบบ CSV โดยใช้จุลภาค (,) คั่นและบรรทัดแรกเป็น Header คือ: Phase,ชื่องาน,ผู้รับผิดชอบ,วันเริ่มต้น,วันสิ้นสุด,สถานะ\n`;
  s += `- ข้อแนะนำเพิ่มเติม`;

  return s;
}

function mockGeneratePlan(project){
  const members = project.members||[];
  if(members.length===0) return 'ไม่มีสมาชิกในโปรเจกต์ — กรุณาเพิ่มสมาชิกก่อน';
  let out = `AI Plan for ${project.name}\n\n`;
  members.forEach(m=>{
    out += `- ${m.name}: General tasks / help where needed\n`;
  });
  out += '\nTimeline:\n1) Setup\n2) Implementation\n3) Test & Deploy\n';
  return out;
}

// ======================
// Plans CRUD
// ======================
savePlanBtn.onclick = () => {
  const content = planEdit.value.trim();
  if(!content) return alert('ไม่มีเนื้อหาให้บันทึก');
  const title = prompt('ตั้งชื่อแผน (title)') || ('Plan ' + new Date().toLocaleString());
  state.plans.push({id: uid('plan'), title, content, createdAt: Date.now()});
  renderAll();
};

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

  // เปลี่ยนไอคอนปุ่ม
  toggleBtn.textContent = isLightMode ? "☀️" : "🌙";

  // เรียกฟังก์ชันเปลี่ยนไอคอนรูปภาพ
  updateIcons(isLightMode);

  // (เสริม) เก็บค่าลง localStorage
  localStorage.setItem("theme", isLightMode ? "light" : "dark");
});

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


// โหลดค่าธีมจาก localStorage
window.addEventListener("DOMContentLoaded", () => {
  const savedTheme = localStorage.getItem("theme");
  const isLightMode = savedTheme === "light";

  if (isLightMode) {
    document.body.classList.add("light-mode");
    toggleBtn.textContent = "☀️";
  }

  // เรียกฟังก์ชันเปลี่ยนไอคอนเมื่อหน้าเว็บโหลด
  updateIcons(isLightMode);
});