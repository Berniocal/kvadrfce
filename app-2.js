  function applyParam(key,value,fromSlider){
    validation.textContent='';
    if(key==='a' && Math.abs(value)<EPS){
      value = value < 0 ? -0.1 : 0.1;
      validation.textContent='Koeficient a nemůže být 0.';
    }

    if(mode==='general'){
      state[key]=value;
    } else if(mode==='vertex'){
      const p = key==='p'?value:vertexData().p;
      const q = key==='q'?value:vertexData().q;
      const a = key==='a'?value:state.a;
      state.a=a;
      state.b=-2*a*p;
      state.c=a*p*p+q;
    } else if(mode==='factored'){
      const rd=rootsData();
      if(rd.type==='none') return;
      let x1=rd.type==='double'?rd.roots[0]:rd.roots[0];
      let x2=rd.type==='double'?rd.roots[0]:rd.roots[1];
      let a=state.a;
      if(key==='a') a=value;
      if(key==='x1') x1=value;
      if(key==='x2') x2=value;
      state.a=a;
      state.b=-a*(x1+x2);
      state.c=a*x1*x2;
    } else {
      const pd=powerData();
      if(!pd) return;
      const a=key==='a'?value:pd.a;
      const insideB=key==='insideB'?value:pd.insideB;
      state.a=a;
      state.b=2*a*insideB;
      state.c=a*insideB*insideB;
    }
    state={a:clean(state.a),b:clean(state.b),c:clean(state.c)};
    updateDerived(false);
  }

  function updateGeneratorOptions(){
    const rootSelect=document.getElementById('rootType');
    if(!rootSelect) return;

    const optRandom=rootSelect.querySelector('option[value="random"]');
    const optTwo=rootSelect.querySelector('option[value="two"]');
    const optDouble=rootSelect.querySelector('option[value="double"]');
    const optNone=rootSelect.querySelector('option[value="none"]');

    [optRandom,optTwo,optDouble,optNone].forEach(o=>{
      if(o) o.disabled=false;
    });

    if(mode==='factored'){
      if(optNone) optNone.disabled=true;
      const remembered=rootChoiceByMode.factored;
      rootSelect.value = remembered==='none' ? 'random' : remembered;
    } else if(mode==='power'){
      if(optRandom) optRandom.disabled=true;
      if(optTwo) optTwo.disabled=true;
      if(optNone) optNone.disabled=true;
      rootSelect.value='double';
      rootChoiceByMode.power='double';
    } else {
      rootSelect.value = rootChoiceByMode[mode] || 'random';
    }
  }

  function setMode(next){
    const rootSelect=document.getElementById('rootType');
    if(rootSelect && mode!=='power'){
      rootChoiceByMode[mode]=rootSelect.value;
    }
    mode=next;
    document.querySelectorAll('.tab').forEach(b=>b.classList.toggle('active',b.dataset.mode===mode));
    updateGeneratorOptions();
    renderAll();
  }

  function updateEquations(){
    const gen=generalEq(), ver=vertexEq(), fac=factoredEq(), pow=powerEq();
    document.getElementById('eqGeneral').innerHTML=htmlEq(gen);
    document.getElementById('eqVertex').innerHTML=htmlEq(ver);
    document.getElementById('eqFactored').innerHTML=htmlEq(fac);
    document.getElementById('eqPower').innerHTML=htmlEq(pow);

    document.getElementById('formGeneral').classList.toggle('active',mode==='general');
    document.getElementById('formVertex').classList.toggle('active',mode==='vertex');
    document.getElementById('formFactored').classList.toggle('active',mode==='factored');
    document.getElementById('formPower').classList.toggle('active',mode==='power');

    const rd=rootsData();
    document.getElementById('factoredNote').textContent = rd.type==='none'
      ? 'Neexistuje nad reálnými čísly, protože D < 0.'
      : 'Vždy se zapisuje jako součin dvou závorek a okamžitě ukáže reálné kořeny.';
    document.getElementById('powerNote').textContent = powerData()
      ? 'Speciální tvar a(x + b)²: vrchol leží na ose x a kořen je dvojnásobný.'
      : 'Pro tuto funkci není dostupný: vyžaduje D = 0 a yᵥ = 0.';

    if(mode==='general'){
      activeFormLabel.textContent='Obecný tvar';
      activeEquation.innerHTML=htmlEq(gen);
    } else if(mode==='vertex'){
      activeFormLabel.textContent='Vrcholový tvar';
      activeEquation.innerHTML=htmlEq(ver);
    } else if(mode==='factored') {
      activeFormLabel.textContent='Součinový tvar';
      activeEquation.innerHTML=htmlEq(fac);
    } else {
      activeFormLabel.textContent='Mocninový tvar';
      activeEquation.innerHTML=htmlEq(pow);
    }
  }

  function interval(a,b,leftOpen=true,rightOpen=true){
    const L = a===-Infinity ? '−∞' : fmt(a);
    const R = b===Infinity ? '+∞' : fmt(b);
    return `${leftOpen?'(':'⟨'}${L}; ${R}${rightOpen?')':'⟩'}`;
  }

  function signText(){
    const rd=rootsData(), a=state.a;
    if(rd.type==='none'){
      return a>0 ? 'f(x) > 0 pro všechna x ∈ ℝ' : 'f(x) < 0 pro všechna x ∈ ℝ';
    }
    if(rd.type==='double'){
      const x0=rd.roots[0];
      return a>0
        ? `f(x) ≥ 0 pro všechna x; f(x)=0 pouze pro x=${fmt(x0)}`
        : `f(x) ≤ 0 pro všechna x; f(x)=0 pouze pro x=${fmt(x0)}`;
    }
    const [x1,x2]=rd.roots;
    return a>0
      ? `kladná na ${interval(-Infinity,x1)} ∪ ${interval(x2,Infinity)}, záporná na ${interval(x1,x2)}`
      : `záporná na ${interval(-Infinity,x1)} ∪ ${interval(x2,Infinity)}, kladná na ${interval(x1,x2)}`;
  }

  function texNum(n){
    n = clean(n);
    const s = Number.isInteger(n) ? String(n) : String(n).replace('.', '{,}');
    return s;
  }

  function mathInline(tex){
    return `\\(${tex}\\)`;
  }

  function mathDisplay(tex){
    return `\\[${tex}\\]`;
  }

  let mathJaxFrame = 0;
  let mathJaxPromise = Promise.resolve();

  function queueMathJax(){
    if(!window.MathJax || !window.MathJax.typesetPromise) return;
    if(mathJaxFrame) window.cancelAnimationFrame(mathJaxFrame);
    mathJaxFrame = window.requestAnimationFrame(() => {
      mathJaxFrame = 0;
      const targets = [propertiesGrid, calculationsHost].filter(Boolean);
      mathJaxPromise = mathJaxPromise
        .then(() => window.MathJax.typesetPromise(targets))
        .catch(() => {});
    });
  }

  function rootsCalculationHtml(){
    const {a,b,c}=state;
    const D=discriminant();
    const rd=rootsData();

    let h =
      `Dosadíme do diskriminantu:` +
      mathDisplay(
        `D=b^2-4ac=(${texNum(b)})^2-4\\cdot(${texNum(a)})\\cdot(${texNum(c)})=${texNum(D)}`
      );

    if(rd.type==='none'){
      return h +
        `Protože ${mathInline('D<0')}, kvadratická rovnice nemá v ${mathInline('\\mathbb{R}')} žádné řešení.`;
    }

    if(rd.type==='double'){
      return h +
        `Protože ${mathInline('D=0')}, použijeme:` +
        mathDisplay(`x_0=\\frac{-b}{2a}`) +
        `Dosadíme konkrétní hodnoty:` +
        mathDisplay(
          `x_0=\\frac{-(${texNum(b)})}{2\\cdot(${texNum(a)})}=${texNum(rd.roots[0])}`
        );
    }

    return h +
      `Protože ${mathInline('D>0')}, použijeme:` +
      mathDisplay(
        `x_1=\\frac{-b-\\sqrt D}{2a},\\qquad
         x_2=\\frac{-b+\\sqrt D}{2a}`
      ) +
      `Dosadíme konkrétní hodnoty:` +
      mathDisplay(
        `x_1=\\frac{-(${texNum(b)})-\\sqrt{${texNum(D)}}}{2\\cdot(${texNum(a)})}
        =${texNum(rd.roots[0])}`
      ) +
      mathDisplay(
        `x_2=\\frac{-(${texNum(b)})+\\sqrt{${texNum(D)}}}{2\\cdot(${texNum(a)})}
        =${texNum(rd.roots[1])}`
      );
  }

