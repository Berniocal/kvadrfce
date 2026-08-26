(() => {
  const root=document.getElementById('ineqApp');
  if(!root || root.dataset.ready==='1') return;
  root.dataset.ready='1';

  const EPS=1e-9;
  const ids=['la','lb','lc','ra','rb','rc'];
  const el=Object.fromEntries(ids.map(id=>[id,document.getElementById(id)]));
  const opEl=document.getElementById('ineqOperator');
  const msg=document.getElementById('ineqMessage');
  const originalHost=document.getElementById('originalIneq');
  const basicHost=document.getElementById('basicIneq');
  const solutionHost=document.getElementById('solutionBox');
  const stepsHost=document.getElementById('ineqSteps');
  const svg=document.getElementById('ineqGraph');

  let mathQueue=Promise.resolve();
  let mathFrame=0;

  function clean(n){
    if(Math.abs(n)<EPS) return 0;
    return Math.round(n*1e6)/1e6;
  }
  function texNum(n){
    n=clean(n);
    const s=Number.isInteger(n)?String(n):String(Math.round(n*1000)/1000);
    return s.replace('.', '{,}');
  }
  function fmt(n){
    n=clean(n);
    const s=Number.isInteger(n)?String(n):String(Math.round(n*1000)/1000);
    return s.replace('-', '−').replace('.', ',');
  }
  const md=t=>`\\[${t}\\]`;
  const mi=t=>`\\(${t}\\)`;

  function queueMath(){
    if(!window.MathJax || !window.MathJax.typesetPromise) return;
    if(mathFrame) cancelAnimationFrame(mathFrame);
    mathFrame=requestAnimationFrame(()=>{
      mathFrame=0;
      const targets=[originalHost,basicHost,solutionHost,stepsHost];
      mathQueue=mathQueue.then(()=>{
        if(window.MathJax.typesetClear) window.MathJax.typesetClear(targets);
        return window.MathJax.typesetPromise(targets);
      }).catch(()=>{});
    });
  }

  function opTex(op){
    return op==='>='?'\\ge':op==='<='?'\\le':op;
  }
  function isInclusive(op){ return op==='>=' || op==='<='; }
  function wantsPositive(op){ return op==='>' || op==='>='; }

  function texTerm(coef,varName,first=false){
    coef=clean(coef);
    if(Math.abs(coef)<EPS) return '';
    const neg=coef<0, abs=Math.abs(coef);
    const body=(varName && Math.abs(abs-1)<EPS?'':texNum(abs))+varName;
    return first ? (neg?'-':'')+body : (neg?' - ':' + ')+body;
  }

  function texPoly(a,b,c){
    const terms=[[a,'x^2'],[b,'x'],[c,'']].filter(([v])=>Math.abs(v)>=EPS);
    if(!terms.length) return '0';
    return terms.map(([v,n],i)=>texTerm(v,n,i===0)).join('');
  }

  function texMovedTerms(L,R){
    const terms=[
      [L.a,'x^2'],[L.b,'x'],[L.c,''],
      [-R.a,'x^2'],[-R.b,'x'],[-R.c,'']
    ].filter(([v])=>Math.abs(v)>=EPS);
    if(!terms.length) return '0';
    return terms.map(([v,n],i)=>texTerm(v,n,i===0)).join('');
  }

  function readData(){
    const vals={};
    for(const id of ids){
      vals[id]=Number(el[id].value);
      if(!Number.isFinite(vals[id])) return null;
    }
    return {
      L:{a:vals.la,b:vals.lb,c:vals.lc},
      R:{a:vals.ra,b:vals.rb,c:vals.rc},
      op:opEl.value
    };
  }

  function analyze(data){
    if(!data) return {ok:false,msg:'Vyplň všech šest koeficientů čísly.'};
    const A=clean(data.L.a-data.R.a);
    const B=clean(data.L.b-data.R.b);
    const C=clean(data.L.c-data.R.c);

    if(Math.abs(A)<EPS){
      return {
        ok:false,linear:true,A,B,C,data,
        msg:'Po úpravě se člen x² vyrušil. Výsledná nerovnice už není kvadratická.'
      };
    }

    const D=clean(B*B-4*A*C);
    const out={ok:true,A,B,C,D,data};

    if(D>EPS){
      const sd=Math.sqrt(D);
      const r1=clean((-B-sd)/(2*A));
      const r2=clean((-B+sd)/(2*A));
      out.roots=[Math.min(r1,r2),Math.max(r1,r2)];
      out.rootType='two';
    }else if(Math.abs(D)<=EPS){
      out.roots=[clean(-B/(2*A))];
      out.rootType='double';
    }else{
      out.roots=[];
      out.rootType='none';
    }

    out.intervals=solutionIntervals(out);
    out.solutionTex=solutionTex(out);
    return out;
  }

  function solutionIntervals(s){
    const positive=wantsPositive(s.data.op);
    const inclusive=isInclusive(s.data.op);
    const signA=s.A>0;

    if(s.rootType==='two'){
      const [x1,x2]=s.roots;
      const positiveOutside=signA;
      const wantOutside=positive===positiveOutside;
      if(wantOutside){
        return [
          {from:-Infinity,to:x1,leftClosed:false,rightClosed:inclusive},
          {from:x2,to:Infinity,leftClosed:inclusive,rightClosed:false}
        ];
      }
      return [{from:x1,to:x2,leftClosed:inclusive,rightClosed:inclusive}];
    }

    if(s.rootType==='double'){
      const x0=s.roots[0];
      const signAway=signA;
      if(positive===signAway){
        if(inclusive) return [{from:-Infinity,to:Infinity,leftClosed:false,rightClosed:false}];
        return [
          {from:-Infinity,to:x0,leftClosed:false,rightClosed:false},
          {from:x0,to:Infinity,leftClosed:false,rightClosed:false}
        ];
      }else{
        if(inclusive) return [{point:x0}];
        return [];
      }
    }

    const signEverywhere=signA;
    return positive===signEverywhere
      ? [{from:-Infinity,to:Infinity,leftClosed:false,rightClosed:false}]
      : [];
  }

  function solutionTex(s){
    const inc=isInclusive(s.data.op);

    if(s.rootType==='two'){
      const [x1,x2]=s.roots;
      const positive=wantsPositive(s.data.op);
      const positiveOutside=s.A>0;
      const outside=positive===positiveOutside;

      if(outside){
        const l=inc?'\\rangle':')';
        const r=inc?'\\langle':'(';
        return `(-\\infty;${texNum(x1)}${l}\\cup${r}${texNum(x2)};+\\infty)`;
      }
      return inc
        ? `\\langle${texNum(x1)};${texNum(x2)}\\rangle`
        : `(${texNum(x1)};${texNum(x2)})`;
    }

    if(s.rootType==='double'){
      const x0=s.roots[0];
      const positive=wantsPositive(s.data.op);
      const signAway=s.A>0;

      if(positive===signAway){
        return inc ? '\\mathbb{R}' : `\\mathbb{R}\\setminus\\{${texNum(x0)}\\}`;
      }
      return inc ? `\\{${texNum(x0)}\\}` : '\\varnothing';
    }

    const positive=wantsPositive(s.data.op);
    return positive===(s.A>0) ? '\\mathbb{R}' : '\\varnothing';
  }

  function showMessage(kind,text){
    msg.className=`ineq-message show ${kind}`;
    msg.textContent=text;
  }
  function clearMessage(){
    msg.className='ineq-message';
    msg.textContent='';
  }

  function step(html){ return `<div class="ineq-step">${html}</div>`; }
  function answer(html){ return `<div class="ineq-answer">${html}</div>`; }
  function details(title,body){
    return `<details class="ineq-calc"><summary>${title}</summary><div class="ineq-calc-body">${body}</div></details>`;
  }

  function renderEquations(s){
    const {L,R,op}=s.data;
    originalHost.innerHTML=md(`${texPoly(L.a,L.b,L.c)} ${opTex(op)} ${texPoly(R.a,R.b,R.c)}`);
    basicHost.innerHTML=md(`${texPoly(s.A,s.B,s.C)} ${opTex(op)} 0`);
    solutionHost.innerHTML=`Řešení: ${md(`x\\in ${s.solutionTex}`)}`;
  }

  function renderSteps(s){
    const {L,R,op}=s.data;
    const opT=opTex(op);

    const transform=
      step(`<strong>1.</strong> Začneme zadanou nerovnicí:
        ${md(`${texPoly(L.a,L.b,L.c)} ${opT} ${texPoly(R.a,R.b,R.c)}`)}`)+
      step(`<strong>2.</strong> Všechny členy převedeme na levou stranu:
        ${md(`${texMovedTerms(L,R)} ${opT} 0`)}`)+
      step(`<strong>3.</strong> Sečteme stejné členy:
        ${md(`${texPoly(s.A,s.B,s.C)} ${opT} 0`)}`)+
      answer(`Základní tvar je:
        ${md(`\\boxed{${texPoly(s.A,s.B,s.C)} ${opT} 0}`)}`);

    let rootsBody=
      step(`Pro průsečíky paraboly s osou ${mi('x')} řešíme odpovídající rovnici:
        ${md(`${texPoly(s.A,s.B,s.C)}=0`)}`)+
      step(`Spočítáme diskriminant:
        ${md(`D=b^2-4ac`)}
        ${md(`D=(${texNum(s.B)})^2-4\\cdot(${texNum(s.A)})\\cdot(${texNum(s.C)})=${texNum(s.D)}`)}`);

    if(s.rootType==='two'){
      const [x1,x2]=s.roots;
      rootsBody+=
        step(`Protože ${mi('D>0')}, máme dva kořeny:
          ${md(`x_{1,2}=\\frac{-b\\pm\\sqrt D}{2a}`)}
          ${md(`x_1=\\frac{-(${texNum(s.B)})-\\sqrt{${texNum(s.D)}}}{2\\cdot(${texNum(s.A)})}=${texNum(x1)}`)}
          ${md(`x_2=\\frac{-(${texNum(s.B)})+\\sqrt{${texNum(s.D)}}}{2\\cdot(${texNum(s.A)})}=${texNum(x2)}`)}`)+
        answer(`Parabola protíná osu ${mi('x')} v bodech ${mi(`x_1=${texNum(x1)}`)} a ${mi(`x_2=${texNum(x2)}`)}.`);
    }else if(s.rootType==='double'){
      const x0=s.roots[0];
      rootsBody+=
        step(`Protože ${mi('D=0')}, máme jeden dvojnásobný kořen:
          ${md(`x_0=-\\frac{b}{2a}`)}
          ${md(`x_0=-\\frac{${texNum(s.B)}}{2\\cdot(${texNum(s.A)})}=${texNum(x0)}`)}`)+
        answer(`Parabola se osy ${mi('x')} dotýká pro ${mi(`x=${texNum(x0)}`)}.`);
    }else{
      rootsBody+=answer(`Protože ${mi('D<0')}, parabola osu ${mi('x')} neprotíná.`);
    }

    const positive=wantsPositive(op);
    const relationText=positive?'nad osou x':'pod osou x';
    const equalityText=isInclusive(op)
      ? 'Protože nerovnost obsahuje rovnost, kořeny do řešení patří.'
      : 'Protože nerovnost je ostrá, kořeny do řešení nepatří.';

    let graphBody=
      step(`Koeficient ${mi(`a=${texNum(s.A)}`)} je ${s.A>0?'kladný':'záporný'}, takže funkce je ${s.A>0?'konvexní':'konkávní'}.`)+
      step(`Z nerovnice ${mi(`${texPoly(s.A,s.B,s.C)} ${opT} 0`)} hledáme ta ${mi('x')}, pro která leží graf ${relationText}.`)+
      step(equalityText)+
      answer(`Z grafu odečteme:
        ${md(`\\boxed{x\\in ${s.solutionTex}}`)}`);

    stepsHost.innerHTML=
      details('1. Úprava na základní tvar',transform)+
      details('2. Kořeny a průsečíky s osou x',rootsBody)+
      details('3. Odečtení řešení z grafu',graphBody);

    queueMath();
  }

  function niceStep(span){
    const raw=span/10;
    const pow=Math.pow(10,Math.floor(Math.log10(raw)));
    const m=raw/pow;
    return (m<1.5?1:m<3.5?2:m<7.5?5:10)*pow;
  }

  function drawGraph(s){
    const W=900,H=590;
    const padL=54,padR=38,padT=34,plotBottom=470;
    const numY=535;

    const xv=clean(-s.B/(2*s.A));
    let xMin=xv-7, xMax=xv+7;
    if(s.rootType==='two'){
      xMin=Math.min(xMin,s.roots[0]-3);
      xMax=Math.max(xMax,s.roots[1]+3);
    }else if(s.rootType==='double'){
      xMin=Math.min(xMin,s.roots[0]-6);
      xMax=Math.max(xMax,s.roots[0]+6);
    }
    xMin=Math.min(xMin,-3);
    xMax=Math.max(xMax,3);

    const samples=[];
    for(let i=0;i<=300;i++){
      const x=xMin+(xMax-xMin)*i/300;
      samples.push(s.A*x*x+s.B*x+s.C);
    }
    samples.push(0);
    let yMin=Math.min(...samples),yMax=Math.max(...samples);
    let ySpan=yMax-yMin;
    if(ySpan<8){yMin-=4;yMax+=4}
    else{
      yMin-=ySpan*.08;
      yMax+=ySpan*.08;
    }

    const sx=x=>padL+(x-xMin)/(xMax-xMin)*(W-padL-padR);
    const sy=y=>plotBottom-(y-yMin)/(yMax-yMin)*(plotBottom-padT);

    let out=[`<rect width="${W}" height="${H}" fill="white"/>`];

    s.intervals.forEach(int=>{
      if(int.point!==undefined) return;
      const from=int.from===-Infinity?xMin:Math.max(xMin,int.from);
      const to=int.to===Infinity?xMax:Math.min(xMax,int.to);
      if(to<from) return;
      const x=sx(from), w=Math.max(0,sx(to)-x);
      out.push(`<rect x="${x}" y="${padT}" width="${w}" height="${plotBottom-padT}" fill="var(--accent-soft)" opacity="0.9"/>`);
    });

    const xStep=niceStep(xMax-xMin);
    const yStep=niceStep(yMax-yMin);

    for(let x=Math.ceil(xMin/xStep)*xStep;x<=xMax+EPS;x+=xStep){
      const px=sx(x);
      out.push(`<line x1="${px}" y1="${padT}" x2="${px}" y2="${plotBottom}" stroke="var(--grid)"/>`);
      if(Math.abs(x)>EPS) out.push(`<text x="${px}" y="${plotBottom+18}" text-anchor="middle" font-size="12" fill="var(--axis)">${fmt(x)}</text>`);
    }
    for(let y=Math.ceil(yMin/yStep)*yStep;y<=yMax+EPS;y+=yStep){
      const py=sy(y);
      out.push(`<line x1="${padL}" y1="${py}" x2="${W-padR}" y2="${py}" stroke="var(--grid)"/>`);
      if(Math.abs(y)>EPS) out.push(`<text x="${padL-9}" y="${py+4}" text-anchor="end" font-size="12" fill="var(--axis)">${fmt(y)}</text>`);
    }

    if(xMin<=0&&xMax>=0){
      const px=sx(0);
      out.push(`<line x1="${px}" y1="${padT}" x2="${px}" y2="${plotBottom}" stroke="var(--axis)" stroke-width="1.8"/>`);
      out.push(`<text x="${px+8}" y="${padT+14}" font-size="13" fill="var(--axis)">y</text>`);
    }
    if(yMin<=0&&yMax>=0){
      const py=sy(0);
      out.push(`<line x1="${padL}" y1="${py}" x2="${W-padR}" y2="${py}" stroke="var(--axis)" stroke-width="2"/>`);
      out.push(`<text x="${W-padR-8}" y="${py-8}" font-size="13" fill="var(--axis)">x</text>`);
    }

    let d='';
    for(let i=0;i<=700;i++){
      const x=xMin+(xMax-xMin)*i/700;
      const y=s.A*x*x+s.B*x+s.C;
      d+=(i?' L ':'M ')+sx(x).toFixed(2)+' '+sy(y).toFixed(2);
    }
    out.push(`<path d="${d}" fill="none" stroke="var(--curve)" stroke-width="4" stroke-linecap="round"/>`);

    s.roots.forEach((r,i)=>{
      const px=sx(r),py=sy(0);
      out.push(`<circle cx="${px}" cy="${py}" r="6" fill="var(--root)" stroke="white" stroke-width="2"/>`);
      out.push(`<text x="${px+9}" y="${py-11}" font-size="12" font-weight="800" fill="var(--root)" paint-order="stroke" stroke="white" stroke-width="4">${s.rootType==='two'?'x'+(i+1):'x₀'} = ${fmt(r)}</text>`);
    });

    out.push(`<line x1="${padL}" y1="495" x2="${W-padR}" y2="495" stroke="var(--line)"/>`);
    out.push(`<text x="${padL}" y="515" font-size="12" font-weight="800" fill="var(--muted)">ŘEŠENÍ NA ČÍSELNÉ OSE</text>`);
    out.push(`<line x1="${padL}" y1="${numY}" x2="${W-padR}" y2="${numY}" stroke="var(--axis)" stroke-width="2"/>`);
    out.push(`<path d="M ${W-padR} ${numY} l -9 -5 l 0 10 z" fill="var(--axis)"/>`);

    s.intervals.forEach(int=>{
      if(int.point!==undefined){
        const px=sx(int.point);
        out.push(`<circle cx="${px}" cy="${numY}" r="7" fill="var(--accent)" stroke="white" stroke-width="2"/>`);
        return;
      }
      const from=int.from===-Infinity?xMin:Math.max(xMin,int.from);
      const to=int.to===Infinity?xMax:Math.min(xMax,int.to);
      const x1=sx(from),x2=sx(to);
      out.push(`<line x1="${x1}" y1="${numY}" x2="${x2}" y2="${numY}" stroke="var(--accent)" stroke-width="8" stroke-linecap="round"/>`);
    });

    if(s.rootType==='two'){
      const include=isInclusive(s.data.op);
      s.roots.forEach(r=>{
        const px=sx(r);
        out.push(`<circle cx="${px}" cy="${numY}" r="7" fill="${include?'var(--accent)':'white'}" stroke="var(--accent)" stroke-width="3"/>`);
        out.push(`<text x="${px}" y="${numY+25}" text-anchor="middle" font-size="12" font-weight="800" fill="var(--axis)">${fmt(r)}</text>`);
      });
    }else if(s.rootType==='double'){
      const r=s.roots[0];
      const px=sx(r);
      const included=s.intervals.some(int=>int.point!==undefined) || isInclusive(s.data.op);
      const excludedEverywhere=s.solutionTex.includes('setminus');
      if(included || excludedEverywhere){
        out.push(`<circle cx="${px}" cy="${numY}" r="7" fill="${included&&!excludedEverywhere?'var(--accent)':'white'}" stroke="var(--accent)" stroke-width="3"/>`);
        out.push(`<text x="${px}" y="${numY+25}" text-anchor="middle" font-size="12" font-weight="800" fill="var(--axis)">${fmt(r)}</text>`);
      }
    }

    out.push(`<rect x="${padL}" y="${padT}" width="${W-padL-padR}" height="${plotBottom-padT}" fill="none" stroke="var(--line)"/>`);
    svg.innerHTML=out.join('');
  }

  function render(){
    const data=readData();
    const s=analyze(data);

    if(!s.ok){
      if(s.data){
        const {L,R,op}=s.data;
        originalHost.innerHTML=md(`${texPoly(L.a,L.b,L.c)} ${opTex(op)} ${texPoly(R.a,R.b,R.c)}`);
        basicHost.innerHTML=md(`${texPoly(s.A,s.B,s.C)} ${opTex(op)} 0`);
      }else{
        originalHost.textContent='—';
        basicHost.textContent='—';
      }
      solutionHost.textContent='Nelze řešit jako kvadratickou nerovnici.';
      stepsHost.innerHTML='';
      svg.innerHTML='';
      showMessage(s.linear?'warn':'error',s.msg);
      queueMath();
      return;
    }

    clearMessage();
    renderEquations(s);
    renderSteps(s);
    drawGraph(s);
  }

  function randInt(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }
  function choice(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

  function randomVal(diff,min,max){
    if(diff==='easy') return randInt(min,max);
    return randInt(min*2,max*2)/2;
  }

  function generate(){
    const diff=document.getElementById('ineqDifficulty').value;
    let type=document.getElementById('ineqRootType').value;
    if(type==='random') type=choice(['two','double','none']);

    const A=diff==='easy'
      ? choice([-2,-1,1,2])
      : choice([-2,-1.5,-1,-0.5,0.5,1,1.5,2]);

    let B,C;

    if(type==='two'){
      let r1=randomVal(diff,-4,1);
      let r2=randomVal(diff,2,5);
      if(Math.abs(r1-r2)<1) r2=r1+(diff==='easy'?2:1.5);
      B=clean(-A*(r1+r2));
      C=clean(A*r1*r2);
    }else if(type==='double'){
      const r=randomVal(diff,-4,4);
      B=clean(-2*A*r);
      C=clean(A*r*r);
    }else{
      const p=randomVal(diff,-3,3);
      const qMag=diff==='easy'?randInt(1,5):randInt(2,10)/2;
      const q=A>0?qMag:-qMag;
      B=clean(-2*A*p);
      C=clean(A*p*p+q);
    }

    let ra=randomVal(diff,-2,2);
    let rb=randomVal(diff,-3,3);
    let rc=randomVal(diff,-4,4);
    if(Math.abs(ra)<EPS && Math.abs(rb)<EPS && Math.abs(rc)<EPS) rc=1;

    const la=clean(A+ra);
    const lb=clean(B+rb);
    const lc=clean(C+rc);

    el.la.value=la; el.lb.value=lb; el.lc.value=lc;
    el.ra.value=ra; el.rb.value=rb; el.rc.value=rc;
    render();
  }

  ids.forEach(id=>el[id].addEventListener('input',render));
  opEl.addEventListener('change',render);

  document.getElementById('ineqGenerate').addEventListener('click',generate);
  document.getElementById('ineqGenerateTop').addEventListener('click',generate);
  document.getElementById('ineqReset').addEventListener('click',()=>{
    el.la.value=2; el.lb.value=-3; el.lc.value=-5;
    el.ra.value=1; el.rb.value=1; el.rc.value=-1;
    opEl.value='>';
    render();
  });

  render();
})();