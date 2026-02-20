import { useEffect, useMemo, useState } from "react";
import LocationPicker from "./LocationPicker";
import type { LocationValue } from "./LocationPicker";

export interface LocationFields {
  country: string;
  adminRegion: string;
  city: string;
  street: string;
  postalCode: string;
  latitude: string;
  longitude: string;
}

interface LocationSelectionProps {
  initialValue?: Partial<LocationFields>;
  onChange: (location: LocationFields) => void;
}

const EMPTY_LOCATION: LocationFields = {
  country: "",
  adminRegion: "",
  city: "",
  street: "",
  postalCode: "",
  latitude: "",
  longitude: "",
};

function buildInitialLocation(
  initialValue: Partial<LocationFields> | undefined
): LocationFields {
  return {
    country: initialValue?.country ?? "",
    adminRegion: initialValue?.adminRegion ?? "",
    city: initialValue?.city ?? "",
    street: initialValue?.street ?? "",
    postalCode: initialValue?.postalCode ?? "",
    latitude: initialValue?.latitude ?? "",
    longitude: initialValue?.longitude ?? "",
  };
}

export default function LocationSelection({
  initialValue,
  onChange,
}: LocationSelectionProps) {
  const [location, setLocation] = useState<LocationFields>(() =>
    buildInitialLocation(initialValue)
  );

  useEffect(() => {
    onChange(location);
  }, [location, onChange]);

  const locationValue = useMemo<LocationValue | null>(() => {
    const latitude = Number(location.latitude);
    const longitude = Number(location.longitude);

    if (
      !location.latitude.trim() ||
      !location.longitude.trim() ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {
      return null;
    }

    return {
      country: location.country.trim().toUpperCase(),
      adminRegion: location.adminRegion.trim() || undefined,
      city: location.city.trim() || undefined,
      street: location.street.trim() || undefined,
      postalCode: location.postalCode.trim() || undefined,
      latitude,
      longitude,
      displayName: undefined,
    };
  }, [location]);

  function setField<K extends keyof LocationFields>(field: K, value: string) {
    setLocation((current) => ({ ...current, [field]: value }));
  }

  function applyLocation(nextLocation: LocationValue | null) {
    if (!nextLocation) {
      setLocation(EMPTY_LOCATION);
      return;
    }

    setLocation({
      country: nextLocation.country ?? "",
      adminRegion: nextLocation.adminRegion ?? "",
      city: nextLocation.city ?? "",
      street: nextLocation.street ?? "",
      postalCode: nextLocation.postalCode ?? "",
      latitude: String(nextLocation.latitude),
      longitude: String(nextLocation.longitude),
    });
  }

  return (
    <section className="exp-form-section">
      <h3 className="exp-form-section-title">Location</h3>

      <div className="exp-location-layout">
        <div className="exp-location-fields">
          <div className="exp-form-grid">
            <label className="exp-form-field">
              <span>Country</span>
              <input
                type="text"
                value={location.country}
                onChange={(e) =>
                  setField("country", e.target.value.toUpperCase().slice(0, 2))
                }
                maxLength={2}
                required
              />
            </label>

            <label className="exp-form-field">
              <span>State / Region</span>
              <input
                type="text"
                value={location.adminRegion}
                onChange={(e) => setField("adminRegion", e.target.value)}
              />
            </label>

            <label className="exp-form-field">
              <span>City</span>
              <input
                type="text"
                value={location.city}
                onChange={(e) => setField("city", e.target.value)}
              />
            </label>

            <label className="exp-form-field">
              <span>Street</span>
              <input
                type="text"
                value={location.street}
                onChange={(e) => setField("street", e.target.value)}
              />
            </label>

            <label className="exp-form-field">
              <span>Postal Code</span>
              <input
                type="text"
                value={location.postalCode}
                onChange={(e) => setField("postalCode", e.target.value)}
              />
            </label>

            <label className="exp-form-field">
              <span>Latitude</span>
              <input
                type="text"
                value={location.latitude}
                onChange={(e) => setField("latitude", e.target.value)}
                placeholder="e.g. 37.7749"
                required
              />
            </label>

            <label className="exp-form-field">
              <span>Longitude</span>
              <input
                type="text"
                value={location.longitude}
                onChange={(e) => setField("longitude", e.target.value)}
                placeholder="-122.4194"
                required
              />
            </label>
          </div>
        </div>

        <div className="exp-location-map">
          <LocationPicker value={locationValue} onChange={applyLocation} />
        </div>
      </div>
    </section>
  );
}
