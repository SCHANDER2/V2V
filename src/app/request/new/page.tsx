"use client";

import React, { useState } from "react";
import axios from "axios";

export default function EmergencyRequestForm() {
  const [patientName, setPatientName] = useState("");
  const [patientUhid, setPatientUhid] = useState("");
  const [hospitalName, setHospitalName] = useState("");
  const [hospitalLat, setHospitalLat] = useState(0);
  const [hospitalLng, setHospitalLng] = useState(0);
  const [component, setComponent] = useState("WHOLE_BLOOD");
  const [requestMode, setRequestMode] = useState("REPLACEMENT_ANY");
  const [unitsNeeded, setUnitsNeeded] = useState(1);
  const [requisitionImage, setRequisitionImage] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app we would OCR the image; here we just send request data.
    const res = await axios.post("/api/request/create", {
      patientName,
      patientUhid,
      hospitalName,
      hospitalLat,
      hospitalLng,
      component,
      requestMode,
      unitsNeeded,
    });
    alert(`Request created. Share link: /r/${res.data.shortHash}`);
  };

  return (
    <main className="max-w-lg mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Emergency Blood Request</h1>
      <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-2 mb-4">
        <strong>Anti‑Tout Warning:</strong> Do not share personal identifiers beyond this form.
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input required placeholder="Patient Name" value={patientName} onChange={e => setPatientName(e.target.value)} className="w-full p-2 border rounded" />
        <input required placeholder="Patient UHID" value={patientUhid} onChange={e => setPatientUhid(e.target.value)} className="w-full p-2 border rounded" />
        <input required placeholder="Hospital Name" value={hospitalName} onChange={e => setHospitalName(e.target.value)} className="w-full p-2 border rounded" />
        <div className="flex space-x-2">
          <input type="number" required placeholder="Hospital Latitude" value={hospitalLat || ""} onChange={e => setHospitalLat(parseFloat(e.target.value))} className="w-1/2 p-2 border rounded" />
          <input type="number" required placeholder="Hospital Longitude" value={hospitalLng || ""} onChange={e => setHospitalLng(parseFloat(e.target.value))} className="w-1/2 p-2 border rounded" />
        </div>
        <select value={component} onChange={e => setComponent(e.target.value)} className="w-full p-2 border rounded">
          <option value="WHOLE_BLOOD">Whole Blood</option>
          <option value="PRBC">PRBC</option>
          <option value="PLASMA">Plasma</option>
          <option value="SDP">Platelet (SDP)</option>
        </select>
        <select value={requestMode} onChange={e => setRequestMode(e.target.value)} className="w-full p-2 border rounded">
          <option value="REPLACEMENT_ANY">Replacement Any</option>
          <option value="EXACT_OR_SDP">Exact or SDP</option>
        </select>
        <input type="number" required min={1} placeholder="Units Needed" value={unitsNeeded} onChange={e => setUnitsNeeded(parseInt(e.target.value))} className="w-full p-2 border rounded" />
        <label className="block">
          Requisition Slip (camera capture required):
          <input type="file" accept="image/*" capture="environment" onChange={e => setRequisitionImage(e.target.files?.[0] || null)} className="mt-1 block w-full" />
        </label>
        <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">Submit Request</button>
      </form>
    </main>
  );
}
