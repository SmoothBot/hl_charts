function greet(name: string): string {
  return `Hello, ${name}!`;
}

const message = greet("TypeScript");
console.log(message);

export { greet };