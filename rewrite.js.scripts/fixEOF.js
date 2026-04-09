import fs from 'fs';

let content = fs.readFileSync('src/components/CognitiveLoadResults.tsx', 'utf-8');

// Clean up trailing divs safely
content = content.replace(/      <\/div>\n\n          <\/div>\n  \);\n};/g, "      </div>\n    </div>\n  );\n};");
content = content.replace(/      <\/div>\n\n      <\/div>\n    <\/div>\n  \);\n};/g, '      </div>\n    </div>\n  );\n};');
content = content.replace(/        <\/div>\n\n      <\/div>\n\n          <\/div>\n  \);\n};/g, '        </div>\n      </div>\n    </div>\n  );\n};');

fs.writeFileSync('src/components/CognitiveLoadResults.tsx', content);
