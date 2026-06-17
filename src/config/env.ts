export function getEnv(name: string): string {
  const value = process.env[name];
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getEnvNumber(name: string): number {
  const raw = getEnv(name);
  const value = Number(raw);
  if (Number.isNaN(value)) {
    throw new Error(
      `Environment variable ${name} is not a valid number: ${raw}`,
    );
  }
  return value;
}
