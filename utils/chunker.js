// import { PDFParse } from "pdf-parse";

// const parser = new PDFParse({
//   url: "\\Users\\HRISHEE\\my-pro-ject\\backend\\public\\putana.pdf",
// });

export function chunker(rawText) {
  const text = rawText.replace(/\r\n/g, "\n");

  const lines = text.split("\n");

  let healedText = "";

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();

    if (!line) continue;

    if (/^(?:Page\s?)?\d+(?:\s?of\s?\d+)?$/i.test(line)) {
      continue;
    }

    if (healedText === "") {
      healedText = line;
      continue;
    }

    const lastCharOfPrev = healedText.slice(-1);

    const prevEndedWithPunctuation = /[.!?;:"]/.test(lastCharOfPrev);

    const isListItem = /^(?:(?:\d+\.)+\d*|\w\)|[-*•>])\s/.test(line);

    const isHeader = /^[A-Z\s\d\W]+$/.test(line) && line.length > 4;

    if (prevEndedWithPunctuation || isListItem || isHeader) {
      healedText += "\n\n" + line;
    } else {
      healedText += " " + line;
    }
  }

  const finalChunks = healedText.split(/\n\n/);
  let uniqueArray = [...new Set(finalChunks)];

  const a = Math.ceil(uniqueArray.length / 96);
  const b = Math.floor(uniqueArray.length / 96);
  const r = uniqueArray.length % 96;

  let newArray = [];

  let z = uniqueArray.length < 96 ? uniqueArray.length : 96;
  for (let i = 0; i < z; i++) {
    let arr;
    if (uniqueArray.length <= 96) {
      arr = uniqueArray.slice(i, i + 1);
      newArray.push(arr);
    }

    if (uniqueArray.length > 96 && i < r) {
      arr = uniqueArray.slice(i * a, (i + 1) * a);
      newArray.push(arr);
    }

    if (uniqueArray.length > 96 && r <= i) {
      arr = uniqueArray.slice(i * b + r, (i + 1) * b + r);
      newArray.push(arr);
    }
  }

  const chunks = newArray.map((innerArray) => innerArray.join(" "));

  return chunks;
}

// const rawResult = await parser.getText();

// const cleanFullText = chunker(
//   rawResult.text.replace(/\n-- \d+ of \d+ --\n\n/g, "")
// );

// // console.log(cleanFullText);
