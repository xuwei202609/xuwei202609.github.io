'use strict';
(() => {
 const M=window.BelongState,KEY='belong-learning-v5';
 const screens=[...document.querySelectorAll('.screen[data-screen]')];
 const byId=new Map(screens.map(s=>[s.dataset.screen,s]));
 const originals=new Map(screens.map(s=>[s.dataset.screen,s.innerHTML]));
 const chapterInfo=[{title:'Basic DEI',upper:'BASIC DEI',file:'video.mp4'},{title:'Cultural Diversity',upper:'CULTURAL DIVERSITY',file:'diversity.mp4'},{title:'Unconscious Bias & Anti-Discrimination',upper:'UNCONSCIOUS BIAS & ANTI-DISCRIMINATION',file:'anti.mp4'},{title:'Role play',upper:'ROLE PLAY',file:'role.mp4'}];
 for(let i=0;i<4;i++)chapterInfo[i].routes=Object.fromEntries(screens.filter(s=>Number(s.dataset.chapter)===i&&s.hasAttribute('data-chapter')).map(s=>[s.dataset.view,s.dataset.screen]));
 const routeInfo=new Map(screens.filter(s=>s.hasAttribute('data-chapter')).map(s=>[s.dataset.screen,{chapter:Number(s.dataset.chapter),view:s.dataset.view}]));
 chapterInfo[3].routes={intro:'16:509',start:'role-video',playing:'role-video',done:'role-video',error:'role-video-error'};
 const staticIds=new Set(['13:2','13:35','chapter-2','chapter-3','14:17','14:31','14:45','14:59']);
 let state;try{state=M.restore(JSON.parse(localStorage.getItem(KEY)||localStorage.getItem('belong-learning-v4')||localStorage.getItem('belong-learning-v3')||'null'));}catch{state=M.fresh();}
 if(!byId.has(state.resume))state.resume=M.videosDone(state)?'13:2':'14:73';
 if(!byId.has(state.pendingSaveRoute))state.pendingSaveRoute=null;
 let current=null,renderedHash='',retryRoute=state.pendingSaveRoute;
 let reflectionSending = false;
 const parking=document.createElement('div');parking.hidden=true;document.body.append(parking);
 const clocks=chapterInfo.map(()=>({lastTime:0,lastTick:performance.now(),lastSave:0}));
 const players=chapterInfo.map(info=>{const v=document.createElement('video');v.className='learning-video';v.controls=true;v.preload='metadata';v.playsInline=true;v.setAttribute('aria-label',info.title+' learning video');v.setAttribute('controlsList','nodownload');parking.append(v);return v;});
 const text=(s,id,value)=>{const n=s.querySelector('[data-node-id="'+id+'"]');if(n)n.textContent=value;};
 const label=n=>n.textContent.trim();
 const time=n=>{const seconds=Math.max(0,Math.floor(Number(n)||0));return String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0');};
 const active=id=>['start','playing','error'].includes(routeInfo.get(id)?.view);
 const roleLocked=()=>state.roleStarted&&M.videosDone(state)&&!state.chapters[3].completed;
 function persist(){try{localStorage.setItem(KEY,JSON.stringify(state));return true;}catch{return false;}}
 function capture(i){const v=players[i],r=state.chapters[i];if(!v.hasAttribute('src')||!Number.isFinite(v.duration))return;r.duration=v.duration;r.time=Math.min(v.currentTime,r.completed?v.duration:r.watched);}
 function captureAll(){players.forEach((v,i)=>{capture(i);v.pause();});}
 function stageResume(){if(M.complete(state))return '13:2';if(M.videosDone(state))return state.roleStarted?'role-video':'13:2';const i=state.chapters.slice(0,3).findIndex(v=>!v.completed);return chapterInfo[i].routes[state.chapters[i].time>0?'playing':'start'];}
 function storedResume(){if(M.complete(state))return '13:2';if(roleLocked())return 'role-video';const info=routeInfo.get(state.resume);return byId.has(state.resume)&&(!info||M.unlocked(state,info.chapter))&&!['14:144','14:160'].includes(state.resume)?state.resume:stageResume();}
 function guard(id){
  if(state.pendingSaveRoute&&id!=='14:160')return '14:160';
  if(roleLocked()&&!['role-video','role-video-error','14:160'].includes(id))return 'role-video';
  if(!byId.has(id))return '13:2';
  const info=routeInfo.get(id);
  if(info){if(!M.unlocked(state,info.chapter))return '13:2';if(info.chapter===3&&M.complete(state))return '13:2';if(info.view==='done'&&!state.chapters[info.chapter].completed)return chapterInfo[info.chapter].routes[state.chapters[info.chapter].time>0?'playing':'start'];}
  return id;
 }
 function home(s){for(let i=1;i<3;i++){const card=s.querySelectorAll('.course-card')[i],button=card.querySelector('button'),unlocked=M.unlocked(state,i);card.querySelector(':scope > p').textContent=unlocked?'Available now':i===1?'Unlock after completing Chapter 1':'Unlock after completing Chapter 1 & 2';button.disabled=!unlocked;button.setAttribute('aria-disabled',String(!unlocked));button.querySelector('p').textContent=unlocked?'Start learning':'Wait to unlock';button.dataset.target=chapterInfo[i].routes.intro;}
  const gateway=s.querySelector('.home-role-gateway'),enabled=M.videosDone(state)&&!M.complete(state);gateway.disabled=!enabled;gateway.setAttribute('aria-disabled',String(!enabled));gateway.classList.toggle('is-unlocked',enabled);gateway.setAttribute('aria-label',enabled?'Click here to role play':M.complete(state)?'Learning completed':'Role play is available after all three chapters');gateway.querySelector('.role-gateway-label').hidden=!enabled;
  if(M.complete(state)){const copy=s.querySelector('.n-13-13');copy.classList.add('learning-completed');copy.replaceChildren();for(const [i,line]of ['Congratulations on completing your learning!','Please return to qualtrics to complete the survey!'].entries()){const n=document.createElement(i===0?'h1':'p');n.className='completion-message';n.textContent=line;copy.append(n);}}
 }
 function videoText(){const info=routeInfo.get(current);if(!info||!['start','playing','done'].includes(info.view))return;const s=byId.get(current),v=players[info.chapter],r=state.chapters[info.chapter];const duration=Number.isFinite(v.duration)?v.duration:r.duration;const clock=time(v.hasAttribute('src')?v.currentTime:r.time)+' / '+(duration>0?time(duration):'Loading…');if(info.chapter===3){text(s,'14:121',r.completed?'Video completed · '+time(duration)+' / '+time(duration)+'\nEnter the answer in the blank space below.':'Role play · Learning video\n'+clock+'\nFirst viewing: pause and revisit watched sections. Unwatched sections cannot be skipped.');return;}if(info.view==='start')text(s,'14:83',chapterInfo[info.chapter].title+' · Learning video\n'+clock+'\nFirst viewing: pause and revisit watched sections. Unwatched sections cannot be skipped.');if(info.view==='playing')text(s,'14:100',clock+'\nVideo pauses when you leave this page. Your watched progress is retained.');if(info.view==='done')text(s,'14:121','Video completed · '+time(duration)+' / '+time(duration)+'\n'+(info.chapter<2?'You can now move to Chapter '+(info.chapter+2)+'.':'You can now continue to role play.'));}
 function prepareReflection(){const s=byId.get(current);if(current!=='role-video')return;const form=s.querySelector('[data-reflection-form]'),complete=state.chapters[3].completed;form.hidden=!complete;const field=form.querySelector('textarea'),button=form.querySelector('button');const randomId=form.querySelector("#role-random-id");randomId.value=state.roleRandomId;field.value=state.roleDraft;randomId.readOnly=field.readOnly=state.roleSubmitted||reflectionSending;button.disabled=!complete||!state.roleDraft.trim()||!state.roleRandomId.trim()||state.roleSubmitted||reflectionSending;s.querySelector('[data-role-play]').hidden=complete;}
 async function submitReflection() {
  if (current !== 'role-video' || reflectionSending || !M.videosDone(state) || !state.chapters[3].completed || !state.roleDraft.trim() || !state.roleRandomId.trim() || state.roleSubmitted) return;
  captureAll();
  const answer = state.roleDraft.trim();
  reflectionSending = true;
  prepareReflection();
  const status = byId.get('role-video').querySelector('[role="status"]');
  status.textContent = 'Saving your answer…';
  try {
   if (!window.BelongReflections) throw Error('Answer collection could not load. Please refresh and retry.');
   await window.BelongReflections.submit(answer, state.roleRandomId);
   state.roleAnswer = answer;
   state.roleSubmitted = true;
   state.resume = '13:2';
   state.pendingSaveRoute = '13:2';
   retryRoute = '13:2';
   if (!persist()) { render('14:160'); return; }
   state.pendingSaveRoute = null;
   if (!persist()) { state.pendingSaveRoute = '13:2'; render('14:160'); return; }
   if (current === 'role-video') {
    byId.get(current).querySelector('[role="status"]').textContent = 'Successful submission!';
    setTimeout(() => { if (current === 'role-video') go('13:2'); }, 1600);
   }
  } catch (error) {
   if (current === 'role-video') byId.get(current).querySelector('[role="status"]').textContent = error.message || 'Your answer could not be saved. Please retry.';
  } finally {
   reflectionSending = false;
   prepareReflection();
  }
 }
 document.addEventListener('submit',event=>{if(event.target.matches('[data-reflection-form]')){event.preventDefault();submitReflection();}});
 function measureIntro(){const s=byId.get(current);if(s?.dataset.view!=='intro'||Number(s.dataset.chapter)===3)return;const column=s.querySelector('.n-13-47'),image=s.querySelector('.n-13-46');if(column&&image&&column.getBoundingClientRect().height>0)image.style.setProperty('--intro-height',column.getBoundingClientRect().height+'px');}
 const resize=new ResizeObserver(measureIntro);screens.filter(s=>s.dataset.view==='intro'&&s.querySelector('.n-13-47')).forEach(s=>resize.observe(s.querySelector('.n-13-47')));document.fonts.ready.then(measureIntro);
 function render(id,replace=false){
  captureAll();players.forEach(v=>parking.append(v));current=id;if(id==='role-video')state.roleStarted=true;const s=byId.get(id);s.innerHTML=originals.get(id);screens.forEach(n=>n.hidden=n!==s);
  renderedHash='#'+id;if(location.hash!==renderedHash)history[replace?'replaceState':'pushState'](null,'',renderedHash);
  document.documentElement.dataset.screen=id;document.title='BELONG — '+s.dataset.title.split(' · ').slice(1).join(' · ');
  for(const n of s.querySelector('nav').children){const destination=({'B E L O N G':'13:2',Courses:'13:2',Achievements:'14:31','AI Companion':'14:45','My Learning':'14:59'})[label(n)];if(destination){n.dataset.nav=destination;n.setAttribute('role','link');n.tabIndex=0;n.style.cursor='pointer';if(roleLocked()){n.setAttribute('aria-disabled','true');n.tabIndex=-1;n.style.cursor='not-allowed';}}}
  if(id==='13:2')home(s);
  if(id==='14:59')text(s,'14:69',state.chapters.slice(0,3).map((r,i)=>'Chapter '+(i+1)+': '+chapterInfo[i].title+' · '+(r.completed?'Completed':M.unlocked(state,i)?(r.time>0?'In progress · '+time(r.time):'Available now'):'Locked')).join('\n')+'\nRole play: '+(M.complete(state)?'Completed':state.chapters[3].completed?'Video completed · Write your thoughts':M.videosDone(state)?'Available now':'Locked')+'\nResume your saved stage. Your video progress is retained.');
  if(id==='14:31'&&M.complete(state))text(s,'14:41','Course completed · Three chapters watched\nRole play video watched · Reflection submitted');
  const info=routeInfo.get(id);
  if(info){state.activeChapter=info.chapter;if(['start','playing','done'].includes(info.view)){const v=players[info.chapter],panel=s.querySelector('[data-video-panel]')||[...s.querySelector('main').children].find(n=>n.querySelector('h2')?.textContent.includes(chapterInfo[info.chapter].upper));if(panel){panel.classList.add('video-panel');panel.prepend(v);}if(!v.hasAttribute('src'))v.src='assets/'+chapterInfo[info.chapter].file;videoText();}if(info.chapter===3&&info.view==='playing')state.roleStarted=true;if(info.view==='intro'&&info.chapter!==3){const introColumn=s.querySelector('.n-13-47');if(introColumn)resize.observe(introColumn);requestAnimationFrame(measureIntro);}}
  if(id==='role-video')prepareReflection();
  if(active(id)||info?.view==='done')state.resume=id;state.lastRoute=id;persist();
  const h=s.querySelector('h1');if(h){h.tabIndex=-1;h.focus({preventScroll:true});}window.scrollTo(0,0);
 }
 function go(id,replace=false){render(guard(id),replace);}
 function saveAndGo(id){retryRoute=id;state.pendingSaveRoute=id;if(!persist()){render('14:160');return;}state.pendingSaveRoute=null;if(!persist()){state.pendingSaveRoute=id;render('14:160');return;}go(id);}
 function confirmLeave(destination){if(roleLocked())return;captureAll();state.returnScreen=current;state.resume=current;state.pendingDestination=destination;saveAndGo('14:144');}
 function play(rewatch=false){const info=routeInfo.get(current);if(!info)return;const routes=chapterInfo[info.chapter].routes,v=players[info.chapter];if(current!==routes.playing)go(routes.playing);if(rewatch){v.currentTime=0;clocks[info.chapter].lastTime=0;}v.play().catch(()=>{});}
 document.addEventListener('keydown',event=>{const n=event.target.closest('[data-nav]');if(n&&n.tagName!=='A'&&['Enter',' '].includes(event.key)){event.preventDefault();n.click();}});
 document.addEventListener('input',event=>{if(current==='role-video'&&['role-reflection','role-random-id'].includes(event.target.id)&&!state.roleSubmitted&&!reflectionSending){if(event.target.id==='role-random-id')state.roleRandomId=event.target.value;else state.roleDraft=event.target.value;event.target.setCustomValidity('');byId.get(current).querySelector('[data-submit-reflection]').disabled=!state.chapters[3].completed||!state.roleDraft.trim()||!state.roleRandomId.trim();persist();}});
 document.addEventListener('click',event=>{
  const n=event.target.closest('[data-nav],.action,[data-target]');if(!n||n.disabled||!n.closest('.screen:not([hidden])'))return;event.preventDefault();if(n.getAttribute('aria-disabled')==='true')return;const title=label(n),info=routeInfo.get(current);
  if(n.dataset.nav){if(current==='role-video'&&M.complete(state)){go('13:2');return;}if(active(current))confirmLeave(n.dataset.nav);else go(n.dataset.nav);return;}
  if(n.hasAttribute('data-submit-reflection')){submitReflection();return;}
  if(current==='14:144'){if(title==='Keep learning'){const back=state.returnScreen||storedResume();state.pendingDestination=null;saveAndGo(back);}else if(title==='Save and leave'){const destination=state.pendingDestination||'14:59';state.pendingDestination=null;saveAndGo(destination);}return;}
  if(title==='Save and leave'||title==='Pause and leave'){confirmLeave('14:59');return;}
  if(title==='Retry saving'){const next=retryRoute||state.pendingSaveRoute||storedResume();state.pendingSaveRoute=null;if(persist())go(next);else state.pendingSaveRoute=next;return;}
  if(info?.view==='intro'&&info.chapter<3&&['Start learning','Starting learning'].includes(title)){const r=state.chapters[info.chapter];saveAndGo(chapterInfo[info.chapter].routes[r.completed?'done':r.time>0?'playing':'start']);return;}
  if(title==='Play video'||n.hasAttribute('data-role-play')){play();return;}
  if(title==='Reload video'&&info){go(chapterInfo[info.chapter].routes.playing);players[info.chapter].load();return;}
  if(n.hasAttribute('data-next-chapter')){if(info&&state.chapters[info.chapter].completed){state.resume=chapterInfo[info.chapter+1].routes.start;saveAndGo('13:2');}return;}
  if(['Continue learning','Resume video'].includes(title)){saveAndGo(storedResume());return;}
  if(['Continue to role play','Start role play'].includes(title)){if(M.videosDone(state)){state.resume='16:509';saveAndGo('13:2');}return;}
  if(title==='Start practice'&&current==='16:509'){if(M.videosDone(state)){state.roleStarted=true;saveAndGo('role-video');}return;}
  if(n.dataset.target)go(n.dataset.target);
 });
 players.forEach((v,i)=>{
  const r=()=>state.chapters[i],clock=clocks[i];
  v.addEventListener('loadedmetadata',()=>{if(!Number.isFinite(v.duration))return;r().duration=v.duration;const restore=Math.min(r().time,v.duration,r().completed?v.duration:r().watched);if(restore>0)v.currentTime=restore;clock.lastTime=restore;clock.lastTick=performance.now();persist();videoText();});
  v.addEventListener('seeking',()=>{if(!r().completed&&v.currentTime>r().watched+.7){v.currentTime=r().watched;clock.lastTime=r().watched;}});
  v.addEventListener('ratechange',()=>{if(!r().completed&&v.playbackRate!==1)v.playbackRate=1;});
  v.addEventListener('timeupdate',()=>{const now=v.currentTime,wall=performance.now(),delta=now-clock.lastTime,elapsed=(wall-clock.lastTick)/1000;if(!v.seeking&&delta>=0&&delta<=Math.max(1.5,elapsed+.7)&&now<=r().watched+1.5)r().watched=Math.max(r().watched,now);clock.lastTime=now;clock.lastTick=wall;r().time=Math.min(now,r().completed?now:r().watched);videoText();if(wall-clock.lastSave>1000){persist();clock.lastSave=wall;}});
  v.addEventListener('pause',()=>{capture(i);persist();});
  v.addEventListener('ended',()=>{if(!v.ended||!Number.isFinite(v.duration)||!M.unlocked(state,i))return;if(!r().completed&&r().watched<v.duration-1.5){v.currentTime=r().watched;return;}r().completed=true;r().watched=v.duration;r().time=v.duration;r().duration=v.duration;if(i===3&&current==='role-video'){state.resume='role-video';if(persist()){videoText();prepareReflection();for(const n of byId.get(current).querySelector('nav').children){n.removeAttribute('aria-disabled');n.tabIndex=0;n.style.cursor='pointer';}}else{state.pendingSaveRoute='role-video';render('14:160');}}else if(routeInfo.get(current)?.chapter===i)saveAndGo(chapterInfo[i].routes.done);else persist();});
  v.addEventListener('error',()=>{if(v.error&&routeInfo.get(current)?.chapter===i){capture(i);retryRoute=chapterInfo[i].routes.playing;go(chapterInfo[i].routes.error);}});
 });
 document.addEventListener('visibilitychange',()=>{if(document.hidden){captureAll();persist();}});
 window.addEventListener('pagehide',()=>{captureAll();persist();});
 function readHash(){try{return decodeURIComponent(location.hash.slice(1).split('?')[0]||'13:2');}catch{return '13:2';}}
 function fromHash(){if(location.hash===renderedHash)return;const id=readHash();if(roleLocked()){go(id,true);return;}if(current&&active(current)&&staticIds.has(id)&&id!==current)confirmLeave(id);else go(id,true);}
 window.addEventListener('popstate',fromHash);window.addEventListener('hashchange',fromHash);go(readHash(),true);
})();
