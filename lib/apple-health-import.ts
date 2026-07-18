import { strFromU8, unzipSync } from "fflate";
import type { DailySignal, HealthDataset } from "./health-engine";

const STEP_TYPE = "HKQuantityTypeIdentifierStepCount";
const SLEEP_TYPE = "HKCategoryTypeIdentifierSleepAnalysis";
const RESTING_HEART_TYPE = "HKQuantityTypeIdentifierRestingHeartRate";
const EXERCISE_TYPE = "HKQuantityTypeIdentifierAppleExerciseTime";

type DayBucket = {
  date: Date;
  steps: number;
  sleep: number;
  workout: number;
  restingHeartRates: number[];
};

function dayKey(raw: string) {
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.valueOf())) return null;
  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}-${String(parsed.getDate()).padStart(2, "0")}`;
}

function minutesBetween(start: string, end: string) {
  const startTime = new Date(start).valueOf();
  const endTime = new Date(end).valueOf();
  if (!Number.isFinite(startTime) || !Number.isFinite(endTime) || endTime <= startTime) return 0;
  return (endTime - startTime) / 60000;
}

function arabicDayLabel(date: Date) {
  return new Intl.DateTimeFormat("ar-SA", { day: "numeric", month: "short" }).format(date);
}

export function parseAppleHealthXml(xml: string): DailySignal[] {
  const document = new DOMParser().parseFromString(xml, "application/xml");
  if (document.querySelector("parsererror")) throw new Error("تعذر قراءة export.xml داخل الملف المضغوط.");

  const buckets = new Map<string, DayBucket>();
  const ensureBucket = (key: string, rawDate: string) => {
    if (!buckets.has(key)) {
      buckets.set(key, { date: new Date(rawDate), steps: 0, sleep: 0, workout: 0, restingHeartRates: [] });
    }
    return buckets.get(key)!;
  };

  document.querySelectorAll("Record").forEach((record) => {
    const type = record.getAttribute("type") ?? "";
    if (![STEP_TYPE, SLEEP_TYPE, RESTING_HEART_TYPE, EXERCISE_TYPE].includes(type)) return;
    const start = record.getAttribute("startDate") ?? "";
    const end = record.getAttribute("endDate") ?? start;
    const key = dayKey(start);
    if (!key) return;
    const bucket = ensureBucket(key, start);
    const value = Number(record.getAttribute("value"));

    if (type === STEP_TYPE && Number.isFinite(value)) bucket.steps += value;
    if (type === RESTING_HEART_TYPE && Number.isFinite(value)) bucket.restingHeartRates.push(value);
    if (type === EXERCISE_TYPE && Number.isFinite(value)) bucket.workout += value;
    if (type === SLEEP_TYPE && (record.getAttribute("value") ?? "").includes("Asleep")) {
      bucket.sleep += minutesBetween(start, end) / 60;
    }
  });

  document.querySelectorAll("Workout").forEach((workout) => {
    const start = workout.getAttribute("startDate") ?? "";
    const key = dayKey(start);
    if (!key) return;
    const bucket = ensureBucket(key, start);
    const duration = Number(workout.getAttribute("duration"));
    const unit = workout.getAttribute("durationUnit") ?? "min";
    if (Number.isFinite(duration)) bucket.workout += unit.toLowerCase().startsWith("hour") ? duration * 60 : duration;
  });

  const days = Array.from(buckets.values()).sort((a, b) => a.date.valueOf() - b.date.valueOf()).slice(-7);
  if (!days.length) throw new Error("لم نجد سجلات خطوات أو نوم أو نبض أو تمارين في ملف Apple Health.");

  return days.map((day) => ({
    date: arabicDayLabel(day.date),
    steps: Math.round(day.steps),
    sleep: Number(day.sleep.toFixed(1)),
    workout: Math.round(day.workout),
    restingHeartRate: day.restingHeartRates.length
      ? Math.round(day.restingHeartRates.reduce((sum, value) => sum + value, 0) / day.restingHeartRates.length)
      : 0,
  }));
}

export async function importLocalHealthFile(file: File, base: HealthDataset): Promise<HealthDataset> {
  if (file.name.toLowerCase().endsWith(".json")) {
    const candidate = JSON.parse(await file.text()) as HealthDataset;
    if (!candidate.profile || !Array.isArray(candidate.daily) || !Array.isArray(candidate.labs)) {
      throw new Error("ملف JSON لا يطابق تنسيق صحة.");
    }
    return candidate;
  }

  if (!file.name.toLowerCase().endsWith(".zip")) throw new Error("استخدم ملف Apple Health ZIP أو ملف صحة JSON.");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const entries = unzipSync(bytes, {
    filter: (entry) => entry.name.toLowerCase().endsWith("export.xml"),
  });
  const exportEntry = Object.entries(entries).find(([name]) => name.toLowerCase().endsWith("export.xml"));
  if (!exportEntry) throw new Error("لم نجد export.xml داخل ملف Apple Health المضغوط.");
  const daily = parseAppleHealthXml(strFromU8(exportEntry[1]));

  return {
    ...base,
    profile: {
      ...base.profile,
      label: "ملف مستورد محليًا",
      lastSync: new Intl.DateTimeFormat("ar-SA", { dateStyle: "medium" }).format(new Date()),
      source: "Apple Health export.zip — تمت المعالجة داخل المتصفح",
    },
    daily,
  };
}
