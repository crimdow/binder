// Pocket Binder clipper: runs on the page you share from Safari and sends its main text to your binder.
var BINDER = 'https://binder.jermins.com/';
var SKIP = 'script,style,noscript,template,iframe,svg,canvas,button,select,input,textarea,form,nav,header,footer,aside,ins,[hidden],[aria-hidden="true"],[role="navigation"],[role="banner"],[role="contentinfo"],[role="complementary"]';
var JUNK = /^(.*[-_])?(nav|menu|sidebar|widget|share|sharing|social|related|comment|respond|sponsor|promo|newsletter|subscribe|cookie|breadcrumb|pagination|popup|modal|banner)[a-z]*([-_].*)?$/i;
var ADS = /^(.*[-_])?(ad|ads|adsbygoogle|advert[a-z]*)([-_].*)?$/i;
var MAIN = 'main,article,h1,[role="main"],.entry-content,.post-content,.lyrics,#lyrics';
function ownJunk(e){
  if(e.matches && e.matches(SKIP)) return true;
  var toks = ((typeof e.className === 'string' ? e.className : '') + ' ' + (e.id || '')).split(/\s+/), hit = false;
  for(var i = 0; i < toks.length; i++) if(toks[i] && (JUNK.test(toks[i]) || ADS.test(toks[i]))) hit = true;
  return hit && !e.querySelector(MAIN);   // a wrapper that holds the article is never junk
}
var memo = new Map();
function junky(el, useClass){
  for(var e = el; e && e !== document.body; e = e.parentElement){
    var k = memo.get(e);
    if(k === undefined){ k = { skip: e.matches(SKIP), cls: ownJunk(e) }; memo.set(e, k) }
    if(k.skip || (useClass && k.cls)) return true;
  }
  return false;
}
function pickBest(useClass){
  var score = new Map(), add = function(el, v){ if(el) score.set(el, (score.get(el) || 0) + v) };
  var w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT), n;
  while((n = w.nextNode())){
    var t = n.nodeValue.trim(); if(t.length < 2) continue;
    var p = n.parentElement; if(!p || p.closest('a')) continue;
    if(!p.getClientRects().length || junky(p, useClass)) continue;
    var blk = p.closest('p,pre,li,td,blockquote,div,section,article,main,dd') || p;
    add(blk, t.length); add(blk.parentElement, t.length); if(blk.parentElement) add(blk.parentElement.parentElement, t.length / 2);
  }
  var best = null, top = 0;
  score.forEach(function(v, el){ if(el !== document.body && el !== document.documentElement && v > top){ top = v; best = el } });
  return { el: best, score: top };
}
function toText(root, useClass){
  var out = [], line = '';
  function flush(){ out.push({ t: line, pre: false }); line = '' }
  function walk(x){
    if(x.nodeType === 3){ line += x.nodeValue.replace(/\s+/g, ' '); return }
    if(x.nodeType !== 1) return;
    if(x !== root && (x.matches(SKIP) || (useClass && ownJunk(x)))) return;
    if(x.tagName === 'BR'){ flush(); return }
    var d = getComputedStyle(x).display;
    if(d === 'none') return;
    if(x.tagName === 'PRE'){ flush(); x.textContent.replace(/\r/g, '').split('\n').forEach(function(l){ out.push({ t: l.replace(/\s+$/, ''), pre: true }) }); out.push({ t: '', pre: false }); return }
    var block = !/^inline/.test(d) && d !== 'contents';
    if(block) flush();
    for(var c = x.firstChild; c; c = c.nextSibling) walk(c);
    if(block){ flush(); if(/^(P|H[1-6]|BLOCKQUOTE|UL|OL|TABLE)$/.test(x.tagName)) out.push({ t: '', pre: false }) }
  }
  walk(root); flush();
  return out.map(function(o){ return o.pre ? o.t : o.t.trim() }).join('\n').replace(/\n{3,}/g, '\n\n').trim();
}
function titleOf(){
  var h = document.querySelector('h1'), ht = h ? h.innerText.trim() : '';
  if(ht && ht.length < 120) return ht;
  var og = document.querySelector('meta[property="og:title"]');
  if(og && og.content) return og.content.trim();
  return document.title.split(/\s+[|·•]\s+/)[0].trim();
}
var enc = encodeURIComponent, link = BINDER + '#add&u=' + enc(location.href);
try{
  var useClass = true, best = pickBest(true);
  if(!best.el || best.score < 60){ useClass = false; best = pickBest(false) }
  var text = best.el ? toText(best.el, useClass) : '';
  if(text.length < 40) text = (document.body.innerText || '').trim();
  link = BINDER + '#add&t=' + enc(titleOf()) + '&u=' + enc(location.href) + '&x=' + enc(text.slice(0, 120000));
}catch(e){}
completion(link);
