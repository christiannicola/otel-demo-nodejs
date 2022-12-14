import { TelemetryProvider } from "./otel";

// NOTE (c.nicola): Because the of the implementation of the automatic instrumentation
//                  for the http module we need to import and construct our telemetry
//                  provider before we import express and start the server.
const telemetry = new TelemetryProvider(
  process.env.EXPORTER_HOST as string,
  "factorial-requester"
);

import http from "http";

// NOTE (c.nicola): Express serializes response objects with the `JSON.stringify` to create a
//                  string / uint8 buffer to send back over the wire. We hack the prototype of
//                  of the BigInt constructor to add the `toJSON` method ourselves.
//                  The reason for doing this by accessing the object via index notation is because
//                  Typescript won't compile if the we access that member directly - it's not part
//                  of the interface BigIntConstructor.
BigInt.prototype["toJSON"] = function () {
  return this.toString();
};

interface FactorialResult {
  result: bigint;
}

function generateNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

async function makeRequest(url: string): Promise<FactorialResult> {
  return new Promise<FactorialResult>((resolve, reject) => {
    const span = telemetry.tracer().startSpan("fetch-factorial");

    const request = http.get(url, (response) => {
      if (response.statusCode != null && response.statusCode >= 300)
        reject(
          new Error(`request failed - received code ${response.statusCode}`)
        );

      const body: string[] = [];

      response.on("data", (chunk: string) => body.push(chunk));

      response.on("end", () => {
        const result = body.join("");
        const factorial: FactorialResult = JSON.parse(result);
        span.end();

        resolve(factorial);
      });
    });

    request.on("error", (err) => {
      span.end();
      reject(err);
    });
  });
}

async function fetchFactorial(): Promise<void> {
  const serverHost = process.env.SERVER_HOST;

  if (serverHost == null) throw new Error("invalid server host provided");

  const n = generateNumber(4950, 5000);
  const response = await makeRequest(`http://${serverHost}:8080/${n}`);

  console.log(response.result);
}

setInterval(fetchFactorial, 100);
