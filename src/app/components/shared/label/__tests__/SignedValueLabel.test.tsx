import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SignedValueLabel } from "../SignedValueLabel";

describe("SignedValueLabel", () => {
  it("renders signed percent labels with arrows", () => {
    render(
      <div>
        <SignedValueLabel value={1.24} format="percent" ariaLabelPrefix="등락률" />
        <SignedValueLabel value={-0.82} format="percent" ariaLabelPrefix="등락률" />
        <SignedValueLabel value={0} format="percent" ariaLabelPrefix="등락률" />
      </div>,
    );

    expect(screen.getByText("▲ 1.24%")).toBeInTheDocument();
    expect(screen.getByText("▼ 0.82%")).toBeInTheDocument();
    expect(screen.getByText("0.00%")).toBeInTheDocument();
  });

  it("includes direction in the accessible label", () => {
    render(<SignedValueLabel value={1.24} format="percent" ariaLabelPrefix="삼성전자 등락률" />);

    expect(screen.getByLabelText("삼성전자 등락률 상승 ▲ 1.24%")).toBeInTheDocument();
  });

  it("uses fallback for missing values", () => {
    render(<SignedValueLabel value={null} format="percent" fallback="-" />);

    expect(screen.getByText("-")).toBeInTheDocument();
  });
});
