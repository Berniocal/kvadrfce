  // Upřesnění lehké obtížnosti: v zadání nezobrazujeme desetinné koeficienty.
  // Reálné průsečíky mohou být jednoduché zlomky, ale předpis zůstává celočíselný.
  function easyTwoRootState(requireNonzero=false,requireAllTerms=false){
    // Ve vrcholovém tvaru chceme v lehké obtížnosti celé a, p, q.
    // Zvolíme tedy celočíselný vrchol a celočíselnou vzdálenost kořenů od osy souměrnosti.
    if(mode==='vertex'){
      const a=nonzeroA('easy');
      const p=randInt(-4,4);
      const distance=randInt(1,4);
      const q=-a*distance*distance;
      return {
        a,
        b:-2*a*p,
        c:a*p*p+q
      };
    }

    // V součinovém tvaru používáme v lehké obtížnosti celé kořeny,
    // aby se v samotném zadání neobjevovala desetinná čísla.
    if(mode==='factored'){
      for(let guard=0;guard<100;guard++){
        let x1=randInt(-5,5);
        let x2=randInt(-5,5);
        if(requireNonzero && x1===0) x1=randChoice([-5,-4,-3,-2,-1,1,2,3,4,5]);
        if(requireNonzero && x2===0) x2=randChoice([-5,-4,-3,-2,-1,1,2,3,4,5]);
        if(x1===x2) continue;
        const a=nonzeroA('easy');
        return {a,b:-a*(x1+x2),c:a*x1*x2};
      }
      return {a:1,b:-3,c:2};
    }

    // V obecném tvaru může být jeden kořen hezký zlomek.
    // Koeficient a zvolíme jako jeho jmenovatel, takže a, b, c vyjdou celá čísla.
    for(let guard=0;guard<200;guard++){
      const fractional=easyRoot(-5,5,requireNonzero,[1,2,3,4,5,8,10]);
      let integer=randInt(-5,5);
      if(requireNonzero && integer===0) integer=randChoice([-5,-4,-3,-2,-1,1,2,3,4,5]);
      if(Math.abs(fractional.value-integer)<.25) continue;
      if(requireAllTerms && Math.abs(fractional.value+integer)<EPS) continue;

      const a=randChoice([-1,1])*fractional.den;
      const candidate={
        a,
        b:-a*(fractional.value+integer),
        c:a*fractional.value*integer
      };

      if(requireAllTerms && !generalHasAllTerms(candidate)) continue;
      return candidate;
    }

    return {a:1,b:-3,c:2};
  }

  function easyDoubleRootState(requireNonzero=false,requireAllTerms=false){
    // Ve vrcholovém, součinovém a mocninovém tvaru necháme dvojnásobný kořen celý,
    // aby se desetinné číslo neobjevilo přímo v zadání.
    if(mode==='vertex' || mode==='factored' || mode==='power'){
      let x0=randInt(-5,5);
      if(requireNonzero && x0===0) x0=randChoice([-5,-4,-3,-2,-1,1,2,3,4,5]);
      const a=nonzeroA('easy');
      return {
        a,
        b:-2*a*x0,
        c:a*x0*x0
      };
    }

    // V obecném tvaru může být dvojnásobný kořen jednoduchý zlomek.
    // Násobkem jmenovatele² zajistíme celé koeficienty a, b, c.
    for(let guard=0;guard<200;guard++){
      const root=easyRoot(-5,5,requireNonzero,[1,2,3,4]);
      const a=randChoice([-1,1])*root.den*root.den;
      const candidate={
        a,
        b:-2*a*root.value,
        c:a*root.value*root.value
      };

      if(requireAllTerms && !generalHasAllTerms(candidate)) continue;
      return candidate;
    }

    return {a:1,b:-2,c:1};
  }
