import { launch } from "@astral/astral";
import { DOMParser } from "@b-fuze/deno-dom";
import { sendMail } from "./mailer.ts";

const url =
  "https://docs.google.com/spreadsheets/d/1dWTBSZ8CgLFDBUKRkuJ9CbkYE9szNQKZH8brfTzxF-k/pubhtml/sheet?headers=false&gid=0";
const cssGreen = "s14";

async function fetchHtml(): Promise<string> {
  //  during development, try loading the saved HTML file first
  if (Deno.env.get("ENV") !== "production") {
    try {
      return Deno.readTextFileSync("output.html");
    } catch {
      // ignore
    }
  }

  // fetch the HTML from the web
  const browser = await launch();
  const page = await browser.newPage();

  await page.goto(url, { waitUntil: "load" });

  const value = await page.evaluate(() => {
    // @ts-expect-error document is defined inside evaluate()
    return document.body.innerHTML;
  });

  // during development, save the HTML to a file
  if (Deno.env.get("ENV") !== "production") {
    Deno.writeTextFileSync("output.html", value);
  }

  return value;
}

// fetch HTML from the web or from a saved file (dev only)
const html = await fetchHtml();

const dom = new DOMParser().parseFromString(html, "text/html")!;

// search for the colspan of A1
const tbody = dom.querySelector("tbody");
const rows = tbody?.querySelectorAll("tr");

let colspan: number | null = null;
let headerRowIndex: number | null = null;
for (let i = 0; i < (rows?.length || 0); i++) {
  if (colspan) break;

  const row = rows![i];
  const cells = row.querySelectorAll("td");

  for (let j = 0; j < cells.length; j++) {
    const cell = cells[j];
    if (cell.textContent === "Format DIN A1") {
      if (cell.hasAttribute("colspan")) {
        colspan = parseInt(cell.getAttribute("colspan")!);
        headerRowIndex = i;
        break;
      }
    }
  }
}

if (!colspan || !headerRowIndex) {
  console.error("Could not find colspan for A1");
  Deno.exit(1);
} else {
  // console.log(
  //   `Found colspan for A1: ${colspan} (header row: ${headerRowIndex})`
  // );
}

// iterate rows and find green cells within the A1 colspan
// ignore header rows
const result = [];
for (let i = headerRowIndex + 1; i < (rows?.length || 0); i++) {
  const row = rows![i];
  const cells = row.querySelectorAll("td");

  // cell[0] is the row number
  // cell[1] is the header
  // cell[2..colspan+2] are the A1 cells
  // cell[colspan+3..end] are the other format cells
  const header = cells[1];
  for (let j = 2; j < colspan + 2; j++) {
    const cell = cells[j];
    if (cell.classList.contains(cssGreen)) {
      result.push(header.textContent);
      console.log(
        "Found green cell in A1 section:",
        cell.textContent,
        header.textContent
      );
    }
  }
}

if (result.length > 0) {
  const content = `
  Green cells found in these rows:
  ${result.map((r) => `- ${r}`).join("\n")}`;

  await sendMail({
    subject: "Luke Plakatwalker - Green Cells in A1",
    text: content,
  });
} else {
  console.log("No green cells found in A1 section.");
}

Deno.exit(0);
