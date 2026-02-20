import { useState } from "react";

export interface TripFormValues {
  title: string;
  description: string;
}

interface TripFormTemplateProps {
  initialValues?: Partial<TripFormValues>;
  onSubmit: (values: TripFormValues) => void | Promise<void>;
  submitLabel?: string;
}

export default function TripFormTemplate({
  initialValues = {},
  onSubmit,
  submitLabel = "Save",
}: TripFormTemplateProps) {
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
    <form onSubmit={handleSubmit}>
      <h2>Trip Details</h2>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <label>
        Trip Title
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </label>

      <br />

      <label>
        Description
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
        />
      </label>

      <br />

      <button type="submit">{submitLabel}</button>
    </form>
  );
}
