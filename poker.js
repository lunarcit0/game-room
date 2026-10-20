'use strict';
(()=>{
 const E=PokerEngine,$=id=>document.getElementById(id),suitNames={c:'clubs',d:'diamonds',h:'hearts',s:'spades'},rankNames={11:'Jack',12:'Queen',13:'King',14:'Ace'};
 let pack=[],player=[],opponent=[],opening=[],selected=new Set(),discard=[],phase='select',round=0,wins=0,losses=0,ties=0,question=null;
 const file=c=>`assets/poker/${c.r===14?1:c.r}${c.s}.svg`,name=c=>`${rankNames[c.r]||c.r} of ${suitNames[c.s]}`;
 function card(c,i,hidden=false,interactive=false,animate=true){
  const el=document.createElement(interactive?'button':'div');el.className='poker-card';el.style.setProperty('--angle',`${(i-2)*5}deg`);el.style.setProperty('--delay',`${i*65}ms`);if(!animate)el.style.animation='none';
  if(hidden){const back=document.createElement('div');back.className='poker-back';back.textContent='♠';el.append(back);el.setAttribute('aria-label','Face-down card');}
  else {const img=document.createElement('img');img.src=file(c);img.alt=name(c);img.draggable=false;el.append(img);}
  if(interactive){el.type='button';el.disabled=phase!=='select';el.setAttribute('aria-label',`${name(c)}; ${selected.has(i)?'selected to replace':'keep'}`);el.setAttribute('aria-pressed',selected.has(i));el.classList.toggle('selected',selected.has(i));el.addEventListener('click',()=>{
   if(selected.has(i))selected.delete(i);else if(selected.size<3)selected.add(i);else{$('selection-status').textContent='You can replace at most 3 cards. Deselect one first.';return;}
   renderPlayer(false);selectionInfo();setQuestion();
  });}
  return el;
 }
 function renderPlayer(animate=true){$('player-hand').replaceChildren(...player.map((c,i)=>card(c,i,false,true,animate)));$('your-rank').textContent=E.evaluate(player).name;}
 function renderOpponent(reveal=false){$('opponent-hand').classList.toggle('revealed',reveal);$('opponent-hand').replaceChildren(...opponent.map((c,i)=>card(c,i,!reveal)));$('opponent-rank').textContent=reveal?E.evaluate(opponent).name:'';}
 function selectionInfo(){const n=selected.size;$('selection-status').textContent=n?`${n} card${n===1?'':'s'} selected · ${5-n} kept`:'Select up to 3 cards to replace, or keep all five.';$('exchange').textContent=n?`Draw ${n} & reveal`:'Keep all & reveal';}
 function updatePiles(){ $('deck-count').textContent=`${pack.length} cards`;$('discard-count').textContent=`Discards · ${discard.length}`;const c=discard.at(-1);$('discard-image').replaceChildren();if(c){const img=document.createElement('img');img.src=file(c);img.alt='Your last discarded card: '+name(c);$('discard-image').append(img);}}
 function start(){phase='select';round++;pack=E.shuffle(E.deck());player=[];opponent=[];for(let i=0;i<5;i++){player.push(pack.pop());opponent.push(pack.pop());}opening=player.map(c=>({...c}));$('opening-cards').textContent='Opening hand: '+opening.map(c=>(rankNames[c.r]||c.r)+' '+({c:'♣',d:'♦',h:'♥',s:'♠'}[c.s])).join(' · ');selected.clear();discard=[];$('poker-round').textContent=`Hand ${round}`;$('table-status').textContent='Choose what to keep.';$('exchange').hidden=false;$('exchange').disabled=false;$('next-hand').hidden=true;$('poker-event').disabled=false;$('poker-kind').disabled=false;renderPlayer();renderOpponent();updatePiles();selectionInfo();setQuestion();}
 function exchange(){
  if(phase!=='select')return;phase='drawing';$('exchange').disabled=true;$('poker-event').disabled=true;$('poker-kind').disabled=true;$('table-status').textContent='Drawing replacements…';renderPlayer(false);
  const ai=E.opponentDiscards(opponent);for(const i of selected){discard.push(player[i]);player[i]=pack.pop();}
  // Keep the opponent's discards hidden; never display hidden information.
  for(const i of ai)opponent[i]=pack.pop();selected.clear();
  renderPlayer();$('deck-count').textContent=`${pack.length} cards`;$('discard-count').textContent=`Discards · ${discard.length+ai.length}`;if(discard.length){const img=document.createElement('img');img.src=file(discard.at(-1));img.alt='Your last discarded card: '+name(discard.at(-1));$('discard-image').replaceChildren(img);}
  setTimeout(()=>{phase='showdown';renderOpponent(true);const result=E.compare(player,opponent);if(result>0)wins++;else if(result<0)losses++;else ties++;
   const ps=E.evaluate(player).score,os=E.evaluate(opponent).score;let reason='';if(ps[0]===os[0]&&result){const differing=ps.findIndex((v,i)=>v!==os[i]);const high=Math.max(ps[differing],os[differing]),low=Math.min(ps[differing],os[differing]);reason=` Both have ${E.evaluate(player).name.toLowerCase()}; ${rankNames[high]||high} beats ${rankNames[low]||low} at the first differing rank.`;}if(!result)reason=' All ranked values and kickers match; suits do not break ties.';$('table-status').textContent=`${result>0?'You win this hand.':result<0?'Opponent wins this hand.':'A tied hand.'} Opponent replaced ${ai.length} card${ai.length===1?'':'s'}.${reason}`;
   $('session-results').textContent=`You ${wins} · Opponent ${losses} · Ties ${ties}`;$('selection-status').textContent=`You: ${E.evaluate(player).name} · Opponent: ${E.evaluate(opponent).name}`;$('exchange').hidden=true;$('next-hand').hidden=false;
  },700);
 }
 function setQuestion(){
  const event=$('poker-event').value,kind=$('poker-kind').value,n=selected.size||1;
  const match=c=>event==='ace'?c.r===14:event==='face'?c.r>=11&&c.r<=13:c.s===event;
  const known=opening.filter(match).length,total=event==='ace'?4:event==='face'?12:13,s=total-known;
  const label=event==='ace'?'aces':event==='face'?'face cards':suitNames[event];
  question={...E.probability(s,n,kind),kind,label,known,event};
  $('odds-question').textContent=`${selected.size?'For your selected '+n+'-card exchange':'For a hypothetical one-card draw'}: what is the probability of drawing ${kind==='exactly'?'exactly':'at least'} one ${event==='ace'?'ace':event==='face'?'face card':{h:'heart',d:'diamond',c:'club',s:'spade'}[event]}?`;
  $('odds-answer').value='';$('odds-feedback').replaceChildren();
 }
 function gcd(a,b){return b?gcd(b,a%b):a;}
 function explain(prefix=''){
  const q=question,g=gcd(q.favorable,q.total),p=document.createElement('p');p.textContent=prefix;$('odds-feedback').replaceChildren(p);
  const detail=document.createElement('p');detail.textContent=`Your opening hand contains ${q.known} of the deck’s ${q.event==='ace'?4:q.event==='face'?12:13} ${q.label}. That leaves ${q.successes} matching cards among 47 unseen cards. Your discarded cards remain known and cannot be drawn again.`;
  const formula=document.createElement('p');formula.textContent=q.kind==='exactly'?`P(exactly one) = C(${q.successes}, 1) × C(${47-q.successes}, ${q.draws-1}) / C(47, ${q.draws})`:`P(at least one) = 1 − C(${47-q.successes}, ${q.draws}) / C(47, ${q.draws})`;
  const answer=document.createElement('p');answer.textContent=`= ${q.favorable/g}/${q.total/g} ≈ ${q.value.toFixed(5)} = ${(100*q.value).toFixed(2)}%.`;
  const note=document.createElement('p');note.textContent='C(n, k) counts unordered selections. Cards are drawn without replacement, so successive draws are dependent. This is a probability before drawing, not a prediction of the result.';
  $('odds-feedback').append(detail,formula,answer,note);
 }
 function parseAnswer(raw){const t=raw.trim().replace(/\s/g,'');if(/^\d+(\.\d+)?%$/.test(t))return parseFloat(t)/100;if(/^\d+\s*\/\s*\d+$/.test(t)){const [a,b]=t.split('/').map(Number);return b?a/b:NaN;}return /^(?:\d+(?:\.\d*)?|\.\d+)$/.test(t)?Number(t):NaN;}
 $('odds-form').addEventListener('submit',e=>{e.preventDefault();const v=parseAnswer($('odds-answer').value);if(!Number.isFinite(v)||v<0||v>1){$('odds-feedback').textContent='Enter a probability from 0 to 1, a fraction, or a percentage from 0% to 100%.';return;}explain(Math.abs(v-question.value)<=0.0001?'Correct!':'Not quite. Here is how to count it.');});
 $('odds-reveal').addEventListener('click',()=>explain('Let’s count the possibilities.'));$('poker-event').addEventListener('change',setQuestion);$('poker-kind').addEventListener('change',setQuestion);$('exchange').addEventListener('click',exchange);$('next-hand').addEventListener('click',start);start();
})();
