"use client";
/* eslint-disable @next/next/no-img-element */

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { buildHealthSummary, buildJudgeEvidence, type HealthDataset } from "../lib/health-engine";
import { importLocalHealthFile } from "../lib/apple-health-import";
import { safeDemoData } from "../lib/sample-data";

type View = "home" | "results" | "upcoming" | "protocol" | "supplements" | "profile" | "labs";

const navItems: Array<{ id: View; label: string; icon: string }> = [
  { id: "results", label: "الفحوصات الماضية", icon: "⌁" },
  { id: "upcoming", label: "الفحوصات القادمة", icon: "⚗" },
  { id: "protocol", label: "البروتوكول", icon: "▤" },
  { id: "supplements", label: "جدول المكملات", icon: "✦" },
  { id: "profile", label: "الملف الطبي", icon: "♡" },
  { id: "labs", label: "المختبرات", icon: "⚗" },
];

const upcomingTests = [
  { priority: "أساسي", type: "مركز متخصص", test: "تخطيط القلب أثناء الراحة", en: "12-lead ECG", prep: "حسب تعليمات المركز", reason: "توصيف النظم قبل العودة إلى الشدة العالية" },
  { priority: "أساسي", type: "مركز متخصص", test: "اختبار الجهد القلبي", en: "Exercise ECG", prep: "ملابس رياضية وقائمة الأدوية", reason: "مناقشة النبض أثناء الهرولة وحدود الشدة الآمنة" },
  { priority: "متابعة", type: "مختبر", test: "حزمة الدهون", en: "Lipid panel", prep: "وفق تعليمات المختبر", reason: "مقارنة الاتجاه تحت ظروف متشابهة" },
  { priority: "دوري", type: "مختبر", test: "فيتامين د", en: "Vitamin D", prep: "لا تحضير خاص", reason: "متابعة الاتجاه والجرعة المسجلة مع المختص" },
];

const protocolCards = [
  ["الأساس اليومي", "غذاء متوازن يدعم الحركة والوزن دون حمية قاسية.", "بروتين وألياف وخضار، مع وضع الكربوهيدرات حول التدريب عند الحاجة."],
  ["قبل التمرين", "وجبة خفيفة مناسبة قبل الحصة الأطول أو الأشد.", "الهدف دعم الأداء دون تحويل الإرشاد العام إلى وصفة علاجية."],
  ["بعد التمرين", "بروتين وغذاء كامل خلال فترة التعافي.", "الاحتياج الفردي يحدده المختص وفق الهدف والحالة الصحية."],
  ["أيام الراحة", "التركيز على جودة الطعام وتقليل السكريات المركزة.", "لا تُلغى مجموعات غذائية كاملة دون سبب سريري."],
  ["روتين يومي", "نوم منتظم وحركة موزعة على اليوم.", "الرسوم تجعل التقدم مرئيًا وتحفز الاستمرار."],
  ["خفض الدهون المشبعة", "الاستفادة من السمك وزيت الزيتون والمكسرات.", "تُراجع النتائج ضمن عوامل الخطورة الكاملة."],
  ["مراجعة أسبوعية", "متوسط سبعة أيام أهم من رقم منفرد.", "الوزن والحركة والنوم تُقرأ كاتجاهات لا كأحكام."],
  ["قاعدة التنفيذ", "الأداء والوزن يتحسنان بالتعديل التدريجي.", "لا تغيير دوائي أو مكمل تلقائي داخل التطبيق."],
];

const labDirectory = [
  ["مختبرات ألفا الطبية", "تحاليل ووحدات مخبرية", "A"],
  ["مختبرات البرج الطبية", "تحاليل ووحدات مخبرية", "B"],
  ["مجمع سلامات الطبي", "خدمات طبية ومخبرية", "S"],
  ["مختبرات دلتا الطبية", "تحاليل ووحدات مخبرية", "D"],
  ["مختبرات ثقة الطبية", "تحاليل وخدمات مخبرية", "T"],
  ["مختبرات وريد الطبية", "مصدر فحوصات تجريبية", "W"],
  ["منصة لابك", "خدمات وحجوزات مخبرية", "L"],
  ["السعودي الألماني — حائل", "مستشفى وخدمات تشخيصية", "H"],
];

function CanvasChart({ values, labels, color, title }: { values: number[]; labels: string[]; color: string; title: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.max(320, Math.round(rect.width * ratio));
      canvas.height = Math.max(125, Math.round(rect.height * ratio));
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.scale(ratio, ratio);
      const width = rect.width;
      const height = rect.height;
      const pad = { top: 10, right: 12, bottom: 24, left: 36 };
      const min = Math.min(...values);
      const max = Math.max(...values);
      const spread = Math.max(max - min, 1);
      ctx.clearRect(0, 0, width, height);
      ctx.strokeStyle = "rgba(207,250,254,.13)";
      ctx.lineWidth = 1;
      for (let index = 0; index < 4; index += 1) {
        const y = pad.top + ((height - pad.top - pad.bottom) / 3) * index;
        ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(width - pad.right, y); ctx.stroke();
      }
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      values.forEach((value, index) => {
        const x = pad.left + (index / Math.max(values.length - 1, 1)) * (width - pad.left - pad.right);
        const y = pad.top + (1 - (value - min) / spread) * (height - pad.top - pad.bottom);
        if (index === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.fillStyle = "#8fa39e";
      ctx.font = "9px Cairo, sans-serif";
      ctx.textAlign = "center";
      if (labels.length) {
        ctx.fillText(labels[0], pad.left + 18, height - 7);
        ctx.fillText(labels.at(-1) ?? "", width - pad.right - 18, height - 7);
      }
      ctx.textAlign = "left";
      ctx.fillText(max.toFixed(max < 20 ? 1 : 0), 3, pad.top + 4);
      ctx.fillText(min.toFixed(min < 20 ? 1 : 0), 3, height - pad.bottom + 3);
    };
    draw();
    window.addEventListener("resize", draw);
    return () => window.removeEventListener("resize", draw);
  }, [color, labels, values]);
  return <canvas ref={canvasRef} role="img" aria-label={title} />;
}

function PageHeader({ title, description, onHome }: { title: string; description: string; onHome: () => void }) {
  return (
    <div className="page-head">
      <div><h2>{title}</h2><p>{description}</p></div>
      <button type="button" onClick={onHome}>العودة للرئيسية</button>
    </div>
  );
}

export default function Home() {
  const [view, setView] = useState<View>("home");
  const [dataset, setDataset] = useState<HealthDataset>(safeDemoData);
  const [activityOpen, setActivityOpen] = useState(false);
  const [range, setRange] = useState("30 يومًا");
  const [supplementGroup, setSupplementGroup] = useState("الكل");
  const [search, setSearch] = useState("");
  const [reportTopics, setReportTopics] = useState(["cardiac"]);
  const [notice, setNotice] = useState("العينة الاصطناعية جاهزة — لا توجد بيانات شخصية.");
  const fileInput = useRef<HTMLInputElement>(null);

  const summary = useMemo(() => buildHealthSummary(dataset), [dataset]);
  const evidence = useMemo(() => buildJudgeEvidence(dataset, "en"), [dataset]);
  const reviewLabs = dataset.labs.filter((lab) => lab.status !== "good");
  const groups = ["الكل", ...Array.from(new Set(dataset.supplements.map((item) => item.group)))];
  const filteredSupplements = dataset.supplements.filter((item) =>
    (supplementGroup === "الكل" || item.group === supplementGroup) &&
    `${item.name} ${item.purpose}`.toLowerCase().includes(search.toLowerCase()),
  );

  const importFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const candidate = await importLocalHealthFile(file, safeDemoData);
      setDataset(candidate);
      setNotice(`تمت معالجة ${file.name} محليًا داخل المتصفح فقط.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "تعذر قراءة الملف.");
    } finally {
      event.target.value = "";
    }
  };

  const toggleTopic = (topic: string) => setReportTopics((current) => current.includes(topic) ? current.filter((item) => item !== topic) : [...current, topic]);
  const showHome = () => setView("home");
  const dailyLabels = dataset.daily.map((day) => day.date);
  const chartSets = [
    ["نبضات القلب", "متوسط النبض العام لكل يوم", dataset.daily.map((day) => day.restingHeartRate + 24), "#ef4444"],
    ["مدة النوم", "الساعات المسجلة لكل ليلة", dataset.daily.map((day) => day.sleep), "#a78bfa"],
    ["الخطوات اليومية المقطوعة", "تُعرض الأيام ذات السجل الفعلي فقط", dataset.daily.map((day) => day.steps), "#22c55e"],
    ["نبض القلب أثناء الراحة", "اتجاه شخصي وليس حدًا تشخيصيًا", dataset.daily.map((day) => day.restingHeartRate), "#ec4899"],
    ["مسافة التمارين المقطوعة", "مسافة التمارين التقديرية بالكيلومتر", dataset.daily.map((day) => Number((day.workout / 8).toFixed(1))), "#22d3ee"],
    ["مدة التمارين", "الدقائق المسجلة فعليًا", dataset.daily.map((day) => day.workout), "#34d399"],
    ["وتيرة الجري (Pace)", "دقيقة لكل كيلومتر في الجلسات المسجلة", dataset.daily.map((day) => Number((11 - Math.min(day.workout, 40) / 12).toFixed(1))), "#fbbf24"],
    ["نبض القلب أثناء الجري", "متوسط النبض في فترات الهرولة التجريبية", dataset.daily.map((day) => 148 + Math.round(day.workout * .7)), "#fb7185"],
  ] as Array<[string, string, number[], string]>;

  return (
    <main className="app-shell">
      <section className="app-frame" aria-label="نسخة المسابقة من مشروع صحة">
        <header className="site-header">
          <div className="brand-lockup"><div className="brand-icon">⚗</div><div><h1>صــحــة</h1><p>لوحة متابعة صحية — نسخة مسابقة آمنة</p></div></div>
          <div className="header-actions">
            <span className="safe-pill">● بيانات اصطناعية</span>
            <button type="button" onClick={() => fileInput.current?.click()}>استيراد Apple Health ZIP</button>
            <input ref={fileInput} hidden type="file" accept="application/zip,.zip,application/json,.json" onChange={importFile} />
          </div>
        </header>

        <section className="page-body" aria-live="polite">
          {view === "home" && (
            <div className="home-view">
              <div className="stats-strip" aria-label="ملخص المشروع">
                {[
                  [dataset.labs.length * 3, "الفحوصات السابقة", ""],
                  [upcomingTests.length, "الفحوصات القادمة", ""],
                  [dataset.supplements.length + 4, "مكمّلات", ""],
                  [dataset.supplements.length, "مكمّل نشط", ""],
                  [reviewLabs.length, "قيم تحتاج متابعة", "warn"],
                ].map(([value, label, className]) => <div className={`stat-box ${className}`} key={String(label)}><b>{value}</b><span>{label}</span></div>)}
              </div>

              <nav className="project-banner" aria-label="صفحات مشروع صحة">
                {navItems.map((item) => (
                  <button type="button" className="project-link" key={item.id} onClick={() => setView(item.id)}>
                    <span className="project-icon">{item.icon}</span><span>{item.label}</span>
                  </button>
                ))}
                <button type="button" className="project-link health-open" onClick={() => setActivityOpen(true)}><span className="project-icon">⌁</span><span>النشاط</span></button>
              </nav>

              <div className="overview-grid">
                <div className="priority-column">
                  <article className="overview-card priorities">
                    <h2>الأولويات الحالية <small>من العينة الاصطناعية</small></h2>
                    <div className="priority-list">
                      {summary.priorities.slice(0, 3).map((item) => <div className="priority-item" key={item.title}><b>{item.title}</b><span>{item.detail}</span><small>{item.source}</small></div>)}
                      <div className="priority-item"><b>الحركة والنوم — متابعة أسبوعية</b><span>تُعرض الاتجاهات لتشجيع الرياضة والاهتمام بالصحة، لا لإصدار حكم طبي.</span><small>Motivation layer</small></div>
                    </div>
                  </article>
                  <section className="report-builder" aria-label="إعداد ملخص طبي للمختص">
                    <div className="report-intro"><h2>ملخص طبي للمختص</h2><p>حدد موضوع التقرير. المخرجات باللغة الإنجليزية ومهيأة للطباعة أو الحفظ PDF.</p></div>
                    <div className="report-options">
                      {[["cardiac","القلب","Cardiology"],["labs","الفحوصات","Internal Medicine"],["supplements","المكملات","Clinical Pharmacy"],["activity","الرياضة","Sports Medicine"],["sleep","النوم","Sleep Medicine"]].map(([id, ar, en]) => (
                        <label className="report-option" key={id}><input type="checkbox" checked={reportTopics.includes(id)} onChange={() => toggleTopic(id)} /><span><b>{ar}</b><small>{en}</small></span></label>
                      ))}
                    </div>
                    <div className="report-action"><span>{reportTopics.length ? `${reportTopics.length} موضوع محدد` : "اختر موضوعًا"}</span><button type="button" onClick={() => window.print()}>إعداد وطباعة التقرير</button><a href="/samples/sihha-synthetic-cardiology-brief.pdf" download>تقرير القلب PDF</a></div>
                  </section>
                </div>
                <article className="overview-card goals-card">
                  <h2>الأهداف الشخصية <small>آخر 7 أيام</small></h2>
                  <div className="goals-list">
                    <div className="goal-item"><span><b>الخطوات اليومية</b><small>الهدف: {dataset.goals.steps.toLocaleString("en-US")} خطوة</small><small>المتوسط الحالي: {summary.averageSteps.toLocaleString("en-US")} خطوة</small></span><em>{summary.averageSteps >= dataset.goals.steps ? "ضمن الهدف" : "دون الهدف"}</em></div>
                    <div className="goal-item"><span><b>مدة النوم</b><small>الهدف: {dataset.goals.sleep} ساعات</small><small>المتوسط الحالي: {summary.averageSleep.toFixed(1)} ساعة</small></span><em>{summary.averageSleep >= dataset.goals.sleep ? "ضمن الهدف" : "دون الهدف"}</em></div>
                    <div className="goal-item"><span><b>دقائق التمرين الأسبوعية</b><small>الهدف: {dataset.goals.workoutMinutes} دقيقة</small><small>المجموع الحالي: {summary.workoutMinutes} دقيقة</small></span><em>{summary.workoutMinutes >= dataset.goals.workoutMinutes ? "ضمن الهدف" : "دون الهدف"}</em></div>
                  </div>
                  <div className="monitoring-panel"><b>نبض الراحة: {dataset.daily.at(-1)?.restingHeartRate} bpm</b><span>مؤشر للمراقبة وليس هدفًا تشخيصيًا</span><small>{notice}</small></div>
                </article>
              </div>
            </div>
          )}

          {view === "results" && (
            <div className="subpage results-page"><PageHeader title="نتائج الفحوصات الماضية" description="عرض موحّد لاتجاهات تجريبية مع إبراز القيم التي تستحق سؤالًا للمختص." onHome={showHome} />
              <div className="summary-cards"><div><span>إجمالي النتائج</span><b>{dataset.labs.length * 3}</b><small>3 تواريخ تجريبية</small></div><div><span>ضمن المرجع</span><b>{dataset.labs.filter((x)=>x.status==="good").length}</b><small>وفق المرجع المعروض</small></div><div><span>للمتابعة</span><b>{dataset.labs.filter((x)=>x.status==="watch").length}</b><small>اتجاه يحتاج سياقًا</small></div><div><span>للمراجعة</span><b>{dataset.labs.filter((x)=>x.status==="review").length}</b><small>جهّز سؤالًا للمختص</small></div></div>
              <div className="subpage-scroll"><section className="flagged-section"><h3>القيم التي تستحق المتابعة <small>آخر تاريخ تجريبي: يوليو 2026</small></h3><div className="flagged-grid">{reviewLabs.map((lab)=><article key={lab.id}><span>{lab.statusLabel}</span><h4>{lab.nameAr}</h4><b>{lab.readings.at(-1)?.value} {lab.unit}</b><small>{lab.nameEn} · المرجع {lab.reference}</small><p>{lab.trend}</p></article>)}</div></section>
                <section className="data-table"><div className="data-row head"><span>الفحص</span><span>English</span><span>آخر قراءة</span><span>المرجع</span><span>الاتجاه</span></div>{dataset.labs.map((lab)=><div className="data-row" key={lab.id}><b>{lab.nameAr}</b><span>{lab.nameEn}</span><span>{lab.readings.at(-1)?.value} {lab.unit}</span><span>{lab.reference}</span><span>{lab.trend}</span></div>)}</section></div>
            </div>
          )}

          {view === "upcoming" && (
            <div className="subpage upcoming-page"><PageHeader title="الفحوصات القادمة" description="قائمة تجريبية تنظّم ما يمكن مناقشته مع الطبيب؛ لا تنشئ طلبًا طبيًا تلقائيًا." onHome={showHome} />
              <div className="summary-cards"><div><span>إجمالي المدخل</span><b>{upcomingTests.length}</b><small>للعرض فقط</small></div><div><span>فحوصات مخبرية</span><b>2</b><small>متابعة اتجاهات</small></div><div><span>قلب / مركز متخصص</span><b>2</b><small>ECG واختبار جهد</small></div><div><span>الأولوية</span><b>2</b><small>أساسيان</small></div></div>
              <div className="filter-bar"><span>الكل</span><span>مخبري</span><span>مستشفى / متخصص</span><input aria-label="بحث في الفحوصات القادمة" placeholder="بحث باسم الفحص أو السبب" /></div>
              <div className="subpage-scroll"><section className="data-table upcoming-table"><div className="data-row head"><span>الأولوية</span><span>النوع</span><span>الفحص</span><span>English</span><span>التحضير</span><span>سبب الإدراج</span></div>{upcomingTests.map((item)=><div className="data-row" key={item.en}><b>{item.priority}</b><span>{item.type}</span><strong>{item.test}</strong><span>{item.en}</span><span>{item.prep}</span><span>{item.reason}</span></div>)}</section></div>
            </div>
          )}

          {view === "protocol" && (
            <div className="subpage protocol-page"><PageHeader title="البروتوكول المعتمد: الرياضة، الوزن، القلب" description="خطة توعوية تجريبية تحافظ على فصل الإرشاد العام عن القرار الطبي." onHome={showHome} />
              <div className="segment-tabs"><span className="active">الغذاء والرياضة</span><span>المكملات</span><span>المتابعة والسلامة</span></div>
              <div className="protocol-grid">{protocolCards.map(([tag,title,body])=><article key={tag}><span>{tag}</span><h3>{title}</h3><p>{body}</p></article>)}</div><div className="source-line">العينة اصطناعية بالكامل · لا تشخيص ولا تغيير دوائي تلقائي · Built with Codex + GPT‑5.6</div>
            </div>
          )}

          {view === "supplements" && (
            <div className="subpage supplements-page"><PageHeader title="جدول المكملات" description="قائمة موحدة تعرض ما سجله المستخدم؛ المجموعة للتنظيم وليست جدول جرعات علاجيًا." onHome={showHome} />
              <div className="supplement-counts"><span>الإجمالي {dataset.supplements.length}</span><span>نشط {dataset.supplements.length}</span><span>مؤقت 0</span><span>متوقف 0</span></div>
              <div className="supplement-filters"><input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="ابحث باسم المكمل..." aria-label="بحث المكملات" /><select value={supplementGroup} onChange={(e)=>setSupplementGroup(e.target.value)} aria-label="مجموعة المكملات">{groups.map((group)=><option key={group}>{group}</option>)}</select>{groups.slice(0,4).map((group)=><button type="button" className={supplementGroup===group?"active":""} onClick={()=>setSupplementGroup(group)} key={group}>{group}</button>)}</div>
              <div className="subpage-scroll"><section className="supplement-table-dark"><div className="supplement-row head"><span>المكمل</span><span>المجموعة</span><span>الحالة</span><span>مرات الطلب</span><span>الفوائد الرئيسية</span><span>دواعي الاستخدام</span><span>ملاحظة للمراجعة</span></div>{filteredSupplements.map((item,index)=><div className="supplement-row" key={item.name}><b>{item.name}<small>{item.dose}</small></b><span>{item.group}</span><em>نشط</em><strong>{index%5+1}</strong><span>{item.purpose}</span><span>{item.purpose}</span><span>{item.caution}</span></div>)}</section></div>
            </div>
          )}

          {view === "profile" && (
            <div className="subpage profile-page"><PageHeader title="الملف الصحي والغذائي" description="ملف اصطناعي يوضح طريقة تنظيم النتائج والخطة دون كشف أي سجل حقيقي." onHome={showHome} />
              <section className="profile-summary"><h3>الصورة المختصرة</h3><div><article><span>القياسات</span><b>نطاق عمري {dataset.profile.ageBand}</b></article><article><span>سكر الدم</span><b>HbA1c تجريبي 5.4%</b></article><article><span>القرار الغذائي</span><b>توازن يدعم الحركة</b></article><article><span>المرحلة الحالية</span><b>تحضير مراجعة قلب</b></article></div></section>
              <div className="profile-content-scroll"><div className="profile-plan"><article><h3>الكربوهيدرات والرياضة</h3><p>توزيع عملي حول التدريب مع متابعة متوسط الحركة الأسبوعي.</p></article><article><h3>البروتين والدهون</h3><p>غذاء كامل ودهون غير مشبعة مع قراءة الاتجاه المخبري.</p></article><article className="alert"><h3>فحوصات القلب</h3><b>ECG + اختبار الجهد</b><p>ساعدت النسخة الخاصة صاحب المشروع على جمع نمط النبض أثناء الهرولة مع الدهون وتحضير تقرير للمختص. العرض العام يعيد الفكرة ببيانات اصطناعية.</p><a href="/samples/sihha-synthetic-cardiology-brief.pdf" download>تنزيل التقرير التجريبي</a></article><article><h3>متابعة مختبرية</h3><p>إعادة قياس الاتجاهات في موعد يحدده الطبيب وتحت ظروف متشابهة.</p></article><article><h3>القيم التي تستحق المتابعة</h3><ul>{reviewLabs.map((lab)=><li key={lab.id}>{lab.nameAr}: {lab.readings.at(-1)?.value} {lab.unit}</li>)}</ul></article><article><h3>مراقبة الأداء</h3><p>الرسوم تحوّل أرقام الساعة إلى دافع مستمر للحركة والاهتمام بالصحة.</p></article></div>
              <section className="cardiac-report-preview"><div className="report-preview-copy"><span>معاينة فعلية من ملف PDF الاصطناعي</span><h3>كيف حوّل «صحة» إشارتين إلى محادثة قلب أوضح؟</h3><p>يعرض التقرير ذروة الهرولة التجريبية، اتجاه LDL، قاعدة التصعيد القابلة للتفسير، وحدود الأمان. وهو يحاكي فائدة التقرير الخاص دون نسخ أي معلومة شخصية.</p><ul><li>Jogging peak: 188 bpm</li><li>LDL trend: 142 → 129 → 116 mg/dL</li><li>Prepare questions — never issue a diagnosis</li></ul><a href="/samples/sihha-synthetic-cardiology-brief.pdf" target="_blank" rel="noreferrer">فتح التقرير الكامل PDF</a></div><a className="pdf-page" href="/samples/sihha-synthetic-cardiology-brief.pdf" target="_blank" rel="noreferrer"><img src="/samples/sihha-synthetic-cardiology-brief-preview.png" alt="الصفحة الأولى من تقرير القلب الاصطناعي، وتعرض سبب المحادثة وقاعدة التصعيد والأسئلة" /></a></section></div>
            </div>
          )}

          {view === "labs" && (
            <div className="subpage labs-page"><PageHeader title="دليل المختبرات والجهات الطبية" description="صفحة مستقلة من مشروع صحة؛ الروابط الخارجية لا تستقبل أي بيانات صحية." onHome={showHome} />
              <section className="directory-intro"><div><h3>الجهات المتاحة</h3><p>روابط مباشرة للحجز أو الاطلاع على الخدمات. فتح الرابط لا يرسل أي بيانات صحية.</p></div><b>{labDirectory.length} جهات</b></section>
              <h3 className="directory-title">المختبرات والمراكز</h3><div className="directory-grid">{labDirectory.map(([name,type,initial])=><article key={name}><div className="lab-avatar">{initial}</div><div><h4>{name}</h4><p>{type}</p></div><span>↗</span></article>)}</div><div className="source-line">مشروع صحة · دليل مستقل للجهات الطبية</div>
            </div>
          )}
        </section>

        <footer><span>آخر تحديث تجريبي: 18 يوليو 2026</span><span>نسخة مسابقة آمنة — لا تحتوي أي سجل طبي حقيقي</span></footer>
      </section>

      {activityOpen && (
        <div className="health-modal open" role="presentation">
          <section className="health-dialog" role="dialog" aria-modal="true" aria-label="لوحة النشاط">
            <div className="health-head"><div className="health-title"><div className="health-title-icon">♥</div><div><h2>لوحة النشاط</h2><p>تحليل ملف Apple Health المضغوط محليًا داخل المتصفح</p></div></div><button type="button" className="health-close" onClick={()=>setActivityOpen(false)} aria-label="إغلاق">×</button></div>
            <div className="health-toolbar"><div className="range-buttons">{["30 يومًا","90 يومًا","سنة","كل الفترة"].map((item)=><button type="button" className={range===item?"active":""} onClick={()=>setRange(item)} key={item}>{item}</button>)}</div><span>{range} · آخر تسجيل {dataset.profile.lastSync}</span><button type="button" onClick={()=>fileInput.current?.click()}>استيراد ملف جديد</button></div>
            <div className="health-kpis"><article><span>متوسط الخطوات</span><b>{summary.averageSteps.toLocaleString("en-US")} خطوة</b><small>{summary.changes.steps>=0?"↑":"↓"} {Math.abs(summary.changes.steps)}% عن البداية</small></article><article><span>متوسط المسافة اليومية</span><b>{(summary.averageSteps*.00072).toFixed(1)} كم</b><small>تقدير من الخطوات</small></article><article><span>متوسط النوم</span><b>{summary.averageSleep.toFixed(1)} س</b><small>{summary.changes.sleep>=0?"↑":"↓"} {Math.abs(summary.changes.sleep)} ساعة</small></article><article><span>نبض الراحة</span><b>{dataset.daily.at(-1)?.restingHeartRate} نبضة</b><small>تغيّر وصفي فقط</small></article><article><span>التمارين</span><b>{summary.workoutMinutes} د</b><small>إجمالي الفترة</small></article><article className="pace"><span>وتيرة الجري (Pace)</span><b>9.1 د/كم</b><small>عينة تجريبية</small></article></div>
            <div className="health-chart-grid">{chartSets.map(([title,subtitle,values,color])=><article className="health-chart-card" key={title}><h3>{title}</h3><p>{subtitle}</p><CanvasChart title={title} values={values} labels={dailyLabels} color={color} /></article>)}</div>
            <div className="health-bottom"><article><h3>مقارنة الفترات</h3><div className="compare-grid"><span><b>{summary.averageSteps.toLocaleString("en-US")}</b>الخطوات — الآن</span><span><b>{summary.changes.steps}%</b>التغير</span><span><b>{summary.averageSleep.toFixed(1)}</b>النوم — الآن</span><span><b>{dataset.daily.at(-1)?.restingHeartRate}</b>نبض الراحة</span></div></article><article><h3>جودة البيانات</h3><div className="quality-badges"><span>جودة الأدلة {summary.evidenceQuality}%</span><span>الخطوات {dataset.daily.length} أيام</span><span>النوم {dataset.daily.length} ليالٍ</span><span>الاستيراد محلي</span></div><p>البيانات التجريبية مكتملة للعرض. البيانات الحقيقية لا تغادر ذاكرة المتصفح.</p></article></div>
            <p className="health-disclaimer">هذه اللوحة لتنظيم وفهم البيانات الشخصية ولا تُعد تشخيصًا طبيًا. قياسات الساعة تحتاج إلى سياق سريري وجهاز مناسب.</p>
          </section>
        </div>
      )}

      <section className="print-report" lang="en" dir="ltr"><pre>{evidence}</pre></section>
    </main>
  );
}
