import chokidar from "chokidar";
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import pug from "pug";
import sass from "sass";
import puppeteer from "puppeteer";
import { argv } from "node:process";

async function main() {
  await fs.mkdir("output/cv", { recursive: true });

  // 1. Fonts (shared by both pages)
  await fs.cp("./fonts", "output/fonts", {
    recursive: true,
    force: true,
  });

  // Images (homepage project logos)
  await fs.cp("./images", "output/images", {
    recursive: true,
    force: true,
  });

  // 2. Compile SCSS → CSS
  const homeCss = sass.compile("./style/home.scss", { loadPaths: ["./style"] }).css;
  await fs.writeFile("output/style.css", homeCss);
  console.log("✓ SCSS → output/style.css");

  const cvCss = sass.compile("./style/pdf.scss", { loadPaths: ["./style"] }).css;
  await fs.writeFile("output/cv/style.css", cvCss);
  console.log("✓ SCSS → output/cv/style.css");

  // 3. Render Pug → HTML
  const homeHtml = pug.renderFile("home.pug", {
    title: "Arthur Vercruysse — Developer for semantic Web developers",
    description:
      "Personal site of Arthur Vercruysse: open-source developer tooling, streaming RDF pipelines, and Linked Data clients for the Semantic Web.",
    og: {
      type: "website",
      "image:alt": "Arthur Vercruysse",
    },
    html_class: "home",
    stylesheets: [],
  });
  await fs.writeFile("output/index.html", homeHtml);
  console.log("✓ Pug → output/index.html");

  await fs.cp("./js/home.js", "output/home.js", { force: true });
  console.log("✓ JS → output/home.js");

  const cvHtml = pug.renderFile("cv.pug", {
    title: "Curriculum Vitae — Arthur Vercruysse",
    description: "Curriculum Vitae of Arthur Vercruysse, a computer scientist.",
    og: {
      type: "website",
      "image:alt": "Arthur Vercruysse",
    },
    html_class: "cv",
    stylesheets: [], // optional additional stylesheets
  });
  await fs.writeFile("output/cv/index.html", cvHtml);
  console.log("✓ Pug → output/cv/index.html");

  // 4. Generate PDF using Puppeteer (CV only)
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Navigate to the written file (not page.setContent) so relative
  // asset URLs (style.css, fonts) resolve correctly.
  const fileUrl = pathToFileURL(path.resolve("output/cv/index.html")).href;
  await page.goto(fileUrl, { waitUntil: "networkidle0" });

  await page.pdf({
    path: "output/cv/index.pdf",
    printBackground: true,
    preferCSSPageSize: true,
  });

  await browser.close();
  console.log("✓ PDF → output/cv/index.pdf");
}

console.log("argv", argv);
if (argv[2] === "watch") {
  chokidar
    .watch(["./*.pug", "./includes/**/*.pug", "./style/**/*.scss", "./js/**/*.js"], {
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
