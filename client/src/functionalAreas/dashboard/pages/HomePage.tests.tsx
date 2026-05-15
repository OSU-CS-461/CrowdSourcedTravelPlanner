import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import HomePage from "./HomePage";
import type { LikedTagSummary } from "../../../shared/services/api.service";

const navigateSpy = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom",
  );
  return {
    ...actual,
    useNavigate: () => navigateSpy,
  };
});

const {
  apiGetMock,
  setAuthTokenMock,
  getMyLikedExperiencesMock,
  getMyLikedTripsMock,
  getMyLikedTagsMock,
  getCurrentCoordsMock,
} = vi.hoisted(() => ({
  apiGetMock: vi.fn(),
  setAuthTokenMock: vi.fn(),
  getMyLikedExperiencesMock: vi.fn(),
  getMyLikedTripsMock: vi.fn(),
  getMyLikedTagsMock: vi.fn(),
  getCurrentCoordsMock: vi.fn(),
}));

vi.mock("../../../shared/services/api.service", () => ({
  apiClient: {
    get: apiGetMock,
  },
  setAuthToken: setAuthTokenMock,
  getMyLikedExperiences: getMyLikedExperiencesMock,
  getMyLikedTrips: getMyLikedTripsMock,
  getMyLikedTags: getMyLikedTagsMock,
  likeExperience: vi.fn(),
  unlikeExperience: vi.fn(),
  likeTrip: vi.fn(),
  unlikeTrip: vi.fn(),
}));

vi.mock("../../experiences/helpers/ExplorePageHelpers", () => ({
  getCurrentCoords: getCurrentCoordsMock,
}));

type MockExperience = {
  id: number;
  title: string;
  description: string;
  dateCreated: string;
  city?: string;
  country?: string;
  reviewCount?: number;
  avgRating?: number;
  mostRecentReviewAt?: string;
  latitude?: number;
  longitude?: number;
  tags?: Array<{ id: number; slug: string; label: string }>;
};

function renderHome() {
  render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>,
  );
}

function setupDefaultLikesMocks() {
  getMyLikedExperiencesMock.mockResolvedValue([]);
  getMyLikedTripsMock.mockResolvedValue([]);
}

describe("HomePage feed ranking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    setupDefaultLikesMocks();
    getCurrentCoordsMock.mockRejectedValue(new Error("location unavailable"));
  });

  it("applies personalization boost when liked tags are present", async () => {
    localStorage.setItem("cstp.auth.token", "test-token");

    const likedTags: LikedTagSummary[] = [
      { id: 10, slug: "hiking", label: "Hiking", categoryId: 1 },
    ];
    getMyLikedTagsMock.mockResolvedValue(likedTags);

    const reviewedPool: MockExperience[] = [
      {
        id: 1,
        title: "Strong Match",
        description: "desc",
        dateCreated: "2026-05-01T00:00:00.000Z",
        reviewCount: 20,
        avgRating: 4.6,
        mostRecentReviewAt: "2026-05-10T00:00:00.000Z",
        tags: [{ id: 10, slug: "hiking", label: "Hiking" }],
      },
      {
        id: 2,
        title: "Non Match",
        description: "desc",
        dateCreated: "2026-05-01T00:00:00.000Z",
        reviewCount: 20,
        avgRating: 4.6,
        mostRecentReviewAt: "2026-05-10T00:00:00.000Z",
        tags: [{ id: 99, slug: "other", label: "Other" }],
      },
    ];

    apiGetMock.mockImplementation((url: string, config?: { params?: Record<string, unknown> }) => {
      if (url === "/trips") return Promise.resolve({ data: [] });
      if (url === "/experiences" && config?.params?.reviewedOnly) {
        return Promise.resolve({ data: reviewedPool });
      }
      if (url === "/experiences") {
        return Promise.resolve({ data: [] });
      }
      return Promise.reject(new Error(`Unexpected request: ${url}`));
    });

    renderHome();

    const strongMatch = await screen.findByText("Strong Match");
    const nonMatch = await screen.findByText("Non Match");
    expect(
      strongMatch.compareDocumentPosition(nonMatch) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(getMyLikedTagsMock).toHaveBeenCalledTimes(1);
    expect(apiGetMock).toHaveBeenCalledWith(
      "/experiences",
      expect.objectContaining({
        params: expect.objectContaining({
          sortBy: "mostRecentReviewAt",
          sortDirection: "desc",
          reviewedOnly: true,
          limit: 50,
        }),
      }),
    );
  });

  it("shows general ranked reviewed feed when no liked tags exist", async () => {
    localStorage.setItem("cstp.auth.token", "test-token");
    getMyLikedTagsMock.mockResolvedValue([]);

    apiGetMock.mockImplementation((url: string, config?: { params?: Record<string, unknown> }) => {
      if (url === "/trips") return Promise.resolve({ data: [] });
      if (url === "/experiences" && config?.params?.reviewedOnly) {
        return Promise.resolve({
          data: [
            {
              id: 1,
              title: "Perfect Tiny",
              description: "desc",
              dateCreated: "2026-05-01T00:00:00.000Z",
              reviewCount: 1,
              avgRating: 5,
              mostRecentReviewAt: "2026-05-10T00:00:00.000Z",
            },
            {
              id: 2,
              title: "Reliable Strong",
              description: "desc",
              dateCreated: "2026-05-01T00:00:00.000Z",
              reviewCount: 120,
              avgRating: 4.8,
              mostRecentReviewAt: "2026-05-08T00:00:00.000Z",
            },
          ],
        });
      }
      if (url === "/experiences") {
        return Promise.resolve({ data: [] });
      }
      return Promise.reject(new Error(`Unexpected request: ${url}`));
    });

    renderHome();

    const reliable = await screen.findByText("Reliable Strong");
    const tiny = await screen.findByText("Perfect Tiny");
    expect(
      reliable.compareDocumentPosition(tiny) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("falls back to general reviewed feed when liked tag fetch fails", async () => {
    localStorage.setItem("cstp.auth.token", "test-token");
    getMyLikedTagsMock.mockRejectedValue(new Error("liked tags failed"));

    apiGetMock.mockImplementation((url: string, config?: { params?: Record<string, unknown> }) => {
      if (url === "/trips") return Promise.resolve({ data: [] });
      if (url === "/experiences" && config?.params?.reviewedOnly) {
        return Promise.resolve({
          data: [
            {
              id: 8,
              title: "Still Renders",
              description: "desc",
              dateCreated: "2026-05-01T00:00:00.000Z",
              reviewCount: 12,
              avgRating: 4.7,
              mostRecentReviewAt: "2026-05-12T00:00:00.000Z",
            },
          ],
        });
      }
      if (url === "/experiences") {
        return Promise.resolve({ data: [] });
      }
      return Promise.reject(new Error(`Unexpected request: ${url}`));
    });

    renderHome();

    expect(await screen.findByText("Still Renders")).toBeInTheDocument();
  });

  it("uses fallback recent experiences when reviewed pool is empty", async () => {
    localStorage.setItem("cstp.auth.token", "test-token");
    getMyLikedTagsMock.mockResolvedValue([]);

    apiGetMock.mockImplementation((url: string, config?: { params?: Record<string, unknown> }) => {
      if (url === "/trips") return Promise.resolve({ data: [] });
      if (url === "/experiences" && config?.params?.reviewedOnly) {
        return Promise.resolve({ data: [] });
      }
      if (url === "/experiences") {
        return Promise.resolve({
          data: [
            {
              id: 42,
              title: "Fallback Recent",
              description: "desc",
              dateCreated: "2026-04-01T00:00:00.000Z",
            },
          ],
        });
      }
      return Promise.reject(new Error(`Unexpected request: ${url}`));
    });

    renderHome();

    expect(await screen.findByText("Fallback Recent")).toBeInTheDocument();
  });

  it("falls back to recent feed when reviewed pool lacks review stats fields", async () => {
    localStorage.setItem("cstp.auth.token", "test-token");
    getMyLikedTagsMock.mockResolvedValue([]);

    apiGetMock.mockImplementation((url: string, config?: { params?: Record<string, unknown> }) => {
      if (url === "/trips") return Promise.resolve({ data: [] });
      if (url === "/experiences" && config?.params?.reviewedOnly) {
        return Promise.resolve({
          data: [
            {
              id: 11,
              title: "Reviewed Without Stats",
              description: "desc",
              dateCreated: "2026-05-01T00:00:00.000Z",
              avgRating: 4.9,
            },
          ],
        });
      }
      if (url === "/experiences") {
        return Promise.resolve({
          data: [
            {
              id: 12,
              title: "Fallback Feed Entry",
              description: "desc",
              dateCreated: "2026-04-20T00:00:00.000Z",
            },
          ],
        });
      }
      return Promise.reject(new Error(`Unexpected request: ${url}`));
    });

    renderHome();

    expect(await screen.findByText("Fallback Feed Entry")).toBeInTheDocument();
    expect(screen.queryByText("Reviewed Without Stats")).not.toBeInTheDocument();
  });

  it("shows error when reviewed + fallback fetch both fail", async () => {
    localStorage.setItem("cstp.auth.token", "test-token");
    getMyLikedTagsMock.mockResolvedValue([]);

    apiGetMock.mockImplementation((url: string, config?: { params?: Record<string, unknown> }) => {
      if (url === "/trips") return Promise.resolve({ data: [] });
      if (url === "/experiences" && config?.params?.reviewedOnly) {
        return Promise.reject(new Error("reviewed failed"));
      }
      if (url === "/experiences") {
        return Promise.reject({
          response: { data: { error: "Could not load experiences." } },
          message: "failed",
        });
      }
      return Promise.reject(new Error(`Unexpected request: ${url}`));
    });

    renderHome();

    await waitFor(() => {
      expect(screen.getByText("Could not load experiences.")).toBeInTheDocument();
    });
  });

  it("prefers nearby experiences when geolocation is available", async () => {
    localStorage.setItem("cstp.auth.token", "test-token");
    getMyLikedTagsMock.mockResolvedValue([]);
    getCurrentCoordsMock.mockResolvedValue({ lat: 45.523, lng: -122.676 });

    apiGetMock.mockImplementation((url: string, config?: { params?: Record<string, unknown> }) => {
      if (url === "/trips") return Promise.resolve({ data: [] });
      if (url === "/experiences" && config?.params?.reviewedOnly) {
        return Promise.resolve({
          data: [
            {
              id: 1,
              title: "Far",
              description: "desc",
              dateCreated: "2026-05-01T00:00:00.000Z",
              reviewCount: 40,
              avgRating: 4.5,
              mostRecentReviewAt: "2026-05-10T00:00:00.000Z",
              latitude: 46.9,
              longitude: -124.2,
            },
            {
              id: 2,
              title: "Near",
              description: "desc",
              dateCreated: "2026-05-01T00:00:00.000Z",
              reviewCount: 40,
              avgRating: 4.5,
              mostRecentReviewAt: "2026-05-10T00:00:00.000Z",
              latitude: 45.523,
              longitude: -122.676,
            },
          ],
        });
      }
      if (url === "/experiences") {
        return Promise.resolve({ data: [] });
      }
      return Promise.reject(new Error(`Unexpected request: ${url}`));
    });

    renderHome();

    await waitFor(() => {
      const near = screen.getByText("Near");
      const far = screen.getByText("Far");
      expect(
        near.compareDocumentPosition(far) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    });
    expect(getCurrentCoordsMock).toHaveBeenCalledTimes(1);
  });

  it("still renders feed when geolocation permission is denied", async () => {
    localStorage.setItem("cstp.auth.token", "test-token");
    getMyLikedTagsMock.mockResolvedValue([]);
    getCurrentCoordsMock.mockRejectedValue({ code: 1, message: "Permission denied" });

    apiGetMock.mockImplementation((url: string, config?: { params?: Record<string, unknown> }) => {
      if (url === "/trips") return Promise.resolve({ data: [] });
      if (url === "/experiences" && config?.params?.reviewedOnly) {
        return Promise.resolve({
          data: [
            {
              id: 3,
              title: "Permission Fallback",
              description: "desc",
              dateCreated: "2026-05-01T00:00:00.000Z",
              reviewCount: 30,
              avgRating: 4.4,
              mostRecentReviewAt: "2026-05-10T00:00:00.000Z",
            },
          ],
        });
      }
      if (url === "/experiences") return Promise.resolve({ data: [] });
      return Promise.reject(new Error(`Unexpected request: ${url}`));
    });

    renderHome();

    expect(await screen.findByText("Permission Fallback")).toBeInTheDocument();
  });

  it("still renders feed when geolocation errors unexpectedly", async () => {
    localStorage.setItem("cstp.auth.token", "test-token");
    getMyLikedTagsMock.mockResolvedValue([]);
    getCurrentCoordsMock.mockRejectedValue(new Error("geolocation timeout"));

    apiGetMock.mockImplementation((url: string, config?: { params?: Record<string, unknown> }) => {
      if (url === "/trips") return Promise.resolve({ data: [] });
      if (url === "/experiences" && config?.params?.reviewedOnly) {
        return Promise.resolve({
          data: [
            {
              id: 4,
              title: "Geo Failure Fallback",
              description: "desc",
              dateCreated: "2026-05-01T00:00:00.000Z",
              reviewCount: 10,
              avgRating: 4.1,
              mostRecentReviewAt: "2026-05-10T00:00:00.000Z",
            },
          ],
        });
      }
      if (url === "/experiences") return Promise.resolve({ data: [] });
      return Promise.reject(new Error(`Unexpected request: ${url}`));
    });

    renderHome();

    expect(await screen.findByText("Geo Failure Fallback")).toBeInTheDocument();
  });

  it("does not hard-filter far-away experiences when location is available", async () => {
    localStorage.setItem("cstp.auth.token", "test-token");
    getMyLikedTagsMock.mockResolvedValue([]);
    getCurrentCoordsMock.mockResolvedValue({ lat: 45.523, lng: -122.676 });

    apiGetMock.mockImplementation((url: string, config?: { params?: Record<string, unknown> }) => {
      if (url === "/trips") return Promise.resolve({ data: [] });
      if (url === "/experiences" && config?.params?.reviewedOnly) {
        return Promise.resolve({
          data: [
            {
              id: 5,
              title: "Nearby",
              description: "desc",
              dateCreated: "2026-05-01T00:00:00.000Z",
              reviewCount: 20,
              avgRating: 4.3,
              mostRecentReviewAt: "2026-05-10T00:00:00.000Z",
              latitude: 45.523,
              longitude: -122.676,
            },
            {
              id: 6,
              title: "Far Away But Visible",
              description: "desc",
              dateCreated: "2026-05-01T00:00:00.000Z",
              reviewCount: 20,
              avgRating: 4.3,
              mostRecentReviewAt: "2026-05-10T00:00:00.000Z",
              latitude: 47.0,
              longitude: -123.8,
            },
          ],
        });
      }
      if (url === "/experiences") return Promise.resolve({ data: [] });
      return Promise.reject(new Error(`Unexpected request: ${url}`));
    });

    renderHome();

    expect(await screen.findByText("Nearby")).toBeInTheDocument();
    expect(await screen.findByText("Far Away But Visible")).toBeInTheDocument();
  });

  it("combines liked-tag personalization with location preference", async () => {
    localStorage.setItem("cstp.auth.token", "test-token");
    getMyLikedTagsMock.mockResolvedValue([
      { id: 10, slug: "hiking", label: "Hiking", categoryId: 1 },
    ]);
    getCurrentCoordsMock.mockResolvedValue({ lat: 45.523, lng: -122.676 });

    apiGetMock.mockImplementation((url: string, config?: { params?: Record<string, unknown> }) => {
      if (url === "/trips") return Promise.resolve({ data: [] });
      if (url === "/experiences" && config?.params?.reviewedOnly) {
        return Promise.resolve({
          data: [
            {
              id: 7,
              title: "Nearby Non-Match",
              description: "desc",
              dateCreated: "2026-05-01T00:00:00.000Z",
              reviewCount: 25,
              avgRating: 4.6,
              mostRecentReviewAt: "2026-05-10T00:00:00.000Z",
              latitude: 45.523,
              longitude: -122.676,
              tags: [{ id: 99, slug: "other", label: "Other" }],
            },
            {
              id: 8,
              title: "Far Match",
              description: "desc",
              dateCreated: "2026-05-01T00:00:00.000Z",
              reviewCount: 25,
              avgRating: 4.6,
              mostRecentReviewAt: "2026-05-10T00:00:00.000Z",
              latitude: 47.0,
              longitude: -123.8,
              tags: [{ id: 10, slug: "hiking", label: "Hiking" }],
            },
          ],
        });
      }
      if (url === "/experiences") return Promise.resolve({ data: [] });
      return Promise.reject(new Error(`Unexpected request: ${url}`));
    });

    renderHome();

    await waitFor(() => {
      const farMatch = screen.getByText("Far Match");
      const nearNonMatch = screen.getByText("Nearby Non-Match");
      expect(
        farMatch.compareDocumentPosition(nearNonMatch) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    });
    expect(screen.getByText("Nearby Non-Match")).toBeInTheDocument();
  });
});
