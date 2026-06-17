export function getEnv(name: string, defaultValue?: string): string {
  const value = process.env[name];
  if (value === undefined) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getEnvNumber(name: string, defaultValue?: number): number {
  const raw = process.env[name];
  if (raw === undefined) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Missing required environment variable: ${name}`);
  }
  const value = Number(raw);
  if (Number.isNaN(value)) {
    throw new Error(
      `Environment variable ${name} is not a valid number: ${raw}`,
    );
  }
  return value;
}
