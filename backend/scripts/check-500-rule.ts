import { Project, SyntaxKind } from 'ts-morph';
import * as path from 'path';

const MAX_CHARS = 500;
const MAX_CHARS_TEST = 800;

interface Violation {
  file: string;
  name: string;
  line: number;
  chars: number;
  type: string;
}

const violations: Violation[] = [];

const project = new Project({
  tsConfigFilePath: path.join(__dirname, '../tsconfig.json'),
});

function getMaxChars(filePath: string): number {
  if (filePath.includes('.spec.') || filePath.includes('.test.')) {
    return MAX_CHARS_TEST;
  }
  return MAX_CHARS;
}

function checkNode(
  file: string,
  name: string,
  line: number,
  text: string,
  type: string,
  maxChars: number,
) {
  if (text.length > maxChars) {
    violations.push({ file, name, line, chars: text.length, type });
  }
}

project.getSourceFiles('src/**/*.ts').forEach((sourceFile) => {
  const filePath = sourceFile.getFilePath();
  const maxChars = getMaxChars(filePath);

  // 일반 함수 검사
  sourceFile.getFunctions().forEach((fn) => {
    checkNode(
      filePath,
      fn.getName() || 'anonymous',
      fn.getStartLineNumber(),
      fn.getText(),
      'function',
      maxChars,
    );
  });

  // 클래스 메서드 검사
  sourceFile.getClasses().forEach((cls) => {
    cls.getMethods().forEach((method) => {
      checkNode(
        filePath,
        `${cls.getName()}.${method.getName()}`,
        method.getStartLineNumber(),
        method.getText(),
        'method',
        maxChars,
      );
    });
  });

  // 화살표 함수 검사 (변수 할당)
  sourceFile.getVariableDeclarations().forEach((variable) => {
    const init = variable.getInitializer();
    if (init?.getKind() === SyntaxKind.ArrowFunction) {
      checkNode(
        filePath,
        variable.getName(),
        variable.getStartLineNumber(),
        init.getText(),
        'arrow-function',
        maxChars,
      );
    }
  });
});

if (violations.length > 0) {
  console.log(`\n❌ 500자 규칙 위반: ${violations.length}건\n`);
  violations.forEach((v) => {
    console.log(`  [${v.type}] ${v.name}`);
    console.log(`  파일: ${v.file}:${v.line}`);
    console.log(`  길이: ${v.chars}자 (초과: ${v.chars - MAX_CHARS}자)\n`);
  });
  process.exit(1);
} else {
  console.log('✅ 모든 함수/메서드가 500자 이내입니다!');
}
