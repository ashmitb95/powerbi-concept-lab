import { useState, useEffect } from "react";
import { Compass, Database, BookOpen, GraduationCap, Zap } from "lucide-react";
import "./App.css";
import { c } from "./theme.js";
import { DATASETS } from "./data/datasets.js";
import { datasetFromCsv } from "./lib/csv.js";
import { useLocalStorage } from "./lib/store.js";
import { GuideMeButton } from "./ui.jsx";
import { DatasetPicker, DatasetHome, ConceptLesson, SetupTutor, StartHere } from "./features.jsx";
import { Reference } from "./reference.jsx";

const NAV = [
  { id: "start", label: "Start here", icon: Compass },
  { id: "datasets", label: "Datasets", icon: Database },
  { id: "reference", label: "Reference", icon: BookOpen },
  { id: "tutor", label: "Tutor", icon: GraduationCap },
];

export default function App() {
  const [tab, setTab] = useLocalStorage("pbil.tab", "start");
  const [progress, setProgress] = useLocalStorage("pbil.progress", {}); // "dsId/conceptId" -> true
  const [datasets, setDatasets] = useState(DATASETS);
  const [dsId, setDsId] = useState(null);
  const [concept, setConcept] = useState(null);

  const ds = datasets.find((d) => d.id === dsId) || null;

  // Mark a lesson explored whenever one is open.
  useEffect(() => {
    if (tab === "datasets" && ds && concept) {
      const key = `${ds.id}/${concept}`;
      setProgress((p) => (p[key] ? p : { ...p, [key]: true }));
    }
  }, [tab, ds, concept, setProgress]);

  async function handleUpload(file) {
    const built = await datasetFromCsv(file);
    setDatasets((prev) => [...prev.filter((d) => d.id !== built.id), built]);
    return built;
  }

  function goLesson(id, conceptId) {
    setDsId(id);
    setConcept(conceptId);
    setTab("datasets");
  }

  return (
    <div className="w-full min-h-screen p-3 md:p-6" style={{ background: c.canvas, color: c.ink, fontFamily: c.fontSans }}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-1.5">
          <button onClick={() => setTab("start")} className="flex items-center gap-3 text-left">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: c.rust }}><Zap size={18} color="#fff" /></div>
            <div>
              <div className="text-lg font-bold leading-tight">Power BI Concept Lab</div>
              <div className="text-xs" style={{ color: c.muted }}>Pick your data · learn the concept on it · open it in Power BI · get unstuck</div>
            </div>
          </button>
          <GuideMeButton variant="top" />
        </div>

        {/* Nav */}
        <div className="flex gap-1.5 my-4 flex-wrap">
          {NAV.map((n) => {
            const Icon = n.icon;
            const active = tab === n.id;
            return (
              <button key={n.id} onClick={() => setTab(n.id)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition" style={{ background: active ? c.ink : c.paper, color: active ? "#fff" : c.ink, border: `1px solid ${active ? c.ink : c.line}` }}>
                <Icon size={14} /> {n.label}
              </button>
            );
          })}
        </div>

        {/* Routes */}
        {tab === "start" && <StartHere progress={progress} onStart={goLesson} onBrowse={() => setTab("datasets")} onTutor={() => setTab("tutor")} />}
        {tab === "datasets" && (
          concept && ds ? (
            <ConceptLesson ds={ds} conceptId={concept} onBack={() => setConcept(null)} />
          ) : ds ? (
            <DatasetHome ds={ds} progress={progress} onConcept={setConcept} onBack={() => setDsId(null)} />
          ) : (
            <DatasetPicker datasets={datasets} onPick={(d) => { setDsId(d.id); setConcept(null); }} onUpload={handleUpload} />
          )
        )}
        {tab === "reference" && <Reference />}
        {tab === "tutor" && <SetupTutor ds={ds} />}
      </div>
    </div>
  );
}
