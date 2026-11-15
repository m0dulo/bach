
'use strict';
const $=(s)=>document.querySelector(s), $$=(s)=>Array.from(document.querySelectorAll(s));
function readStore(k,fallback){try{return localStorage.getItem(k)||fallback}catch{return fallback}}
function saveStore(k,v){try{localStorage.setItem(k,v)}catch{}}
let fontSize=Number(readStore('musicbook-font','18'));
function setFont(){document.documentElement.style.setProperty('--body-size',fontSize+'px')}
setFont(); if(readStore('musicbook-night','0')==='1')document.body.classList.add('night');
$('#font-up')?.addEventListener('click',()=>{fontSize=Math.min(25,fontSize+1);setFont();saveStore('musicbook-font',fontSize)});
$('#font-down')?.addEventListener('click',()=>{fontSize=Math.max(16,fontSize-1);setFont();saveStore('musicbook-font',fontSize)});
$('#theme')?.addEventListener('click',()=>{let b=document.body.classList.toggle('night');saveStore('musicbook-night',b?'1':'0');$('#theme').setAttribute('aria-pressed',b)});
$('#theme')?.setAttribute('aria-pressed',document.body.classList.contains('night'));
$('#toggle-notes')?.addEventListener('click',()=>{let b=document.body.classList.toggle('note-off');$('#toggle-notes').textContent=b?'显示旁注':'收起旁注';$('#toggle-notes').setAttribute('aria-expanded',!b)});
$('#menu')?.addEventListener('click',()=>{let b=$('.sidebar')?.classList.toggle('open');$('#menu').setAttribute('aria-expanded',!!b)});
function progress(){let d=document.documentElement;let denom=d.scrollHeight-innerHeight;$('.progress').style.width=(denom>0?d.scrollTop/denom*100:100)+'%'}
addEventListener('scroll',progress,{passive:true});addEventListener('resize',progress);progress();
let page=document.body.dataset.page;
if(page&&page!=='index')saveStore('musicbook-last',page);
let last=readStore('musicbook-last','');if(last&&/^chapter-0[1-8]\.html$|^review\.html$/.test(last)&&$('#resume')){$('#resume').href=last;$('#resume').classList.remove('hidden')}
$('#book-search')?.addEventListener('input',ev=>{let q=ev.target.value.trim().toLowerCase(),box=$('#searchresults');box.replaceChildren();if(!q)return;let found=(window.BOOK_SEARCH||[]).filter(x=>x.text.toLowerCase().includes(q));found.forEach(x=>{let a=document.createElement('a');a.href=x.url;let pos=x.text.toLowerCase().indexOf(q);a.textContent=x.title+' · …'+x.text.slice(Math.max(0,pos-12),pos+55)+'…';box.append(a)});if(!found.length)box.textContent='没有找到，试试“音名”“赋格”或“巴赫”。'});
let ctx=null,nodes=[],timers=[],key='C';
const scales={C:{base:60,names:['C','D','E','F','G','A','B','C']},D:{base:62,names:['D','E','F♯','G','A','B','C♯','D']},F:{base:65,names:['F','G','A','B♭','C','D','E','F']}};
const offsets=[0,2,4,5,7,9,11,12],solfa=['Do','Re','Mi','Fa','Sol','La','Si','Do'];
function stopSound(){nodes.forEach(n=>{try{n.stop()}catch{}});nodes=[];timers.forEach(clearTimeout);timers=[];$$('.tone').forEach(e=>e.classList.remove('playing'));if($('#soundstatus'))$('#soundstatus').textContent='已停止。'}
async function audioReady(){let AC=window.AudioContext||window.webkitAudioContext;if(!AC){$('#soundstatus').textContent='此浏览器不支持试听，文字与图解仍可使用。';return false}if(!ctx)ctx=new AC();await ctx.resume();return true}
function tone(midi,start,duration=0.42,gain=.11){let o=ctx.createOscillator(),g=ctx.createGain();o.type='triangle';o.frequency.value=440*Math.pow(2,(midi-69)/12);g.gain.setValueAtTime(0,start);g.gain.linearRampToValueAtTime(gain,start+.02);g.gain.exponentialRampToValueAtTime(.0001,start+duration);o.connect(g);g.connect(ctx.destination);o.start(start);o.stop(start+duration+.04);nodes.push(o);o.onended=()=>{o.disconnect();g.disconnect();nodes=nodes.filter(n=>n!==o)}}
async function playDegrees(degrees){stopSound();try{if(!await audioReady())return;let now=ctx.currentTime+.06;degrees.forEach((d,i)=>{tone(scales[key].base+offsets[d],now+i*.48);timers.push(setTimeout(()=>{$$('.tone').forEach(e=>e.classList.remove('playing'));$$('.tone')[d]?.classList.add('playing')},60+i*480))});$('#soundstatus').textContent='正在播放 '+key+' 大调 · 合成示范音';timers.push(setTimeout(()=>{$$('.tone').forEach(e=>e.classList.remove('playing'));$('#soundstatus').textContent='播放结束。试试切换调，再听同一种关系。'},degrees.length*480+100))}catch{$('#soundstatus').textContent='试听未能启动，请再点击一次播放。'}}
function renderScale(){let grid=$('#tone-grid');if(!grid)return;grid.replaceChildren();scales[key].names.forEach((n,i)=>{let b=document.createElement('button');b.className='tone';b.setAttribute('aria-label',n+'，'+solfa[i]+'，点击试听');let strong=document.createElement('b');strong.textContent=n;let span=document.createElement('span');span.textContent=solfa[i]+' · '+(i===7?'1↑':i+1);b.append(strong,span);b.addEventListener('click',()=>playDegrees([i]));grid.append(b)});$$('[data-key]').forEach(b=>{let active=b.dataset.key===key;b.classList.toggle('active',active);b.setAttribute('aria-pressed',active)});$('#key-caption').textContent=key+' 大调 · '+(key==='C'?'无升降号':key==='D'?'F♯、C♯':'B♭')}
$$('[data-key]').forEach(b=>b.addEventListener('click',()=>{stopSound();key=b.dataset.key;renderScale();$('#soundstatus').textContent='已切换至 '+key+' 大调。'}));
$('#play-scale')?.addEventListener('click',()=>playDegrees([0,1,2,3,4,5,6,7]));$('#play-melody')?.addEventListener('click',()=>playDegrees([0,0,4,4,5,5,4]));$('#stop-sound')?.addEventListener('click',stopSound);renderScale();
$('#play-harmony')?.addEventListener('click',async()=>{stopSound();try{if(!await audioReady())return;let t=ctx.currentTime+.05;[55,59,62,65].forEach(n=>tone(n,t,1.25,.055));[48,60,64,67].forEach(n=>tone(n,t+1.5,1.8,.055));$('#soundstatus').textContent='先听 G7，再听 C：留意紧张到安定的倾向。';timers.push(setTimeout(()=>{$('#soundstatus').textContent='示范结束：这是常见和声进行，不是情绪的唯一公式。'},3500))}catch{$('#soundstatus').textContent='无法试听，请重试。'}});
$$('.saved-note').forEach(t=>{t.value=readStore('musicbook-note-'+t.id,'');t.addEventListener('input',()=>{saveStore('musicbook-note-'+t.id,t.value);let status=t.nextElementSibling;if(status)status.textContent='已尝试保存到当前浏览器。换浏览器或清理数据可能丢失，请另存重要笔记。'})});
addEventListener('pagehide',stopSound);
