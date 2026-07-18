"use client";
/* eslint-disable @next/next/no-img-element */

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { buildHealthSummary, buildJudgeEvidence, type HealthDataset } from "../lib/health-engine";
import { importLocalHealthFile } from "../lib/apple-health-import";
import { safeDemoData } from "../lib/sample-data";
import { translateHealthText, type Language } from "../lib/i18n";

type View = "home" | "results" | "upcoming" | "protocol" | "supplements" | "profile" | "labs";

const navItems: Array<{ id: View; ar: string; en: string; icon: string }> = [
  { id: "results", ar: "الفحوصات الماضية", en: "Past tests", icon: "⌁" },
  { id: "upcoming", ar: "الفحوصات القادمة", en: "Upcoming tests", icon: "⚗" },
  { id: "protocol", ar: "البروتوكول", en: "Protocol", icon: "▤" },
  { id: "supplements", ar: "جدول المكملات", en: "Supplements", icon: "✦" },
  { id: "profile", ar: "الملف الطبي", en: "Medical profile", icon: "♡" },
  { id: "labs", ar: "المختبرات", en: "Labs", icon: "⚗" },
];

const upcomingTests = [
  { priorityAr: "أساسي", priorityEn: "Essential", typeAr: "مركز متخصص", typeEn: "Specialist centre", testAr: "تخطيط القلب أثناء الراحة", testEn: "12-lead ECG", prepAr: "حسب تعليمات المركز", prepEn: "Follow centre instructions", reasonAr: "توصيف النظم قبل العودة إلى الشدة العالية", reasonEn: "Characterise rhythm before returning to high intensity" },
  { priorityAr: "أساسي", priorityEn: "Essential", typeAr: "مركز متخصص", typeEn: "Specialist centre", testAr: "اختبار الجهد القلبي", testEn: "Exercise ECG", prepAr: "ملابس رياضية وقائمة الأدوية", prepEn: "Sportswear and medication list", reasonAr: "مناقشة النبض أثناء الهرولة وحدود الشدة الآمنة", reasonEn: "Discuss jogging heart rate and safe intensity limits" },
  { priorityAr: "متابعة", priorityEn: "Follow-up", typeAr: "مختبر", typeEn: "Laboratory", testAr: "حزمة الدهون", testEn: "Lipid panel", prepAr: "وفق تعليمات المختبر", prepEn: "Follow laboratory instructions", reasonAr: "مقارنة الاتجاه تحت ظروف متشابهة", reasonEn: "Compare the trend under similar conditions" },
  { priorityAr: "دوري", priorityEn: "Routine", typeAr: "مختبر", typeEn: "Laboratory", testAr: "فيتامين د", testEn: "Vitamin D", prepAr: "لا تحضير خاص", prepEn: "No special preparation", reasonAr: "متابعة الاتجاه والجرعة المسجلة مع المختص", reasonEn: "Review the trend and recorded dose with a clinician" },
];

const protocolCards = [
  ["الأساس اليومي", "Daily foundation", "غذاء متوازن يدعم الحركة والوزن دون حمية قاسية.", "Balanced nutrition that supports movement and weight without a harsh diet.", "بروتين وألياف وخضار، مع وضع الكربوهيدرات حول التدريب عند الحاجة.", "Protein, fibre, and vegetables, with carbohydrates placed around training when useful."],
  ["قبل التمرين", "Before exercise", "وجبة خفيفة مناسبة قبل الحصة الأطول أو الأشد.", "A suitable light meal before a longer or harder session.", "الهدف دعم الأداء دون تحويل الإرشاد العام إلى وصفة علاجية.", "The goal is to support performance without turning general guidance into a prescription."],
  ["بعد التمرين", "After exercise", "بروتين وغذاء كامل خلال فترة التعافي.", "Protein and whole foods during recovery.", "الاحتياج الفردي يحدده المختص وفق الهدف والحالة الصحية.", "Individual needs are set with a clinician according to goals and health context."],
  ["أيام الراحة", "Rest days", "التركيز على جودة الطعام وتقليل السكريات المركزة.", "Focus on food quality and reduce concentrated sugars.", "لا تُلغى مجموعات غذائية كاملة دون سبب سريري.", "Do not remove entire food groups without a clinical reason."],
  ["روتين يومي", "Daily routine", "نوم منتظم وحركة موزعة على اليوم.", "Consistent sleep and movement distributed through the day.", "الرسوم تجعل التقدم مرئيًا وتحفز الاستمرار.", "Charts make progress visible and encourage consistency."],
  ["خفض الدهون المشبعة", "Reduce saturated fat", "الاستفادة من السمك وزيت الزيتون والمكسرات.", "Use fish, olive oil, and nuts as practical alternatives.", "تُراجع النتائج ضمن عوامل الخطورة الكاملة.", "Results are reviewed within the full risk context."],
  ["مراجعة أسبوعية", "Weekly review", "متوسط سبعة أيام أهم من رقم منفرد.", "A seven-day average matters more than one isolated number.", "الوزن والحركة والنوم تُقرأ كاتجاهات لا كأحكام.", "Weight, movement, and sleep are read as trends, not judgements."],
  ["قاعدة التنفيذ", "Implementation rule", "الأداء والوزن يتحسنان بالتعديل التدريجي.", "Performance and weight improve through gradual adjustments.", "لا تغيير دوائي أو مكمل تلقائي داخل التطبيق.", "The app never changes medicines or supplements automatically."],
];

const labDirectory = [
  ["مختبرات ألفا الطبية", "Alpha Medical Laboratories", "تحاليل ووحدات مخبرية", "Laboratory tests and units", "A"],
  ["مختبرات البرج الطبية", "Al Borg Medical Laboratories", "تحاليل ووحدات مخبرية", "Laboratory tests and units", "B"],
  ["مجمع سلامات الطبي", "Salamat Medical Complex", "خدمات طبية ومخبرية", "Medical and laboratory services", "S"],
  ["مختبرات دلتا الطبية", "Delta Medical Laboratories", "تحاليل ووحدات مخبرية", "Laboratory tests and units", "D"],
  ["مختبرات ثقة الطبية", "Thiqa Medical Laboratories", "تحاليل وخدمات مخبرية", "Laboratory tests and services", "T"],
  ["مختبرات وريد الطبية", "Sample W Medical Laboratories", "مصدر فحوصات تجريبية", "Synthetic test source", "W"],
  ["منصة لابك", "Labak Platform", "خدمات وحجوزات مخبرية", "Laboratory services and bookings", "L"],
  ["السعودي الألماني — حائل", "Saudi German Hospital — Hail", "مستشفى وخدمات تشخيصية", "Hospital and diagnostic services", "H"],
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

function PageHeader({ title, description, backLabel, onHome }: { title: string; description: string; backLabel: string; onHome: () => void }) {
  return (
    <div className="page-head">
      <div><h2>{title}</h2><p>{description}</p></div>
      <button type="button" onClick={onHome}>{backLabel}</button>
    </div>
  );
}

export default function Home() {
  const [language, setLanguage] = useState<Language>("ar");
  const [view, setView] = useState<View>("home");
  const [dataset, setDataset] = useState<HealthDataset>(safeDemoData);
  const [activityOpen, setActivityOpen] = useState(false);
  const [range, setRange] = useState("30");
  const [supplementGroup, setSupplementGroup] = useState("الكل");
  const [search, setSearch] = useState("");
  const [reportTopics, setReportTopics] = useState(["cardiac"]);
  const [notice, setNotice] = useState({ ar: "العينة الاصطناعية جاهزة — لا توجد بيانات شخصية.", en: "The synthetic sample is ready — no personal data is present." });
  const fileInput = useRef<HTMLInputElement>(null);

  const isEnglish = language === "en";
  const tx = (ar: string, en: string) => isEnglish ? en : ar;
  const dataText = (value: string) => translateHealthText(value, language);

  useEffect(() => {
    const queryLanguage = new URLSearchParams(window.location.search).get("lang");
    const savedLanguage = window.localStorage.getItem("sihha-language");
    const preferredLanguage = queryLanguage === "en" || queryLanguage === "ar" ? queryLanguage : savedLanguage === "en" ? "en" : "ar";
    queueMicrotask(() => setLanguage(preferredLanguage));
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = isEnglish ? "ltr" : "rtl";
    window.localStorage.setItem("sihha-language", language);
  }, [isEnglish, language]);

  const summary = useMemo(() => buildHealthSummary(dataset, language), [dataset, language]);
  const evidence = useMemo(() => buildJudgeEvidence(dataset, language), [dataset, language]);
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
      setNotice({ ar: `تمت معالجة ${file.name} محليًا داخل المتصفح فقط.`, en: `${file.name} was processed locally in the browser only.` });
    } catch (error) {
      const message = error instanceof Error ? error.message : "تعذر قراءة الملف.";
      setNotice({ ar: message, en: translateHealthText(message, "en") === message ? "The file could not be read." : translateHealthText(message, "en") });
    } finally {
      event.target.value = "";
    }
  };

  const toggleTopic = (topic: string) => setReportTopics((current) => current.includes(topic) ? current.filter((item) => item !== topic) : [...current, topic]);
  const showHome = () => setView("home");
  const dailyLabels = dataset.daily.map((day) => dataText(day.date));
  const chartSets = [
    [tx("نبضات القلب", "Heart rate"), tx("متوسط النبض العام لكل يوم", "Daily overall heart-rate average"), dataset.daily.map((day) => day.restingHeartRate + 24), "#ef4444"],
    [tx("مدة النوم", "Sleep duration"), tx("الساعات المسجلة لكل ليلة", "Recorded hours per night"), dataset.daily.map((day) => day.sleep), "#a78bfa"],
    [tx("الخطوات اليومية المقطوعة", "Daily steps"), tx("تُعرض الأيام ذات السجل الفعلي فقط", "Only days with actual records are shown"), dataset.daily.map((day) => day.steps), "#22c55e"],
    [tx("نبض القلب أثناء الراحة", "Resting heart rate"), tx("اتجاه شخصي وليس حدًا تشخيصيًا", "A personal trend, not a diagnostic threshold"), dataset.daily.map((day) => day.restingHeartRate), "#ec4899"],
    [tx("مسافة التمارين المقطوعة", "Workout distance"), tx("مسافة التمارين التقديرية بالكيلومتر", "Estimated workout distance in kilometres"), dataset.daily.map((day) => Number((day.workout / 8).toFixed(1))), "#22d3ee"],
    [tx("مدة التمارين", "Workout duration"), tx("الدقائق المسجلة فعليًا", "Actually recorded minutes"), dataset.daily.map((day) => day.workout), "#34d399"],
    [tx("وتيرة الجري (Pace)", "Running pace"), tx("دقيقة لكل كيلومتر في الجلسات المسجلة", "Minutes per kilometre in recorded sessions"), dataset.daily.map((day) => Number((11 - Math.min(day.workout, 40) / 12).toFixed(1))), "#fbbf24"],
    [tx("نبض القلب أثناء الجري", "Running heart rate"), tx("متوسط النبض في فترات الهرولة التجريبية", "Average heart rate during synthetic jogging intervals"), dataset.daily.map((day) => 148 + Math.round(day.workout * .7)), "#fb7185"],
  ] as Array<[string, string, number[], string]>;

  return (
    <main className="app-shell" data-language={language}>
      <section className="app-frame" aria-label={tx("نسخة المسابقة من مشروع صحة", "Sihha contest edition")}>
        <header className="site-header">
          <div className="brand-lockup"><div className="brand-icon">⚗</div><div><h1>{tx("صــحــة", "SIHHA")}</h1><p>{tx("لوحة متابعة صحية — نسخة مسابقة آمنة", "Health evidence dashboard — privacy-safe contest edition")}</p></div></div>
          <div className="header-actions">
            <div className="language-switch" role="group" aria-label={tx("اختيار اللغة", "Language selection")}>
              <button type="button" className={language === "ar" ? "active" : ""} aria-pressed={language === "ar"} onClick={() => setLanguage("ar")}>العربية</button>
              <span>|</span>
              <button type="button" className={language === "en" ? "active" : ""} aria-pressed={language === "en"} onClick={() => setLanguage("en")}>English</button>
            </div>
            <span className="safe-pill">● {tx("بيانات اصطناعية", "Synthetic data")}</span>
            <button type="button" onClick={() => fileInput.current?.click()}>{tx("استيراد Apple Health ZIP", "Import Apple Health ZIP")}</button>
            <input ref={fileInput} hidden type="file" accept="application/zip,.zip,application/json,.json" onChange={importFile} />
          </div>
        </header>

        <section className="page-body" aria-live="polite">
          {view === "home" && (
            <div className="home-view">
              <div className="stats-strip" aria-label={tx("ملخص المشروع", "Project summary")}>
                {[
                  [dataset.labs.length * 3, tx("الفحوصات السابقة", "Past tests"), ""],
                  [upcomingTests.length, tx("الفحوصات القادمة", "Upcoming tests"), ""],
                  [dataset.supplements.length + 4, tx("مكمّلات", "Supplements"), ""],
                  [dataset.supplements.length, tx("مكمّل نشط", "Active supplements"), ""],
                  [reviewLabs.length, tx("قيم تحتاج متابعة", "Values to follow up"), "warn"],
                ].map(([value, label, className]) => <div className={`stat-box ${className}`} key={String(label)}><b>{value}</b><span>{label}</span></div>)}
              </div>

              <nav className="project-banner" aria-label={tx("صفحات مشروع صحة", "Sihha sections")}>
                {navItems.map((item) => (
                  <button type="button" className="project-link" key={item.id} onClick={() => setView(item.id)}>
                    <span className="project-icon">{item.icon}</span><span>{isEnglish ? item.en : item.ar}</span>
                  </button>
                ))}
                <button type="button" className="project-link health-open" onClick={() => setActivityOpen(true)}><span className="project-icon">⌁</span><span>{tx("النشاط", "Activity")}</span></button>
              </nav>

              <div className="overview-grid">
                <div className="priority-column">
                  <article className="overview-card priorities">
                    <h2>{tx("الأولويات الحالية", "Current priorities")} <small>{tx("من العينة الاصطناعية", "From the synthetic sample")}</small></h2>
                    <div className="priority-list">
                      {summary.priorities.slice(0, 3).map((item) => <div className="priority-item" key={item.title}><b>{item.title}</b><span>{item.detail}</span><small>{item.source}</small></div>)}
                      <div className="priority-item"><b>{tx("الحركة والنوم — متابعة أسبوعية", "Movement and sleep — weekly review")}</b><span>{tx("تُعرض الاتجاهات لتشجيع الرياضة والاهتمام بالصحة، لا لإصدار حكم طبي.", "Trends encourage exercise and attention to health; they do not issue a medical judgement.")}</span><small>Motivation layer</small></div>
                    </div>
                  </article>
                  <section className="report-builder" aria-label={tx("إعداد ملخص طبي للمختص", "Prepare a clinician brief")}>
                    <div className="report-intro"><h2>{tx("ملخص طبي للمختص", "Clinician brief")}</h2><p>{tx("حدد موضوع التقرير. المخرجات باللغة الإنجليزية ومهيأة للطباعة أو الحفظ PDF.", "Select report topics. Output is prepared for printing or saving as PDF.")}</p></div>
                    <div className="report-options">
                      {[["cardiac","القلب","Cardiology"],["labs","الفحوصات","Internal Medicine"],["supplements","المكملات","Clinical Pharmacy"],["activity","الرياضة","Sports Medicine"],["sleep","النوم","Sleep Medicine"]].map(([id, ar, en]) => (
                        <label className="report-option" key={id}><input type="checkbox" checked={reportTopics.includes(id)} onChange={() => toggleTopic(id)} /><span><b>{isEnglish ? en : ar}</b><small>{isEnglish ? ar : en}</small></span></label>
                      ))}
                    </div>
                    <div className="report-action"><span>{reportTopics.length ? tx(`${reportTopics.length} موضوع محدد`, `${reportTopics.length} topics selected`) : tx("اختر موضوعًا", "Select a topic")}</span><button type="button" onClick={() => window.print()}>{tx("إعداد وطباعة التقرير", "Prepare and print report")}</button><a href="/samples/sihha-synthetic-cardiology-brief.pdf" download>{tx("تقرير القلب PDF", "Cardiology PDF")}</a></div>
                  </section>
                </div>
                <article className="overview-card goals-card">
                  <h2>{tx("الأهداف الشخصية", "Personal goals")} <small>{tx("آخر 7 أيام", "Last 7 days")}</small></h2>
                  <div className="goals-list">
                    <div className="goal-item"><span><b>{tx("الخطوات اليومية", "Daily steps")}</b><small>{tx("الهدف", "Goal")}: {dataset.goals.steps.toLocaleString("en-US")} {tx("خطوة", "steps")}</small><small>{tx("المتوسط الحالي", "Current average")}: {summary.averageSteps.toLocaleString("en-US")} {tx("خطوة", "steps")}</small></span><em>{summary.averageSteps >= dataset.goals.steps ? tx("ضمن الهدف", "On goal") : tx("دون الهدف", "Below goal")}</em></div>
                    <div className="goal-item"><span><b>{tx("مدة النوم", "Sleep duration")}</b><small>{tx("الهدف", "Goal")}: {dataset.goals.sleep} {tx("ساعات", "hours")}</small><small>{tx("المتوسط الحالي", "Current average")}: {summary.averageSleep.toFixed(1)} {tx("ساعة", "hours")}</small></span><em>{summary.averageSleep >= dataset.goals.sleep ? tx("ضمن الهدف", "On goal") : tx("دون الهدف", "Below goal")}</em></div>
                    <div className="goal-item"><span><b>{tx("دقائق التمرين الأسبوعية", "Weekly exercise minutes")}</b><small>{tx("الهدف", "Goal")}: {dataset.goals.workoutMinutes} {tx("دقيقة", "minutes")}</small><small>{tx("المجموع الحالي", "Current total")}: {summary.workoutMinutes} {tx("دقيقة", "minutes")}</small></span><em>{summary.workoutMinutes >= dataset.goals.workoutMinutes ? tx("ضمن الهدف", "On goal") : tx("دون الهدف", "Below goal")}</em></div>
                  </div>
                  <div className="monitoring-panel"><b>{tx("نبض الراحة", "Resting heart rate")}: {dataset.daily.at(-1)?.restingHeartRate} bpm</b><span>{tx("مؤشر للمراقبة وليس هدفًا تشخيصيًا", "A monitoring signal, not a diagnostic target")}</span><small>{isEnglish ? notice.en : notice.ar}</small></div>
                </article>
              </div>
            </div>
          )}

          {view === "results" && (
            <div className="subpage results-page"><PageHeader title={tx("نتائج الفحوصات الماضية", "Past test results")} description={tx("عرض موحّد لاتجاهات تجريبية مع إبراز القيم التي تستحق سؤالًا للمختص.", "A unified view of synthetic trends that highlights values worth discussing with a clinician.")} backLabel={tx("العودة للرئيسية", "Back to home")} onHome={showHome} />
              <div className="summary-cards"><div><span>{tx("إجمالي النتائج", "Total results")}</span><b>{dataset.labs.length * 3}</b><small>{tx("3 تواريخ تجريبية", "3 synthetic dates")}</small></div><div><span>{tx("ضمن المرجع", "Within range")}</span><b>{dataset.labs.filter((x)=>x.status==="good").length}</b><small>{tx("وفق المرجع المعروض", "Using the displayed reference")}</small></div><div><span>{tx("للمتابعة", "Monitor")}</span><b>{dataset.labs.filter((x)=>x.status==="watch").length}</b><small>{tx("اتجاه يحتاج سياقًا", "Trend needs context")}</small></div><div><span>{tx("للمراجعة", "Review")}</span><b>{dataset.labs.filter((x)=>x.status==="review").length}</b><small>{tx("جهّز سؤالًا للمختص", "Prepare a clinician question")}</small></div></div>
              <div className="subpage-scroll"><section className="flagged-section"><h3>{tx("القيم التي تستحق المتابعة", "Values worth following up")} <small>{tx("آخر تاريخ تجريبي: يوليو 2026", "Latest synthetic date: July 2026")}</small></h3><div className="flagged-grid">{reviewLabs.map((lab)=><article key={lab.id}><span>{dataText(lab.statusLabel)}</span><h4>{isEnglish ? lab.nameEn : lab.nameAr}</h4><b>{lab.readings.at(-1)?.value} {lab.unit}</b><small>{isEnglish ? lab.nameAr : lab.nameEn} · {tx("المرجع", "reference")} {dataText(lab.reference)}</small><p>{dataText(lab.trend)}</p></article>)}</div></section>
                <section className="data-table"><div className="data-row head"><span>{tx("الفحص", "Test")}</span><span>{tx("English", "Arabic")}</span><span>{tx("آخر قراءة", "Latest")}</span><span>{tx("المرجع", "Reference")}</span><span>{tx("الاتجاه", "Trend")}</span></div>{dataset.labs.map((lab)=><div className="data-row" key={lab.id}><b>{isEnglish ? lab.nameEn : lab.nameAr}</b><span>{isEnglish ? lab.nameAr : lab.nameEn}</span><span>{lab.readings.at(-1)?.value} {lab.unit}</span><span>{dataText(lab.reference)}</span><span>{dataText(lab.trend)}</span></div>)}</section></div>
            </div>
          )}

          {view === "upcoming" && (
            <div className="subpage upcoming-page"><PageHeader title={tx("الفحوصات القادمة", "Upcoming tests")} description={tx("قائمة تجريبية تنظّم ما يمكن مناقشته مع الطبيب؛ لا تنشئ طلبًا طبيًا تلقائيًا.", "A synthetic list that organises topics for a clinical conversation; it does not create medical orders.")} backLabel={tx("العودة للرئيسية", "Back to home")} onHome={showHome} />
              <div className="summary-cards"><div><span>{tx("إجمالي المدخل", "Total entries")}</span><b>{upcomingTests.length}</b><small>{tx("للعرض فقط", "For demonstration")}</small></div><div><span>{tx("فحوصات مخبرية", "Lab tests")}</span><b>2</b><small>{tx("متابعة اتجاهات", "Trend follow-up")}</small></div><div><span>{tx("قلب / مركز متخصص", "Cardiology / specialist")}</span><b>2</b><small>{tx("ECG واختبار جهد", "ECG and exercise ECG")}</small></div><div><span>{tx("الأولوية", "Priority")}</span><b>2</b><small>{tx("أساسيان", "Essential")}</small></div></div>
              <div className="filter-bar"><span>{tx("الكل", "All")}</span><span>{tx("مخبري", "Laboratory")}</span><span>{tx("مستشفى / متخصص", "Hospital / specialist")}</span><input aria-label={tx("بحث في الفحوصات القادمة", "Search upcoming tests")} placeholder={tx("بحث باسم الفحص أو السبب", "Search by test or reason")} /></div>
              <div className="subpage-scroll"><section className="data-table upcoming-table"><div className="data-row head"><span>{tx("الأولوية", "Priority")}</span><span>{tx("النوع", "Type")}</span><span>{tx("الفحص", "Test")}</span><span>{tx("English", "Arabic")}</span><span>{tx("التحضير", "Preparation")}</span><span>{tx("سبب الإدراج", "Reason")}</span></div>{upcomingTests.map((item)=><div className="data-row" key={item.testEn}><b>{isEnglish ? item.priorityEn : item.priorityAr}</b><span>{isEnglish ? item.typeEn : item.typeAr}</span><strong>{isEnglish ? item.testEn : item.testAr}</strong><span>{isEnglish ? item.testAr : item.testEn}</span><span>{isEnglish ? item.prepEn : item.prepAr}</span><span>{isEnglish ? item.reasonEn : item.reasonAr}</span></div>)}</section></div>
            </div>
          )}

          {view === "protocol" && (
            <div className="subpage protocol-page"><PageHeader title={tx("البروتوكول المعتمد: الرياضة، الوزن، القلب", "Protocol: exercise, weight, and heart health")} description={tx("خطة توعوية تجريبية تحافظ على فصل الإرشاد العام عن القرار الطبي.", "A synthetic educational plan that keeps general guidance separate from medical decisions.")} backLabel={tx("العودة للرئيسية", "Back to home")} onHome={showHome} />
              <div className="segment-tabs"><span className="active">{tx("الغذاء والرياضة", "Nutrition and exercise")}</span><span>{tx("المكملات", "Supplements")}</span><span>{tx("المتابعة والسلامة", "Follow-up and safety")}</span></div>
              <div className="protocol-grid">{protocolCards.map(([tagAr,tagEn,titleAr,titleEn,bodyAr,bodyEn])=><article key={tagAr}><span>{isEnglish ? tagEn : tagAr}</span><h3>{isEnglish ? titleEn : titleAr}</h3><p>{isEnglish ? bodyEn : bodyAr}</p></article>)}</div><div className="source-line">{tx("العينة اصطناعية بالكامل · لا تشخيص ولا تغيير دوائي تلقائي", "Fully synthetic sample · no diagnosis or automatic treatment changes")} · Built with Codex + GPT‑5.6</div>
            </div>
          )}

          {view === "supplements" && (
            <div className="subpage supplements-page"><PageHeader title={tx("جدول المكملات", "Supplements table")} description={tx("قائمة موحدة تعرض ما سجله المستخدم؛ المجموعة للتنظيم وليست جدول جرعات علاجيًا.", "A unified record of user-entered supplements; groups organise the list and are not a therapeutic dosing schedule.")} backLabel={tx("العودة للرئيسية", "Back to home")} onHome={showHome} />
              <div className="supplement-counts"><span>{tx("الإجمالي", "Total")} {dataset.supplements.length}</span><span>{tx("نشط", "Active")} {dataset.supplements.length}</span><span>{tx("مؤقت", "Temporary")} 0</span><span>{tx("متوقف", "Stopped")} 0</span></div>
              <div className="supplement-filters"><input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder={tx("ابحث باسم المكمل...", "Search supplement name...")} aria-label={tx("بحث المكملات", "Search supplements")} /><select value={supplementGroup} onChange={(e)=>setSupplementGroup(e.target.value)} aria-label={tx("مجموعة المكملات", "Supplement group")}>{groups.map((group)=><option key={group} value={group}>{dataText(group)}</option>)}</select>{groups.slice(0,4).map((group)=><button type="button" className={supplementGroup===group?"active":""} onClick={()=>setSupplementGroup(group)} key={group}>{dataText(group)}</button>)}</div>
              <div className="subpage-scroll"><section className="supplement-table-dark"><div className="supplement-row head"><span>{tx("المكمل", "Supplement")}</span><span>{tx("المجموعة", "Group")}</span><span>{tx("الحالة", "Status")}</span><span>{tx("مرات الطلب", "Orders")}</span><span>{tx("الفوائد الرئيسية", "Main purpose")}</span><span>{tx("دواعي الاستخدام", "Use record")}</span><span>{tx("ملاحظة للمراجعة", "Review note")}</span></div>{filteredSupplements.map((item,index)=><div className="supplement-row" key={item.name}><b>{item.name}<small>{item.dose}</small></b><span>{dataText(item.group)}</span><em>{tx("نشط", "Active")}</em><strong>{index%5+1}</strong><span>{dataText(item.purpose)}</span><span>{dataText(item.purpose)}</span><span>{dataText(item.caution)}</span></div>)}</section></div>
            </div>
          )}

          {view === "profile" && (
            <div className="subpage profile-page"><PageHeader title={tx("الملف الصحي والغذائي", "Health and nutrition profile")} description={tx("ملف اصطناعي يوضح طريقة تنظيم النتائج والخطة دون كشف أي سجل حقيقي.", "A synthetic profile showing how results and plans are organised without exposing a real record.")} backLabel={tx("العودة للرئيسية", "Back to home")} onHome={showHome} />
              <section className="profile-summary"><h3>{tx("الصورة المختصرة", "At a glance")}</h3><div><article><span>{tx("القياسات", "Measurements")}</span><b>{tx("نطاق عمري", "Age band")} {dataset.profile.ageBand}</b></article><article><span>{tx("سكر الدم", "Blood glucose")}</span><b>{tx("HbA1c تجريبي 5.4%", "Synthetic HbA1c 5.4%")}</b></article><article><span>{tx("القرار الغذائي", "Nutrition direction")}</span><b>{tx("توازن يدعم الحركة", "Balance that supports movement")}</b></article><article><span>{tx("المرحلة الحالية", "Current stage")}</span><b>{tx("تحضير مراجعة قلب", "Prepare cardiology review")}</b></article></div></section>
              <div className="profile-content-scroll"><div className="profile-plan"><article><h3>{tx("الكربوهيدرات والرياضة", "Carbohydrates and exercise")}</h3><p>{tx("توزيع عملي حول التدريب مع متابعة متوسط الحركة الأسبوعي.", "Practical timing around training while following the weekly movement average.")}</p></article><article><h3>{tx("البروتين والدهون", "Protein and fats")}</h3><p>{tx("غذاء كامل ودهون غير مشبعة مع قراءة الاتجاه المخبري.", "Whole foods and unsaturated fats interpreted alongside lab trends.")}</p></article><article className="alert"><h3>{tx("فحوصات القلب", "Cardiac tests")}</h3><b>ECG + {tx("اختبار الجهد", "exercise ECG")}</b><p>{tx("ساعدت النسخة الخاصة صاحب المشروع على جمع نمط النبض أثناء الهرولة مع الدهون وتحضير تقرير للمختص. العرض العام يعيد الفكرة ببيانات اصطناعية.", "The private prototype helped its owner connect jogging heart-rate patterns with lipid results and prepare a clinician brief. The public demo recreates that benefit with synthetic data.")}</p><a href="/samples/sihha-synthetic-cardiology-brief.pdf" download>{tx("تنزيل التقرير التجريبي", "Download synthetic report")}</a></article><article><h3>{tx("متابعة مختبرية", "Lab follow-up")}</h3><p>{tx("إعادة قياس الاتجاهات في موعد يحدده الطبيب وتحت ظروف متشابهة.", "Recheck trends at a clinician-defined time and under similar conditions.")}</p></article><article><h3>{tx("القيم التي تستحق المتابعة", "Values worth following up")}</h3><ul>{reviewLabs.map((lab)=><li key={lab.id}>{isEnglish ? lab.nameEn : lab.nameAr}: {lab.readings.at(-1)?.value} {lab.unit}</li>)}</ul></article><article><h3>{tx("مراقبة الأداء", "Performance monitoring")}</h3><p>{tx("الرسوم تحوّل أرقام الساعة إلى دافع مستمر للحركة والاهتمام بالصحة.", "Charts turn watch data into continuing motivation for movement and health awareness.")}</p></article></div>
              <section className="cardiac-report-preview"><div className="report-preview-copy"><span>{tx("معاينة فعلية من ملف PDF الاصطناعي", "Rendered preview from the synthetic PDF")}</span><h3>{tx("كيف حوّل «صحة» إشارتين إلى محادثة قلب أوضح؟", "How did Sihha turn two signals into a clearer cardiology conversation?")}</h3><p>{tx("يعرض التقرير ذروة الهرولة التجريبية، اتجاه LDL، قاعدة التصعيد القابلة للتفسير، وحدود الأمان. وهو يحاكي فائدة التقرير الخاص دون نسخ أي معلومة شخصية.", "The report shows the synthetic jogging peak, LDL trend, explainable escalation rule, and safety boundary. It recreates the private report's benefit without copying personal information.")}</p><ul><li>Jogging peak: 188 bpm</li><li>LDL trend: 142 → 129 → 116 mg/dL</li><li>Prepare questions — never issue a diagnosis</li></ul><a href="/samples/sihha-synthetic-cardiology-brief.pdf" target="_blank" rel="noreferrer">{tx("فتح التقرير الكامل PDF", "Open full PDF")}</a></div><a className="pdf-page" href="/samples/sihha-synthetic-cardiology-brief.pdf" target="_blank" rel="noreferrer"><img src="/samples/sihha-synthetic-cardiology-brief-preview.png" alt={tx("الصفحة الأولى من تقرير القلب الاصطناعي، وتعرض سبب المحادثة وقاعدة التصعيد والأسئلة", "First page of the synthetic cardiology brief showing the conversation trigger, escalation rule, and questions")} /></a></section></div>
            </div>
          )}

          {view === "labs" && (
            <div className="subpage labs-page"><PageHeader title={tx("دليل المختبرات والجهات الطبية", "Laboratory and medical directory")} description={tx("صفحة مستقلة من مشروع صحة؛ الروابط الخارجية لا تستقبل أي بيانات صحية.", "A standalone Sihha section; external links receive no health data.")} backLabel={tx("العودة للرئيسية", "Back to home")} onHome={showHome} />
              <section className="directory-intro"><div><h3>{tx("الجهات المتاحة", "Available providers")}</h3><p>{tx("روابط مباشرة للحجز أو الاطلاع على الخدمات. فتح الرابط لا يرسل أي بيانات صحية.", "Direct links for booking or viewing services. Opening a link sends no health data.")}</p></div><b>{labDirectory.length} {tx("جهات", "providers")}</b></section>
              <h3 className="directory-title">{tx("المختبرات والمراكز", "Laboratories and centres")}</h3><div className="directory-grid">{labDirectory.map(([nameAr,nameEn,typeAr,typeEn,initial])=><article key={nameAr}><div className="lab-avatar">{initial}</div><div><h4>{isEnglish ? nameEn : nameAr}</h4><p>{isEnglish ? typeEn : typeAr}</p></div><span>↗</span></article>)}</div><div className="source-line">{tx("مشروع صحة · دليل مستقل للجهات الطبية", "Sihha · independent medical directory")}</div>
            </div>
          )}
        </section>

        <footer><span>{tx("آخر تحديث تجريبي: 18 يوليو 2026", "Synthetic update: 18 July 2026")}</span><span>{tx("نسخة مسابقة آمنة — لا تحتوي أي سجل طبي حقيقي", "Privacy-safe contest edition — no real medical record")}</span></footer>
      </section>

      {activityOpen && (
        <div className="health-modal open" role="presentation">
          <section className="health-dialog" role="dialog" aria-modal="true" aria-label={tx("لوحة النشاط", "Activity dashboard")}>
            <div className="health-head"><div className="health-title"><div className="health-title-icon">♥</div><div><h2>{tx("لوحة النشاط", "Activity dashboard")}</h2><p>{tx("تحليل ملف Apple Health المضغوط محليًا داخل المتصفح", "Analyse an Apple Health ZIP locally in the browser")}</p></div></div><button type="button" className="health-close" onClick={()=>setActivityOpen(false)} aria-label={tx("إغلاق", "Close")}>×</button></div>
            <div className="health-toolbar"><div className="range-buttons">{[["30","30 يومًا","30 days"],["90","90 يومًا","90 days"],["year","سنة","Year"],["all","كل الفترة","All time"]].map(([id,ar,en])=><button type="button" className={range===id?"active":""} onClick={()=>setRange(id)} key={id}>{isEnglish ? en : ar}</button>)}</div><span>{range === "30" ? tx("30 يومًا", "30 days") : range === "90" ? tx("90 يومًا", "90 days") : range === "year" ? tx("سنة", "Year") : tx("كل الفترة", "All time")} · {tx("آخر تسجيل", "Last record")} {dataText(dataset.profile.lastSync)}</span><button type="button" onClick={()=>fileInput.current?.click()}>{tx("استيراد ملف جديد", "Import new file")}</button></div>
            <div className="health-kpis"><article><span>{tx("متوسط الخطوات", "Average steps")}</span><b>{summary.averageSteps.toLocaleString("en-US")} {tx("خطوة", "steps")}</b><small>{summary.changes.steps>=0?"↑":"↓"} {Math.abs(summary.changes.steps)}% {tx("عن البداية", "from the start")}</small></article><article><span>{tx("متوسط المسافة اليومية", "Average daily distance")}</span><b>{(summary.averageSteps*.00072).toFixed(1)} {tx("كم", "km")}</b><small>{tx("تقدير من الخطوات", "Estimated from steps")}</small></article><article><span>{tx("متوسط النوم", "Average sleep")}</span><b>{summary.averageSleep.toFixed(1)} {tx("س", "h")}</b><small>{summary.changes.sleep>=0?"↑":"↓"} {Math.abs(summary.changes.sleep)} {tx("ساعة", "hours")}</small></article><article><span>{tx("نبض الراحة", "Resting heart rate")}</span><b>{dataset.daily.at(-1)?.restingHeartRate} {tx("نبضة", "bpm")}</b><small>{tx("تغيّر وصفي فقط", "Descriptive change only")}</small></article><article><span>{tx("التمارين", "Exercise")}</span><b>{summary.workoutMinutes} {tx("د", "min")}</b><small>{tx("إجمالي الفترة", "Period total")}</small></article><article className="pace"><span>{tx("وتيرة الجري (Pace)", "Running pace")}</span><b>9.1 {tx("د/كم", "min/km")}</b><small>{tx("عينة تجريبية", "Synthetic sample")}</small></article></div>
            <div className="health-chart-grid">{chartSets.map(([title,subtitle,values,color])=><article className="health-chart-card" key={title}><h3>{title}</h3><p>{subtitle}</p><CanvasChart title={title} values={values} labels={dailyLabels} color={color} /></article>)}</div>
            <div className="health-bottom"><article><h3>{tx("مقارنة الفترات", "Period comparison")}</h3><div className="compare-grid"><span><b>{summary.averageSteps.toLocaleString("en-US")}</b>{tx("الخطوات — الآن", "Steps — now")}</span><span><b>{summary.changes.steps}%</b>{tx("التغير", "Change")}</span><span><b>{summary.averageSleep.toFixed(1)}</b>{tx("النوم — الآن", "Sleep — now")}</span><span><b>{dataset.daily.at(-1)?.restingHeartRate}</b>{tx("نبض الراحة", "Resting heart rate")}</span></div></article><article><h3>{tx("جودة البيانات", "Data quality")}</h3><div className="quality-badges"><span>{tx("جودة الأدلة", "Evidence quality")} {summary.evidenceQuality}%</span><span>{tx("الخطوات", "Steps")} {dataset.daily.length} {tx("أيام", "days")}</span><span>{tx("النوم", "Sleep")} {dataset.daily.length} {tx("ليالٍ", "nights")}</span><span>{tx("الاستيراد محلي", "Local import")}</span></div><p>{tx("البيانات التجريبية مكتملة للعرض. البيانات الحقيقية لا تغادر ذاكرة المتصفح.", "Synthetic data is complete for the demo. Real data never leaves browser memory.")}</p></article></div>
            <p className="health-disclaimer">{tx("هذه اللوحة لتنظيم وفهم البيانات الشخصية ولا تُعد تشخيصًا طبيًا. قياسات الساعة تحتاج إلى سياق سريري وجهاز مناسب.", "This dashboard organises personal data and is not a medical diagnosis. Wearable measurements require clinical context and an appropriate device.")}</p>
          </section>
        </div>
      )}

      <section className="print-report" lang={language} dir={isEnglish ? "ltr" : "rtl"}><pre>{evidence}</pre></section>
    </main>
  );
}
