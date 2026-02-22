const content = `
- [ ] task 1
  - [x] task 2
`;
let matchCounter = 0;
const maskedContent = content;
const newContent = content.replace(/^([ \t]*(?:[-*+]|\d+\.)\s+)\[([ xX])\]/gm, (match, prefix, check, offset) => {
    console.log("Matched:", JSON.stringify(match), "prefix:", JSON.stringify(prefix), "check:", JSON.stringify(check));
    if (matchCounter === 1) {
        matchCounter++;
        return `${prefix}[ ]`; // uncheck
    }
    matchCounter++;
    return match;
});
console.log(newContent);
