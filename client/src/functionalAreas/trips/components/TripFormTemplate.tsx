import { useState } from "react";

export interface TripFormValues {
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  visibility: "private" | "public" | "unlisted";
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
  const [destination, setDestination] = useState(
    initialValues.destination ?? ""
  );
  const [startDate, setStartDate] = useState(initialValues.startDate ?? "");
  const [endDate, setEndDate] = useState(initialValues.endDate ?? "");
  const [visibility, setVisibility] =
    useState<TripFormValues["visibility"]>(
      initialValues.visibility ?? "private"
    );

  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim() || !destination.trim()) {
      setError("Please fill in all required fields.");
      return;
    }

    if (startDate > endDate) {
      setError("End date cannot be before start date.");
      return;
    }

    const payload: TripFormValues = {
      title: title.trim(),
      destination: destination.trim(),
      startDate,
      endDate,
      visibility,
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
        Destination
        <input
          type="text"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          required
        />
      </label>

      <br />

      <label>
        Start Date
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          required
        />
      </label>

      <br />

      <label>
        End Date
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          required
        />
      </label>

      <br />

      <label>
        Visibility
        <select
          value={visibility}
          onChange={(e) =>
            setVisibility(e.target.value as TripFormValues["visibility"])
          }
        >
          <option value="private">Private</option>
          <option value="public">Public</option>
          <option value="unlisted">Unlisted</option>
        </select>
      </label>

      <br />

      <button type="submit">{submitLabel}</button>
    </form>
  );
}
