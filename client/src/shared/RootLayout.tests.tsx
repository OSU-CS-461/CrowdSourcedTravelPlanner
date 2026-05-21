import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import RootLayout from "./RootLayout";
import { useAuth } from "../functionalAreas/auth/hooks/useAuth";
import { getUserSettings } from "./services/api.service";

vi.mock("../functionalAreas/auth/hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("./services/api.service", () => ({
  getUserSettings: vi.fn(),
}));

describe("RootLayout", () => {
  it("includes a Profile settings link in the hamburger menu", async () => {
    vi.mocked(useAuth).mockReturnValue({
      token: "token",
      user: { id: 1, email: "user@example.com" },
      initialize: vi.fn(),
      isAuthenticated: true,
      logout: vi.fn(),
    });
    vi.mocked(getUserSettings).mockResolvedValue({
      email: "user@example.com",
      preferredFeedSort: "recommended",
      themePreference: "light",
      lastUpdated: "2026-01-01T00:00:00.000Z",
    });

    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route element={<RootLayout />}>
            <Route path="/" element={<div>Home</div>} />
            <Route
              path="/profile/settings"
              element={<div>Settings page</div>}
            />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    await user.click(screen.getByRole("button", { name: /open menu/i }));

    const settingsLink = screen.getByRole("link", { name: /profile settings/i });
    expect(settingsLink).toHaveAttribute("href", "/profile/settings");

    await user.click(settingsLink);
    expect(await screen.findByText("Settings page")).toBeInTheDocument();
  });
});
