  function renderProperties(){
    const {a,b,c}=state;
    const {p,q}=vertexData();
    const D=discriminant();
    const rd=rootsData();

    let rootsText = rd.type==='none' ? 'žádné reálné kořeny'
      : rd.type==='double' ? `x₁ = x₂ = ${fmt(rd.roots[0])}`
      : `x₁ = ${fmt(rd.roots[0])}, x₂ = ${fmt(rd.roots[1])}`;

    const yRange = a>0 ? `H(f) = ⟨${fmt(q)}; +∞)` : `H(f) = (−∞; ${fmt(q)}⟩`;
    const mono = a>0
      ? `klesá na ${interval(-Infinity,p)}, roste na ${interval(p,Infinity)}`
      : `roste na ${interval(-Infinity,p)}, klesá na ${interval(p,Infinity)}`;
    const extremum = a>0 ? `minimum ${fmt(q)} pro x = ${fmt(p)}` : `maximum ${fmt(q)} pro x = ${fmt(p)}`;
    const opening = a>0 ? 'konvexní' : 'konkávní';
    const parity = Math.abs(b)<EPS ? 'sudá (souměrná podle osy y)' : 'obecně není sudá ani lichá';
    const bounded = a>0 ? `zdola omezená číslem ${fmt(q)}` : `shora omezená číslem ${fmt(q)}`;

    const vertexCalc =
      `<strong>1. metoda – pomocí vzorce</strong>` +
      `<br>Použijeme vztah pro x-ovou souřadnici vrcholu:` +
      mathDisplay(`x_V=-\\frac{b}{2a}`) +
      `Dosadíme:` +
      mathDisplay(
        `x_V=-\\frac{(${texNum(b)})}{2\\cdot(${texNum(a)})}=${texNum(p)}`
      ) +
      `Potom dosadíme ${mathInline(`x_V=${texNum(p)}`)} do funkce:` +
      mathDisplay(
        `y_V=f(${texNum(p)})=
        (${texNum(a)})\\cdot(${texNum(p)})^2+
        (${texNum(b)})\\cdot(${texNum(p)})+
        (${texNum(c)})=${texNum(q)}`
      ) +
      `Tedy ${mathInline(`V=[${texNum(p)};${texNum(q)}]`)}.` +
      `<br><br><strong>2. metoda – pomocí vrcholového tvaru</strong>` +
      `<br>Převedeme funkci do tvaru:` +
      mathDisplay(`f(x)=a(x-p)^2+q`) +
      `Pro aktuální funkci dostaneme:` +
      mathDisplay(`f(x)=${texNum(a)}\\left(x-(${texNum(p)})\\right)^2+(${texNum(q)})`) +
      `Z vrcholového tvaru vrchol přímo odečteme:` +
      mathDisplay(`V=[p;q]=[${texNum(p)};${texNum(q)}]`);

    const axisCalc =
      `Osa souměrnosti prochází vrcholem svisle:` +
      mathDisplay(`x=x_V=-\\frac{b}{2a}=${texNum(p)}`);

    const yIntersectionCalc =
      `Na ose ${mathInline('y')} je ${mathInline('x=0')}. Dosadíme:` +
      mathDisplay(
        `f(0)=${texNum(a)}\\cdot0^2+(${texNum(b)})\\cdot0+(${texNum(c)})=${texNum(c)}`
      ) +
      `Proto ${mathInline(`Y=[0;${texNum(c)}]`)}.`;

    const discrCalc =
      mathDisplay(
        `D=b^2-4ac=(${texNum(b)})^2-4\\cdot(${texNum(a)})\\cdot(${texNum(c)})=${texNum(D)}`
      );

    const props = [
      ['Definiční obor','D(f) = ℝ',
        `Kvadratický mnohočlen neobsahuje jmenovatel ani odmocninu s proměnnou, proto je definován pro každé reálné číslo: ${mathInline('D(f)=\\mathbb{R}')}.`],
      ['Obor hodnot',yRange,
        `Vrchol má souřadnici ${mathInline(`y_V=${texNum(q)}`)}. Protože ${mathInline(`a=${texNum(a)}`)} je ${a>0?'kladné':'záporné'}, funkce je ${a>0?'konvexní':'konkávní'}.` +
        mathDisplay(a>0 ? `H(f)=\\langle ${texNum(q)};+\\infty)` : `H(f)=(-\\infty;${texNum(q)}\\rangle`)],
      ['Vrchol',`V = [${fmt(p)}; ${fmt(q)}]`,vertexCalc],
      ['Osa souměrnosti',`x = ${fmt(p)}`,axisCalc],
      ['Průsečík s osou y',`Y = [0; ${fmt(c)}]`,yIntersectionCalc],
      ['Průsečíky s osou x',rootsText,rootsCalculationHtml()],
      ['Diskriminant',`D = ${fmt(D)}`,discrCalc],
      ['Směr paraboly',opening,
        `Rozhoduje znaménko koeficientu ${mathInline('a')}. Zde ${mathInline(`a=${texNum(a)}`)}, takže funkce je ${a>0?'konvexní':'konkávní'}.`],
      ['Monotónnost',mono,
        `Změna nastává ve vrcholu ${mathInline(`x_V=${texNum(p)}`)}. Pro ${mathInline(a>0?'a>0':'a<0')} je funkce před vrcholem ${a>0?'klesající':'rostoucí'} a za vrcholem ${a>0?'rostoucí':'klesající'}.`],
      ['Extrém',extremum,
        `Extrém je ve vrcholu ${mathInline(`V=[${texNum(p)};${texNum(q)}]`)}. Protože ${mathInline(a>0?'a>0':'a<0')}, jde o ${a>0?'minimum':'maximum'}.`],
      ['Omezenost',bounded,
        `Z oboru hodnot plyne, že funkce ${a>0?'nemůže klesnout pod':'nemůže vystoupat nad'} hodnotu ${mathInline(texNum(q))}.`],
      ['Sudost / lichost',parity,
        Math.abs(b)<EPS
          ? `Protože ${mathInline('b=0')}, platí ${mathInline('f(-x)=f(x)')}; graf je souměrný podle osy ${mathInline('y')}.`
          : `Protože ${mathInline(`b=${texNum(b)}\\neq0`)}, osa souměrnosti obecně není osa ${mathInline('y')}. Kvadratická funkce s ${mathInline('a\\neq0')} zároveň nemůže být lichá.`],
      ['Znaménko funkce',signText(),
        `Znaménko určíme z kořenů a ze směru paraboly.<br>${rootsCalculationHtml()}`,true]
    ];

    if(window.MathJax && window.MathJax.typesetClear){
      window.MathJax.typesetClear([propertiesGrid]);
    }

    propertiesGrid.innerHTML = props.map(([k,v,calc,wide])=>`
      <div class="prop ${wide?'wide':''}">
        <div class="k">${k}</div>
        <div class="v">${v}</div>
        <details>
          <summary>Jak se to zjistí?</summary>
          <div class="prop-calc">${calc}</div>
        </details>
      </div>
    `).join('');

    queueMathJax();
  }

  function calcDetails(title, body, open=false){
    return `<details class="calc" ${open?'open':''}><summary>${title}</summary><div class="calc-body">${body}</div></details>`;
  }
  function step(html){ return `<div class="calc-step">${html}</div>`; }
  function result(html){ return `<div class="calc-result">${html}</div>`; }

