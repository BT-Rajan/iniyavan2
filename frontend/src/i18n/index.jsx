import {createContext,useCallback,useContext,useEffect,useMemo,useState} from 'react'
import en from './en.js'
import ar from './ar.js'

// Languages the app ships with. `dir` is the direction a language reads in by default.
export const LOCALES={en:{name:'English',dir:'ltr',messages:en},ar:{name:'العربية',dir:'rtl',messages:ar}}
export const DIRECTIONS=['ltr','rtl']

// Storage can be blocked (private mode). Preferences then last only for the page visit.
const read=k=>{try{return localStorage.getItem(k)}catch{return null}}
const write=(k,v)=>{try{v==null?localStorage.removeItem(k):localStorage.setItem(k,v)}catch{/* private mode */}}

// "Hello {name}" + {name:'Asha'} → "Hello Asha". A missing value keeps its {placeholder} visible so gaps are easy to spot.
export const format=(s,vars)=>vars?s.replace(/\{(\w+)\}/g,(m,k)=>vars[k]??m):s

const I18nCtx=createContext(null)

export function I18nProvider({children}){
  const saved=read('lang')
  const [lang,setLangState]=useState(LOCALES[saved]?saved:'en')
  // null = follow the language's own direction. The toggle stores an explicit choice.
  const [dirPref,setDirPref]=useState(()=>DIRECTIONS.includes(read('dir'))?read('dir'):null)
  const dir=dirPref??LOCALES[lang].dir

  useEffect(()=>{const r=document.documentElement;r.lang=lang;r.dir=dir},[lang,dir])

  const setLang=l=>{if(!LOCALES[l])return;setLangState(l);write('lang',l)}
  const setDir=d=>{if(d!==null&&!DIRECTIONS.includes(d))return;setDirPref(d);write('dir',d)}

  const t=useCallback((key,vars)=>format(LOCALES[lang].messages[key]??en[key]??key,vars),[lang])
  const value=useMemo(()=>({t,lang,setLang,dir,setDir,dirPref}),[t,lang,dir,dirPref])
  return <I18nCtx.Provider value={value}>{children}</I18nCtx.Provider>
}

export function useI18n(){
  const c=useContext(I18nCtx)
  if(!c)throw new Error('useI18n must be used inside <I18nProvider>')
  return c
}
