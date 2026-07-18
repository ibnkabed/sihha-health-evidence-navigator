export type DailySignal = {
  date: string;
  steps: number;
  sleep: number;
  workout: number;
  restingHeartRate: number;
};

export type LabTrend = {
  id: string;
  nameAr: string;
  nameEn: string;
  category: string;
  unit: string;
  reference: string;
  status: "review" | "watch" | "good";
  statusLabel: string;
  trend: string;
  clinicianQuestion: string;
  readings: Array<{ date: string; value: number }>;
};

export type Supplement = {
  name: string;
  dose: string;
  group: string;
  purpose: string;
  caution: string;
};

export type HealthDataset = {
  profile: { label: string; ageBand: string; lastSync: string; source: string };
  goals: { steps: number; sleep: number; workoutMinutes: number };
  daily: DailySignal[];
  labs: LabTrend[];
  supplements: Supplement[];
};

const mean = (values: number[]) => values.reduce((total, value) => total + value, 0) / Math.max(values.length, 1);

export function buildHealthSummary(data: HealthDataset) {
  const averageSteps = Math.round(mean(data.daily.map((day) => day.steps)));
  const averageSleep = mean(data.daily.map((day) => day.sleep));
  const workoutMinutes = data.daily.reduce((total, day) => total + day.workout, 0);
  const lastDay = data.daily.at(-1) ?? { steps: 0, sleep: 0, workout: 0, restingHeartRate: 0 };
  const firstWindow = data.daily.slice(0, 3);
  const lastWindow = data.daily.slice(-3);
  const firstSteps = mean(firstWindow.map((day) => day.steps));
  const lastSteps = mean(lastWindow.map((day) => day.steps));
  const firstSleep = mean(firstWindow.map((day) => day.sleep));
  const lastSleep = mean(lastWindow.map((day) => day.sleep));
  const firstHeart = mean(firstWindow.map((day) => day.restingHeartRate).filter(Boolean));
  const lastHeart = mean(lastWindow.map((day) => day.restingHeartRate).filter(Boolean));
  const stepsChange = Math.round((lastSteps - firstSteps) / Math.max(firstSteps, 1) * 100);
  const sleepChange = Number((lastSleep - firstSleep).toFixed(1));
  const heartChange = Math.round(lastHeart - firstHeart);
  const dataChecks = [
    data.daily.length >= 7,
    data.daily.filter((day) => day.steps > 0).length >= 6,
    data.daily.filter((day) => day.sleep > 0).length >= 6,
    data.daily.filter((day) => day.restingHeartRate > 0).length >= 5,
    data.daily.filter((day) => day.workout >= 0).length >= 6,
  ];
  const evidenceQuality = Math.round(dataChecks.filter(Boolean).length / dataChecks.length * 100);
  const todayScore = Math.round(
    Math.min(100, lastDay.steps / data.goals.steps * 100) * 0.3 +
    Math.min(100, lastDay.sleep / data.goals.sleep * 100) * 0.3 +
    Math.min(100, workoutMinutes / data.goals.workoutMinutes * 100) * 0.25 +
    (lastDay.restingHeartRate > 0 ? 100 : 0) * 0.15,
  );
  const highSleep = data.daily.filter((day) => day.sleep >= data.goals.sleep);
  const lowSleep = data.daily.filter((day) => day.sleep < data.goals.sleep);
  const highSleepSteps = mean(highSleep.map((day) => day.steps));
  const lowSleepSteps = mean(lowSleep.map((day) => day.steps));
  const sleepStepLift = Math.max(0, Math.round((highSleepSteps - lowSleepSteps) / Math.max(lowSleepSteps, 1) * 100));
  const reviewLab = data.labs.find((lab) => lab.status === "review");

  return {
    averageSteps,
    averageSleep,
    workoutMinutes,
    todayScore,
    evidenceQuality,
    sleepStepLift,
    changes: { steps: stepsChange, sleep: sleepChange, restingHeartRate: heartChange },
    todayReasons: [
      `الخطوات ${Math.round(lastDay.steps / Math.max(data.goals.steps, 1) * 100)}% من الهدف اليومي.`,
      `النوم ${lastDay.sleep.toFixed(1)} من ${data.goals.sleep} ساعات.`,
      `النشاط الأسبوعي ${workoutMinutes} من ${data.goals.workoutMinutes} دقيقة.`,
    ],
    priorities: [
      {
        title: averageSteps < data.goals.steps ? "الحركة دون الهدف" : "الحركة ضمن الهدف",
        detail: `متوسط ${averageSteps.toLocaleString("en-US")} خطوة خلال سبعة أيام مقابل هدف ${data.goals.steps.toLocaleString("en-US")}.`,
        source: "Smartwatch",
      },
      {
        title: averageSleep < data.goals.sleep ? "النوم يحتاج انتظامًا" : "النوم ضمن الهدف",
        detail: `متوسط النوم ${averageSleep.toFixed(1)} ساعة، مع اختلاف واضح بين أيام الأسبوع.`,
        source: "Sleep log",
      },
      {
        title: reviewLab ? `مراجعة اتجاه ${reviewLab.nameAr}` : "الاتجاهات المخبرية مستقرة",
        detail: reviewLab ? `${reviewLab.trend} — جهّز السؤال المقترح قبل الموعد.` : "لا توجد إشارة مصنفة للمراجعة في العينة.",
        source: "Lab trend",
      },
    ],
  };
}

export function buildJudgeEvidence(data: HealthDataset, language: "ar" | "en") {
  const summary = buildHealthSummary(data);
  const reviewLabs = data.labs.filter((lab) => lab.status !== "good");
  const cautions = data.supplements.filter((item) => item.caution);
  if (language === "en") {
    return `# Sihha — Clinician Conversation Brief\n\nProfile: ${data.profile.label} (${data.profile.ageBand})\nData window: ${data.daily[0]?.date}–${data.daily.at(-1)?.date}\nSources: ${data.profile.source}\n\n## Evidence quality\n- Routine evidence quality: ${summary.evidenceQuality}%\n- Today routine score: ${summary.todayScore}/100 (a motivational routine signal, not a medical readiness score)\n\n## Routine signals\n- Average steps: ${summary.averageSteps.toLocaleString("en-US")} / ${data.goals.steps.toLocaleString("en-US")} daily target\n- Average sleep: ${summary.averageSleep.toFixed(1)} / ${data.goals.sleep} hours\n- Active minutes: ${summary.workoutMinutes} / ${data.goals.workoutMinutes} weekly target\n- First vs latest three-day windows: steps ${summary.changes.steps >= 0 ? "+" : ""}${summary.changes.steps}%, sleep ${summary.changes.sleep >= 0 ? "+" : ""}${summary.changes.sleep} h, resting heart rate ${summary.changes.restingHeartRate >= 0 ? "+" : ""}${summary.changes.restingHeartRate} bpm.\n\n## Lab trends to discuss\n${reviewLabs.map((lab) => `- ${lab.nameEn}: ${lab.trend}. Latest ${lab.readings.at(-1)?.value} ${lab.unit}; reference ${lab.reference}. Question: ${lab.clinicianQuestion}`).join("\n")}\n\n## Supplement review prompts\n${cautions.map((item) => `- ${item.name} (${item.dose}): ${item.caution}`).join("\n")}\n\n## Safety boundary\nThis brief organizes user-provided evidence. It does not diagnose, prescribe, or recommend starting, stopping, or changing treatment. All records in this demo are synthetic.`;
  }
  return `# صحة — موجز المحادثة مع المختص\n\nالملف: ${data.profile.label} (${data.profile.ageBand})\nالفترة: ${data.daily[0]?.date}–${data.daily.at(-1)?.date}\nالمصادر: ${data.profile.source}\n\n## جودة الأدلة\n- جودة بيانات الروتين: ${summary.evidenceQuality}%\n- مؤشر اليوم: ${summary.todayScore}/100 (إشارة تحفيزية للروتين وليست جاهزية طبية)\n\n## مؤشرات الروتين\n- متوسط الخطوات: ${summary.averageSteps.toLocaleString("en-US")} من هدف ${data.goals.steps.toLocaleString("en-US")} يوميًا\n- متوسط النوم: ${summary.averageSleep.toFixed(1)} من هدف ${data.goals.sleep} ساعات\n- الدقائق النشطة: ${summary.workoutMinutes} من هدف ${data.goals.workoutMinutes} أسبوعيًا\n- التغير بين أول وآخر ثلاثة أيام: الخطوات ${summary.changes.steps >= 0 ? "+" : ""}${summary.changes.steps}%، النوم ${summary.changes.sleep >= 0 ? "+" : ""}${summary.changes.sleep} ساعة، نبض الراحة ${summary.changes.restingHeartRate >= 0 ? "+" : ""}${summary.changes.restingHeartRate} bpm.\n\n## اتجاهات مخبرية للنقاش\n${reviewLabs.map((lab) => `- ${lab.nameAr}: ${lab.trend}. آخر قراءة ${lab.readings.at(-1)?.value} ${lab.unit}؛ المرجع ${lab.reference}. السؤال: ${lab.clinicianQuestion}`).join("\n")}\n\n## أسئلة مراجعة المكملات\n${cautions.map((item) => `- ${item.name} (${item.dose}): ${item.caution}`).join("\n")}\n\n## حدود الأمان\nهذا الموجز ينظم الأدلة التي أدخلها المستخدم. لا يشخّص ولا يصف علاجًا ولا يقترح بدء دواء أو مكمل أو إيقافه أو تغيير جرعته. جميع بيانات العرض مصطنعة.`;
}
