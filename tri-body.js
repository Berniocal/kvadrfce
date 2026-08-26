(() => {
  const EPS = 1e-9;
  const ids = ['x1','y1','x2','y2','x3','y3'];
  const inputs = Object.fromEntries(ids.map(id => [id, document.getElementById(id)]));
  const message = document.getElementById('message');
  const solutionHost = document.getElementById('solutionHost');
  const svg = document.getElementById('graph');
  let mathQueue = Promise.resolve();

  const clean = n => Math.abs(n) < EPS ? 0 : Math.round(n * 1e6) / 1e6;
  const fmt = n => {
    n = clean(n);
    return (Number.isInteger(n) ? String(n) : String(Math.round(n * 1000) / 1000)).replace('-', '−').replace('.', ',');
  };
  const tex = n => {
    n = clean(n);
    return (Number.isInteger(n) ? String(n) : String(Math.round(n * 1000) / 1000)).replace('.', '{,}');
  };
  const md = t => `\\[${t}\\]`;
  const mi = t => `\\(${t}\\)`;
  const step = h => `<div class="tri-step">${h}</div>`;
  const answer = h => `<div class="tri-answer">${h}</div>`;
  const details = (title, body) => `<details class="tri-calc"><summary>${title}</summary><div class="tri-body">${body}</div></details>`;

  function queueMath(){
    if(!window.MathJax?.typesetPromise) return;
    mathQueue = mathQueue.then(() => {
      if(window.MathJax.typesetClear) window.MathJax.typesetClear([solutionHost]);
      return window.MathJax.typesetPromise([solutionHost]);
    }).catch(() => {});
  }

  function points(){
    const p = [
      {name:'A',x:Number(inputs.x1.value),y:Number(inputs.y1.value)},
      {name:'B',x:Number(inputs.x2.value),y:Number(inputs.y2.value)},
      {name:'C',x:Number(inputs.x3.value),y:Number(inputs.y3.value)}
    ];
    return p.every(q => Number.isFinite(q.x) && Number.isFinite(q.y)) ? p : null;
  }

  function solve(p){
    if(!p) return {ok:false,msg:'Vyplň všech šest souřadnic čísly.'};
    if(Math.abs(p[0].x-p[1].x)<EPS || Math.abs(p[0].x-p[2].x)<EPS || Math.abs(p[1].x-p[2].x)<EPS)
      return {ok:false,msg:'Body musí mít tři různé x-ové souřadnice.'};

    const [P,Q,R]=p;
    const A1=Q.x*Q.x-P.x*P.x, B1=Q.x-P.x, C1=Q.y-P.y;
    const A2=R.x*R.x-P.x*P.x, B2=R.x-P.x, C2=R.y-P.y;
    const det=A1*B2-A2*B1;
    if(Math.abs(det)<EPS) return {ok:false,msg:'Z těchto bodů nelze jednoznačně určit funkci.'};
    const a=(C1*B2-C2*B1)/det;
    const b=(C1-A1*a)/B1;
    const c=P.y-a*P.x*P.x-b*P.x;
    return {ok:true,a:clean(a),b:clean(b),c:clean(c),p,isQuadratic:Math.abs(a)>=EPS};
  }

  function coeffTerm(v,name,first=false){
    v=clean(v); if(Math.abs(v)<EPS) return '';
    const neg=v<0, abs=Math.abs(v);
    const body=(Math.abs(abs-1)<EPS?'':tex(abs))+name;
    return first ? (neg?'-':'')+body : (neg?' - ':' + ')+body;
  }

  function linear(A,B,C,R){
    const t=[[A,'a'],[B,'b'],[C,'c']].filter(([v])=>Math.abs(v)>=EPS);
    let left=''; t.forEach(([v,n],i)=>left+=coeffTerm(v,n,i===0));
    return `${left||'0'}=${tex(R)}`;
  }
  function two(A,B,R){
    const t=[[A,'a'],[B,'b']].filter(([v])=>Math.abs(v)>=EPS);
    let left=''; t.forEach(([v,n],i)=>left+=coeffTerm(v,n,i===0));
    return `${left||'0'}=${tex(R)}`;
  }
  function poly(a,b,c){
    const t=[[a,'x^2'],[b,'x'],[c,'']].filter(([v])=>Math.abs(v)>=EPS);
    let out='';
    t.forEach(([v,n],i)=>{
      const neg=v<0, abs=Math.abs(v);
      const body=n ? (Math.abs(abs-1)<EPS?'':tex(abs))+n : tex(abs);
      out += i===0 ? (neg?'-':'')+body : (neg?' - ':' + ')+body;
    });
    return out||'0';
  }
  function displayPoly(a,b,c){ return 'f(x) = '+poly(a,b,c).replace(/\\?/g,'').replace(/x\^2/,'x²').replace(/\{,\}/g,','); }

  function gcd(a,b){ a=Math.abs(Math.round(a)); b=Math.abs(Math.round(b)); while(b){[a,b]=[b,a%b]} return a||1; }
  function normalize(A,B,R){
    let v=[clean(A),clean(B),clean(R)], scale=1;
    for(const s of [1,2,4,5,10,20,100]) if(v.every(x=>Math.abs(x*s-Math.round(x*s))<1e-8)){scale=s;break}
    v=v.map(x=>clean(x*scale));
    if(v.every(x=>Math.abs(x-Math.round(x))<1e-8)){
      let g=0; v.forEach(x=>{if(Math.abs(x)>=EPS)g=g?gcd(g,x):Math.abs(Math.round(x))});
      if(g>1)v=v.map(x=>clean(x/g));
    }
    const first=Math.abs(v[0])>=EPS?v[0]:v[1];
    if(first<0)v=v.map(x=>clean(-x));
    return {A:v[0],B:v[1],R:v[2]};
  }

  function solveTwoSmart(e1raw,e2raw,a,b){
    const e1=normalize(e1raw.A,e1raw.B,e1raw.R), e2=normalize(e2raw.A,e2raw.B,e2raw.R);
    let h=step(`Po zkrácení máme:${md(`\\begin{aligned}${two(e1.A,e1.B,e1.R)}\\\\${two(e2.A,e2.B,e2.R)}\\end{aligned}`)}`);

    const direct=[e1,e2].find(e=>Math.abs(e.A)<EPS || Math.abs(e.B)<EPS);
    if(direct){
      const other=direct===e1?e2:e1;
      if(Math.abs(direct.A)<EPS){
        h+=step(`První jednoduchá neznámá:${md(two(direct.A,direct.B,direct.R))}${md(`b=\\frac{${tex(direct.R)}}{${tex(direct.B)}}=${tex(b)}`)}`);
        const rhs=clean(other.R-other.B*b);
        h+=step(`Dosadíme ${mi(`b=${tex(b)}`)}:${md(`${coeffTerm(other.A,'a',true)}=${tex(rhs)}`)}${md(`a=${tex(a)}`)}`);
      }else{
        h+=step(`První jednoduchá neznámá:${md(two(direct.A,direct.B,direct.R))}${md(`a=\\frac{${tex(direct.R)}}{${tex(direct.A)}}=${tex(a)}`)}`);
        const rhs=clean(other.R-other.A*a);
        h+=step(`Dosadíme ${mi(`a=${tex(a)}`)}:${md(`${coeffTerm(other.B,'b',true)}=${tex(rhs)}`)}${md(`b=${tex(b)}`)}`);
      }
      return h+answer(`Máme ${mi(`a=${tex(a)}`)} a ${mi(`b=${tex(b)}`)}.`);
    }

    const combos=[
      {ok:Math.abs(e1.B-e2.B)<EPS,v:'a',coef:clean(e1.A-e2.A),rhs:clean(e1.R-e2.R),txt:'Rovnice odečteme'},
      {ok:Math.abs(e1.B+e2.B)<EPS,v:'a',coef:clean(e1.A+e2.A),rhs:clean(e1.R+e2.R),txt:'Rovnice sečteme'},
      {ok:Math.abs(e1.A-e2.A)<EPS,v:'b',coef:clean(e1.B-e2.B),rhs:clean(e1.R-e2.R),txt:'Rovnice odečteme'},
      {ok:Math.abs(e1.A+e2.A)<EPS,v:'b',coef:clean(e1.B+e2.B),rhs:clean(e1.R+e2.R),txt:'Rovnice sečteme'}
    ].find(x=>x.ok&&Math.abs(x.coef)>=EPS);
    if(combos){
      const val=combos.v==='a'?a:b;
      h+=step(`${combos.txt}:${md(`${coeffTerm(combos.coef,combos.v,true)}=${tex(combos.rhs)}`)}${md(`${combos.v}=\\frac{${tex(combos.rhs)}}{${tex(combos.coef)}}=${tex(val)}`)}`);
      const e=e1;
      if(combos.v==='a') h+=step(`Dosadíme ${mi(`a=${tex(a)}`)}:${md(`${coeffTerm(e.B,'b',true)}=${tex(clean(e.R-e.A*a))}`)}${md(`b=${tex(b)}`)}`);
      else h+=step(`Dosadíme ${mi(`b=${tex(b)}`)}:${md(`${coeffTerm(e.A,'a',true)}=${tex(clean(e.R-e.B*b))}`)}${md(`a=${tex(a)}`)}`);
      return h+answer(`Máme ${mi(`a=${tex(a)}`)} a ${mi(`b=${tex(b)}`)}.`);
    }

    const eliminateB=Math.abs(e1.B)+Math.abs(e2.B)<=Math.abs(e1.A)+Math.abs(e2.A);
    let m1,m2,coef,rhs,v,val;
    if(eliminateB){m1=e2.B;m2=e1.B;coef=clean(m1*e1.A-m2*e2.A);rhs=clean(m1*e1.R-m2*e2.R);v='a';val=a}
    else{m1=e2.A;m2=e1.A;coef=clean(m1*e1.B-m2*e2.B);rhs=clean(m1*e1.R-m2*e2.R);v='b';val=b}
    h+=step(`Teprve teď použijeme eliminaci ${mi(eliminateB?'b':'a')}. Vynásobíme rovnice co nejmenšími vhodnými čísly:${md(`${tex(m1)}\\cdot(1.\\,\\text{rovnice}),\\qquad ${tex(m2)}\\cdot(2.\\,\\text{rovnice})`)}`);
    h+=step(`Po odečtení:${md(`${coeffTerm(coef,v,true)}=${tex(rhs)}`)}${md(`${v}=\\frac{${tex(rhs)}}{${tex(coef)}}=${tex(val)}`)}`);
    const e=e1;
    if(v==='a') h+=step(`Dosadíme ${mi(`a=${tex(a)}`)}:${md(`${coeffTerm(e.B,'b',true)}=${tex(clean(e.R-e.A*a))}`)}${md(`b=${tex(b)}`)}`);
    else h+=step(`Dosadíme ${mi(`b=${tex(b)}`)}:${md(`${coeffTerm(e.A,'a',true)}=${tex(clean(e.R-e.B*b))}`)}${md(`a=${tex(a)}`)}`);
    return h+answer(`Máme ${mi(`a=${tex(a)}`)} a ${mi(`b=${tex(b)}`)}.`);
  }

  function renderSolution(sol){
    if(!sol.ok || !sol.isQuadratic){solutionHost.innerHTML='';return}
    const p=sol.p,[A,B,C]=p,{a,b,c}=sol;
    const rows=p.map(P=>`Pro bod ${mi(`${P.name}=[${tex(P.x)};${tex(P.y)}]`)}:${md(`${tex(P.y)}=a\\cdot(${tex(P.x)})^2+b\\cdot(${tex(P.x)})+c`)}${md(linear(P.x*P.x,P.x,1,P.y))}`).join('');
    const system=step(`<strong>1.</strong> Začneme obecným tvarem:${md('f(x)=ax^2+bx+c')}`)+step(`<strong>2.</strong> Závorky necháme jen v prvním dosazení a hned potom rovnici upravíme:${rows}`)+answer(`Dostaneme soustavu:${md(`\\begin{aligned}${linear(A.x*A.x,A.x,1,A.y)}\\\\${linear(B.x*B.x,B.x,1,B.y)}\\\\${linear(C.x*C.x,C.x,1,C.y)}\\end{aligned}`)}`);
    const blocks=[details('1. Sestavení soustavy ze tří bodů',system)];

    const zero=p.find(P=>Math.abs(P.x)<EPS);
    let sym=null;
    for(let i=0;i<3&&!sym;i++)for(let j=i+1;j<3;j++)if(Math.abs(p[i].x+p[j].x)<EPS&&Math.abs(p[i].x)>=EPS)sym=[p[i],p[j]];

    if(zero){
      blocks.push(details('2. Nejprve spočítáme nejjednodušší koeficient c',step(`Máme bod ${mi(`${zero.name}=[0;${tex(zero.y)}]`)}. Pro ${mi('x=0')} oba členy s x zmizí:${md(`${tex(zero.y)}=c`)}`)+answer(`${md(`c=${tex(c)}`)}`)));
      const o=p.filter(P=>P!==zero);
      const e1={A:o[0].x*o[0].x,B:o[0].x,R:clean(o[0].y-c)},e2={A:o[1].x*o[1].x,B:o[1].x,R:clean(o[1].y-c)};
      blocks.push(details('3. Dopočítáme a a b co nejjednodušší cestou',step(`Dosadíme ${mi(`c=${tex(c)}`)}:${md(two(e1.A,e1.B,e1.R))}${md(two(e2.A,e2.B,e2.R))}`)+solveTwoSmart(e1,e2,a,b)));
    }else if(sym){
      const [P,Q]=sym,R=p.find(x=>x!==P&&x!==Q);
      const db=clean(Q.x-P.x),dy=clean(Q.y-P.y);
      blocks.push(details('2. Nejprve spočítáme nejjednodušší koeficient b',step(`Body ${mi(P.name)} a ${mi(Q.name)} mají opačné x. Odečtením se zruší členy s ${mi('a')} i ${mi('c')}:${md(linear(P.x*P.x,P.x,1,P.y))}${md(linear(Q.x*Q.x,Q.x,1,Q.y))}${md(`${coeffTerm(db,'b',true)}=${tex(dy)}`)}${md(`b=${tex(b)}`)}`)+answer(`Tedy ${mi(`b=${tex(b)}`)}.`)));
      const e1=normalize(P.x*P.x,1,clean(P.y-P.x*b)),e2=normalize(R.x*R.x,1,clean(R.y-R.x*b));
      const da=clean(e2.A-e1.A),dr=clean(e2.R-e1.R);
      blocks.push(details('3. Dopočítáme a a c',step(`Dosadíme ${mi(`b=${tex(b)}`)}:${md(`${coeffTerm(e1.A,'a',true)} + c=${tex(e1.R)}`)}${md(`${coeffTerm(e2.A,'a',true)} + c=${tex(e2.R)}`)}`)+step(`Odečteme:${md(`${coeffTerm(da,'a',true)}=${tex(dr)}`)}${md(`a=${tex(a)}`)}`)+step(`Dosadíme zpět:${md(`c=${tex(c)}`)}`)+answer(`${md(`a=${tex(a)},\\qquad b=${tex(b)},\\qquad c=${tex(c)}`)}`)));
    }else{
      let best=null;
      for(let base=0;base<3;base++){
        const other=[0,1,2].filter(i=>i!==base);
        const E=other.map(i=>normalize(p[i].x*p[i].x-p[base].x*p[base].x,p[i].x-p[base].x,p[i].y-p[base].y));
        const score=E.reduce((z,e)=>z+Math.abs(e.A)+Math.abs(e.B)+Math.abs(e.R),0)-(E.some(e=>Math.abs(e.A)<EPS||Math.abs(e.B)<EPS)?1000:0);
        if(!best||score<best.score)best={base,other,E,score};
      }
      blocks.push(details('2. Odstraníme c a rovnice co nejvíc zjednodušíme',step(`Žádný koeficient nejde přečíst okamžitě, proto odstraníme ${mi('c')} odečtením vhodné dvojice rovnic.`)+answer(`${md(`\\begin{aligned}${two(best.E[0].A,best.E[0].B,best.E[0].R)}\\\\${two(best.E[1].A,best.E[1].B,best.E[1].R)}\\end{aligned}`)}`)));
      blocks.push(details('3. Spočítáme a a b',solveTwoSmart(best.E[0],best.E[1],a,b)));
      const P=[...p].sort((u,v)=>Math.abs(u.x)-Math.abs(v.x))[0];
      blocks.push(details('4. Dopočítáme c',step(`Použijeme bod s nejjednodušším x, ${mi(`${P.name}=[${tex(P.x)};${tex(P.y)}]`)}. Po dosazení známých ${mi(`a=${tex(a)}`)} a ${mi(`b=${tex(b)}`)} vyjde:${md(`c=${tex(c)}`)}`)+answer(`Tedy ${mi(`c=${tex(c)}`)}.`)));
    }

    blocks.push(details(`${blocks.length+1}. Sestavení výsledného předpisu`,step(`Dosadíme koeficienty do:${md('f(x)=ax^2+bx+c')}`)+step(`Po úpravě znamének:${md(`f(x)=${poly(a,b,c)}`)}`)+answer(`${md(`\\boxed{f(x)=${poly(a,b,c)}}`)}`)));
    solutionHost.innerHTML=blocks.join('');
    queueMath();
  }

  function factor(x){x=clean(x);return Math.abs(x)<EPS?'(x − 0)':x>0?`(x − ${fmt(x)})`:`(x + ${fmt(Math.abs(x))})`}
  function forms(sol){
    const {a,b,c}=sol,p=clean(-b/(2*a)),q=clean(a*p*p+b*p+c),D=clean(b*b-4*a*c);
    const vertex=`f(x) = ${fmt(a)}(x ${p>=0?'−':'+'} ${fmt(Math.abs(p))})² ${q>=0?'+':'−'} ${fmt(Math.abs(q))}`;
    let factored='v ℝ nelze zapsat';
    if(D>=-EPS){const sd=Math.sqrt(Math.max(0,D)),x1=clean((-b-sd)/(2*a)),x2=clean((-b+sd)/(2*a));factored=`f(x) = ${fmt(a)}${factor(x1)}${factor(x2)}`}
    return {vertex,factored};
  }

  function nice(span){const raw=span/10,p=10**Math.floor(Math.log10(raw)),m=raw/p;return (m<1.5?1:m<3.5?2:m<7.5?5:10)*p}
  function draw(sol){
    const p=sol?.p||points()||[]; if(!p.length){svg.innerHTML='';return}
    const W=900,H=560,pad=44; let xs=p.map(q=>q.x),ys=p.map(q=>q.y),xmin=Math.min(...xs)-3,xmax=Math.max(...xs)+3;
    if(sol?.ok&&sol.isQuadratic){const xv=-sol.b/(2*sol.a);xmin=Math.min(xmin,xv-2);xmax=Math.max(xmax,xv+2);for(let i=0;i<200;i++){const x=xmin+(xmax-xmin)*i/199;ys.push(sol.a*x*x+sol.b*x+sol.c)}}
    let ymin=Math.min(...ys),ymax=Math.max(...ys),sp=ymax-ymin;if(sp<8){ymin-=4;ymax+=4}else{ymin-=sp*.12;ymax+=sp*.12}
    const sx=x=>pad+(x-xmin)/(xmax-xmin)*(W-2*pad),sy=y=>H-pad-(y-ymin)/(ymax-ymin)*(H-2*pad),dx=nice(xmax-xmin),dy=nice(ymax-ymin);let o=[`<rect width="${W}" height="${H}" fill="white"/>`];
    for(let x=Math.ceil(xmin/dx)*dx;x<=xmax+EPS;x+=dx){const px=sx(x);o.push(`<line x1="${px}" y1="${pad}" x2="${px}" y2="${H-pad}" stroke="var(--grid)"/>`);if(Math.abs(x)>EPS)o.push(`<text x="${px}" y="${H-pad+18}" text-anchor="middle" font-size="12" fill="var(--axis)">${fmt(x)}</text>`)}
    for(let y=Math.ceil(ymin/dy)*dy;y<=ymax+EPS;y+=dy){const py=sy(y);o.push(`<line x1="${pad}" y1="${py}" x2="${W-pad}" y2="${py}" stroke="var(--grid)"/>`);if(Math.abs(y)>EPS)o.push(`<text x="${pad-8}" y="${py+4}" text-anchor="end" font-size="12" fill="var(--axis)">${fmt(y)}</text>`)}
    if(xmin<=0&&xmax>=0){const px=sx(0);o.push(`<line x1="${px}" y1="${pad}" x2="${px}" y2="${H-pad}" stroke="var(--axis)" stroke-width="1.8"/>`)}
    if(ymin<=0&&ymax>=0){const py=sy(0);o.push(`<line x1="${pad}" y1="${py}" x2="${W-pad}" y2="${py}" stroke="var(--axis)" stroke-width="1.8"/>`)}
    if(sol?.ok&&sol.isQuadratic){let d='';for(let i=0;i<=500;i++){const x=xmin+(xmax-xmin)*i/500,y=sol.a*x*x+sol.b*x+sol.c;d+=(i?' L ':'M ')+sx(x).toFixed(2)+' '+sy(y).toFixed(2)}o.push(`<path d="${d}" fill="none" stroke="var(--curve)" stroke-width="4"/>`)}
    const cols=['#087a55','#c11574','#d97706'];p.forEach((q,i)=>{const x=sx(q.x),y=sy(q.y);o.push(`<circle cx="${x}" cy="${y}" r="7" fill="${cols[i]}" stroke="white" stroke-width="2"/><text x="${x+11}" y="${y-11}" font-size="13" font-weight="800" fill="${cols[i]}" paint-order="stroke" stroke="white" stroke-width="4">${q.name} [${fmt(q.x)}; ${fmt(q.y)}]</text>`)});svg.innerHTML=o.join('');
  }

  function render(){
    const sol=solve(points());
    if(!sol.ok){message.className='tri-message show error';message.textContent=sol.msg;['mainFormula','coefA','coefB','coefC','generalForm','vertexForm','factoredForm'].forEach(id=>document.getElementById(id).textContent='—');solutionHost.innerHTML='';draw({p:points()||[]});return}
    if(!sol.isQuadratic){message.className='tri-message show warn';message.textContent='Tyto tři body leží na přímce. Vyjde a = 0, takže nejde o parabolu.'}else{message.className='tri-message';message.textContent=''}
    document.getElementById('coefA').textContent=fmt(sol.a);document.getElementById('coefB').textContent=fmt(sol.b);document.getElementById('coefC').textContent=fmt(sol.c);
    if(sol.isQuadratic){const g=displayPoly(sol.a,sol.b,sol.c),f=forms(sol);document.getElementById('mainFormula').textContent=g;document.getElementById('generalForm').textContent=g;document.getElementById('vertexForm').textContent=f.vertex;document.getElementById('factoredForm').textContent=f.factored;renderSolution(sol)}else{document.getElementById('mainFormula').textContent='Nejde o kvadratickou funkci';solutionHost.innerHTML=''}
    draw(sol);
  }

  const choice=a=>a[Math.floor(Math.random()*a.length)],rand=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
  function generate(){
    const medium=document.getElementById('difficulty').value==='medium';let a,b,c,xs,ys,g=0;
    do{g++;a=medium?choice([-2,-1.5,-1,-.5,.5,1,1.5,2]):choice([-2,-1,1,2]);b=medium?choice([-2.5,-2,-1.5,-1,-.5,.5,1,1.5,2,2.5]):choice([-4,-3,-2,-1,1,2,3,4]);c=medium?choice([-4,-3,-2,-1,-.5,.5,1,2,3,4]):choice([-5,-4,-3,-2,-1,1,2,3,4,5]);xs=medium?[rand(-6,-2)/2,rand(-1,3)/2,rand(4,8)/2]:[rand(-4,-1),rand(0,2),rand(3,5)];ys=xs.map(x=>clean(a*x*x+b*x+c))}while((new Set(xs).size<3||Math.max(...ys.map(Math.abs))>24)&&g<200);
    [inputs.x1.value,inputs.x2.value,inputs.x3.value]=xs;[inputs.y1.value,inputs.y2.value,inputs.y3.value]=ys;render();
  }

  ids.forEach(id=>inputs[id].addEventListener('input',render));
  document.getElementById('generateBtn').addEventListener('click',generate);
  document.getElementById('generateTop').addEventListener('click',generate);
  document.getElementById('resetBtn').addEventListener('click',()=>{inputs.x1.value=-2;inputs.y1.value=9;inputs.x2.value=0;inputs.y2.value=1;inputs.x3.value=3;inputs.y3.value=4;render()});
  render();
})();
