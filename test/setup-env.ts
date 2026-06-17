import { config } from 'dotenv';

config({
  path: `.env.${process.env.NODE_ENV ?? 'test'}`,
  override: true,
  quiet: true,
});
