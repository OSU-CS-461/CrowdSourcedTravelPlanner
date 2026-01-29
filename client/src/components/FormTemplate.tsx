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
        Description (minimum 20 characters)
        <textarea
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          minLength={20}
          required
        />
        <small style={{ color: "gray", fontSize: "0.9em" }}>
          {description.length}/20 minimum characters
        </small>
      </label>

      <br />

      <h3>Location</h3>

      <label>
        Country (ISO Code - 2 letters, e.g., US, GB, CN)
        <input
          type="text"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          placeholder="US"
          maxLength={2}
          required
        />
        <small style={{ color: "gray", fontSize: "0.9em" }}>
          Use 2-letter country code (US, GB, CN, etc.)
        </small>
      </label>

      <br />

      <label>
        State / Region (optional)
        <input
          type="text"
          value={adminRegion}
          onChange={(e) => setAdminRegion(e.target.value)}
        />
      </label>

      <br />

      <label>
        City (optional - required if street/postal code provided)
        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />
      </label>

      <br />

      <label>
        Street (optional - required if postal code provided)
        <input
          type="text"
          value={street}
          onChange={(e) => setStreet(e.target.value)}
        />
      </label>

      <br />

      <label>
        Postal Code (optional - requires street, city, and region)
        <input
          type="text"
          value={postalCode}
          onChange={(e) => setPostalCode(e.target.value)}
        />
      </label>

      <br />

      <label>
        Latitude (optional - must provide both or neither)
        <input
          type="text"
          value={latitude}
          onChange={(e) => setLatitude(e.target.value)}
          placeholder="e.g. 37.7749"
        />
      </label>

      <br />

      <label>
        Longitude (optional - must provide both or neither)
        <input
          type="text"
          value={longitude}
          onChange={(e) => setLongitude(e.target.value)}
          placeholder="-122.4194"
        />
      </label>

      <br />

      <label>
        Image URL (optional)
        <input
          type="text"
          value={image}
          onChange={(e) => setImage(e.target.value)}
          placeholder="https://example.com/image.jpg"
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
        Keywords (comma separated, optional)
        <input
          type="text"
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          placeholder="adventure, beach, food"
        />
      </label>

      <br />

      <button type="submit">{submitLabel}</button>
    </form>
  );
}
