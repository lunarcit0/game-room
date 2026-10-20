'use strict';
const AlgebraUno = (() => {
 const families=['x','y','x²','y²'], coefficients=[1,-2,3,-4,5,-6,7,-8,9];
 const label=c=>c.kind==='term'?`${c.n===1?'':c.n===-1?'−':c.n}${c.family}`:({skip:'Skip',reverse:'Reverse',draw:'Draw 2',wild:'Wild'})[c.kind];
 const term=(n,f)=>n===0?'0':`${n===1?'':n===-1?'−':n}${f}`;
 const legal=(c,top,color)=>c.kind==='wild'||c.kind==='draw'||c.family===color||(c.kind==='term'&&top.kind==='term'&&(c.family===top.family||c.n===top.n));
 function shuffled(cards){const a=[...cards];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
 function deck(){return shuffled(originalUnoCards.map(c=>({...c})));}
 function create(){const pile=deck(),hands=[pile.splice(0,5),pile.splice(0,5)];const first=pile.findIndex(c=>c.kind==='term');const top=pile.splice(first,1)[0];return {pile,hands,discard:[top],color:top.family,turn:0,winner:null};}
 function draw(s,who,count=1){let got=0;for(let i=0;i<count;i++){if(!s.pile.length&&s.discard.length>1){const top=s.discard.pop();s.pile=shuffled(s.discard);s.discard=[top];}if(!s.pile.length)break;s.hands[who].push(s.pile.pop());got++;}return got;}
 function play(s,who,id,color){if(s.winner!==null||s.turn!==who)return null;const i=s.hands[who].findIndex(c=>c.id===id),c=s.hands[who][i];if(!c||!legal(c,s.discard.at(-1),s.color))return null;if((c.kind==='wild'||c.kind==='draw')&&!families.includes(color))return null;s.hands[who].splice(i,1);s.discard.push(c);s.color=(c.kind==='wild'||c.kind==='draw')?color:c.family;const other=1-who;if(c.kind==='draw')draw(s,other,2);if(!s.hands[who].length)s.winner=who;s.turn=['skip','reverse','draw'].includes(c.kind)?who:other;return c;}
 return {families,label,term,legal,create,draw,play};
})();
(() => {
 const $=id=>document.getElementById('uno-'+id), A=AlgebraUno;
 let state,pending=null,failures=0,drawnThisTurn=false,aiJob=null,gameId=0,scenePrevious=null;
 const colorName=f=>({x:'Green',y:'Blue','x²':'Red','y²':'Yellow'})[f];
 function cardClass(c){return 'algebra-card original-card';}
 function artwork(node,c){const img=document.createElement('img');img.src=c.art;img.alt=A.label(c);img.draggable=false;node.replaceChildren(img);}
 function note(s){$('message').textContent=s;}
 function log(s){const li=document.createElement('li');li.textContent=s;$('log').prepend(li);while($('log').children.length>8)$('log').lastChild.remove();}
 function flyCard(from,to,card){
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches||!from||!to)return;
  const a=from.getBoundingClientRect(),b=to.getBoundingClientRect();if(!a.width||!b.width)return;
  const flying=document.createElement('div');flying.className='uno-flying '+(card?'':'card-back');
  if(card)artwork(flying,card);else flying.textContent='✦';
  Object.assign(flying.style,{left:(a.left+a.width/2-32)+'px',top:(a.top+a.height/2-45)+'px'});document.body.append(flying);
  const motion=flying.animate([{transform:'translate(0,0) rotate(-12deg)',opacity:1},{transform:`translate(${b.left+b.width/2-a.left-a.width/2}px,${b.top+b.height/2-a.top-a.height/2}px) rotate(5deg)`,opacity:1}],{duration:480,easing:'cubic-bezier(.22,.68,.2,1)',fill:'forwards'});
  motion.onfinish=()=>flying.remove();motion.oncancel=()=>flying.remove();
 }
 function updateScene(){
  const backs=$('computer-hand');if(!backs)return;const hand=$('hand'),n=state.hands[0].length,w=window.innerWidth<=600?78:92,available=(hand.clientWidth||600)-36;hand.style.setProperty('--card-overlap',Math.min(w-28,Math.max(14,(n*w-available)/Math.max(1,n-1)))+'px');backs.replaceChildren();const count=Math.min(state.hands[1].length,10);
  for(let i=0;i<count;i++){const back=document.createElement('span');back.className='opponent-card card-back';back.textContent='✦';back.style.setProperty('--fan-angle',((i-(count-1)/2)*5)+'deg');backs.append(back);}
  const top=state.discard.at(-1);
  if(scenePrevious){
   if(scenePrevious.top!==top.id)flyCard(scenePrevious.turn===1?backs:$('hand'),$('top'),top);
   for(let who=0;who<2;who++)if(state.hands[who].length>scenePrevious.counts[who])flyCard($('draw'),who===1?backs:$('hand'),null);
  }
  scenePrevious={top:top.id,turn:state.turn,counts:state.hands.map(h=>h.length)};
 }
 function render(){
  const top=state.discard.at(-1);$('top').className=cardClass(top);artwork($('top'),top);$('active').textContent=`Active color: ${colorName(state.color)} · ${state.color}`;
  $('computer-count').textContent=`Opponent: ${state.hands[1].length} cards${state.hands[1].length===1?' · UNO!':''}`;
  $('turn').textContent=state.winner!==null?(state.winner===0?'You win!':'Opponent wins. Try another round?'):state.turn===0?'Your turn':'Opponent’s turn…';
  $('hand-title').textContent=`Your hand · ${state.hands[0].length} cards`;$('hand').replaceChildren();
  state.hands[0].forEach(c=>{const b=document.createElement('button');b.type='button';b.className=cardClass(c);const handCount=state.hands[0].length;const position=state.hands[0].indexOf(c)-(handCount-1)/2;b.style.setProperty('--player-angle',(position*Math.min(5,32/Math.max(1,handCount-1)))+'deg');b.style.setProperty('--player-lift',(-Math.max(0,22-Math.abs(position)*5))+'px');artwork(b,c);const playable=A.legal(c,top,state.color);b.disabled=state.winner!==null||state.turn!==0||pending!==null;b.setAttribute('aria-label',`${A.label(c)}, ${c.family?colorName(c.family):'any color'}. ${playable?'Playable':'Does not match; selecting costs a card'}`);b.addEventListener('click',()=>select(c));$('hand').append(b);});
  $('draw').disabled=state.turn!==0||pending!==null||drawnThisTurn||state.winner!==null;$('call').disabled=true;$('call').textContent=state.hands[0].length===1?'UNO!':'Automatic UNO';
  $('challenge').hidden=!pending||pending.kind!=='term';const unlike=pending&&pending.kind==='term'&&top.kind==='term'&&top.family!==pending.family;$('check').hidden=!!unlike;$('like-choice').hidden=!unlike;$('cancel').textContent=drawnThisTurn?'Keep drawn card and end turn':'Choose a different card';$('colors').hidden=!pending||!['wild','draw'].includes(pending.kind);updateScene();
 }
 function schedule(){if(state.winner!==null||state.turn!==1)return;const version=gameId;clearTimeout(aiJob);aiJob=setTimeout(()=>{if(version!==gameId)return;computer();},850);}
 function commit(c,color){
  const prior=state.discard.at(-1);const result=A.play(state,0,c.id,color);if(!result)return;
  if(c.kind==='term'){const sum=prior.kind==='term'&&prior.family===c.family?prior.n+c.n:c.n;log(prior.kind==='term'&&prior.family!==c.family?`You: ${A.label(prior)} + (${A.label(c)}) stays as two unlike terms.`:`You: ${A.label(c)} → ${A.term(sum,c.family)}.`);}else log(`You played ${A.label(c)}${['wild','draw'].includes(c.kind)?' · '+colorName(color):''}.`);
  note(state.hands[0].length===1?'UNO! Called automatically.':'Card played.');
  if(state.hands[0].length===1)log('You call UNO automatically.');
  drawnThisTurn=false;failures=0;pending=null;render();schedule();
 }
 function select(c){
  if(state.turn!==0||pending||state.winner!==null)return;
  if(!A.legal(c,state.discard.at(-1),state.color)){A.draw(state,0);state.turn=1;drawnThisTurn=false;log('You selected a nonmatching card and drew 1.');note('Match the active color, term family, or signed coefficient. You draw 1 and your turn ends.');render();schedule();return;}
  if(c.kind==='term'){pending=c;failures=0;const prior=state.discard.at(-1);$('equation').textContent=prior.kind==='term'?`${A.label(prior)} + (${A.label(c)}) = ?`:`Read this term: ${A.label(c)}. What is its coefficient?`;$('coefficient').value='';note(prior.kind==='term'&&prior.family!==c.family?'Do these terms have the same variable and exponent?':'Enter the simplified coefficient. You get one retry before a penalty.');render();if(!$('check').hidden)$('coefficient').focus();}
  else if(c.kind==='wild'||c.kind==='draw'){pending=c;note('Choose the next color / term family.');render();}
  else commit(c);
 }
 function computer(){
  if(state.turn!==1||state.winner!==null)return;
  let candidates=state.hands[1].filter(c=>A.legal(c,state.discard.at(-1),state.color));
  if(!candidates.length){const got=A.draw(state,1);log('Opponent drew 1 card.');render();const drawn=got?state.hands[1].at(-1):null;if(drawn&&A.legal(drawn,state.discard.at(-1),state.color)){candidates=[drawn];}else{state.turn=0;note('Your turn.');render();return;}}
  // Prefer an action, then a color represented often in its remaining hand; wild last.
  candidates.sort((a,b)=>(a.kind==='wild')-(b.kind==='wild')||(b.kind!=='term')-(a.kind!=='term'));
  const c=candidates[0],prior=state.discard.at(-1);const color=A.families.reduce((best,f)=>state.hands[1].filter(v=>v.family===f).length>state.hands[1].filter(v=>v.family===best).length?f:best,A.families[0]);
  A.play(state,1,c.id,color);
  if(c.kind==='term'){const sum=prior.kind==='term'&&prior.family===c.family?prior.n+c.n:c.n;log(prior.kind==='term'&&prior.family!==c.family?`Opponent: ${A.label(prior)} + (${A.label(c)}) stays as two unlike terms.`:`Opponent: ${A.label(c)} → ${A.term(sum,c.family)}.`);}else log(`Opponent played ${A.label(c)}${['wild','draw'].includes(c.kind)?' · '+colorName(color):''}.`);
  if(state.hands[1].length===1)log('Opponent calls UNO!');
  note(c.kind==='draw'?'Opponent played Draw 2: you draw two cards and lose your turn.':c.kind==='skip'||c.kind==='reverse'?'Opponent skips your turn.':'Your turn.');render();schedule();
 }
 function incorrect(message){
  failures++;if(failures===1){note(message+' Try once more—no card penalty yet.');return;}
  note(message+' You keep your card, draw 1, and your turn ends.');log('Second incorrect attempt: you drew 1.');A.draw(state,0);state.turn=1;pending=null;failures=0;drawnThisTurn=false;render();schedule();
 }
 $('check').addEventListener('submit',e=>{e.preventDefault();if(!pending||pending.kind!=='term'||$('check').hidden)return;const raw=$('coefficient').value.trim().replace('−','-');if(!/^[+-]?\d+$/.test(raw)){note('Enter a whole-number coefficient, such as 1, −2, or 0.');return;}const top=state.discard.at(-1),sum=top.kind==='term'&&top.family===pending.family?top.n+pending.n:pending.n;if(Number(raw)===sum)commit(pending);else incorrect(failures===0?'Not quite. Add the signed coefficients and keep the variable and exponent.':`The coefficient is ${sum}: ${A.term(sum,pending.family)}.`);});
 $('keep-terms').addEventListener('click',()=>{if(pending&&!$('like-choice').hidden)commit(pending);});
 $('combine-terms').addEventListener('click',()=>{if(pending&&!$('like-choice').hidden)incorrect('Different variables or exponents make these unlike terms. Keep both terms.');});
 $('cancel').addEventListener('click',()=>{pending=null;failures=0;if(drawnThisTurn){drawnThisTurn=false;state.turn=1;note('Drawn card kept. Your turn ends.');render();schedule();}else{render();note('Choose a card or draw.');}});
 A.families.forEach((f,i)=>{const b=document.createElement('button');b.type='button';b.className='uno-color family-'+i;b.textContent=`${colorName(f)} · ${f}`;b.addEventListener('click',()=>{if(pending&&['wild','draw'].includes(pending.kind))commit(pending,f);});$('colors').append(b);});
 $('draw').addEventListener('click',()=>{if(state.turn!==0||pending||drawnThisTurn||state.winner!==null)return;const got=A.draw(state,0);drawnThisTurn=true;log('You drew 1 card.');render();const c=got?state.hands[0].at(-1):null;if(c&&A.legal(c,state.discard.at(-1),state.color)){note('Your drawn card matches—you can play it now.');select(c);}else{state.turn=1;drawnThisTurn=false;note('The drawn card does not match. Your turn ends.');render();schedule();}});
 function reset(){document.querySelectorAll('.uno-flying').forEach(el=>el.remove());scenePrevious=null;clearTimeout(aiJob);gameId++;state=A.create();pending=null;failures=0;drawnThisTurn=false;$('log').replaceChildren();note('You go first. Select a card, or draw one.');render();}
 $('new').addEventListener('click',reset);reset();
})();
