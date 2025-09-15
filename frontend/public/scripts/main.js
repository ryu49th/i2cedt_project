// TaskWeaver Frontend LogiCRUD + AI)

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
  if (!currentProjectId) {
    detailTitle.textContent = 'เลือกโปรเจกต์'; 
    detailDesc.textContent = 'ไม่มีโปรเจกต์ที่เลือก'; 
    membersCount.textContent = '0 สมาชิก'; 
    membersList.innerHTML = ''; 
    aiSuggestion.textContent = 'กด "Generate Plan (AI)" เพื่อให้ระบบแนะนำแผนแบ่งงาน';
    planEdit.value = ''; // reset plan editor
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
    del.onclick = async () => {
    try {
      const resp = await fetch(`http://localhost:3000/api/plans/${pl._id}`, { method: 'DELETE' });
      if (!resp.ok) throw new Error('Failed to delete plan');
      state.plans = state.plans.filter(x => x._id !== pl._id);
      renderAll();
    } 
    catch (err) {
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

  // Reset AI suggestion + Plan editor
  aiSuggestion.textContent = 'กด "Generate Plan (AI)" เพื่อให้ระบบแนะนำแผนแบ่งงาน';
  planEdit.value = '';

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
  // --- ส่วนที่เพิ่มเข้ามา ---
  // 1. กำหนดบทบาทให้ AI เป็นผู้จัดการที่เน้นการพัฒนาทีม
  let s = `คุณคือผู้จัดการโปรเจกต์ AI ที่มีความเชี่ยวชาญในการวางแผนและกระจายงาน โดยมีเป้าหมายสูงสุดคือการพัฒนาศักยภาพของสมาชิกในทีมควบคู่ไปกับความสำเร็จของโปรเจกต์\n\n`;

  s += `สร้างแผนการทำงานสำหรับโปรเจกต์:\n\n`;
  s += `ชื่อโปรเจกต์: ${project.name}\n`;
  s += `รายละเอียด: ${project.desc || 'ไม่มีรายละเอียดเพิ่มเติม'}\n\n`;
  s += `สมาชิกในทีม (${project.members.length} คน):\n`;

  project.members.forEach((m, index) => {
    s += `${index + 1}. ${m.name}\n`;
    s += `   จุดแข็ง: ${(m.skills && m.skills.length > 0) ? m.skills.join(', ') : 'ไม่ระบุ'}\n`;
    s += `   จุดอ่อน: ${(m.weakness && m.weakness.length > 0) ? m.weakness.join(', ') : 'ไม่ระบุ'}\n\n`;
  });

  // --- ส่วนที่ปรับปรุงใหม่ ---
  // 2. กำหนดเป้าหมายหลักให้ชัดเจน เน้นการเรียนรู้และช่วยเหลือกัน
  s += `**เป้าหมายหลักในการสร้างแผน:**\n`;
  s += `1.  **กระจายงานตามความถนัด:** มอบหมายงานหลักให้ตรงตามจุดแข็งของแต่ละคน เพื่อให้โปรเจกต์เดินหน้าได้อย่างมีประสิทธิภาพ\n`;
  s += `2.  **ส่งเสริมการเรียนรู้และพัฒนา:** สำหรับงานที่จำเป็นแต่ไม่มีใครถนัด หรือตรงกับจุดอ่อนของสมาชิก ให้สร้างโอกาสในการเรียนรู้โดย:\n`;
  s += `    -   **จับคู่ (Pairing):** ให้คนที่มีทักษะใกล้เคียงที่สุดรับหน้าที่เป็น **พี่เลี้ยง (Mentor)** คอยแนะนำและตรวจสอบ และให้คนที่ต้องการพัฒนาหรือมีจุดอ่อนในเรื่องนั้นเป็น **ผู้เรียนรู้ (Mentee)** ทำงานร่วมกัน\n`;
  s += `    -   หากไม่มีใครมีทักษะเลย ให้มอบหมาย 2-3 คนช่วยกันศึกษาและรับผิดชอบร่วมกัน\n`;
  s += `3.  **เน้นการทำงานร่วมกัน:** ออกแบบให้มีการช่วยเหลือและตรวจสอบความคืบหน้าระหว่างทีมอยู่เสมอ\n\n`;

  s += `กรุณาสร้างแผนการทำงานที่ครอบคลุมตามเป้าหมายข้างต้น โดยตอบเป็นภาษาไทยทั้งหมด ในรูปแบบที่ต้องการดังนี้:\n\n`;
  s += `**1. การแบ่งหน้าที่และความรับผิดชอบ:**\n`;
  s += `- อธิบายว่าใครรับผิดชอบงานหลักส่วนไหน เพราะเหตุใด (อ้างอิงจากจุดแข็ง)\n`;
  s += `- ระบุงานที่ต้องมีการเรียนรู้ พร้อมกำหนดว่าใครคือ "พี่เลี้ยง" และใครคือ "ผู้เรียนรู้" ในงานนั้นๆ\n\n`;

  s += `**2. ไทม์ไลน์การทำงาน (Timeline):**\n`;
  s += `- แบ่งโปรเจกต์เป็นเฟส (Phase) ที่ชัดเจน และอธิบายขั้นตอนการทำงานในแต่ละเฟส\n\n`;

  // 3. เพิ่มคอลัมน์ "ผู้เรียนรู้/ผู้ช่วย" เพื่อให้แผนงานชัดเจนขึ้น
  s += `**3. ตารางแผนการทำงาน (CSV Format):**\n`;
  s += `(ใช้จุลภาค "," คั่น และบรรทัดแรกเป็น Header)\n`;
  s += `Phase,ชื่องาน,ผู้รับผิดชอบหลัก,ผู้เรียนรู้/ผู้ช่วย,วันเริ่มต้น,วันสิ้นสุด,สถานะ\n\n`;

  s += `**4. ข้อแนะนำเพิ่มเติม:**\n`;
  s += `- ให้คำแนะนำในการสื่อสารและการทำงานร่วมกัน เพื่อสนับสนุนบรรยากาศแห่งการเรียนรู้และช่วยเหลือกันให้โปรเจกต์สำเร็จลุล่วง\n`;

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
savePlanBtn.onclick = async () => {
  if(!currentProjectId) return alert("เลือกโปรเจกต์ก่อน");

  const content = planEdit.value.trim();
  if(!content) return alert("ไม่มีเนื้อหาให้บันทึก");

  const title = prompt("ตั้งชื่อแผน (title)") || ("Plan " + new Date().toLocaleString());

  try {
    const resp = await fetch("http://localhost:3000/api/plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        content,
        projectId: currentProjectId
      })
    });
    const newPlan = await resp.json();
    state.plans.push(newPlan);
    renderAll();
  } catch (err) {
    alert("Error saving plan: " + err.message);
  }
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

applyPlanBtn.onclick = async () => {
  if (!currentProjectId) return alert('เลือกโปรเจกต์ก่อน');
  const p = state.projects.find(x => x._id === currentProjectId);
  if (!p) return;

  const planContent = aiSuggestion.textContent;
  if (!planContent || planContent.startsWith('กำลังสร้าง')) {
    return alert('ไม่มีแผนให้บันทึก');
  }

  const title = `AI Plan for ${p.name} - ${new Date().toLocaleString()}`;

  try {
    const resp = await fetch("http://localhost:3000/api/plans", {
      method: "POST",
      headers: { "Content-Type":"application/json" },
      body: JSON.stringify({
        title,
        content: planContent,
        projectId: p._id
      })
    });

    const newPlan = await resp.json();
    if (!resp.ok) throw new Error(newPlan.error || 'Failed to save plan');

    state.plans.push(newPlan);
    renderPlans();
    alert('แผนงานถูกบันทึกเรียบร้อย ✅');
  } catch (err) {
    console.error(err);
    alert('เกิดข้อผิดพลาดในการบันทึกแผนงาน');
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