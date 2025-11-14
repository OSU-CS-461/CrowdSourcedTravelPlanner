import { useState } from "react";

export interface FormValues {
  title: string;
  description: string;
  date: string;
  image: string;
  keywords: string;
  country: string;
  adminRegion: string;
  city: string;
  street: string;
  postalCode: string;
  latitude: string;
  longitude: string;
}

interface FormTemplateProps {
  initialValues?: Partial<FormValues>;
  onSubmit: (values: FormValues) => void | Promise<void>;
  submitLabel?: string;
}

export default function FormTemplate({
  initialValues = {},
  onSubmit,
  submitLabel = "Save",
}: FormTemplateProps) {
  const [title, setTitle] = useState(initialValues.title ?? "");
  const [description, setDescription] = useState(initialValues.description ?? "");
  const [date, setDate] = useState(initialValues.date ?? "");
  const [error, setError] = useState("");

  const [image, setImage] = useState(initialValues.image ?? "");
  const [keywords, setKeywords] = useState(initialValues.keywords ?? "");

  const [country, setCountry] = useState(initialValues.country ?? "");
  const [adminRegion, setAdminRegion] = useState(initialValues.adminRegion ?? "");
  const [city, setCity] = useState(initialValues.city ?? "");
  const [street, setStreet] = useState(initialValues.street ?? "");
  const [postalCode, setPostalCode] = useState(initialValues.postalCode ?? "");
  const [latitude, setLatitude] = useState(initialValues.latitude ?? "");
  const [longitude, setLongitude] = useState(initialValues.longitude ?? "");

  // Handle form submission
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim() || !description.trim()) {
      setError("Please fill in all required fields.");
      return;
    }

    const payload: FormValues = {
      title: title.trim(),
      description: description.trim(),
      date,
      image: image.trim(),
      keywords: keywords.trim(),
      country: country.trim(),
      adminRegion: adminRegion.trim(),
      city: city.trim(),
      street: street.trim(),
      postalCode: postalCode.trim(),
      latitude: latitude.trim(),
      longitude: longitude.trim(),
    };

    try {
      await onSubmit(payload);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Something went wrong while saving. Please try again.");
    }
  }

// Form Layout
  return (
    <form onSubmit={handleSubmit}>
      <h2>Experience Details</h2>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <label>
        Title
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
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </label>

      <br />

      <label>
        Date
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </label>

      <br />

      <h3>Location</h3>

      <label>
        Country
        <input
          type="text"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          required
        />
      </label>

      <br />

      <label>
        State / Region
        <input
          type="text"
          value={adminRegion}
          onChange={(e) => setAdminRegion(e.target.value)}
          required
        />
      </label>

      <br />

      <label>
        City
        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          required
        />
      </label>

      <br />

      <label>
        Street
        <input
          type="text"
          value={street}
          onChange={(e) => setStreet(e.target.value)}
          required
        />
      </label>

      <br />

      <label>
        Postal Code
        <input
          type="text"
          value={postalCode}
          onChange={(e) => setPostalCode(e.target.value)}
          required
        />
      </label>

      <br />

      <label>
        Latitude
        <input
          type="text"
          value={latitude}
          onChange={(e) => setLatitude(e.target.value)}
          placeholder="e.g. 37.7749"
          required
        />
      </label>

      <br />

      <label>
        Longitude
        <input
          type="text"
          value={longitude}
          onChange={(e) => setLongitude(e.target.value)}
          placeholder="-122.4194"
          required
        />
      </label>

      <br />

      <label>
        Image URL
        <input
          type="text"
          value={image}
          onChange={(e) => setImage(e.target.value)}
          placeholder="https://example.com/image.jpg"
          required
        />
      </label>

      {image && (
        <div style={{ marginTop: "10px" }}>
          <p>Image preview:</p>
          <img
            src={image}
            alt="Preview"
            style={{ maxWidth: "300px", maxHeight: "200px" }}
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        </div>
      )}

      <br />

      <label>
        Keywords (comma separated)
        <input
          type="text"
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          placeholder="adventure, beach, food"
          required
        />
      </label>

      <br />

      <button type="submit">{submitLabel}</button>
    </form>
  );
}
