import "@mantine/core/styles.css";
import { MantineProvider } from "@mantine/core";
import { createRoot } from "react-dom/client";
import { ToolCollectorProvider } from "./ai";
import { App } from "./app/app";
import "./index.css";
import init, { calculateDomain } from "../modern_math/modern_math";

const modernMath = await init();
const element = document.getElementById("app");

createRoot(element!).render(
  <MantineProvider>
    <ToolCollectorProvider>
      <App />
    </ToolCollectorProvider>
  </MantineProvider>,
);

const bytesPerPage = 65_536;
const domainValueCount = 100_000;
const domainByteLength = domainValueCount * Float32Array.BYTES_PER_ELEMENT;
const domainPageCount = Math.ceil(domainByteLength / bytesPerPage);
const domainPtr = modernMath.memory.grow(domainPageCount) * bytesPerPage;
const domainValues = new Float32Array(modernMath.memory.buffer, domainPtr, domainValueCount);

for (let i = 0; i < domainValues.length; i++) {
  domainValues[i] = Math.random() * 200 - 100;
}

const domain = calculateDomain(domainPtr, domainValues.length);

console.log({ domain });
