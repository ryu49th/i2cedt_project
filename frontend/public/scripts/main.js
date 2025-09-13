// TaskWeaver Frontend Logic (CRUD + Mock AI)
const StorageKey = 'taskweaver_data_v1';

function loadData(){
  const raw = localStorage.getItem(StorageKey);
  if(!raw) return {projects:[], plans:[]};
  try{ return JSON.parse(raw);}catch(e){return {projects:[], plans:[]}}; 
}
function saveData(d){ localStorage.setItem(StorageKey, JSON.stringify(d)); }

let state = loadData();
let currentProjectId = null;

// Utils
function uid(prefix='id'){return prefix + '_' + Math.random().toString(36).slice(2,9)}
function el(tag,attrs={},inner=''){const e=document.createElement(tag);for(const k in attrs) e.setAttribute(k,attrs[k]);if(inner) e.innerHTML=inner;return e}
function escapeHtml(s){ if(!s) return ''; return s.replace(/[&<>\"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

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
const applyPlanBtn = document.getElementById('applyPlanBtn');

// Renderers
function renderProjects(){
  projectsList.innerHTML='';
  state.projects.forEach(p=>{
    const wrap = el('div',{class:'item'});
    const left = el('div');
    left.innerHTML = `<div style="font-weight:600">${escapeHtml(p.name)}</div><div class='muted small'>${escapeHtml(p.desc||'')}</div>`;
    const right = el('div',{class:'actions'});
    const open = el('button',{},'Open'); 
    open.style.background='#446aff'; 
    open.onclick=()=>{ openProject(p.id)}
    const del = el('button',{},'Delete'); 
    del.classList.add('danger');
    del.onclick=()=>{ if(confirm('ลบโปรเจกต์?')){ state.projects = state.projects.filter(x=>x.id!==p.id); if(currentProjectId===p.id) currentProjectId=null; saveData(state); renderAll(); }}
    right.appendChild(open); right.appendChild(del);
    wrap.appendChild(left); wrap.appendChild(right);
    projectsList.appendChild(wrap);
  });
}

function renderProjectDetail(){
  if(!currentProjectId){ 
    detailTitle.textContent='เลือกโปรเจกต์'; 
    detailDesc.textContent='ไม่มีโปรเจกต์ที่เลือก'; 
    membersCount.textContent='0 สมาชิก'; 
    membersList.innerHTML=''; 
    aiSuggestion.textContent='กด "Generate Plan (AI)" เพื่อให้ระบบแนะนำแผนแบ่งงาน'; 
    return; 
  }
  const p = state.projects.find(x=>x.id===currentProjectId);
  if(!p) return;
  detailTitle.textContent = p.name;
  detailDesc.textContent = p.desc || '';
  membersCount.textContent = (p.members||[]).length + ' สมาชิก';

  membersList.innerHTML='';
  (p.members||[]).forEach(m=>{
    const row = el('div',{class:'item'});
    const left = el('div',{class:'member-row'});
    left.innerHTML = `<div style='font-weight:600'>${escapeHtml(m.name)}</div><div class='muted small' style='margin-left:8px'>${escapeHtml((m.skills||[]).join(', '))}</div>`;
    const right = el('div',{class:'actions'});
    const edit = el('button',{},'Edit'); 
    edit.onclick=()=>{ editMember(m.id)}
    edit.style.background='#446aff'; 
    const del = el('button',{},'Remove'); 
    del.classList.add('danger');
    del.onclick=()=>{ if(confirm('ลบสมาชิก?')){ p.members = p.members.filter(x=>x.id!==m.id); saveData(state); renderAll(); }}
    right.appendChild(edit); right.appendChild(del);
    row.appendChild(left); row.appendChild(right);
    membersList.appendChild(row);
  });
}

function renderPlans(){
  plansList.innerHTML='';
  state.plans.forEach(pl=>{
    const row = el('div',{class:'item'});
    row.innerHTML = `<div><div style='font-weight:600'>${escapeHtml(pl.title)}</div><div class='muted small'>${new Date(pl.createdAt).toLocaleString()}</div></div>`;
    const right = el('div',{class:'actions'});
    const view = el('button',{},'View'); 
    view.onclick=()=>{ planEdit.value = pl.content; }
    view.style.background='#446aff';
    const del = el('button',{},'Delete'); 
    del.classList.add('danger');
    del.onclick=()=>{ if(confirm('ลบแผน?')){ state.plans = state.plans.filter(x=>x.id!==pl.id); saveData(state); renderAll(); }}
    right.appendChild(view); right.appendChild(del);
    row.appendChild(right);
    plansList.appendChild(row);
  });
}

function renderAll(){ renderProjects(); renderProjectDetail(); renderPlans(); }

// Actions
createProjectBtn.onclick = ()=>{
  const name = projectsName.value.trim();
  if(!name) return alert('กรุณาใส่ชื่อโปรเจกต์');
  const p = { id: uid('proj'), name, desc: projectsDesc.value.trim(), members: [], planId: null };
  state.projects.push(p); saveData(state); projectsName.value=''; projectsDesc.value=''; renderAll();
}

clearStorageBtn.onclick = ()=>{
  if(confirm('ลบข้อมูลทั้งหมดใน LocalStorage?')){ localStorage.removeItem(StorageKey); state = {projects:[],plans:[]}; currentProjectId = null; renderAll(); }
}

function openProject(id){ currentProjectId = id; renderAll(); }

addMemberBtn.onclick = ()=>{
  if(!currentProjectId) return alert('เลือกโปรเจกต์ก่อน');
  const p = state.projects.find(x=>x.id===currentProjectId);
  const name = memberName.value.trim(); if(!name) return alert('ใส่ชื่อสมาชิก');
  const skills = memberSkills.value.split(',').map(s=>s.trim()).filter(Boolean);
  const weakness = memberWeakness.value.split(',').map(s=>s.trim()).filter(Boolean);
  p.members.push({id: uid('m'), name, skills, weakness});
  memberName.value=''; memberSkills.value=''; memberWeakness.value=''; saveData(state); renderAll();
}

function editMember(mid){
  const p = state.projects.find(x=>x.id===currentProjectId);
  const m = p.members.find(x=>x.id===mid);
  const n = prompt('แก้ไขชื่อสมาชิก', m.name); if(n===null) return;
  m.name = n.trim() || m.name;
  const sk = prompt('แก้ไข skills (คั่นด้วย comma)', m.skills.join(', ')); if(sk!==null) m.skills = sk.split(',').map(s=>s.trim()).filter(Boolean);
  const wk = prompt('แก้ไข weakness (คั่นด้วย comma)', m.weakness.join(', ')); if(wk!==null) m.weakness = wk.split(',').map(s=>s.trim()).filter(Boolean);
  saveData(state); renderAll();
}

// AI integration
generatePlanBtn.onclick = async ()=>{
  if(!currentProjectId) return alert('เลือกโปรเจกต์ก่อน');
  const p = state.projects.find(x=>x.id===currentProjectId);
  aiSuggestion.textContent = 'กำลังสร้างแผน...';
  const prompt = buildPrompt(p);
  try{
    const resp = await fetch('/api/generate',{method:'POST',headers:{'content-type':'application/json'},body: JSON.stringify({prompt})});
    if(!resp.ok) throw new Error('no backend');
    const json = await resp.json();
    aiSuggestion.textContent = json.plan || json.text || 'ไม่มีผลลัพธ์จาก API';
  }catch(err){
    aiSuggestion.textContent = mockGeneratePlan(p);
  }
}

function buildPrompt(project){
  let s = `Project: ${project.name}\nDescription: ${project.desc || ''}\nMembers:\n`;
  (project.members||[]).forEach(m=>{
    s += `- ${m.name}: skills=${(m.skills||[]).join(',')}; weaknesses=${(m.weakness||[]).join(',')}\n`;
  });
  s += '\nInstructions: Suggest a clear division of tasks for each member, give short reasons, and list the things each person should focus on or avoid. Provide a simple 3-step timeline.';
  return s;
}

function mockGeneratePlan(project){
  const members = project.members||[];
  if(members.length===0) return 'ไม่มีสมาชิกในโปรเจกต์ — กรุณาเพิ่มสมาชิกก่อน';
  const roles = [];
  members.forEach(m=>{
    const s = (m.skills||[]).map(x=>x.toLowerCase());
    let assigned = [];
    if(s.some(x=>['frontend','ui','ux','html','css','javascript','react'].includes(x))) assigned.push('Frontend & UI');
    if(s.some(x=>['backend','api','node','express','python','java','go'].includes(x))) assigned.push('Backend & API');
    if(s.some(x=>['db','database','sql','mongodb','postgres'].includes(x))) assigned.push('Database');
    if(s.some(x=>['doc','documentation','writer','tester','qa'].includes(x))) assigned.push('Documentation & Testing');
    if(assigned.length===0) assigned.push('General tasks / help where needed');
    roles.push({name:m.name, assigned, reason:`มุ่งเน้นที่: ${assigned.join(', ')}${m.weakness && m.weakness.length? '; หลีกเลี่ยง: '+m.weakness.join(', '):''}`});
  });

  let out = `AI Plan for ${project.name}\n\n`;
  roles.forEach(r=>{
    out += `- ${r.name}: ${r.assigned.join(', ')}\n    Reason: ${r.reason}\n`;
  });
  out += '\nTimeline (3 steps):\n1) Setup: define requirements, repo, skeleton\n2) Implementation: build core features\n3) Test & Document: QA, deploy\n';
  return out;
}

// Plans CRUD
savePlanBtn.onclick = ()=>{
  const content = planEdit.value.trim();
  if(!content) return alert('ไม่มีเนื้อหาให้บันทึก');
  const title = prompt('ตั้งชื่อแผน (title)') || ('Plan ' + new Date().toLocaleString());
  state.plans.push({id: uid('plan'), title, content, createdAt: Date.now()});
  saveData(state); renderAll(); planEdit
}

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