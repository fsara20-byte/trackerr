/* CFA countdown experience — visual and presentation-only enhancement.
   Does not change curriculum data, exam dates, logging or module checkboxes. */
(function(){
  "use strict";
  const root=document.getElementById("examCountdown");
  if(!root)return;
  const $=id=>document.getElementById(id);
  const modes=new Set(["days","weeks","months"]);
  let mode="days";
  try{const saved=localStorage.getItem("cfaCountdownDisplayV1");if(modes.has(saved))mode=saved}catch(_){}
  const clockZone="Asia/Dubai";
  const formatDay=(date)=>{
    const parts=new Intl.DateTimeFormat("en-GB",{
      timeZone:clockZone,year:"numeric",month:"2-digit",day:"2-digit"
    }).formatToParts(date);
    const obj=Object.fromEntries(parts.filter(x=>x.type!=="literal").map(x=>[x.type,x.value]));
    return obj.year+"-"+obj.month+"-"+obj.day;
  };
  function remainingDays(dateString){
    if(!dateString)return 0;
    const end=new Date(dateString+"T00:00:00+04:00").getTime();
    if(!Number.isFinite(end))return 0;
    return Math.max(0,Math.ceil((end-Date.now())/86400000));
  }
  function remainingSyllabus(){
    const cutoff="2026-11-30",today=formatDay(new Date());
    const baseline=new Date(cutoff+"T00:00:00+04:00").getTime();
    const current=new Date(today+"T00:00:00+04:00").getTime();
    return Math.round((baseline-current)/86400000);
  }
  function setText(el,value){if(el&&el.textContent!==String(value))el.textContent=String(value)}
  function updateHeaderNext(){
    const node=$("headerNextModule");
    if(!node)return;
    try{
      if(typeof SPRINT_DAYS==="undefined" || typeof getM!=="function")return;
      const date=formatDay(new Date());
      const day=SPRINT_DAYS.find(d=>d.date===date);
      if(!day){setText(node,"Open today's checklist");return;}
      const next=day.modules.find(m=>!getM(m.topic,m.num-1).done);
      if(!next){setText(node,"All planned modules checked");return;}
      const labels={
        "Derivatives and Risk Management":"Derivatives",
        "Fixed Income":"Fixed Income",
        "Ethical and Professional Standards":"Ethics",
        "Quantitative Methods":"Quantitative Methods",
        "Corporate Finance":"Corporate Finance",
        "Financial Statement Analysis":"FSA",
        "Portfolio Construction":"Portfolio",
        "Alternative Investments":"Alternatives",
        "Economics":"Economics",
        "Equities":"Equity"
      };
      setText(node,(labels[next.topic]||next.topic)+" · Module "+next.num);
    }catch(_){setText(node,"Open today's checklist")}
  }
  function highlightNextTask(){
    let found=false;
    document.querySelectorAll("#commandTasks .today-task").forEach(node=>{
      const next=!found&&!node.classList.contains("complete");
      node.classList.toggle("is-next",next);
      if(next)found=true;
    });
  }
  function refresh(){
    const input=$("examDate"),dateString=input?.value||"2027-02-24";
    const remaining=remainingDays(dateString);
    const monthsText=parseInt($("countdownMonths")?.textContent,10);
    const remText=parseInt($("countdownDays")?.textContent,10);
    const months=Number.isFinite(monthsText)?Math.max(0,monthsText):0;
    const rem=Number.isFinite(remText)?Math.max(0,remText):0;
    let display=remaining,unit="DAYS TO YOUR EXAM";
    if(mode==="weeks"){display=(remaining/7).toFixed(1);unit="WEEKS TO YOUR EXAM";}
    if(mode==="months"){display=months;unit=rem?"MONTHS + "+rem+" DAYS":"MONTHS TO YOUR EXAM";}
    setText($("countdownHeroValue"),display);
    setText($("countdownHeroUnit"),remaining===0?"EXAM DAY ARRIVED":unit);
    const syllabus=remainingSyllabus();
    setText($("syllabusRemaining"),syllabus>0?syllabus:syllabus===0?"TODAY":Math.abs(syllabus));
    setText($("syllabusRemainingUnit"),syllabus>0?"DAYS TO FINISH SYLLABUS":syllabus===0?"SYLLABUS TARGET":"DAYS PAST TARGET");
    const urgent=$("syllabusFocus");
    if(urgent)urgent.classList.toggle("is-overdue",syllabus<0);
    updateHeaderNext();
    highlightNextTask();
  }
  function activate(next){
    if(!modes.has(next))return;
    mode=next;
    try{localStorage.setItem("cfaCountdownDisplayV1",mode)}catch(_){}
    document.querySelectorAll("[data-countdown-mode]").forEach(button=>{
      const on=button.dataset.countdownMode===mode;
      button.setAttribute("aria-pressed",String(on));
      button.classList.toggle("active",on);
    });
    refresh();
  }
  document.querySelectorAll("[data-countdown-mode]").forEach(button=>{
    button.addEventListener("click",()=>activate(button.dataset.countdownMode));
  });
  $("examDate")?.addEventListener("change",refresh);
  document.addEventListener("change",event=>{
    if(event.target?.matches?.('input[type="checkbox"]'))Promise.resolve().then(()=>{updateHeaderNext();highlightNextTask()});
  });
  activate(mode);
  // The original dashboard continues updating its countdown once per second.
  // This lightweight display refresh does not modify that existing clock.
  setInterval(refresh,30000);
})();