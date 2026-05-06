import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import RootLayout from "./RootLayout";
import { useAuth } from "../functionalAreas/auth/hooks/useAuth";

vi.mock("../functionalAreas/auth/hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

describe("RootLayout", () => {
  it("includes a User Settings link in the hamburger menu", async () => {
    vi.mocked(useAuth).mockReturnValue({
      token: "token",
      user: { id: 1, email: "user@example.com" },
      initialize: vi.fn(),
      isAuthenticated: true,
      logout: vi.fn(),
    });

    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route element={<RootLayout />}>
            <Route path="/" element={<div>Home</div>} />
            <Route path="/settings" element={<div>Settings page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    await user.click(screen.getByRole("button", { name: /open menu/i }));

    const settingsLink = screen.getByRole("link", { name: /user settings/i });
    expect(settingsLink).toHaveAttribute("href", "/settings");

    await user.click(settingsLink);
    expect(await screen.findByText("Settings page")).toBeInTheDocument();
  });
});
