import * as Joi from 'joi';

export interface AppConfig {
  NODE_ENV: string;
  APP_NAME: string;
  APP_PORT: number;
  DB_TYPE: 'mysql' | 'sqlite';
  DB_HOST?: string;
  DB_PORT?: number;
  DB_NAME: string;
  DB_USER?: string;
  DB_PASSWORD?: string;
  DB_DEBUG: boolean;
  LOG_LEVEL: string;
  INTERVAL_MS: number;
  POD_NAME: string;
  POD_NAMESPACE: string;
  POD_UID: string;
  POD_IP: string;
}

const requiredForMysql = {
  is: 'mysql',
  then: Joi.required(),
  otherwise: Joi.optional(),
};

export const envSchema = Joi.object<AppConfig>({
  NODE_ENV: Joi.string().default('development'),
  APP_NAME: Joi.string().required(),
  APP_PORT: Joi.number().port().required(),
  DB_TYPE: Joi.string().valid('mysql', 'sqlite').default('sqlite'),
  DB_HOST: Joi.string().when('DB_TYPE', requiredForMysql),
  DB_PORT: Joi.number().port().when('DB_TYPE', requiredForMysql),
  DB_NAME: Joi.string().default('src/database/development'),
  DB_USER: Joi.string().when('DB_TYPE', requiredForMysql),
  DB_PASSWORD: Joi.string().when('DB_TYPE', requiredForMysql),
  DB_DEBUG: Joi.boolean().default(false),
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly')
    .default('info'),
  INTERVAL_MS: Joi.number().positive().default(10000),
  POD_NAME: Joi.string().allow('').default(''),
  POD_NAMESPACE: Joi.string().allow('').default(''),
  POD_UID: Joi.string().allow('').default(''),
  POD_IP: Joi.string().allow('').default(''),
});

export function validateEnv(config: Record<string, unknown>): AppConfig {
  const result = envSchema.validate(config, {
    allowUnknown: true,
    abortEarly: false,
  });
  if (result.error) {
    throw new Error(
      `Invalid environment configuration: ${result.error.message}`,
    );
  }
  return result.value;
}
