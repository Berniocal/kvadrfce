  function niceStep(span){
    const raw=span/10;
    const pow=Math.pow(10,Math.floor(Math.log10(raw)));
    const m=raw/pow;
    const n=m<1.5?1:m<3.5?2:m<7.5?5:10;
    return n*pow;
  }

  function drawGraph(){
    const W=900,H=560,pad=44;
    const {p,q}=vertexData();
    const rd=rootsData();

    let xMin=p-8*zoomFactor, xMax=p+8*zoomFactor;
    if(rd.type==='two'){
      xMin=Math.min(xMin,rd.roots[0]-3*zoomFactor);
      xMax=Math.max(xMax,rd.roots[1]+3*zoomFactor);
    }
    xMin=Math.min(xMin,-2*zoomFactor);
    xMax=Math.max(xMax,2*zoomFactor);

    const yAtMin=state.a*xMin*xMin+state.b*xMin+state.c;
    const yAtMax=state.a*xMax*xMax+state.b*xMax+state.c;
    const candidates=[q,state.c,yAtMin,yAtMax,0];
    let yMin=Math.min(...candidates), yMax=Math.max(...candidates);
    let ySpan=yMax-yMin;
    if(ySpan<8){yMin-=4;yMax+=4;}
    else{
      const extra=ySpan*.12;
      yMin-=extra;yMax+=extra;
    }
    if(yMin===yMax){yMin-=5;yMax+=5}

    const sx=x=>pad+(x-xMin)/(xMax-xMin)*(W-2*pad);
    const sy=y=>H-pad-(y-yMin)/(yMax-yMin)*(H-2*pad);

    const xStep=niceStep(xMax-xMin);
    const yStep=niceStep(yMax-yMin);

    let parts=[];
    parts.push(`<rect x="0" y="0" width="${W}" height="${H}" fill="white"/>`);

    for(let x=Math.ceil(xMin/xStep)*xStep;x<=xMax+EPS;x+=xStep){
      const px=sx(x);
      parts.push(`<line x1="${px}" y1="${pad}" x2="${px}" y2="${H-pad}" stroke="var(--grid)" stroke-width="1"/>`);
      if(Math.abs(x)>EPS) parts.push(`<text x="${px}" y="${Math.min(H-pad+18,H-8)}" text-anchor="middle" font-size="12" fill="var(--axis)">${fmt(x)}</text>`);
    }
    for(let y=Math.ceil(yMin/yStep)*yStep;y<=yMax+EPS;y+=yStep){
      const py=sy(y);
      parts.push(`<line x1="${pad}" y1="${py}" x2="${W-pad}" y2="${py}" stroke="var(--grid)" stroke-width="1"/>`);
      if(Math.abs(y)>EPS) parts.push(`<text x="${Math.max(pad-8,8)}" y="${py+4}" text-anchor="end" font-size="12" fill="var(--axis)">${fmt(y)}</text>`);
    }

    if(0>=xMin && 0<=xMax){
      const px=sx(0);
      parts.push(`<line x1="${px}" y1="${pad}" x2="${px}" y2="${H-pad}" stroke="var(--axis)" stroke-width="1.8"/>`);
      parts.push(`<text x="${px+9}" y="${pad+14}" font-size="13" fill="var(--axis)">y</text>`);
    }
    if(0>=yMin && 0<=yMax){
      const py=sy(0);
      parts.push(`<line x1="${pad}" y1="${py}" x2="${W-pad}" y2="${py}" stroke="var(--axis)" stroke-width="1.8"/>`);
      parts.push(`<text x="${W-pad-10}" y="${py-8}" font-size="13" fill="var(--axis)">x</text>`);
    }

    if(p>=xMin && p<=xMax){
      const px=sx(p);
      parts.push(`<line x1="${px}" y1="${pad}" x2="${px}" y2="${H-pad}" stroke="var(--vertex)" stroke-width="1.4" stroke-dasharray="7 6" opacity=".55"/>`);
    }

    let d='';
    const N=600;
    for(let i=0;i<=N;i++){
      const x=xMin+(xMax-xMin)*i/N;
      const y=state.a*x*x+state.b*x+state.c;
      const px=sx(x), py=sy(y);
      if(py < -1000 || py > H+1000) continue;
      d += (d?' L ':'M ')+px.toFixed(2)+' '+py.toFixed(2);
    }
    parts.push(`<path d="${d}" fill="none" stroke="var(--curve)" stroke-width="4" stroke-linecap="round"/>`);

    function point(x,y,color,label,dx=10,dy=-10){
      if(x<xMin||x>xMax||y<yMin||y>yMax) return;
      const px=sx(x),py=sy(y);
      parts.push(`<circle cx="${px}" cy="${py}" r="6" fill="${color}" stroke="white" stroke-width="2"/>`);
      parts.push(`<text x="${px+dx}" y="${py+dy}" font-size="13" font-weight="700" fill="${color}" paint-order="stroke" stroke="white" stroke-width="4">${label}</text>`);
    }

    point(p,q,'var(--vertex)',`V [${fmt(p)}; ${fmt(q)}]`);
    point(0,state.c,'var(--intercept)',`Y [0; ${fmt(state.c)}]`,10,18);
    if(rd.type==='double'){
      point(rd.roots[0],0,'var(--root)',`x = ${fmt(rd.roots[0])}`,10,-10);
    } else if(rd.type==='two'){
      point(rd.roots[0],0,'var(--root)',`x₁ = ${fmt(rd.roots[0])}`,10,-10);
      point(rd.roots[1],0,'var(--root)',`x₂ = ${fmt(rd.roots[1])}`,10,20);
    }

    parts.push(`<rect x="${pad}" y="${pad}" width="${W-2*pad}" height="${H-2*pad}" fill="none" stroke="var(--line)" stroke-width="1"/>`);
    svg.innerHTML=parts.join('');
    document.getElementById('graphRangeNote').textContent =
      `Zobrazeno přibližně x ∈ ⟨${fmt(xMin)}; ${fmt(xMax)}⟩, y ∈ ⟨${fmt(yMin)}; ${fmt(yMax)}⟩`;
  }

  function updateDerived(rerenderControls=true){
    updateEquations();
    renderProperties();
    renderCalculations();
    drawGraph();
    if(rerenderControls) renderControls();
  }

  function renderAll(){
    updateEquations();
    renderControls();
    renderProperties();
    renderCalculations();
    drawGraph();
  }

  function randInt(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }
  function randChoice(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
  function nonzeroA(difficulty){
    if(difficulty==='easy') return randChoice([-3,-2,-1,1,2,3]);
    return randChoice([-2.5,-2,-1.5,-1,-.5,.5,1,1.5,2,2.5]);
  }
  function randomVal(difficulty,min=-6,max=6){
    if(difficulty==='easy') return randInt(min,max);
    return Math.round((min+Math.random()*(max-min))*2)/2;
  }

  function randomNonzeroVal(difficulty,min=-6,max=6){
    let value=0;
    let guard=0;
    while(Math.abs(value)<EPS && guard<100){
      value=randomVal(difficulty,min,max);
      guard++;
    }
    return Math.abs(value)<EPS ? 1 : value;
  }

  function generalHasAllTerms(candidate){
    return Math.abs(candidate.a)>EPS
      && Math.abs(candidate.b)>EPS
      && Math.abs(candidate.c)>EPS;
  }

  function generate(){
    const rootSelect=document.getElementById('rootType');
    const difficulty=document.getElementById('difficulty').value;
    const requestedRootType=rootSelect.value;
    const a=nonzeroA(difficulty);

    if(mode!=='power') rootChoiceByMode[mode]=requestedRootType;

    // Každý aktivní tvar má vlastní pravidla:
    // Obecný: vždy musí být přítomny všechny členy ax² + bx + c, tedy a,b,c ≠ 0.
    // Vrcholový: generujeme přímo a,p,q.
    // Součinový: vždy dvě závorky a reálné kořeny.
    // Mocninový: vždy a(x+b)².

    if(mode==='general'){
      let candidate=null;
      let guard=0;

      while(!candidate || !generalHasAllTerms(candidate)){
        guard++;

        if(requestedRootType==='random'){
          candidate={
            a,
            b:randomNonzeroVal(difficulty,-8,8),
            c:randomNonzeroVal(difficulty,-8,8)
          };

        } else if(requestedRootType==='two'){
          let x1=randomVal(difficulty,-6,4);
          let x2=randomVal(difficulty,-4,6);

          if(Math.abs(x1-x2)<.5){
            x2=x1+(difficulty==='easy'?randChoice([1,2,3]):1.5);
          }

          candidate={
            a,
            b:-a*(x1+x2),
            c:a*x1*x2
          };

        } else if(requestedRootType==='double'){
          // x0 nesmí být 0, jinak by c=0.
          const x0=randomNonzeroVal(difficulty,-5,5);
          candidate={
            a,
            b:-2*a*x0,
            c:a*x0*x0
          };

        } else {
          // D < 0 a zároveň b,c ≠ 0.
          const p=randomNonzeroVal(difficulty,-4,4);
          const qMagnitude=difficulty==='easy'
            ? randInt(1,6)
            : Math.round((1+Math.random()*5)*2)/2;
          const q=a>0?qMagnitude:-qMagnitude;

          candidate={
            a,
            b:-2*a*p,
            c:a*p*p+q
          };
        }

        if(guard>200){
          candidate={
            a,
            b:2,
            c:a>0?3:-3
          };
          break;
        }
      }

      state=candidate;

    } else if(mode==='vertex' && requestedRootType==='random'){
      const p=randomVal(difficulty,-5,5);
      const q=randomVal(difficulty,-7,7);
      state={
        a,
        b:-2*a*p,
        c:a*p*p+q
      };

    } else if(mode==='power'){
      const insideB=randomVal(difficulty,-5,5);
      state={
        a,
        b:2*a*insideB,
        c:a*insideB*insideB
      };

    } else {
      let type;

      if(mode==='factored'){
        if(requestedRootType==='double') type='double';
        else if(requestedRootType==='two') type='two';
        else type=randChoice(['two','double']);
      } else {
        type=requestedRootType==='random'
          ? randChoice(['two','double','none'])
          : requestedRootType;
      }

      if(type==='two'){
        let x1 = mode==='factored'
          ? randomNonzeroVal(difficulty,-6,4)
          : randomVal(difficulty,-6,4);

        let x2 = mode==='factored'
          ? randomNonzeroVal(difficulty,-4,6)
          : randomVal(difficulty,-4,6);

        if(Math.abs(x1-x2)<.5){
          const shift=difficulty==='easy'?randChoice([1,2,3]):1.5;
          x2=x1+shift;

          // V součinovém tvaru nechceme ani po posunu kořen 0.
          if(mode==='factored' && Math.abs(x2)<EPS){
            x2=x1-shift;
          }
        }

        // Poslední pojistka: v součinovém tvaru musí být v obou závorkách číslo ≠ 0.
        if(mode==='factored'){
          if(Math.abs(x1)<EPS) x1=1;
          if(Math.abs(x2)<EPS) x2=-1;
          if(Math.abs(x1-x2)<EPS) x2=x1+(difficulty==='easy'?1:0.5);
        }

        state={
          a,
          b:-a*(x1+x2),
          c:a*x1*x2
        };

      } else if(type==='double'){
        const x0 = mode==='factored'
          ? randomNonzeroVal(difficulty,-5,5)
          : randomVal(difficulty,-5,5);

        state={
          a,
          b:-2*a*x0,
          c:a*x0*x0
        };

      } else {
        const p=randomVal(difficulty,-4,4);
        const qMagnitude=difficulty==='easy'
          ? randInt(1,6)
          : Math.round((1+Math.random()*5)*2)/2;
        const q=a>0?qMagnitude:-qMagnitude;

        state={
          a,
          b:-2*a*p,
          c:a*p*p+q
        };
      }
    }

    state={
      a:clean(state.a),
      b:clean(state.b),
      c:clean(state.c)
    };

    zoomFactor=1;
    renderAll();
  }

  document.querySelectorAll('.tab').forEach(btn=>btn.addEventListener('click',()=>setMode(btn.dataset.mode)));
  document.getElementById('randomBtn').addEventListener('click',generate);
  document.getElementById('randomBtnTop').addEventListener('click',generate);
  document.getElementById('rootType').addEventListener('change',(e)=>{ if(mode!=='power') rootChoiceByMode[mode]=e.target.value; });
  document.getElementById('resetBtn').addEventListener('click',()=>{
    state={a:1,b:-4,c:3}; mode='general'; zoomFactor=1;
    rootChoiceByMode.general='random';
    rootChoiceByMode.vertex='random';
    rootChoiceByMode.factored='random';
    rootChoiceByMode.power='double';
    document.querySelectorAll('.tab').forEach(b=>b.classList.toggle('active',b.dataset.mode===mode));
    updateGeneratorOptions();
    renderAll();
  });
  document.getElementById('zoomIn').addEventListener('click',()=>{zoomFactor=Math.max(.35,zoomFactor*.72);drawGraph()});
  document.getElementById('zoomOut').addEventListener('click',()=>{zoomFactor=Math.min(4,zoomFactor*1.4);drawGraph()});
  document.getElementById('zoomReset').addEventListener('click',()=>{zoomFactor=1;drawGraph()});

  updateGeneratorOptions();
  renderAll();
