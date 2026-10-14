const pptxgen = require('pptxgenjs');

const pptx = new pptxgen();
pptx.layout = 'LAYOUT_WIDE';
pptx.author = 'OmniDecoder';
pptx.subject = 'OmniDecoder project overview';
pptx.title = 'OmniDecoder — Forensic Decoding Workbench';
pptx.company = 'OmniDecoder';
pptx.lang = 'en-US';
pptx.theme = {
  headFontFace: 'Aptos Display', bodyFontFace: 'Aptos', lang: 'en-US'
};
pptx.defineLayout({ name: 'CUSTOM_WIDE', width: 13.333, height: 7.5 });
pptx.layout = 'CUSTOM_WIDE';
pptx.defineSlideMaster({
  title: 'MASTER',
  background: { color: '07111F' },
  objects: [
    { rect: { x: 0, y: 0, w: 13.333, h: 0.07, fill: { color: '28E0D3' }, line: { color: '28E0D3' } } },
    { text: { text: 'OMNIDECODER  /  FORENSIC DECODING WORKBENCH', options: { x: 0.55, y: 7.08, w: 7.4, h: 0.18, fontFace: 'Aptos', fontSize: 7.5, color: '6F8299', charSpacing: 1.3, margin: 0, breakLine: false } } },
    { text: { text: 'LOCAL-FIRST  •  ANALYST-READY', options: { x: 9.35, y: 7.08, w: 3.4, h: 0.18, align: 'right', fontFace: 'Aptos', fontSize: 7.5, color: '6F8299', charSpacing: 1.1, margin: 0, breakLine: false } } }
  ],
  slideNumber: { x: 12.82, y: 7.08, color: '6F8299', fontFace: 'Aptos', fontSize: 7.5 }
});

const C = { bg:'07111F', panel:'0C1A2B', panel2:'10243A', cyan:'28E0D3', purple:'A982FF', yellow:'FFC857', green:'55E6A5', red:'FF6B7A', text:'F1F6FA', muted:'91A5BC', line:'24405A' };
const S = pptx.ShapeType;
function text(slide, txt, x, y, w, h, opt={}) { slide.addText(txt, { x,y,w,h, margin:0, fontFace: opt.fontFace || 'Aptos', fontSize:opt.fontSize||14, color:opt.color||C.text, bold:opt.bold||false, breakLine:false, fit:'shrink', valign:opt.valign||'mid', align:opt.align||'left', paraSpaceAfterPt:0, bullet:opt.bullet, charSpacing:opt.charSpacing, italic:opt.italic }); }
function box(slide,x,y,w,h,fill=C.panel, line=C.line, radius=0.13) { slide.addShape(S.roundRect,{x,y,w,h,rectRadius:radius,fill:{color:fill,transparency:0},line:{color:line,width:0.7}}); }
function title(slide, eyebrow, heading, sub='') { text(slide,eyebrow.toUpperCase(),0.6,0.42,4.7,0.2,{fontSize:8.5,color:C.cyan,bold:true,charSpacing:1.5}); text(slide,heading,0.6,0.69,11.9,0.5,{fontSize:27,bold:true}); if(sub) text(slide,sub,0.6,1.25,11.7,0.29,{fontSize:11,color:C.muted}); }
function chip(slide,label,x,y,w,color=C.cyan){ slide.addShape(S.roundRect,{x,y,w,h:0.29,rectRadius:0.1,fill:{color,transparency:84},line:{color,transparency:35,width:0.6}}); text(slide,label,x,y+0.01,w,0.18,{fontSize:7.3,color,bold:true,align:'center',charSpacing:0.6}); }
function metric(slide, val, label, x, color) { text(slide,val,x,5.85,1.7,0.38,{fontSize:25,bold:true,color}); text(slide,label,x,6.28,2.3,0.23,{fontSize:8.5,color:C.muted,charSpacing:0.5}); }
function node(slide,label,x,y,w,color){ box(slide,x,y,w,0.54,C.panel2,color); text(slide,label,x+0.1,y+0.07,w-0.2,0.18,{fontSize:9,bold:true,color,align:'center'}); }

// 1 — cover
{
 const s=pptx.addSlide('MASTER');
 s.addShape(S.ellipse,{x:8.8,y:0.65,w:4.1,h:4.1,fill:{color:C.cyan,transparency:92},line:{color:C.cyan,transparency:100}});
 s.addShape(S.ellipse,{x:9.55,y:1.38,w:2.62,h:2.62,fill:{color:C.purple,transparency:86},line:{color:C.purple,transparency:60,width:1}});
 for(let i=0;i<5;i++) s.addShape(S.line,{x:8.15+i*.52,y:3.7-i*.3,w:3.2,h:0,line:{color:i%2?C.purple:C.cyan,transparency:35,width:1.1}});
 text(s,'OMNIDECODER',0.65,1.28,7.1,0.38,{fontSize:11,color:C.cyan,bold:true,charSpacing:4});
 text(s,'Decode what\nstandard tools miss.',0.65,1.82,7.4,1.38,{fontSize:37,bold:true});
 text(s,'A local-first forensic workbench for uncovering concealed encoding, steganographic signals, and multi-layer payloads.',0.68,3.47,6.5,0.68,{fontSize:15,color:C.muted});
 chip(s,'ZERO-WIDTH',0.68,4.48,1.27,C.cyan); chip(s,'BASE64 FORENSICS',2.07,4.48,1.62,C.purple); chip(s,'DEEP DECODING',3.82,4.48,1.54,C.yellow);
 text(s,'Project deck  |  August 2026',0.68,5.52,3.4,0.25,{fontSize:10,color:C.muted});
 text(s,'LOCAL ANALYSIS  ×  OPTIONAL GEMINI ASSISTANCE',8.1,5.74,4.15,0.25,{fontSize:8.5,color:C.cyan,bold:true,charSpacing:1.1,align:'right'});
}

// 2 — challenge
{
 const s=pptx.addSlide('MASTER'); title(s,'01 — Problem','Encoded data hides in plain sight.','Most decoding flows stop at the first recognizable layer — the signal may be deeper.');
 const items=[['Invisible channels','Zero-width characters can carry bits while leaving text visually unchanged.',C.cyan],['Valid-looking containers','Base64 can conceal information in unused padding bits.',C.purple],['Ambiguous payloads','Custom alphabets, noise, compression, encryption, and hashes demand different tests.',C.yellow]];
 items.forEach((a,i)=>{ const x=.65+i*4.1; box(s,x,2.0,3.72,2.75); s.addShape(S.ellipse,{x:x+.25,y:2.27,w:.36,h:.36,fill:{color:a[2],transparency:12},line:{color:a[2],transparency:100}}); text(s,`0${i+1}`,x+.25,2.34,.36,.12,{fontSize:7,color:C.bg,bold:true,align:'center'}); text(s,a[0],x+.25,2.84,3.05,.28,{fontSize:15,bold:true}); text(s,a[1],x+.25,3.29,3.13,.67,{fontSize:10.5,color:C.muted}); });
 text(s,'OmniDecoder brings complementary forensic checks into one analyst workflow — fast, explainable, and mostly local.',.65,5.35,10.9,.35,{fontSize:16,color:C.text,bold:true});
 metric(s,'10','ANALYSIS MODULES',.65,C.cyan); metric(s,'256','XOR KEYS TESTED',3.15,C.purple); metric(s,'1 MB','PROXY REQUEST LIMIT',5.7,C.yellow);
}

// 3 product
{
 const s=pptx.addSlide('MASTER'); title(s,'02 — Product','One payload. Multiple forensic lenses.','Paste suspicious text, ciphertext, Base64, hex, or a hash; select the lens that fits the question.');
 const modules=[['Zero-Width Inspector',C.cyan],['Base64 Padding Bits',C.purple],['Alphabet Auto-Tuner',C.cyan],['Entropy Inspector',C.yellow],['Deep Decode Pipeline',C.green],['XOR Brute Force',C.purple],['Noise Stripper',C.cyan],['AI Analyzer',C.purple],['Hash Analyzer',C.red]];
 modules.forEach((m,i)=>{const col=i%3,row=Math.floor(i/3),x=.65+col*4.05,y=1.9+row*1.18;box(s,x,y,3.65,.82,C.panel);s.addShape(S.rect,{x:x+.01,y:y+.01,w:.07,h:.8,fill:{color:m[1]},line:{color:m[1]}});text(s,m[0],x+.25,y+.18,3.05,.2,{fontSize:12,bold:true}); text(s,['Inspect hidden unicode','Extract unused bits','Match and decode bases','Measure randomness','Peel layers recursively','Test printable candidates','Remove structured filler','Rank hypotheses','Identify & assess'][i],x+.25,y+.47,3.05,.16,{fontSize:8.5,color:C.muted});});
}

// 4 flow
{
 const s=pptx.addSlide('MASTER'); title(s,'03 — Workflow','From raw payload to an explainable finding.','The interface pairs a left-side input/module selector with results that detail evidence, steps, and candidates.');
 const steps=[['1','PASTE','Suspicious payload'],['2','TRIAGE','Signatures & entropy'],['3','DECODE','Targeted / recursive'],['4','EXPLAIN','Results & evidence']];
 steps.forEach((it,i)=>{const x=.65+i*3.15;box(s,x,2.05,2.55,1.52,i===1?C.panel2:C.panel,i===1?C.cyan:C.line);text(s,it[0],x+.2,2.25,.35,.2,{fontSize:9,color:C.cyan,bold:true});text(s,it[1],x+.2,2.62,2,.23,{fontSize:13,bold:true});text(s,it[2],x+.2,3.02,2,.18,{fontSize:9.3,color:C.muted});if(i<3){s.addShape(S.chevron,{x:x+2.67,y:2.58,w:.27,h:.33,fill:{color:C.cyan,transparency:15},line:{color:C.cyan,transparency:80}})}});
 box(s,.65,4.36,12.0,1.32,C.panel2,C.line); text(s,'Evidence, not just output',.95,4.65,2.65,.24,{fontSize:14,bold:true,color:C.cyan}); text(s,'Every module surfaces the clues behind a conclusion: detected characters, padding behavior, entropy classification, magic bytes, match coverage, and decode layers.',3.65,4.55,8.25,.45,{fontSize:11,color:C.muted});
}

// 5 technical
{
 const s=pptx.addSlide('MASTER'); title(s,'04 — Architecture','Browser-first analysis with an optional, protected AI path.','The core decoder stays in the client; the local server only mediates approved Gemini requests.');
 node(s,'Payload input',.65,2.0,2.15,C.cyan); node(s,'Local decoder.js',3.25,2.0,2.35,C.green); node(s,'Results UI',6.05,2.0,1.75,C.cyan); node(s,'Analyst',8.25,2.0,1.4,C.text);
 [[2.8,2.24,.45],[5.6,2.24,.45],[7.8,2.24,.45]].forEach(a=>s.addShape(S.chevron,{x:a[0],y:a[1],w:a[2],h:.18,fill:{color:C.cyan},line:{color:C.cyan}}));
 s.addShape(S.line,{x:4.42,y:2.55,w:0,h:1.03,line:{color:C.purple,width:1,dash:'dash'}}); node(s,'Local Gemini proxy',3.25,3.75,2.35,C.purple); s.addShape(S.chevron,{x:5.83,y:3.94,w:.45,h:.18,fill:{color:C.purple},line:{color:C.purple}}); node(s,'Gemini API',6.48,3.7,1.68,C.purple);
 box(s,.65,5.1,12,1.0,C.panel,C.line); text(s,'Security boundary',.93,5.4,1.75,.2,{fontSize:12,bold:true,color:C.yellow}); text(s,'API key is loaded from a local .env file, never exposed to the browser. The proxy allowlists models, scopes CORS to the local origin, and caps JSON bodies at 1 MB.',2.75,5.29,9.2,.4,{fontSize:10.4,color:C.muted});
}

// 6 engine
{
 const s=pptx.addSlide('MASTER'); title(s,'05 — Decoding engine','Layer-aware analysis, not a single-shot conversion.','OmniDecoder combines format heuristics with safe decoding attempts and readable candidate ranking.');
 const rows=[['Zero-width → bits → bytes','Extracts invisible Unicode markers and reconstructs hidden byte streams.',C.cyan],['Base64 tail-bit analysis','Checks non-zero unused bits before padding — a covert-data indicator.',C.purple],['Alphabet matching & Base-X','Scores known alphabets and attempts Base64, Base58, Base32, and hex.',C.green],['Entropy & magic bytes','Classifies data character and identifies common binary signatures.',C.yellow],['Recursive pipeline & XOR','Peels transformations and tests all 256 single-byte XOR keys for printable output.',C.red]];
 rows.forEach((r,i)=>{const y=1.85+i*.78; s.addShape(S.ellipse,{x:.72,y:y+.12,w:.18,h:.18,fill:{color:r[2]},line:{color:r[2]}});text(s,r[0],1.1,y,3.35,.22,{fontSize:12.2,bold:true});text(s,r[1],4.65,y,7.3,.24,{fontSize:10.4,color:C.muted});s.addShape(S.line,{x:1.1,y:y+.48,w:10.85,h:0,line:{color:C.line,width:.5}});});
}

// 7 AI
{
 const s=pptx.addSlide('MASTER'); title(s,'06 — AI-assisted analysis','Use Gemini as a structured second opinion.','The AI Analyzer combines local fingerprinting and candidate decodes with an optional Gemini 2.5 Flash analysis.');
 box(s,.65,1.95,5.45,3.85,C.panel,C.purple); text(s,'Local-first baseline',.95,2.27,2.9,.25,{fontSize:16,bold:true,color:C.cyan}); ['Runs without an external call','Finds pattern fingerprints','Ranks decoder candidates','Shows multi-layer chain'].forEach((v,i)=>{s.addShape(S.ellipse,{x:1,y:2.87+i*.55,w:.14,h:.14,fill:{color:C.green},line:{color:C.green}});text(s,v,1.27,2.79+i*.55,3.6,.22,{fontSize:11,color:C.muted});});
 box(s,6.5,1.95,5.85,3.85,C.panel,C.purple); text(s,'Gemini assistance',6.8,2.27,3.1,.25,{fontSize:16,bold:true,color:C.purple}); ['Analysis summary and hypotheses','Step-by-step decode layers','Notes and confidence cues','Model allowlist enforced by proxy'].forEach((v,i)=>{s.addShape(S.ellipse,{x:6.85,y:2.87+i*.55,w:.14,h:.14,fill:{color:C.purple},line:{color:C.purple}});text(s,v,7.12,2.79+i*.55,4.05,.22,{fontSize:11,color:C.muted});});
 text(s,'Design principle: assistance enriches the investigation; it does not replace observable evidence.',.7,6.22,11.5,.25,{fontSize:14,bold:true,color:C.text,align:'center'});
}

// 8 close
{
 const s=pptx.addSlide('MASTER');
 s.addShape(S.ellipse,{x:8.55,y:.55,w:4.4,h:4.4,fill:{color:C.purple,transparency:91},line:{color:C.purple,transparency:100}});
 text(s,'OMNIDECODER',.68,1.1,5.4,.25,{fontSize:10,color:C.cyan,bold:true,charSpacing:3});
 text(s,'A clearer path\nthrough hidden data.',.68,1.63,7,1.1,{fontSize:34,bold:true});
 text(s,'Forensic decoding should be fast, evidence-led, and approachable — whether the signal is invisible text, malformed padding, layered encoding, or a suspicious hash.',.7,3.05,6.3,.7,{fontSize:14,color:C.muted});
 box(s,.68,4.45,6.0,.75,C.panel2,C.cyan); text(s,'Run locally: npm start  →  http://localhost:3000',.95,4.68,5.45,.18,{fontSize:11,bold:true,color:C.cyan});
 text(s,'Thank you',.7,5.85,3.5,.34,{fontSize:20,bold:true});
}

pptx.writeFile({ fileName: 'OmniDecoder_Project_Deck.pptx' });
