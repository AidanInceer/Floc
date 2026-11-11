import { trace } from "@opentelemetry/api";
import { afterEach, describe, expect, it } from "vitest";

import { capturedLog } from "@/test/captured-log";

import { log } from "./log";
import { outboundSpanAttributes, startTracing, stopTracing } from "./tracing";

afterEach(() => stopTracing());

describe("startTracing", () => {
  it("stays off when Railway gives no trace endpoint", () => {
    expect(startTracing({})).toBe(false);
  });

  it("starts once the endpoint is set, and only once", () => {
    const env = { OTEL_EXPORTER_OTLP_ENDPOINT: "http://127.0.0.1:4318" };
    expect(startTracing(env)).toBe(true);
    expect(startTracing(env)).toBe(false);
    const span = trace.getTracer("test").startSpan("probe");
    expect(span.isRecording()).toBe(true);
    span.end();
  });

  it("puts the trace id on log lines written inside a span", () => {
    startTracing({ OTEL_EXPORTER_OTLP_ENDPOINT: "http://127.0.0.1:4318" });
    const [line] = trace.getTracer("test").startActiveSpan("probe", (span) => {
      const lines = capturedLog(() => log.info("inside"));
      span.end();
      return lines;
    });
    expect(line).toMatchObject({ traceId: expect.stringMatching(/^[0-9a-f]{32}$/), spanId: expect.any(String) });
  });
});

describe("outboundSpanAttributes", () => {
  it("keeps the host and a masked path, and drops the query", () => {
    const attributes = outboundSpanAttributes({ origin: "https://api.example.com", path: "/v1/search?q=Lisbon&key=abc123" });
    expect(attributes).toEqual({
      "url.full": "https://api.example.com/v1/search",
      "url.path": "/v1/search",
      "url.query": "",
    });
  });

  it("masks ids in the path", () => {
    expect(outboundSpanAttributes({ origin: "https://db.example.io", path: "/trip/42" })["url.path"]).toBe("/trip/[id]");
  });
});
