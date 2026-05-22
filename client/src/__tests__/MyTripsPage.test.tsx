import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi, beforeEach } from "vitest";
import MyTripsPage from "../functionalAreas/trips/pages/MyTripsPage";

global.fetch = vi.fn();

describe("MyTripsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem("token", "fake-token");
  });

  it("displays trips created by the current user", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          id: 1,
          title: "Thailand Trip",
          description: "Beach and food trip",
          startDate: "2026-06-01",
          endDate: "2026-06-05",
        },
      ],
    } as Response);

    render(
      <MemoryRouter>
        <MyTripsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Thailand Trip")).toBeInTheDocument();
    });

    expect(screen.getByText("Beach and food trip")).toBeInTheDocument();
  });

  it("shows an empty state when the user has no trips", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    } as Response);

    render(
      <MemoryRouter>
        <MyTripsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/no trips/i)).toBeInTheDocument();
    });
  });

  it("handles an API error", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Failed to load trips" }),
    } as Response);

    render(
      <MemoryRouter>
        <MyTripsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/failed/i)).toBeInTheDocument();
    });
  });
});