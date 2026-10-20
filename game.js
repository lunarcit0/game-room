'use strict';
const $=id=>document.getElementById(id);
const labels={modulo:'Modulo',sets:'Sets & notation',logic:'Logic',quantifiers:'Quantifiers',proofs:'Proof steps',divisibility:'Divisibility & congruence'};
let clockRunning=false;
let timerHandle,startedAt,elapsed=0,paused=false,finished=false;
const timeText=ms=>{const s=Math.floor(ms/1000);return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;};
function clockValue(){return elapsed+(clockRunning&&!paused&&!finished?Date.now()-startedAt:0);}
function updateClock(){$('timer').textContent=timeText(clockValue());}
function beginClock(){clearInterval(timerHandle);elapsed=0;paused=false;finished=false;clockRunning=false;startedAt=Date.now();$('pause').textContent='Stop';$('pause').disabled=true;$('clock-start').disabled=false;updateClock();timerHandle=setInterval(updateClock,250);}
function stopClock(){elapsed=clockValue();finished=true;clockRunning=false;$('clock-start').disabled=true;clearInterval(timerHandle);updateClock();$('pause').disabled=true;}
let round,score,streak,best,current,answered,number,divisor,seen,sessionTopics;
if(typeof lecture308Topics!=='undefined')Object.assign(labels,lecture308Topics);
function start(){round=1;score=0;streak=0;best=0;seen=new Set();sessionTopics=Object.keys(labels).filter(t=>$('topic').value!=='newlectures'||(typeof lecture308Topics!=='undefined'&&Object.hasOwn(lecture308Topics,t)));for(let i=sessionTopics.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[sessionTopics[i],sessionTopics[j]]=[sessionTopics[j],sessionTopics[i]];}beginClock();$('restart').hidden=true;question();}
function question(){
 const mode=$('topic').value;const topic=practiceTopic('308',mode==='mixed'||mode==='newlectures'?sessionTopics[(round-1)%sessionTopics.length]:mode);
 const level=Math.min(3,1+Math.floor(score/3));
 for(let tries=0;tries<30;tries++){current=makeQuestion(topic,level);if(!seen.has(current.prompt))break;}
 seen.add(current.prompt);$('form').inert=false;$('choices').inert=false;$('next').disabled=false;$('question').style.opacity='1';answered=false;number=current.number;divisor=current.divisor;
 $('level').textContent=topic==='modulo'?`LEVEL ${level} · MODULO`:labels[topic].toUpperCase();
 $('round').textContent=`${String(round).padStart(2,'0')} / 10`;$('score').textContent=score;$('streak').textContent=streak;$('progress').style.width=`${(round-1)*10}%`;
 $('question').textContent=current.prompt;$('question').className=topic==='modulo'&&!current.paper?'':'concept';
 $('prompt').textContent=topic==='modulo'?'What’s the remainder?':current.options?'Choose the best answer.':'Work it out, then check.';
 $('concept-visual').hidden=true;$('feedback').textContent='';$('visual').hidden=true;$('next').hidden=true;$('hint').hidden=false;$('hint').disabled=false;
 $('form').hidden=!!current.options;$('choices').hidden=!current.options;$('choices').replaceChildren();
 $('answer').disabled=false;$('submit').disabled=false;$('answer').value='';$('answer').className=current.type==='set'?'set-answer':'';
 $('answer').placeholder=current.type==='set'?'1, 2 or ∅':'?';$('answer').inputMode=current.type==='set'?'text':'numeric';
 $('card-note').textContent=current.lecture?`Adapted from Lecture ${current.lecture} · Write the full argument on paper; the game checks the specific answer, not a complete proof.`:topic==='proofs'?'Practice proof steps here; write complete proofs on paper.':current.type==='set'?'Enter comma-separated numbers; use ∅, {} or “empty” for the empty set.':'Based on MATH 308 Lectures 1–12. Timer starts when you answer, or use Start.';
 if(current.options){
  const options=[...current.options];for(let i=options.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[options[i],options[j]]=[options[j],options[i]];}
  options.forEach(text=>{const b=document.createElement('button');b.type='button';b.textContent=text;b.addEventListener('click',()=>submit(text,b));$('choices').append(b);});
 }
}
function parseSet(text){if(['∅','{}','empty'].includes(text.trim().toLowerCase()))return [];
 const raw=text.trim().replace(/^\{(.*)\}$/,'$1').trim();if(!raw||!/^\d+(\s*,\s*\d+)*$/.test(raw))return null;
 return [...new Set(raw.split(',').map(Number))].sort((a,b)=>a-b);
}
function submit(value,button){
 if(answered||paused)return;let right;
 if(current.type==='set'){const parsed=parseSet(value);if(parsed===null){$('feedback').textContent='Enter numbers separated by commas, or ∅ for an empty set.';return;}right=JSON.stringify(parsed)===JSON.stringify(current.answer);}
 else if(current.options){if(!clockRunning&&!finished)$('clock-start').click();right=value===current.answer;}
 else{if(!/^\d+$/.test(value.trim())||!Number.isSafeInteger(Number(value))){$('feedback').textContent='Enter a nonnegative whole number.';return;}right=Number(value)===Number(current.answer);}
 answered=true;if(right){score++;streak++;best=Math.max(best,streak);}else streak=0;
 $('score').textContent=score;$('streak').textContent=streak;$('progress').style.width=`${round*10}%`;
 $('feedback').textContent=`${right?'Correct!':'Let’s work through it.'} ${current.explanation}`;
 $('answer').disabled=true;$('submit').disabled=true;$('hint').disabled=true;
 for(const b of $('choices').children){b.disabled=true;if(b.textContent===current.answer)b.classList.add('correct');else if(b===button)b.classList.add('wrong');}
 if(current.paper){$('concept-visual').hidden=false;$('concept-visual').innerHTML=(current.lecture?'<h3>WORKED REASONING</h3>':'<h3>WORKED CALCULATION</h3>')+flowDiagram(current.steps||[current.explanation]);if(current.proofTask){const task=document.createElement('details'),summary=document.createElement('summary'),prompt=document.createElement('p'),rubric=document.createElement('p');task.className='full-proof-task';summary.textContent='Write a full proof · optional';prompt.textContent=current.proofTask;rubric.textContent='Self-check: state the domain and assumptions; justify each implication; verify witnesses or base cases; use the hypothesis without assuming the conclusion; finish with the claimed result. This written proof is not automatically graded.';task.append(summary,prompt,rubric);$('concept-visual').append(task);}}else if(current.topic==='modulo')reveal();else showConceptVisual(current);
 $('next').hidden=false;$('next').textContent=round===10?'See my results →':'Next round →';$('next').focus();
}
function reveal() {
  const quotient = Math.floor(number / divisor), remainder = number % divisor;
  $('visual').hidden = false;
  $('caption').textContent = `${quotient} full groups · ${remainder} left over`;
  $('groups').replaceChildren();
  for (let g = 0; g < quotient + (remainder > 0 ? 1 : 0); g++) {
    const group = document.createElement('div');
    group.className = `group${g === quotient ? ' leftover' : ''}`;
    group.setAttribute('aria-label', `${g === quotient ? remainder : divisor} dots${g === quotient ? ' left over' : ' in a full group'}`);
    for (let d = 0; d < (g === quotient ? remainder : divisor); d++) {
      const dot = document.createElement('span'); dot.className = 'dot'; dot.setAttribute('aria-hidden', 'true'); group.append(dot);
    }
    $('groups').append(group);
  }
  if (!number) $('groups').textContent = 'Zero dots means zero groups and zero left over.';
  $('equation').textContent = `${number} = ${divisor} × ${quotient} + ${remainder}`;
  $('congruence').textContent = `Math: ${number} ≡ ${remainder} (mod ${divisor}) · Code: ${number} % ${divisor} = ${remainder}`;
}
$('form').addEventListener('submit',e=>{e.preventDefault();submit($('answer').value);});
$('hint').addEventListener('click',()=>{$('feedback').textContent=current.hint;});
$('next').addEventListener('click',()=>{
 if(paused)return;if(round<10){round++;question();return;}stopClock();
 $('level').textContent='SESSION COMPLETE';$('prompt').textContent='You made time to practice.';$('question').textContent=`${score} / 10`;
 $('form').hidden=true;$('choices').hidden=true;$('hint').hidden=true;$('next').hidden=true;$('visual').hidden=true;
 $('feedback').textContent=`${score*10}% correct · Time: ${timeText(elapsed)} · Best streak: ${best}. Keep practicing the definitions and explaining why each answer works.`;
 $('restart').hidden=false;$('restart').focus();
});
$('restart').addEventListener('click',start);$('topic').addEventListener('change',start);start();
$('clock-start').addEventListener('click',()=>{if(finished||clockRunning)return;startedAt=Date.now();clockRunning=true;$('clock-start').disabled=true;$('pause').disabled=false;updateClock();});
$('pause').addEventListener('click',()=>{if(!clockRunning)return;elapsed=clockValue();clockRunning=false;$('clock-start').disabled=false;$('pause').disabled=true;updateClock();});
