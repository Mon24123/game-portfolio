"use client";

import { useMemo, useState } from "react";
import type { CSSProperties } from "react";

type MetricKey = "cash" | "product" | "users" | "clients" | "morale" | "reputation" | "debt" | "control" | "trust";
type Metrics = Record<MetricKey, number>;
type Effect = Partial<Record<MetricKey, number>>;
type RoleId = "tech" | "ceo" | "market" | "sales" | "finance";
type Flags = {
  dataSold: boolean;
  ceoRemoved: boolean;
  promisesBroken: number;
  salariesDelayed: boolean;
  systemCovered: boolean;
  acquisitionIntent: boolean;
};
type Choice = { id: string; title: string; desc: string; effect: Effect; signers: string[]; support: string; flags?: Partial<Flags> };
type Crisis = { id: string; day: string; kicker: string; title: string; brief: string; choices: Choice[]; branch?: string };
type Action = { id: string; tag: string; title: string; desc: string; effect: Effect };
type Role = { id: RoleId; short: string; name: string; person: string; equity: number; color: string; power: string; secret: string; stance: string; bottomLine: string; goal: string; actions: Action[] };

const INITIAL_METRICS: Metrics = { cash: 60, product: 3, users: 2, clients: 2, morale: 6, reputation: 5, debt: 2, control: 0, trust: 5 };
const INITIAL_BUDGET = { tech: 2, market: 2, sales: 2, people: 2 };
const INITIAL_FLAGS: Flags = { dataSold: false, ceoRemoved: false, promisesBroken: 0, salariesDelayed: false, systemCovered: false, acquisitionIntent: false };
const INITIAL_RELATIONSHIPS: Record<RoleId, number> = { tech: 5, ceo: 5, market: 5, sales: 5, finance: 5 };

const roles: Role[] = [
  {
    id: "tech", short: "技术", name: "技术合伙人", person: "周宁", equity: 20, color: "#f2ff35",
    power: "所有产品交付承诺都需要你的签字。每局可以否决一次致命交付。",
    secret: "展示给投资人的稳定性数据并不真实：用户与技术债同时过高时，系统会崩溃。",
    stance: "理想派", bottomLine: "绝不主动出售用户数据。", goal: "产品达到8，且士气不低于5。",
    actions: [
      { id: "refactor", tag: "技术", title: "彻夜重构", desc: "技术债 -3｜产品 +1｜士气 -1", effect: { debt: -3, product: 1, morale: -1 } },
      { id: "ship", tag: "技术", title: "灰度上线", desc: "产品 +2｜用户 +1｜技术债 +1", effect: { product: 2, users: 1, debt: 1 } },
      { id: "truth", tag: "情报", title: "公开真实风险", desc: "信任 +2｜声誉 +1｜客户 -1", effect: { trust: 2, reputation: 1, clients: -1 } },
    ],
  },
  {
    id: "ceo", short: "CEO", name: "首席执行官", person: "林越", equity: 30, color: "#ff3326",
    power: "你提出预算草案，表决平票时拥有最终决定权。",
    secret: "投资人已经私下提出：只要你主动离任，融资款今晚就能到账。",
    stance: "控制派", bottomLine: "创始团队期末持股必须超过51%。", goal: "公司存活，且投资人控制力低于6。",
    actions: [
      { id: "roadshow", tag: "融资", title: "最后一次路演", desc: "现金 +18｜控制力 +2｜信任 -1", effect: { cash: 18, control: 2, trust: -1 } },
      { id: "guarantee", tag: "信用", title: "个人担保", desc: "现金 +12｜信任 +1｜声誉 -1", effect: { cash: 12, trust: 1, reputation: -1 } },
      { id: "strategy", tag: "权力", title: "收缩战略", desc: "现金 +6｜士气 -1｜技术债 -1", effect: { cash: 6, morale: -1, debt: -1 } },
    ],
  },
  {
    id: "market", short: "市场", name: "市场合伙人", person: "许妍", equity: 15, color: "#ff6bb5",
    power: "你可以把普通事件包装成增长机会，也能暂时压住一次舆情。",
    secret: "某位零成本主播三轮前刚因争议言论被平台警告。",
    stance: "退出派", bottomLine: "估值必须在第30天前被市场看见。", goal: "用户达到8，声誉不低于4。",
    actions: [
      { id: "viral", tag: "增长", title: "制造爆点", desc: "用户 +3｜声誉 -1｜技术债 +1", effect: { users: 3, reputation: -1, debt: 1 } },
      { id: "pr", tag: "舆情", title: "危机公关", desc: "声誉 +2｜现金 -5", effect: { reputation: 2, cash: -5 } },
      { id: "truthgrowth", tag: "品牌", title: "诚实增长", desc: "用户 +1｜信任 +2｜现金 -3", effect: { users: 1, trust: 2, cash: -3 } },
    ],
  },
  {
    id: "sales", short: "销售", name: "销售合伙人", person: "赵凯", equity: 15, color: "#52d9ff",
    power: "客户真实底价只有你知道；你可以谈判合同金额和交付日期。",
    secret: "最大客户的合同包含一个团队当前绝不可能按期完成的定制功能。",
    stance: "生存派", bottomLine: "必须追回那笔拖欠的尾款。", goal: "客户达到7，现金高于20万元。",
    actions: [
      { id: "collect", tag: "回款", title: "堵门催收", desc: "现金 +16｜客户 -1｜信任 -1", effect: { cash: 16, clients: -1, trust: -1 } },
      { id: "presale", tag: "合同", title: "超前预售", desc: "现金 +12｜客户 +1｜技术债 +2", effect: { cash: 12, clients: 1, debt: 2 } },
      { id: "renegotiate", tag: "谈判", title: "重谈交付期", desc: "产品 +1｜信任 +1｜现金 -2", effect: { product: 1, trust: 1, cash: -2 } },
    ],
  },
  {
    id: "finance", short: "财务", name: "财务与人事", person: "陈薇", equity: 10, color: "#ffad33",
    power: "没有你的签字，资金不能正式支出；每轮由你决定付款顺序。",
    secret: "账上还有一笔未公开的税务欠款，最迟第24天必须处理。",
    stance: "生存派", bottomLine: "不能让工资连续拖欠两轮。", goal: "现金保持为正，士气不低于5。",
    actions: [
      { id: "loan", tag: "现金", title: "紧急贷款", desc: "现金 +20｜控制力 +1｜声誉 -1", effect: { cash: 20, control: 1, reputation: -1 } },
      { id: "cut", tag: "成本", title: "冻结非核心支出", desc: "现金 +8｜士气 -2", effect: { cash: 8, morale: -2 } },
      { id: "openbooks", tag: "信任", title: "公开全部账本", desc: "信任 +3｜声誉 -1", effect: { trust: 3, reputation: -1 } },
    ],
  },
];

const crises: Crisis[] = [
  { id: "payroll", day: "DAY 30", kicker: "工资日警报", title: "五天后发工资，还差20万元。", brief: "财务说，这是最后一次能瞒住员工。口头承诺已经不值钱了。", choices: [
    { id: "bridge", title: "签过桥借款", desc: "先把工资发了，让投资人进入董事会观察席。", effect: { cash: 15, control: 1, trust: -1 }, signers: ["CEO", "财务"], support: "CEO赞成 · 财务犹豫" },
    { id: "delay", title: "延期发工资", desc: "保住现金，但团队会知道公司已经失血。", effect: { cash: 4, morale: -2, reputation: -1 }, flags: { salariesDelayed: true }, signers: ["财务", "技术"], support: "销售赞成 · 技术反对" },
    { id: "founderAdvance", title: "合伙人共同垫付", desc: "不让外人进场，但创始团队必须共同承担。", effect: { cash: 10, morale: 1, trust: 1 }, signers: ["CEO", "财务"], support: "技术赞成 · 财务赞成" },
  ] },
  { id: "server", day: "DAY 27", kicker: "服务器红灯", title: "用户上涨，核心数据库开始报错。", brief: "技术知道这不是偶发故障。再推一次增长，系统可能直接倒下。", choices: [
    { id: "repair", title: "停服抢修", desc: "花钱换安全，同时向客户承认问题。", effect: { cash: -9, debt: -3, product: 1, reputation: 1 }, signers: ["技术", "财务"], support: "技术赞成 · 市场反对" },
    { id: "carry", title: "带病运行", desc: "继续吃流量，把风险留给下一轮。", effect: { users: 2, debt: 2, trust: -1 }, flags: { systemCovered: true }, signers: ["CEO", "市场"], support: "市场赞成 · 财务反对" },
    { id: "closeGrowth", title: "关闭增长入口", desc: "主动放弃新用户，为技术争取一次安静窗口。", effect: { cash: -3, users: -1, product: 1, debt: -2 }, signers: ["技术", "市场"], support: "技术赞成 · 市场反对" },
  ] },
  { id: "coup", day: "DAY 24", kicker: "投资人逼宫", title: "资金今晚到账，条件是更换CEO。", brief: "合同没有写“恶意”，但每个人都看得懂它的意思。", choices: [
    { id: "acceptCoup", title: "接受条款", desc: "公司立刻续命，创始团队失去方向盘。", effect: { cash: 28, control: 3, trust: -1 }, flags: { ceoRemoved: true }, signers: ["财务", "销售"], support: "财务赞成 · CEO反对" },
    { id: "rejectCoup", title: "拒绝逼宫", desc: "保住控制权，用现金和时间继续赌。", effect: { trust: 2, reputation: 1, cash: -3 }, signers: ["CEO", "技术"], support: "CEO赞成 · 财务反对" },
    { id: "milestoneDeal", title: "提出阶段对赌", desc: "先拿一半资金，三轮后用产品数据换剩余筹码。", effect: { cash: 16, control: 1, product: 1 }, signers: ["CEO", "财务"], support: "CEO赞成 · 技术赞成" },
  ] },
  { id: "client", day: "DAY 21", kicker: "大客户上门", title: "预付30万，但功能现在根本做不完。", brief: "销售已经在电话里说了“没问题”。技术刚刚才看到需求。", choices: [
    { id: "custom", title: "签下定制", desc: "拿钱，并把无法兑现的承诺压给技术。", effect: { cash: 18, clients: 2, debt: 2, product: -1, trust: -1 }, flags: { promisesBroken: 1 }, signers: ["销售", "技术"], support: "销售赞成 · 技术反对" },
    { id: "scope", title: "缩小范围", desc: "少拿预付款，换一个能交付的版本。", effect: { cash: 8, clients: 1, product: 1, trust: 1 }, signers: ["销售", "CEO"], support: "技术赞成 · 市场犹豫" },
    { id: "refuseClient", title: "拒绝这位客户", desc: "放弃救命钱，把团队重新拉回自己的产品。", effect: { cash: -3, clients: -1, product: 2, reputation: 1 }, signers: ["CEO", "销售"], support: "技术赞成 · 销售反对" },
  ] },
  { id: "talent", day: "DAY 18", kicker: "核心员工离职", title: "主程要求加薪、期权和一份保证。", brief: "他手里有系统最危险的那部分代码，也知道公司快没钱了。", choices: [
    { id: "retain", title: "加薪留人", desc: "现金更紧，但团队重新相信承诺。", effect: { cash: -8, morale: 2, debt: -1, trust: 1 }, signers: ["技术", "财务"], support: "技术赞成 · 财务犹豫" },
    { id: "replace", title: "让他离开", desc: "短期省钱，技术债与团队恐慌一起上升。", effect: { cash: 4, morale: -2, debt: 2 }, signers: ["CEO", "财务"], support: "财务赞成 · 技术反对" },
    { id: "splitKnowledge", title: "拆分代码权限", desc: "花三天完成知识转移，不承诺加薪也不立刻放人。", effect: { cash: -3, debt: -1, product: 1, trust: -1 }, signers: ["技术", "CEO"], support: "CEO赞成 · 技术犹豫" },
  ] },
  { id: "data", day: "DAY 15", kicker: "数据换现金", title: "渠道愿意高价购买用户行为数据。", brief: "合同合法边缘、现金真实到账。理想与生存第一次正面冲突。", choices: [
    { id: "sellData", title: "出售数据", desc: "拿到救命钱，公司的底线永久改变。", effect: { cash: 20, reputation: -3, trust: -2 }, flags: { dataSold: true }, signers: ["CEO", "市场"], support: "财务赞成 · 技术强烈反对" },
    { id: "protectData", title: "拒绝出售", desc: "失去现金机会，公开写下隐私承诺。", effect: { cash: -2, reputation: 2, trust: 2 }, signers: ["技术", "CEO"], support: "技术赞成 · 销售反对" },
    { id: "consentData", title: "改做用户授权计划", desc: "只出售用户主动授权的数据，钱更少但底线还在。", effect: { cash: 8, reputation: 1, users: -1, trust: 1 }, signers: ["技术", "市场"], support: "技术赞成 · 市场赞成" },
  ] },
  { id: "rumor", day: "DAY 12", kicker: "负面新闻", title: "匿名爆料称公司伪造增长数据。", brief: "市场知道其中一半是真的；公开说明也会暴露更多问题。", choices: [
    { id: "explain", title: "公开复盘", desc: "承认错误，用透明换回一点信任。", effect: { cash: -5, reputation: 2, trust: 2, users: -1 }, signers: ["市场", "CEO"], support: "技术赞成 · 市场犹豫" },
    { id: "bury", title: "压下热搜", desc: "危机暂时消失，但合伙人更不相信彼此。", effect: { cash: -2, reputation: 1, trust: -2 }, signers: ["市场", "财务"], support: "市场赞成 · 技术反对" },
    { id: "audit", title: "请第三方审计", desc: "把账本和增长数据交给外部机构，代价昂贵但可信。", effect: { cash: -8, reputation: 3, trust: 1 }, signers: ["财务", "CEO"], support: "财务赞成 · 市场反对" },
  ] },
  { id: "acquisition", day: "DAY 09", kicker: "收购意向", title: "竞争对手愿意买下公司和整个团队。", brief: "价格不差，但品牌、产品与CEO都不会留下。", choices: [
    { id: "intent", title: "签意向书", desc: "进入尽调，现金压力下降，独立性开始消失。", effect: { cash: 12, control: 2, morale: 1, trust: -1 }, flags: { acquisitionIntent: true }, signers: ["CEO", "销售"], support: "销售赞成 · CEO沉默" },
    { id: "independent", title: "保持独立", desc: "拒绝安全出口，再给公司最后一次机会。", effect: { cash: -5, trust: 2, reputation: 1 }, signers: ["CEO", "技术"], support: "技术赞成 · 财务反对" },
    { id: "buyback", title: "管理层回购", desc: "用仅剩现金赎回部分控制权，换一次真正的独立。", effect: { cash: -10, control: -2, morale: 2, trust: 1 }, signers: ["CEO", "财务"], support: "CEO赞成 · 财务反对" },
  ] },
  { id: "tax", day: "DAY 06", kicker: "旧账到期", title: "未公开的税务欠款今天必须处理。", brief: "财务一直在等一个不会来的好时机。现在所有人都看见了。", choices: [
    { id: "payTax", title: "立刻补缴", desc: "现金受到重击，但公司恢复合规。", effect: { cash: -15, reputation: 2, trust: 1 }, signers: ["财务", "CEO"], support: "CEO赞成 · 销售反对" },
    { id: "delayTax", title: "继续拖延", desc: "保住今天，赌审计不会在明天到来。", effect: { reputation: -2, trust: -2 }, flags: { promisesBroken: 1 }, signers: ["财务", "CEO"], support: "销售赞成 · 技术反对" },
    { id: "taxPlan", title: "主动申请分期", desc: "先付一部分并接受监管，换取合规缓冲期。", effect: { cash: -7, reputation: 1, control: 1 }, signers: ["财务", "CEO"], support: "财务赞成 · CEO赞成" },
  ] },
  { id: "final", day: "DAY 03", kicker: "最后一份协议", title: "关键客户愿意续约，但交付仍然冒险。", brief: "这是活到第30天的门票，也可能是压垮系统的最后一根稻草。", choices: [
    { id: "finalSign", title: "签下全部承诺", desc: "现金与客户大涨，技术债逼近红线。", effect: { cash: 24, clients: 2, debt: 2, trust: -1 }, signers: ["销售", "技术"], support: "销售赞成 · 技术反对" },
    { id: "finalHonest", title: "诚实重谈", desc: "少拿钱，换一份团队能兑现的合同。", effect: { cash: 8, clients: 1, trust: 2, morale: 1 }, signers: ["销售", "CEO"], support: "技术赞成 · 市场反对" },
    { id: "finalDelay", title: "延期上线", desc: "不拿预付款，先把最危险的技术债彻底处理。", effect: { cash: -2, clients: -1, product: 2, debt: -2, trust: 1 }, signers: ["技术", "CEO"], support: "技术赞成 · 销售反对" },
  ] },
];

const branchCrises: Record<string, Crisis> = {
  outage: {
    id: "outage", day: "DAY 21", kicker: "因果事件 / 系统崩溃", branch: "由你在第2轮选择“带病运行”触发",
    title: "核心服务全面宕机，客户正在逐个打电话。", brief: "被推迟的技术风险没有消失，只是挑了最贵的一天回来。",
    choices: [
      { id: "vendorRescue", title: "请外部团队抢修", desc: "用现金买时间，核心架构暂时脱离危险。", effect: { cash: -16, debt: -4, reputation: -1, product: 1 }, signers: ["技术", "财务"], support: "技术赞成 · 财务反对" },
      { id: "hideOutage", title: "伪装成例行维护", desc: "减少当日损失，但第二次谎言会留下证据。", effect: { cash: -3, users: -2, reputation: -3, trust: -2 }, flags: { promisesBroken: 1 }, signers: ["市场", "CEO"], support: "市场赞成 · 技术反对" },
      { id: "compensate", title: "公开故障并赔偿", desc: "现金受损，客户看见公司愿意承担责任。", effect: { cash: -10, users: -1, reputation: 2, trust: 2, debt: -1 }, signers: ["CEO", "财务"], support: "技术赞成 · CEO赞成" },
    ],
  },
  leak: {
    id: "leak", day: "DAY 12", kicker: "因果事件 / 数据泄露", branch: "由你在第6轮选择“出售数据”触发",
    title: "用户发现自己的行为数据出现在广告平台。", brief: "合同还在保密期，截图已经传遍社交网络。每句回应都会成为证据。",
    choices: [
      { id: "notifyUsers", title: "通知用户并开放删除", desc: "承担退款与处理成本，开始修复信任。", effect: { cash: -8, reputation: 1, trust: 2, users: -1 }, signers: ["技术", "市场"], support: "技术赞成 · 市场犹豫" },
      { id: "denyLeak", title: "否认数据来自公司", desc: "把法律风险留给未来，暂时保住合同款。", effect: { cash: 2, reputation: -3, trust: -3 }, flags: { promisesBroken: 1 }, signers: ["CEO", "市场"], support: "销售赞成 · 技术强烈反对" },
      { id: "blameVendor", title: "将责任推给渠道", desc: "终止合作并交出部分证据，双方从此公开交恶。", effect: { cash: -4, reputation: -1, trust: 1, control: 1 }, signers: ["CEO", "财务"], support: "财务赞成 · 市场反对" },
    ],
  },
  wageClaim: {
    id: "wageClaim", day: "DAY 06", kicker: "因果事件 / 劳动仲裁", branch: "由你在第1轮选择“延期发工资”触发",
    title: "三名员工联合申请仲裁，欠薪记录被公开。", brief: "你们当初以为只需要拖三天。现在每个候选人都能搜到这条记录。",
    choices: [
      { id: "payArrears", title: "补发并公开道歉", desc: "现金骤降，但团队终于得到明确交代。", effect: { cash: -14, morale: 3, reputation: 1, trust: 1 }, signers: ["财务", "CEO"], support: "财务赞成 · CEO犹豫" },
      { id: "settlePrivate", title: "私下和解", desc: "用较少现金换保密条款，内部信任继续受损。", effect: { cash: -8, morale: -1, reputation: 1, trust: -1 }, signers: ["财务", "销售"], support: "销售赞成 · 技术反对" },
      { id: "contestClaim", title: "拒绝和解", desc: "保住今天的现金，押上团队与公司的名声。", effect: { cash: -3, morale: -3, reputation: -2, trust: -2 }, signers: ["CEO", "财务"], support: "CEO赞成 · 技术强烈反对" },
    ],
  },
  dueDiligence: {
    id: "dueDiligence", day: "DAY 03", kicker: "因果事件 / 收购尽调", branch: "由你在第8轮签署“收购意向书”触发",
    title: "买方发现技术债、欠款与未兑现的客户承诺。", brief: "他们仍愿意成交，但要求今晚交出完整账本与创始团队控制权。",
    choices: [
      { id: "discloseAll", title: "完整披露风险", desc: "降低成交金额，让最后一份协议经得起追问。", effect: { cash: 10, control: 2, reputation: 1, trust: 2 }, signers: ["财务", "CEO"], support: "财务赞成 · 技术赞成" },
      { id: "hideLiability", title: "隐藏关键负债", desc: "拿到最高报价，把追责风险留给签字人。", effect: { cash: 24, control: 3, trust: -3 }, flags: { promisesBroken: 1 }, signers: ["CEO", "销售"], support: "销售赞成 · 财务反对" },
      { id: "walkAway", title: "终止收购", desc: "放弃安全出口，夺回一点控制权与团队尊严。", effect: { cash: -4, control: -2, morale: 2, trust: 1 }, signers: ["CEO", "技术"], support: "技术赞成 · 销售反对" },
    ],
  },
};

function getCrisis(round: number, flags: Flags) {
  if (round === 4 && flags.systemCovered) return branchCrises.outage;
  if (round === 7 && flags.dataSold) return branchCrises.leak;
  if (round === 9 && flags.salariesDelayed) return branchCrises.wageClaim;
  if (round === 10 && flags.acquisitionIntent) return branchCrises.dueDiligence;
  return crises[Math.min(round - 1, crises.length - 1)];
}

const metricMeta: { key: MetricKey; label: string; suffix: string; inverse?: boolean }[] = [
  { key: "cash", label: "现金", suffix: "万" }, { key: "product", label: "产品", suffix: "/10" },
  { key: "users", label: "用户", suffix: "/10" }, { key: "clients", label: "客户", suffix: "/10" },
  { key: "morale", label: "士气", suffix: "/10" }, { key: "reputation", label: "声誉", suffix: "/10" },
  { key: "debt", label: "技术债", suffix: "/10", inverse: true }, { key: "control", label: "投资人", suffix: "/10", inverse: true },
  { key: "trust", label: "信任", suffix: "/10" },
];

function clampMetrics(metrics: Metrics): Metrics {
  const next = { ...metrics };
  (Object.keys(next) as MetricKey[]).forEach((key) => { next[key] = key === "cash" ? Math.max(0, Math.round(next[key])) : Math.max(0, Math.min(10, Math.round(next[key]))); });
  return next;
}

function withEffect(metrics: Metrics, effect: Effect) {
  const next = { ...metrics };
  (Object.entries(effect) as [MetricKey, number][]).forEach(([key, value]) => { next[key] += value; });
  return next;
}

function sumBudget(budget: typeof INITIAL_BUDGET) { return Object.values(budget).reduce((sum, value) => sum + value, 0); }

function signerDecision(choice: Choice | null, action: Action | null, playerRole: Role, relationships: Record<RoleId, number>, playerName: string) {
  if (!choice) return [];
  const persuasion = Math.min(2, Math.max(0, action?.effect.trust ?? 0));
  return choice.signers.map((short) => {
    const signer = roles.find((item) => item.short === short);
    if (!signer) return { id: short, name: short, accepted: true, reason: "程序签署" };
    if (signer.id === playerRole.id) return { id: signer.id, name: playerName || signer.person, accepted: true, reason: "由你亲自签署" };
    const stronglyOpposed = choice.support.includes(`${short}强烈反对`);
    const opposed = stronglyOpposed || choice.support.includes(`${short}反对`);
    const supported = choice.support.includes(`${short}赞成`);
    const sentiment = stronglyOpposed ? -3 : opposed ? -2 : supported ? 2 : 0;
    const score = relationships[signer.id] + sentiment + persuasion;
    return {
      id: signer.id,
      name: signer.person,
      accepted: score >= 4,
      reason: score >= 4 ? (persuasion > 0 && opposed ? "被你的行动说服" : supported ? "立场一致" : "勉强同意") : "关系不足，拒绝签字",
    };
  });
}

export default function Home() {
  const [started, setStarted] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [roleId, setRoleId] = useState<RoleId>("tech");
  const [helpOpen, setHelpOpen] = useState(false);
  const [metricsOpen, setMetricsOpen] = useState(false);
  const [mobileStep, setMobileStep] = useState<"identity" | "crisis" | "budget" | "action" | "sign">("crisis");
  const [mobileChoiceIndex, setMobileChoiceIndex] = useState(0);
  const [day, setDay] = useState(30);
  const [round, setRound] = useState(1);
  const [metrics, setMetrics] = useState<Metrics>(INITIAL_METRICS);
  const [budget, setBudget] = useState(INITIAL_BUDGET);
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);
  const [selectedActionId, setSelectedActionId] = useState<string | null>(null);
  const [secretOpen, setSecretOpen] = useState(false);
  const [phase, setPhase] = useState<"decision" | "result" | "ended">("decision");
  const [flags, setFlags] = useState<Flags>(INITIAL_FLAGS);
  const [relationships, setRelationships] = useState<Record<RoleId, number>>(INITIAL_RELATIONSHIPS);
  const [history, setHistory] = useState<string[]>([]);
  const [lastResult, setLastResult] = useState<{ round: number; headline: string; detail: string; deltas: Effect; signatures: string } | null>(null);

  const role = roles.find((item) => item.id === roleId) ?? roles[0];
  const crisis = getCrisis(round, flags);
  const choice = crisis.choices.find((item) => item.id === selectedChoiceId) ?? null;
  const action = role.actions.find((item) => item.id === selectedActionId) ?? null;
  const budgetTotal = sumBudget(budget);
  const fixedSpend = 6;
  const approvals = signerDecision(choice, action, role, relationships, playerName.trim());
  const refusedSigners = approvals.filter((item) => !item.accepted);
  const suggestedAction = choice ? role.actions.find((candidate) => signerDecision(choice, candidate, role, relationships, playerName.trim()).every((item) => item.accepted)) ?? null : null;
  const canSign = Boolean(choice && action && refusedSigners.length === 0 && phase === "decision");
  const signButtonLabel = !choice ? "先选择一个危机方案" : !action ? "再选择一项专属行动" : refusedSigners.length > 0 ? `${refusedSigners.map((item) => item.name).join("、")}拒签：先解决分歧` : "签字并承担后果";

  const riskLabel = useMemo(() => {
    if (metrics.cash <= 14) return "现金将在本轮见底";
    if (metrics.debt >= 7 && metrics.users >= 6) return "系统崩溃风险极高";
    if (metrics.morale <= 2) return "团队接近集体离职";
    if (metrics.reputation <= 2) return "市场信用即将归零";
    if (metrics.control >= 6) return "投资人已经取得实质控制";
    return "公司仍在危险边缘";
  }, [metrics]);

  function resetGame(toLobby = false) {
    setDay(30); setRound(1); setMetrics(INITIAL_METRICS); setBudget(INITIAL_BUDGET);
    setSelectedChoiceId(null); setSelectedActionId(null); setSecretOpen(false); setPhase("decision");
    setFlags(INITIAL_FLAGS); setRelationships(INITIAL_RELATIONSHIPS); setHistory([]); setLastResult(null);
    setMobileStep("crisis"); setMobileChoiceIndex(0); setMetricsOpen(false);
    if (toLobby) setStarted(false);
  }

  function adjustBudget(key: keyof typeof INITIAL_BUDGET, delta: number) {
    setBudget((current) => {
      const total = sumBudget(current);
      if (delta > 0 && total >= 12) return current;
      const nextValue = Math.max(0, Math.min(8, current[key] + delta));
      return { ...current, [key]: nextValue };
    });
  }

  function resolveTurn() {
    if (!choice || !action || phase !== "decision") return;
    let next = withEffect(metrics, choice.effect);
    next = withEffect(next, action.effect);
    const budgetEffect: Effect = {
      cash: -(fixedSpend + budgetTotal),
      product: budget.tech >= 8 ? 2 : budget.tech >= 4 ? 1 : 0,
      debt: budget.tech >= 8 ? -1 : 0,
      users: budget.market >= 8 ? 2 : budget.market >= 4 ? 1 : 0,
      clients: budget.sales >= 8 ? 2 : budget.sales >= 4 ? 1 : 0,
      morale: budget.people >= 8 ? 2 : budget.people >= 4 ? 1 : budget.people === 0 ? -1 : 0,
    };
    next = withEffect(next, budgetEffect);

    let incident = crisis.branch ? `${crisis.branch}。这次处理结果已进入董事会记录。` : "本轮所有签字已经进入董事会记录。";
    if (next.users >= 7 && next.debt >= 7) {
      next = withEffect(next, { cash: -12, reputation: -2, trust: -1 });
      incident = "增长压垮系统：宕机额外损失12万元，声誉与信任受损。";
    }
    next = clampMetrics(next);
    const nextFlags: Flags = {
      ...flags,
      ...choice.flags,
      dataSold: flags.dataSold || Boolean(choice.flags?.dataSold),
      ceoRemoved: flags.ceoRemoved || Boolean(choice.flags?.ceoRemoved),
      salariesDelayed: flags.salariesDelayed || Boolean(choice.flags?.salariesDelayed),
      systemCovered: flags.systemCovered || Boolean(choice.flags?.systemCovered),
      acquisitionIntent: flags.acquisitionIntent || Boolean(choice.flags?.acquisitionIntent),
      promisesBroken: flags.promisesBroken + (choice.flags?.promisesBroken ?? 0),
    };
    const nextRelationships = { ...relationships };
    roles.forEach((partner) => {
      if (partner.id === role.id) return;
      const supports = choice.support.includes(`${partner.short}赞成`);
      const opposes = choice.support.includes(`${partner.short}反对`) || choice.support.includes(`${partner.short}强烈反对`);
      const trustRipple = (choice.effect.trust ?? 0) >= 2 ? 1 : (choice.effect.trust ?? 0) <= -2 ? -1 : 0;
      nextRelationships[partner.id] = Math.max(0, Math.min(10, nextRelationships[partner.id] + (supports ? 1 : opposes ? -1 : 0) + trustRipple));
    });
    const nextDay = Math.max(0, day - 3);
    const failure = next.cash <= 0 ? "公司现金归零" : next.morale <= 0 ? "核心团队集体离职" : next.reputation <= 0 ? "市场信用彻底崩塌" : next.debt >= 10 ? "技术债触发致命事故" : "";
    const deltas: Effect = {};
    metricMeta.forEach(({ key }) => { const delta = next[key] - metrics[key]; if (delta !== 0) deltas[key] = delta; });

    setMetrics(next); setFlags(nextFlags); setRelationships(nextRelationships); setDay(nextDay);
    setHistory((items) => [`第${round}轮｜${playerName.trim()}签署：${choice.title} + ${action.title}`, ...items].slice(0, 6));
    setLastResult({
      round,
      headline: failure || (nextDay === 0 ? "最后一天已经结束" : "公司又活过了3天"),
      detail: incident,
      deltas,
      signatures: approvals.map((item) => `${item.name}：${item.reason}`).join(" · "),
    });

    if (failure || nextDay === 0) {
      setPhase("ended");
    } else {
      setRound((value) => value + 1); setPhase("result");
    }
  }

  function continueGame() {
    setSelectedChoiceId(null); setSelectedActionId(null); setBudget(INITIAL_BUDGET); setMobileStep("crisis"); setMobileChoiceIndex(0); setPhase("decision");
  }

  const companySurvived = day === 0 && metrics.cash > 0 && metrics.morale > 0 && metrics.reputation > 0 && metrics.debt < 10;
  const goalDone = role.id === "tech" ? metrics.product >= 8 && metrics.morale >= 5 && !flags.dataSold
    : role.id === "ceo" ? companySurvived && metrics.control < 6
    : role.id === "market" ? metrics.users >= 8 && metrics.reputation >= 4
    : role.id === "sales" ? metrics.clients >= 7 && metrics.cash >= 20
    : metrics.cash > 0 && metrics.morale >= 5;
  const score = (companySurvived ? 5 : -3) + (goalDone ? 4 : 0) + Math.max(-3, Math.min(3, metrics.trust - 5)) + (flags.dataSold && role.id === "tech" ? -4 : 0);
  const endingTitle = !companySurvived ? "通知：公司今日停止运营" : metrics.control >= 6 ? "公司活了下来。\n但它已经不再属于你们" : metrics.cash >= 25 && metrics.product >= 7 ? "你们活过了第30天" : "公司勉强续命";

  if (!started) {
    return <main className="lobby-shell">
      <div className="noise" aria-hidden="true" />
      <section className="notice-hero">
        <p className="notice-tag">内部紧急通知 / 仅限合伙人</p>
        <h1><span>通知：</span>公司还有<br />三十天倒闭</h1>
        <p className="notice-copy">技术藏着系统风险，财务藏着税务欠款，CEO 藏着一份离任条件。公司只剩30天，你会保住公司，还是先保住自己？</p>
        <div className="mode-row" aria-label="游戏模式">
          <button className="mode-card active" aria-pressed="true"><span>现在可玩</span><b>单机剧情</b><small>你与4位电脑合伙人谈判</small></button>
          
        </div>
        <label className="name-field"><span>协议签署人姓名</span><input value={playerName} onChange={(event) => setPlayerName(event.target.value.slice(0, 12))} placeholder="输入你的名字" autoComplete="name" maxLength={12} /><small>这个名字会出现在每一份协议和最终结局上</small></label>
        <p className="picker-title">选择你要扮演的合伙人</p>
        <div className="role-picker" aria-label="选择角色">
          {roles.map((item) => <button key={item.id} className={`role-pick ${item.id === roleId ? "active" : ""}`} style={{ "--role-color": item.color } as CSSProperties} onClick={() => setRoleId(item.id)} aria-pressed={item.id === roleId}>
            <span>{item.name}</span><b>{item.short}</b><small>{item.equity}% 股权 · 原席位 {item.person}</small>
          </button>)}
        </div>
        <div className="selected-role"><span>{playerName.trim() || "你"}的权力</span><b>{role.power}</b></div>
        <div className="lobby-actions"><button className="start-button" disabled={!playerName.trim()} onClick={() => { resetGame(false); setStarted(true); setHelpOpen(true); }}>{playerName.trim() ? `${playerName.trim()}，签下合伙人协议 →` : "先写下你的名字"}</button><button className="rules-button" onClick={() => setHelpOpen(true)}>先看玩法说明</button></div>
        <p className="lobby-foot">单机剧情版 · 10轮 · 每轮3个方案 · 早期决定会触发后续因果事件</p>
      </section>
      <a className="portfolio-back" href="../">返回作品集</a>
      {helpOpen && <HelpDialog onClose={() => setHelpOpen(false)} />}
    </main>;
  }

  return <main className="game-shell" style={{ "--role-color": role.color } as CSSProperties}>
    <div className="noise" aria-hidden="true" />
    <header className="topbar">
      <button className="brand-button" onClick={() => resetGame(true)} aria-label="返回角色选择"><span>现金流只剩</span><strong>{day}天</strong></button>
      <div className="round-track"><span>DAY {Math.min(30, 30 - day + 1)}</span><div><i style={{ width: `${((30 - day) / 30) * 100}%` }} /></div><b>第 {round}/10 轮</b></div>
      <div className="top-actions"><a className="back-link" href="../">作品集</a><button className="ghost-button help-button" onClick={() => setHelpOpen(true)}>怎么玩</button><button className="ghost-button reset-button" onClick={() => resetGame(false)}>重新开局</button></div>
    </header>

    <section className="status-rail" aria-label="公司指标">
      {metricMeta.map(({ key, ...item }) => <Metric key={key} {...item} value={metrics[key]} />)}
      <button className="metrics-button" onClick={() => setMetricsOpen(true)}>全部<br />指标</button>
    </section>

    <nav className="mobile-tabs" aria-label="游戏步骤">
      {(["identity", "crisis", "budget", "action", "sign"] as const).map((step, index) => {
        const labels = { identity: "身份", crisis: "危机", budget: "预算", action: "行动", sign: "签字" };
        return <button key={step} className={mobileStep === step ? "active" : ""} onClick={() => setMobileStep(step)}><span>{index + 1}</span>{labels[step]}{step === "sign" && refusedSigners.length > 0 ? <b>!</b> : null}</button>;
      })}
    </nav>

    <section className={`game-grid mobile-step-${mobileStep}`}>
      <aside className="identity-panel">
        <div className="role-index">{String(roles.findIndex((item) => item.id === role.id) + 1).padStart(2, "0")}</div>
        <p className="eyebrow">你的公开身份</p><h1>{role.name}<br /><em>{playerName.trim()}</em></h1>
        <div className="equity"><span>个人持股</span><b>{role.equity}%</b></div>
        <p className="role-power">{role.power}</p>
        <button className="secret-button" onClick={() => setSecretOpen(!secretOpen)} aria-expanded={secretOpen}>{secretOpen ? "封存秘密档案" : "撕开秘密档案"}</button>
        {secretOpen && <div className="secret-note"><span>秘密立场 / {role.stance}</span><b>{role.secret}</b><p><strong>底线</strong>{role.bottomLine}</p><p><strong>个人目标</strong>{role.goal}</p><button className="secret-close" onClick={() => setSecretOpen(false)}>收起档案</button></div>}
        <div className="partner-list"><span>合伙人关系</span>{roles.filter((item) => item.id !== role.id).map((item) => <div key={item.id}><i style={{ background: item.color }} />{item.short} · {item.person}<b>{item.equity}% · {relationships[item.id]}/10</b></div>)}</div>
        <button className="mobile-next" onClick={() => setMobileStep("crisis")}>下一步：处理危机 →</button>
      </aside>

      <section className="board" aria-label="本轮公共危机">
        <div className="board-topline"><span>{crisis.day}</span><b>{riskLabel}</b></div>
        {crisis.branch && <div className="branch-alert"><span>因果分支已触发</span><b>{crisis.branch}</b></div>}
        <article className="crisis-card">
          <div className="crisis-kicker"><span>{crisis.kicker}</span><em>第 {round} 号危机</em></div>
          <h2>{crisis.title}</h2><p>{crisis.brief}</p>
          <div className="mobile-choice-pager" aria-label="切换危机方案">{crisis.choices.map((item, index) => <button key={item.id} className={mobileChoiceIndex === index ? "active" : ""} onClick={() => setMobileChoiceIndex(index)}>方案 {index + 1}{selectedChoiceId === item.id ? " · 已选" : ""}</button>)}</div>
          <div className="crisis-choices">
            {crisis.choices.map((item, index) => <button key={item.id} className={`choice-card ${mobileChoiceIndex === index ? "mobile-current" : ""} ${selectedChoiceId === item.id ? "selected" : ""}`} onClick={() => { setSelectedChoiceId(item.id); setMobileChoiceIndex(index); }} aria-pressed={selectedChoiceId === item.id}>
              <span>方案 {index + 1}</span><b>{item.title}</b><p>{item.desc}</p><small>{item.support}</small><em>需要 {item.signers.join(" + ")} 签字</em>
            </button>)}
          </div>
        </article>
        <button className="mobile-next crisis-next" disabled={!choice} onClick={() => setMobileStep("budget")}>{choice ? "下一步：分配预算 →" : "先选定一个方案"}</button>

        <section className="budget-panel" aria-labelledby="budget-title">
          <div className="section-heading"><div><span>本轮预算</span><h3 id="budget-title">12万以内，你要保谁？</h3></div><b className={budgetTotal > metrics.cash ? "over" : ""}>{budgetTotal}<small>/12万</small></b></div>
          <div className="budget-grid">
            {(["tech", "market", "sales", "people"] as const).map((key) => {
              const labels = { tech: "技术", market: "市场", sales: "销售", people: "团队" };
              return <div className="budget-control" key={key}><span>{labels[key]}</span><button onClick={() => adjustBudget(key, -1)} aria-label={`减少${labels[key]}预算`}>−</button><b>{budget[key]}</b><button onClick={() => adjustBudget(key, 1)} aria-label={`增加${labels[key]}预算`} disabled={budgetTotal >= 12}>＋</button></div>;
            })}
          </div>
          <p>固定账单 6万 + 部门预算 {budgetTotal}万 = 本轮至少支出 <b>{fixedSpend + budgetTotal}万</b></p>
          <button className="mobile-next" onClick={() => setMobileStep("action")}>下一步：行动与签字 →</button>
        </section>
      </section>

      <aside className="decision-panel">
        <p className="eyebrow">你的专属行动</p><h2>第二个签字<br />留给谁？</h2>
        <div className="action-list">
          {role.actions.map((item) => <button key={item.id} className={`action-card ${selectedActionId === item.id ? "selected" : ""}`} onClick={() => setSelectedActionId(item.id)} aria-pressed={selectedActionId === item.id}>
            <span>{item.tag}</span><b>{item.title}</b><small>{item.desc}</small>
          </button>)}
        </div>
        <button className="mobile-next action-next" disabled={!action} onClick={() => setMobileStep("sign")}>{action ? "下一步：检查签字 →" : "先选择一项专属行动"}</button>
        {choice && <div className="approval-panel"><span>签字人态度</span>{approvals.map((item) => <div key={item.id} className={item.accepted ? "accepted" : "refused"}><b>{item.accepted ? "同意" : "拒签"}</b><p>{item.name}<small>{item.reason}</small></p></div>)}</div>}
        {refusedSigners.length > 0 && <div className="refusal-help"><b>为什么签不了？</b><p>{refusedSigners.map((item) => item.name).join("、")}不认可当前方案。{suggestedAction ? `改选“${suggestedAction.title}”可以获得全部签字。` : "当前行动无法说服对方，请返回“危机”换一个方案。"}</p>{suggestedAction && selectedActionId !== suggestedAction.id ? <button onClick={() => setSelectedActionId(suggestedAction.id)}>改选「{suggestedAction.title}」</button> : <button onClick={() => setMobileStep("crisis")}>返回更换方案</button>}</div>}
        <div className="signature-slots"><span>本轮必须完成两项选择</span><div><i className={choice ? "used" : ""}>1</i><i className={action ? "used" : ""}>2</i></div><small>① {choice ? choice.title : "还没选择危机方案"}<br />② {action ? action.title : "还没选择专属行动"}</small></div>
        <button className="sign-button" onClick={resolveTurn} disabled={!canSign}><span>{signButtonLabel}</span><b>{playerName.trim()} · 亲笔签名 ✕</b></button>
        <p className="warning">{canSign ? "两项选择完整，所需签字人均已同意。点击后立即结算。" : "按上方提示完成缺少的步骤。你可以随时点右上角“怎么玩”。"}</p>
        {history.length > 0 && <div className="history"><span>最近记录</span>{history.map((item) => <p key={item}>{item}</p>)}</div>}
      </aside>
    </section>

    {phase === "result" && lastResult && <div className="result-layer" role="dialog" aria-modal="true" aria-labelledby="result-title"><div className="result-sheet">
      <p>第 {lastResult.round} 轮结算</p><h2 id="result-title">{lastResult.headline}</h2><span>{lastResult.detail}</span>
      <div className="signature-record"><b>本轮签字记录</b><span>{lastResult.signatures}</span></div>
      <div className="delta-list">{metricMeta.filter(({ key }) => lastResult.deltas[key]).map(({ key, label }) => <div key={key}><span>{label}</span><b className={(lastResult.deltas[key] ?? 0) > 0 ? "plus" : "minus"}>{(lastResult.deltas[key] ?? 0) > 0 ? "+" : ""}{lastResult.deltas[key]}</b></div>)}</div>
      <button className="continue-button" onClick={continueGame}>进入第 {round} 轮 →</button>
    </div></div>}

    {phase === "ended" && <div className="result-layer ending" role="dialog" aria-modal="true" aria-labelledby="ending-title"><div className="ending-sheet">
      <p>{day === 0 ? "第30天最终结算" : `第${round}轮 · 提前结算`} · {playerName.trim()} / {role.short}</p><h2 id="ending-title">{endingTitle}</h2>
      <div className="ending-stats"><div><span>公司结局</span><b>{companySurvived ? "存活" : "破产"}</b></div><div><span>个人目标</span><b>{goalDone ? "完成" : "失败"}</b></div><div><span>个人得分</span><b>{score}</b></div></div>
      <p className="ending-copy">现金 {metrics.cash}万 · 产品 {metrics.product}/10 · 士气 {metrics.morale}/10 · 技术债 {metrics.debt}/10 · 投资人控制力 {metrics.control}/10</p>
      {flags.dataSold && <div className="ending-warning">{companySurvived ? "用户数据已经出售：公司活下来以后，它还是原来的公司吗？" : "用户数据已经出售：现金换来了时间，却没能换来结局。"}</div>}
      <div className="ending-actions"><button onClick={() => resetGame(false)}>同一角色再来一局</button><button onClick={() => resetGame(true)}>换角色</button></div>
    </div></div>}
    {helpOpen && <HelpDialog onClose={() => setHelpOpen(false)} />}
    {metricsOpen && <div className="result-layer metrics-layer" role="dialog" aria-modal="true" aria-labelledby="metrics-title"><div className="metrics-sheet"><p>公司实时仪表盘</p><h2 id="metrics-title">全部指标</h2><div>{metricMeta.map(({ key, ...item }) => <Metric key={key} {...item} value={metrics[key]} />)}</div><button className="continue-button" onClick={() => setMetricsOpen(false)}>看完了</button></div></div>}
  </main>;
}

function HelpDialog({ onClose }: { onClose: () => void }) {
  return <div className="result-layer help-layer" role="dialog" aria-modal="true" aria-labelledby="help-title"><div className="help-sheet">
    <p>新手说明 / 一轮只做四步</p><h2 id="help-title">怎么签字？</h2>
    <ol>
      <li><b>选危机方案</b><span>三个方案选一个。方案会改变公司指标，也可能触发后续剧情。</span></li>
      <li><b>分配预算</b><span>总预算最多12万；固定账单另付6万。</span></li>
      <li><b>选专属行动</b><span>每个角色有三项行动。有些提升信任的行动可以说服反对者。</span></li>
      <li><b>检查签字人</b><span>所有必需签字人都显示“同意”后，红色签字按钮才会亮起。</span></li>
    </ol>
    <div className="help-answer"><b>出现“拒签”怎么办？</b><span>先看红色提示。系统会直接告诉你应该改选哪项行动；如果当前无法说服，就返回危机页换方案。不是故障，是谈判机制。</span></div>
    <button className="continue-button" onClick={onClose}>明白，开始决策</button>
  </div></div>;
}

function Metric({ label, value, suffix, inverse = false }: { label: string; value: number; suffix: string; inverse?: boolean }) {
  const danger = label === "现金" ? value <= 20 : inverse ? value >= 7 : value <= 2;
  return <div className={`metric ${danger ? "danger" : ""}`}><span>{label}</span><b>{value}<small>{suffix}</small></b><i style={{ width: `${label === "现金" ? Math.min(100, (value / 60) * 100) : value * 10}%` }} /></div>;
}
