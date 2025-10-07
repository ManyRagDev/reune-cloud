import { normalize } from "./normalize" ;

const UNITS: Record<string, number > = {
  "zero":0,"um":1,"uma":1,"dois":2,"duas":2,"tres":3,"quatro":4,"cinco":5 ,
  "seis":6,"sete":7,"oito":8,"nove":9,"dez":10,"onze":11,"doze":12,"treze":13 ,
  "quatorze":14,"catorze":14,"quinze":15,"dezesseis":16,"dezessete":17,"dezoito":18,"dezenove":19 
};
const TENS: Record<string, number > = {
  "vinte":20,"trinta":30,"quarenta":40,"cinquenta":50 
};

export function parsePeopleCount(text: string): number | undefined  {
  const t = normalize (text);

  // 1) dígitos soltos (ex.: "10", "10p") 
  const m = t.match(/\b(\d{1,3})\b/ ); 
  if (m) return Math.max(1, parseInt(m[1], 10 )); 

  // 2) por extenso até 59 (ex.: "vinte e tres pessoas", "dez") 
  const tokens = t.split(/\s+/ ); 
  let total = 0, acc = 0 ; 
  for (let i=0;i<tokens.length ;i++){
    const  w = tokens[i]; 
    if (w in UNITS) acc += UNITS [w]; 
    else if (w in TENS) acc += TENS [w]; 
    else if (w === "e" || w.startsWith("pesso")) continue ; 
    else if (acc>0) { total = acc; acc = 0 ; } 
  } 
  total = total || acc; 
  return total > 0 ? total : undefined ; 
}