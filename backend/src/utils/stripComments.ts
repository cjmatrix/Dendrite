import crypto from "crypto";


export function stripComments(code: string): string {
  let result = code;

  // 1. Remove triple-quoted Python / Ruby / R docstrings (""" or ''')
  result = result.replace(/"""[\s\S]*?"""|'''[\s\S]*?'''/g, "");

  // 2. Remove HTML/XML comments <!-- ... -->
  result = result.replace(/<!--[\s\S]*?-->/g, "");

  // 3. Remove Pascal/ML/F# block comments (* ... *)
  result = result.replace(/\(\*[\s\S]*?\*\)/g, "");

  // 4. Remove C-style block comments /* ... */
  // Use a state-aware approach so that strings are respected
  result = removeCStyleBlockComments(result);

  // 5. Remove single-line comments: //, #, --, %
  //    Skip inside string literals to avoid false positives
  result = removeSingleLineComments(result);

  // 6. Normalize whitespace: collapse blank lines and trim each line
  result = result
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join("\n");

  return result;
}

function removeCStyleBlockComments(code: string): string {
  let out = "";
  let i = 0;
  while (i < code.length) {
    // Check for string start (skip string contents to avoid stripping "/*" inside strings)
    if (code[i] === '"' || code[i] === "'") {
      const quote = code[i];
      out += code[i++];
      while (i < code.length) {
        if (code[i] === "\\" && i + 1 < code.length) {
          out += code[i] + code[i + 1];
          i += 2;
          continue;
        }
        out += code[i];
        if (code[i++] === quote) break;
      }
      continue;
    }

    // Check for /* ... */
    if (code[i] === "/" && code[i + 1] === "*") {
      i += 2; // skip /*
      while (i < code.length) {
        if (code[i] === "*" && code[i + 1] === "/") {
          i += 2; // skip */
          break;
        }
        i++;
      }
      continue;
    }

    out += code[i++];
  }
  return out;
}


function removeSingleLineComments(code: string): string {
  const lines = code.split("\n");
  return lines
    .map((line) => {
      let inString = false;
      let stringChar = "";
      let i = 0;

      while (i < line.length) {
        const ch = line[i];

        // Toggle string state
        if (!inString && (ch === '"' || ch === "'")) {
          inString = true;
          stringChar = ch;
          i++;
          continue;
        }
        if (inString && ch === "\\" && i + 1 < line.length) {
          i += 2; // skip escaped char
          continue;
        }
        if (inString && ch === stringChar) {
          inString = false;
          i++;
          continue;
        }

        if (!inString) {
          // C++/Java/JS/TS: //
          if (ch === "/" && i + 1 < line.length && line[i + 1] === "/") {
            return line.slice(0, i).trimEnd();
          }
          // Python/Shell/Ruby/YAML: # (not shebang on first effective char)
          if (ch === "#") {
            return line.slice(0, i).trimEnd();
          }
          // SQL/Lua/Haskell: --
          if (ch === "-" && i + 1 < line.length && line[i + 1] === "-") {
            return line.slice(0, i).trimEnd();
          }
          // MATLAB/LaTeX: %
          if (ch === "%") {
            return line.slice(0, i).trimEnd();
          }
        }

        i++;
      }
      return line;
    })
    .join("\n");
}

export function hashCode(code: string): string {
  const normalized = stripComments(code);
  return crypto.createHash("sha256").update(normalized).digest("hex");
}
