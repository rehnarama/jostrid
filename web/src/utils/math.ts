export const evaluateExpression = (expression: string): number => {
  // yolo

  if (!/^[0-9+\-*/().\s]+$/.test(expression)) {
    throw new Error("Invalid characters in expression");
  }

  return new Function(`return ${expression.replace(/\D+$/, "")}`)() ?? 0;
};
