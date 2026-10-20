'use strict';
(function(root){
 const suits=['c','d','h','s'];
 const names=['High card','One pair','Two pair','Three of a kind','Straight','Flush','Full house','Four of a kind','Straight flush'];
 function deck(){return suits.flatMap(s=>Array.from({length:13},(_,i)=>({r:i+2,s,id:(i+2)+s})));}
 function shuffle(cards,random=Math.random){const a=cards.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
 function evaluate(hand){
  const ranks=hand.map(c=>c.r).sort((a,b)=>b-a),counts=new Map();ranks.forEach(r=>counts.set(r,(counts.get(r)||0)+1));
  const groups=[...counts].sort((a,b)=>b[1]-a[1]||b[0]-a[0]);
  const flush=hand.every(c=>c.s===hand[0].s),unique=[...new Set(ranks)];
  let high=unique.length===5&&unique[0]-unique[4]===4?unique[0]:0;
  if(unique.join(',')==='14,5,4,3,2')high=5;
  let score;
  if(flush&&high)score=[8,high];
  else if(groups[0][1]===4)score=[7,groups[0][0],groups[1][0]];
  else if(groups[0][1]===3&&groups[1][1]===2)score=[6,groups[0][0],groups[1][0]];
  else if(flush)score=[5,...ranks];
  else if(high)score=[4,high];
  else if(groups[0][1]===3)score=[3,groups[0][0],...groups.slice(1).map(g=>g[0])];
  else if(groups[0][1]===2&&groups[1][1]===2)score=[2,...groups.map(g=>g[0])];
  else if(groups[0][1]===2)score=[1,...groups.map(g=>g[0])];
  else score=[0,...ranks];
  return {score,name:score[0]===8&&high===14?'Royal flush':names[score[0]]};
 }
 function compare(a,b){const x=evaluate(a).score,y=evaluate(b).score;for(let i=0;i<Math.max(x.length,y.length);i++){const d=(x[i]||0)-(y[i]||0);if(d)return Math.sign(d);}return 0;}
 function opponentDiscards(hand){
  const category=evaluate(hand).score[0];if(category>=4)return [];
  const counts={};hand.forEach(c=>counts[c.r]=(counts[c.r]||0)+1);
  if(category>0)return hand.map((c,i)=>counts[c.r]===1?i:-1).filter(i=>i>=0).slice(0,3);
  for(const s of suits)if(hand.filter(c=>c.s===s).length===4)return hand.map((c,i)=>c.s!==s?i:-1).filter(i=>i>=0);
  // Keep four cards to a possible straight, including ace-low possibilities.
  for(let low=1;low<=10;low++){const keep=hand.map((c,i)=>({r:c.r===14&&low===1?1:c.r,i})).filter(c=>c.r>=low&&c.r<low+5);if(new Set(keep.map(c=>c.r)).size===4)return hand.map((c,i)=>keep.some(k=>k.i===i)?-1:i).filter(i=>i>=0);}
  return hand.map((c,i)=>({r:c.r,i})).sort((a,b)=>a.r-b.r).slice(0,3).map(c=>c.i);
 }
 function choose(n,k){if(k<0||k>n)return 0;k=Math.min(k,n-k);let r=1;for(let i=1;i<=k;i++)r=r*(n-i+1)/i;return Math.round(r);}
 function probability(successes,draws,kind){const total=choose(47,draws);const favorable=kind==='exactly'?successes*choose(47-successes,draws-1):total-choose(47-successes,draws);return {successes,draws,favorable,total,value:favorable/total};}
 const api={deck,shuffle,evaluate,compare,opponentDiscards,choose,probability};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.PokerEngine=api;
})(typeof globalThis!=='undefined'?globalThis:this);
