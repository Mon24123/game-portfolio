const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
const esbuild=require('esbuild');
const qa=process.env.GAME_QA_MODULES||path.dirname(path.dirname(require.resolve('react/package.json')));
const React=require(path.join(qa,'react'));
const {create,act}=require(path.join(qa,'react-test-renderer'));
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
esbuild.buildSync({entryPoints:['src/Game.tsx'],bundle:true,platform:'node',format:'cjs',jsx:'automatic',alias:{'react':path.join(qa,'react')},outfile:'/tmp/game-flow-component.cjs',external:[path.join(qa,'react'),path.join(qa,'react/jsx-runtime')]});
const Game=require('/tmp/game-flow-component.cjs').default;
const txt=n=>typeof n==='string'?n:(n?.children||[]).map(txt).join('');
let r;
const click=async(label)=>{const b=r.root.findAllByType('button').find(b=>(txt(b).includes(label)||b.props['aria-label']===label));assert.ok(b,'Missing button: '+label);assert.ok(!b.props.disabled,'Disabled: '+label);await act(()=>b.props.onClick());};
const assertText=s=>assert.ok(txt(r.toJSON()).replace(/\s+/g,'').includes(s.replace(/\s+/g,'')),'Missing text: '+s);
const open=async(role='财务')=>{await act(()=>{r=create(React.createElement(Game))});await act(()=>r.root.findByType('input').props.onChange({target:{value:'测试玩家'}}));await click(role);await click('签下合伙人协议');await click('明白，开始决策');};
const report=[];
(async()=>{
 await open();
 const choices=['合伙人共同垫付','停服抢修','提出阶段对赌','缩小范围','加薪留人','改做用户授权计划','请第三方审计','保持独立','主动申请分期','诚实重谈'];
 for(let i=0;i<choices.length;i++){
  await click(choices[i]);await click('紧急贷款');await click('签字并承担后果');
  if(i<9){assertText(`第${i+1}轮结算`);await click(`进入第 ${i+2} 轮`);}else{assertText('第30天最终结算');assertText('存活');}
  report.push({round:i+1,choice:choices[i],result:'passed'});
 }
 await click('同一角色再来一局');assertText('五天后发工资');assertText('60');
 await click('返回角色选择');assert.ok(r.root.findByType('input'));
 await act(()=>r.unmount());
 // Reject signing without both choices and verify an opposed signer blocks progress.
 await open('市场');
 const sign=()=>r.root.findAllByType('button').find(b=>(b.props.className||'').includes('sign-button'));
 assert.equal(sign().props.disabled,true);await click('延期发工资');await click('制造爆点');assert.equal(sign().props.disabled,true);assertText('拒签');await click('诚实增长');assert.equal(sign().props.disabled,false);await click('签字并承担后果');assertText('第1轮结算');await act(()=>r.unmount());
 // Early insolvency is an ending, and restarting does not preserve depleted metrics.
 await open('技术');
 for(let i=0;i<10;i++){
  const choicesNow=r.root.findAllByType('button').filter(b=>(b.props.className||'').includes('choice-card'));
  let accepted=false;
  for(const choice of choicesNow){await act(()=>choice.props.onClick());await click('公开真实风险');if(!sign().props.disabled){accepted=true;break;}}
  assert.ok(accepted,'No available legal action');await click('签字并承担后果');
  if(txt(r.toJSON()).includes('提前结算')){assertText('破产');report.push({earlyFailure:'passed'});break;}
  if(i<9)await click(`进入第 ${i+2} 轮`);
 }
 await act(()=>r.unmount());
 fs.writeFileSync('/tmp/game-flow-results.json',JSON.stringify({tenRounds:report,restart:'passed',refusalAndPersuasion:'passed'},null,2));
 console.log(JSON.stringify(report));
})().catch(e=>{console.error(e);process.exitCode=1;});
