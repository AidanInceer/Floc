/**
 * Why (#613, ADR-046): spans go to Railway's tracing only when its Traced switch sets the OTLP endpoint; with no
 * endpoint nothing starts and nothing costs. Outbound calls keep host and a masked path, never the query.
 */
import { context, propagation, trace } from "@opentelemetry/api";
import { AsyncLocalStorageContextManager } from "@opentelemetry/context-async-hooks";
import { W3CTraceContextPropagator } from "@opentelemetry/core";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { registerInstrumentations } from "@opentelemetry/instrumentation";
import { UndiciInstrumentation } from "@opentelemetry/instrumentation-undici";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { BatchSpanProcessor, ParentBasedSampler, TraceIdRatioBasedSampler, TracerProvider } from "@opentelemetry/sdk-trace";

import pkg from "../../../package.json" with { type: "json" };

import { routePattern } from "./route-pattern";

type Env = Record<string, string | undefined>;

let running: { provider: TracerProvider; stop: () => void } | null = null;

export function outboundSpanAttributes(request: { origin: string; path: string }): Record<string, string> {
  const path = routePattern(request.path);
  return { "url.full": `${request.origin}${path}`, "url.path": path, "url.query": "" };
}

function sampleRatio(env: Env): number {
  const ratio = Number(env.OTEL_TRACES_SAMPLER_ARG ?? 1);
  return Number.isFinite(ratio) && ratio >= 0 && ratio <= 1 ? ratio : 1;
}

export function startTracing(env: Env): boolean {
  if (running || !env.OTEL_EXPORTER_OTLP_ENDPOINT) return false;
  const provider = new TracerProvider({
    resource: resourceFromAttributes({ "service.name": env.OTEL_SERVICE_NAME ?? "floc-web", "service.version": pkg.version }),
    sampler: new ParentBasedSampler({ root: new TraceIdRatioBasedSampler(sampleRatio(env)) }),
    spanProcessors: [new BatchSpanProcessor({ exporter: new OTLPTraceExporter() })],
  });
  context.setGlobalContextManager(new AsyncLocalStorageContextManager().enable());
  propagation.setGlobalPropagator(new W3CTraceContextPropagator());
  trace.setGlobalTracerProvider(provider);
  const stop = registerInstrumentations({
    tracerProvider: provider,
    instrumentations: [new UndiciInstrumentation({ startSpanHook: outboundSpanAttributes })],
  });
  running = { provider, stop };
  return true;
}

/** For tests and shutdown: drops the provider so a later start begins clean. */
export function stopTracing(): void {
  if (!running) return;
  running.stop();
  void running.provider.shutdown();
  trace.disable();
  context.disable();
  propagation.disable();
  running = null;
}
