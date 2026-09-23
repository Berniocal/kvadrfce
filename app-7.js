// Volitelné rozmezí koeficientů pro generátor obecného tvaru.
// V lehké obtížnosti zůstávají koeficienty v zadání celá čísla
// a reálné kořeny jsou pouze celá čísla nebo jednoduché zlomky.
(function(){
  const generator=document.querySelector('.generator');
  const generatorGrid=generator?.querySelector('.generator-grid');
  const generateButton=document.getElementById('randomBtn');
  const generateButtonTop=document.getElementById('randomBtnTop');

  if(!generator || !generatorGrid || !generateButton || !generateButtonTop) return;

  const style=document.createElement('style');
  style.textContent=`
    .coef-range-box{margin-top:10px;border:1px solid var(--line);border-radius:12px;background:#fff;overflow:hidden}
    .coef-range-box summary{cursor:pointer;padding:10px 12px;font-weight:800;color:var(--text);list-style:none}
    .coef-range-box summary::-webkit-details-marker{display:none}
    .coef-range-box summary::after{content:'+';float:right;color:var(--accent);font-size:18px;line-height:1}
    .coef-range-box[open] summary::after{content:'−'}
    .coef-range-body{padding:0 12px 12px}
    .coef-range-note{font-size:12px;line-height:1.4;color:var(--muted);margin-bottom:9px}
    .coef-range-grid{display:grid;grid-template-columns:34px 1fr 1fr;gap:7px 8px;align-items:center}
    .coef-range-grid .head{font-size:11px;font-weight:800;text-transform:uppercase;color:var(--muted)}
    .coef-range-grid .symbol{font-weight:900;text-align:center}
    .coef-range-grid input{width:100%;min-width:0;padding:8px 9px;border:1px solid var(--line);border-radius:9px;background:#fff;color:var(--text)}
    @media(max-width:430px){.coef-range-grid{grid-template-columns:28px 1fr 1fr}}
  `;
  document.head.appendChild(style);

  const box=document.createElement('details');
  box.className='coef-range-box';
  box.id='coefficientRanges';
  box.innerHTML=`
    <summary>Rozmezí koeficientů a, b, c</summary>
    <div class="coef-range-body">
      <div class="coef-range-note">Platí pro generování v obecném tvaru. V lehké obtížnosti se z rozmezí vybírají jen celá čísla; koeficient a nikdy není 0.</div>
      <div class="coef-range-grid">
        <div></div><div class="head">od</div><div class="head">do</div>
        <div class="symbol">a</div><input id="rangeAMin" type="number" step="0.5" value="-3"><input id="rangeAMax" type="number" step="0.5" value="3">
        <div class="symbol">b</div><input id="rangeBMin" type="number" step="0.5" value="-8"><input id="rangeBMax" type="number" step="0.5" value="8">
        <div class="symbol">c</div><input id="rangeCMin" type="number" step="0.5" value="-8"><input id="rangeCMax" type="number" step="0.5" value="8">
      </div>
    </div>`;

  generatorGrid.insertAdjacentElement('afterend',box);

  function syncRangeVisibility(){
    box.hidden=mode!=='general';
  }

  document.querySelectorAll('.tab').forEach(tab=>{
    tab.addEventListener('click',()=>setTimeout(syncRangeVisibility,0));
  });
  syncRangeVisibility();

  function readNumber(id){
    return Number(document.getElementById(id).value);
  }

  function readRanges(){
    const ranges={
      a:{min:readNumber('rangeAMin'),max:readNumber('rangeAMax')},
      b:{min:readNumber('rangeBMin'),max:readNumber('rangeBMax')},
      c:{min:readNumber('rangeCMin'),max:readNumber('rangeCMax')}
    };

    for(const key of ['a','b','c']){
      const r=ranges[key];
      if(!Number.isFinite(r.min)||!Number.isFinite(r.max)){
        return {error:`U koeficientu ${key} zadej obě hranice rozmezí.`};
      }
      if(r.min>r.max){
        return {error:`U koeficientu ${key} musí být hodnota „od“ menší nebo rovna hodnotě „do“.`};
      }
    }
    return {ranges};
  }

  function randomDiscrete(min,max,step,nonzero=false){
    const lo=Math.ceil((min-EPS)/step);
    const hi=Math.floor((max+EPS)/step);
    if(lo>hi) return null;

    for(let guard=0;guard<80;guard++){
      const k=Math.floor(Math.random()*(hi-lo+1))+lo;
      const value=clean(k*step);
      if(nonzero && Math.abs(value)<EPS) continue;
      return value;
    }
    return null;
  }

  function gcdLocal(a,b){
    a=Math.abs(Math.round(a));
    b=Math.abs(Math.round(b));
    while(b){
      const t=b;
      b=a%b;
      a=t;
    }
    return a||1;
  }

  const easyDenominators=new Set([1,2,3,4,5,8,10]);

  function reducedDenominator(num,den){
    num=Math.round(num);
    den=Math.round(den);
    const g=gcdLocal(num,den);
    return Math.abs(den/g);
  }

  function easyRootType(candidate){
    const {a,b,c}=candidate;
    const D=b*b-4*a*c;

    if(D<-EPS) return 'none';

    if(Math.abs(D)<=EPS){
      const den=reducedDenominator(-b,2*a);
      return easyDenominators.has(den)?'double':'ugly';
    }

    const sd=Math.sqrt(D);
    const rounded=Math.round(sd);
    if(Math.abs(sd-rounded)>1e-9) return 'ugly';

    const d1=reducedDenominator(-b-rounded,2*a);
    const d2=reducedDenominator(-b+rounded,2*a);
    return easyDenominators.has(d1)&&easyDenominators.has(d2)?'two':'ugly';
  }

  function mediumRootType(candidate){
    const D=candidate.b*candidate.b-4*candidate.a*candidate.c;
    if(D<-EPS) return 'none';
    if(Math.abs(D)<=1e-8) return 'double';
    return 'two';
  }

  function matchesWanted(candidate,wanted,difficulty){
    const type=difficulty==='easy'?easyRootType(candidate):mediumRootType(candidate);
    if(type==='ugly') return false;
    return wanted==='random' || type===wanted;
  }

  function hasAllTerms(candidate){
    return Math.abs(candidate.a)>EPS && Math.abs(candidate.b)>EPS && Math.abs(candidate.c)>EPS;
  }

  function findCandidate(ranges,difficulty,wanted){
    const step=difficulty==='easy'?1:0.5;

    // U náhodné volby zachováme pestrost typů kořenů.
    let target=wanted;
    if(wanted==='random'){
      const options=['two','two','double','none'];
      target=options[Math.floor(Math.random()*options.length)];
    }

    for(let guard=0;guard<16000;guard++){
      const candidate={
        a:randomDiscrete(ranges.a.min,ranges.a.max,step,true),
        b:randomDiscrete(ranges.b.min,ranges.b.max,step,true),
        c:randomDiscrete(ranges.c.min,ranges.c.max,step,true)
      };

      if(candidate.a===null||candidate.b===null||candidate.c===null) return null;
      if(!hasAllTerms(candidate)) continue;
      if(matchesWanted(candidate,target,difficulty)) return candidate;
    }

    // Když zvolený náhodný typ v rozmezí neexistuje, zkusíme při „Náhodně“
    // libovolný přípustný typ, ale nikdy neporušíme zadané rozmezí.
    if(wanted==='random'){
      for(let guard=0;guard<8000;guard++){
        const candidate={
          a:randomDiscrete(ranges.a.min,ranges.a.max,step,true),
          b:randomDiscrete(ranges.b.min,ranges.b.max,step,true),
          c:randomDiscrete(ranges.c.min,ranges.c.max,step,true)
        };
        if(candidate.a===null||candidate.b===null||candidate.c===null) return null;
        if(!hasAllTerms(candidate)) continue;
        if(matchesWanted(candidate,'random',difficulty)) return candidate;
      }
    }

    return null;
  }

  function generateGeneralWithRanges(event){
    if(mode!=='general') return;

    // V obecném tvaru přebírá generování tato nová logika, aby bylo
    // rozmezí skutečně dodrženo. Původní listener už nespouštíme.
    event.preventDefault();
    event.stopImmediatePropagation();

    const read=readRanges();
    if(read.error){
      validation.textContent=read.error;
      return;
    }

    const difficulty=document.getElementById('difficulty').value;
    const wanted=document.getElementById('rootType').value;
    const candidate=findCandidate(read.ranges,difficulty,wanted);

    if(!candidate){
      validation.textContent='V tomto rozmezí se nepodařilo najít funkci s vybraným typem kořenů. Zkus rozmezí rozšířit nebo změnit typ kořenů.';
      return;
    }

    validation.textContent='';
    state={a:clean(candidate.a),b:clean(candidate.b),c:clean(candidate.c)};
    zoomFactor=1;
    renderAll();
  }

  generateButton.addEventListener('click',generateGeneralWithRanges,true);
  generateButtonTop.addEventListener('click',generateGeneralWithRanges,true);
})();
