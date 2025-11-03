const patterns = [
  /(\d+)[天日]/, 
/([一二三四五六七八九十百千]+)[天日]/,

// 特定场景匹配  
/(玩|旅行|停留)\s*(\d+)[天日]/,
/(玩|旅行|停留)\s*([一二三四五六七八九十百千]+)[天日]/
];

const testString = "我想去北京玩三天";

let matched = false;
let matchResult = null;

patterns.forEach((pattern, index) => {
  const result = testString.match(pattern);
  if (result) {
    matched = true;
    matchResult = {
      patternIndex: index,
      fullMatch: result[0],
      captured: result[1],
      pattern: pattern.toString()
    };
    console.log(`匹配成功 - 规则${index}: ${pattern.toString()}`);
    console.log(`完整匹配: "${result[0]}", 捕获组: "${result[1]}"`);
  }
});

console.log(`\n"${testString}" ${matched ? "符合" : "不符合"}规则`);