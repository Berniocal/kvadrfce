
  const root = document.getElementById('quadApp');
  root.dataset.ready = '1';

  const svg = document.getElementById('graph');
  const controlHost = document.getElementById('controlHost');
  const validation = document.getElementById('validation');
  const modeHint = document.getElementById('modeHint');
  const activeEquation = document.getElementById('activeEquation');
  const activeFormLabel = document.getElementById('activeFormLabel');
  const propertiesGrid = document.getElementById('propertiesGrid');
  const calculationsHost = document.getElementById('calculationsHost');

  let state = {a:1,b:-4,c:3};
  let mode = 'general';
  let zoomFactor = 1;
  const rootChoiceByMode = { general:'random', vertex:'random', factored:'random', power:'double' };

  const EPS = 1e-9;

  function clean(n){
    if (Math.abs(n) < EPS) return 0;
    return Math.round(n * 1000) / 1000;
  }
  function fmt(n){
    n = clean(n);
    if (Number.isInteger(n)) return String(n).replace('-', '−');
    return String(n).replace('-', '−').replace('.', ',');
  }
  function fmtPlain(n){
    n = clean(n);
    return Number.isInteger(n) ? String(n) : String(n);
  }
  function signedTerm(n, variable, first=false){
    n = clean(n);
    if (Math.abs(n) < EPS) return '';
    const neg = n < 0;
    const abs = Math.abs(n);
    const coeff = variable && Math.abs(abs-1)<EPS ? '' : fmt(abs);
    const body = coeff + variable;
    if (first) return (neg ? '−' : '') + body;
    return (neg ? ' − ' : ' + ') + body;
  }
  function generalEq(){
    const {a,b,c}=state;

    function termAlways(n, variable, first=false){
      n=clean(n);
      const neg=n<0;
      const abs=Math.abs(n);

      let coeff;
      if(variable && Math.abs(abs-1)<EPS){
        coeff='';
      } else {
        coeff=fmt(abs);
      }

      const body=coeff+variable;

      if(first) return (neg?'−':'')+body;
      return (neg?' − ':' + ')+body;
    }

    return 'f(x) = '
      + termAlways(a,'x²',true)
      + termAlways(b,'x')
      + termAlways(c,'');
  }
  function vertexData(){
    const {a,b,c}=state;
    const p = -b/(2*a);
    const q = a*p*p+b*p+c;
    return {p:clean(p), q:clean(q)};
  }
  function discriminant(){
    return clean(state.b*state.b - 4*state.a*state.c);
  }
  function rootsData(){
    const D = state.b*state.b - 4*state.a*state.c;
    if (D < -EPS) return {type:'none', roots:[]};
    if (Math.abs(D) <= EPS){
      return {type:'double', roots:[clean(-state.b/(2*state.a))]};
    }
    const sd=Math.sqrt(D);
    const x1=clean((-state.b-sd)/(2*state.a));
    const x2=clean((-state.b+sd)/(2*state.a));
    return {type:'two', roots:[Math.min(x1,x2),Math.max(x1,x2)]};
  }
  function factorPiece(x){
    x = clean(x);

    // Součinový tvar má vždy dvě závorky a v každé je vidět číslo.
    // Pokud uživatel ručně nastaví kořen 0, zobrazíme (x − 0).
    if (Math.abs(x)<EPS) return '(x − 0)';

    return x > 0
      ? `(x − ${fmt(x)})`
      : `(x + ${fmt(Math.abs(x))})`;
  }
  function coeffPrefix(a){
    a=clean(a);
    if (Math.abs(a-1)<EPS) return '';
    if (Math.abs(a+1)<EPS) return '−';
    return fmt(a);
  }
  function vertexEq(){
    const {a}=state;
    const {p,q}=vertexData();
    let inner = Math.abs(p)<EPS ? 'x' : (p>0 ? `x − ${fmt(p)}` : `x + ${fmt(Math.abs(p))}`);
    let s = `f(x) = ${coeffPrefix(a)}(${inner})²`;
    if (Math.abs(q)>EPS) s += q>0 ? ` + ${fmt(q)}` : ` − ${fmt(Math.abs(q))}`;
    return s;
  }
  function factoredEq(){
    const rd=rootsData();
    if(rd.type==='none') return 'v ℝ nelze zapsat';

    if(rd.type==='double'){
      const x0=rd.roots[0];
      return `f(x) = ${coeffPrefix(state.a)}${factorPiece(x0)}${factorPiece(x0)}`;
    }

    return `f(x) = ${coeffPrefix(state.a)}${factorPiece(rd.roots[0])}${factorPiece(rd.roots[1])}`;
  }
  function powerData(){
    const {q}=vertexData();
    if(Math.abs(q)>1e-7) return null;
    return {a:state.a, insideB:clean(state.b/(2*state.a))};
  }
  function powerEq(){
    const pd=powerData();
    if(!pd) return 'pro tuto funkci nelze zapsat';
    const b=pd.insideB;
    const inner=Math.abs(b)<EPS ? 'x' : (b>0 ? `x + ${fmt(b)}` : `x − ${fmt(Math.abs(b))}`);
    return `f(x) = ${coeffPrefix(pd.a)}(${inner})²`;
  }
  function htmlEq(txt){ return txt.replaceAll('²','<sup>2</sup>'); }

  const paramConfigs = {
    general:[
      {key:'a',label:'a',min:-5,max:5,step:.1},
      {key:'b',label:'b',min:-12,max:12,step:.1},
      {key:'c',label:'c',min:-12,max:12,step:.1}
    ],
    vertex:[
      {key:'a',label:'a',min:-5,max:5,step:.1},
      {key:'p',label:'p = xᵥ',min:-10,max:10,step:.1},
      {key:'q',label:'q = yᵥ',min:-10,max:10,step:.1}
    ],
    factored:[
      {key:'a',label:'a',min:-5,max:5,step:.1},
      {key:'x1',label:'x₁',min:-10,max:10,step:.1},
      {key:'x2',label:'x₂',min:-10,max:10,step:.1}
    ],
    power:[
      {key:'a',label:'a',min:-5,max:5,step:.1},
      {key:'insideB',label:'b uvnitř (x + b)',min:-10,max:10,step:.1}
    ]
  };

  function currentParams(){
    if(mode==='general') return {a:state.a,b:state.b,c:state.c};
    if(mode==='vertex'){
      const {p,q}=vertexData();
      return {a:state.a,p,q};
    }
    if(mode==='power') return powerData();
    const rd=rootsData();
    if(rd.type==='none') return null;
    if(rd.type==='double') return {a:state.a,x1:rd.roots[0],x2:rd.roots[0]};
    return {a:state.a,x1:rd.roots[0],x2:rd.roots[1]};
  }

  function renderControls(){
    controlHost.innerHTML='';
    validation.textContent='';
    const params=currentParams();

    if(mode==='factored' && !params){
      controlHost.innerHTML = `
        <div style="padding:14px;border:1px dashed var(--line);border-radius:12px;color:var(--muted);line-height:1.45">
          Tato funkce nemá reálné kořeny, takže ji v <b>součinovém tvaru nad ℝ</b> nelze zapsat.
          Změň funkci v obecném nebo vrcholovém tvaru, případně použij generátor.
        </div>`;
      modeHint.innerHTML='Součinový tvar existuje v reálných číslech právě tehdy, když <b>D ≥ 0</b>.';
      return;
    }
    if(mode==='power' && !params){
      controlHost.innerHTML = `
        <div style="padding:14px;border:1px dashed var(--line);border-radius:12px;color:var(--muted);line-height:1.45">
          Tvar <b>f(x) = a(x + b)²</b> je speciální: vrchol musí ležet na ose x, tedy <b>yᵥ = 0</b> a současně <b>D = 0</b>.
          Pro aktuální funkci proto tento tvar není dostupný. V generátoru zvol „1 dvojnásobný kořen“.
        </div>`;
      modeHint.innerHTML='Pozor: <b>b uvnitř (x + b)</b> není stejné b jako koeficient b v obecném tvaru.';
      return;
    }

    for(const cfg of paramConfigs[mode]){
      const value=params[cfg.key];
      const row=document.createElement('div');
      row.className='param';
      row.innerHTML=`
        <div class="param-head">
          <label class="param-title" for="num_${cfg.key}">${cfg.label}</label>
          <input class="number" id="num_${cfg.key}" type="number" inputmode="decimal"
                 min="${cfg.min}" max="${cfg.max}" step="${cfg.step}" value="${fmtPlain(value)}">
        </div>
        <input id="range_${cfg.key}" type="range" min="${cfg.min}" max="${cfg.max}" step="${cfg.step}" value="${Math.max(cfg.min,Math.min(cfg.max,value))}">
      `;
      controlHost.appendChild(row);

      const num=row.querySelector(`#num_${cfg.key}`);
      const range=row.querySelector(`#range_${cfg.key}`);

      range.addEventListener('input',()=>{
        num.value=range.value;
        applyParam(cfg.key,Number(range.value),true);
      });
      num.addEventListener('input',()=>{
        const v=Number(num.value);
        if(!Number.isFinite(v)) return;
        range.value=Math.max(cfg.min,Math.min(cfg.max,v));
        applyParam(cfg.key,v,false);
      });
      num.addEventListener('change',()=>{
        if(num.value==='' || !Number.isFinite(Number(num.value))){
          renderAll();
          return;
        }
        if(cfg.key==='a' && Math.abs(Number(num.value))<EPS){
          validation.textContent='Koeficient a nesmí být 0. Vrátím poslední platnou hodnotu.';
          renderAll();
        }
      });
    }

    if(mode==='general'){
      modeHint.innerHTML='Obecný tvar: <b>f(x) = ax² + bx + c</b>. Hodnota <b>c</b> je průsečík s osou y.';
    } else if(mode==='vertex'){
      modeHint.innerHTML='Vrcholový tvar: <b>f(x) = a(x − p)² + q</b>. Vrchol je přímo <b>V = [p; q]</b>.';
    } else if(mode==='factored'){
      modeHint.innerHTML='Součinový tvar: <b>f(x) = a(x − x₁)(x − x₂)</b>. Čísla <b>x₁, x₂</b> jsou kořeny.';
    } else {
      modeHint.innerHTML='Mocninový tvar: <b>f(x) = a(x + b)²</b>. Má dvojnásobný kořen <b>x = −b</b> a vrchol leží na ose x.';
    }
  }

