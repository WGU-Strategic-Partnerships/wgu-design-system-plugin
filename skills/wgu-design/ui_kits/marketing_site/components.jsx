const { useState } = React;

function Header({ onApply }) {
  const links = ['Degrees', 'Admissions', 'Tuition & Financial Aid', 'Students', 'About WGU'];
  return (
    <header style={{position:'sticky',top:0,zIndex:40,background:'#fff',borderBottom:'1px solid rgba(0,40,85,0.08)'}}>
      <div style={{maxWidth:1280,margin:'0 auto',padding:'16px 32px',display:'flex',alignItems:'center',gap:32}}>
        <img src="../../assets/logos/wgu-logo-university.png" alt="WGU" style={{height:34}}/>
        <nav style={{display:'flex',gap:20}}>
          {links.map(l => (
            <a key={l} href="#" style={{fontFamily:'var(--font-display)',fontWeight:500,fontSize:14,color:'var(--wgu-blue)',textDecoration:'none',whiteSpace:'nowrap'}}>{l}</a>
          ))}
        </nav>
        <div style={{marginLeft:'auto',display:'flex',gap:12,alignItems:'center'}}>
          <a href="#" style={{fontFamily:'var(--font-display)',fontWeight:500,fontSize:14,color:'var(--wgu-blue)',textDecoration:'none'}}>Sign in</a>
          <button onClick={onApply} style={{fontFamily:'var(--font-display)',fontWeight:700,fontSize:14,background:'var(--wgu-medium-blue)',color:'#fff',border:0,padding:'10px 22px',borderRadius:'var(--tweak-radius, 999px)',cursor:'pointer',letterSpacing:'0.02em',whiteSpace:'nowrap'}}>Apply Now</button>
        </div>
      </div>
    </header>
  );
}

function Hero({ onApply, headline, campaign, dark }) {
  const [email, setEmail] = useState('');
  const bg = dark ? 'var(--wgu-blue)' : '#fff';
  const fg = dark ? '#fff' : 'var(--wgu-blue)';
  const sub = dark ? '#BBD0E8' : 'var(--fg-2)';
  const overlay = dark
    ? 'linear-gradient(135deg, rgba(0,23,49,0.75) 0%, rgba(0,40,85,0.35) 100%)'
    : 'linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.55) 100%)';
  const headingFont = campaign ? "'Oswald', sans-serif" : 'var(--font-display)';
  const headingStyle = campaign ? {textTransform:'uppercase', letterSpacing:'-0.005em', fontWeight:700} : {letterSpacing:'-0.01em', fontWeight:800};
  return (
    <section style={{position:'relative',background:bg,color:fg,overflow:'hidden'}}>
      <div style={{position:'absolute',inset:0,background:"var(--tweak-hero-pattern) center/cover",opacity: dark ? 0.45 : 0.25}}/>
      <div style={{position:'absolute',inset:0,background:overlay}}/>
      <div style={{position:'relative',maxWidth:1280,margin:'0 auto',padding:'96px 32px 120px',display:'grid',gridTemplateColumns:'1.4fr 1fr',gap:48,alignItems:'center'}}>
        <div>
          <div style={{fontFamily:'var(--font-display)',fontWeight:700,fontSize:14,letterSpacing:'0.18em',textTransform:'uppercase',color: dark ? 'var(--wgu-lime)' : 'var(--wgu-medium-blue)'}}>Education for the People</div>
          <h1 style={{fontFamily:headingFont, ...headingStyle, fontSize:`calc(76px * var(--tweak-heading-scale, 1))`,lineHeight:0.98,margin:'14px 0 24px',textWrap:'balance',color:fg}}>{headline}</h1>
          <p style={{fontFamily:'var(--font-body)',fontSize:20,lineHeight:1.45,color:sub,maxWidth:540,margin:0}}>Earn an accredited, competency-based degree online — on your schedule, at a flat tuition rate. Start any month.</p>
          <div style={{display:'flex',gap:14,marginTop:32}}>
            <button onClick={onApply} style={{fontFamily:'var(--font-display)',fontWeight:700,fontSize:16,background:'var(--wgu-lime)',color:'var(--wgu-blue)',border:0,padding:'16px 34px',borderRadius:'var(--tweak-radius, 999px)',cursor:'pointer',letterSpacing:'0.02em'}}>Apply now →</button>
            <button style={{fontFamily:'var(--font-display)',fontWeight:700,fontSize:16,background:'transparent',border:`2px solid ${fg}`,color:fg,padding:'14px 32px',borderRadius:'var(--tweak-radius, 999px)',cursor:'pointer'}}>Request info</button>
          </div>
        </div>
        <div style={{background:'rgba(255,255,255,0.06)',backdropFilter:'blur(2px)',border:'1px solid rgba(255,255,255,0.14)',borderRadius:16,padding:28}}>
          <div style={{fontFamily:'var(--font-display)',fontWeight:700,fontSize:18,marginBottom:14}}>Find your program in 30 seconds</div>
          <label style={{display:'block',marginBottom:12}}>
            <span style={{fontFamily:'var(--font-display)',fontWeight:500,fontSize:13,display:'block',marginBottom:6,color:'#BBD0E8'}}>I'm interested in</span>
            <select style={{width:'100%',fontFamily:'var(--font-body)',fontSize:15,padding:'12px 14px',borderRadius:8,border:'1px solid rgba(255,255,255,0.2)',background:'rgba(255,255,255,0.06)',color:'#fff'}}>
              <option>Business</option><option>Technology</option><option>Health</option><option>Education</option>
            </select>
          </label>
          <label style={{display:'block',marginBottom:16}}>
            <span style={{fontFamily:'var(--font-display)',fontWeight:500,fontSize:13,display:'block',marginBottom:6,color:'#BBD0E8'}}>Email</span>
            <input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="you@example.com" style={{width:'100%',fontFamily:'var(--font-body)',fontSize:15,padding:'12px 14px',borderRadius:8,border:'1px solid rgba(255,255,255,0.2)',background:'rgba(255,255,255,0.06)',color:'#fff',boxSizing:'border-box'}}/>
          </label>
          <button style={{width:'100%',fontFamily:'var(--font-display)',fontWeight:700,fontSize:15,background:'var(--wgu-medium-blue)',color:'#fff',border:0,padding:'14px',borderRadius:'var(--tweak-radius, 999px)',cursor:'pointer'}}>Match me with programs</button>
        </div>
      </div>
    </section>
  );
}

function StatBand() {
  const stats = [
    {n:'75+', u:'', label:'industry-aligned programs'},
    {n:'100', u:'%', label:'online, competency-based'},
    {n:'1:1', u:'', label:'mentor from day one'},
    {n:'94', u:'%', label:'employer satisfaction'},
  ];
  return (
    <section style={{background:'var(--wgu-light-blue)',padding:'64px 32px'}}>
      <div style={{maxWidth:1280,margin:'0 auto',display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:24}}>
        {stats.map(s => (
          <div key={s.label}>
            <div style={{fontFamily:"'Newsreader', serif",fontWeight:600,fontSize:72,lineHeight:1,color:'var(--wgu-blue)'}}>{s.n}<span style={{color:'var(--wgu-medium-blue)',fontSize:44}}>{s.u}</span></div>
            <div style={{fontFamily:'var(--font-body)',fontSize:16,color:'var(--fg-2)',marginTop:8,lineHeight:1.4}}>{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ProgramGrid() {
  const schools = [
    {name:'School of Business', blurb:'MBA, Accounting, Management, Marketing.', count:'14 programs', pattern:'connect-blue.png'},
    {name:'School of Technology', blurb:'Software Engineering, Cybersecurity, Cloud, Data.', count:'18 programs', pattern:'network-blue.png'},
    {name:'Leavitt School of Health', blurb:'Nursing (RN-BSN), Health Info, Public Health.', count:'16 programs', pattern:'growth-blue.png'},
    {name:'School of Education', blurb:'K-12 Teaching, Leadership, Curriculum & Instruction.', count:'20+ programs', pattern:'swirl-blue.png'},
  ];
  return (
    <section style={{padding:'96px 32px',background:'#fff'}}>
      <div style={{maxWidth:1280,margin:'0 auto'}}>
        <div style={{fontFamily:'var(--font-display)',fontWeight:700,fontSize:14,letterSpacing:'0.14em',textTransform:'uppercase',color:'var(--wgu-medium-blue)'}}>Four schools, one flat-rate tuition</div>
        <h2 style={{fontFamily:'var(--font-display)',fontWeight:800,fontSize:48,lineHeight:1.05,margin:'10px 0 40px',maxWidth:760}}>Find the program that fits the life you're already living.</h2>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:20}}>
          {schools.map(s => (
            <a key={s.name} href="#" style={{background:'#fff',border:'1px solid rgba(0,40,85,0.08)',borderRadius:12,overflow:'hidden',boxShadow:'0 1px 2px rgba(0,23,49,0.08)',textDecoration:'none',color:'inherit',display:'block'}}>
              <div style={{height:120,background:`url('../../assets/patterns/${s.pattern}') center/cover`}}/>
              <div style={{padding:20}}>
                <div style={{fontFamily:'var(--font-display)',fontWeight:700,fontSize:11,letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--wgu-medium-blue)'}}>{s.count}</div>
                <h3 style={{fontFamily:'var(--font-display)',fontWeight:800,fontSize:20,margin:'6px 0 8px',lineHeight:1.15,color:'var(--wgu-blue)'}}>{s.name}</h3>
                <p style={{fontFamily:'var(--font-body)',fontSize:14,lineHeight:1.5,color:'var(--fg-2)',margin:0}}>{s.blurb}</p>
                <div style={{marginTop:14,fontFamily:'var(--font-display)',fontWeight:600,fontSize:14,color:'var(--wgu-medium-blue)'}}>Explore programs →</div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonial() {
  return (
    <section style={{position:'relative',background:'var(--wgu-midnight)',color:'#fff',overflow:'hidden',padding:'96px 32px'}}>
      <div style={{position:'absolute',inset:0,background:"url('../../assets/patterns/comms-navy-wide.png') center/cover",opacity:0.5}}/>
      <div style={{position:'absolute',inset:0,background:'linear-gradient(180deg, rgba(0,23,49,0.6) 0%, rgba(0,23,49,0.9) 100%)'}}/>
      <div style={{position:'relative',maxWidth:1000,margin:'0 auto',textAlign:'center'}}>
        <div style={{fontFamily:"'Newsreader', serif",fontWeight:600,fontSize:180,lineHeight:0.6,color:'var(--wgu-lime)'}}>"</div>
        <blockquote style={{fontFamily:'var(--font-display)',fontWeight:500,fontStyle:'italic',fontSize:36,lineHeight:1.3,margin:'0 0 28px',textWrap:'balance',color:'#fff'}}>
          WGU gave me the flexibility to finish my degree while raising two kids and working full-time. It's the only way I could have done it.
        </blockquote>
        <div style={{fontFamily:'var(--font-body)',fontSize:16,color:'#BBD0E8'}}><strong style={{color:'#fff',fontWeight:600}}>Jamie R.</strong> &nbsp;·&nbsp; MBA '24, School of Business</div>
      </div>
    </section>
  );
}

function CtaBand({ onApply }) {
  return (
    <section style={{background:'linear-gradient(135deg, #002855 0%, #0070F0 100%)',color:'#fff',padding:'64px 32px'}}>
      <div style={{maxWidth:1280,margin:'0 auto',display:'flex',alignItems:'center',justifyContent:'space-between',gap:32,flexWrap:'wrap'}}>
        <div>
          <h2 style={{fontFamily:'var(--font-display)',fontWeight:800,fontSize:44,lineHeight:1.05,margin:'0 0 8px',textWrap:'balance',color:'#fff'}}>Let's build what's next.</h2>
          <p style={{fontFamily:'var(--font-body)',fontSize:18,margin:0,color:'rgba(255,255,255,0.85)'}}>Apply in under 20 minutes — no application fee.</p>
        </div>
        <div style={{display:'flex',gap:14}}>
          <button style={{fontFamily:'var(--font-display)',fontWeight:700,fontSize:16,background:'transparent',border:'2px solid #fff',color:'#fff',padding:'14px 28px',borderRadius:'var(--tweak-radius, 999px)',cursor:'pointer'}}>Talk to a counselor</button>
          <button onClick={onApply} style={{fontFamily:'var(--font-display)',fontWeight:700,fontSize:16,background:'var(--wgu-lime)',color:'var(--wgu-blue)',border:0,padding:'16px 30px',borderRadius:'var(--tweak-radius, 999px)',cursor:'pointer'}}>Apply now →</button>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const cols = [
    {h:'Degrees', items:['Business','Technology','Health','Education','All programs']},
    {h:'Admissions', items:['How to apply','Transfer credits','Financial aid','Military & veteran','Employer partners']},
    {h:'About', items:['Our story','Leadership','News','Research','Careers at WGU']},
    {h:'Support', items:['Contact','Student portal','Accessibility','Privacy','Terms']},
  ];
  return (
    <footer style={{background:'var(--wgu-midnight)',color:'#BBD0E8',padding:'64px 32px 32px'}}>
      <div style={{maxWidth:1280,margin:'0 auto'}}>
        <div style={{display:'grid',gridTemplateColumns:'1.4fr repeat(4, 1fr)',gap:40,marginBottom:48}}>
          <div>
            <img src="../../assets/logos/wgu-logo-university.png" alt="WGU" style={{height:40,filter:'brightness(0) invert(1)'}}/>
            <p style={{fontFamily:'var(--font-body)',fontSize:14,lineHeight:1.6,marginTop:16,maxWidth:280}}>An accredited, nonprofit, online university founded in 1997 by 19 U.S. governors.</p>
          </div>
          {cols.map(c => (
            <div key={c.h}>
              <div style={{fontFamily:'var(--font-display)',fontWeight:700,fontSize:13,letterSpacing:'0.1em',textTransform:'uppercase',color:'#fff',marginBottom:14}}>{c.h}</div>
              <ul style={{listStyle:'none',padding:0,margin:0,display:'flex',flexDirection:'column',gap:10}}>
                {c.items.map(i => <li key={i}><a href="#" style={{color:'#BBD0E8',textDecoration:'none',fontFamily:'var(--font-body)',fontSize:14}}>{i}</a></li>)}
              </ul>
            </div>
          ))}
        </div>
        <div style={{borderTop:'1px solid rgba(255,255,255,0.1)',paddingTop:24,display:'flex',justifyContent:'space-between',fontFamily:'var(--font-body)',fontSize:13,color:'#7A93B3'}}>
          <div>© 2026 Western Governors University. All rights reserved.</div>
          <div>Salt Lake City, Utah &nbsp;·&nbsp; wgu.edu</div>
        </div>
      </div>
    </footer>
  );
}

Object.assign(window, { Header, Hero, StatBand, ProgramGrid, Testimonial, CtaBand, Footer });
