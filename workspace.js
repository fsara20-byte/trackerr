/* CFA Tracker workspace: switch views instead of anchor-scrolling. */
(function(){
"use strict";
const ROUTES={
 todayCommand:["today"],overview:["overview"],studyIntelligence:["overview"],revisionRoadmap:["overview"],
 sprintChecklist:["plan"],curriculum:["curriculum"],weightings:["curriculum"],
 mockExams:["practice","mockExams"],errorLog:["practice","errorLog"],history:["practice","history"],
 mifApplications:["applications","mifApplications"],resources:["applications","resources"],
 focus:["tools","focus"],plan:["tools","plan"],sync:["tools","sync"]
};
const DEFAULT={practice:"mockExams",applications:"mifApplications",tools:"focus"};
let ready=false;const selected={};
const $=id=>document.getElementById(id);
function makePane(root,id,title,desc){
 const el=document.createElement("section");el.className="workspace-pane";
 el.dataset.workspacePane=id;el.id="workspace-"+id;el.hidden=true;
 el.setAttribute("aria-label",title);
 if(id!=="today"){
  const head=document.createElement("header");head.className="workspace-heading";
  head.innerHTML='<span class="workspace-eyebrow">CFA LEVEL I / 2027</span><h2></h2><p></p>';
  head.querySelector("h2").textContent=title;head.querySelector("p").textContent=desc;el.appendChild(head);
 }
 root.appendChild(el);return el;
}
function makeSubTabs(pane,group,choices){
 const nav=document.createElement("nav");nav.className="workspace-subnav";nav.setAttribute("aria-label",group+" sections");pane.appendChild(nav);
 choices.forEach(([id,label,nodes])=>{
  const btn=document.createElement("button");btn.type="button";btn.className="workspace-subbtn";
  btn.dataset.workspaceSubtab=group+":"+id;btn.textContent=label;btn.setAttribute("aria-pressed","false");
  btn.addEventListener("click",()=>choose(group,id));nav.appendChild(btn);
  const body=document.createElement("div");body.className="workspace-subpane";body.dataset.workspaceSubpane=group+":"+id;body.hidden=true;
  pane.appendChild(body);(Array.isArray(nodes)?nodes:[nodes]).forEach(node=>{if(node)body.appendChild(node)});
  if(id==="plan")body.classList.add("workspace-journal");
 });
}
function chooseSub(group,id,hash){
 const actual=id||DEFAULT[group];
 document.querySelectorAll("[data-workspace-subpane]").forEach(el=>{if(el.dataset.workspaceSubpane.startsWith(group+":"))el.hidden=el.dataset.workspaceSubpane!==group+":"+actual});
 document.querySelectorAll("[data-workspace-subtab]").forEach(btn=>{
  if(!btn.dataset.workspaceSubtab.startsWith(group+":"))return;
  const active=btn.dataset.workspaceSubtab===group+":"+actual;
  btn.classList.toggle("active",active);btn.setAttribute("aria-pressed",String(active));
 });
 selected[group]=actual;
 const block=$(actual);
 if(block&&block.classList.contains("collapsed")&&typeof setSectionOpen==="function")setSectionOpen(actual,true);
 if(hash)history.replaceState(null,"","#view-"+group+"-"+actual);
}
function choose(view,sub,writeHash=true){
 if(!ready)return;
 if(!["today","overview","plan","curriculum","practice","applications","tools"].includes(view))view="today";
 document.querySelectorAll("[data-workspace-pane]").forEach(p=>p.hidden=p.dataset.workspacePane!==view);
 document.querySelectorAll("[data-workspace-tab]").forEach(btn=>{
  const active=btn.dataset.workspaceTab===view;
  btn.classList.toggle("active",active);btn.setAttribute("aria-selected",String(active));
 });
 let target=view;
 if(DEFAULT[view]){const id=sub||selected[view]||DEFAULT[view];chooseSub(view,id,false);target=view+"-"+id}
 if(writeHash)history.replaceState(null,"","#view-"+target);
 window.scrollTo(0,0);
}
window.workspaceNavigate=choose;
function buildNavigation(){
 const nav=document.querySelector(".top-nav");if(!nav)return;
 nav.className="workspace-nav";nav.setAttribute("role","tablist");nav.setAttribute("aria-label","Tracker views");
 const options=[["today","Today"],["overview","Overview"],["plan","Study plan"],["curriculum","Curriculum"],["practice","Practice"],["applications","Applications"],["tools","Tools"]];
 nav.replaceChildren();
 for(const [view,label] of options){
  const btn=document.createElement("button");btn.type="button";btn.className="workspace-navbtn";btn.dataset.workspaceTab=view;
  btn.setAttribute("role","tab");btn.setAttribute("aria-selected","false");btn.textContent=label;
  btn.addEventListener("click",()=>choose(view));nav.appendChild(btn);
 }
}
function buildWorkspace(){
 const wrap=document.querySelector("body > .wrap");
 if(!wrap||$("workspaceViews"))return;
 const overview=$("overview"),metrics=overview?.nextElementSibling;
 if(!metrics?.classList.contains("grid"))throw Error("Overview metrics grid missing");
 const log=$("plan"),logFields=log?.nextElementSibling,timer=$("focus"),timerHeading=timer?.previousElementSibling;
 if(!log||!logFields||!timer)throw Error("Tracker sections incomplete");
 const root=document.createElement("main");root.id="workspaceViews";wrap.prepend(root);
 const p={
  today:makePane(root,"today","Today",""),
  overview:makePane(root,"overview","Overview","Your syllabus, pace and readiness in one place"),
  plan:makePane(root,"plan","Study plan","Daily schedule from 3 November to 2 December"),
  curriculum:makePane(root,"curriculum","Curriculum","Modules, scores and review dates"),
  practice:makePane(root,"practice","Practice","Mocks, errors and study history"),
  applications:makePane(root,"applications","Applications","Programme deadlines and career resources"),
  tools:makePane(root,"tools","Tools","Timer, daily log and backups")
 };
 const move=(parent,...nodes)=>nodes.forEach(n=>{if(n)parent.appendChild(n)});
 move(p.today,$("todayCommand"));move(p.overview,overview,metrics,$("studyIntelligence"),$("revisionRoadmap"));
 move(p.plan,$("sprintChecklist"));move(p.curriculum,$("curriculum"));
 if(timerHeading?.classList.contains("section-heading"))timerHeading.remove();
 makeSubTabs(p.practice,"practice",[["mockExams","Mock exams",$("mockExams")],["errorLog","Error log",$("errorLog")],["history","Study history",$("history")]]);
 makeSubTabs(p.applications,"applications",[["mifApplications","MiF programmes",$("mifApplications")],["resources","Career links",$("resources")]]);
 makeSubTabs(p.tools,"tools",[["focus","Focus timer",timer],["plan","Daily log",[log,logFields]],["sync","Backup & sync",$("sync")]]);
 buildNavigation();
 ready=true;
 document.addEventListener("click",event=>{
  const link=event.target.closest('a[href^="#"]');if(!link)return;
  const id=decodeURIComponent(link.getAttribute("href").slice(1)),route=ROUTES[id];
  if(!route)return;
  event.preventDefault();choose(route[0],route[1]);
 });
 let hash=decodeURIComponent(location.hash.slice(1));
 if(ROUTES[hash])choose(...ROUTES[hash],false);
 else if(hash.startsWith("view-")){
  hash=hash.slice(5);const group=["practice","applications","tools"].find(g=>hash.startsWith(g+"-"));
  if(group)choose(group,hash.slice(group.length+1),false);
  else choose(hash,null,false);
 }else choose("today",null,false);
}
// These sections are already rendered by the dashboard's original script.
// Keep its localStorage keys and all existing module-completion handlers unchanged.
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",buildWorkspace,{once:true});
else buildWorkspace();
})();