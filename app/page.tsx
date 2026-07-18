"use client";

import { ChangeEvent, useMemo, useRef, useState } from "react";
import {
  buildHealthSummary,
  buildJudgeEvidence,
  type HealthDataset,
} from "../lib/health-engine";
import { safeDemoData } from "../lib/sample-data";
import { importLocalHealthFile } from "../lib/apple-health-import";

type View = "overview" | "activity" | "labs" | "cardiac" | "supplements" | "report" | "privacy";

const navItems: Array<{ id: View; label: string; icon: string }> = [
  { id: "overview", label: "نظرة عامة", icon: "⌂" },
  { id: "activity", label: "النشاط", icon: "⌁" },
  { id: "labs", label: "المختبر", icon: "◫" },
  { id: "cardiac", label: "القلب", icon: "♥" },
  { id: "supplements", label: "المكملات", icon: "✦" },
  { id: "report", label: "تقرير المختص", icon: "▤" },
  { id: "privacy", label: "الخصوصية", icon: "◉" },
];

function downloadText(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function Home() {
  const [view, setView] = useState<View>("overview");
  const [dataset, setDataset] = useState<HealthDataset>(safeDemoData);
  const [labIndex, setLabIndex] = useState(0);
  const [supplementGroup, setSupplementGroup] = useState("الكل");
  const [briefLanguage, setBriefLanguage] = useState<"ar" | "en">("ar");
  const [notice, setNotice] = useState("العرض التجريبي الآمن جاهز — لا توجد بيانات شخصية.");
  const fileInput = useRef<HTMLInputElement>(null);

  const summary = useMemo(() => buildHealthSummary(dataset), [dataset]);
  const evidence = useMemo(() => buildJudgeEvidence(dataset, briefLanguage), [dataset, briefLanguage]);
  const selectedLab = dataset.labs[labIndex] ?? dataset.labs[0];
  const groups = ["الكل", ...Array.from(new Set(dataset.supplements.map((item) => item.group)))];
  const filteredSupplements = dataset.supplements.filter(
    (item) => supplementGroup === "الكل" || item.group === supplementGroup,
  );

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const candidate = await importLocalHealthFile(file, safeDemoData);
      setDataset(candidate);
      setLabIndex(0);
      setNotice(`تمت معالجة ${file.name} محليًا داخل المتصفح فقط.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "تعذر قراءة الملف.");
    } finally {
      event.target.value = "";
    }
  };

  const resetDemo = () => {
    setDataset(safeDemoData);
    setLabIndex(0);
    setNotice("أُعيد تحميل العرض التجريبي الآمن.");
  };

  return (
    <main className="app-shell">
      <section className="app-frame" aria-label="تطبيق صحة التجريبي">
        <header className="topbar">
          <div className="brand-block">
            <div className="brand-mark" aria-hidden="true">صحة</div>
            <div>
              <h1>صحة <span>Sihha</span></h1>
              <p>Health Evidence Navigator</p>
            </div>
          </div>
          <nav className="main-nav" aria-label="التنقل الرئيسي">
            {navItems.map((item) => (
              <button
                key={item.id}
                className={view === item.id ? "nav-button active" : "nav-button"}
                onClick={() => setView(item.id)}
                type="button"
              >
                <span aria-hidden="true">{item.icon}</span>{item.label}
              </button>
            ))}
          </nav>
          <div className="demo-badge"><i /> Safe demo</div>
        </header>

        <div className="status-strip">
          <span>{notice}</span>
          <div>
            <button type="button" onClick={resetDemo}>تشغيل العينة</button>
            <button type="button" className="primary" onClick={() => fileInput.current?.click()}>استيراد Apple Health ZIP</button>
            <input ref={fileInput} hidden type="file" accept="application/zip,.zip,application/json,.json" onChange={handleImport} />
          </div>
        </div>

        <section className="content" aria-live="polite">
          {view === "overview" && (
            <div className="view-grid overview-grid">
              <article className="hero-card">
                <div className="eyebrow">ملخص قابل للتفسير</div>
                <h2>بياناتك كثيرة. الخطوة التالية يجب أن تكون واضحة.</h2>
                <p>يجمع صحة إشارات الساعة الذكية، المختبر والمكملات في سرد واحد يساعدك على الاستعداد لمحادثة أفضل مع المختص — من دون تشخيص أو رفع بياناتك.</p>
                <div className="hero-actions">
                  <button type="button" className="primary large" onClick={() => setView("activity")}>استكشف نشاط الساعة</button>
                  <button type="button" onClick={() => setView("report")}>جهّز تقرير المختص</button>
                </div>
              </article>
              <article className="score-card">
                <div className="score-ring" style={{ "--score": `${summary.todayScore}%` } as React.CSSProperties}>
                  <strong>{summary.todayScore}</strong><small>/100</small>
                </div>
                <div><span>مؤشر اليوم</span><p>حافز للروتين وليس جاهزية طبية.</p></div>
              </article>
              <article className="priority-card wide-card">
                <div className="section-heading"><div><span>الأولوية الآن</span><h3>ثلاث إشارات تستحق المتابعة</h3></div><b>{dataset.profile.lastSync}</b></div>
                <div className="priority-list">
                  {summary.priorities.map((item, index) => (
                    <div className={`priority priority-${index + 1}`} key={item.title}>
                      <span>{index + 1}</span><div><strong>{item.title}</strong><p>{item.detail}</p></div><em>{item.source}</em>
                    </div>
                  ))}
                </div>
              </article>
              <article className="mini-metric"><span>متوسط الخطوات</span><strong>{summary.averageSteps.toLocaleString("en-US")}</strong><small>هدف {dataset.goals.steps.toLocaleString("en-US")}</small></article>
              <article className="mini-metric"><span>متوسط النوم</span><strong>{summary.averageSleep.toFixed(1)} س</strong><small>هدف {dataset.goals.sleep} ساعات</small></article>
              <article className="mini-metric"><span>التمرين الأسبوعي</span><strong>{summary.workoutMinutes} د</strong><small>هدف {dataset.goals.workoutMinutes} دقيقة</small></article>
            </div>
          )}

          {view === "activity" && (
            <div className="view-grid activity-grid">
              <article className="activity-intro">
                <div><div className="eyebrow">من الساعة إلى حافز يومي</div><h2>صفحة النشاط</h2><p>تجعل التقدم مرئيًا؛ فتحوّل أرقام الساعة المتفرقة إلى دافع للحركة والاهتمام بالصحة.</p></div>
                <div className="watch-chip"><span>⌚</span><div><strong>Apple Health ZIP</strong><small>خطوات • نوم • نبض • تمارين</small></div></div>
              </article>
              <article className="chart-card steps-chart">
                <div className="section-heading"><div><span>الحركة</span><h3>الخطوات اليومية</h3></div><b>{summary.averageSteps.toLocaleString("en-US")} متوسط</b></div>
                <div className="bar-chart" aria-label="مخطط الخطوات اليومية">
                  {dataset.daily.map((day) => (
                    <div className="bar-column" key={day.date} title={`${day.date}: ${day.steps} خطوة`}>
                      <span className={day.steps >= dataset.goals.steps ? "bar reached" : "bar"} style={{ height: `${Math.min(100, day.steps / dataset.goals.steps * 100)}%` }}><i>{Math.round(day.steps / 1000)}k</i></span>
                      <small>{day.date}</small>
                    </div>
                  ))}
                </div>
              </article>
              <article className="chart-card sleep-chart">
                <div className="section-heading"><div><span>التعافي</span><h3>النوم</h3></div><b>{summary.averageSleep.toFixed(1)} ساعة</b></div>
                <div className="sleep-days">
                  {dataset.daily.map((day) => (
                    <div key={day.date}><span>{day.date}</span><i style={{ width: `${Math.min(100, day.sleep / dataset.goals.sleep * 100)}%` }} /><b>{day.sleep}س</b></div>
                  ))}
                </div>
              </article>
              <article className="signal-card score-signal"><span>مؤشر اليوم</span><strong>{summary.todayScore}<small>/100</small></strong><p>{summary.todayReasons.join(" ")}</p></article>
              <article className="signal-card"><span>ماذا تغيّر؟</span><strong>{summary.changes.steps >= 0 ? "+" : ""}{summary.changes.steps}% <small>خطوات</small></strong><p>النوم {summary.changes.sleep >= 0 ? "+" : ""}{summary.changes.sleep} س • نبض الراحة {summary.changes.restingHeartRate >= 0 ? "+" : ""}{summary.changes.restingHeartRate} bpm. ارتباط زمني لا يثبت السببية.</p></article>
              <article className="signal-card insight"><span>جودة الأدلة</span><strong>{summary.evidenceQuality}%</strong><p>تعتمد على اكتمال سبعة أيام وتوفر الخطوات والنوم والنبض والنشاط. وضوح التقدم يشجع على الاستمرار.</p></article>
            </div>
          )}

          {view === "labs" && selectedLab && (
            <div className="labs-layout">
              <aside className="lab-list">
                <div className="section-heading"><div><span>بيانات تجريبية</span><h3>اتجاهات المختبر</h3></div></div>
                {dataset.labs.map((lab, index) => (
                  <button type="button" className={labIndex === index ? "lab-button active" : "lab-button"} onClick={() => setLabIndex(index)} key={lab.id}>
                    <div><strong>{lab.nameAr}</strong><small>{lab.nameEn}</small></div>
                    <span className={`status ${lab.status}`}>{lab.statusLabel}</span>
                  </button>
                ))}
              </aside>
              <article className="lab-detail">
                <div className="lab-title"><div><div className="eyebrow">{selectedLab.category}</div><h2>{selectedLab.nameAr}</h2><p>{selectedLab.nameEn} • {selectedLab.unit}</p></div><span className={`status large-status ${selectedLab.status}`}>{selectedLab.statusLabel}</span></div>
                <div className="trend-line">
                  {selectedLab.readings.map((reading, index) => (
                    <div key={reading.date}><span>{reading.value}</span><i className={index === selectedLab.readings.length - 1 ? "current" : ""} /><small>{reading.date}</small></div>
                  ))}
                </div>
                <div className="evidence-grid">
                  <div><span>النطاق المرجعي</span><strong>{selectedLab.reference}</strong></div>
                  <div><span>الاتجاه</span><strong>{selectedLab.trend}</strong></div>
                  <div><span>آخر قراءة</span><strong>{selectedLab.readings.at(-1)?.value} {selectedLab.unit}</strong></div>
                </div>
                <div className="discussion-box"><strong>سؤال مقترح للمختص</strong><p>{selectedLab.clinicianQuestion}</p><small>هذه صياغة لتنظيم الحوار وليست توصية علاجية.</small></div>
              </article>
            </div>
          )}

          {view === "cardiac" && (
            <div className="cardiac-layout">
              <article className="cardiac-hero">
                <div>
                  <div className="eyebrow">تنبيه متعدد الإشارات</div>
                  <h2>متى يتحول الرقم إلى سؤال لطبيب القلب؟</h2>
                  <p>يجمع صحة بين ذروة نبض مرتفعة أثناء الهرولة واتجاه دهون يحتاج مراجعة، ثم يقترح محادثة متخصصة بدل إصدار تشخيص.</p>
                </div>
                <div className="codex-chip"><b>Codex + GPT‑5.6</b><span>صمّم منطق التنبيه وصياغة حدود الأمان</span></div>
              </article>
              <article className="cardiac-metric alert"><span>ذروة الهرولة</span><strong>{dataset.cardiac.maxJoggingHeartRate}<small> bpm</small></strong><p>{dataset.cardiac.context}</p></article>
              <article className="cardiac-metric"><span>الذروة المعتادة</span><strong>{dataset.cardiac.typicalJoggingPeak}<small> bpm</small></strong><p>مؤشر من ساعة بصرية؛ ليس تخطيط ECG.</p></article>
              <article className="cardiac-metric amber"><span>آخر LDL تجريبي</span><strong>{summary.cardiacReview.latestLdl}<small> mg/dL</small></strong><p>أعلى من مرجع العينة مع اتجاه هابط.</p></article>
              <article className="cardiac-review">
                <div><div className="eyebrow">اقتراح قابل للتصرف</div><h3>ناقش مراجعة طبيب القلب</h3><p>{summary.cardiacReview.rationale} ظهور الإشارتين معًا يبرر تجهيز أسئلة عن النظم أثناء الجهد وتقييم عوامل الخطورة، لكنه لا يثبت مرضًا ولا يفسر سبب ارتفاع النبض.</p></div>
                <a className="download-link" href="/samples/sihha-synthetic-cardiology-brief.pdf" download>تنزيل تقرير القلب التجريبي PDF</a>
              </article>
              <article className="cardiac-questions"><span>أسئلة جاهزة</span><ol><li>هل يلزم ECG أثناء الجهد؟</li><li>ما حدود الشدة الآمنة لحين التقييم؟</li><li>كيف تُقيّم الدهون مع بقية عوامل الخطورة؟</li></ol><small>العينة مصطنعة بالكامل. لا تستخدم هذه الصفحة للطوارئ.</small></article>
            </div>
          )}

          {view === "supplements" && (
            <div className="supplements-view">
              <div className="page-lead"><div><div className="eyebrow">تنظيم لا وصف علاجي</div><h2>خريطة المكملات</h2><p>تجميع مبسّط للعينة مع سبب الاستخدام وملاحظات الحوار مع الصيدلي أو الطبيب.</p></div><div className="group-filter">{groups.map((group) => <button type="button" key={group} className={supplementGroup === group ? "active" : ""} onClick={() => setSupplementGroup(group)}>{group}</button>)}</div></div>
              <div className="supplement-table" role="table" aria-label="جدول المكملات التجريبي">
                <div className="table-row table-head" role="row"><span>المكمّل</span><span>المجموعة</span><span>الغرض المسجّل</span><span>ملاحظة للمراجعة</span></div>
                {filteredSupplements.map((item) => (
                  <div className="table-row" role="row" key={item.name}><strong>{item.name}<small>{item.dose}</small></strong><span><i className="group-dot" />{item.group}</span><span>{item.purpose}</span><span className={item.caution ? "caution" : "quiet"}>{item.caution || "لا توجد ملاحظة في العينة"}</span></div>
                ))}
              </div>
              <div className="safety-note"><b>حدود الأمان</b><span>لا يقترح التطبيق بدء مكمل أو إيقافه أو تغيير جرعته. يعرض ما أدخله المستخدم ويساعده على تحضير أسئلة للمختص.</span></div>
            </div>
          )}

          {view === "report" && (
            <div className="report-layout">
              <article className="report-controls">
                <div className="eyebrow">قابل للطباعة والمشاركة بإرادتك</div><h2>تقرير المختص</h2><p>ملخص قصير يفصل الحقائق عن الملاحظات والأسئلة. لا يُرسل إلى أي جهة تلقائيًا.</p>
                <div className="language-toggle"><button className={briefLanguage === "ar" ? "active" : ""} onClick={() => setBriefLanguage("ar")} type="button">العربية</button><button className={briefLanguage === "en" ? "active" : ""} onClick={() => setBriefLanguage("en")} type="button">English</button></div>
                <button type="button" className="primary full" onClick={() => window.print()}>طباعة / حفظ PDF</button>
                <button type="button" className="full" onClick={() => downloadText("sihha-evidence-brief.md", evidence)}>تنزيل Evidence Brief</button>
                <button type="button" className="full" onClick={async () => { await navigator.clipboard.writeText(evidence); setNotice("نُسخ التقرير إلى الحافظة."); }}>نسخ النص</button>
              </article>
              <article className="report-paper" dir={briefLanguage === "ar" ? "rtl" : "ltr"}><pre>{evidence}</pre></article>
            </div>
          )}

          {view === "privacy" && (
            <div className="privacy-layout">
              <article className="privacy-hero"><div className="lock-orbit">◉</div><div><div className="eyebrow">Privacy by architecture</div><h2>البيانات الصحية لا ينبغي أن تكون ثمن الفائدة.</h2><p>نسخة المسابقة لا تحتوي أي ملف طبي حقيقي. العينة مصطنعة بالكامل، والاستيراد يعمل داخل ذاكرة المتصفح.</p></div></article>
              <article className="privacy-card"><span>01</span><h3>Local-first ZIP</h3><p>يُفك ملف Apple Health ويُقرأ export.xml داخل المتصفح دون رفعه.</p></article>
              <article className="privacy-card"><span>02</span><h3>Sample-safe</h3><p>كل أسماء وقياسات العرض خيالية ومخصّصة للاختبار.</p></article>
              <article className="privacy-card"><span>03</span><h3>User-controlled</h3><p>المستخدم يقرر متى يستورد ومتى يطبع أو ينزّل التقرير.</p></article>
              <article className="privacy-card"><span>04</span><h3>Non-diagnostic</h3><p>تنظيم أدلة وأسئلة فقط؛ لا تشخيص ولا قرار دوائي.</p></article>
              <article className="architecture-card"><div className="flow-step"><b>1</b><span>Apple Health export.zip + labs + supplement log</span></div><i>←</i><div className="flow-step"><b>2</b><span>Local unzip, normalization and rules</span></div><i>←</i><div className="flow-step"><b>3</b><span>Explainable brief</span></div></article>
            </div>
          )}
        </section>

        <footer><span>صحة • تجربة توعوية وليست جهازًا طبيًا</span><span>Built with Codex + GPT‑5.6 for OpenAI Build Week 2026</span></footer>
      </section>
    </main>
  );
}
