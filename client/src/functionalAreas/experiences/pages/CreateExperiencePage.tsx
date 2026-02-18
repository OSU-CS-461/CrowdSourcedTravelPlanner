import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClientRoutes } from "../../../shared/clientRoutes";
import ExperienceForm from "../components/ExperienceForm";
import type { FormValues } from "../components/ExperienceForm";
import type { TagOption } from "../components/ExperienceForm";
import { setAuthToken } from "../../../shared/services/api.service";
import { apiClient } from "../../../shared/services/api.service";


// TODO: at some point there should be a map here and we should rely on lat and long to populate
// the street address, city, state, etc

export default function CreateExperiencePage() {
  const navigate = useNavigate();
  const [availableCategories, setAvailableCategories] = useState<TagOption[]>([]);
  const [availableFeatures, setAvailableFeatures] = useState<TagOption[]>([]);
  const [tagsLoading, setTagsLoading] = useState(true);
  const [featuresLoading, setFeaturesLoading] = useState(false);
  const [tagsError, setTagsError] = useState<string | null>(null);
  const featureRequestIdRef = useRef(0);

  useEffect(() => {
    let isMounted = true;

    async function fetchCategories() {
      try {
        setTagsLoading(true);
        setTagsError(null);
        const response = await apiClient.get<TagOption[]>("/tags", {
          params: { type: "CATEGORY" },
        });
        if (isMounted) {
          setAvailableCategories(response.data);
        }
      } catch (err) {
        console.error("Error loading tags:", err);
        if (isMounted) {
          setTagsError("Unable to load categories right now. You can still create without tags.");
        }
      } finally {
        if (isMounted) {
          setTagsLoading(false);
        }
      }
    }

    fetchCategories();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleCategoryChange(categoryId: number | null) {
    featureRequestIdRef.current += 1;
    const requestId = featureRequestIdRef.current;

    if (!categoryId) {
      setAvailableFeatures([]);
      setFeaturesLoading(false);
      return;
    }

    try {
      setFeaturesLoading(true);
      setTagsError(null);
      const response = await apiClient.get<TagOption[]>("/tags", {
        params: { type: "FEATURE", parentCategoryId: categoryId },
      });
      if (requestId !== featureRequestIdRef.current) return;
      setAvailableFeatures(response.data);
    } catch (err) {
      console.error("Error loading features:", err);
      if (requestId !== featureRequestIdRef.current) return;
      setAvailableFeatures([]);
      setTagsError("Unable to load features for the selected category.");
    } finally {
      if (requestId === featureRequestIdRef.current) {
        setFeaturesLoading(false);
      }
    }
  }

  const handleCreateExperience = async (values: FormValues) => {
    const token = localStorage.getItem("cstp.auth.token");
    if (!token) {
      alert("You must be logged in to create experiences.");
      return;
    }
    setAuthToken(token);

    const keywordsArray =
      values.keywords?.trim().length
        ? values.keywords
            .split(",")
            .map((k) => k.trim())
            .filter(Boolean)
        : [];

    // Country code mapping - convert common country names to ISO codes
    const countryCodeMap: Record<string, string> = {
      "united states": "US",
      "usa": "US",
      "us": "US",
      "united kingdom": "GB",
      "uk": "GB",
      "canada": "CA",
      "china": "CN",
      "japan": "JP",
      "australia": "AU",
      "germany": "DE",
      "france": "FR",
      "italy": "IT",
      "spain": "ES",
      "mexico": "MX",
      "brazil": "BR",
      "india": "IN",
      "south korea": "KR",
      "korea": "KR",
    };

    // Convert country name to ISO code (2 characters required)
    let countryCode = values.country?.trim().toLowerCase() || "";
    if (countryCode.length > 2) {
      countryCode = countryCodeMap[countryCode] || countryCode.substring(0, 2).toUpperCase();
    }
    if (countryCode.length !== 2) {
      alert("Country must be a 2-character ISO code (e.g., US, GB, CN). Please use the country code instead of full name.");
      return;
    }
    countryCode = countryCode.toUpperCase();

    // Validate description length (minimum 20 characters)
    if (values.description.trim().length < 20) {
      alert("Description must be at least 20 characters long.");
      return;
    }

    // Handle optional fields - only include if provided
    const postBody: Record<string, unknown> = {
      title: values.title.trim(),
      description: values.description.trim(),
      country: countryCode,
    };

    // Add optional location fields only if provided
    if (values.adminRegion?.trim()) {
      postBody.adminRegion = values.adminRegion.trim();
    }
    if (values.city?.trim()) {
      postBody.city = values.city.trim();
    }
    if (values.street?.trim()) {
      postBody.street = values.street.trim();
    }
    if (values.postalCode?.trim()) {
      postBody.postalCode = values.postalCode.trim();
    }

    // Latitude and longitude must both be provided together
    if (values.latitude?.trim() && values.longitude?.trim()) {
      const lat = Number(values.latitude.trim());
      const lon = Number(values.longitude.trim());
      if (!isNaN(lat) && !isNaN(lon)) {
        postBody.latitude = lat;
        postBody.longitude = lon;
      }
    } else if (values.latitude?.trim() || values.longitude?.trim()) {
      alert("Both latitude and longitude must be provided together, or leave both empty.");
      return;
    }

    // Optional fields
    if (values.image?.trim()) {
      postBody.thumbnail = values.image.trim();
    }
    if (keywordsArray.length > 0) {
      postBody.keywords = keywordsArray;
    }
    if (values.tagIds.length > 0) {
      postBody.tagIds = values.tagIds;
    }

    try {
      const response = await apiClient.post("/experiences", postBody);
      console.log("Experience created:", response.data);
      alert("Experience created successfully!");
      navigate(ClientRoutes.HOME);
    } catch (err) {
      console.error("Error creating experience:", err);
      const errorObj = err as { response?: { data?: { error?: string; details?: { message?: string } } } };
      const errorMessage = errorObj.response?.data?.error || 
                          errorObj.response?.data?.details?.message ||
                          "There was a problem creating the experience.";
      alert(`Error: ${errorMessage}`);
    }
  };

  return (
    <div>
      <h1>Create Experience</h1>
      <ExperienceForm
        onSubmit={handleCreateExperience}
        submitLabel="Create"
        showTagSelector
        availableCategories={availableCategories}
        availableFeatures={availableFeatures}
        tagsLoading={tagsLoading}
        featuresLoading={featuresLoading}
        tagsError={tagsError}
        onCategoryChange={handleCategoryChange}
      />
    </div>
  );
}
