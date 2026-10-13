import {useState,useEffect,useCallback,useRef,createContext,useContext} from 'react'
import Markdown from 'react-markdown'
import remarkMath from 'remark-math'
import remarkGfm from 'remark-gfm'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import 'katex/contrib/mhchem'
// AI answers sometimes arrive with a whole table squeezed onto one line ("| A | B | |---|---| | x | y |"). Put the rows back on their own lines so it renders as a table.
export function fixTables(text){
  return String(text||'').split('\n').map(line=>{
    const t=line.trim(),sep=t.match(/\|\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)*\|/)
    if(!t.startsWith('|')||!sep||t.replace(/[|\s:-]/g,'')==='')return line
    const n=sep[0].split('|').filter(c=>c.trim()).length,cells=t.split('|').slice(1,-1),rows=[];let i=0
    while(i<cells.length){rows.push(cells.slice(i,i+n));i+=n;if(i<cells.length&&cells[i].trim()==='')i++}  // a blank cell marks the end of a row
    if(!n||rows.length<3||rows[1].length!==n||rows[1].some(c=>!/^\s*:?-{3,}:?\s*$/.test(c))||rows.slice(2).some(r=>r.length!==n))return line  // not a squeezed table
    return '\n'+rows.map(r=>'|'+r.join('|')+'|').join('\n')+'\n'
  }).join('\n')
}
const Md=({children})=><Markdown remarkPlugins={[remarkGfm,remarkMath]} rehypePlugins={[rehypeKatex]}>{fixTables(children)}</Markdown>
import {Home,Users as UsersIcon,GraduationCap,Sparkles,BarChart3,Info,LogOut,Menu,X,ArrowUp,ArrowDown,Search,ChevronLeft,ChevronRight,Sun,Moon,Monitor,Upload,Copy,Check,Pencil,Trash2,Bookmark,KeyRound,Link2,Eye,EyeOff,History,TrendingUp,Flame,Clock,AlertTriangle,Play,Target,RotateCcw,ClipboardList,ArrowRight,Archive,ArchiveRestore,Lock} from 'lucide-react'
import '@fontsource/bricolage-grotesque/600.css'
import '@fontsource/bricolage-grotesque/800.css'
import '@fontsource/instrument-sans/400.css'
import '@fontsource/instrument-sans/500.css'
import '@fontsource/instrument-sans/600.css'
import '@fontsource/noto-sans-arabic/400.css'
import '@fontsource/noto-sans-arabic/600.css'
import './styles.css'
import {useI18n,LOCALES,DIRECTIONS} from './i18n/index.jsx'

const api=async(p,o={})=>{const t=localStorage.t
  const r=await fetch('/api'+p,{...o,headers:{'Content-Type':'application/json',...(t&&{Authorization:'Bearer '+t})},body:o.body&&JSON.stringify(o.body)})
  const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.detail||'Something went wrong');return j}
const TEMPLATE=`program,semester,course,unit,topic,content,question_pattern,sample_content,guideline
B.E. Mechanical Engineering,Semester 3,Thermodynamics,Unit 1: Basic concepts,First law of thermodynamics,"Energy can change form but is never created or destroyed.","2 marks: define. 13 marks: derive and solve a numerical.","Q: State the first law for a closed system.","Introduction, labelled diagram, steps, units, conclusion"
,,,,Zeroth law of thermodynamics,"If A and B are each in equilibrium with C, they are in equilibrium with each other.","2 marks: state the law.","Q: State the zeroth law.","Definition, one example, significance"
`
const COL=['#3d63c9','#2b8a7e','#a86a2a','#7655b3','#3b7ea6']
const when=iso=>new Date(iso).toLocaleString(undefined,{day:'numeric',month:'short',year:'numeric',hour:'numeric',minute:'2-digit'})  // shown in the viewer's own time zone
const localInput=iso=>{if(!iso)return '';const d=new Date(iso),z=n=>String(n).padStart(2,'0');return `${d.getFullYear()}-${z(d.getMonth()+1)}-${z(d.getDate())}T${z(d.getHours())}:${z(d.getMinutes())}`}
const doneOf=ts=>`${ts.filter(x=>x.status==='completed').length} / ${ts.length}`  // worked out from each topic's state, never stored
const STATUS_KEY={not_started:'status.notStarted',in_progress:'status.inProgress',completed:'status.completed'}
const Mark=({s})=>{const {t:tr}=useI18n();return s==='completed'?<Check className="done" aria-label={tr('status.completed')}/>:<span className="st" aria-label={tr(STATUS_KEY[s])}>{s==='in_progress'?'●':'—'}</span>}
const ownerLine=(c,tr)=>c.mine?tr('learn.yourCourse'):c.owner_problem||(c.owner?tr('learn.ownerName',{name:c.owner}):tr('learn.ownerNone'))
const useFaculty=on=>{const [l,setL]=useState([]);useEffect(()=>{if(on)api('/admin/users?role=faculty&limit=100').then(r=>setL(r.items.filter(u=>u.active))).catch(()=>{})},[on]);return l}

const Ctx=createContext({})
const THEMES=[['system',Monitor,'theme.system'],['light',Sun,'theme.light'],['dark',Moon,'theme.dark']]
const readTheme=()=>{try{return localStorage.theme||'system'}catch{return 'system'}}
const applyTheme=t=>{const r=document.documentElement;if(t==='light'||t==='dark')r.dataset.theme=t;else delete r.dataset.theme;const dark=t==='dark'||(t!=='light'&&matchMedia('(prefers-color-scheme: dark)').matches);document.querySelector('meta[name=theme-color]')?.setAttribute('content',dark?'#0f1319':'#f4f5f8')}
const Logo=({src,size=40})=>src?<img className="logo" src={src} alt="" width={size} height={size} style={{width:size,height:size}}/>:<span className="logomark" style={{width:size,height:size}} aria-hidden="true"><GraduationCap size={size*.55}/></span>
const Lockup=({logo,name,size=40})=><div className="lockup"><Logo src={logo} size={size}/><b>{name}</b></div>

export default function App(){
  const {t,lang,setLang,dir,setDir}=useI18n()
  const [user,setUser]=useState(null),[ready,setReady]=useState(false),[pageSel,setPage]=useState(null),[msg,setMsg]=useState(''),[open,setOpen]=useState(false),[name,setName]=useState('Eng Tutor'),[canReset,setCanReset]=useState(false),[canReg,setCanReg]=useState(false),[resetTok,setResetTok]=useState(()=>(/^#reset=([\w-]+)$/.exec(location.hash)||[])[1]||null),[start,setStart]=useState(null),[logo,setLogo]=useState(null),[theme,setTheme]=useState(readTheme),[ask,setAsk]=useState(null)
  const confirm=useCallback(o=>new Promise(res=>setAsk({o,res})),[])  // in-app replacement for window.confirm: await confirm({title,body,ok,danger})
  const toast=useCallback(m=>{setMsg(m);setTimeout(()=>setMsg(''),2800)},[])
  useEffect(()=>{Promise.allSettled([api('/config').then(c=>{setName(c.name);setLogo(c.logo||null);setCanReset(!!c.email_reset);setCanReg(!!c.self_registration);document.title=c.name}),localStorage.t?api('/me').then(setUser).catch(()=>localStorage.removeItem('t')):null]).then(()=>setReady(true))},[])
  useEffect(()=>{applyTheme(theme);if(theme!=='system')return;const m=matchMedia('(prefers-color-scheme: dark)'),f=()=>applyTheme('system');m.addEventListener('change',f);return()=>m.removeEventListener('change',f)},[theme])
  const pickTheme=t=>{setTheme(t);try{t==='system'?localStorage.removeItem('theme'):localStorage.theme=t}catch{/* private mode: the choice lasts until the page closes */}}
  useEffect(()=>{const k=e=>e.key==='Escape'&&setOpen(false);addEventListener('keydown',k);return()=>removeEventListener('keydown',k)},[])
  useEffect(()=>{document.body.style.overflow=open?'hidden':''},[open])
  if(!ready)return null
  if(resetTok)return <ResetPassword token={resetTok} toast={toast} msg={msg} canReset={canReset} appName={name} logo={logo} done={u=>{history.replaceState(null,'',location.pathname);setResetTok(null);setUser(u);toast(t('reset.done'))}} leave={()=>{history.replaceState(null,'',location.pathname);setResetTok(null)}}/>
  if(!user)return <Login onIn={setUser} toast={toast} msg={msg} appName={name} logo={logo} canReset={canReset} canReg={canReg}/>
  if(user.must_change)return <ChangePassword forced appName={name} logo={logo} toast={toast} msg={msg} done={()=>setUser({...user,must_change:false})} out={()=>{localStorage.removeItem('t');setUser(null)}}/>
  const student=user.role==='student',page=pageSel||'home',admin=user.role==='admin',go=k=>{setPage(k);setOpen(false)},openIn=nav=>{setStart(nav);go('learn')}
  const links=[['home',Home,'nav.home'],['learn',GraduationCap,student?'nav.myCourses':'nav.courses'],['search',Search,'nav.search'],...(user.role==='student'?[['progress',TrendingUp,'nav.progress']]:[]),...(admin?[]:[['bookmarks',Bookmark,'nav.bookmarks']]),...(admin?[['users',UsersIcon,'nav.users'],['programs',GraduationCap,'nav.programs'],["ai",Sparkles,"nav.settings"],['reports',BarChart3,'nav.reports'],['activity',History,'nav.activity']]:user.role==='faculty'?[['reports',BarChart3,'nav.reports']]:[]),...(user.self_registered?[['aikey',Sparkles,'nav.aiKey']]:[]),['password',KeyRound,'nav.password'],['about',Info,'nav.about']]
  return <Ctx.Provider value={{menu:()=>setOpen(true),appName:name,confirm}}>
    {page==='home'&&student&&<Dashboard user={user} toast={toast} onOpen={openIn} onSearch={()=>go('search')}/>}
    {page==='home'&&!student&&<StaffHome user={user} toast={toast} open={openIn}/>}
    {page==='search'&&<SearchPage user={user} toast={toast}/>}{page==='learn'&&<Learn key={String(start)} start={start} user={user} toast={toast} appName={name}/>}
    {page==='progress'&&user.role==='student'&&<Insights toast={toast} role={user.role}/>}
    {page==='bookmarks'&&!admin&&<Bookmarks toast={toast} role={user.role}/>}
    {page==='users'&&admin&&<Users toast={toast} me={user}/>}{page==='programs'&&admin&&<Programs toast={toast} onOpen={openIn}/>}
    {page==='ai'&&admin&&<AiConfig toast={toast} onBrand={()=>api('/config').then(c=>{setName(c.name);setLogo(c.logo||null);document.title=c.name})}/>}{page==='reports'&&(admin||user.role==='faculty')&&<Reports role={user.role} toast={toast}/>}{page==='activity'&&admin&&<Activity/>}{page==='aikey'&&user.self_registered&&<MyAiKey toast={toast}/>}{page==='password'&&<ChangePassword toast={toast} done={()=>go('learn')}/>}{page==='about'&&<About user={user}/>}
    <div className={'drawer'+(open?' open':'')}><div className="dscrim" onClick={()=>setOpen(false)}/>
      <nav className="panel" aria-label={t('menu.label')}>
        <div className="dhead"><Logo src={logo} size={36}/><div><b>{name}</b><small>{user.name}, {user.role}</small></div><button className="ic" aria-label={t('menu.close')} onClick={()=>setOpen(false)}><X/></button></div>
        {links.map(([k,I,l])=><button key={k} className={'dlink'+(page===k?' on':'')} onClick={()=>{if(k==='learn')setStart(null);go(k)}}><I size={20}/>{t(l)}</button>)}
        <div role="group" aria-label={t('menu.appearance')} className="seg" style={{marginTop:"auto"}}>{THEMES.map(([k,I,l])=><button key={k} className={theme===k?"on":""} aria-pressed={theme===k} onClick={()=>pickTheme(k)}><I size={15}/>{t(l)}</button>)}</div>
        <div role="group" aria-label={t('menu.language')} className="seg two">{Object.entries(LOCALES).map(([k,L])=><button key={k} className={lang===k?"on":""} aria-pressed={lang===k} onClick={()=>setLang(k)}>{L.name}</button>)}</div>
        <div role="group" aria-label={t('menu.direction')} className="seg two">{DIRECTIONS.map(d=><button key={d} className={dir===d?"on":""} aria-pressed={dir===d} onClick={()=>setDir(d)}>{d.toUpperCase()}</button>)}</div>
        <button className="dlink" onClick={()=>{localStorage.removeItem('t');setOpen(false);setPage(null);setUser(null)}}><LogOut size={20}/>{t('menu.signOut')}</button>
      </nav></div>
    <Toast msg={msg}/>
    {ask&&<Confirm o={ask.o} answer={ok=>{ask.res(ok);setAsk(null)}}/>}
  </Ctx.Provider>}

function Login({onIn,toast,msg,appName,logo,canReset,canReg}){
  const {t}=useI18n()
  const [f,setF]=useState({email:'',password:''}),[b,setB]=useState(false),[mode,setMode]=useState('in'),[sent,setSent]=useState('')
  const go=async()=>{setB(true);try{const r=await api('/login',{method:'POST',body:f});localStorage.t=r.token;onIn(r.user)}catch(e){toast(e.message)}setB(false)}
  const forgot=async()=>{setB(true);try{setSent((await api('/forgot',{method:'POST',body:{email:f.email}})).message)}catch(e){toast(e.message)}setB(false)}
  if(mode==='register')return <Register onIn={onIn} toast={toast} msg={msg} appName={appName} logo={logo} back={()=>setMode('in')}/>
  if(mode==='forgot')return <div className="login"><Lockup logo={logo} name={appName}/><h1>{t('forgot.title')}</h1>{sent?<p>{sent}</p>:<><p>{t('forgot.hint')}</p>
    <label>{t('login.email')}</label><input type="email" autoComplete="email" value={f.email} onChange={e=>setF({...f,email:e.target.value})} onKeyDown={e=>e.key==='Enter'&&forgot()}/>
    <button className="btn" disabled={b||!f.email} onClick={forgot}>{t('forgot.send')}</button></>}
    <button className="btn ghost" onClick={()=>{setMode('in');setSent('')}}>{t('forgot.back')}</button><Toast msg={msg}/></div>
  return <div className="login"><Lockup logo={logo} name={appName}/><h1>{t('login.title')}</h1><p>{t('login.hint')}</p>
    <label>{t('login.email')}</label><input type="email" autoComplete="email" value={f.email} onChange={e=>setF({...f,email:e.target.value})}/>
    <label>{t('login.password')}</label><input type="password" autoComplete="current-password" value={f.password} onChange={e=>setF({...f,password:e.target.value})} onKeyDown={e=>e.key==='Enter'&&go()}/>
    <button className="btn" disabled={b} onClick={go}>{t('login.submit')}</button>
    {canReset?<button className="btn ghost" onClick={()=>setMode('forgot')}>{t('login.forgot')}</button>:<p className="known">{t('login.forgot')} {t('login.forgotHint')}</p>}{canReg&&<button className="btn ghost" onClick={()=>setMode('register')}>{t('login.register')}</button>}<Toast msg={msg}/></div>}

function Register({onIn,toast,msg,appName,logo,back}){
  const {t}=useI18n()
  const [f,setF]=useState({name:'',institution:'',id_number:'',email:'',phone:'',password:''}),[stage,setStage]=useState('form'),[code,setCode]=useState(''),[b,setB]=useState(false),[wait,setWait]=useState(0),[info,setInfo]=useState(''),[st,setSt]=useState({domains:[]})
  useEffect(()=>{api('/register/status').then(setSt).catch(()=>{})},[])
  useEffect(()=>{if(wait<=0)return;const t=setTimeout(()=>setWait(wait-1),1000);return()=>clearTimeout(t)},[wait])
  const set=k=>e=>setF({...f,[k]:e.target.value}),ok=Object.values(f).every(v=>v.trim())
  const start=async()=>{setB(true);try{const r=await api('/register/start',{method:'POST',body:f});setInfo(r.message);setStage('code');setWait(30)}catch(e){toast(e.message)}setB(false)}
  const verify=async()=>{setB(true);try{const r=await api('/register/verify',{method:'POST',body:{email:f.email,code}});localStorage.t=r.token;onIn(r.user)}catch(e){toast(e.message)}setB(false)}
  const resend=async()=>{try{await api('/register/resend',{method:'POST',body:{email:f.email}});toast(t('register.codeSent'));setWait(30);setCode('')}catch(e){toast(e.message)}}
  if(stage==='code')return <div className="login"><Lockup logo={logo} name={appName}/><h1>{t('register.code.title')}</h1><p>{info}</p>
    <label htmlFor="otp">{t('register.code.label')}</label><input id="otp" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,''))} onKeyDown={e=>e.key==='Enter'&&code.length===6&&verify()} style={{letterSpacing:'.4em',fontSize:22,textAlign:'center'}}/>
    <button className="btn" disabled={b||code.length!==6} onClick={verify}>{t('register.code.verify')}</button>
    <button className="btn ghost" disabled={wait>0} onClick={resend}>{wait>0?t('register.resendIn',{s:wait}):t('register.resend')}</button>
    <button className="btn ghost" onClick={()=>{setStage('form');setCode('')}}>{t('register.changeDetails')}</button><Toast msg={msg}/></div>
  return <div className="login"><Lockup logo={logo} name={appName}/><h1>{t('register.title')}</h1><p>{t('register.hint')}{st.domains.length>0&&' '+t('register.domains',{domains:st.domains.map(d=>'@'+d).join(', ')})}</p>
    <label htmlFor="rn">{t('register.name')}</label><input id="rn" autoComplete="name" value={f.name} onChange={set('name')}/>
    <label htmlFor="ri">{t('register.institution')}</label><input id="ri" autoComplete="organization" value={f.institution} onChange={set('institution')}/>
    <label htmlFor="rid">{t('register.id')}</label><input id="rid" value={f.id_number} onChange={set('id_number')} placeholder={t('register.idPlaceholder')}/>
    <label htmlFor="re">{t('login.email')}</label><input id="re" type="email" autoComplete="email" value={f.email} onChange={set('email')}/>
    <label htmlFor="rp">{t('register.phone')}</label><input id="rp" type="tel" autoComplete="tel" value={f.phone} onChange={set('phone')} placeholder="+91 98765 43210"/>
    <label htmlFor="rw">{t('login.password')}</label><input id="rw" type="password" autoComplete="new-password" value={f.password} onChange={set('password')} onKeyDown={e=>e.key==='Enter'&&ok&&start()}/>
    <p className="known">{t('register.passwordHint')}</p>
    <button className="btn" disabled={b||!ok} onClick={start}>{t('register.send')}</button><button className="btn ghost" onClick={back}>{t('forgot.back')}</button><Toast msg={msg}/></div>}

function MyAiKey({toast}){
  const confirm=useConfirm()
  const [d,setD]=useState(null),[key,setKey]=useState(''),[b,setB]=useState(false)
  const load=()=>api('/me/ai-key').then(setD).catch(e=>toast(e.message));useEffect(()=>{load()},[])
  const save=async()=>{setB(true);try{await api('/me/ai-key',{method:'PUT',body:{key}});setKey('');toast('Key saved. AI help is on.');load()}catch(e){toast(e.message)}setB(false)}
  const del=async()=>{if(!await confirm({title:'Remove your key?',body:'AI help turns off for you until you add one again.',ok:'Remove key',danger:true}))return;try{await api('/me/ai-key',{method:'DELETE'});toast('Key removed');load()}catch(e){toast(e.message)}}
  return <><Bar title="My AI key" sub={d?.key_set?'AI is on · key '+d.key_hint:'AI is off · no key yet'}/><div className="main">
    <p className="known">AI explanations on your account use your own DeepSeek API key, so any usage is billed to your DeepSeek account. Create a key at platform.deepseek.com, paste it here and save. We check it with DeepSeek first, then store it encrypted. It is never shown again in full.</p>
    <label htmlFor="k">DeepSeek API key</label><input id="k" type="password" autoComplete="off" value={key} onChange={e=>setKey(e.target.value)} placeholder={d?.key_set?'Paste a new key to replace the current one':'sk-…'}/>
    <button className="btn" disabled={b||!key.trim()} onClick={save}>{b?'Checking the key…':'Save key'}</button>
    {d?.key_set&&<button className="btn ghost" onClick={del}>Remove my key</button>}</div></>}

function PromptEditor({toast}){const {t:tr}=useI18n();
  const confirm=useConfirm()
  const [items,setItems]=useState(null),[draft,setDraft]=useState({}),[busy,setBusy]=useState('')
  const load=()=>api('/admin/prompts').then(r=>{setItems(r.items);setDraft({})}).catch(e=>toast(e.message));useEffect(()=>{load()},[])
  if(!items)return <div className="sk"/>
  const save=async x=>{const text=draft[x.kind];if(x.saved_answers>0&&!await confirm({title:tr('prompts.saveTitle'),body:tr('prompts.saveBody',{count:tr(x.saved_answers===1?'prompts.answerOne':'prompts.answerMany',{n:x.saved_answers})}),ok:tr('prompts.save')}))return
    setBusy(x.kind);try{const r=await api('/admin/prompts/'+x.kind,{method:'PUT',body:{text}});toast(r.cleared?tr('prompts.savedCleared',{count:tr(r.cleared===1?'prompts.answerOne':'prompts.answerMany',{n:r.cleared})}):tr('prompts.saved'));load()}catch(e){toast(e.message)}setBusy('')}
  const reset=async x=>{if(!await confirm({title:tr('prompts.resetTitle'),body:x.saved_answers?tr('prompts.resetBody',{count:tr(x.saved_answers===1?'prompts.answerOne':'prompts.answerMany',{n:x.saved_answers})}):null,ok:tr('prompts.resetOk')}))return
    setBusy(x.kind);try{await api('/admin/prompts/'+x.kind,{method:'DELETE'});toast(tr('prompts.back'));load()}catch(e){toast(e.message)}setBusy('')}
  return <><p className="known">{tr('prompts.intro')}</p>
    {items.map(x=>{const v=draft[x.kind]??x.text,dirty=v.trim()!==x.text.trim()
      return <div key={x.kind} className="qbox"><b>{x.label}{x.custom&&<span className="chip" style={{marginLeft:8}}>{tr('prompts.edited')}</span>}</b><p className="known" style={{margin:'4px 0 8px'}}>{x.help}</p>
        <textarea aria-label={tr('prompts.aria',{label:x.label})} rows={9} value={v} maxLength={4000} onChange={e=>setDraft({...draft,[x.kind]:e.target.value})}/>
        <small className="known">{tr('prompts.chars',{n:v.length})}</small>
        <div className="two"><button className="btn" disabled={!dirty||busy===x.kind||v.trim().length<20} onClick={()=>save(x)}>{tr('prompts.save')}</button><button className="btn ghost" disabled={busy===x.kind||(!x.custom&&!dirty)} onClick={()=>x.custom?reset(x):setDraft({...draft,[x.kind]:x.default})}>{x.custom?tr('prompts.resetOk'):tr('prompts.undo')}</button></div></div>})}</>}

function SelfReg({cfg,run}){const {t:tr}=useI18n();
  const [dom,setDom]=useState(null);const on=!!cfg.self_registration,shown=dom??cfg.allowed_domains??''
  return <><p className="known">{tr(on?'selfreg.on':'selfreg.off')} {!cfg.mail_on&&tr('selfreg.needMail')} {cfg.self_registered_users>0&&tr('selfreg.count',{n:cfg.self_registered_users})}</p>
    <label className="chk"><input type="checkbox" checked={on} onChange={e=>run(()=>api('/admin/settings',{method:'PUT',body:{self_registration:e.target.checked}}),e.target.checked?tr('selfreg.nowOn'):tr('selfreg.nowOff'))}/> {tr('selfreg.allow')}</label>
    <label htmlFor="dom">{tr('selfreg.domains')}</label><input id="dom" value={shown} onChange={e=>setDom(e.target.value)} placeholder="college.edu, mail.college.edu"/>
    <button className="btn ghost" onClick={()=>run(()=>api('/admin/settings',{method:'PUT',body:{allowed_domains:shown}}).then(()=>setDom(null)),tr('selfreg.domainsSaved'))}>{tr('selfreg.saveDomains')}</button>
    <p className="known">{tr('selfreg.keyNote')}</p></>}

function ResetPassword({token,toast,msg,done,leave,canReset,appName,logo}){
  const {t}=useI18n()
  const [ok,setOk]=useState(null),[f,setF]=useState({password:'',again:''}),[b,setB]=useState(false)
  useEffect(()=>{api('/reset/check',{method:'POST',body:{token}}).then(r=>setOk(r.valid)).catch(()=>setOk(false))},[token])
  const go=async()=>{if(f.password.length<8)return toast(t('password.min'));if(f.password!==f.again)return toast(t('password.mismatch'))
    setB(true);try{const r=await api('/reset',{method:'POST',body:{token,new_password:f.password}});localStorage.t=r.token;done(r.user)}catch(e){toast(e.message)}setB(false)}
  if(ok===null)return null
  if(!ok)return <div className="login"><Lockup logo={logo} name={appName}/><h1>{t('reset.expired')}</h1><p>{t('reset.expiredHint')}{canReset?' '+t('reset.askNew'):' '+t('reset.askAdmin')}</p><button className="btn" onClick={leave}>{t('reset.goSignIn')}</button></div>
  return <div className="login"><Lockup logo={logo} name={appName}/><h1>{t('reset.title')}</h1><p>{t('password.minHint')}</p>
    <label>{t('password.new')}</label><input type="password" autoComplete="new-password" value={f.password} onChange={e=>setF({...f,password:e.target.value})}/>
    <label>{t('password.repeatNew')}</label><input type="password" autoComplete="new-password" value={f.again} onChange={e=>setF({...f,again:e.target.value})} onKeyDown={e=>e.key==='Enter'&&go()}/>
    <button className="btn" disabled={b} onClick={go}>{t('reset.save')}</button><Toast msg={msg}/></div>}

function ChangePassword({forced,appName,logo,toast,msg,done,out}){
  const {t}=useI18n()
  const [f,setF]=useState({current:'',password:'',again:''}),[b,setB]=useState(false),set=k=>e=>setF({...f,[k]:e.target.value})
  const go=async()=>{if(f.password.length<8)return toast(t('password.min'));if(f.password!==f.again)return toast(t('password.mismatchNew'))
    setB(true);try{const d=await api('/me/password',{method:'POST',body:{current:f.current,new_password:f.password}});if(d.token)localStorage.t=d.token;toast(t('password.changed'));done()}catch(e){toast(e.message)}setB(false)}
  const form=<><label>{forced?t('password.adminGave'):t('password.current')}</label><input type="password" autoComplete="current-password" value={f.current} onChange={set('current')}/>
    <label>{t('password.newMin')}</label><input type="password" autoComplete="new-password" value={f.password} onChange={set('password')}/>
    <label>{t('password.repeatNew')}</label><input type="password" autoComplete="new-password" value={f.again} onChange={set('again')} onKeyDown={e=>e.key==='Enter'&&go()}/>
    <button className="btn" disabled={b} onClick={go}>{t('nav.password')}</button></>
  if(forced)return <div className="login"><Lockup logo={logo} name={appName}/><h1>{t('password.chooseOwn')}</h1><p>{t('password.forcedHint')}</p>{form}<button className="btn ghost" onClick={out}>{t('menu.signOut')}</button><Toast msg={msg}/></div>
  return <><Bar title={t('nav.password')}/><div className="main">{form}</div></>}

const Bar=({title,sub,back,right})=>{const {menu}=useContext(Ctx),{t}=useI18n();return <header className="bar">
  <button className="ic menu" aria-label={t('menu.open')} onClick={menu}><Menu/></button>{back&&<button className="ic" aria-label={t('common.back')} onClick={back}><ChevronLeft/></button>}
  <h1>{title}{sub&&<small>{sub}</small>}</h1>{right}</header>}

const ARCHIVE_WHAT={programs:'arch.what.programs',semesters:'arch.what.semesters',courses:'arch.what.courses',units:'arch.what.units',topics:'arch.what.topics'}
const ONE={programs:'arch.one.programs',semesters:'arch.one.semesters',courses:'arch.one.courses',units:'arch.one.units',topics:'arch.one.topics'}
function ArchiveSheet({a,close,done,toast}){const {t:tr}=useI18n();  // archive or restore one item; archiving takes everything under it along, nothing is deleted
  const [busy,setBusy]=useState(false)
  const go=async()=>{setBusy(true);try{await api(`/${a.kind}/${a.id}/archive`,{method:'PUT',body:{archived:a.on}});toast(a.on?tr('sheet.archived'):tr('sheet.restored'));done()}catch(e){toast(e.message);setBusy(false)}}
  return <Sheet close={close}><h3>{a.on?tr('sheet.archive'):tr('sheet.restore')} “{a.name}”?</h3>
    <p className="known">{a.on?tr('sheet.archiveBody',{one:tr(ONE[a.kind]),what:tr(ARCHIVE_WHAT[a.kind])})
      :tr('sheet.restoreBody',{one:tr(ONE[a.kind])})}</p>
    <button className={'btn'+(a.on?' danger':'')} disabled={busy} onClick={go}>{busy?tr('sheet.working'):a.on?tr('sheet.archive'):tr('sheet.restore')}</button><button className="btn ghost" onClick={close}>{tr('common.cancel')}</button></Sheet>}
const ArchPill=({x})=>{const {t:tr}=useI18n();return x.archived?<span className="pill off sm">{tr(x.archived_self?'learn.archived':'learn.archivedWithParent')}</span>:null}
function Learn({user,toast,appName,start}){const {t:tr}=useI18n();
  const isAdmin=user.role==='admin',staff=user.role!=='student'
  const [copy,setCopy]=useState(null),[tree,setTree]=useState([]),[nav,setNav]=useState(start||[]),[sheet,setSheet]=useState(null),[cp,setCp]=useState(null),[t,setT]=useState(null),[ed,setEd]=useState(null),[del,setDel]=useState(null),[sh,setSh]=useState(null),[qz,setQz]=useState(null),[qe,setQe]=useState(null),[arch,setArch]=useState(null),[showArch,setShowArch]=useState(false),[qr,setQr]=useState(null),[gb,setGb]=useState(null)
  const load=()=>api('/tree').then(setTree).catch(e=>toast(e.message));useEffect(()=>{load()},[t,ed,qz,qe,sheet,arch,qr])
  const landed=useRef(false);useEffect(()=>{if(landed.current||user.role!=='student'||tree.length!==1)return;landed.current=true;const p=tree[0],c=p.semesters.find(x=>x.current)||(p.semesters.length===1?p.semesters[0]:null);setNav(c?[p.id,c.id]:[p.id])},[tree])
  const prog=tree.find(x=>x.id===nav[0]),sem=prog?.semesters.find(x=>x.id===nav[1]),co=sem?.courses.find(x=>x.id===nav[2]),unit=co?.units.find(x=>x.id===nav[3])
  const mayEdit=isAdmin||(user.role==='faculty'&&!!co?.editable)
  useEffect(()=>{setCp(null);if(co&&mayEdit&&!co.shared)api(`/courses/${co.id}/progress`).then(setCp).catch(()=>{})},[co?.id,mayEdit,t])
  if(t)return <Topic id={t} back={()=>setT(null)} toast={toast} role={user.role}/>
  if(qz)return <QuizPlay id={qz} back={()=>setQz(null)} toast={toast} role={user.role}/>
  if(qe)return <QuizEditor {...qe} done={()=>setQe(null)} toast={toast}/>
  if(qr)return <QuizResults id={qr} back={()=>setQr(null)} toast={toast} role={user.role}/>
  if(gb)return <Gradebook cid={gb} back={()=>setGb(null)} toast={toast} role={user.role}/>
  if(ed)return <TopicEditor role={user.role} toast={toast} edit={ed.id?ed:null} unitId={ed.unit_id} done={()=>setEd(null)} cancel={()=>setEd(null)}/>
  const tsub=x=>[x.published===false&&tr('learn.draftHidden'),x.learning_due_at?tr('learn.due',{when:when(x.learning_due_at)}):!staff&&tr('learn.noDeadline'),x.overdue&&!staff&&tr('home.overdue'),
    cp?.topics[x.id]&&tr('learn.completedRatio',{a:cp.topics[x.id].completed,b:cp.students})+(cp.topics[x.id].overdue?' · '+tr('home.overdueN',{n:cp.topics[x.id].overdue}):'')].filter(Boolean).join(' · ')
  const row=(x,kind,one,sub,extra={})=>({id:x.id,n:x.name,sub,kind,archived:x.archived,archived_self:x.archived_self,locked:!staff&&kind==='courses'&&x.archived,can:kind==='programs'||kind==='semesters'?isAdmin:kind==='courses'?(isAdmin||x.mine)&&!x.shared:mayEdit&&!co?.shared,go:()=>setNav([...nav,x.id]),edit:()=>setEd({kind:one,id:x.id,name:x.name,...extra})})
  const drafts=t=>t.filter(x=>x.published===false).length
  const setPub=async(url,published,msg)=>{try{await api(url,{method:'PUT',body:{published}});toast(msg);load()}catch(e){toast(e.message)}}
  const move=async(items,i,d,url)=>{const ids=items.map(x=>x.id),j=i+d;if(j<0||j>=ids.length)return;[ids[i],ids[j]]=[ids[j],ids[i]];try{await api(url,{method:'PUT',body:{ids}});load()}catch(e){toast(e.message)}}
  const list0=unit?unit.topics.map(x=>({id:x.id,n:x.title,s:x.status,b:x.bookmarked,kind:'topics',archived:x.archived,archived_self:x.archived_self,can:mayEdit&&!co.shared,sub:tsub(x),late:x.overdue,draft:x.published===false,go:()=>setT(x.id),edit:()=>setEd({id:x.id}),pub:()=>setPub(`/topics/${x.id}/publish`,x.published===false,x.published===false?'Published':'Moved to drafts')}))
    :co?co.units.map(x=>({...row(x,'units','unit',staff?tr('learn.topicsN',{n:x.topics.length})+(mayEdit&&drafts(x.topics)?' · '+tr('learn.draftN',{n:drafts(x.topics)}):''):tr('learn.topicsDone',{n:doneOf(x.topics)})),edit:()=>setSheet({type:'unit',un:x,cid:co.id})}))
    :sem?sem.courses.map(x=>({...row(x,'courses','course',(staff?tr('learn.unitsN',{n:x.units.length}):tr('learn.topicsDone',{n:doneOf(x.units.flatMap(n=>n.topics))}))+(x.shared?' · '+tr('learn.sharedFrom',{home:x.home}):x.shared_with?' · '+tr('learn.sharedWith',{n:x.shared_with}):'')+(staff?' · '+ownerLine(x,tr):'')),edit:()=>setSheet({type:'course',c:x,pid:prog.id,sid:x.semester_id}),share:()=>setSh({id:x.id,name:x.name,home:x.semester_id,sel:x.link_ids||[]}),unlink:x.shared?{id:x.id,keep:(x.link_ids||[]).filter(i=>i!==sem.id)}:null}))
    :prog?prog.semesters.map(x=>({...row(x,'semesters','semester',(isAdmin?(x.number?tr('learn.termNo',{term:prog.term,n:x.number}):tr('learn.noNumber',{term:prog.term.toLowerCase()}))+' · ':'')+tr('learn.coursesN',{n:x.courses.length})),edit:()=>setSheet({type:'semester',sem:x,pid:prog.id})}))
    :tree.map(x=>({...row(x,'programs','program',x.semesters.length+' '+x.term.toLowerCase()+(x.semesters.length===1?'':'s')),edit:()=>setSheet({type:'program',p:x})}))
  const hidden=staff?list0.filter(x=>x.archived).length:0,list=staff&&!showArch?list0.filter(x=>!x.archived):list0,anyArch=staff&&tree.some(p=>p.archived||p.semesters.some(s=>s.archived||s.courses.some(c=>c.archived||c.units.some(n=>n.archived_self||n.topics.some(t=>t.archived_self)))))
  const cur=unit||co||sem||prog,crumbs=[prog,sem,co,unit].filter(Boolean).slice(0,-1).map(x=>x.name).join(' › ')
  const allSems=tree.flatMap(p=>p.semesters.map(s=>({id:s.id,label:p.name+' › '+s.name})))
  const myCourses=tree.flatMap(p=>p.semesters.flatMap(s=>s.courses.filter(c=>c.mine&&!c.shared&&(!c.archived||showArch)).map(c=>({p,s,c}))))
  const saveShare=async()=>{try{await api(`/courses/${sh.id}/links`,{method:'PUT',body:{semester_ids:sh.sel}});toast(tr('sheet.sharingUpdated'));setSh(null);load()}catch(e){toast(e.message)}}
  const remove=async()=>{try{if(del.unlink)await api(`/courses/${del.unlink.id}/links`,{method:'PUT',body:{semester_ids:del.unlink.keep}});else await api(`/${del.kind}/${del.id}`,{method:'DELETE'});toast(tr('sheet.deleted'));setDel(null);load()}catch(e){toast(e.message)}}
  return <><Bar title={cur?.name||appName} sub={nav.length?crumbs:tr('learn.hi',{name:user.name})} back={nav.length>0&&(()=>setNav(nav.slice(0,-1)))}/>
   <div className="main">{unit&&mayEdit&&drafts(unit.topics)>0&&<button className="btn" style={{marginTop:0}} onClick={()=>setPub(`/units/${unit.id}/publish`,true,'All drafts published')}>{tr('learn.publishAll',{n:drafts(unit.topics)})}</button>}{!nav.length&&<div className="hero"><h2>{tr('learn.chooseProgram')}</h2></div>}
     {staff&&(anyArch||showArch)&&<label className="chk" style={{marginBottom:12}}><input type="checkbox" checked={showArch} onChange={e=>setShowArch(e.target.checked)}/> {tr('learn.showArchived')}{!showArch&&hidden>0?' '+tr('learn.hereCount',{n:hidden}):''}</label>}
     {isAdmin&&!sem&&<button className="btn ghost lead" onClick={()=>setSheet(prog?{type:'semester',sem:{},pid:prog.id}:{type:'program',p:{}})}>{prog?tr('learn.addTo',{what:prog.term.toLowerCase(),name:prog.name}):tr('learn.newProgram')}</button>}
     {isAdmin&&sem&&!co&&<button className="btn ghost lead" onClick={()=>setSheet({type:'course',c:{},pid:prog.id,sid:sem.id})}>{tr('learn.addCourseTo',{name:sem.name})}</button>}
     {co&&!unit&&!staff&&<p className="known" style={{marginTop:0}}>{tr('learn.topicsDone',{n:doneOf(co.units.flatMap(n=>n.topics))})}</p>}
     {co&&!unit&&staff&&<div className="qbox" style={{marginTop:0}}>{[[tr('learn.program'),prog.name],[prog.term,sem.name+(sem.number?' '+tr('learn.termNoParen',{n:sem.number}):'')],[tr('learn.ownerLabel'),co.mine?tr('learn.you'):co.owner_problem||co.owner||tr('learn.notAssigned')]].map(([l,v])=><div className="row" key={l}><div>{v}<small>{l}</small></div></div>)}
       {isAdmin&&!co.shared&&<div className="two"><button className="btn ghost" onClick={()=>setSheet({type:'course',c:co,pid:prog.id,sid:co.semester_id})}>{tr('learn.editCourse')}</button><button className="btn ghost" onClick={()=>setSheet({type:'owner',c:co})}>{tr('learn.changeOwner')}</button></div>}</div>}
     {!nav.length&&user.role==='faculty'&&<><h3 className="sec first">{tr('home.myCourses')}</h3>{myCourses.length?myCourses.map(({p,s,c},i)=><div key={c.id} className="card"><button className="hit" onClick={()=>setNav([p.id,s.id,c.id])}><span className="dot" style={{background:COL[i%5]}}>{c.name[0]}</span><div><b>{c.name}<ArchPill x={c}/></b><span>{p.name} › {s.name} · {tr('learn.unitsN',{n:c.units.length})}</span></div></button></div>)
       :<p className="known">{tr('home.notAssigned')}</p>}<h3 className="sec">{tr('learn.allPrograms')}</h3></>}
    {mayEdit&&co&&!unit&&!co.shared&&<button className="btn ghost lead" onClick={()=>setSheet({type:'unit',un:{},cid:co.id})}>{tr('learn.addUnit')}</button>}
    {mayEdit&&unit&&!co.shared&&<button className="btn ghost lead" onClick={()=>setEd({unit_id:unit.id})}>{tr('learn.addTopicTo',{name:unit.name})}</button>}
    {staff&&unit&&<button className="btn ghost lead" onClick={()=>setCopy({kind:'unit',id:unit.id,title:unit.name})}>{tr('learn.copyUnit')}</button>}
    {list.map((x,i)=>x.locked?<div key={x.id} className="card" style={{opacity:.7}}><button className="hit" onClick={()=>toast(tr('home.unavailableToast'))} aria-label={x.n+', '+tr('home.unavailable')}><span className="dot" style={{background:'var(--mut)'}}><Lock size={18}/></span><div><b>{x.n}</b><span>{tr('home.unavailable')}</span></div></button></div>:<div key={x.id} className="card" style={x.archived?{opacity:.75}:undefined}><button className="hit" onClick={x.go}><span className="dot" style={{background:COL[i%5]}}>{x.n[0]}</span><div><b>{x.n}<ArchPill x={x}/></b>{x.sub&&<span>{x.sub}</span>}</div>{(x.s||x.b)&&<span className="marks">{x.b&&<Bookmark className="bm" size={16} fill="currentColor"/>}{x.s&&<Mark s={x.s}/>}</span>}</button>
      <div className="acts">{staff&&x.can&&(x.archived_self||!x.archived)&&<button className="ic sm" aria-label={tr(x.archived_self?'learn.restoreOne':'learn.archiveOne',{n:x.n})} onClick={()=>setArch({kind:x.kind,id:x.id,name:x.n,on:!x.archived_self})}>{x.archived_self?<ArchiveRestore size={16}/>:<Archive size={16}/>}</button>}
      {mayEdit&&<>{(x.kind==='units'||x.kind==='topics')&&list.length>1&&[[-1,ArrowUp,'learn.up'],[1,ArrowDown,'learn.down']].map(([d,I,w])=><button key={w} className="ic sm" aria-label={tr('learn.moveAria',{n:x.n,dir:tr(w)})} disabled={i+d<0||i+d>=list.length} onClick={()=>move(list,i,d,x.kind==='units'?`/courses/${co.id}/units/order`:`/units/${unit.id}/topics/order`)}><I size={16}/></button>)}{x.pub&&<button className="ic sm" aria-label={tr(x.draft?'learn.publishOne':'learn.unpublishOne',{n:x.n})} onClick={x.pub}>{x.draft?<Eye size={16}/>:<EyeOff size={16}/>}</button>}{x.share&&<button className="ic sm" aria-label={tr('learn.shareAria',{n:x.n})} onClick={x.share}><Link2 size={16}/></button>}<button className="ic sm" aria-label={tr('learn.editAria',{n:x.n})} onClick={x.edit}><Pencil size={16}/></button><button className="ic sm" aria-label={tr('learn.deleteAria',{n:x.n})} onClick={()=>setDel(x.unlink?{...x,unlink:x.unlink}:x)}><Trash2 size={16}/></button></>}</div></div>)}
    {co&&!unit&&(co.tests?.length>0||(mayEdit&&!co.shared))&&<><h3 className="sec">{tr('learn.mcq')}</h3>
      {co.tests.map((q,i)=><div key={q.id} className="card"><button className="hit" onClick={()=>setQz(q.id)}><span className="dot" style={{background:COL[(i+1)%5]}}><ClipboardList size={18}/></span><div><b>{q.title}</b><span>{tr('learn.quizMeta',{n:q.questions,pass:q.pass_percent})}{q.best!=null?' · '+tr('learn.best',{n:q.best}):''}{q.published?'':' · '+tr('learn.draft')}</span></div>{q.best!=null&&q.best>=q.pass_percent&&<span className="marks"><Check size={16}/></span>}</button>
        {mayEdit&&<><button className="ic sm" aria-label={tr('learn.resultsOf',{n:q.title})} onClick={()=>setQr(q.id)}><BarChart3 size={16}/></button><button className="ic sm" aria-label={tr('learn.editQuiz',{n:q.title})} onClick={()=>setQe({id:q.id,course_id:co.id})}><Pencil size={16}/></button></>}</div>)}
      {mayEdit&&!co.shared&&<button className="btn ghost" onClick={()=>setQe({course_id:co.id,csvFirst:true})}><Upload size={16}/> {tr('learn.newMcqCsv')}</button>}
      {mayEdit&&<button className="btn ghost" onClick={()=>setGb(co.id)}><BarChart3 size={16}/> {tr('learn.gradebook')}</button>}</>}
    {unit&&(unit.quizzes.length>0||mayEdit)&&<><h3 className="sec">{tr('learn.quizzes')}</h3>
      {unit.quizzes.map((q,i)=><div key={q.id} className="card"><button className="hit" onClick={()=>setQz(q.id)}><span className="dot" style={{background:COL[(i+3)%5]}}>?</span><div><b>{q.title}</b><span>{tr('learn.quizMeta',{n:q.questions,pass:q.pass_percent})}{q.best!=null?' · '+tr('learn.best',{n:q.best}):''}{q.published?'':' · '+tr('learn.draft')}</span></div>{q.best!=null&&q.best>=q.pass_percent&&<span className="marks"><Check size={16}/></span>}</button>
        {mayEdit&&<><button className="ic sm" aria-label={tr('learn.resultsOf',{n:q.title})} onClick={()=>setQr(q.id)}><BarChart3 size={16}/></button><button className="ic sm" aria-label={tr('learn.editQuiz',{n:q.title})} onClick={()=>setQe({id:q.id,unit_id:unit.id,unitTopics:unit.topics.map(t=>({id:t.id,title:t.title}))})}><Pencil size={16}/></button></>}</div>)}
      {mayEdit&&<button className="btn ghost" onClick={()=>setQe({unit_id:unit.id,unitTopics:unit.topics.map(t=>({id:t.id,title:t.title}))})}>{tr('learn.addQuiz')}</button>}</>}
    {!list.length&&<p className="known">{(mayEdit&&co)||isAdmin?tr('learn.emptyAdmin'):!nav.length&&user.role==='student'?tr('learn.emptyStudent'):tr('learn.emptyOther')}</p>}</div>
   {arch&&<ArchiveSheet a={arch} toast={toast} close={()=>setArch(null)} done={()=>setArch(null)}/>}
   {copy&&<CopySheet {...copy} toast={toast} close={()=>{setCopy(null);load()}}/>}
   {del&&<Sheet close={()=>setDel(null)}><h3>{del.unlink?tr('sheet.remove'):tr('sheet.delete')} “{del.n}”{del.unlink?' '+tr('sheet.fromThis',{term:(prog?.term||'semester').toLowerCase()}):''}?</h3>
     <p className="known">{del.unlink?tr('sheet.unlinkBody',{term:(prog?.term||'semester').toLowerCase()}):tr(DELETES[del.kind])} {tr('sheet.cantUndo')}</p>
     <button className="btn danger" onClick={remove}>{del.unlink?tr('sheet.remove'):tr('sheet.delete')}</button><button className="btn ghost" onClick={()=>setDel(null)}>{tr('common.cancel')}</button></Sheet>}
   {sh&&<Sheet close={()=>setSh(null)}><h3>{tr('sheet.share',{name:sh.name})}</h3><p className="known">{tr('sheet.shareHint')}</p>
     {allSems.filter(x=>x.id!==sh.home).map(x=><label key={x.id} className="chk"><input type="checkbox" checked={sh.sel.includes(x.id)} onChange={e=>setSh({...sh,sel:e.target.checked?[...sh.sel,x.id]:sh.sel.filter(i=>i!==x.id)})}/> {x.label}</label>)}
     <button className="btn" onClick={saveShare}>{tr('common.save')}</button><button className="btn ghost" onClick={()=>setSh(null)}>{tr('common.cancel')}</button></Sheet>}
   {sheet?.type==='program'&&<ProgramSheet p={sheet.p} toast={toast} close={()=>setSheet(null)} done={()=>setSheet(null)}/>}
   {sheet?.type==='semester'&&<SemesterSheet sem={sheet.sem} pid={sheet.pid} term={prog?.term} toast={toast} close={()=>setSheet(null)} done={()=>setSheet(null)}/>}
   {sheet?.type==='course'&&<CourseSheet c={sheet.c} pid={sheet.pid} sid={sheet.sid} term={prog?.term} sems={tree.flatMap(p=>p.semesters.map(s=>({id:s.id,label:p.name+' › '+s.name})))} toast={toast} close={()=>setSheet(null)} done={()=>setSheet(null)}/>}
   {sheet?.type==='unit'&&<UnitSheet un={sheet.un} cid={sheet.cid} courses={isAdmin?tree.flatMap(p=>p.semesters.flatMap(s=>s.courses.filter(c=>!c.shared).map(c=>({id:c.id,label:`${p.name} › ${s.name} › ${c.name}`})))):null} toast={toast} close={()=>setSheet(null)} done={()=>setSheet(null)}/>}
   {sheet?.type==='owner'&&<OwnerSheet c={sheet.c} toast={toast} close={()=>setSheet(null)} done={()=>setSheet(null)}/>}
</>}
const DELETES={programs:'del.programs',semesters:'del.semesters',courses:'del.courses',units:'del.units',topics:'del.topics'}
function SemesterSheet({sem,pid,term='Semester',close,done,toast}){const {t:tr}=useI18n();
  const isNew=!sem.id,[f,setF]=useState({name:sem.name||'',no:sem.number||''}),[busy,setBusy]=useState(false)
  const pickNo=e=>{const no=e.target.value;setF({no,name:!f.name||/^(Semester|Year|Grade) \d+$/.test(f.name)?(no?term+' '+no:''):f.name})}
  const save=async()=>{setBusy(true);try{const body={name:f.name,semester_no:f.no?+f.no:null};await api(isNew?`/programs/${pid}/semesters`:'/semesters/'+sem.id,{method:isNew?'POST':'PUT',body:isNew?body:{...body,program_id:pid}});toast(isNew?tr('sheet.termAdded',{term}):tr('topic.changesSaved'));done()}catch(e){toast(e.message)}setBusy(false)}
  return <Sheet close={close}><h3>{isNew?tr('sheet.newTerm',{term:term.toLowerCase()}):tr('sheet.editTerm',{term:term.toLowerCase()})}</h3>
    <label>{tr('sheet.termNumber',{term})}</label><select value={f.no} onChange={pickNo}><option value="">{tr('sheet.choose')}</option>{upTo(maxOf(term)).map(n=><option key={n} value={n}>{n}</option>)}</select>
    <label>{tr('sheet.name')}</label><input value={f.name} onChange={e=>setF({...f,name:e.target.value})} placeholder={tr('sheet.termExample',{term})}/>
    <p className="known" style={{marginTop:10}}>{tr('sheet.termHint',{term:term.toLowerCase()})}</p>
    <button className="btn" disabled={busy||!f.no||!f.name.trim()} onClick={save}>{isNew?tr('sheet.addTerm',{term:term.toLowerCase()}):tr('topic.saveChanges')}</button></Sheet>}
function CourseSheet({c,pid,sid,sems,term='Semester',close,done,toast}){const {t:tr}=useI18n();
  const isNew=!c.id,faculty=useFaculty(true),[f,setF]=useState({name:c.name||'',sem:sid,owner:c.owner_id||''}),[busy,setBusy]=useState(false)
  const save=async()=>{setBusy(true);try{const owner=String(f.owner)!==String(c.owner_id||'')?{faculty_owner_id:f.owner?+f.owner:null}:{}  // unchanged owners are left alone
    await api(isNew?`/programs/${pid}/semesters/${sid}/courses`:'/courses/'+c.id,{method:isNew?'POST':'PUT',body:isNew?{name:f.name,...owner}:{name:f.name,semester_id:+f.sem,...owner}});toast(isNew?tr('sheet.courseAdded'):tr('topic.changesSaved'));done()}catch(e){toast(e.message)}setBusy(false)}
  return <Sheet close={close}><h3>{isNew?tr('sheet.newCourseIn',{where:sems.find(x=>x.id===sid)?.label||''}):tr('learn.editCourse')}</h3>
    <label>{tr('sheet.name')}</label><input value={f.name} onChange={e=>setF({...f,name:e.target.value})} placeholder={tr('sheet.coursePh')}/>
    {!isNew&&<><label>{term}</label><select value={f.sem} onChange={e=>setF({...f,sem:+e.target.value})}>{sems.map(x=><option key={x.id} value={x.id}>{x.label}</option>)}</select></>}
    <label>{tr('sheet.ownerFaculty')}</label><select value={f.owner} onChange={e=>setF({...f,owner:e.target.value})}><option value="">{tr('learn.notAssigned')}</option>{c.owner_id&&!faculty.some(u=>u.id===c.owner_id)&&<option value={c.owner_id}>{c.owner} ({tr('sheet.cantEdit')})</option>}{faculty.map(u=><option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}</select>
    {!isNew&&+f.sem!==sid&&<p className="known">{tr('sheet.moveCourseHint')}</p>}
    <button className="btn" disabled={busy||!f.name.trim()} onClick={save}>{isNew?tr('sheet.addCourse'):tr('topic.saveChanges')}</button></Sheet>}

const STUDY={not_started:'study.notOpened',in_progress:'study.inProgress',completed:'study.completed'}
const AREA_GROUPS=[['needs_study','area.needs','area.needsHint'],['getting_there','area.getting',''],['strong','area.strong','area.strongHint']]
function AreaList({areas,onStudy,staff}){const {t:tr}=useI18n();
  return <>{AREA_GROUPS.map(([k,tk,hk])=>{const L=areas.filter(a=>a.status===k),title=tr(tk),hint=hk?tr(hk):'';if(!L.length)return null
    return <div className={'qbox area '+k} key={k}><b>{title} ({L.length})</b>{hint&&!staff&&<p className="known" style={{margin:'4px 0 8px'}}>{hint}</p>}
      {L.map(a=><div className="arow" key={a.topic_id||'u'+a.unit_id}><div><span>{a.title}</span><small>{tr('area.right',{c:a.correct,total:a.total,pct:a.percent})}{a.study&&!staff?' · '+tr(STUDY[a.study]):''}{a.course?' · '+a.course:''}</small><Bar2 v={a.percent}/></div>
        {a.topic_id&&onStudy&&<button className="tool" onClick={()=>onStudy(a.topic_id)}>{k==='strong'?tr('area.review'):tr('area.studyAgain')}</button>}</div>)}</div>})}</>}
const ATTN_GO={drafts:'drafts',empty_courses:'empty_courses',unowned:'unowned',unenrolled:'unenrolled',semester_numbers:'semester_numbers',never_opened:'never_opened'}
const RS_PAGE=5
function ResultSet({kind,user,back,toast,open}){const {t:tr}=useI18n();  // the rows behind a dashboard card: search, sort, 5 per page, and a tap on a row opens its details
  const [q,setQ]=useState(''),[order,setOrder]=useState('name'),[page,setPage]=useState(0),[d,setD]=useState(null),[view,setView]=useState(null),[progs,setProgs]=useState([])
  useEffect(()=>{setPage(0)},[q,order])
  useEffect(()=>{if(view)return;let live=true;const t=setTimeout(()=>api(`/overview/list?kind=${kind}&q=${encodeURIComponent(q)}&order=${order}&limit=${RS_PAGE}&offset=${page*RS_PAGE}`).then(r=>{if(!live)return;if(!r.items.length&&r.total&&page>0)setPage(Math.max(0,Math.ceil(r.total/RS_PAGE)-1));else setD(r)}).catch(e=>toast(e.message)),q?250:0);return()=>{live=false;clearTimeout(t)}},[kind,q,order,page,view])
  useEffect(()=>{if(view?.target.type==='user')api('/tree').then(t=>setProgs(t.map(p=>({id:p.id,name:p.name,term:p.term})))).catch(()=>{})},[view])
  const shut=()=>setView(null)
  if(view){const t=view.target
    if(t.type==='user')return <UserDetail id={t.id} me={user} progs={progs} back={shut} toast={toast}/>
    if(t.type==='topic')return <Topic id={t.id} back={shut} toast={toast} role={user.role}/>
    if(t.type==='course'&&kind==='courses'){const [p='',sm='']=(view.sub||'').split(' · ');return <StudentReport c={{course_id:t.id,course:view.title,program:p,semester:sm}} back={shut} toast={toast}/>}
    open(t.type==='program'?[t.id]:[t.program_id,t.semester_id,t.id].filter(x=>x!=null));return null}
  const total=d?.total??0,pages=Math.max(1,Math.ceil(total/RS_PAGE)),title=d?.title||tr('common.loading')
  return <><Bar title={title} sub={d?(q?tr(total===1?'rs.matchOne':'rs.matchMany',{n:total}):tr('rs.inTotal',{n:total})):''} back={back}/><div className="main">
    <div className="search"><Search size={18}/><input type="search" aria-label={tr('rs.searchAria',{title:title.toLowerCase()})} placeholder={tr('common.search')} value={q} onChange={e=>setQ(e.target.value)}/></div>
    <div className="qopt"><select aria-label={tr('rs.sortBy')} value={order} onChange={e=>setOrder(e.target.value)}><option value="name">{tr('rs.sortName')}</option><option value="name_desc">{tr('rs.sortNameDesc')}</option><option value="detail">{tr('rs.sortDetail')}</option><option value="newest">{tr('rs.sortNewest')}</option>{d?.can_recent&&<option value="recent">{tr('rs.sortRecent')}</option>}</select></div>
    {!d&&<><div className="sk"/><div className="sk"/><div className="sk"/></>}
    {d&&d.items.length>0&&<div className="uhead" aria-hidden="true"><span>{tr('rs.name')}</span><span>{tr('rs.details')}</span><span/></div>}
    {d?.items.map(x=><button key={x.id} className="utr" onClick={()=>setView(x)} aria-label={tr('rs.open',{title:x.title})}>
      <span className="nm"><span className="dot" style={{background:COL[x.id%5]}}>{(x.title||'?')[0]}</span><span className="tx"><b>{x.title}</b><small className="sub">{x.sub}</small></span></span>
      <span className="pg">{x.detail||'—'}</span><span className="sn"><ChevronRight size={16}/></span></button>)}
    {d&&!d.items.length&&<p className="known">{q?tr('rs.noMatch'):tr('rs.empty')}</p>}
    {d&&total>RS_PAGE&&<nav className="pager" aria-label={tr('rs.pages')}><button className="btn ghost" disabled={page===0} onClick={()=>setPage(page-1)}><ChevronLeft size={18}/><span>{tr('rs.previous')}</span></button><small>{tr('rs.page',{p:page+1,n:pages})}</small><button className="btn ghost" disabled={page+1>=pages} onClick={()=>setPage(page+1)}><span>{tr('home.next')}</span><ChevronRight size={18}/></button></nav>}
  </div></>}
function StaffHome({user,toast,open}){const {t:tr}=useI18n();
  const [o,setO]=useState(null),[list,setList]=useState(null),[rep,setRep]=useState(null)
  useEffect(()=>{if(!list&&!rep)api('/overview').then(setO).catch(e=>toast(e.message))},[toast,list,rep])
  if(rep)return <StudentReport c={rep} back={()=>setRep(null)} toast={toast}/>
  if(list)return <ResultSet kind={list} user={user} back={()=>setList(null)} toast={toast} open={open}/>
  const admin=user.role==='admin',hour=new Date().getHours(),hi=hour<12?tr('home.morning'):hour<17?tr('home.afternoon'):tr('home.evening')
  const stats=o?(admin?[[o.people.students,tr('home.activeStudents'),'students'],[o.people.active_week,tr('home.studiedWeek'),'active_week'],[o.people.faculty,tr('home.faculty'),'faculty'],[o.courses,tr('home.courses'),'courses']]:[[o.courses,tr('home.yourCourses'),'courses'],[o.topics,tr('home.topics'),'topics'],[o.drafts,tr('home.drafts'),'drafts']]):[]
  return <><Bar title={tr('home.greeting',{hi,name:user.name.split(' ')[0]})} sub={admin?tr('home.acrossCollege'):tr('home.yourCourses')}/><div className="main">
    {!o&&<><div className="sk"/><div className="sk"/><div className="sk"/></>}
    {o&&<div className="stats">{stats.map(([n,l,k])=><button className="stat" key={l} style={{textAlign:'left',width:'100%'}} onClick={()=>setList(k)} aria-label={tr('home.showListAria',{n:(n??0).toLocaleString(),l})}><b>{(n??0).toLocaleString()}</b>{l}</button>)}</div>}
    {o&&<><h3 className="sec">{tr('home.attention')}</h3>
      {o.attention.length?o.attention.map(x=><button key={x.kind} className="card" style={{textAlign:'left'}} onClick={()=>setList(ATTN_GO[x.kind]||'drafts')}><div style={{flex:1}}><b>{x.text}</b></div><ChevronRight size={18}/></button>)
        :<p className="known">{tr('home.nothingAttention')}</p>}</>}
    {o&&!o.courses&&!admin&&<p className="known">{tr('home.notAssigned')}</p>}
    {o?.courses>0&&<><h3 className="sec">{admin?tr('home.courses'):tr('home.yourCourses')}</h3><CourseReports toast={toast} onOpen={setRep}/></>}
  </div></>}
const FOCUS={overdue:[AlertTriangle,'focus.overdue','focus.openIt'],due_soon:[Clock,'focus.dueSoon','focus.openIt'],weak:[Target,'focus.needsReview','focus.review'],resume:[Play,'focus.continue','focus.continue'],quiz_retake:[RotateCcw,'focus.retakeQuiz','focus.retake'],quiz_new:[ClipboardList,'focus.quiz','focus.takeQuiz'],next:[ArrowRight,'focus.nextUp','focus.start']}
function Dashboard({user,toast,onOpen,onSearch}){const {t:tr}=useI18n();
  const [tree,setTree]=useState(null),[ins,setIns]=useState(null),[today,setToday]=useState(null),[planErr,setPlanErr]=useState(''),[topic,setTopic]=useState(null)
  useEffect(()=>{if(topic)return;api('/tree').then(setTree).catch(e=>toast(e.message));api('/me/insights').then(setIns).catch(()=>{});api('/me/today').then(r=>{setToday(r);setPlanErr('')}).catch(e=>setPlanErr(e.message))},[topic,toast])
  if(topic)return <Topic id={topic} back={()=>setTopic(null)} toast={toast} role={user.role}/>
  const hour=new Date().getHours(),hi=hour<12?tr('home.morning'):hour<17?tr('home.afternoon'):tr('home.evening')
  const seen=new Map(),courses=[]
  for(const p of tree||[])for(const s of p.semesters)for(const c of s.courses){const at=seen.get(c.id),item={p,s,c,topics:c.units.flatMap(un=>un.topics.map(t=>({...t,unit:un})))}
    if(at===undefined){seen.set(c.id,courses.length);courses.push(item)}else if(courses[at].c.archived&&!c.archived)courses[at]=item}  // a course shown twice counts once, and a live place wins over an archived one
  const all=courses.flatMap(x=>x.topics.map(t=>({...t,x})))
  const due=all.filter(t=>t.learning_due_at&&t.status!=='completed').sort((a,b)=>a.learning_due_at.localeCompare(b.learning_due_at)).slice(0,5)
  const need=ins?.needs_study.slice(0,3)||[],focus=today?.focus||[],top=focus[0]
  const act=f=>f.topic_id?setTopic(f.topic_id):onOpen(f.nav)
  const sub=!today?tr('home.whereToday'):today.streak>1?tr('home.streak',{n:today.streak}):today.active_today?tr('home.studiedToday'):focus.length?tr('home.nextToDo'):tr('home.whereToday')
  return <><Bar title={tr('home.greeting',{hi,name:user.name.split(' ')[0]})} sub={sub}/><div className="main">
    <button className="search fake" onClick={onSearch} aria-label={tr('home.searchAria')}><Search size={18}/><span>{tr('home.searchTopic')}</span></button>
    {!tree&&<><div className="sk"/><div className="sk"/><div className="sk"/></>}
    {tree&&!courses.length&&<p className="known">{user.self_registered&&!user.placed?tr('home.placing'):tr('home.notEnrolled')}</p>}
    {planErr&&courses.length>0&&<p className="known" role="alert">{tr('home.planErr',{err:planErr})}</p>}
    {today&&courses.length>0&&<><div className="stats dstats">
      <div className="stat"><b><Flame size={20} className={'flame'+(today.streak?' on':'')} aria-hidden="true"/> {today.streak}</b>{tr('home.dayStreak')}<small>{today.active_today?tr('home.studiedToday'):today.streak?tr('home.studyToKeep'):tr('home.startToday')}</small></div>
      <div className="stat"><b>{today.completed_this_week}</b>{tr('home.doneWeek')}<small>{tr(today.active_days_week===1?'home.activeDayOne':'home.activeDayMany',{n:today.active_days_week})}</small></div>
      <div className="stat"><b>{today.percent}%</b>{tr('home.completed')}<small>{tr('home.topicsOf',{a:today.topics_completed,b:today.topics_total})}</small></div>
      <div className="stat"><b>{today.quiz_average==null?'–':today.quiz_average+'%'}</b>{tr('home.quizAvg')}<small>{today.quiz_average==null?tr('home.noQuizzes'):tr('home.bestScores')}</small></div></div>
      <div className="week" role="img" aria-label={tr('home.weekAria',{n:today.week.filter(d=>d.active).length})}>{today.week.map(d=><span key={d.date} className={'wd'+(d.active?' on':'')+(d.today?' now':'')}><i>{d.active&&<Check size={13}/>}</i><small>{d.label}</small></span>)}</div></>}
    {top&&<><h3 className="sec first">{tr('home.focus')}</h3>
      <div className="hero"><small>{top.kind==='overdue'||top.kind==='due_soon'?top.reason:tr(FOCUS[top.kind][1])+' · '+top.reason}</small><h2 style={{fontSize:24}}>{top.title}</h2><p>{top.course} · {top.unit}</p>
        <button className="btn inv" style={{marginTop:14}} onClick={()=>act(top)}>{tr(FOCUS[top.kind][2])}</button></div>
      {focus.slice(1).map((f,i)=>{const [I,,go]=FOCUS[f.kind];return <button key={i} className="frow" onClick={()=>act(f)}><span className={'fic '+f.kind}><I size={18}/></span><span className="ftx"><b>{f.title}</b><small>{f.reason} · {f.course}</small></span><span className="fgo">{tr(go)}</span></button>})}</>}
    {today&&courses.length>0&&!focus.length&&<div className="qbox" style={{marginTop:6}}><b>{tr('home.caughtUp')}</b><p className="known" style={{margin:'6px 0 0'}}>{tr('home.caughtUpHint')}</p></div>}
    {courses.length>0&&<><h3 className="sec">{tr('home.myCourses')}</h3>{courses.map(({p,s,c,topics},i)=>{const done=topics.filter(t=>t.status==='completed').length,pc=topics.length?Math.round(100*done/topics.length):0,late=topics.filter(t=>t.overdue).length,next=topics.find(t=>t.status==='in_progress')||topics.find(t=>t.status==='not_started')
      if(c.archived)return <div key={c.id} className="card" style={{opacity:.7}}><button className="hit" onClick={()=>toast(tr('home.unavailableToast'))} aria-label={c.name+', '+tr('home.unavailable')}><span className="dot" style={{background:'var(--mut)'}}><Lock size={18}/></span><div><b>{c.name}</b><span>{tr('home.unavailable')}</span></div></button></div>
      return <div key={c.id} className="card" style={{display:'block'}}><button className="hit" style={{width:'100%'}} onClick={()=>onOpen([p.id,s.id,c.id])}><span className="dot" style={{background:COL[i%5]}}>{c.name[0]}</span><div style={{flex:1}}><b>{c.name}{late>0&&<span className="pill off sm">{tr('home.overdueN',{n:late})}</span>}</b><span>{tr('home.courseProgress',{done,total:topics.length,pc})}</span><Bar2 v={pc}/>{next&&<span className="nexts">{tr(next.status==='in_progress'?'home.continue':'home.next')}: {next.title}</span>}</div></button></div>})}</>}
    {due.length>0&&<><h3 className="sec">{tr('home.comingUp')}</h3>{due.map(t=><button key={t.id} className="row rowbtn" onClick={()=>setTopic(t.id)}><div>{t.title}<small>{tr('home.dueOn',{course:t.x.c.name,when:when(t.learning_due_at)})}</small></div>{t.overdue&&<span className="pill off sm">{tr('home.overdue')}</span>}<ChevronRight size={18}/></button>)}</>}
    {need.length>0&&<><h3 className="sec">{tr('home.worthRound')}</h3><AreaList areas={need} onStudy={setTopic}/></>}
  </div></>}
function SearchPage({user,toast}){const {t:tr}=useI18n();
  const [q,setQ]=useState(''),[live,setLive]=useState(null),[asked,setAsked]=useState(''),[ai,setAi]=useState(null),[aiBusy,setAiBusy]=useState(false),[aiErr,setAiErr]=useState(''),[topic,setTopic]=useState(null),[pend,setPend]=useState(false)
  const typed=q.trim()
  useEffect(()=>{if(typed.length<2){setLive(null);return}const t=setTimeout(()=>api('/search?q='+encodeURIComponent(typed)).then(r=>setLive({...r,for:typed})).catch(()=>{}),300);return()=>clearTimeout(t)},[typed])
  const askAi=async(query,refresh)=>{setAiBusy(true);setAiErr('');try{setAi({...await api('/search/ai',{method:'POST',body:{q:query,refresh}}),for:query,fresh:refresh})}catch(e){setAiErr(e.message)}setAiBusy(false)}
  const submit=async()=>{if(typed.length<2)return;setPend(true);setAi(null);setAiErr('')
    try{const r=await api('/search?q='+encodeURIComponent(typed));setLive({...r,for:typed});setAsked(typed);setPend(false)
      if(!r.results.length||!r.confident)await askAi(typed,false)}catch(e){toast(e.message);setPend(false)}}  // nothing good in the app's own notes, so the AI answers
  if(topic)return <Topic id={topic} back={()=>setTopic(null)} toast={toast} role={user.role}/>
  const res=asked&&live?.for===asked?live:null,aiNote=ai&&res&&res.results.length>0&&!res.confident
  return <><Bar title={tr('search.title')} sub={tr('search.sub')}/><div className="main">
    <div className="search"><Search size={18}/><input type="search" aria-label={tr('search.aria')} autoFocus placeholder={tr('search.ph')} value={q} maxLength={200} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==='Enter'&&submit()}/></div>
    <button className="btn" disabled={pend||aiBusy||typed.length<2} onClick={submit}>{pend?tr('search.searching'):tr('search.go')}</button>
    {!asked&&live&&live.results.length>0&&<><h3 className="sec">{tr('search.inCourses')}</h3><p className="known">{tr('search.pressEnter')}</p>{live.results.slice(0,5).map(x=><Hit key={x.id} x={x} open={setTopic}/>)}</>}
    {!asked&&typed.length>=2&&live&&!live.results.length&&<p className="known">{tr('search.noneYet')}</p>}
    {res&&<>{res.results.length>0?<><h3 className="sec">{aiNote?tr('search.possible'):tr('search.inCourses')}</h3>{res.results.map(x=><Hit key={x.id} x={x} open={setTopic}/>)}</>
      :<p className="known" style={{marginTop:18}}>{tr('search.noneFor',{q:asked})}</p>}
      {!ai&&!aiBusy&&<button className="btn ghost" onClick={()=>askAi(asked,false)}><Sparkles size={16}/> {tr('search.recheck')}</button>}</>}
    {aiBusy&&<div className="qbox" aria-live="polite"><b>{tr('search.asking')}</b><div className="sk"/></div>}
    {aiErr&&<div className="qbox" role="alert"><b>{tr('search.failed')}</b><p className="known" style={{margin:'6px 0 0'}}>{aiErr}</p></div>}
    {ai&&!aiBusy&&<><h3 className="sec">{tr('search.aiAnswer')}</h3><div className="prose">{ai.cached&&<span className="chip">{tr('search.saved')}</span>}<Md>{ai.text}</Md></div>
      <p className="known">{tr('search.mistakes')}</p>
      <button className="btn ghost" disabled={aiBusy} onClick={()=>askAi(ai.for,true)}><Sparkles size={16}/> {tr('search.unhappy')}</button></>}</div></>}
function Hit({x,open}){const {t:tr}=useI18n();return <button className="hitrow" onClick={()=>open(x.id)}><b>{x.title}{x.in_title&&<span className="chip" style={{marginLeft:8}}>{tr('search.best')}</span>}</b><small>{[x.program,x.semester,x.course,x.unit].filter(Boolean).join(' › ')}</small>{x.snippet&&<span className="snip">{x.snippet}</span>}</button>}

function Insights({toast,role}){const {t:tr}=useI18n();
  const [d,setD]=useState(null),[topic,setTopic]=useState(null),[sc,setSc]=useState(null)
  useEffect(()=>{if(!topic)api('/me/insights').then(setD).catch(e=>toast(e.message))},[topic])
  if(topic)return <Topic id={topic} back={()=>setTopic(null)} toast={toast} role={role}/>
  if(sc)return <ScoreCourse c={sc} back={()=>setSc(null)} toast={toast} role={role}/>
  const n=d?d.needs_study.length:0
  return <><Bar title={tr('insights.title')} sub={tr('insights.sub')}/><div className="main">
    <MyScores onCourse={setSc}/>{d?.courses.length>0&&<h3 className="sec">{tr('insights.strengths')}</h3>}
    {!d&&<Skeleton/>}
    {d&&!d.courses.length&&<p className="known">{tr('insights.takeQuiz')}</p>}
    {d?.courses.length>0&&<div className="qbox"><b>{n?tr(n===1?'insights.areaOne':'insights.areaMany',{n}):tr('insights.none')}</b><p className="known" style={{margin:'4px 0 0'}}>{tr('insights.summary',{strong:d.strong.length,getting:d.getting_there.length,n:d.quizzes_taken,quizzes:tr(d.quizzes_taken===1?'insights.quizOne':'insights.quizMany')})}</p></div>}
    {d?.courses.map(c=><section key={c.course_id}><h3 className="sec">{tr('insights.courseRight',{course:c.course,pct:c.percent})}</h3><AreaList areas={c.areas} onStudy={setTopic}/></section>)}</div></>}

const uploadImg=async f=>{const r=await fetch('/api/uploads',{method:'POST',headers:{'Content-Type':f.type||'application/octet-stream',Authorization:'Bearer '+localStorage.t},body:f}),j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.detail||'Upload failed');return j.url}
// one image place on a question or an answer: shows the image, the file the CSV asked for, or a small "Add image" button
function ImgSlot({url,need,label,onSet,toast,small}){const {t:tr}=useI18n();
  const ref=useRef(),[busy,setBusy]=useState(false)
  const pick=async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;setBusy(true);try{onSet(await uploadImg(f))}catch(x){toast(x.message)}setBusy(false)}
  const input=<input ref={ref} type="file" accept="image/png,image/jpeg,image/gif,image/webp" hidden onChange={pick}/>
  if(url)return <div className={'islot'+(small?' sm':'')}>{input}<img src={url} alt={label}/><span><button className="tool" onClick={()=>ref.current.click()}>{tr('qe.replace')}</button><button className="tool" onClick={()=>onSet('')}>{tr('qe.removeImg')}</button></span></div>
  if(need)return <div className="islot need" role="status">{input}<AlertTriangle size={16}/><span>{tr('qe.needs')} <b>{need}</b></span><button className="tool" disabled={busy} onClick={()=>ref.current.click()}>{busy?tr('qe.uploading'):tr('qe.upload')}</button><button className="tool" onClick={()=>onSet('',true)}>{tr('qe.skip')}</button></div>
  return <>{input}<button className="tool" disabled={busy} onClick={()=>ref.current.click()} aria-label={tr('qe.addImgTo',{label})}>{busy?tr('qe.uploading'):small?tr('qe.imageSm'):tr('qe.addImage')}</button></>}
const QImg=({src,alt})=>src?<img className="qimg" src={src} alt={alt} loading="lazy"/>:null
const OptBody=({text,img,k})=><span className="obody">{img&&<img src={img} alt={'Answer '+LET[k]}/>}{text?<Md>{text}</Md>:!img&&<span>—</span>}</span>
const LET='ABCDEF'
function QuizPlay({id,back,toast,role}){const {t:tr}=useI18n();
  const [q,setQ]=useState(null),[ans,setAns]=useState([]),[res,setRes]=useState(null),[busy,setBusy]=useState(false),[topic,setTopic]=useState(null),[view,setView]=useState(null)
  const start=d=>{setQ(d);setAns(d.questions.map(()=>null));setRes(null)}
  useEffect(()=>{api('/quizzes/'+id).then(start).catch(e=>{toast(e.message);back()})},[id])
  if(topic)return <Topic id={topic} back={()=>setTopic(null)} toast={toast} role={role}/>
  if(view)return view.kind==='attempt'?<AttemptView id={view.id} back={()=>setView(null)} toast={toast} role={role}/>:view.kind==='mine'?<MyAttempts quiz={id} back={()=>setView(null)} toast={toast} role={role}/>:<QuizResults id={id} back={()=>setView(null)} toast={toast} role={role}/>
  if(!q)return <><Bar title={tr('quiz.title')} back={back}/><div className="main"><Skeleton/></div></>
  const left=ans.filter(a=>a===null).length
  const submit=async()=>{setBusy(true);try{setRes(await api(`/quizzes/${id}/attempt`,{method:'POST',body:{answers:ans}}));window.scrollTo(0,0)}catch(e){toast(e.message)}setBusy(false)}
  return <><Bar title={q.title} sub={tr('quiz.subPass',{n:q.questions.length,pct:q.pass_percent})+(q.kind==='course'?' · '+tr('quiz.courseTest'):'')} back={back}/><div className="main">
    {!res&&q.can_edit&&<button className="btn ghost" style={{marginTop:0}} onClick={()=>setView({kind:'results'})}><BarChart3 size={16}/> {tr('quiz.results')}</button>}
    {!res&&q.attempts>0&&<p className="known" style={{marginTop:0}}>{tr('quiz.tried',{count:tr(q.attempts===1?'quiz.timeOne':'quiz.timeMany',{n:q.attempts}),best:q.best,latest:q.latest})} <button className="tool" onClick={()=>setView({kind:'mine'})}>{tr('quiz.seeAttempts')}</button></p>}
    {res&&<div className="qbox"><h2 style={{margin:0}}>{res.score} / {res.total} · {res.percent}%</h2><p className="known">{res.passed?tr('quiz.passed'):tr('quiz.notYet')}{res.summary&&' '+res.summary}</p>
      <div className="two"><button className="btn" onClick={()=>setView({kind:'attempt',id:res.attempt_id})}>{tr('quiz.review')}</button><button className="btn ghost" onClick={()=>start(q)}>{tr('quiz.retry')}</button></div><button className="btn ghost" onClick={back}>{tr('common.back')}</button></div>}
    {res&&res.areas?.length>0&&<><h3 className="sec">{tr('quiz.revisit')}</h3><AreaList areas={res.areas} onStudy={setTopic}/></>}
    {q.questions.map((x,i)=><div className="qbox" key={x.id}><b>{tr('quiz.question',{n:i+1})}</b><div className="prose"><Md>{x.text}</Md></div><QImg src={x.image} alt={tr('quiz.pictureQ',{n:i+1})}/>
      {x.options.map((o,k)=>{const r=res&&res.results[i],cls=r?(k===r.correct||(r.ok&&k===r.chosen)?' ok':k===r.chosen?' bad':''):ans[i]===k?' sel':''
        return <button key={k} className={'opt'+cls} disabled={!!res} aria-pressed={!res&&ans[i]===k} onClick={()=>setAns(ans.map((a,n)=>n===i?k:a))}><b className="olet">{LET[k]}</b><OptBody text={o} img={x.option_images[k]} k={k}/></button>})}
      {res&&res.results[i].explanation&&<div className="known"><Md>{res.results[i].explanation}</Md></div>}</div>)}
    {!res&&<button className="btn" disabled={busy} onClick={submit}>{busy?tr('quiz.checking'):tr('quiz.submit')}</button>}
    {!res&&left>0&&<p className="known">{tr('quiz.unanswered',{n:left})}</p>}</div></>}
// one attempt, question by question
function AttemptView({id,back,toast,role}){const {t:tr}=useI18n();
  const [d,setD]=useState(null),[topic,setTopic]=useState(null)
  useEffect(()=>{api('/attempts/'+id).then(setD).catch(e=>{toast(e.message);back()})},[id])
  if(topic)return <Topic id={topic} back={()=>setTopic(null)} toast={toast} role={role}/>
  if(!d)return <><Bar title={tr('quiz.attempt')} back={back}/><div className="main"><Skeleton/></div></>
  const staff=role!=='student',right=d.questions.filter(x=>x.ok).length
  return <><Bar title={d.quiz} sub={(staff?d.user+' · ':'')+when(d.at)} back={back}/><div className="main">
    <div className="qbox" style={{marginTop:0}}><h2 style={{margin:0}}>{d.score} / {d.total} · {d.percent}%</h2><p className="known" style={{marginBottom:0}}>{tr('quiz.resultLine',{result:tr(d.passed?'quiz.passedShort':'quiz.below'),pct:d.pass_percent})}{d.summary&&' '+d.summary}</p></div>
    {d.areas.length>0&&<><h3 className="sec">{tr(staff?'insights.strengths':'quiz.revisit')}</h3><AreaList areas={d.areas} onStudy={staff?null:setTopic} staff={staff}/></>}
    {d.no_detail&&<p className="known">{tr('quiz.noDetail')}</p>}
    {d.changed>0&&<p className="known">{tr(d.changed===1?'quiz.changedOne':'quiz.changedMany',{n:d.changed})}</p>}
    {!d.reveal&&d.questions.length>0&&<p className="known">{tr('quiz.seeRight',{right,total:d.questions.length})}</p>}
    {d.questions.map((x,i)=><div className="qbox" key={x.id}><b>{tr('quiz.question',{n:i+1})} · {tr(x.ok?'quiz.right':'quiz.wrong')}{x.area?' · '+x.area:''}</b><div className="prose"><Md>{x.text}</Md></div><QImg src={x.image} alt={tr('quiz.pictureQ',{n:i+1})}/>
      {x.options.map((o,k)=>{const mine=x.chosen_known&&x.chosen===k,key=d.reveal&&x.correct===k,cls=key||(mine&&x.ok)?' ok':mine?' bad':''
        return <div key={k} className={'opt'+cls}><b className="olet">{LET[k]}</b><OptBody text={o} img={x.option_images[k]} k={k}/>{(mine||key)&&<span className="otag">{[mine&&(staff?tr('quiz.theirAnswer'):tr('quiz.yourAnswer')),key&&tr('quiz.correctAnswer')].filter(Boolean).join(' · ')}</span>}</div>})}
      {x.chosen_known&&x.chosen==null&&<p className="known">{tr('quiz.leftBlank')}</p>}
      {x.explanation&&<div className="known"><Md>{x.explanation}</Md></div>}</div>)}</div></>}
function MyAttempts({quiz,user,back,toast,role}){const {t:tr}=useI18n();  // a person's attempts at one quiz; staff pass user to see a student's
  const [d,setD]=useState(null),[open,setOpen]=useState(null)
  useEffect(()=>{api(`/quizzes/${quiz}/attempts`+(user?'?user_id='+user:'')).then(setD).catch(e=>{toast(e.message);back()})},[quiz,user])
  if(open)return <AttemptView id={open} back={()=>setOpen(null)} toast={toast} role={role}/>
  return <><Bar title={d?.quiz||tr('quiz.attempts')} sub={d?(user?d.user+' · ':'')+tr(d.items.length===1?'quiz.attemptOne':'quiz.attemptMany',{n:d.items.length}):''} back={back}/><div className="main">
    {d&&!d.items.length&&<p className="known">{tr('quiz.noAttempts')}</p>}
    {d?.items.map((a,i)=><button key={a.id} className="row rowbtn" onClick={()=>setOpen(a.id)}><div>{a.score} / {a.total} · {a.percent}%<small>{when(a.at)} · {tr(a.passed?'quiz.passedShort':'quiz.below')}{i===0?' · '+tr('quiz.latest'):''}</small><Bar2 v={a.percent}/></div><ChevronRight size={18}/></button>)}</div></>}

const MCQ_TEMPLATE=`question,a,b,c,d,correct,explanation,topic,area,question_image,a_image,b_image,c_image,d_image
"Which ion makes water hard?",Na+,Ca2+,Cl-,K+,B,"Calcium and magnesium salts cause hardness.",Water Treatment,,,,,,
"Which boiler is shown in the picture?",Fire tube,Water tube,Electric,Packaged,A,,Boilers,,boiler.png,,,,
"Pick the symbol for a resistor",,,,,C,,,Circuit symbols,,sym-a.png,sym-b.png,sym-c.png,sym-d.png
"What is 15% of 200?",20,30,15,35,30,,,Arithmetic,,,,,
`
const CSV_COLS=[['question','qe.c.question'],['a, b, c, d (up to f)','qe.c.answers'],['correct','qe.c.correct'],['explanation','qe.c.expl'],
  ['topic','qe.c.topic'],['area','qe.c.area'],['question_image, a_image … f_image','qe.c.images']]
const blankQ=()=>({text:'',options:['',''],option_images:['',''],correct:0,explanation:'',topic_id:null,area:'',image:'',need:{image:'',options:[]}})
const fromCsv=x=>({text:x.text,options:x.options,option_images:x.option_images.map(v=>v||''),correct:x.correct,explanation:x.explanation||'',topic_id:x.topic_id,area:x.area||'',image:x.image||'',
  need:{image:x.image?'':x.image_name,options:x.option_image_names.map((n,k)=>x.option_images[k]?'':n)}})
const missing=qs=>qs.flatMap((x,i)=>[...(x.need.image&&!x.image?[{i,k:-1,name:x.need.image}]:[]),...x.need.options.map((n,k)=>n&&!x.option_images[k]?{i,k,name:n}:null).filter(Boolean)])
function QuizEditor({id,unit_id,course_id,unitTopics,csvFirst,done,toast}){const {t:tr}=useI18n();
  const confirm=useConfirm()
  const [m,setM]=useState({title:'',pass_percent:50,published:false,reveal:false}),[qs,setQs]=useState([blankQ()]),[busy,setBusy]=useState(false),[topics,setTopics]=useState(unitTopics||[]),csvRef=useRef(null),imgRef=useRef(null)
  const [csv,setCsv]=useState(null),[bank,setBank]=useState(false),[btags,setBtags]=useState(''),[stage,setStage]=useState(csvFirst&&!id?'csv':'edit'),[cid,setCid]=useState(course_id)
  const course=!unit_id
  useEffect(()=>{if(id)api('/quizzes/'+id).then(d=>{setM({title:d.title,pass_percent:d.pass_percent,published:d.published,reveal:d.reveal});setCid(d.course_id);setTopics(d.topics||[])
    setQs(d.questions.length?d.questions.map(x=>({text:x.text,options:x.options,option_images:x.options.map((_,k)=>x.option_images[k]||''),correct:x.correct,explanation:x.explanation||'',topic_id:x.topic_id??null,area:x.area||'',image:x.image||'',need:{image:'',options:[]}})):[blankQ()])}).catch(e=>{toast(e.message);done()})
    else if(course&&course_id)api('/courses/'+course_id+'/topics').then(setTopics).catch(()=>{})},[id])
  const upd=(i,p)=>setQs(cur=>cur.map((x,n)=>n===i?{...x,...p}:x))
  const setOpt=(i,k,v)=>upd(i,{options:qs[i].options.map((o,n)=>n===k?v:o)})
  const setOptImg=(i,k,v,skip)=>setQs(cur=>cur.map((x,n)=>n!==i?x:{...x,option_images:x.options.map((_,j)=>j===k?v:x.option_images[j]||''),need:skip||v?{...x.need,options:x.need.options.map((nm,j)=>j===k?'':nm)}:x.need}))
  const setQImg=(i,v,skip)=>setQs(cur=>cur.map((x,n)=>n!==i?x:{...x,image:v,need:skip||v?{...x.need,image:''}:x.need}))
  const delOpt=(i,k)=>{const x=qs[i];upd(i,{options:x.options.filter((_,n)=>n!==k),option_images:x.option_images.filter((_,n)=>n!==k),need:{...x.need,options:x.need.options.filter((_,n)=>n!==k)},correct:x.correct===k?0:x.correct>k?x.correct-1:x.correct})}
  const todo=missing(qs)
  const payload=()=>qs.filter(x=>x.text.trim()||x.image).map(x=>({text:x.text,options:x.options,option_images:x.option_images,correct:x.correct,explanation:x.explanation,topic_id:x.topic_id,area:x.area,image:x.image}))
  const save=async()=>{setBusy(true);try{const body={...(course?{course_id:cid}:{unit_id}),...m,pass_percent:+m.pass_percent},qid=id||(await api('/quizzes',{method:'POST',body})).id
    if(id)await api('/quizzes/'+id,{method:'PUT',body})
    await api(`/quizzes/${qid}/questions`,{method:'PUT',body:{questions:payload()}});toast(course?tr('qe.testSaved'):tr('qe.quizSaved'));done()}catch(e){toast(e.message)}setBusy(false)}
  const readCsv=async(f,replace)=>{try{const r=await api('/quizzes/parse-csv',{method:'POST',body:{csv:await f.text(),...(course?{course_id:cid}:{unit_id})}});setCsv(r)
    if(!r.questions.length){toast(tr('qe.noQuestions'));return}
    const got=r.questions.map(fromCsv);setQs(cur=>replace?got:[...cur.filter(x=>x.text.trim()||x.image),...got])
    if(replace&&!m.title)setM(v=>({...v,title:f.name.replace(/\.[^.]+$/,'').replace(/[_-]+/g,' ').slice(0,200)}))
    setStage('edit');toast(tr('qe.read',{count:tr(r.questions.length===1?'quiz.qOne':'quiz.qMany',{n:r.questions.length}),images:r.images_needed.length?tr('qe.andUpload'):''}))}catch(e){toast(e.message)}}
  const importCsv=async e=>{const f=e.target.files[0];e.target.value='';if(f)readCsv(f,stage==='csv')}
  const bulkImages=async e=>{const files=[...e.target.files];e.target.value='';if(!files.length)return;setBusy(true);let used=0;const extra=[];let next=qs
    for(const f of files){const hits=missing(next).filter(s=>s.name.toLowerCase()===f.name.toLowerCase());if(!hits.length){extra.push(f.name);continue}
      try{const url=await uploadImg(f);used++;next=next.map((x,i)=>{const h=hits.filter(s=>s.i===i);if(!h.length)return x
        return {...x,image:h.some(s=>s.k<0)?url:x.image,option_images:x.option_images.map((v,k)=>h.some(s=>s.k===k)?url:v),need:{image:h.some(s=>s.k<0)?'':x.need.image,options:x.need.options.map((n,k)=>h.some(s=>s.k===k)?'':n)}}})}catch(x){toast(f.name+': '+x.message)}}
    setQs(next);setBusy(false);toast(tr('qe.matched',{count:tr(used===1?'qe.imgOne':'qe.imgMany',{n:used}),extra:extra.length?tr('qe.notInCsv',{names:extra.slice(0,3).join(', ')+(extra.length>3?'…':'')}):''}))}
  const addFromBank=picked=>{setQs(cur=>[...cur.filter(x=>x.text.trim()),...picked.map(x=>({...blankQ(),text:x.text,options:x.options,option_images:x.options.map(()=>''),correct:x.correct,explanation:x.explanation||''}))]);setBank(false);toast(tr('qe.added',{count:tr(picked.length===1?'quiz.qOne':'quiz.qMany',{n:picked.length})}))}
  const toBank=async()=>{const list=qs.filter(x=>x.text.trim());let added=0,skipped=0,bad=0;setBusy(true)
    for(const x of list){if(x.image||x.option_images.some(Boolean)){bad++;continue}try{await api('/bank',{method:'POST',body:{text:x.text,options:x.options,correct:x.correct,explanation:x.explanation,tags:btags,source:m.title}});added++}catch(e){/already in the bank/.test(e.message)?skipped++:bad++}}
    setBusy(false);toast(tr('qe.bankDone',{added,skipped:skipped?tr('qe.alreadyThere',{n:skipped}):'',bad:bad?tr('qe.badSkipped',{n:bad}):''}))}
  const del=async()=>{if(!await confirm({title:tr('qe.delTitle',{what:course?tr('qe.test'):tr('qe.quiz')}),body:tr('qe.delBody'),ok:tr('sheet.delete'),danger:true}))return;try{await api('/quizzes/'+id,{method:'DELETE'});toast(tr('sheet.deleted'));done()}catch(e){toast(e.message)}}
  const fileInputs=<><input ref={csvRef} type="file" accept=".csv,text/csv,text/plain" hidden onChange={importCsv}/><input ref={imgRef} type="file" accept="image/png,image/jpeg,image/gif,image/webp" multiple hidden onChange={bulkImages}/></>
  const csvNotes=csv&&(csv.error_count>0||csv.warnings.length>0)&&<div className="qbox" role="alert">{csv.error_count>0&&<><b>{tr(csv.error_count===1?'qe.rowsFailOne':'qe.rowsFailMany',{n:csv.error_count})}</b>{csv.errors.slice(0,10).map((x,i)=><p className="known" style={{margin:'4px 0'}} key={i}>{tr('prog.rowErr',{row:x.row,error:x.error})}</p>)}{csv.error_count>10&&<p className="known">{tr('bulk.andMore',{n:csv.error_count-10})}</p>}</>}
    {csv.warnings.length>0&&<><b style={{display:'block',marginTop:csv.error_count?10:0}}>{tr('qe.worth')}</b>{csv.warnings.slice(0,8).map((w,i)=><p className="known" style={{margin:'4px 0'}} key={i}>{w}</p>)}{csv.warnings.length>8&&<p className="known">{tr('bulk.andMore',{n:csv.warnings.length-8})}</p>}</>}</div>
  if(stage==='csv')return <><Bar title={tr('qe.newMcq')} sub={tr('qe.step1')} back={done}/><div className="main">{fileInputs}
    <p className="known" style={{marginTop:0}}>{tr('qe.csvIntro')}</p>
    <button className="btn" onClick={()=>csvRef.current.click()}><Upload size={16}/> {tr('qe.chooseCsv')}</button><button className="btn ghost" onClick={()=>download('mcq-template.csv',MCQ_TEMPLATE)}>{tr('qe.downloadTpl')}</button>
    {csvNotes}
    <h3 className="sec">{tr('qe.columns')}</h3>{CSV_COLS.map(([c,h])=><div className="row" key={c}><div><code>{c}</code><small>{tr(h)}</small></div></div>)}
    <p className="known">{tr('qe.firstRow')}</p></div></>
  return <><Bar title={id?(course?tr('qe.editTest'):tr('qe.editQuiz')):csvFirst?tr('qe.newMcq'):tr('qe.newQuiz')} sub={csvFirst&&!id?tr('qe.step2'):''} back={done}/><div className="main">{fileInputs}
    {csvNotes}
    {todo.length>0&&<div className="qbox need" role="status"><b>{tr('qe.stillUpload',{count:tr(todo.length===1?'qe.imgOne':'qe.imgMany',{n:todo.length})})}</b><p className="known" style={{margin:'4px 0 8px'}}>{tr('qe.matchHint')}{[...new Set(todo.map(x=>x.name))].slice(0,6).join(', ')}{todo.length>6?'…':''}</p>
      <button className="btn" style={{margin:0}} disabled={busy} onClick={()=>imgRef.current.click()}><Upload size={16}/> {busy?tr('qe.uploading'):tr('qe.uploadImages')}</button></div>}
    <label>{tr('qe.title')}</label><input value={m.title} onChange={e=>setM({...m,title:e.target.value})} placeholder={course?tr('qe.coursePh'):tr('qe.quizTitlePh')}/>
    <label>{tr('qe.passMark')}</label><input type="number" min="1" max="100" value={m.pass_percent} onChange={e=>setM({...m,pass_percent:e.target.value})}/>
    <label className="chk"><input type="checkbox" checked={m.published} onChange={e=>setM({...m,published:e.target.checked})}/> {tr('qe.published')}</label>
    <label className="chk"><input type="checkbox" checked={m.reveal} onChange={e=>setM({...m,reveal:e.target.checked})}/> {tr('qe.reveal')}</label>
    {qs.map((x,i)=><div className="qbox" key={i}><b>{tr('quiz.question',{n:i+1})}</b>
      <textarea placeholder={tr('qe.qPh')} value={x.text} onChange={e=>upd(i,{text:e.target.value})}/>
      <ImgSlot url={x.image} need={x.need.image} label={tr('qe.questionLbl',{n:i+1})} toast={toast} onSet={(v,skip)=>setQImg(i,v,skip)}/>
      {x.options.map((o,k)=><div key={k}><div className="qopt"><input type="radio" name={'c'+i} aria-label={tr('qe.correctAria',{letter:LET[k]})} checked={x.correct===k} onChange={()=>upd(i,{correct:k})}/><b className="olet">{LET[k]}</b><input value={o} placeholder={tr(x.option_images[k]?'qe.answerImgPh':'qe.answerPh',{letter:LET[k]})} onChange={e=>setOpt(i,k,e.target.value)}/>
        {!x.option_images[k]&&!x.need.options[k]&&<ImgSlot small label={tr('qe.answerLbl',{letter:LET[k]})} toast={toast} onSet={v=>setOptImg(i,k,v)}/>}{x.options.length>2&&<button className="ic sm" aria-label={tr('qe.removeAnswer',{letter:LET[k]})} onClick={()=>delOpt(i,k)}><X size={16}/></button>}</div>
        {(x.option_images[k]||x.need.options[k])&&<div style={{paddingLeft:48}}><ImgSlot small url={x.option_images[k]} need={x.need.options[k]} label={tr('qe.answerLbl',{letter:LET[k]})} toast={toast} onSet={(v,skip)=>setOptImg(i,k,v,skip)}/></div>}</div>)}
      {x.options.length<6&&<button className="tool" onClick={()=>upd(i,{options:[...x.options,''],option_images:[...x.option_images,'']})}>{tr('qe.addAnswer')}</button>}
      <label>{tr('qe.topicLbl')}</label><select value={x.topic_id??''} onChange={e=>upd(i,{topic_id:e.target.value?+e.target.value:null})}><option value="">{tr('qe.notTied')}</option>{topics.map(t=><option key={t.id} value={t.id}>{t.unit?t.unit+' › ':''}{t.title}</option>)}</select>
      {x.topic_id==null&&<><label>{tr('qe.area')}</label><input value={x.area} onChange={e=>upd(i,{area:e.target.value})} placeholder={tr('qe.areaPh')}/></>}
      <textarea placeholder={tr('qe.explPh')} value={x.explanation} onChange={e=>upd(i,{explanation:e.target.value})}/>
      {qs.length>1&&<button className="tool" onClick={()=>setQs(qs.filter((_,n)=>n!==i))}>{tr('qe.removeQ')}</button>}</div>)}
    <p className="known">{tr('qe.tickHint')}</p>
    <button className="btn ghost" onClick={()=>setQs([...qs,blankQ()])}>{tr('qe.addQ')}</button>
    <div className="two"><button className="btn ghost" onClick={()=>csvRef.current.click()}><Upload size={16}/> {tr('qe.addCsv')}</button><button className="btn ghost" onClick={()=>download('mcq-template.csv',MCQ_TEMPLATE)}>{tr('qe.csvTpl')}</button></div>
    <button className="btn ghost" onClick={()=>setBank(true)}>{tr('qe.fromBank')}</button>
    <label htmlFor="bt">{tr('qe.shareBank')}</label><div className="two"><input id="bt" value={btags} onChange={e=>setBtags(e.target.value)} placeholder={tr('qe.tagsPh')}/><button className="btn ghost" disabled={busy||!qs.some(x=>x.text.trim())} onClick={toBank}>{tr('qe.saveBank')}</button></div>
    <button className="btn" disabled={busy||todo.length>0} onClick={save}>{busy?tr('qe.saving'):todo.length?tr('qe.uploadFirst',{count:tr(todo.length===1?'qe.imgOne':'qe.imgMany',{n:todo.length})}):id?tr('topic.saveChanges'):tr(course?'qe.createTest':'qe.saveQuiz')}</button>{bank&&<BankSheet close={()=>setBank(false)} onAdd={addFromBank} toast={toast}/>}
    {id&&<button className="btn danger" onClick={del}>{tr('qe.deleteBtn',{what:course?tr('qe.test'):tr('qe.quiz')})}</button>}</div></>}

// score spread: one series, so one hue and no legend; every bar has its count as text and a tooltip
const Spread=({rows,pass})=>{const {t:tr}=useI18n();const top=Math.max(1,...rows.map(r=>r.count))
  return <figure className="spread" aria-label={tr('gb.spreadAria')}><div className="sbars">{rows.map((r,i)=><div key={r.label} className="sbar" title={`${r.label}%: ${tr(r.count===1?'res.studentOne':'res.studentMany',{n:r.count})}`}><em>{r.count||''}</em><i style={{height:r.count?Math.max(4,100*r.count/top)+'%':0}} className={i*10+9<pass?'below':''}/></div>)}</div>
    <div className="saxis">{rows.map(r=><span key={r.label}>{r.label.split('–')[0]}</span>)}</div><figcaption>{tr('gb.spreadCap',{pass})}</figcaption></figure>}
const PassPill=({ok})=>{const {t:tr}=useI18n();return <span className={'pill sm '+(ok?'okp':'off')}>{ok?tr('quiz.passedShort'):tr('gb.notYet')}</span>}
function QuizResults({id,back,toast,role}){const {t:tr}=useI18n();
  const [d,setD]=useState(null),[tab,setTab]=useState('overview'),[who,setWho]=useState(null),[sort,setSort]=useState('order')
  useEffect(()=>{api(`/quizzes/${id}/results`).then(setD).catch(e=>{toast(e.message);back()})},[id])
  if(who)return <MyAttempts quiz={id} user={who} back={()=>setWho(null)} toast={toast} role={role}/>
  if(!d)return <><Bar title={tr('res.title')} back={back}/><div className="main"><Skeleton/></div></>
  const sm=d.summary,qs=sort==='hard'?[...d.questions].sort((a,b)=>(a.percent??101)-(b.percent??101)):d.questions
  return <><Bar title={d.title} sub={tr('res.sub',{took:sm.took,students:sm.students})} back={back}/><div className="main">
    <Tabs scroll label={tr('res.sections')} items={[['overview',tr('res.overview')],['students',tr('res.students')],['questions',tr('res.questions')],['areas',tr('res.strengths')]]} value={tab} onChange={setTab}/>
    {tab==='overview'&&<>{!sm.took?<p className="known">{tr('res.nobody')}{d.published?'':' '+tr('res.draft')}</p>:<>
      <div className="stats">{[[tr('res.avgFinal'),sm.average+'%'],[tr('res.passRate'),sm.pass_rate+'%',tr('res.passedOf',{passed:sm.passed,took:sm.took})],[tr('res.median'),sm.median+'%'],[tr('res.highLow'),sm.highest+'% · '+sm.lowest+'%'],
        [tr('res.tookIt'),sm.took+' / '+sm.students,sm.not_taken?tr('res.notYetN',{n:sm.not_taken}):tr('res.everyone')],[tr('res.attempts'),sm.attempts,tr('res.latestAvg',{pct:sm.average_latest})]].map(([l,v,x])=><div className="stat" key={l}><b>{v}</b>{l}{x&&<small style={{display:'block',color:'var(--mut)'}}>{x}</small>}</div>)}</div>
      <h3 className="sec">{tr('res.spread')}</h3><Spread rows={sm.distribution} pass={d.pass_percent}/>
      <p className="known">{tr('res.finalNote')}</p></>}
      {d.not_taken.length>0&&<><h3 className="sec">{tr('res.notTakenN',{n:sm.not_taken})}</h3><p className="known" style={{margin:0}}>{d.not_taken.map(x=>x.name).join(', ')}{sm.not_taken>d.not_taken.length?'…':''}</p></>}
      <button className="btn ghost" onClick={()=>fetchFile(`/quizzes/${id}/results?format=csv`,'results-'+d.title.replace(/\s+/g,'_')+'.csv',toast)}>{tr('res.downloadCsv')}</button></>}
    {tab==='students'&&<>{!d.students.length&&<p className="known">{tr('res.noResults')}</p>}
      {d.students.map(x=><button key={x.user_id} className="row rowbtn" onClick={()=>setWho(x.user_id)}><div>{x.name}<PassPill ok={x.passed}/><small>{tr('res.finalLatest',{best:x.best,latest:x.latest})} · {tr(x.attempts===1?'quiz.attemptOne':'quiz.attemptMany',{n:x.attempts})} · {day(x.last_at)}</small>
        {(x.strong.length>0||x.needs_study.length>0)&&<small>{x.strong.length>0&&tr('res.goodAt')+': '+x.strong.join(', ')}{x.strong.length>0&&x.needs_study.length>0&&' · '}{x.needs_study.length>0&&tr('res.revisit')+': '+x.needs_study.join(', ')}</small>}<Bar2 v={x.best}/></div><ChevronRight size={18}/></button>)}</>}
    {tab==='questions'&&<><div className="seg" style={{gridTemplateColumns:'1fr 1fr',margin:'0 0 12px'}}>{[['order',tr('res.byOrder')],['hard',tr('res.hardest')]].map(([k,l])=><button key={k} className={sort===k?'on':''} aria-pressed={sort===k} onClick={()=>setSort(k)}>{l}</button>)}</div>
      {qs.map(x=>{const n=x.picks.reduce((a,b)=>a+b,0)+x.blank
        return <div className="qbox" key={x.id}><b>{tr('quiz.question',{n:x.pos})} · {x.percent==null?tr('res.noAnswers'):tr('res.pctRight',{pct:x.percent})}{x.area?' · '+x.area:''}</b><div className="prose"><Md>{x.text}</Md></div><QImg src={x.image} alt={tr('quiz.pictureQ',{n:x.pos})}/>
          {x.options.map((o,k)=>{const c=x.picks[k],pc=n?Math.round(100*c/n):0
            return <div key={k} className="pick" title={`${LET[k]}: ${tr(c===1?'res.studentOne':'res.studentMany',{n:c})}`}><div className="pickh"><b className="olet">{LET[k]}</b><OptBody text={o} img={x.option_images[k]} k={k}/>{k===x.correct&&<span className="otag ok"><Check size={14}/> {tr('res.correct')}</span>}<span className="pickn">{c} · {pc}%</span></div><div className="meter"><i style={{width:pc+'%'}} className={k===x.correct?'ok':''}/></div></div>})}
          {x.picks_known>0&&x.blank>0&&<p className="known" style={{margin:'6px 0 0'}}>{tr('res.leftBlankN',{n:x.blank})}</p>}
          {x.total>x.picks_known&&<p className="known" style={{margin:'6px 0 0'}}>{tr(x.total-x.picks_known===1?'res.olderOne':'res.olderMany',{n:x.total-x.picks_known})}</p>}</div>})}</>}
    {tab==='areas'&&<>{!d.areas.length?<p className="known">{tr('res.noResults')}</p>:<><p className="known" style={{marginTop:0}}>{tr('res.weakest')}</p>
      {d.areas.map(a=><div className="row" key={a.title+(a.topic_id||'')}><div>{a.title}<small>{tr('res.areaLine',{pct:a.percent,strong:a.strong,getting:a.getting_there,need:a.needs_study})}{a.unit?' · '+a.unit:''}</small><Bar2 v={a.percent}/></div></div>)}</>}</>}</div></>}
function Gradebook({cid,back,toast,role}){const {t:tr}=useI18n();
  const [d,setD]=useState(null),[open,setOpen]=useState(null),[stu,setStu]=useState(null)
  useEffect(()=>{api(`/courses/${cid}/gradebook`).then(setD).catch(e=>{toast(e.message);back()})},[cid])
  if(open)return <QuizResults id={open} back={()=>setOpen(null)} toast={toast} role={role}/>
  if(stu)return stu.quiz?<MyAttempts quiz={stu.quiz} user={stu.id} back={()=>setStu({...stu,quiz:null})} toast={toast} role={role}/>
    :<><Bar title={stu.name} sub={tr('gb.subFinal',{course:d.course,final:stu.final==null?'–':stu.final+'%'})} back={()=>setStu(null)}/><div className="main">{d.tests.map((t,i)=><button key={t.id} className="row rowbtn" disabled={stu.scores[i]==null} onClick={()=>setStu({...stu,quiz:t.id})}><div>{t.title}{stu.scores[i]!=null&&<PassPill ok={stu.scores[i]>=t.pass_percent}/>}<small>{t.unit||tr('gb.courseTest')} · {stu.scores[i]==null?tr('gb.notTaken'):tr('gb.finalN',{pct:stu.scores[i]})} · {tr('gb.pass',{pct:t.pass_percent})}</small>{stu.scores[i]!=null&&<Bar2 v={stu.scores[i]}/>}</div>{stu.scores[i]!=null&&<ChevronRight size={18}/>}</button>)}</div></>
  if(!d)return <><Bar title={tr('gb.title')} back={back}/><div className="main"><Skeleton/></div></>
  return <><Bar title={tr('gb.title')} sub={d.course+' · '+tr(d.tests.length===1?'gb.testOne':'gb.testMany',{n:d.tests.length})} back={back}/><div className="main">
    {!d.tests.length?<p className="known">{tr('gb.none')}</p>:<>
    <p className="known" style={{marginTop:0}}>{tr('gb.intro')}</p>
    <div className="gbwrap"><table className="gb"><thead><tr><th>{tr('gb.student')}</th>{d.tests.map(t=><th key={t.id}><button className="tool" onClick={()=>setOpen(t.id)} title={t.unit||tr('gb.courseTest')}>{t.title}</button><small>{tr('gb.avg',{pct:(t.average??'–')+'%'})}</small></th>)}<th>{tr('gb.final')}</th></tr></thead>
      <tbody>{d.students.map(r=><tr key={r.user_id}><td><button className="tool" onClick={()=>setStu(r)}>{r.name}</button></td>{r.scores.map((v,i)=><td key={i} className={v==null?'na':v>=d.tests[i].pass_percent?'':'low'}>{v==null?'–':v+'%'}</td>)}<td><b>{r.final==null?'–':r.final+'%'}</b><small>{r.taken}/{d.tests.length}</small></td></tr>)}</tbody></table></div>
    <p className="known">{tr('gb.dash')}</p>
    <button className="btn ghost" onClick={()=>fetchFile(`/courses/${cid}/gradebook?format=csv`,'gradebook-'+d.course.replace(/\s+/g,'_')+'.csv',toast)}>{tr('gb.downloadCsv')}</button></>}</div></>}
function ScoreCourse({c,back,toast,role}){const {t:tr}=useI18n();  // one course of a student's scores: each test, then its attempts
  const [q,setQ]=useState(null)
  if(q)return <MyAttempts quiz={q} back={()=>setQ(null)} toast={toast} role={role}/>
  return <><Bar title={c.course} sub={tr('gb.scoreSub',{final:c.final==null?'–':c.final+'%',taken:c.taken,n:c.tests.length})} back={back}/><div className="main">
    {c.tests.map(t=><button key={t.id} className="row rowbtn" disabled={!t.attempts} onClick={()=>setQ(t.id)}><div>{t.title}{t.attempts>0&&<PassPill ok={t.passed}/>}<small>{t.unit||tr('gb.courseTest')} · {t.attempts?tr('gb.bestLatest',{best:t.best,latest:t.latest,count:tr(t.attempts===1?'quiz.attemptOne':'quiz.attemptMany',{n:t.attempts})}):tr('gb.notTakenYet')} · {tr('gb.pass',{pct:t.pass_percent})}</small>{t.attempts>0&&<Bar2 v={t.best}/>}</div>{t.attempts>0&&<ChevronRight size={18}/>}</button>)}
    <p className="known">{tr('gb.scoreNote')}</p></div></>}
function MyScores({onCourse}){const {t:tr}=useI18n();  // a student's final score per course
  const [d,setD]=useState(null)
  useEffect(()=>{api('/me/scores').then(setD).catch(()=>setD({courses:[]}))},[])
  if(!d||!d.courses.length)return null
  return <><h3 className="sec first">{tr('gb.scores')}</h3>{d.courses.map(x=><button key={x.course_id} className="row rowbtn" onClick={()=>onCourse(x)}><div>{x.course}<small>{x.final==null?tr('gb.noneTaken'):tr('gb.finalScore',{pct:x.final})} · {tr('gb.takenOf',{taken:x.taken,n:x.tests.length})} · {tr('gb.passedN',{n:x.passed})}</small>{x.final!=null&&<Bar2 v={x.final}/>}</div><ChevronRight size={18}/></button>)}</>}
function BankSheet({close,onAdd,toast}){const {t:tr}=useI18n();
  const confirm=useConfirm()
  const [q,setQ]=useState(''),[tag,setTag]=useState(''),[mine,setMine]=useState(false),[d,setD]=useState(null),[sel,setSel]=useState({}),[n,setN]=useState(0)
  useEffect(()=>{const t=setTimeout(()=>api('/bank?limit=30&q='+encodeURIComponent(q)+'&tag='+encodeURIComponent(tag)+(mine?'&mine=true':'')).then(setD).catch(e=>toast(e.message)),250);return()=>clearTimeout(t)},[q,tag,mine,n,toast])
  const picked=Object.values(sel),more=async()=>{try{const r=await api('/bank?limit=30&offset='+d.items.length+'&q='+encodeURIComponent(q)+'&tag='+encodeURIComponent(tag)+(mine?'&mine=true':''));setD({...d,items:[...d.items,...r.items]})}catch(e){toast(e.message)}}
  const flip=x=>{const c={...sel};c[x.id]?delete c[x.id]:c[x.id]=x;setSel(c)}
  const del=async x=>{if(!await confirm({title:tr('bank.delTitle'),body:tr('bank.delBody'),ok:tr('sheet.delete'),danger:true}))return;try{await api('/bank/'+x.id,{method:'DELETE'});const c={...sel};delete c[x.id];setSel(c);setN(n+1)}catch(e){toast(e.message)}}
  return <Sheet close={close}><h3>{tr('bank.title')}</h3><p className="known">{tr('bank.intro')}</p>
    <div className="search"><Search size={18}/><input type="search" aria-label={tr('bank.search')} placeholder={tr('bank.searchPh')} value={q} onChange={e=>setQ(e.target.value)}/></div>
    <div className="filters"><select aria-label={tr('bank.filterTag')} value={tag} onChange={e=>setTag(e.target.value)}><option value="">{tr('bank.allTags')}</option>{(d?.tags||[]).map(t=><option key={t} value={t}>{t}</option>)}</select>
      <label className="chk" style={{padding:0}}><input type="checkbox" checked={mine} onChange={e=>setMine(e.target.checked)}/> {tr('bank.onlyMine')}</label></div>
    {!d?<div className="sk"/>:!d.items.length?<p className="known">{q||tag||mine?tr('bank.nothing'):tr('bank.empty')}</p>:d.items.map(x=><div key={x.id} className="row"><label className="chk" style={{alignItems:'flex-start',flex:1}}><input type="checkbox" checked={!!sel[x.id]} onChange={()=>flip(x)}/><span><span style={{display:'block'}}>{x.text.length>180?x.text.slice(0,180)+'…':x.text}</span><small>{tr('bank.answers',{n:x.options.length})}{x.tags.length>0&&' · '+x.tags.join(', ')} · {tr('bank.by',{name:x.owner||tr('bank.someone')})}{x.uses>0&&' · '+tr(x.uses===1?'bank.usedOne':'bank.usedMany',{n:x.uses})}</small></span></label>{x.can_edit&&<button className="ic sm" aria-label={tr('bank.deleteAria')} onClick={()=>del(x)}><Trash2 size={16}/></button>}</div>)}
    {d&&d.items.length<d.total&&<ShowMore left={d.total-d.items.length} onClick={more}/>}
    <button className="btn" disabled={!picked.length} onClick={()=>onAdd(picked)}>{picked.length?tr(picked.length===1?'bank.addOne':'bank.addMany',{n:picked.length}):tr('bank.choose')}</button><button className="btn ghost" onClick={close}>{tr('common.cancel')}</button></Sheet>}

function CopySheet({kind,id,title,close,toast}){const {t:tr}=useI18n();
  const [tree,setTree]=useState(null),[cid,setCid]=useState(''),[uid,setUid]=useState(''),[wq,setWq]=useState(true),[busy,setBusy]=useState(false),[res,setRes]=useState(null)
  useEffect(()=>{api('/tree').then(setTree).catch(e=>{toast(e.message);close()})},[toast,close])
  const courses=(tree||[]).flatMap(p=>p.semesters.flatMap(s=>s.courses.filter(c=>c.editable&&!c.shared).map(c=>({...c,label:`${p.name} › ${s.name} › ${c.name}`}))))
  const dest=courses.find(c=>String(c.id)===cid)
  const run=async()=>{setBusy(true);try{setRes(await api(`/${kind==='topic'?'topics':'units'}/${id}/copy`,{method:'POST',body:kind==='topic'?{unit_id:+uid}:{course_id:+cid,with_quizzes:wq}}))}catch(e){toast(e.message)}setBusy(false)}
  if(res)return <Sheet close={close}><h3>{tr('copy.copied')}</h3><p className="known">{kind==='topic'?tr('copy.topicDraft',{title:res.title,path:`${dest.label} › ${dest.units.find(u=>u.id===res.unit_id)?.name}`}):tr('copy.unitDone',{name:res.name,path:dest.label,topics:tr(res.topics===1?'copy.topicOne':'copy.topicMany',{n:res.topics}),quizzes:res.quizzes?' '+tr('copy.andQuizzes',{quizzes:tr(res.quizzes===1?'copy.quizOne':'copy.quizMany',{n:res.quizzes})}):''})} {tr('copy.draftNote')}</p><button className="btn" onClick={close}>{tr('copy.done')}</button></Sheet>
  return <Sheet close={close}><h3>{kind==='topic'?tr('copy.titleTopic'):tr('copy.titleUnit')}</h3><p className="known">{kind==='unit'?tr('copy.introUnit',{title}):tr('copy.intro',{title})}</p>
    {!tree?<div className="sk"/>:!courses.length?<p className="known">{tr('copy.noCourse')}</p>:<>
      <label htmlFor="cc">{tr('copy.copyInto')}</label><select id="cc" value={cid} onChange={e=>{setCid(e.target.value);setUid('')}}><option value="">{tr('copy.chooseCourse')}</option>{courses.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}</select>
      {kind==='topic'&&dest&&<><label htmlFor="cu">{tr('copy.unit')}</label><select id="cu" value={uid} onChange={e=>setUid(e.target.value)}><option value="">{tr('copy.chooseUnit')}</option>{dest.units.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}</select>{!dest.units.length&&<p className="known">{tr('copy.noUnits')}</p>}</>}
      {kind==='unit'&&<label className="chk"><input type="checkbox" checked={wq} onChange={e=>setWq(e.target.checked)}/> {tr('copy.includeQuizzes')}</label>}</>}
    <button className="btn" disabled={busy||!dest||(kind==='topic'&&!uid)} onClick={run}>{busy?tr('copy.copying'):tr('copy.copy')}</button><button className="btn ghost" onClick={close}>{tr('common.cancel')}</button></Sheet>}
const FIELD_LABEL={title:'topic.fieldTitle',content:'topic.fieldNotes',sample_content:'topic.sampleAnswer',question_pattern:'topic.questionPattern',guideline:'topic.guideline'}
const lineDiff=(a,b)=>{const x=a.split('\n'),y=b.split('\n'),n=x.length,m=y.length
  if(n*m>250000)return [...x.map(t=>({k:'del',t})),...y.map(t=>({k:'add',t}))]  // very long texts: show both rather than spend the time
  const L=Array.from({length:n+1},()=>new Uint16Array(m+1))
  for(let i=n-1;i>=0;i--)for(let j=m-1;j>=0;j--)L[i][j]=x[i]===y[j]?L[i+1][j+1]+1:Math.max(L[i+1][j],L[i][j+1])
  const out=[];let i=0,j=0
  while(i<n&&j<m){if(x[i]===y[j]){out.push({k:'same',t:x[i]});i++;j++}else if(L[i+1][j]>=L[i][j+1])out.push({k:'del',t:x[i++]});else out.push({k:'add',t:y[j++]})}
  while(i<n)out.push({k:'del',t:x[i++]});while(j<m)out.push({k:'add',t:y[j++]});return out}
function HistorySheet({tid,close,done,toast}){const {t:tr}=useI18n();
  const confirm=useConfirm()
  const [list,setList]=useState(null),[v,setV]=useState(null),[busy,setBusy]=useState(false)
  useEffect(()=>{api(`/topics/${tid}/versions`).then(setList).catch(e=>{toast(e.message);close()})},[tid,toast,close])
  const open=async x=>{try{setV({...(await api('/topic-versions/'+x.id)),current:x.current})}catch(e){toast(e.message)}}
  const restore=async()=>{if(!await confirm({title:tr('topic.restoreConfirmTitle'),body:tr('topic.restoreConfirmBody'),ok:tr('topic.restoreOk')}))return;setBusy(true)
    try{await api(`/topic-versions/${v.id}/restore`,{method:'POST'});toast(tr('topic.restored'));done()}catch(e){toast(e.message);setBusy(false)}}
  if(v){const changed=Object.keys(FIELD_LABEL).filter(k=>v[k]!==v.now[k])
    return <Sheet close={close}><button className="link" onClick={()=>setV(null)}><ChevronLeft size={16}/> {tr('topic.allVersions')}</button>
      <h3>{v.saved_at?when(v.saved_at):tr('topic.earlier')}</h3><p className="known">{v.note}{v.current?' · '+tr('topic.currentText'):''}</p>
      {!changed.length&&<p className="known">{tr('topic.sameAsCurrent')}</p>}
      {changed.map(k=><div key={k} className="qbox"><b>{tr(FIELD_LABEL[k])}</b><p className="known" style={{margin:'2px 0 8px'}}>{tr('topic.diffHint')}</p>
        <div className="diff">{lineDiff(v[k],v.now[k]).map((l,i)=><div key={i} className={'dl '+l.k}>{l.t||'\u00a0'}</div>)}</div></div>)}
      {!v.current&&<button className="btn" disabled={busy} onClick={restore}>{tr('topic.restoreVersion')}</button>}<button className="btn ghost" onClick={close}>{tr('common.close')}</button></Sheet>}
  return <Sheet close={close}><h3>{tr('topic.versionHistory')}</h3><p className="known">{tr('topic.versionsKept',{n:100})}</p>
    {!list?<div className="sk"/>:!list.length?<p className="known">{tr('topic.noVersions')}</p>
      :list.map(x=><button key={x.id} className="row" style={{width:'100%',textAlign:'left',background:'none'}} onClick={()=>open(x)}><div>{x.saved_at&&!(x.by===null&&x.note.startsWith('Before'))?when(x.saved_at):tr('topic.beforeHistory')}<small>{x.note}{x.by?' · '+x.by:''}</small></div>{x.current&&<span className="pill">{tr('topic.current')}</span>}<ChevronRight size={16}/></button>)}
    <button className="btn ghost" onClick={close}>{tr('common.close')}</button></Sheet>}
function Topic({id:first,back,toast,role}){const {t:tr}=useI18n();
  const [id,setId]=useState(first),[editing,setEditing]=useState(false),[v,setV]=useState(0),[t,setT]=useState(null),[tab,setTab]=useState('notes'),[known,setKnown]=useState([]),[ai,setAi]=useState({}),[aiOk,setAiOk]=useState(null),[ownKey,setOwnKey]=useState(false),[aiMsg,setAiMsg]=useState(''),[busy,setBusy]=useState(false),[bm,setBm]=useState(false),[pv,setPv]=useState(false),[hist,setHist]=useState(false),[cp,setCp]=useState(false),[gone,setGone]=useState('')
  const opened=useRef(false),jump=nid=>{opened.current=false;setGone('');setT(null);setTab('notes');setAi({});setAiMsg('');setKnown([]);setEditing(false);setId(nid);window.scrollTo(0,0)},learn=r=>setT(p=>({...p,status:r.status,overdue:r.overdue,late:r.late,completed_at:r.completed_at}))
  useEffect(()=>{api('/topics/'+id).then(x=>{setT(x);setBm(!!x.bookmarked)
    if(!opened.current){opened.current=true;api(`/topics/${id}/read`,{method:'POST'}).then(r=>{setKnown(r.known);learn(r)}).catch(()=>{})}}).catch(e=>{toast(e.message);if(/unavailable right now/.test(e.message))setGone(e.message)})},[id,v])  // opening starts it, after the page has loaded
  const setDone=async on=>{try{learn(await api(`/topics/${id}/complete`,{method:on?'PUT':'DELETE'}));toast(on?tr('topic.marked'):tr('topic.unmarked'))}catch(e){toast(e.message)}}
  useEffect(()=>{api('/ai/status').then(r=>{setAiOk(r.available);setOwnKey(!!r.own_key)}).catch(()=>{})},[id])
  const ask=async k=>{setBusy(true);setAiMsg('');try{const r=await api(`/topics/${id}/ai/${k}`);setAi(a=>({...a,[k]:r}))}catch(e){setAiMsg(e.message)}setBusy(false)}
  if(editing)return <TopicEditor role={role} toast={toast} edit={{id}} done={()=>{setEditing(false);setV(v+1)}} cancel={()=>setEditing(false)}/>
  if(gone)return <><Bar title={tr('home.unavailable')} back={back}/><div className="main"><div className="hero"><h2>{gone}</h2><p>{tr('topic.archivedHint')}</p></div></div></>
  if(!t)return <><Bar title={tr('common.loading')} back={back}/><div className="main"><div className="sk"/><div className="sk"/></div></>
  const flip=async()=>{const on=!bm;setBm(on);try{await api(`/topics/${id}/bookmark`,{method:on?'PUT':'DELETE'});toast(on?tr('topic.bookmarked'):tr('topic.bookmarkRemoved'))}catch(e){setBm(!on);toast(e.message)}}
  const view=k=>ai[k]?<div className="prose">{ai[k].cached&&<span className="chip">{tr('topic.savedAnswer')}</span>}<Md>{ai[k].text}</Md></div>
    :aiOk===false?<p className="known">{ownKey?tr('topic.addKey'):tr('topic.aiUnavailable')}</p>
    :<><button className="btn" disabled={busy} onClick={()=>ask(k)}><Sparkles size={16}/> {busy?tr('topic.thinking'):k==='explain'?tr('topic.explainMe'):tr('topic.showSample')}</button>{aiMsg&&<p className="known">{aiMsg}</p>}</>
  return <><Bar title={t.title} sub={[t.program,t.semester,t.course,t.unit].filter(Boolean).join(' › ')} back={back} right={role!=='admin'&&<button className={'ic'+(bm?' on':'')} aria-label={bm?tr('topic.bookmarkRemoveAria'):tr('topic.bookmarkAria')} aria-pressed={bm} onClick={flip}><Bookmark fill={bm?'currentColor':'none'}/></button>}/><div className="main">
    {t.can_edit&&pv&&<div className="qbox" style={{marginTop:0}}><b>{tr('topic.previewTitle')}</b><p className="known" style={{margin:'4px 0 8px'}}>{tr('topic.previewHint')}</p><button className="btn ghost" style={{marginTop:0}} onClick={()=>setPv(false)}>{tr('topic.backToEditing')}</button></div>}
    {t.can_edit&&!pv&&<div className="two" style={{marginBottom:12}}><button className="btn ghost" style={{marginTop:0}} onClick={()=>setEditing(true)}><Pencil size={16}/> {tr('topic.edit')}</button>
      <button className="btn ghost" style={{marginTop:0}} onClick={async()=>{try{await api(`/topics/${id}/publish`,{method:'PUT',body:{published:!t.published}});toast(t.published?tr('topic.movedDrafts'):tr('topic.published'));setV(v+1)}catch(e){toast(e.message)}}}>{t.published?<><EyeOff size={16}/> {tr('topic.unpublish')}</>:<><Eye size={16}/> {tr('topic.publish')}</>}</button></div>}
    <div className="qbox" style={{marginTop:0}}><div className="row"><div>{t.learning_due_at?when(t.learning_due_at):tr('learn.noDeadline')}<small>{tr('topic.learnBy')}</small></div>{t.overdue&&role==='student'&&<span className="pill off sm">{tr('home.overdue')}</span>}</div>
      {role==='student'&&<><div className="row"><div>{tr(STATUS_KEY[t.status])}{t.status==='completed'&&t.completed_at&&' '+tr('topic.onDate',{when:when(t.completed_at)})+(t.late?', '+tr('topic.afterDeadline'):'')}<small>{tr('topic.yourStatus')}</small></div></div>
        {t.status==='completed'?<button className="btn ghost" onClick={()=>setDone(false)}>{tr('topic.markNotDone')}</button>:<button className="btn" onClick={()=>setDone(true)}><Check size={16}/> {tr('topic.markDone')}</button>}</>}</div>
    {t.can_edit&&!pv&&<><button className="tool" onClick={()=>setPv(true)}><Eye size={14}/> {tr('topic.previewStudent')}</button><button className="tool" onClick={()=>setHist(true)}><History size={14}/> {tr('topic.versionHistory')}</button></>}
    {role!=='student'&&!pv&&<button className="tool" onClick={()=>setCp(true)}><Copy size={14}/> {tr('topic.copyCourse')}</button>}
    {cp&&<CopySheet kind="topic" id={id} title={t.title} toast={toast} close={()=>setCp(false)}/>}
    {hist&&<HistorySheet tid={id} toast={toast} close={()=>setHist(false)} done={()=>{setHist(false);setV(v+1)}}/>}
    {t.can_edit&&!t.published&&<p className="known" style={{marginTop:0}}>{tr('learn.draftHidden')}</p>}
    <Tabs label={tr('topic.sections')} items={[['notes',tr('topic.notes')],['explain',tr('topic.explain')],['answer',tr('topic.sampleAnswer')]]} value={tab} onChange={setTab}/>
    {known.length>0&&tab==='explain'&&<p className="known">{tr('topic.covered',{list:known.join(', ')})}</p>}
    {tab==='notes'&&<div className="prose"><Md>{t.content||tr('topic.noNotes')}</Md>{t.question_pattern&&<><h3>{tr('topic.questionPattern')}</h3><Md>{t.question_pattern}</Md></>}{t.guideline&&<><h3>{tr('topic.guideline')}</h3><Md>{t.guideline}</Md></>}</div>}
    {tab==='explain'&&view('explain')}{tab==='answer'&&view('answer')}
    {t.nav&&t.nav.total>1&&<nav className="pager" aria-label={tr('topic.pagerLabel')}><button className="btn ghost" disabled={!t.nav.prev} onClick={()=>jump(t.nav.prev.id)} aria-label={t.nav.prev?tr('topic.prevTopic',{title:t.nav.prev.title}):tr('topic.noPrev')}><ChevronLeft size={18}/><span>{t.nav.prev?t.nav.prev.title:tr('home.next')}</span></button>
      <small>{tr('topic.position',{a:t.nav.position,b:t.nav.total})}</small>
      <button className={'btn'+(t.nav.next?'':' ghost')} disabled={!t.nav.next} onClick={()=>jump(t.nav.next.id)} aria-label={t.nav.next?tr('topic.nextTopic',{title:t.nav.next.title}):tr('topic.noNext')}><span>{t.nav.next?t.nav.next.title:tr('home.next')}</span><ChevronRight size={18}/></button></nav>}</div></>}

function TopicEditor({role,toast,done,cancel,edit,unitId}){const {t:tr}=useI18n();  // edit = {id} of a topic, or null for a new one in unitId
  const fac=role==='faculty',[prev,setPrev]=useState(false),[up,setUp]=useState(false),fileRef=useRef(null),taRef=useRef(null),[busy,setBusy]=useState(false)
  const [tree,setTree]=useState([]),[f,setF]=useState({title:'',unit_id:unitId||'',content:'',sample_content:'',question_pattern:'',guideline:'',published:!fac,due:''}),[cid,setCid]=useState(null)
  useEffect(()=>{api('/tree').then(setTree).catch(()=>{});if(edit)api('/topics/'+edit.id).then(t=>{setCid(t.course_id);setF({title:t.title,unit_id:t.unit_id||'',content:t.content||'',sample_content:t.sample_content||'',question_pattern:t.question_pattern||'',guideline:t.guideline||'',published:t.published!==false,due:localInput(t.learning_due_at)})}).catch(e=>toast(e.message))},[])
  const set=k=>e=>setF({...f,[k]:e.target.value})
  const pickImg=async e=>{const file=e.target.files[0];e.target.value='';if(!file)return;if(file.size>3*1024*1024)return toast(tr('topic.imgTooBig'))
    setUp(true);try{const r=await fetch('/api/uploads',{method:'POST',headers:{'Content-Type':file.type||'application/octet-stream',Authorization:'Bearer '+localStorage.t},body:file});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.detail||tr('topic.uploadFailed'))
      const pos=taRef.current?.selectionStart??f.content.length;setF({...f,content:f.content.slice(0,pos)+`\n\n![${tr('topic.imgAlt')}](${d.url})\n\n`+f.content.slice(pos)});toast(tr('topic.imgAdded'))}catch(er){toast(er.message)}setUp(false)}
  const all=tree.flatMap(p=>p.semesters.flatMap(s=>s.courses.filter(c=>!c.shared&&c.editable).flatMap(c=>c.units.map(n=>({...n,course_id:c.id,label:`${c.name} › ${n.name}`})))))
  const units=role==='admin'?all:all.filter(n=>n.course_id===cid)  // faculty move a topic only between units of its own course
  const here=all.find(n=>n.id===+f.unit_id)
  const save=async()=>{setBusy(true);try{await api(edit?'/topics/'+edit.id:'/topics',{method:edit?'PUT':'POST',body:{...f,due:undefined,unit_id:+f.unit_id,published:f.published!==false,learning_due_at:f.due?new Date(f.due).toISOString():null}});toast(edit?tr('topic.changesSaved'):tr('topic.added'));done()}catch(e){toast(e.message)}setBusy(false)}
  const T=(k,l,ph)=><><label>{l}</label><textarea placeholder={ph} value={f[k]} onChange={set(k)}/></>
  return <><Bar title={edit?tr('topic.edit'):tr('topic.newTopic')} sub={here?.label} back={cancel}/><div className="main">
    {edit&&units.length>1&&<><label>{tr('topic.unit')}</label><select value={f.unit_id} onChange={set('unit_id')}>{units.map(o=><option key={o.id} value={o.id}>{o.label}</option>)}</select></>}
    <label>{tr('topic.title')}</label><input value={f.title} onChange={set('title')} placeholder={tr('topic.titlePh')}/>
    <label>{tr('topic.content')}</label><div className="tools"><button type="button" disabled={up} onClick={()=>fileRef.current.click()}>{up?tr('topic.uploading'):tr('topic.addImage')}</button><button type="button" onClick={()=>setPrev(!prev)}>{prev?tr('topic.backToEditing'):tr('topic.preview')}</button></div>
    <input ref={fileRef} type="file" hidden accept="image/png,image/jpeg,image/gif,image/webp" onChange={pickImg}/>
    {prev?<div className="prose"><Md>{f.content||tr('topic.nothingPreview')}</Md></div>:<textarea ref={taRef} placeholder={tr('topic.pasteHint')} value={f.content} onChange={set('content')}/>}
    <p className="known">{tr('topic.mathHint')}</p>{T('question_pattern',tr('topic.qPattern'),tr('topic.qPatternPh'))}
    <label>{tr('topic.deadline')}</label><div className="qopt"><input type="datetime-local" aria-label={tr('topic.deadline')} value={f.due} onChange={set('due')}/>{f.due&&<button type="button" className="tool" onClick={()=>setF({...f,due:''})}>{tr('learn.noDeadline')}</button>}</div>
    <p className="known" style={{marginTop:4}}>{f.due?tr('topic.deadlineHint'):tr('learn.noDeadline')}</p>
    <label className="chk"><input type="checkbox" checked={f.published!==false} onChange={e=>setF({...f,published:e.target.checked})}/> {tr('topic.publishedCheck')}</label>
    {T('sample_content',tr('topic.sampleContent'),tr('topic.sampleHint'))}{T('guideline',tr('topic.howAnswer'),tr('topic.answerHint'))}
    <button className="btn" disabled={busy||!f.title.trim()} onClick={save}>{edit?tr('topic.saveChanges'):tr('topic.saveTopic')}</button></div></>}
function UnitSheet({un,cid,courses,close,done,toast}){const {t:tr}=useI18n();  // courses is given to admins only: moving a unit to another course is theirs to do
  const isNew=!un.id,[f,setF]=useState({name:un.name||'',course:cid}),[busy,setBusy]=useState(false)
  const save=async()=>{setBusy(true);try{await api(isNew?'/units':'/units/'+un.id,{method:isNew?'POST':'PUT',body:{name:f.name,course_id:+f.course}});toast(isNew?tr('sheet.unitAdded'):tr('topic.changesSaved'));done()}catch(e){toast(e.message)}setBusy(false)}
  return <Sheet close={close}><h3>{isNew?tr('sheet.newUnit'):tr('sheet.editUnit')}</h3>
    <label>{tr('sheet.name')}</label><input value={f.name} onChange={e=>setF({...f,name:e.target.value})} onKeyDown={e=>e.key==='Enter'&&f.name.trim()&&save()} placeholder={tr('sheet.unitPh')} autoFocus/>
    {!isNew&&courses&&<><label>{tr('sheet.course')}</label><select value={f.course} onChange={e=>setF({...f,course:+e.target.value})}>{courses.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}</select></>}
    <button className="btn" disabled={busy||!f.name.trim()} onClick={save}>{isNew?tr('learn.addUnit'):tr('topic.saveChanges')}</button></Sheet>}

const unmarked=(tree,id)=>tree.map(p=>({...p,semesters:p.semesters.map(s=>({...s,courses:s.courses.map(c=>({...c,units:c.units.map(u=>({...u,topics:u.topics.map(x=>x.id===id?{...x,bookmarked:false}:x)}))}))}))}))
const tabTo=e=>e.currentTarget.scrollIntoView?.({inline:'center',block:'nearest'})

function Bookmarks({toast,role}){const {t:tr}=useI18n();
  const [tree,setTree]=useState(null),[sem,setSem]=useState(null),[course,setCourse]=useState(null),[t,setT]=useState(null)
  const load=()=>api('/tree').then(setTree).catch(e=>toast(e.message));useEffect(()=>{load()},[t])
  if(t)return <Topic id={t} back={()=>setT(null)} toast={toast} role={role}/>
  if(!tree)return <><Bar title={tr('bm.title')}/><div className="main"><div className="sk"/><div className="sk"/></div></>
  const marks=u=>u.topics.filter(x=>x.bookmarked),cnt=c=>c.units.reduce((n,u)=>n+marks(u).length,0)
  const sems=tree.flatMap(p=>p.semesters.map(sm=>({...sm,prog:p.name,courses:sm.courses.filter(c=>cnt(c)>0)}))).filter(sm=>sm.courses.length)
    .sort((a,b)=>a.prog.localeCompare(b.prog)||(a.number??99)-(b.number??99)||a.id-b.id)
  const multi=new Set(sems.map(x=>x.prog)).size>1,total=sems.reduce((n,x)=>n+x.courses.reduce((m,c)=>m+cnt(c),0),0)
  const sm=sems.find(x=>x.id===sem)||sems[0],co=sm?.courses.find(x=>x.id===course)||sm?.courses[0]
  const drop=async id=>{try{await api(`/topics/${id}/bookmark`,{method:'DELETE'});setTree(unmarked(tree,id));toast(tr('bm.removed'))}catch(e){toast(e.message)}}
  return <><Bar title={tr('bm.title')} sub={total?tr(total===1?'bm.saved1':'bm.savedN',{n:total}):tr('bm.none')}/><div className="main">
    {!sm&&<p className="known">{tr('bm.intro')}</p>}
    {sm&&<>
      <div className="chips" role="group" aria-label={tr('bm.semAria')}>{sems.map(x=><button key={x.id} className={'sbtn'+(x.id===sm.id?' on':'')} aria-pressed={x.id===sm.id} onClick={e=>{setSem(x.id);setCourse(null);tabTo(e)}}>
        <span className="lbl">{multi&&x.prog+' · '}{x.name}</span><em>{x.courses.reduce((n,c)=>n+cnt(c),0)}</em></button>)}</div>
      <div className="tabs scroll" role="tablist" aria-label={tr('bm.courseAria')}>{sm.courses.map(c=><button key={c.id} role="tab" aria-selected={c.id===co.id} className={c.id===co.id?'on':''} onClick={e=>{setCourse(c.id);tabTo(e)}}>
        <span className="lbl">{c.name}</span><em>{cnt(c)}</em></button>)}</div>
      {co.units.filter(u=>marks(u).length).map(u=><div key={u.id}><h3 className="sec">{u.name}</h3>
        {marks(u).map((x,i)=><div key={x.id} className="card"><button className="hit" onClick={()=>setT(x.id)}><span className="dot" style={{background:COL[i%5]}}>{x.title[0]}</span><div><b>{x.title}</b></div><Mark s={x.status}/></button>
          <button className="ic sm on" aria-label={tr('bm.remove',{title:x.title})} onClick={()=>drop(x.id)}><Bookmark size={16} fill="currentColor"/></button></div>)}</div>)}
    </>}</div></>}

const sheets=[]  // open sheets, topmost last, so Escape closes only the one on top
function Sheet({close,children}){
  const box=useRef(null),cb=useRef(close);cb.current=close
  useEffect(()=>{const me={},was=document.activeElement;sheets.push(me)
    const k=e=>{if(e.key==='Escape'&&sheets[sheets.length-1]===me)cb.current()}
    addEventListener('keydown',k);if(box.current&&!box.current.contains(document.activeElement))box.current.focus()
    return()=>{sheets.splice(sheets.indexOf(me),1);removeEventListener('keydown',k);if(was&&was.isConnected)was.focus?.()}},[])
  return <div className="scrim" onClick={()=>cb.current()}><div className="sheet" ref={box} tabIndex={-1} role="dialog" aria-modal="true" onClick={e=>e.stopPropagation()}>{children}</div></div>}
const Confirm=({o,answer})=>{const {t:tr}=useI18n();return <Sheet close={()=>answer(false)}><h3>{o.title}</h3>{o.body&&<p className="known">{o.body}</p>}
  <button className={'btn'+(o.danger?' danger':'')} onClick={()=>answer(true)}>{o.ok||tr('common.confirm')}</button><button className="btn ghost" onClick={()=>answer(false)}>{tr('common.cancel')}</button></Sheet>}
const useConfirm=()=>useContext(Ctx).confirm
const Toast=({msg})=>msg?<div className="toast" role="status">{msg}</div>:null
const Skeleton=({rows=3})=><div aria-busy="true" aria-label="Loading">{Array.from({length:rows},(_,i)=><div className="sk" key={i}/>)}</div>
const ShowMore=({left,onClick,busy})=>{const {t:tr}=useI18n();return <button className="btn ghost" disabled={busy} onClick={onClick}>{tr('common.showMore',{n:left})}</button>}
const Tabs=({items,value,onChange,scroll,label})=><div className={'tabs'+(scroll?' scroll':'')} role="tablist" aria-label={label}>{items.map(([k,l])=><button key={k} role="tab" aria-selected={value===k} className={value===k?'on':''} onClick={()=>onChange(k)}>{l}</button>)}</div>
const useRun=(toast,load)=>async(fn,m)=>{try{await fn();toast(m);load&&load()}catch(e){toast(e.message)}}

const download=(name,text)=>{const l=document.createElement('a');l.href=URL.createObjectURL(new Blob([text],{type:'text/csv'}));l.download=name;l.click()}
const USER_TEMPLATE=`name,email,password,role,program,semester
Asha Kumar,asha@example.com,,student,B.E. Mechanical Engineering,3
Ravi S,ravi@example.com,Welcome#2026,student,B.E. Mechanical Engineering,1
`
const TERM_MAX={Grade:12},maxOf=term=>TERM_MAX[term]||8,upTo=n=>Array.from({length:n},(_,i)=>i+1)
const termOf=(progs,id)=>progs.find(p=>String(p.id)===String(id))?.term||'Semester',semsOf=(progs,id)=>upTo(id?maxOf(termOf(progs,id)):Math.max(8,...progs.map(p=>maxOf(p.term))))
const PATTERN={semester:['Semesters','Semester',8,'pattern.semester'],
  year:['Years','Year',4,'pattern.year'],
  grade:['School grades','Grade',12,'pattern.grade']}

const BULK_TEXT={disable:['bulk.disable1','bulk.disableN','bulk.disableD','users.disable'],
  enable:['bulk.enable1','bulk.enableN','bulk.enableD','users.enable'],reset_passwords:['bulk.reset1','bulk.resetN','bulk.resetD','bulk.resetL']}
function BulkSheet({act,ids,progs,toast,close,done}){const {t:tr}=useI18n();
  const [p,setP]=useState(''),[s,setS]=useState(''),[busy,setBusy]=useState(false)
  if(act.kind==='result'){const r=act.r,cell=v=>'"'+String(v).replace(/"/g,'""')+'"'
    return <Sheet close={close}><h3>{tr('bulk.updated',{count:tr(r.changed===1?'users.oneAccount':'users.manyAccounts',{n:r.changed})})}</h3>
      {r.courses_needing_owner>0&&<p className="known">{tr(r.courses_needing_owner===1?'bulk.coursesOne':'bulk.coursesMany',{n:r.courses_needing_owner})}</p>}
      {r.skipped_count>0&&<div className="qbox"><b>{tr('bulk.skipped',{n:r.skipped_count})}</b>{r.skipped.slice(0,10).map(x=><p className="known" style={{margin:'4px 0'}} key={x.id}>{x.name}: {x.reason}</p>)}{r.skipped_count>10&&<p className="known">{tr('bulk.andMore',{n:r.skipped_count-10})}</p>}</div>}
      {r.credentials&&<button className="btn" onClick={()=>download('new-passwords.csv','name,email,password\n'+r.credentials.map(c=>[c.name,c.email,c.password].map(cell).join(',')).join('\n')+'\n')}>{tr('bulk.downloadNew')}</button>}
      <button className="btn ghost" onClick={close}>{tr('common.close')}</button></Sheet>}
  const run=async()=>{setBusy(true);try{done(await api('/admin/users/bulk',{method:'POST',body:{ids,action:act.kind,...(act.kind==='set_placement'?{program_id:+p,semester:s?+s:null}:{})}}))}catch(e){toast(e.message);setBusy(false)}}
  if(act.kind==='set_placement')return <Sheet close={close}><h3>{tr('bulk.moveTitle',{count:tr(ids.length===1?'users.oneUser':'users.manyUsers',{n:ids.length})})}</h3><p className="known">{tr('bulk.moveDesc')}</p>
    <label htmlFor="bp">{tr('users.program')}</label><select id="bp" value={p} onChange={e=>{const id=e.target.value;setP(id);if(+s>semsOf(progs,id).length)setS('')}}><option value="">{tr('bulk.chooseProgram')}</option>{progs.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select>
    <label htmlFor="bs">{termOf(progs,p)}</label><select id="bs" value={s} onChange={e=>setS(e.target.value)}><option value="">{tr('users.notSet')}</option>{semsOf(progs,p).map(n=><option key={n} value={n}>{termOf(progs,p)} {n}</option>)}</select>
    <button className="btn" disabled={busy||!p} onClick={run}>{busy?tr('sheet.working'):tr('bulk.move')}</button><button className="btn ghost" onClick={close}>{tr('common.cancel')}</button></Sheet>
  const [t1,tN,d,l]=BULK_TEXT[act.kind]
  return <Sheet close={close}><h3>{tr(ids.length===1?t1:tN)}</h3><p className="known">{tr('bulk.selectedDesc',{count:tr(ids.length===1?'users.oneAccount':'users.manyAccounts',{n:ids.length}),desc:tr(d)})}</p>
    <button className={'btn'+(act.kind==='disable'?' danger':'')} disabled={busy} onClick={run}>{busy?tr('sheet.working'):tr(l)}</button><button className="btn ghost" onClick={close}>{tr('common.cancel')}</button></Sheet>}
function Users({toast,me}){const {t:tr}=useI18n();
  const [items,setItems]=useState([]),[total,setTotal]=useState(0),[q,setQ]=useState(''),[prog,setProg]=useState(''),[sem,setSem]=useState(''),[order,setOrder]=useState('role'),[progs,setProgs]=useState([])
  const [view,setView]=useState(null),[ed,setEd]=useState(null),[bulk,setBulk]=useState(null),fileRef=useRef(),[selMode,setSelMode]=useState(false),[sel,setSel]=useState([]),[act,setAct]=useState(null)
  const url=offset=>`/admin/users?q=${encodeURIComponent(q)}&order=${order}&limit=50&offset=${offset}`+(prog?'&program_id='+prog:'')+(sem?'&semester='+sem:'')
  const load=()=>api(url(0)).then(r=>{setItems(r.items);setTotal(r.total)}).catch(e=>toast(e.message))
  useEffect(()=>{const t=setTimeout(load,250);return()=>clearTimeout(t)},[q,prog,sem,order])
  useEffect(()=>{api('/tree').then(t=>setProgs(t.map(p=>({id:p.id,name:p.name,term:p.term})))).catch(()=>{})},[])
  const more=()=>api(url(items.length)).then(r=>{setItems([...items,...r.items]);setTotal(r.total)}).catch(e=>toast(e.message))
  const pick=async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;try{const text=await f.text();setBulk({stage:'preview',text,res:await api('/admin/users/import',{method:'POST',body:{csv:text,dry_run:true}})})}catch(err){toast(err.message)}}
  const commit=async()=>{try{setBulk({...bulk,stage:'done',res:await api('/admin/users/import',{method:'POST',body:{csv:bulk.text,dry_run:false}})});load()}catch(e){toast(e.message)}}
  const cell=v=>'"'+String(v).replace(/"/g,'""')+'"',r=bulk?.res,filtered=q||prog||sem,lab=prog?termOf(progs,prog):progs.every(x=>x.term==='Semester')?'Semester':progs.length&&progs.every(x=>x.term==='Grade')?'Grade':'Term'
  if(view)return <UserDetail id={view} me={me} progs={progs} toast={toast} back={()=>{setView(null);load()}}/>
  return <><Bar title={tr('nav.users')} sub={filtered?tr(total===1?'rs.matchOne':'rs.matchMany',{n:total}):tr(total===1?'users.oneAccount':'users.manyAccounts',{n:total})}/><div className="main">
    <div className="search"><Search size={18}/><input type="search" aria-label={tr('users.search')} placeholder={tr('users.searchPh')} value={q} onChange={e=>setQ(e.target.value)}/></div>
    <div className="filters">
      <select aria-label={tr('users.filterProgram')} value={prog} onChange={e=>{const id=e.target.value;setProg(id);if(+sem>semsOf(progs,id).length)setSem('')}}><option value="">{tr('users.allPrograms')}</option>{progs.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select>
      <select aria-label={tr('users.filterTerm')} value={sem} onChange={e=>setSem(e.target.value)}><option value="">{lab==='Term'?tr('users.allTerms'):tr('users.allTermsOf',{term:lab.toLowerCase()})}</option>{semsOf(progs,prog).map(n=><option key={n} value={n}>{lab} {n}</option>)}</select>
      <select aria-label="Sort by" value={order} onChange={e=>setOrder(e.target.value)}><option value="role">{tr('users.sortRole')}</option><option value="name">{tr('prog.sortName')}</option><option value="program">{tr('users.sortProgram')}</option><option value="semester">Sort: {lab.toLowerCase()}</option><option value="newest">Sort: newest first</option></select></div>
    <div className="two"><button className="btn" onClick={()=>setEd({})}>{tr('users.newUser')}</button><button className="btn ghost" onClick={()=>setBulk({stage:'pick'})}>{tr('prog.bulk')}</button></div>
    <button className="btn ghost" style={{marginTop:10}} aria-pressed={selMode} onClick={()=>{setSelMode(!selMode);setSel([])}}>{selMode?tr('users.doneSelecting'):tr('users.selectMany')}</button>
    {selMode&&items.length>0&&<div className="selbar"><button className="tool" onClick={()=>setSel(items.map(u=>u.id))}>{tr('users.selectAll',{n:items.length})}</button>{sel.length>0&&<button className="tool" onClick={()=>setSel([])}>{tr('users.clear')}</button>}</div>}
    <div style={{height:14}}/>
    {items.length>0&&<div className="uhead" aria-hidden="true"><span>{tr('sheet.name')}</span><span>{tr('users.program')}</span><span>{lab==='Semester'?'Sem':lab}</span></div>}
    {items.map(u=><button key={u.id} className={'utr'+(selMode?' sel':'')+(sel.includes(u.id)?' on':'')} onClick={()=>selMode?setSel(sel.includes(u.id)?sel.filter(i=>i!==u.id):[...sel,u.id]):setView(u.id)} aria-label={(selMode?(sel.includes(u.id)?'Deselect ':'Select '):'Open ')+u.name} aria-pressed={selMode?sel.includes(u.id):undefined}>
      <span className="nm">{selMode&&<span className="tick" aria-hidden="true">{sel.includes(u.id)&&<Check size={14}/>}</span>}<span className="dot" style={{background:COL[u.id%5]}}>{(u.name||'?')[0]}</span><span className="tx"><b>{u.name}</b>{(u.role!=='student'||!u.active||u.self_registered)&&<span className="tags">{u.role!=='student'&&<span className="pill">{u.role==='admin'?'Admin':'Faculty'}</span>}{u.self_registered&&<span className="pill">Self-registered</span>}{!u.active&&<span className="pill off">Disabled</span>}</span>}</span></span>
      <span className="pg">{u.program||'—'}</span><span className="sn">{u.semester||'—'}</span></button>)}
    {!items.length&&<p className="known">{filtered?tr('users.noMatch'):tr('users.noneYet')}</p>}
    {items.length<total&&<ShowMore left={total-items.length} onClick={more}/>}
    <input ref={fileRef} type="file" accept=".csv,.txt,text/csv" hidden onChange={pick}/></div>
    {selMode&&sel.length>0&&<div className="actbar" role="toolbar" aria-label={tr('users.actions')}><b>{tr('users.selected',{n:sel.length})}</b>
      <button className="tool" onClick={()=>setAct({kind:'set_placement'})}>{tr('users.move')}</button><button className="tool" onClick={()=>setAct({kind:'disable'})}>{tr('users.disable')}</button><button className="tool" onClick={()=>setAct({kind:'enable'})}>{tr('users.enable')}</button><button className="tool" onClick={()=>setAct({kind:'reset_passwords'})}>Reset passwords</button></div>}
    {act&&<BulkSheet act={act} ids={sel} progs={progs} toast={toast} close={()=>setAct(null)} done={r=>{setAct({kind:'result',r});setSel([]);load()}}/>}
    {ed&&<UserSheet u={ed} me={me} progs={progs} toast={toast} close={()=>setEd(null)} done={()=>{setEd(null);load()}}/>}
    {bulk&&<Sheet close={()=>setBulk(null)}>
      {bulk.stage==='pick'&&<><h3>{tr('users.bulkTitle')}</h3><p className="known">One row per person with the columns name, email, password, role, program and semester (the year number for annual programs such as M.B.B.S). Leave the password blank to generate one. Role is student or admin and defaults to student. Program must match a name on the Programs tab, and semester is a number from 1 to 8. Emails that already exist are updated, and blank program or semester cells leave the current value alone.</p>
        <button className="btn ghost" onClick={()=>download('users-template.csv',USER_TEMPLATE)}>{tr('prog.template')}</button><button className="btn" onClick={()=>fileRef.current.click()}>{tr('prog.chooseCsv')}</button></>}
      {bulk.stage==='preview'&&<><h3>{tr('prog.ready')}</h3><p className="known">{tr('users.validRows',{a:r.valid_rows,b:r.rows,created:r.created,updated:r.updated})}{r.generated>0&&' '+tr('users.genPasswords',{n:r.generated})}</p>
        {r.error_count>0&&<div className="prose" style={{maxHeight:'28vh',overflow:'auto',fontSize:14}}><b>{tr('prog.skipped',{n:r.error_count})}</b>{r.errors.map(e=><div key={e.row}>{tr('prog.rowErr',{row:e.row,error:e.error})}</div>)}</div>}
        <button className="btn" disabled={!r.valid_rows} onClick={commit}>{tr('prog.uploadRows',{n:r.valid_rows})}</button><button className="btn ghost" onClick={()=>setBulk(null)}>{tr('common.cancel')}</button></>}
      {bulk.stage==='done'&&<><h3>{tr('prog.complete')}</h3><p className="known">{tr('users.uploadDone',{created:r.created,updated:r.updated})}{r.credentials.length>0&&' '+tr('users.credsNote')}</p>
        {r.credentials.length>0&&<button className="btn" onClick={()=>download('new-user-passwords.csv','name,email,password\n'+r.credentials.map(c=>[c.name,c.email,c.password].map(cell).join(',')).join('\n')+'\n')}>{tr('users.downloadPw')}</button>}
        <button className="btn ghost" onClick={()=>setBulk(null)}>{tr('common.close')}</button></>}
    </Sheet>}</>}

function UserDetail({id,me,progs,back,toast}){const {t:tr}=useI18n();
  const [u,setU]=useState(null),[ed,setEd]=useState(false),[ask,setAsk]=useState(false),[pw,setPw]=useState(null),[busy,setBusy]=useState(false),[asg,setAsg]=useState(null),[ctree,setCtree]=useState([])
  const load=()=>api('/admin/users/'+id).then(setU).catch(e=>{toast(e.message);back()})
  useEffect(()=>{load()},[id]);useEffect(()=>{if(u?.role==='faculty')api('/tree').then(setCtree)},[u?.role])
  if(!u)return <><Bar title={tr('common.loading')} back={back}/><div className="main"><div className="sk"/><div className="sk"/></div></>
  const reset=async()=>{setBusy(true);try{const r=await api(`/admin/users/${u.id}/reset-password`,{method:'POST'});setAsk(false);setPw(r.password)}catch(e){toast(e.message)}setBusy(false)}
  const copy=async()=>{try{await navigator.clipboard.writeText(pw);toast(tr('users.copied'))}catch{toast(tr('users.copyHint'))}}
  const row=(v,l)=><div className="row"><div>{v}<small>{l}</small></div></div>
  const allCourses=ctree.flatMap(p=>p.semesters.flatMap(s=>s.courses.filter(c=>!c.shared).map(c=>({id:c.id,owner_id:c.owner_id,owner:c.owner,label:`${p.name} › ${s.name} › ${c.name}`}))))
  const saveAsg=async()=>{try{await api(`/admin/users/${u.id}/courses`,{method:'PUT',body:{course_ids:asg}});toast('Courses updated');setAsg(null);load()}catch(e){toast(e.message)}}
  return <><Bar title={u.name} sub={u.email} back={back}/><div className="main">
    <div className="stats"><div className="stat"><b>{u.topics_read}</b>{tr('users.topicsRead')}</div><div className="stat"><b>{u.reads}</b>{tr('users.totalReads')}</div></div>
    <h3 className="sec">{tr('users.profile')}</h3>
    {row({admin:tr('users.roleAdmin'),faculty:tr('users.roleFaculty')}[u.role]||tr('users.roleStudent'),tr('users.role'))}{row(u.active?tr('users.active'):tr('users.disabled'),tr('users.status'))}{row(u.program||tr('users.notSet'),tr('users.program'))}{row(u.semester||tr('users.notSet'),termOf(progs,u.program_id))}{u.self_registered&&<>{row(u.institution||'—','Institution')}{row(u.id_number||'—','ID number')}{row(u.phone||'—','Phone')}{row(u.own_ai_key?'Has added their own key':'No key yet · AI is off for them','AI (self-registered, uses their own key)')}</>}{row(day(u.last_active),'Last active')}
    {u.role==='faculty'&&<><h3 className="sec">Courses they own</h3>{(u.course_ids||[]).length?allCourses.filter(c=>u.course_ids.includes(c.id)).map(c=><div className="row" key={c.id}><div>{c.label}</div></div>):<p className="known">None yet. They can read published content but edit nothing until they own a course.</p>}<button className="btn ghost" onClick={()=>setAsg([...(u.course_ids||[])])}>Assign courses</button></>}
    <h3 className="sec">{tr('users.recentlyRead')}</h3>
    {u.recent.length?u.recent.map((x,i)=><div className="row" key={i}><div>{x.title}<small>{tr('users.readsLast',{n:x.reads,day:day(x.last_read)})}</small></div></div>):<p className="known">{tr('users.noReading')}</p>}
    <div className="two"><button className="btn ghost" onClick={()=>setEd(true)}>{tr('common.edit')}</button><button className="btn" onClick={()=>setAsk(true)}>{tr('users.resetPw')}</button></div></div>
    {ed&&<UserSheet u={u} me={me} progs={progs} toast={toast} close={()=>setEd(false)} done={()=>{setEd(false);load()}}/>}
    {ask&&<Sheet close={()=>setAsk(false)}><h3>{tr('users.resetTitle')}</h3><p className="known">{tr('users.resetBody',{name:u.name})}</p>
      <button className="btn danger" disabled={busy} onClick={reset}>{tr('users.resetPw')}</button><button className="btn ghost" onClick={()=>setAsk(false)}>Cancel</button></Sheet>}
    {pw&&<Sheet close={()=>setPw(null)}><h3>{tr('users.newPw')}</h3><p className="known">{tr('users.shareNow',{name:u.name})}</p><div className="pw">{pw}</div>
      <button className="btn" onClick={copy}>{tr('users.copyPw')}</button><button className="btn ghost" onClick={()=>setPw(null)}>{tr('users.done')}</button></Sheet>}
    {asg&&<Sheet close={()=>setAsg(null)}><h3>Courses {u.name} owns</h3><p className="known">The owner adds and edits the units, topics and quizzes of a course. Each course has one owner, so ticking a course another person owns moves it to {u.name}.</p>{allCourses.map(c=><label key={c.id} className="chk"><input type="checkbox" checked={asg.includes(c.id)} onChange={e=>setAsg(e.target.checked?[...asg,c.id]:asg.filter(i=>i!==c.id))}/> {c.label}{c.owner_id&&c.owner_id!==u.id?` (now ${c.owner})`:''}</label>)}<button className="btn" onClick={saveAsg}>Save</button><button className="btn ghost" onClick={()=>setAsg(null)}>Cancel</button></Sheet>}</>}

function UserSheet({u,me,progs,close,done,toast}){const {t:tr}=useI18n();
  const isNew=!u.id,self=u.id===me.id,[busy,setBusy]=useState(false)
  const [f,setF]=useState({name:u.name||'',email:u.email||'',role:u.role||'student',active:u.active??true,password:'',program_id:u.program_id||'',semester:u.semester||''}),set=k=>e=>setF({...f,[k]:e.target.value})
  const save=async()=>{setBusy(true);try{
    const enrol={program_id:f.program_id?+f.program_id:null,semester:f.semester?+f.semester:null}
    if(isNew)await api('/admin/users',{method:'POST',body:{...f,...enrol}})
    const r=isNew?null:await api('/admin/users/'+u.id,{method:'PATCH',body:{name:f.name,email:f.email,...enrol,...(self?{}:{role:f.role,active:f.active})}})
    toast(isNew?tr('users.added'):r.courses_needing_owner?tr('users.needOwner',{n:r.courses_needing_owner}):tr('topic.changesSaved'));done()}catch(e){toast(e.message)}setBusy(false)}
  return <Sheet close={close}><h3>{isNew?tr('users.newUser'):tr('users.editUser')}</h3>
    <label>{tr('sheet.name')}</label><input value={f.name} onChange={set('name')}/><label>{tr('users.email')}</label><input type="email" value={f.email} onChange={set('email')}/>
    <label>{tr('users.program')}</label><select value={f.program_id} onChange={e=>{const id=e.target.value;setF({...f,program_id:id,semester:+f.semester>semsOf(progs,id).length?'':f.semester})}}><option value="">{tr('users.notSet')}</option>{progs.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select>
    <label>{termOf(progs,f.program_id)}</label><select value={f.semester} onChange={set('semester')}><option value="">{tr('users.notSet')}</option>{semsOf(progs,f.program_id).map(n=><option key={n} value={n}>{n}</option>)}</select>
    <label>{tr('users.role')}</label><select disabled={self} value={f.role} onChange={set('role')}><option value="student">{tr('users.roleStudent')}</option><option value="faculty">{tr('users.roleFaculty')}</option><option value="admin">{tr('users.roleAdmin')}</option></select>
    <label>{tr('users.status')}</label><select disabled={self} value={f.active?'1':'0'} onChange={e=>setF({...f,active:e.target.value==='1'})}><option value="1">{tr('users.active')}</option><option value="0">{tr('users.disabled')}</option></select>
    {isNew?<><label>{tr('users.passwordNew')}</label><input type="password" autoComplete="new-password" value={f.password} onChange={set('password')}/></>
      :<p className="known" style={{marginTop:14}}>{tr('users.useReset')}</p>}
    {self&&<p className="known">{tr('users.selfNote')}</p>}
    <button className="btn" disabled={busy} onClick={save}>{isNew?tr('users.addUser'):tr('topic.saveChanges')}</button></Sheet>}

function Programs({toast,onOpen}){const {t:tr}=useI18n();
  const [items,setItems]=useState([]),[total,setTotal]=useState(0),[q,setQ]=useState(''),[order,setOrder]=useState('name'),[status,setStatus]=useState('active')
  const [view,setView]=useState(null),[ed,setEd]=useState(null),[bulk,setBulk]=useState(null),fileRef=useRef()
  const url=offset=>`/admin/programs?q=${encodeURIComponent(q)}&order=${order}&status=${status}&limit=50&offset=${offset}`
  const load=()=>api(url(0)).then(r=>{setItems(r.items);setTotal(r.total)}).catch(e=>toast(e.message))
  useEffect(()=>{const t=setTimeout(load,250);return()=>clearTimeout(t)},[q,order,status])
  const more=()=>api(url(items.length)).then(r=>{setItems([...items,...r.items]);setTotal(r.total)}).catch(e=>toast(e.message))
  const pick=async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;try{const text=await f.text();setBulk({stage:'preview',text,res:await api('/admin/import',{method:'POST',body:{csv:text,dry_run:true}})})}catch(err){toast(err.message)}}
  const commit=async()=>{try{setBulk({...bulk,stage:'done',res:await api('/admin/import',{method:'POST',body:{csv:bulk.text,dry_run:false}})});load()}catch(e){toast(e.message)}}
  const r=bulk?.res,made=r&&Object.entries(r.created).filter(([,v])=>v).map(([k,v])=>v+' '+k).join(', ')||tr('prog.nothingNew')
  if(view)return <ProgramDetail id={view} onOpen={onOpen} toast={toast} back={()=>{setView(null);load()}}/>
  return <><Bar title={tr('nav.programs')} sub={q?tr(total===1?'rs.matchOne':'rs.matchMany',{n:total}):tr(total===1?'prog.oneProgram':'prog.manyPrograms',{n:total})}/><div className="main">
    <div className="search"><Search size={18}/><input type="search" aria-label={tr('prog.search')} placeholder={tr('prog.searchPh')} value={q} onChange={e=>setQ(e.target.value)}/></div>
    <div className="filters"><select aria-label={tr('rs.sortBy')} value={order} onChange={e=>setOrder(e.target.value)}><option value="name">{tr('prog.sortName')}</option><option value="students">{tr('prog.sortStudents')}</option><option value="newest">{tr('rs.sortNewest')}</option></select><select aria-label={tr('prog.show')} value={status} onChange={e=>setStatus(e.target.value)}><option value="active">{tr('prog.active')}</option><option value="archived">{tr('prog.archived')}</option><option value="all">{tr('prog.all')}</option></select></div>
    <div className="two"><button className="btn" onClick={()=>setEd({})}>{tr('learn.newProgram')}</button><button className="btn ghost" onClick={()=>setBulk({stage:'pick'})}>{tr('prog.bulk')}</button></div>
    <div style={{height:14}}/>
    {items.length>0&&<div className="uhead p" aria-hidden="true"><span>{tr('prog.program')}</span><span>{tr('home.courses')}</span><span>{tr('prog.students')}</span></div>}
    {items.map(x=><button key={x.id} className="utr p" onClick={()=>setView(x.id)} aria-label={tr('rs.open',{title:x.name})}>
      <span className="nm"><span className="dot" style={{background:COL[x.id%5]}}>{(x.name||'?')[0]}</span><span className="tx"><b>{x.name}{x.archived&&<span className="pill off sm">{tr('learn.archived')}</span>}</b><small className="sub">{tr(x.semesters===1?'prog.termOne':'prog.termMany',{n:x.semesters,term:x.term.toLowerCase()})}, {tr('learn.topicsN',{n:x.topics})}</small></span></span>
      <span className="sn">{x.courses}</span><span className="sn">{x.students}</span></button>)}
    {!items.length&&<p className="known">{q?tr('prog.noMatch'):status==='archived'?tr('prog.noArchived'):tr('prog.noneYet')}</p>}
    {items.length<total&&<ShowMore left={total-items.length} onClick={more}/>}
    <input ref={fileRef} type="file" accept=".csv,.txt,text/csv" hidden onChange={pick}/></div>
    {ed&&<ProgramSheet p={ed} toast={toast} close={()=>setEd(null)} done={()=>{setEd(null);load()}}/>}
    {bulk&&<Sheet close={()=>setBulk(null)}>
      {bulk.stage==='pick'&&<><h3>{tr('prog.bulkTitle')}</h3><p className="known">{tr('prog.bulkIntro')}</p>
        <button className="btn ghost" onClick={()=>download('template.csv',TEMPLATE)}>{tr('prog.template')}</button><button className="btn" onClick={()=>fileRef.current.click()}>{tr('prog.chooseCsv')}</button></>}
      {bulk.stage==='preview'&&<><h3>{tr('prog.ready')}</h3><p className="known">{tr('prog.validRows',{a:r.valid_rows,b:r.rows})} {tr('prog.newMade',{made})} {tr('prog.topicsUpdated',{n:r.updated_topics})}</p>
        {r.error_count>0&&<div className="prose" style={{maxHeight:'28vh',overflow:'auto',fontSize:14}}><b>{tr('prog.skipped',{n:r.error_count})}</b>{r.errors.map(e=><div key={e.row}>{tr('prog.rowErr',{row:e.row,error:e.error})}</div>)}</div>}
        <button className="btn" disabled={!r.valid_rows} onClick={commit}>{tr('prog.uploadRows',{n:r.valid_rows})}</button><button className="btn ghost" onClick={()=>setBulk(null)}>{tr('common.cancel')}</button></>}
      {bulk.stage==='done'&&<><h3>{tr('prog.complete')}</h3><p className="known">{tr('prog.created',{made})} {tr('prog.topicsUpdated',{n:r.updated_topics})}{r.error_count>0&&' '+tr('prog.rowsSkipped',{n:r.error_count})}</p>
        <button className="btn ghost" onClick={()=>setBulk(null)}>{tr('common.close')}</button></>}
    </Sheet>}</>}

function RolloverSheet({p,close,done,toast}){const {t:tr}=useI18n();
  const [fin,setFin]=useState('keep'),[r,setR]=useState(null),[busy,setBusy]=useState(false)
  const url=`/admin/programs/${p.id}/rollover`
  useEffect(()=>{setR(null);api(url,{method:'POST',body:{dry_run:true,finishing:fin}}).then(setR).catch(e=>{toast(e.message);close()})},[fin]) 
  const go=async()=>{setBusy(true);try{const x=await api(url,{method:'POST',body:{dry_run:false,finishing:fin}});toast(tr('roll.moved',{n:x.moved})+(fin==='deactivate'&&x.finishing?', '+tr('roll.switchedOff',{n:x.finishing}):''));done()}catch(e){toast(e.message);setBusy(false)}}
  return <Sheet close={close}><h3>{tr('roll.title')}</h3><p className="known">{tr('roll.intro',{name:p.name,term:p.term?.toLowerCase()||'semester'})}</p>
    {!r?<div className="sk"/>:<div className="qbox" style={{marginTop:0}}>
      <div className="row"><div>{tr(r.moved===1?'roll.studentOne':'roll.studentMany',{n:r.moved})}<small>{tr(r.moved===1?'roll.moves':'roll.move',{term:r.term.toLowerCase()})}</small></div></div>
      <div className="row"><div>{tr(r.finishing===1?'roll.studentOne':'roll.studentMany',{n:r.finishing})}<small>{tr(r.finishing===1?'roll.isLast':'roll.areLast',{term:r.term.toLowerCase(),tn:r.term,last:r.last_semester})}{r.finishing_names.length?': '+r.finishing_names.join(', ')+(r.finishing>r.finishing_names.length?'…':''):''}</small></div></div>
      {r.unplaced>0&&<div className="row"><div>{tr(r.unplaced===1?'roll.studentOne':'roll.studentMany',{n:r.unplaced})}<small>{tr(r.unplaced===1?'roll.hasNoTerm':'roll.haveNoTerm',{term:r.term.toLowerCase(),names:r.unplaced_names.join(', ')})}</small></div></div>}</div>}
    <label htmlFor="fin">{tr('roll.finishing')}</label><select id="fin" value={fin} onChange={e=>setFin(e.target.value)}><option value="keep">{tr('roll.keep')}</option><option value="deactivate">{tr('roll.deactivate')}</option></select>
    <button className="btn" disabled={busy||!r||(!r.moved&&!(fin==='deactivate'&&r.finishing))} onClick={go}>{busy?tr('sheet.working'):tr('roll.apply')}</button><button className="btn ghost" onClick={close}>{tr('common.cancel')}</button></Sheet>}
function ProgramDetail({id,back,onOpen,toast}){const {t:tr}=useI18n();
  const [p,setP]=useState(null),[ed,setEd]=useState(false),[ask,setAsk]=useState(false),[busy,setBusy]=useState(false),[addSem,setAddSem]=useState(false),[term,setTerm]=useState(false),[arch,setArch]=useState(null)
  const load=()=>api('/admin/programs/'+id).then(setP).catch(e=>{toast(e.message);back()})
  useEffect(()=>{load()},[id])
  if(!p)return <><Bar title={tr('common.loading')} back={back}/><div className="main"><div className="sk"/><div className="sk"/></div></>
  const del=async()=>{setBusy(true);try{await api('/programs/'+p.id,{method:'DELETE'});toast(tr('prog.deleted'));back()}catch(e){toast(e.message);setBusy(false)}}
  const row=(v,l,k)=><div className="row" key={k}><div>{v}<small>{l}</small></div></div>
  return <><Bar title={p.name} sub={tr(p.semesters===1?'prog.termOne':'prog.termMany',{n:p.semesters,term:p.term.toLowerCase()})+(p.pattern==='year'?' · '+tr('prog.annual'):p.pattern==='grade'?' · '+tr('prog.school'):'')+(p.archived?' · '+tr('prog.archivedLower'):'')} back={back}/><div className="main">
    {p.archived&&<p className="known" style={{marginTop:0}}>{tr('prog.archivedNote')}</p>}
    <button className="btn ghost lead" onClick={()=>setArch({kind:'programs',id:p.id,name:p.name,on:!p.archived})}>{p.archived?tr('prog.restoreProgram'):tr('prog.archiveProgram')}</button>
    <div className="stats">{[['semesters',p.term+'s'],['courses',tr('home.courses')],['topics',tr('home.topics')],['students',tr('prog.students')]].map(([k,l])=><div className="stat" key={k}><b>{p[k]}</b>{l}</div>)}</div>
    <h3 className="sec">{p.term}s</h3>
    {p.semester_list.length?p.semester_list.map((x,i)=><div key={x.id} className="card"><button className="hit" onClick={()=>onOpen([p.id,x.id])}><span className="dot" style={{background:COL[i%5]}}>{x.number||'?'}</span><div><b>{x.name}<ArchPill x={x}/></b><span>{(x.number?'':tr('learn.noNumber',{term:p.term.toLowerCase()})+' · ')+tr('learn.coursesN',{n:x.courses})+', '+tr('learn.topicsN',{n:x.topics})}</span></div></button>{!p.archived&&<button className="ic sm" aria-label={tr(x.archived_self?'learn.restoreOne':'learn.archiveOne',{n:x.name})} onClick={()=>setArch({kind:'semesters',id:x.id,name:x.name,on:!x.archived_self})}>{x.archived_self?<ArchiveRestore size={16}/>:<Archive size={16}/>}</button>}</div>):<p className="known">{tr('prog.noTerms',{term:p.term.toLowerCase()})}</p>}
    <button className="btn ghost" onClick={()=>setAddSem(true)}>{tr('sheet.addTerm',{term:p.term.toLowerCase()})}</button>
    <h3 className="sec">{tr('prog.students')}</h3>
    {p.student_list.length?p.student_list.map(u=>row(u.name,(u.semester?p.term+' '+u.semester:tr('prog.termNotSet',{term:p.term}))+(u.active?'':', '+tr('prog.disabled')),u.id)):<p className="known">{tr('prog.noStudents')}</p>}
    {p.students>p.student_list.length&&<p className="known">{tr('prog.showing',{a:p.student_list.length,b:p.students})}</p>}
    {p.students>0&&<button className="btn ghost" onClick={()=>setTerm(true)}>{tr('prog.newTerm')}</button>}
    <div className="two"><button className="btn ghost" onClick={()=>setEd(true)}>{tr('common.edit')}</button><button className="btn danger" onClick={()=>setAsk(true)}>{tr('sheet.delete')}</button></div>
    <button className="btn ghost" onClick={()=>onOpen([p.id])}>{tr('prog.openTerms',{term:p.term.toLowerCase()})}</button></div>
    {term&&<RolloverSheet p={p} toast={toast} close={()=>setTerm(false)} done={()=>{setTerm(false);load()}}/>}
    {ed&&<ProgramSheet p={p} toast={toast} close={()=>setEd(false)} done={()=>{setEd(false);load()}}/>}
    {arch&&<ArchiveSheet a={arch} toast={toast} close={()=>setArch(null)} done={()=>{setArch(null);load()}}/>}
    {addSem&&<SemesterSheet sem={{}} pid={p.id} term={p.term} toast={toast} close={()=>setAddSem(false)} done={()=>{setAddSem(false);load()}}/>}
    {ask&&<Sheet close={()=>setAsk(false)}><h3>{tr('prog.delTitle',{name:p.name})}</h3><p className="known">{tr('prog.delBody',{terms:tr(p.semesters===1?'prog.termOne':'prog.termMany',{n:p.semesters,term:p.term.toLowerCase()}),courses:p.courses,units:p.units,topics:p.topics})}{p.students>0&&' '+tr('prog.delStudents',{n:p.students})}</p>
      <button className="btn danger" disabled={busy} onClick={del}>{tr('prog.deleteProgram')}</button><button className="btn ghost" onClick={()=>setAsk(false)}>{tr('common.cancel')}</button></Sheet>}</>}

function OwnerSheet({c,close,done,toast}){const {t:tr}=useI18n();
  const faculty=useFaculty(true),[sel,setSel]=useState(c.owner_id||''),[busy,setBusy]=useState(false)
  const save=async()=>{if(String(sel)===String(c.owner_id||''))return close();setBusy(true);try{await api(`/courses/${c.id}/owner`,{method:'PUT',body:{user_id:sel?+sel:null}});toast(tr('prog.ownerUpdated'));done()}catch(e){toast(e.message)}setBusy(false)}
  return <Sheet close={close}><h3>{tr('prog.ownerOf',{name:c.name})}</h3><p className="known">{tr('prog.ownerHint')}{c.owner_problem&&c.owner_id?' '+c.owner_problem+'.':''}</p>
    <label>{tr('sheet.ownerFaculty')}</label><select value={sel} onChange={e=>setSel(e.target.value)}><option value="">{tr('learn.notAssigned')}</option>{c.owner_id&&!faculty.some(u=>u.id===c.owner_id)&&<option value={c.owner_id}>{c.owner} ({tr('sheet.cantEdit')})</option>}{faculty.map(u=><option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}</select>
    <button className="btn" disabled={busy} onClick={save}>{tr('common.save')}</button><button className="btn ghost" onClick={close}>{tr('common.cancel')}</button></Sheet>}

function ProgramSheet({p,close,done,toast}){const {t:tr}=useI18n();
  const isNew=!p.id,[name,setName]=useState(p.name||''),[pat,setPat]=useState(p.pattern||'semester'),[terms,setTerms]=useState(PATTERN[pat][2]),[touched,setTouched]=useState(false),[busy,setBusy]=useState(false)
  const lab=PATTERN[pat][1],pick=k=>{setPat(k);setTerms(touched?Math.min(terms,maxOf(PATTERN[k][1])):PATTERN[k][2])}
  const save=async()=>{setBusy(true);try{const r=await api(isNew?'/programs':'/programs/'+p.id,{method:isNew?'POST':'PUT',body:{name,pattern:pat,...(isNew?{terms}:{})}});toast(isNew?(r.terms?tr(r.terms===1?'prog.addedWithOne':'prog.addedWithMany',{n:r.terms,term:lab.toLowerCase()}):tr('prog.added')):tr('topic.changesSaved'));done()}catch(e){toast(e.message)}setBusy(false)}
  return <Sheet close={close}><h3>{isNew?tr('learn.newProgram'):tr('prog.editProgram')}</h3>
    <label>{tr('sheet.name')}</label><input value={name} onChange={e=>setName(e.target.value)} onKeyDown={e=>e.key==='Enter'&&save()} placeholder={tr('prog.namePh')} autoFocus/>
    <p className="known" style={{marginTop:10}}>{tr('prog.nameHint')}</p>
    <label id="pat">{tr('prog.howDivided')}</label><div role="group" aria-labelledby="pat" className="seg" style={{marginTop:0}}>{Object.entries(PATTERN).map(([k,[l]])=><button key={k} className={pat===k?'on':''} aria-pressed={pat===k} onClick={()=>pick(k)}>{l}</button>)}</div>
    <p className="known" style={{marginTop:6}}>{tr(PATTERN[pat][3])}</p>
    {isNew?<><label htmlFor="nt">{tr('prog.howMany',{term:lab.toLowerCase()})}</label><select id="nt" value={terms} onChange={e=>{setTerms(+e.target.value);setTouched(true)}}>{[0,...upTo(maxOf(lab))].map(n=><option key={n} value={n}>{n===0?tr('prog.noneYetOption'):n}</option>)}</select>
      <p className="known" style={{marginTop:6}}>{terms?tr(terms>1?'prog.createdMany':'prog.createdOne',{lab,n:terms}):tr('prog.laterOne')}</p></>
      :p.pattern&&pat!==p.pattern&&<p className="known" style={{marginTop:6}}>{tr('prog.renamed',{from:PATTERN[p.pattern]?.[1]||'Semester',to:lab})}{pat==='grade'&&' '+tr('prog.gradeAdd')}</p>}
    <button className="btn" disabled={busy||!name.trim()} onClick={save}>{isNew?tr('prog.addProgram'):tr('topic.saveChanges')}</button></Sheet>}

function Branding({toast,onSaved}){const {t:tr}=useI18n();
  const [name,setName]=useState(''),[logo,setLogo]=useState(null),[busy,setBusy]=useState(false),file=useRef(null)
  useEffect(()=>{api('/config').then(c=>{setName(c.name);setLogo(c.logo)}).catch(()=>{})},[])
  const pick=async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;setBusy(true)
    try{const r=await fetch('/api/uploads',{method:'POST',headers:{Authorization:'Bearer '+localStorage.t,'Content-Type':f.type},body:f}),j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.detail||'Upload failed');setLogo(j.url)}catch(x){toast(x.message)}setBusy(false)}
  const save=async body=>{setBusy(true);try{await api('/admin/branding',{method:'PUT',body});toast(tr('brand.saved'));onSaved()}catch(e){toast(e.message)}setBusy(false)}
  return <><h3 className="sec first">{tr('brand.title')}</h3><p className="known">{tr('brand.hint')}</p>
    <div className="lpreview"><Logo src={logo} size={48}/><b>{name||tr('sheet.name')}</b></div>
    <label htmlFor="inst">{tr('sheet.name')}</label><input id="inst" value={name} maxLength={60} onChange={e=>setName(e.target.value)}/>
    <input ref={file} type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden onChange={pick}/>
    <div className="two"><button className="btn ghost" disabled={busy} onClick={()=>file.current.click()}><Upload size={16}/> {logo?tr('brand.replace'):tr('brand.upload')}</button>
      <button className="btn ghost" disabled={busy||!logo} onClick={()=>{setLogo(null);save({remove_logo:true,name})}}>{tr('brand.remove')}</button></div>
    <button className="btn" disabled={busy} onClick={()=>save({name,logo_url:logo||undefined})}>{tr('brand.save')}</button></>}
function AiConfig({toast,onBrand}){const {t:tr}=useI18n();
  const confirm=useConfirm()
  const [cfg,setCfg]=useState({}),[key,setKey]=useState(''),[model,setModel]=useState(''),[st,setSt]=useState({})
  const load=()=>{api('/admin/settings').then(c=>{setCfg(c);setModel(c.model)});api('/admin/stats').then(setSt)};useEffect(load,[])
  const run=useRun(toast,load)
  return <><Bar title={tr('ai.settings')} sub={cfg.key_set?tr('ai.onKey',{hint:cfg.key_hint}):tr('ai.offNoKey')}/><div className="main"><Branding toast={toast} onSaved={onBrand}/><h3 className="sec">{tr('ai.heading')}</h3>
    <label>{tr('ai.keyLabel')}</label><input type="password" value={key} onChange={e=>setKey(e.target.value)} placeholder={cfg.key_set?tr('ai.keepKey'):tr('ai.keyPh')}/>
    <label>{tr('ai.model')}</label><input value={model} onChange={e=>setModel(e.target.value)} placeholder="deepseek-chat"/>
    <button className="btn" onClick={()=>run(()=>api('/admin/settings',{method:'PUT',body:{deepseek_key:key,model}}).then(()=>setKey('')),tr('ai.saved'))}>{tr('common.save')}</button>
    {cfg.key_set&&<><button className="btn ghost" onClick={async()=>{try{toast((await api('/admin/ai/test',{method:'POST'})).message)}catch(e){toast(e.message)}}}>{tr('ai.test')}</button>
      <button className="btn ghost" onClick={async()=>{if(await confirm({title:tr('ai.offTitle'),body:tr('ai.offBody'),ok:tr('ai.offOk'),danger:true}))run(()=>api('/admin/settings',{method:'PUT',body:{remove_key:true}}),tr('ai.off'))}}>{tr('ai.removeKey')}</button></>}
    <p className="known" style={{marginTop:20}}>{tr('ai.intro',{cached:(st.cached??0).toLocaleString(),tokens:(st.tokens_saved??0).toLocaleString()})}</p>
    <h3 className="sec">{tr('ai.prompts')}</h3><PromptEditor toast={toast}/>
    <h3 className="sec">{tr('selfreg.title')}</h3><SelfReg cfg={cfg} run={run}/>
    <h3 className="sec">{tr('mail.title')}</h3><p className="known">{tr(cfg.mail_on?'mail.on':'mail.off')}</p>
    {cfg.mail_on&&<button className="btn ghost" onClick={async()=>{try{toast((await api('/admin/mail/test',{method:'POST'})).message)}catch(e){toast(e.message)}}}>{tr('mail.test')}</button>}</div></>}

const VERB={POST:'activity.created',PUT:'activity.changed',PATCH:'activity.edited',DELETE:'activity.deleted'}
const NOUN_KEYS=['program','semester','course','unit','topic','user','quiz','question','prompt','setting','year','grade','term','answer','file']
const describe=(m,p,tr)=>{const s=p.replace(/^\/api\//,'').split('/'),id=s.find(x=>/^\d+$/.test(x)),n=s.filter(x=>!/^\d+$/.test(x)),last=n[n.length-1],noun=n[0]==='admin'?n[1]:n[0],one=(noun||'').replace(/s$/,'')
  const word=w=>{const k='noun.'+w;const v=tr(k);return NOUN_KEYS.includes(w)?v:w}
  if(p==='/api/uploads')return tr('activity.uploaded');if(p==='/api/me/password')return tr('activity.ownPw')
  if(p==='/api/admin/import')return tr('activity.importContent');if(p==='/api/admin/users/import')return tr('activity.importUsers')
  if(last==='reset-password')return tr('activity.resetPw',{id});if(last==='courses')return tr('activity.assigned',{id})
  if(last==='links')return tr('activity.shared',{id})
  if(last==='publish')return tr('activity.publish',{noun:word(one),id})
  if(n[0]==='admin'&&n[1]==='settings')return tr('activity.settings')
  return tr('activity.generic',{verb:VERB[m]?tr(VERB[m]):m,noun:word(one),id:id?' #'+id:''})}
function Activity(){const {t:tr}=useI18n();
  const [q,setQ]=useState(''),[rows,setRows]=useState([]),[total,setTotal]=useState(0),[busy,setBusy]=useState(false)
  const load=(more)=>{setBusy(true);api(`/admin/audit?q=${encodeURIComponent(q)}&offset=${more?rows.length:0}&limit=50`).then(r=>{setRows(more?[...rows,...r.items]:r.items);setTotal(r.total)}).finally(()=>setBusy(false))}
  useEffect(()=>{const t=setTimeout(()=>load(false),250);return()=>clearTimeout(t)},[q])
  return <><Bar title={tr('activity.title')} sub={tr('activity.sub')}/><div className="main"><div className="search"><Search size={18}/><input type="search" aria-label={tr('activity.search')} placeholder={tr('activity.searchPh')} value={q} onChange={e=>setQ(e.target.value)}/></div>
    {rows.length?rows.map(x=><div className="row" key={x.id}><div>{describe(x.method,x.path,tr)}{x.status>=400&&<span className="pill off sm">{x.status===403?tr('activity.notAllowed'):tr('activity.failed')}</span>}<small>{x.user} · {when(x.at)}</small></div></div>):busy?<Skeleton/>:<p className="known">{tr('activity.none')}</p>}
    {rows.length<total&&<ShowMore left={total-rows.length} busy={busy} onClick={()=>load(true)}/>}</div></>}
const day=d=>d?new Date(d).toLocaleDateString(undefined,{day:'numeric',month:'short'}):'never'
const fetchFile=async(url,name,toast)=>{try{const r=await fetch('/api'+url,{headers:{Authorization:'Bearer '+localStorage.t}});if(!r.ok)throw new Error((await r.json().catch(()=>({}))).detail||'Download failed')
  const a=document.createElement('a');a.href=URL.createObjectURL(await r.blob());a.download=name;a.click();URL.revokeObjectURL(a.href)}catch(e){toast(e.message)}}
const Bar2=({v})=><div className="meter"><i style={{width:Math.min(100,v||0)+'%'}}/></div>
function CourseReports({toast,onOpen}){const {t:tr}=useI18n();
  const [f,setF]=useState({p:0,s:0}),[rows,setRows]=useState(null),[progs,setProgs]=useState([])
  useEffect(()=>{api('/tree').then(t=>setProgs(t.map(p=>({id:p.id,name:p.name,term:p.term,max:Math.max(0,...p.semesters.map(x=>x.number||0))||(p.term==='Year'?4:maxOf(p.term))})))).catch(()=>{})},[])
  const pr=progs.find(x=>x.id===f.p),lab=pr?pr.term:progs.length&&progs.every(x=>x.term==='Semester')?'Semester':progs.length&&progs.every(x=>x.term==='Year')?'Year':progs.length&&progs.every(x=>x.term==='Grade')?'Grade':'Term',top=pr?pr.max:Math.max(8,...progs.map(x=>x.max))
  const qs=`?program_id=${f.p}&semester=${f.s}`
  useEffect(()=>{setRows(null);api('/reports/courses'+qs).then(setRows).catch(e=>toast(e.message))},[f.p,f.s])
  return <><div className="qopt"><select value={f.p} onChange={e=>{const p=+e.target.value,x=progs.find(y=>y.id===p);setF({p,s:x&&f.s>x.max?0:f.s})}}><option value={0}>{tr('users.allPrograms')}</option>{progs.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select>
    <select aria-label={tr('rep.filterBy',{term:lab.toLowerCase()})} value={f.s} onChange={e=>setF({...f,s:+e.target.value})}><option value={0}>{lab==='Term'?tr('users.allTerms'):tr('users.allTermsOf',{term:lab.toLowerCase()})}</option>{Array.from({length:top},(_,i)=>i+1).map(n=><option key={n} value={n}>{lab} {n}</option>)}</select></div>
    {rows&&!rows.length&&<p className="known">{tr('rep.noCourses')}</p>}
    {rows?.map(x=><button className="row rowbtn" key={x.course_id} onClick={()=>onOpen(x)}><div>{x.course}<small>{tr('rep.courseLine',{program:x.program,semester:x.semester,students:x.students,topics:x.topics,pct:x.avg_completion})}{x.quizzes?' · '+tr('rep.quizAvg',{pct:(x.avg_quiz_percent??'–')+'%'}):''}</small><Bar2 v={x.avg_completion}/></div><ChevronRight size={18}/></button>)}
    {rows?.length>0&&<button className="btn ghost" onClick={()=>fetchFile('/reports/courses?format=csv&program_id='+f.p+'&semester='+f.s,'courses.csv',toast)}>{tr('rep.downloadCourses')}</button>}</>}
function StudentReport({c,back,toast}){const {t:tr}=useI18n();
  const [d,setD]=useState(null),[w,setW]=useState(null);useEffect(()=>{api(`/reports/courses/${c.course_id}/students`).then(setD).catch(e=>toast(e.message));api(`/reports/courses/${c.course_id}/weak-areas`).then(setW).catch(()=>{})},[])
  return <><Bar title={c.course} sub={c.program+' · '+c.semester} back={back}/><div className="main">
    {w&&w.areas.length>0&&<><h3 className="sec first">{tr('rep.hardTopics')}</h3><p className="known" style={{margin:'0 0 8px'}}>{tr('rep.hardHint')}</p>{w.areas.slice(0,8).map(a=><div className="row" key={a.topic_id||'u'+a.unit_id}><div>{a.title}<small>{tr('rep.hardLine',{pct:a.percent,n:a.needs_study,total:a.students})}</small><Bar2 v={a.percent}/></div></div>)}<h3 className="sec">{tr('prog.students')}</h3></>}
    {d&&!d.students.length&&<p className="known">{tr('rep.noEnrolled')}</p>}
    {d?.students.map(x=><div className="row" key={x.email}><div>{x.name}{!x.active&&<span className="pill off sm">{tr('users.disabled')}</span>}<small>{x.completion}% · {x.topics_read}/{x.topics} {tr('rep.topicsWord')}{c.quizzes?' · '+tr('rep.quizzesCount',{taken:x.quizzes_taken,n:x.quizzes})+(x.avg_quiz_percent!=null?', '+tr('rep.avgN',{pct:x.avg_quiz_percent+'%'}):''):''} · {tr('rep.lastActive',{day:day(x.last_active)})}</small>{(x.strong.length>0||x.needs_study.length>0)&&<small>{x.strong.length>0&&tr('rep.strong')+': '+x.strong.join(', ')}{x.strong.length>0&&x.needs_study.length>0&&' · '}{x.needs_study.length>0&&tr('rep.needsRound')+': '+x.needs_study.join(', ')}</small>}<Bar2 v={x.completion}/></div></div>)}
    {d?.students.length>0&&<button className="btn ghost" onClick={()=>fetchFile(`/reports/courses/${c.course_id}/students?format=csv`,'students-'+c.course.replace(/\s+/g,'_')+'.csv',toast)}>{tr('rep.downloadStudents')}</button>}</div></>}
function Reports({role,toast}){const {t:tr}=useI18n();
  const [st,setSt]=useState({}),[r,setR]=useState(null),[open,setOpen]=useState(null)
  useEffect(()=>{if(role==='faculty')return;api('/admin/stats').then(setSt);api('/admin/reports').then(setR)},[])
  if(open)return <StudentReport c={open} back={()=>setOpen(null)} toast={toast}/>
  if(role==='faculty')return <><Bar title={tr('rep.title')} sub={tr('rep.yourCourses')}/><div className="main"><CourseReports toast={toast} onOpen={setOpen}/></div></>
  const list=(rows,empty,f)=>rows?.length?rows.map((x,i)=><div className="row" key={i}>{f(x)}</div>):<p className="known">{empty}</p>
  return <><Bar title={tr('rep.title')}/><div className="main"><div className="stats">
    {[['students',tr('prog.students')],['topics',tr('home.topics')],['cached',tr('rep.savedAi')],['tokens_saved',tr('rep.tokensSaved')]].map(([k,l])=><div className="stat" key={k}><b>{(st[k]??0).toLocaleString()}</b>{l}</div>)}</div>
    <h3 className="sec">{tr('rep.courses')}</h3><CourseReports toast={toast} onOpen={setOpen}/>
    <h3 className="sec">{tr('rep.mostRead')}</h3>
    {list(r?.top_topics,tr('users.noReading'),x=><div>{x.title}<small>{tr('rep.readers',{n:x.readers,reads:x.reads})}</small></div>)}
    <h3 className="sec">{tr('prog.students')}</h3>
    {list(r?.students,tr('rep.noStudents'),x=><div>{x.name}<small>{tr('rep.topicsRead',{n:x.topics_read,day:day(x.last_active)})}{!x.active&&tr('rep.disabledSuffix')}</small></div>)}
    <h3 className="sec">{tr('rep.savedAi')}</h3>
    {list(r?.ai,tr('rep.nothingSaved'),x=><div>{x.title}<small>{tr(x.kind==='explain'?'rep.explanation':'rep.sample')}{tr('rep.reused',{hits:x.hits,tokens:x.saved.toLocaleString()})}</small></div>)}</div></>}

function About({user}){const {t:tr}=useI18n();
  const {appName}=useContext(Ctx),[c,setC]=useState({});useEffect(()=>{api('/config').then(setC)},[])
  return <><Bar title={tr('about.title')}/><div className="main"><div className="hero"><h2>{appName}</h2><p>{tr('about.version',{v:c.version||''})}</p></div>
    <div className="prose"><p>{tr('about.p1')}</p>
    <p>{tr('about.p2')}</p>
    <p>{tr('about.signedIn')} <strong>{user.name}</strong> ({tr({admin:'users.roleAdmin',faculty:'users.roleFaculty'}[user.role]||'users.roleStudent')})</p></div></div></>}
