import React from "react";
import { render, screen } from "@testing-library/react";
import KinkCategory from "./KinkCategory";
import { KinklistProvider } from "../context/KinklistContext";

// Mock-Daten
const mockProps = {
  name: "Test Category",
  fields: ["Field1", "Field2"],
  kinks: ["Kink1", "Kink2"],
};

describe("KinkCategory Component", () => {
  test("renders category name and fields correctly", () => {
    render(
      <KinklistProvider initialKinksText="">
        <KinkCategory {...mockProps} />
      </KinklistProvider>,
    );

    // Überprüft, ob die Kategorie-Überschrift korrekt gerendert wird
    expect(screen.getByText("Test Category")).toBeInTheDocument();

    // Überprüft, ob die Feldnamen korrekt gerendert werden
    expect(screen.getByText("Field1")).toBeInTheDocument();
    expect(screen.getByText("Field2")).toBeInTheDocument();

    // Überprüft, ob die Kink-Namen korrekt gerendert werden
    expect(screen.getByText("Kink1")).toBeInTheDocument();
    expect(screen.getByText("Kink2")).toBeInTheDocument();
  });
});
