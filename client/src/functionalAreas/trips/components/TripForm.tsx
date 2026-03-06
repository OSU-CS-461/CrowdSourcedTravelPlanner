import { useState } from "react";

export interface TripFormValues {
  title: string;
  description: string;
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

          <label className="exp-form-field">
            <span>Trip Title</span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </label>

          <label className="exp-form-field">
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