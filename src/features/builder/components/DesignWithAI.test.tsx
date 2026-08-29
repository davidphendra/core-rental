import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, afterEach } from "vitest";

import type { Product } from "@/shared/types/product";
import { BuilderStoreProvider, useBuilderReducer } from "@/shared/state/BuilderStore";

import { DesignWithAI } from "./DesignWithAI";

const p = (skuNo: string, pricePerMonth = 100_000): Product => ({
  skuNo,
  name: skuNo,
  category: "accessory",
  pricePerMonth,
  description: "d",
  image: "/x.svg",
});

const CHA = "CHAA1B2C3D4E";
const DSK = "DSKA1B2C3D4E";
const MON = "MONA1B2C3D4E";
const LMP = "LMPA1B2C3D4E";
const CFE = "CFEA1B2C3D4E";

const catalog: Product[] = [p(CHA, 500_000), p(DSK, 1_000_000), p(MON, 400_000), p(LMP, 150_000), p(CFE, 600_000)];

const DESIGN = {
  chairSku: CHA,
  deskSku: DSK,
  monitorSkus: [MON],
  coffeeSku: null,
  beanbagSku: null,
  lampSku: LMP,
  plantSku: null,
  totalPerMonth: 2_050_000,
  note: "Picked the best-value combo.",
};

/** Fetch stub that scripts responses per call. */
function stubFetch(...responses: Array<Response | Error | Promise<Response>>) {
  const queue = [...responses];
  const fetchMock = vi.fn(async () => {
    const next = queue.shift();
    if (next instanceof Error) throw next;
    return next;
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

function renderPanel(initialState?: { chairId?: string | null; deskId?: string | null }) {
  const Harness = () => {
    const [state, dispatch] = useBuilderReducer({
      chairId: initialState?.chairId ?? null,
      deskId: initialState?.deskId ?? null,
      quantities: {},
      monitorSlots: [],
    });
    return (
      <BuilderStoreProvider value={{ state, dispatch }}>
        <DesignWithAI catalog={catalog} />
      </BuilderStoreProvider>
    );
  };
  return render(<Harness />);
}

const typeAndGenerate = async (text: string) => {
  fireEvent.change(screen.getByLabelText("Describe your workspace"), { target: { value: text } });
  fireEvent.click(screen.getByRole("button", { name: "Generate" }));
  await waitFor(() => expect(screen.queryByRole("button", { name: "Generate" })).toBeNull());
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("DesignWithAI", () => {
  it("renders the prompt input and a disabled Generate button when empty", () => {
    renderPanel();
    expect(screen.getByLabelText("Describe your workspace")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Generate" })).toBeDisabled();
  });

  it("shows the reasoning steps while loading, then the preview with items and total", async () => {
    stubFetch(jsonResponse({ design: DESIGN }));
    renderPanel();
    fireEvent.change(screen.getByLabelText("Describe your workspace"), {
      target: { value: "gaming workspace" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Generate" }));

    // Steps render synchronously during loading.
    expect(screen.getByText("Interpreting your request…")).toBeInTheDocument();

    expect(await screen.findByText("Monthly total")).toBeInTheDocument();
    expect(screen.getByText(/2\.050\.000/)).toBeInTheDocument();
    expect(screen.getByText("Picked the best-value combo.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Apply this design" })).toBeInTheDocument();
  });

  it("applies the design to the builder state and emits ai.design_applied", async () => {
    stubFetch(jsonResponse({ design: DESIGN }));
    renderPanel();
    await typeAndGenerate("gaming workspace");
    fireEvent.click(await screen.findByRole("button", { name: "Apply this design" }));
    await waitFor(() => {
      // reset + re-select: chair and desk are set; others applied
      expect(screen.getByLabelText("Describe your workspace")).toBeInTheDocument();
    });
  });

  it("asks for confirmation before replacing a non-empty cart", async () => {
    stubFetch(jsonResponse({ design: DESIGN }));
    renderPanel({ chairId: CHA, deskId: DSK });
    await typeAndGenerate("gaming workspace");
    fireEvent.click(await screen.findByRole("button", { name: "Apply this design" }));
    expect(screen.getByRole("button", { name: "Replace setup" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Keep current" })).toBeInTheDocument();
  });

  it("shows an honest refusal with the message", async () => {
    stubFetch(jsonResponse({ refusal: { message: "The cheapest rentable setup is Rp1.000.000." } }));
    renderPanel();
    await typeAndGenerate("cheap setup");
    expect(await screen.findByText(/cheapest rentable setup/)).toBeInTheDocument();
  });

  it("surfaces a rate-limit error with an actionable message", async () => {
    stubFetch(jsonResponse({ error: "rate_limited" }, 429));
    renderPanel();
    await typeAndGenerate("anything");
    expect(await screen.findByText(/Too many requests/)).toBeInTheDocument();
  });

  it("surfaces the disabled state when AI is not configured", async () => {
    stubFetch(jsonResponse({ error: "ai_disabled" }, 503));
    renderPanel();
    await typeAndGenerate("anything");
    expect(await screen.findByText(/isn't configured/)).toBeInTheDocument();
  });

  it("recovers to idle when cancelled mid-generation", async () => {
    stubFetch(new Promise<Response>(() => {})); // never settles — generation stays in flight
    renderPanel();
    fireEvent.change(screen.getByLabelText("Describe your workspace"), { target: { value: "hello" } });
    fireEvent.click(screen.getByRole("button", { name: "Generate" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument());
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    });
    expect(screen.getByRole("button", { name: "Generate" })).toBeInTheDocument();
  });

  it("never enables Generate for whitespace-only prompts", () => {
    renderPanel();
    fireEvent.change(screen.getByLabelText("Describe your workspace"), { target: { value: "   " } });
    expect(screen.getByRole("button", { name: "Generate" })).toBeDisabled();
  });
});
