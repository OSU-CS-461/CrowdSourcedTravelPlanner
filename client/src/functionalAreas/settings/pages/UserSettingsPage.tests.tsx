import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import UserSettingsPage from "./UserSettingsPage";
import { useAuth } from "../../auth/hooks/useAuth";
import { changeMyPassword } from "../../../shared/services/api.service";

vi.mock("../../auth/hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../../../shared/services/api.service", () => ({
  changeMyPassword: vi.fn(),
}));

describe("UserSettingsPage", () => {
  const logout = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      token: "token",
      user: { id: 1, email: "user@example.com" },
      initialize: vi.fn(),
      logout,
      isAuthenticated: true,
    });
  });

  it("renders the settings page", () => {
    render(<UserSettingsPage />);

    expect(
      screen.getByRole("heading", { name: /user settings/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /update password/i })
    ).toBeInTheDocument();
  });

  it("shows required field validation messages", async () => {
    const user = userEvent.setup();
    render(<UserSettingsPage />);

    await user.click(screen.getByRole("button", { name: /update password/i }));

    expect(screen.getByText("Current password is required.")).toBeInTheDocument();
    expect(screen.getByText("New password is required.")).toBeInTheDocument();
    expect(screen.getByText("Confirm your new password.")).toBeInTheDocument();
    expect(changeMyPassword).not.toHaveBeenCalled();
  });

  it("rejects mismatched password confirmation", async () => {
    const user = userEvent.setup();
    render(<UserSettingsPage />);

    await user.type(screen.getByLabelText(/current password/i), "oldpassword123");
    await user.type(screen.getByLabelText(/^new password$/i), "newpassword123");
    await user.type(
      screen.getByLabelText(/confirm new password/i),
      "different-password"
    );

    await user.click(screen.getByRole("button", { name: /update password/i }));

    expect(screen.getByText("Passwords must match.")).toBeInTheDocument();
    expect(changeMyPassword).not.toHaveBeenCalled();
  });

  it("shows success message from API", async () => {
    vi.mocked(changeMyPassword).mockResolvedValue({
      message: "Password updated successfully.",
    });

    const user = userEvent.setup();
    render(<UserSettingsPage />);

    await user.type(screen.getByLabelText(/current password/i), "oldpassword123");
    await user.type(screen.getByLabelText(/^new password$/i), "newpassword123");
    await user.type(
      screen.getByLabelText(/confirm new password/i),
      "newpassword123"
    );

    await user.click(screen.getByRole("button", { name: /update password/i }));

    await waitFor(() => {
      expect(changeMyPassword).toHaveBeenCalledWith({
        currentPassword: "oldpassword123",
        newPassword: "newpassword123",
        confirmNewPassword: "newpassword123",
      });
    });

    expect(
      await screen.findByText("Password updated successfully.")
    ).toBeInTheDocument();
  });

  it("shows error state from API", async () => {
    vi.mocked(changeMyPassword).mockRejectedValue({
      isAxiosError: true,
      response: {
        status: 400,
        data: { error: "Current password is incorrect." },
      },
    });

    const user = userEvent.setup();
    render(<UserSettingsPage />);

    await user.type(screen.getByLabelText(/current password/i), "wrongpassword123");
    await user.type(screen.getByLabelText(/^new password$/i), "newpassword123");
    await user.type(
      screen.getByLabelText(/confirm new password/i),
      "newpassword123"
    );

    await user.click(screen.getByRole("button", { name: /update password/i }));

    expect(
      await screen.findByText("Current password is incorrect.")
    ).toBeInTheDocument();
  });
});
