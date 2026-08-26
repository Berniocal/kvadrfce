  function renderCalculations(){
    const {a,b,c}=state;
    const {p,q}=vertexData();
    const D=discriminant();
    const rd=rootsData();
    const ba=clean(b/a);
    const half=clean(b/(2*a));

    const generalTex = `${texNum(a)}x^2+(${texNum(b)})x+(${texNum(c)})`;
    const vertexTex =
      `${texNum(a)}\\left(x-${texNum(p)}\\right)^2+(${texNum(q)})`;

    let toVertex =
      step(`<strong>1.</strong> Začneme obecným tvarem:` +
        mathDisplay(`f(x)=ax^2+bx+c`) +
        `Dosadíme koeficienty:` +
        mathDisplay(`f(x)=${generalTex}`)) +

      step(`<strong>2.</strong> Vytkneme ${mathInline('a')} z členů s ${mathInline('x')}:` +
        mathDisplay(
          `f(x)=a\\left[x^2+\\frac{b}{a}x\\right]+c`
        ) +
        `Dosadíme:` +
        mathDisplay(
          `f(x)=${texNum(a)}\\left[x^2+\\frac{${texNum(b)}}{${texNum(a)}}x\\right]+(${texNum(c)})`
        ) +
        mathDisplay(
          `f(x)=${texNum(a)}\\left[x^2+(${texNum(ba)})x\\right]+(${texNum(c)})`
        )) +

      step(`<strong>3.</strong> Doplníme na čtverec. Použijeme:` +
        mathDisplay(
          `x^2+mx=\\left(x+\\frac m2\\right)^2-\\left(\\frac m2\\right)^2`
        ) +
        `Zde je ${mathInline(`m=${texNum(ba)}`)}, takže:` +
        mathDisplay(
          `x^2+(${texNum(ba)})x=
          \\left(x+(${texNum(half)})\\right)^2-
          \\left(${texNum(half)}\\right)^2`
        )) +

      step(`<strong>4.</strong> Dosadíme tento zápis zpět:` +
        mathDisplay(
          `f(x)=${texNum(a)}
          \\left[
            \\left(x+(${texNum(half)})\\right)^2-
            \\left(${texNum(half)}\\right)^2
          \\right]+(${texNum(c)})`
        ) +
        `Upravíme konstantní člen:` +
        mathDisplay(
          `f(x)=${texNum(a)}
          \\left(x+(${texNum(half)})\\right)^2+
          (${texNum(q)})`
        )) +

      result(`Výsledek:` + mathDisplay(`f(x)=${vertexTex}`));

    let toFactored =
      step(`<strong>1.</strong> Položíme ${mathInline('f(x)=0')}:` +
        mathDisplay(`ax^2+bx+c=0`) +
        `Dosadíme:` +
        mathDisplay(`${generalTex}=0`)) +

      step(`<strong>2.</strong> Spočítáme diskriminant:` +
        mathDisplay(`D=b^2-4ac`) +
        `Dosadíme:` +
        mathDisplay(
          `D=(${texNum(b)})^2-4\\cdot(${texNum(a)})\\cdot(${texNum(c)})=${texNum(D)}`
        ));

    if(rd.type==='none'){
      toFactored += result(
        `${mathInline('D<0')} ⇒ v reálných číslech nejsou kořeny, proto součinový tvar nad ${mathInline('\\mathbb{R}')} neexistuje.`
      );
    } else if(rd.type==='double'){
      const x0=rd.roots[0];
      toFactored +=
        step(`<strong>3.</strong> Dvojnásobný kořen:` +
          mathDisplay(`x_0=-\\frac{b}{2a}`) +
          `Dosadíme:` +
          mathDisplay(
            `x_0=\\frac{-(${texNum(b)})}{2\\cdot(${texNum(a)})}=${texNum(x0)}`
          )) +
        step(`<strong>4.</strong> Dosadíme kořen do součinového tvaru:` +
          mathDisplay(`f(x)=a(x-x_1)(x-x_2)`) +
          mathDisplay(
            `f(x)=(${texNum(a)})
            \\left(x-(${texNum(x0)})\\right)
            \\left(x-(${texNum(x0)})\\right)`
          )) +
        result(`Výsledek:` +
          mathDisplay(
            `f(x)=${texNum(a)}
            \\left(x-${texNum(x0)}\\right)
            \\left(x-${texNum(x0)}\\right)`
          ));
    } else {
      const [x1,x2]=rd.roots;
      toFactored +=
        step(`<strong>3.</strong> Spočítáme oba kořeny:` +
          mathDisplay(
            `x_1=\\frac{-b-\\sqrt D}{2a},\\qquad
             x_2=\\frac{-b+\\sqrt D}{2a}`
          ) +
          `Dosadíme:` +
          mathDisplay(
            `x_1=
            \\frac{-(${texNum(b)})-\\sqrt{${texNum(D)}}}
                 {2\\cdot(${texNum(a)})}
            =${texNum(x1)}`
          ) +
          mathDisplay(
            `x_2=
            \\frac{-(${texNum(b)})+\\sqrt{${texNum(D)}}}
                 {2\\cdot(${texNum(a)})}
            =${texNum(x2)}`
          )) +

        step(`<strong>4.</strong> Dosadíme do součinového tvaru:` +
          mathDisplay(`f(x)=a(x-x_1)(x-x_2)`) +
          mathDisplay(
            `f(x)=(${texNum(a)})
            \\left(x-(${texNum(x1)})\\right)
            \\left(x-(${texNum(x2)})\\right)`
          )) +

        result(`Výsledek:` +
          mathDisplay(
            `f(x)=${texNum(a)}
            \\left(x-${texNum(x1)}\\right)
            \\left(x-${texNum(x2)}\\right)`
          ));
    }

    let vertexToGeneral =
      step(`<strong>1.</strong> Začneme vrcholovým tvarem:` +
        mathDisplay(`f(x)=a(x-p)^2+q`) +
        `Dosadíme:` +
        mathDisplay(`f(x)=${vertexTex}`)) +

      step(`<strong>2.</strong> Použijeme vzorec:` +
        mathDisplay(`(x-p)^2=x^2-2px+p^2`) +
        `Dosadíme ${mathInline(`p=${texNum(p)}`)}:` +
        mathDisplay(
          `\\left(x-(${texNum(p)})\\right)^2=
          x^2-2\\cdot(${texNum(p)})x+(${texNum(p)})^2`
        )) +

      step(`<strong>3.</strong> Dosadíme zpět koeficient ${mathInline(`a=${texNum(a)}`)} a ${mathInline(`q=${texNum(q)}`)}:` +
        mathDisplay(
          `f(x)=(${texNum(a)})
          \\left[
            x^2-2\\cdot(${texNum(p)})x+(${texNum(p)})^2
          \\right]+(${texNum(q)})`
        ) +
        `Roznásobíme a sečteme:` +
        mathDisplay(
          `f(x)=${texNum(a)}x^2+
          (${texNum(clean(-2*a*p))})x+
          (${texNum(clean(a*p*p+q))})`
        )) +

      result(`Výsledek:` + mathDisplay(`f(x)=${generalTex}`));

    let factoredToGeneral;
    if(rd.type==='none'){
      factoredToGeneral = result(
        `Aktuální funkce nemá součinový tvar nad ${mathInline('\\mathbb{R}')}, takže tento převod není k dispozici.`
      );
    } else {
      const x1=rd.roots[0];
      const x2=rd.type==='double'?rd.roots[0]:rd.roots[1];

      factoredToGeneral =
        step(`<strong>1.</strong> Začneme součinovým tvarem:` +
          mathDisplay(`f(x)=a(x-x_1)(x-x_2)`) +
          `Dosadíme:` +
          mathDisplay(
            `f(x)=(${texNum(a)})
            \\left(x-(${texNum(x1)})\\right)
            \\left(x-(${texNum(x2)})\\right)`
          )) +

        step(`<strong>2.</strong> Roznásobíme závorky pomocí:` +
          mathDisplay(
            `(x-x_1)(x-x_2)=x^2-(x_1+x_2)x+x_1x_2`
          ) +
          `Dosadíme kořeny:` +
          mathDisplay(
            `(x-(${texNum(x1)}))(x-(${texNum(x2)}))=
            x^2-\\left[(${texNum(x1)})+(${texNum(x2)})\\right]x+
            (${texNum(x1)})\\cdot(${texNum(x2)})`
          ) +
          mathDisplay(
            `=x^2-(${texNum(clean(x1+x2))})x+(${texNum(clean(x1*x2))})`
          )) +

        step(`<strong>3.</strong> Vynásobíme koeficientem ${mathInline(`a=${texNum(a)}`)}:` +
          mathDisplay(
            `f(x)=(${texNum(a)})
            \\left[
              x^2-(${texNum(clean(x1+x2))})x+
              (${texNum(clean(x1*x2))})
            \\right]`
          ) +
          mathDisplay(`f(x)=${generalTex}`)) +

        result(`Výsledek:` + mathDisplay(`f(x)=${generalTex}`));
    }

    let powerCalc;
    const pd=powerData();
    if(!pd){
      powerCalc =
        step(
          `Pro tvar ${mathInline('a(x+b)^2')} musí platit ${mathInline('D=0')} a ${mathInline('y_V=0')}.` +
          `Dosadíme aktuální hodnoty:` +
          mathDisplay(`D=${texNum(D)},\\qquad y_V=${texNum(q)}`)
        ) +
        result(`Aktuální funkci do čistého mocninového tvaru ${mathInline('a(x+b)^2')} převést nelze.`);
    } else {
      const x0=rd.roots[0];
      powerCalc =
        step(`<strong>1.</strong> Máme dvojnásobný kořen:` +
          mathDisplay(`D=0,\\qquad x_0=${texNum(x0)}`)) +

        step(`<strong>2.</strong> Ve tvaru ${mathInline('a(x+b)^2')} platí ${mathInline('x_0=-b')}:` +
          mathDisplay(`b=-x_0`) +
          `Dosadíme:` +
          mathDisplay(`b=-(${texNum(x0)})=${texNum(pd.insideB)}`)) +

        step(`<strong>3.</strong> Dosadíme ${mathInline('a')} a ${mathInline('b')}:` +
          mathDisplay(
            `f(x)=(${texNum(a)})
            \\left(x+(${texNum(pd.insideB)})\\right)^2`
          )) +

        result(`Výsledek:` +
          mathDisplay(
            `f(x)=${texNum(a)}
            \\left(x+${texNum(pd.insideB)}\\right)^2`
          )) +

        step(`<strong>Kontrola rozvinutím:</strong>` +
          mathDisplay(`a(x+b)^2=ax^2+2abx+ab^2`) +
          `Dosadíme:` +
          mathDisplay(
            `(${texNum(a)})
            \\left(x+(${texNum(pd.insideB)})\\right)^2
            =${generalTex}`
          ));
    }

    const intersections =
      calcDetails(
        'Průsečík s osou y',
        step(`Na ose ${mathInline('y')} je ${mathInline('x=0')}.`) +
        step(`Dosadíme do funkce:` +
          mathDisplay(`f(x)=ax^2+bx+c`) +
          mathDisplay(
            `f(0)=(${texNum(a)})\\cdot0^2+
            (${texNum(b)})\\cdot0+
            (${texNum(c)})=${texNum(c)}`
          )) +
        result(`Průsečík:` + mathDisplay(`Y=[0;${texNum(c)}]`))
      ) +

      calcDetails(
        'Průsečíky s osou x',
        step(`Na ose ${mathInline('x')} platí ${mathInline('y=0')}, proto řešíme kvadratickou rovnici:` +
          mathDisplay(`ax^2+bx+c=0`) +
          `Dosadíme:` +
          mathDisplay(`${generalTex}=0`)) +
        step(rootsCalculationHtml()) +
        result(
          rd.type==='none'
            ? 'Žádné reálné průsečíky s osou x.'
            : rd.type==='double'
              ? `Průsečík:` + mathDisplay(`X=[${texNum(rd.roots[0])};0]`)
              : `Průsečíky:` + mathDisplay(
                  `X_1=[${texNum(rd.roots[0])};0],\\qquad
                   X_2=[${texNum(rd.roots[1])};0]`
                )
        )
      ) +

      calcDetails(
        'Vrchol a osa souměrnosti',
        step(`<strong>1. metoda – pomocí vzorce</strong><br>Nejprve použijeme:` +
          mathDisplay(`x_V=-\\frac{b}{2a}`) +
          `Dosadíme:` +
          mathDisplay(
            `x_V=-\\frac{(${texNum(b)})}
                         {2\\cdot(${texNum(a)})}
            =${texNum(p)}`
          )) +

        step(`Potom dopočítáme y-ovou souřadnici dosazením ${mathInline(`x_V=${texNum(p)}`)}:` +
          mathDisplay(
            `y_V=f(${texNum(p)})=
            (${texNum(a)})\\cdot(${texNum(p)})^2+
            (${texNum(b)})\\cdot(${texNum(p)})+
            (${texNum(c)})=${texNum(q)}`
          )) +

        result(`Výsledek 1. metody:` +
          mathDisplay(
            `V=[${texNum(p)};${texNum(q)}],\\qquad
             \\text{osa souměrnosti: }x=${texNum(p)}`
          )) +

        step(`<strong>2. metoda – pomocí vrcholového tvaru</strong><br>Převedeme funkci do tvaru:` +
          mathDisplay(`f(x)=a(x-p)^2+q`) +
          `Pro tuto funkci vyjde:` +
          mathDisplay(
            `f(x)=${texNum(a)}\\left(x-(${texNum(p)})\\right)^2+(${texNum(q)})`
          )) +

        step(`Z vrcholového tvaru přímo odečteme:` +
          mathDisplay(
            `p=${texNum(p)},\\qquad q=${texNum(q)}`
          ) +
          mathDisplay(
            `V=[p;q]=[${texNum(p)};${texNum(q)}]`
          )) +

        result(`Výsledek 2. metody:` +
          mathDisplay(
            `V=[${texNum(p)};${texNum(q)}],\\qquad
             \\text{osa souměrnosti: }x=${texNum(p)}`
          ))
      );

    if(window.MathJax && window.MathJax.typesetClear){
      window.MathJax.typesetClear([calculationsHost]);
    }

    calculationsHost.innerHTML =
      calcDetails('Obecný → vrcholový (doplnění na čtverec)',toVertex)+
      calcDetails('Obecný → součinový',toFactored)+
      calcDetails('Vrcholový → obecný',vertexToGeneral)+
      calcDetails('Součinový → obecný',factoredToGeneral)+
      calcDetails('Mocninový tvar a(x + b)²',powerCalc)+
      intersections;

    queueMathJax();
  }

