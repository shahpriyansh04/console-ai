import { streamObject } from "ai";
import fs from "fs";
import { createReadStream } from "fs";
import { ollama } from "ollama-ai-provider";
import { z } from "zod";
import fetch from "node-fetch";
import FormData from "form-data";
async function sendFile() {
  const form = new FormData();
  form.append("files", createReadStream("./2.png"));

  const response = await fetch("http://localhost:8000/", {
    method: "POST",
    body: form,
  });

  const text = await response.text();
  return text;
}

const data = await sendFile();
const TestResult = z.object({
  testName: z.string(),
  result: z.number().optional(),
  units: z.string().optional(),
  bioRefInterval: z.string().optional(),
});

const ReportSchema = z.object({
  gender: z.string(),
  age: z.number(),
  reportDate: z.string(),
  reportTime: z.string(),
  name: z.string(),
  refBy: z.string().optional(),

  testName: z.string(),
  results: z.array(TestResult),
});
console.log(data);
const { partialObjectStream } = await streamObject({
  model: ollama("llama3"),
  temperature: 0,
  schema: ReportSchema,
  prompt:
    "Structure the given data" +
    `\n${data}\n` +
    "Include all details : Test name, esults, units, and interval. Ignore headings like Complete Bloud Count, Differential Leukocyte Count, Absolute Leukocyte Count, etc. Just take the actual readings. Also ignore any information that you feel might not be relevant to the test results or the schema",
});
let finalOutput;

for await (const partialObject of partialObjectStream) {
  console.log(partialObject);
  finalOutput = partialObject;
}
fs.writeFileSync("./output.json", JSON.stringify(finalOutput, null, 2));
