import chokidar from "chokidar";
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import pug from "pug";
import sass from "sass";
import puppeteer from "puppeteer";
import { argv } from "node:process";

async function main() {
  // 1. Compile SCSS → CSS
  await fs.cp("./fonts", "output/fonts", {
    recursive: true,
    force: true,
  });
  const css = sass.compile("./style/pdf.scss", { loadPaths: ["./style"] }).css;
  await fs.mkdir("output", { recursive: true });
  await fs.writeFile("output/style.css", css);
  console.log("✓ SCSS → output/style.css");

  // 2. Render Pug → HTML
  const html = pug.renderFile("cv.pug", {
    title: "Curriculum Vitae — Arthur Vercruysse",
    description: "Curriculum Vitae of Arthur Vercruysse, a computer scientist.",
    og: {
      type: "website",
      "image:alt": "Arthur Vercruysse",
    },
    html_class: "cv",
    stylesheets: [], // optional additional stylesheets
  });

  await fs.writeFile("output/index.html", html);
  console.log("✓ Pug → output/index.html");

  // 3. Generate PDF using Puppeteer
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Navigate to the written file (not page.setContent) so relative
  // asset URLs (style.css, fonts) resolve correctly.
  const fileUrl = pathToFileURL(path.resolve("output/index.html")).href;
  await page.goto(fileUrl, { waitUntil: "networkidle0" });

  await page.pdf({
    path: "output/index.pdf",
    printBackground: true,
    preferCSSPageSize: true,
  });

  await browser.close();
  console.log("✓ PDF → output/index.pdf");
}

console.log("argv", argv);
if (argv[2] === "watch") {
  chokidar
    .watch(["./cv.pug", "./style/includes/_style.scss"], {
      ignoreInitial: true,
      usePolling: true,
    })
    .on("all", async () => {
      console.log("Rerunning");
      await main();
      console.log("Rerunning done");
    });
} else {
  main();
}
