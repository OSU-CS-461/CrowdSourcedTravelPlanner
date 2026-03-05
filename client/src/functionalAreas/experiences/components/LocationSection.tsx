import { useEffect, useMemo, useState } from "react";
import LocationPicker from "./LocationPicker.tsx";
import type { LocationValue } from "../types/types.ts";
import { getCurrentCoords } from "../helpers/ExplorePageHelpers.ts";

export interface LocationFields {
  country: string;
  adminRegion: string;
  city: string;
  street: string;
  postalCode: string;
  latitude: string;
  longitude: string;
}

interface LocationSectionProps {
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

export default function LocationSection({
  initialValue,
  onChange,
}: LocationSectionProps) {
  const [location, setLocation] = useState<LocationFields>(() =>
    buildInitialLocation(initialValue)
  );

  useEffect(() => {
    if (location.latitude.trim() || location.longitude.trim()) {
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const { lat, lng } = await getCurrentCoords();
        if (cancelled) return;

        setLocation((current) => {
          if (current.latitude.trim() || current.longitude.trim()) {
            return current;
          }

          return {
            ...current,
            latitude: String(lat),
            longitude: String(lng),
          };
        });
      } catch (err) {
        console.warn("Could not get user location for form initialization:", err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [location.latitude, location.longitude]);

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

      <div className="exp-location-map">
        <LocationPicker value={locationValue} onChange={applyLocation} />
      </div>
    </section>
  );
}
