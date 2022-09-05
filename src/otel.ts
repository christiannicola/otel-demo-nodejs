import opentelemetry, { Span, Tracer } from "@opentelemetry/api";
import { registerInstrumentations } from "@opentelemetry/instrumentation";
import { Resource } from "@opentelemetry/resources";
import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions";
import { ExpressInstrumentation } from "@opentelemetry/instrumentation-express";
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";
import { JaegerExporter } from "@opentelemetry/exporter-jaeger";

export class TelemetryProvider {
  constructor(exporterHost: string, serviceName?: string) {
    if (exporterHost == null) throw new Error("invalid exporter url provided");
    if (serviceName == null) serviceName = "factorial-calculator";

    this.exporterHost = exporterHost;
    this.serviceName = serviceName;

    const resource = Resource.default().merge(
      new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
        [SemanticResourceAttributes.SERVICE_VERSION]: "0.0.1",
      })
    );

    const provider = new NodeTracerProvider({
      resource,
    });

    const exporter = new JaegerExporter({
      endpoint: `http://${this.exporterHost}:14268/api/traces`,
    });

    const processor = new BatchSpanProcessor(exporter);

    provider.addSpanProcessor(processor);
    provider.register();

    registerInstrumentations({
      tracerProvider: provider,
      instrumentations: [
        new HttpInstrumentation(),
        new ExpressInstrumentation(),
      ],
    });
  }

  public tracer(): Tracer {
    return opentelemetry.trace.getTracer(this.serviceName);
  }

  public currentSpan(): Span | undefined {
    return opentelemetry.trace.getSpan(opentelemetry.context.active());
  }

  private readonly exporterHost: string;
  private readonly serviceName: string;
}

export function TraceFunction(provider: TelemetryProvider) {
  return function (
    this: any,
    target: unknown,
    key: string,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor {
    const original: any = descriptor.value;

    descriptor.value = (...args: any[]) => {
      let parentSpan = provider.currentSpan();

      if (parentSpan == undefined)
        parentSpan = provider.tracer().startSpan(String(key));

      const ctx = opentelemetry.trace.setSpan(
        opentelemetry.context.active(),
        parentSpan
      );
      const childSpan = provider
        .tracer()
        .startSpan(String(key), undefined, ctx);

      const result = original.apply(this, args);

      childSpan.end();

      return result;
    };

    return descriptor;
  };
}
