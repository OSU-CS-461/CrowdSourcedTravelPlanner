import { useState } from "react";
import "./TripForm.css";

export interface TripFormValues {
  title: string;
  description: string;
  startDate?: string;
  endDate?: string;
}

interface TripFormProps {
  initialValues?: Partial<TripFormValues>;
  onSubmit: (values: TripFormValues) => void | Promise<void>;
  submitLabel?: string;
}

export default function TripForm({
  initialValues = {},
  onSubmit,
  submitLabel = "Save",
}: TripFormProps) {
  const [title, setTitle] = useState(initialValues.title ?? "");
  const [description, setDescription] = useState(initialValues.description ?? "");
  const [startDate, setStartDate] = useState(initialValues.startDate ?? "");
  const [endDate, setEndDate] = useState(initialValues.endDate ?? "");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim()) {
      setError("Trip title is required.");
      return;
    }

    const payload: TripFormValues = {
      title: title.trim(),
      description: description.trim(),
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    };

    try {
      await onSubmit(payload);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Something went wrong while saving the trip.");
    }
  }

  return (
    <form className="exp-form" onSubmit={handleSubmit}>
      
      <h2 className="exp-form-title">Trip Details</h2>

      <section className="exp-form-section">

        {error && <p className="exp-form-error">{error}</p>}

        <div className="exp-form-grid">

          <label className="exp-form-field exp-full">
            <span>Trip Title</span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </label>
          <label className="exp-form-field">
            <span>Start Date</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </label>

          <label className="exp-form-field">
            <span>End Date</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </label>

          <label className="exp-form-field exp-full">
            <span>Description</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </label>


        </div>

      </section>

      <div className="exp-form-actions">
        <button type="submit">{submitLabel}</button>
      </div>

    </form>
  );
}