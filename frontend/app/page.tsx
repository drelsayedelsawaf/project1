"use client";

import { Activity, HeartPulse, Loader2, RotateCcw, Send, Syringe } from "lucide-react";
import { ChangeEvent, FormEvent, useMemo, useState } from "react";

type Gender = "Female" | "Male";
type PhysicalActivity = "Low" | "Medium" | "High";

type FormState = {
  age: number;
  gender: Gender;
  bmi: number;
  fasting_glucose: number;
  hba1c: number;
  insulin: number;
  triglycerides: number;
  hdl: number;
  ldl: number;
  blood_pressure: number;
  physical_activity: PhysicalActivity;
};

type PredictionResponse = {
  prediction: number;
  label: string;
  probability: number;
  confidence: number;
  cholesterol_ratio: number;
  probabilities: Record<string, number>;
  model_input: Record<string, number>;
};

const defaultForm: FormState = {
  age: 54,
  gender: "Male",
  bmi: 26,
  fasting_glucose: 105,
  hba1c: 5.5,
  insulin: 24,
  triglycerides: 206,
  hdl: 36,
  ldl: 126,
  blood_pressure: 136,
  physical_activity: "Medium",
};

const examples: Record<string, FormState> = {
  "Low-risk example": {
    age: 32,
    gender: "Female",
    bmi: 22.5,
    fasting_glucose: 88,
    hba1c: 4.9,
    insulin: 9,
    triglycerides: 165,
    hdl: 48,
    ldl: 105,
    blood_pressure: 118,
    physical_activity: "High",
  },
  "High-risk example": {
    age: 62,
    gender: "Male",
    bmi: 34,
    fasting_glucose: 155,
    hba1c: 7.1,
    insulin: 35,
    triglycerides: 245,
    hdl: 32,
    ldl: 150,
    blood_pressure: 150,
    physical_activity: "Low",
  },
};

const fieldGroups = [
  {
    title: "Patient Profile",
    icon: Activity,
    fields: [
      { name: "age", label: "Age", min: 19, max: 90, step: 1, unit: "years" },
      { name: "bmi", label: "Body mass index", min: 10, max: 55, step: 0.1, unit: "BMI" },
    ],
  },
  {
    title: "Blood Markers",
    icon: Syringe,
    fields: [
      { name: "fasting_glucose", label: "Fasting glucose", min: 60, max: 260, step: 0.1, unit: "mg/dL" },
      { name: "hba1c", label: "HbA1c", min: 2, max: 12.5, step: 0.1, unit: "%" },
      { name: "insulin", label: "Insulin", min: 2, max: 45, step: 0.1, unit: "uIU/mL" },
    ],
  },
  {
    title: "Cardiometabolic Markers",
    icon: HeartPulse,
    fields: [
      { name: "triglycerides", label: "Triglycerides", min: 80, max: 350, step: 0.1, unit: "mg/dL" },
      { name: "hdl", label: "HDL", min: 10, max: 80, step: 0.1, unit: "mg/dL" },
      { name: "ldl", label: "LDL", min: 50, max: 230, step: 0.1, unit: "mg/dL" },
      { name: "blood_pressure", label: "Blood pressure", min: 80, max: 210, step: 0.1, unit: "mmHg" },
    ],
  },
] as const;

const genderLabels: Record<Gender, string> = {
  Female: "Female",
  Male: "Male",
};

const activityLabels: Record<PhysicalActivity, string> = {
  Low: "Low",
  Medium: "Medium",
  High: "High",
};

function percent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

function getErrorMessage(body: unknown) {
  if (
    body &&
    typeof body === "object" &&
    "detail" in body
  ) {
    const detail = (body as { detail?: unknown }).detail;

    if (typeof detail === "string") {
      return detail;
    }

    if (Array.isArray(detail)) {
      return detail
        .map((item) => {
          if (item && typeof item === "object" && "msg" in item) {
            return String((item as { msg: unknown }).msg);
          }

          return String(item);
        })
        .join(" ");
    }
  }

  return "The prediction request could not be completed.";
}

export default function Home() {
  const [form, setForm] = useState<FormState>(defaultForm);
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const cholesterolRatio = useMemo(() => form.ldl / form.hdl, [form.hdl, form.ldl]);

  function updateNumber(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: Number(value) }));
    setResult(null);
    setError("");
  }

  function selectGender(value: Gender) {
    setForm((current) => ({ ...current, gender: value }));
    setResult(null);
    setError("");
  }

  function selectActivity(value: PhysicalActivity) {
    setForm((current) => ({ ...current, physical_activity: value }));
    setResult(null);
    setError("");
  }

  async function requestPrediction(payload: FormState) {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(getErrorMessage(await response.json().catch(() => null)));
      }

      setResult((await response.json()) as PredictionResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  async function submitPrediction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await requestPrediction(form);
  }

  async function applyExample(values: FormState) {
    const nextForm = { ...values };
    setForm(nextForm);
    await requestPrediction(nextForm);
  }

  const riskTone = result?.prediction ? "risk-high" : "risk-low";

  return (
    <main className="shell">
      <section className="intro">
        <div>
          <p className="eyebrow">Research Grade Type 2 Model</p>
          <h1>Insulin Resistance Predictor</h1>
          <p className="subtitle">
            A production-ready Next.js interface for the trained logistic regression model,
            backed by FastAPI on the same Vercel project.
          </p>
        </div>
        <div className="status-pill">
          <span />
          Ready for Vercel
        </div>
      </section>

      <form className="workspace" onSubmit={submitPrediction}>
        <section className="form-panel" aria-label="Model inputs">
          <div className="choice-grid">
            <div className="control-block">
              <label>Gender</label>
              <div className="segmented">
                {(Object.keys(genderLabels) as Gender[]).map((value) => (
                  <button
                    className={form.gender === value ? "active" : ""}
                    key={value}
                    onClick={() => selectGender(value)}
                    type="button"
                  >
                    {genderLabels[value]}
                  </button>
                ))}
              </div>
            </div>

            <div className="control-block">
              <label>Physical activity</label>
              <div className="segmented">
                {(Object.keys(activityLabels) as PhysicalActivity[]).map((value) => (
                  <button
                    className={form.physical_activity === value ? "active" : ""}
                    key={value}
                    onClick={() => selectActivity(value)}
                    type="button"
                  >
                    {activityLabels[value]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {fieldGroups.map((group) => {
            const Icon = group.icon;
            return (
              <fieldset key={group.title}>
                <legend>
                  <Icon aria-hidden="true" size={18} />
                  {group.title}
                </legend>
                <div className="fields-grid">
                  {group.fields.map((field) => (
                    <label className="range-field" key={field.name}>
                      <span>
                        {field.label}
                        <strong>
                          {form[field.name as keyof FormState]} {field.unit}
                        </strong>
                      </span>
                      <input
                        max={field.max}
                        min={field.min}
                        name={field.name}
                        onChange={updateNumber}
                        step={field.step}
                        type="range"
                        value={form[field.name]}
                      />
                    </label>
                  ))}
                </div>
              </fieldset>
            );
          })}

          <div className="actions">
            <button className="primary-button" disabled={loading} type="submit">
              {loading ? <Loader2 className="spin" size={18} /> : <Send size={18} />}
              Predict
            </button>
            <button
              className="ghost-button"
              onClick={() => {
                setForm(defaultForm);
                setResult(null);
                setError("");
              }}
              type="button"
              title="Reset"
            >
              <RotateCcw size={18} />
            </button>
          </div>
        </section>

        <aside className="result-panel" aria-label="Model result">
          <div className="quick-examples">
            {Object.entries(examples).map(([label, values]) => (
              <button disabled={loading} key={label} onClick={() => void applyExample(values)} type="button">
                {label}
              </button>
            ))}
          </div>

          {error ? <div className="error">{error}</div> : null}

          <div className={`risk-box ${result ? riskTone : ""}`}>
            <p>Result</p>
            <h2>
              {result
                ? result.prediction
                  ? "Insulin resistance likely"
                  : "Insulin resistance unlikely"
                : "Enter patient data and run prediction"}
            </h2>
            <div className="probability">
              {result ? percent(result.probability) : "--"}
            </div>
          </div>

          <div className="metric-grid">
            <div>
              <span>Model confidence</span>
              <strong>{result ? percent(result.confidence) : "--"}</strong>
            </div>
            <div>
              <span>LDL / HDL ratio</span>
              <strong>{(result?.cholesterol_ratio ?? cholesterolRatio).toFixed(2)}</strong>
            </div>
          </div>

          <div className="probability-bars">
            <div>
              <span>No insulin resistance</span>
              <strong>{result ? percent(result.probabilities["No insulin resistance"]) : "--"}</strong>
              <i style={{ width: result ? percent(result.probabilities["No insulin resistance"]) : "0%" }} />
            </div>
            <div>
              <span>Insulin resistance</span>
              <strong>{result ? percent(result.probabilities["Insulin resistance"]) : "--"}</strong>
              <i style={{ width: result ? percent(result.probabilities["Insulin resistance"]) : "0%" }} />
            </div>
          </div>

          {result ? (
            <details>
              <summary>Model input row</summary>
              <pre>{JSON.stringify(result.model_input, null, 2)}</pre>
            </details>
          ) : null}
        </aside>
      </form>
    </main>
  );
}
