const fs = require("fs");
const logPath = "c:/Users/Omen/AppData/Roaming/Code/User/workspaceStorage/443cc63e72081c1b4787e03bc035a507/GitHub.copilot-chat/debug-logs/a6c6f4ac-6092-40c9-8f25-f3ce9fae138a";
const logPath2 = logPath + ".log";
let text = "";
try { text = fs.readFileSync(logPath, "utf8"); } catch (e) { text = fs.readFileSync(logPath2, "utf8"); }
const chunks = text.split('<attachment id="AdminDashboard.tsx"');
const lastChunk = chunks[chunks.length - 1];
const target = lastChunk.split('</attachment>')[0];
const content = target.substring(target.indexOf(">") + 1).trim();
fs.writeFileSync("src/components/AdminDashboard.tsx", content);
console.log("Wrote " + content.length + " bytes to AdminDashboard.tsx");
