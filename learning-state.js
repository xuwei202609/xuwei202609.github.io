(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.BelongState=api;})(typeof window==='undefined'?globalThis:window,function(){
 'use strict';
 const video=()=>({time:0,duration:0,watched:0,completed:false});
 const fresh=()=>({version:5,chapters:[video(),video(),video(),video()],activeChapter:0,roleStarted:false,roleDraft:'',roleRandomId:'',roleAnswer:'',roleSubmitted:false,resume:'14:73',returnScreen:null,pendingDestination:null,pendingSaveRoute:null,lastRoute:'13:2'});
 const finite=x=>Number.isFinite(x)&&x>=0?x:0;
 const videosDone=s=>s.chapters.slice(0,3).every(v=>v.completed);
 const unlocked=(s,i)=>i>=0&&i<4&&s.chapters.slice(0,i).every(v=>v.completed);
 const complete=s=>videosDone(s)&&s.chapters[3].completed&&s.roleSubmitted&&Boolean(s.roleAnswer.trim());
 function restore(value){const s=fresh();if(!value||![3,4,5].includes(value.version))return s;
  const records=value.version===3?[value.video]:value.version===4?value.chapters?.slice(0,3):value.chapters;
  s.chapters=s.chapters.map((v,i)=>{const old=records?.[i]||{},duration=finite(old.duration),watched=Math.min(finite(old.watched),duration||Infinity);return{duration,watched,time:Math.min(finite(old.time),watched),completed:old.completed===true};});
  for(const k of ['resume','returnScreen','pendingDestination','pendingSaveRoute','lastRoute'])if(typeof value[k]==='string')s[k]=value[k];
  s.activeChapter=[0,1,2,3].includes(value.activeChapter)?value.activeChapter:0;
  if(value.version===5){s.roleRandomId=typeof value.roleRandomId==='string'?value.roleRandomId:'';s.roleDraft=typeof value.roleDraft==='string'?value.roleDraft:'';s.roleAnswer=typeof value.roleAnswer==='string'?value.roleAnswer:'';s.roleStarted=value.roleStarted===true&&videosDone(s);s.roleSubmitted=value.roleSubmitted===true&&videosDone(s)&&s.chapters[3].completed&&Boolean(s.roleAnswer.trim());}
  return s;
 }
 return{fresh,restore,unlocked,videosDone,complete};
});
